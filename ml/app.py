import os
import re
import pickle
import logging
import psycopg2
import pandas as pd
import threading
import time
from flask import Flask, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors
from functools import lru_cache, wraps
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import nltk
from psycopg2.pool import ThreadedConnectionPool
from contextlib import contextmanager
from threading import Lock
import traceback
from werkzeug.exceptions import HTTPException


try:
    nltk.download('punkt_tab', quiet=True)
except Exception as e:
    
    pass


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("job_recommender.log", mode='a')
    ]
)
logger = logging.getLogger(__name__)


MODEL_CACHE_TTL = timedelta(hours=int(os.environ.get('MODEL_CACHE_TTL_HOURS', 24)))
MODEL_DIR = os.environ.get('MODEL_DIR', "models")
DB_POOL_MIN = int(os.environ.get('DB_POOL_MIN', 1))
DB_POOL_MAX = int(os.environ.get('DB_POOL_MAX', 10))
DB_CONNECT_RETRIES = int(os.environ.get('DB_CONNECT_RETRIES', 3))
DB_RETRY_DELAY = int(os.environ.get('DB_RETRY_DELAY', 2))  
REQUEST_TIMEOUT = int(os.environ.get('REQUEST_TIMEOUT', 30))  
MAX_WORKER_THREADS = int(os.environ.get('MAX_WORKER_THREADS', 4))


os.makedirs(MODEL_DIR, exist_ok=True)


VECTORIZER_PATH = os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl")
KNN_MODEL_PATH = os.path.join(MODEL_DIR, "knn_model.pkl")
MODEL_TIMESTAMP_PATH = os.path.join(MODEL_DIR, "model_timestamp.txt")
SKILLS_PATH = os.path.join(MODEL_DIR, "skills_data.pkl")



class CircuitBreaker:
    def __init__(self, max_failures=3, reset_timeout=60):
        self.max_failures = max_failures
        self.reset_timeout = reset_timeout
        self.failures = 0
        self.state = "CLOSED"  
        self.last_failure_time = None
        self.lock = Lock()

    def __call__(self, func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            with self.lock:
                if self.state == "OPEN":
                    if self.last_failure_time and (datetime.now() - self.last_failure_time).total_seconds() > self.reset_timeout:
                        logger.info("Circuit breaker half-open, allowing test request")
                        self.state = "HALF_OPEN"
                    else:
                        logger.warning("Circuit breaker open, rejecting request")
                        raise Exception("Service unavailable - circuit breaker open")

            try:
                result = func(*args, **kwargs)

                if self.state == "HALF_OPEN":
                    with self.lock:
                        logger.info("Test request successful, closing circuit breaker")
                        self.state = "CLOSED"
                        self.failures = 0

                return result

            except Exception as e:
                with self.lock:
                    self.failures += 1
                    self.last_failure_time = datetime.now()

                    if self.state == "CLOSED" and self.failures >= self.max_failures:
                        logger.warning(f"Circuit breaker opening after {self.failures} failures")
                        self.state = "OPEN"

                    if self.state == "HALF_OPEN":
                        logger.warning("Test request failed, circuit breaker returning to open state")
                        self.state = "OPEN"

                raise

        return wrapper



def timeout(seconds):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = [None]
            error = [None]

            def target():
                try:
                    result[0] = func(*args, **kwargs)
                except Exception as e:
                    error[0] = e

            thread = threading.Thread(target=target)
            thread.daemon = True
            thread.start()
            thread.join(seconds)

            if thread.is_alive():
                raise TimeoutError(f"Function {func.__name__} timed out after {seconds} seconds")

            if error[0]:
                raise error[0]

            return result[0]
        return wrapper
    return decorator


class JobRecommendationSystem:
    def __init__(self):
        
        self.conn_str = os.environ.get(
            "DATABASE_URL",
            "postgres://postgres:Danik-0509@db-talentbridge-instance1.chcg804uainf.ap-south-1.rds.amazonaws.com/talentBridge_db"
        )

        self.vectorizer = None
        self.knn_model = None
        self.vacancies_df = None
        self.skills_index = defaultdict(set)  
        self.unique_skills = set()

        
        self.pool = None
        self.pool_lock = Lock()

        
        self.model_init_lock = Lock()

        
        self.training_in_progress = False

        
        self._initialize_db_pool()
        self._safe_initialize_models()

    def _initialize_db_pool(self):
        """Initialize database connection pool with retries"""
        retry_count = 0
        last_exception = None

        while retry_count < DB_CONNECT_RETRIES:
            try:
                logger.info(f"Initializing DB connection pool (attempt {retry_count+1})")
                self.pool = ThreadedConnectionPool(
                    DB_POOL_MIN,
                    DB_POOL_MAX,
                    self.conn_str
                )
                logger.info("DB connection pool initialized successfully")
                return
            except Exception as e:
                last_exception = e
                retry_count += 1
                logger.error(f"Failed to initialize DB pool (attempt {retry_count}): {e}")
                time.sleep(DB_RETRY_DELAY)

        logger.critical(f"Could not initialize DB connection pool after {DB_CONNECT_RETRIES} attempts")
        

    @contextmanager
    def get_db_connection(self):
        """Get a connection from the pool with error handling and retry logic"""
        conn = None
        try:
            
            if not self.pool:
                with self.pool_lock:
                    if not self.pool:  
                        try:
                            logger.warning("No connection pool, creating direct connection")
                            conn = psycopg2.connect(self.conn_str)
                            yield conn
                            return
                        except Exception as e:
                            logger.error(f"Failed to create direct database connection: {e}")
                            raise

            
            retry_count = 0
            while retry_count < DB_CONNECT_RETRIES:
                try:
                    conn = self.pool.getconn()
                    yield conn
                    return
                except Exception as e:
                    retry_count += 1
                    logger.error(f"Error getting connection from pool (attempt {retry_count}): {e}")
                    time.sleep(DB_RETRY_DELAY)

            raise Exception(f"Failed to get database connection after {DB_CONNECT_RETRIES} attempts")

        except Exception as e:
            logger.error(f"Database connection error: {e}")
            raise
        finally:
            
            if conn and self.pool:
                try:
                    self.pool.putconn(conn)
                except Exception as e:
                    logger.error(f"Error returning connection to pool: {e}")
                    try:
                        
                        conn.close()
                    except:
                        pass

    def _safe_initialize_models(self):
        """Thread-safe model initialization with error handling"""
        try:
            with self.model_init_lock:
                if not self.vectorizer or not self.knn_model:
                    self.initialize_models()
        except Exception as e:
            logger.error(f"Error in safe model initialization: {e}")
            

    def preprocess_text(self, text):
        """Improved text preprocessing with error handling"""
        try:
            if not isinstance(text, str):
                return ""

            
            text = text.lower()
            
            text = re.sub(r'[^a-zа-я0-9#+\s]', ' ', text)
            
            text = re.sub(r'\s+', ' ', text)
            return text.strip()
        except Exception as e:
            logger.warning(f"Error in text preprocessing: {e}")
            
            return ""

    @CircuitBreaker(max_failures=5, reset_timeout=300)
    def load_vacancies_from_db(self):
        """Load vacancies from database with circuit breaker protection"""
        logger.info("Loading vacancies from database...")
        try:
            with self.get_db_connection() as conn:
                
                query = """
                SELECT 
                  v.id, 
                  COALESCE(string_agg(s.name, ' ' ORDER BY s.name), '') as key_skills
                FROM vacancies v
                LEFT JOIN vacancy_skills vs ON v.id = vs.vacancy_id
                LEFT JOIN skills s ON vs.skill_id = s.id
                GROUP BY v.id;
                """
                
                with conn.cursor(name='fetch_vacancies') as cursor:
                    cursor.itersize = 1000  
                    cursor.execute(query)

                    
                    chunks = []
                    while True:
                        records = cursor.fetchmany(1000)
                        if not records:
                            break
                        chunks.append(pd.DataFrame(records, columns=["id", "key_skills"]))

                    
                    if chunks:
                        df = pd.concat(chunks, ignore_index=True)
                    else:
                        df = pd.DataFrame(columns=["id", "key_skills"])

            logger.info(f"Loaded {len(df)} vacancies")
            return df
        except Exception as e:
            logger.error(f"Error loading vacancies: {e}")
            
            return pd.DataFrame(columns=["id", "key_skills"])

    def normalize_skills(self, skills_text):
        """Normalize and split skills text into individual skills with error handling"""
        try:
            
            text = self.preprocess_text(skills_text)
            if not text:
                return []

            
            compound_techs = [
                
                'spring boot', 'machine learning', 'deep learning',
                'big data', 'data science', 'computer vision', 'natural language',
                'qa test', 'test case', 'data engineering', 'ci cd', 'unit test',
                
                'ручное тестирование', 'автоматизированное тестирование',
                'функциональное тестирование', 'интеграционное тестирование',
                'регрессионное тестирование', 'кроссбраузерное тестирование',
                'нагрузочное тестирование', 'qa test case', 'smoke тестирование',
                'ручное тестирование по', 'vanessa automation',
                'kafka kubernetes', 'составление кейсов', 'техническая документация'
            ]

            
            if ',' in text:
                comma_parts = [s.strip() for s in text.split(',')]
                skills = []

                
                for part in comma_parts:
                    if not part:
                        continue

                    
                    compound_found = False
                    for tech in compound_techs:
                        if tech in part:
                            skills.append(tech)
                            
                            part = part.replace(tech, ' ')
                            compound_found = True

                    
                    remaining_words = [w.strip() for w in part.split() if w.strip()]
                    skills.extend(remaining_words)
            else:
                
                skills = []
                remaining_text = text

                
                sorted_techs = sorted(compound_techs, key=len, reverse=True)
                for tech in sorted_techs:
                    if tech in remaining_text:
                        
                        skills.append(tech)
                        
                        remaining_text = remaining_text.replace(tech, ' ')

                
                words = [w.strip() for w in remaining_text.split() if w.strip()]
                skills.extend(words)

            
            result = []
            for skill in skills:
                if skill and skill not in result:
                    result.append(skill)

            return result
        except Exception as e:
            logger.warning(f"Error in skill normalization: {e}")
            
            return []

    def extract_skills(self, text):
        """Extract skills from text with normalization and error handling"""
        try:
            normalized_skills = self.normalize_skills(text)
            if not normalized_skills:
                return set()

            
            
            result_skills = []
            for skill in normalized_skills:
                
                if skill in self.unique_skills:
                    result_skills.append(skill)
                else:
                    
                    for unique_skill in self.unique_skills:
                        words = skill.split()
                        
                        if len(words) == 1 and skill in unique_skill.split():
                            result_skills.append(skill)
                            break
                    else:
                        
                        result_skills.append(skill)

            return set(result_skills)
        except Exception as e:
            logger.warning(f"Error extracting skills: {e}")
            
            return set()

    def _safe_pickle_dump(self, obj, path):
        """Safely save object to disk with temporary file approach"""
        try:
            
            temp_path = f"{path}.tmp"
            with open(temp_path, "wb") as f:
                pickle.dump(obj, f)

            
            os.replace(temp_path, path)
            return True
        except Exception as e:
            logger.error(f"Error saving to {path}: {e}")
            return False

    def _safe_pickle_load(self, path, default=None):
        """Safely load object from disk with error handling"""
        try:
            if os.path.exists(path):
                with open(path, "rb") as f:
                    return pickle.load(f)
            return default
        except Exception as e:
            logger.error(f"Error loading from {path}: {e}")
            return default

    def train_models(self, df):
        """Train recommendation models with improved parameters and error handling"""
        logger.info("Training recommendation models...")

        
        self.training_in_progress = True

        try:
            
            df["key_skills"] = df["key_skills"].fillna("").apply(self.preprocess_text)

            
            all_skills = []
            normalized_skills_texts = []

            for skills_text in df["key_skills"]:
                skills = self.normalize_skills(skills_text)
                all_skills.extend(skills)
                
                normalized_skills_texts.append(" ".join(skills))

            
            self.unique_skills = set(all_skills)
            logger.info(f"Collected {len(self.unique_skills)} unique skills")

            
            sample_skills = list(self.unique_skills)[:20] if len(self.unique_skills) > 20 else list(self.unique_skills)
            logger.info(f"Sample skills: {sample_skills}")

            
            self._safe_pickle_dump(self.unique_skills, SKILLS_PATH)

            
            processed_skills = normalized_skills_texts

            
            vectorizer = TfidfVectorizer(
                max_features=3000,  
                ngram_range=(1, 3),  
                min_df=1,  
                analyzer='word',
                token_pattern=r'(?u)\b[\w\+\#]+\b'  
            )
            X = vectorizer.fit_transform(processed_skills)

            
            knn = NearestNeighbors(
                n_neighbors=min(20, X.shape[0]),  
                metric="cosine",
                algorithm='auto',
                n_jobs=-1
            )
            knn.fit(X)

            
            models_saved = True
            models_saved &= self._safe_pickle_dump(vectorizer, VECTORIZER_PATH)
            models_saved &= self._safe_pickle_dump(knn, KNN_MODEL_PATH)

            
            if models_saved:
                with open(MODEL_TIMESTAMP_PATH, "w") as f:
                    f.write(datetime.now().isoformat())

            logger.info("Models trained successfully")
            return vectorizer, knn
        except Exception as e:
            logger.error(f"Error training models: {e}")
            
            if self.vectorizer and self.knn_model:
                logger.info("Using existing models due to training error")
                return self.vectorizer, self.knn_model
            raise
        finally:
            
            self.training_in_progress = False

    def models_need_update(self):
        """Check if models need updating with expanded checks"""
        try:
            
            if not os.path.exists(VECTORIZER_PATH) or not os.path.exists(KNN_MODEL_PATH) or not os.path.exists(SKILLS_PATH):
                return True

            
            if os.path.exists(MODEL_TIMESTAMP_PATH):
                try:
                    with open(MODEL_TIMESTAMP_PATH, "r") as f:
                        timestamp_str = f.read().strip()
                        timestamp = datetime.fromisoformat(timestamp_str)
                        return datetime.now() - timestamp > MODEL_CACHE_TTL
                except (ValueError, IOError) as e:
                    logger.warning(f"Error reading model timestamp: {e}")
                    return True

            return True
        except Exception as e:
            logger.error(f"Error checking model update status: {e}")
            return False  

    def initialize_models(self):
        """Initialize or load models with error handling"""
        try:
            if self.training_in_progress:
                logger.info("Model training already in progress, waiting...")
                
                time.sleep(1)

            if self.models_need_update():
                logger.info("Models need update, retraining...")
                
                self.vacancies_df = self.load_vacancies_from_db()
                self.vectorizer, self.knn_model = self.train_models(self.vacancies_df)
            else:
                logger.info("Loading models from cache...")
                
                self.vectorizer = self._safe_pickle_load(VECTORIZER_PATH)
                self.knn_model = self._safe_pickle_load(KNN_MODEL_PATH)
                self.unique_skills = self._safe_pickle_load(SKILLS_PATH, set())

                
                if self.vacancies_df is None or self.vacancies_df.empty:
                    self.vacancies_df = self.load_vacancies_from_db()

            
            if not self.vectorizer or not self.knn_model:
                logger.error("Failed to load or train models")
                raise ValueError("Models initialization failed")

            
            self.skills_index = defaultdict(set)
            for _, row in self.vacancies_df.iterrows():
                vacancy_id = row['id']
                skills_text = row['key_skills']

                
                skills = self.extract_skills(skills_text)

                
                self.skills_index[vacancy_id] = skills

            logger.info(f"Initialized skills index for {len(self.skills_index)} vacancies")

        except Exception as e:
            logger.error(f"Error initializing models: {e}")
            
            logger.error(traceback.format_exc())

    def parse_skills(self, skills_input):
        """Parse input skills in various formats with error handling"""
        try:
            if isinstance(skills_input, list):
                
                return " ".join(str(skill).strip() for skill in skills_input if skill)
            elif isinstance(skills_input, str):
                
                return skills_input
            return str(skills_input)
        except Exception as e:
            logger.warning(f"Error parsing skills input: {e}")
            
            return ""

    @timeout(REQUEST_TIMEOUT)
    def recommend_jobs(self, student_skills, top_n=5):
        """Recommend jobs based on student skills with timeout protection"""
        start_time = datetime.now()
        try:
            logger.info(f"Processing recommendation request for skills: {student_skills[:100]}...")

            
            if not self.vectorizer or not self.knn_model:
                logger.warning("Models not initialized, attempting to initialize")
                self._safe_initialize_models()

                
                if not self.vectorizer or not self.knn_model:
                    logger.error("Models unavailable, cannot process recommendation")
                    return []

            
            skills_text = self.parse_skills(student_skills)

            
            student_skills_list = self.normalize_skills(skills_text)
            student_skills_set = set(student_skills_list)
            logger.info(f"Extracted student skills: {student_skills_set}")

            if not student_skills_set:
                logger.warning("Empty skills provided, returning empty recommendations")
                return []

            
            if self.vacancies_df is None or self.vacancies_df.empty:
                logger.warning("No vacancies data available")
                return []

            
            skills_for_vectorization = " ".join(student_skills_list)
            logger.info(f"Skills for vectorization: {skills_for_vectorization}")

            
            student_vector = self.vectorizer.transform([skills_for_vectorization])

            
            n_neighbors = min(top_n * 5, len(self.vacancies_df), self.knn_model.n_neighbors)
            distances, indices = self.knn_model.kneighbors(student_vector, n_neighbors=n_neighbors)

            
            recommendations = []
            for idx, dist in zip(indices[0], distances[0]):
                try:
                    vac_id = int(self.vacancies_df.iloc[idx]["id"])
                    sim_score = float((1 - dist).round(4))

                    
                    if sim_score < 0.01:
                        continue

                    
                    vacancy_skills = self.skills_index.get(vac_id, set())

                    if not vacancy_skills:
                        continue

                    
                    matching_skills = []
                    missing_skills = []

                    
                    for vac_skill in vacancy_skills:
                        
                        if vac_skill in student_skills_set:
                            matching_skills.append(vac_skill)
                            continue

                        
                        vac_skill_words = vac_skill.split()

                        
                        if len(vac_skill_words) > 1:
                            
                            
                            

                            
                            partial_match_found = False
                            for student_skill in student_skills_set:
                                
                                if student_skill in vac_skill and len(student_skill) > 3:  
                                    matching_skills.append(vac_skill)
                                    partial_match_found = True
                                    break

                            if partial_match_found:
                                continue

                        
                        missing_skills.append(vac_skill)

                    
                    matching_skills = sorted(list(set(matching_skills)))
                    missing_skills = sorted(list(set(missing_skills)))

                    
                    total_skills = len(vacancy_skills)
                    skills_matched = len(matching_skills)

                    match_percentage = 0
                    if total_skills > 0:
                        match_percentage = round(skills_matched / total_skills * 100)

                    logger.info(f"Vacancy {vac_id} - Found matches: {matching_skills}")

                    
                    recommendations.append({
                        "vacancy_id": vac_id,
                        "similarity_score": sim_score,
                        "match_percentage": match_percentage,
                        "missing_skills": missing_skills,
                        "matching_skills": matching_skills,
                        "total_skills_required": total_skills,
                        "skills_matched": skills_matched
                    })
                except Exception as e:
                    
                    logger.warning(f"Error processing vacancy at index {idx}: {e}")
                    continue

            
            recommendations.sort(key=lambda x: (x["match_percentage"], x["similarity_score"]), reverse=True)

            
            recommendations = recommendations[:top_n]

            logger.info(f"Recommendation completed in {(datetime.now() - start_time).total_seconds():.2f} seconds")
            return recommendations
        except Exception as e:
            logger.error(f"Error in recommendation process: {e}")
            logger.error(traceback.format_exc())
            
            return []



worker_pool = []

def background_task(func, *args, **kwargs):
    """Run a function in a background thread from the pool"""
    if len(worker_pool) < MAX_WORKER_THREADS:
        thread = threading.Thread(target=func, args=args, kwargs=kwargs)
        thread.daemon = True
        worker_pool.append(thread)
        thread.start()
        return True
    return False


app = Flask(__name__)


recommendation_system = None

def get_recommendation_system():
    """Get or create recommendation system singleton with lazy initialization"""
    global recommendation_system
    if recommendation_system is None:
        recommendation_system = JobRecommendationSystem()
    return recommendation_system


@app.errorhandler(Exception)
def handle_exception(e):
    """Handle all unhandled exceptions"""
    logger.error(f"Unhandled exception: {str(e)}")
    logger.error(traceback.format_exc())

    if isinstance(e, HTTPException):
        return jsonify({"error": str(e)}), e.code

    return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(TimeoutError)
def handle_timeout_error(e):
    """Handle timeout errors"""
    logger.error(f"Request timed out: {str(e)}")
    return jsonify({"error": "Request timed out", "message": str(e)}), 408

@app.route("/", methods=["GET"])
def root():
    """Root endpoint with basic info"""
    return jsonify({
        "service": "Job Recommendation API",
        "status": "online",
        "version": "2.0.0",
        "endpoints": {
            "/": "This information",
            "/health": "Health check",
            "/metrics": "Performance metrics",
            "/recommend": "Get job recommendations (POST)"
        }
    })

@app.route("/recommend", methods=["POST"])
def recommend():
    """Recommendation endpoint with improved error handling"""
    start_time = datetime.now()
    try:
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No input data provided"}), 400

        student_skills = data.get("student_skills", "")
        top_n = int(data.get("top_n", 5))

        
        if not student_skills:
            return jsonify({"error": "No skills provided"}), 400

        
        top_n = max(1, min(top_n, 20))

        
        rs = get_recommendation_system()
        recommendations = rs.recommend_jobs(student_skills, top_n)

        
        processing_time = (datetime.now() - start_time).total_seconds()
        return jsonify({
            "recommendations": recommendations,
            "processing_time_seconds": processing_time,
            "status": "success"
        })
    except TimeoutError as e:
        logger.error(f"Recommendation request timed out: {e}")
        return jsonify({"error": "Request timed out", "message": str(e)}), 408
    except Exception as e:
        logger.error(f"API error in recommendation: {e}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    
    recommendation_system = get_recommendation_system()

    
    app.run(host='0.0.0.0', port=5000, debug=False)