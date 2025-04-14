import os
import re
import pickle
import logging
import psycopg2
import pandas as pd
from flask import Flask, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors
from functools import lru_cache
from datetime import datetime, timedelta

# Настройка логирования
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Конфигурация
MODEL_CACHE_TTL = timedelta(hours=24)  # Время жизни кэша моделей
MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

# Пути к моделям
VECTORIZER_PATH = os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl")
KNN_MODEL_PATH = os.path.join(MODEL_DIR, "knn_model.pkl")
MODEL_TIMESTAMP_PATH = os.path.join(MODEL_DIR, "model_timestamp.txt")

class JobRecommendationSystem:
    def __init__(self):
        self.conn_str = "postgresql://careertrack_f38p_user:ib08LVqEQeueQCKGw60SiOHprXg0TQIG@dpg-cvc4okaj1k6c73e50ov0-a.oregon-postgres.render.com/careertrack_f38p"
        self.vectorizer = None
        self.knn_model = None
        self.vacancies_df = None
        self.initialize_models()

    def preprocess_text(self, text):
        """Улучшенная предобработка текста с обработкой исключений"""
        if not isinstance(text, str):
            return ""
        # Преобразуем в нижний регистр
        text = text.lower()
        # Оставляем только буквы, цифры, #, +, и пробелы
        text = re.sub(r'[^a-zа-я0-9#+\s]', ' ', text)
        # Заменяем множественные пробелы на одиночные
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def get_db_connection(self):
        """Создаёт подключение к базе данных с обработкой ошибок"""
        try:
            if not self.conn_str:
                raise ValueError("DATABASE_URL not set")
            return psycopg2.connect(self.conn_str)
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            raise

    @lru_cache(maxsize=1)
    def load_vacancies_from_db(self):
        """Загружает вакансии из базы с кэшированием результата"""
        logger.info("Loading vacancies from database...")
        try:
            conn = self.get_db_connection()
            # Расширенный запрос для получения дополнительной информации о вакансиях
            query = """
            SELECT 
              v.id, 
              COALESCE(string_agg(s.name, ' ' ORDER BY s.name), '') as key_skills
            FROM vacancies v
            LEFT JOIN vacancy_skills vs ON v.id = vs.vacancy_id
            LEFT JOIN skills s ON vs.skill_id = s.id
            GROUP BY v.id;
            """
            df = pd.read_sql(query, conn)
            conn.close()
            logger.info(f"Loaded {len(df)} vacancies")
            return df
        except Exception as e:
            logger.error(f"Error loading vacancies: {e}")
            return pd.DataFrame(columns=["id", "key_skills"])

    def train_models(self, df):
        """Обучает модели с улучшенными параметрами"""
        logger.info("Training recommendation models...")
        try:
            # Обработка текста навыков
            df["key_skills"] = df["key_skills"].fillna("").apply(self.preprocess_text)

            # Улучшенный векторизатор с учетом N-грамм и ограничением признаков
            vectorizer = TfidfVectorizer(
                max_features=1000,
                ngram_range=(1, 2),  # Учитываем униграммы и биграммы
                min_df=2  # Минимальная частота документов
            )
            X = vectorizer.fit_transform(df["key_skills"])

            # Улучшенная модель KNN с оптимизированными параметрами
            knn = NearestNeighbors(
                n_neighbors=min(10, X.shape[0]),  # Увеличиваем число соседей для лучшего ранжирования
                metric="cosine",
                algorithm='auto',  # Автоматический выбор оптимального алгоритма
                n_jobs=-1  # Параллельные вычисления
            )
            knn.fit(X)

            # Сохраняем модели
            with open(VECTORIZER_PATH, "wb") as f:
                pickle.dump(vectorizer, f)
            with open(KNN_MODEL_PATH, "wb") as f:
                pickle.dump(knn, f)

            # Сохраняем временную метку создания модели
            with open(MODEL_TIMESTAMP_PATH, "w") as f:
                f.write(datetime.now().isoformat())

            logger.info("Models trained successfully")
            return vectorizer, knn
        except Exception as e:
            logger.error(f"Error training models: {e}")
            raise

    def models_need_update(self):
        """Проверяет, нужно ли обновить модели"""
        if not os.path.exists(VECTORIZER_PATH) or not os.path.exists(KNN_MODEL_PATH):
            return True

        if os.path.exists(MODEL_TIMESTAMP_PATH):
            with open(MODEL_TIMESTAMP_PATH, "r") as f:
                timestamp_str = f.read().strip()
                timestamp = datetime.fromisoformat(timestamp_str)
                return datetime.now() - timestamp > MODEL_CACHE_TTL

        return True

    def initialize_models(self):
        """Инициализирует или загружает модели"""
        try:
            if self.models_need_update():
                logger.info("Models need update, retraining...")
                self.vacancies_df = self.load_vacancies_from_db()
                self.vectorizer, self.knn_model = self.train_models(self.vacancies_df)
            else:
                logger.info("Loading models from cache...")
                with open(VECTORIZER_PATH, "rb") as f:
                    self.vectorizer = pickle.load(f)
                with open(KNN_MODEL_PATH, "rb") as f:
                    self.knn_model = pickle.load(f)
                self.vacancies_df = self.load_vacancies_from_db()
        except Exception as e:
            logger.error(f"Error initializing models: {e}")
            raise

    def parse_skills(self, skills_text):
        """Парсинг входных навыков с обработкой различных форматов"""
        # Обработка списка навыков в различных форматах
        if isinstance(skills_text, list):
            return " ".join(str(skill).strip() for skill in skills_text)
        elif isinstance(skills_text, str):
            return " ".join(skill.strip() for skill in skills_text.split(","))
        return str(skills_text)

    def recommend_jobs(self, student_skills, top_n=5):
        try:
            start_time = datetime.now()
            logger.info(f"Processing recommendation request for skills: {student_skills[:100]}...")

        # Обработка входных навыков
            skills_text = self.parse_skills(student_skills)
            processed_skills = set(self.preprocess_text(skills_text).split())

            logger.info(f"Processed skills: {processed_skills}")  # Отладочный лог

            if not processed_skills:
                logger.warning("Empty skills provided, returning empty recommendations")
                return []

        # Проверяем наличие вакансий
            if self.vacancies_df is None or self.vacancies_df.empty:
                logg
                er.warning("No vacancies data available")
                return []

        # Векторизация навыков пользователя
            student_vector = self.vectorizer.transform([" ".join(processed_skills)])

        # Получение ближайших соседей с учетом минимального количества
            n_neighbors = min(top_n, len(self.vacancies_df), self.knn_model.n_neighbors)
            distances, indices = self.knn_model.kneighbors(student_vector, n_neighbors=n_neighbors)

        # Формирование рекомендаций в расширенном формате
            recommendations = []
            for idx, dist in zip(indices[0], distances[0]):
                row = self.vacancies_df.iloc[idx]
                vac_id = int(row["id"])
                sim_score = float((1 - dist).round(4))  # Повышаем точность

            # Если сходство слишком низкое, пропускаем
                if sim_score < 0.1:
                    continue

            # Важно: vacancy_skills должны быть предобработаны так же, как и processed_skills
                vacancy_skills_text = row["key_skills"]
                vacancy_skills = set(self.preprocess_text(vacancy_skills_text).split())

            # Теперь сравнение будет корректным
                matching_skills = list(vacancy_skills.intersection(processed_skills))
                missing = list(vacancy_skills - processed_skills)

            # Вычисляем процент соответствия на основе имеющихся навыков
                match_percentage = 0
                if vacancy_skills:
                    match_percentage = round(len(matching_skills) / len(vacancy_skills) * 100)

                logger.info(f"Vacancy {vac_id} - Found matches: {matching_skills}")  # Отладка

            # Создаем объект рекомендации с расширенной информацией
                recommendations.append({
                    "vacancy_id": vac_id,
                    "similarity_score": sim_score,
                    "match_percentage": match_percentage,  # Процент соответствия
                    "missing_skills": missing,
                    "matching_skills": matching_skills,
                    "total_skills_required": len(vacancy_skills),
                    "skills_matched": len(matching_skills)
                })

        # Сортируем по проценту соответствия
            recommendations.sort(key=lambda x: x["match_percentage"], reverse=True)

            logger.info(f"Recommendation completed in {(datetime.now() - start_time).total_seconds():.2f} seconds")
            return recommendations
        except Exception as e:
            logger.error(f"Error in recommendation process: {e}")
            return []


# Инициализация Flask и системы рекомендаций
app = Flask(__name__)
recommendation_system = JobRecommendationSystem()  # Инициализируем сразу

@app.route("/recommend", methods=["POST"])
def recommend():
    try:
        # Получение входных данных
        data = request.get_json()
        if not data:
            return jsonify({"error": "No input data provided"}), 400

        student_skills = data.get("student_skills", "")
        top_n = data.get("top_n", 5)  # Добавляем параметр для количества рекомендаций

        # Проверка входных данных
        if not student_skills:
            return jsonify({"error": "No skills provided"}), 400

        # Получение рекомендаций в расширенном формате
        recommendations = recommendation_system.recommend_jobs(student_skills, top_n)

        # Возвращаем в расширенном формате
        return jsonify({
            "recommendations": recommendations,
        })
    except Exception as e:
        logger.error(f"API error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)