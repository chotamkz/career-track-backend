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
from collections import Counter
import nltk
nltk.download('punkt_tab', quiet=True)
from nltk.util import ngrams
from nltk.tokenize import word_tokenize

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
NGRAMS_PATH = os.path.join(MODEL_DIR, "ngrams_data.pkl")


class JobRecommendationSystem:
    def __init__(self):
        self.conn_str = "postgres://postgres:Danik-0509@db-talentbridge-instance1.chcg804uainf.ap-south-1.rds.amazonaws.com/talentBridge_db"
        self.vectorizer = None
        self.knn_model = None
        self.vacancies_df = None
        self.common_ngrams = None
        self.skills_index = {}  # Индекс навыков для быстрого доступа
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

    def extract_common_ngrams(self, texts, min_count=2):
        """Извлекает часто встречающиеся n-граммы из корпуса текстов"""
        all_ngrams = Counter()

        for text in texts:
            # Использование безопасной токенизации
            try:
                words = word_tokenize(self.preprocess_text(text))
                # Извлекаем биграммы и триграммы
                for n in range(2, 4):  # Биграммы и триграммы
                    text_ngrams = list(ngrams(words, n))
                    all_ngrams.update([" ".join(gram) for gram in text_ngrams])
            except Exception as e:
                logger.warning(f"Error tokenizing text: {e}")

        # Фильтруем по частоте
        common_ngrams = {gram for gram, count in all_ngrams.items()
                         if count >= min_count}

        logger.info(f"Extracted {len(common_ngrams)} common n-grams")
        return common_ngrams

    def train_models(self, df):
        """Обучает модели с улучшенными параметрами"""
        logger.info("Training recommendation models...")
        try:
            # Обработка текста навыков
            df["key_skills"] = df["key_skills"].fillna("").apply(self.preprocess_text)

            # Извлечение часто встречающихся n-грамм
            self.common_ngrams = self.extract_common_ngrams(df["key_skills"])

            # Сохраняем n-граммы
            with open(NGRAMS_PATH, "wb") as f:
                pickle.dump(self.common_ngrams, f)

            # Улучшенный векторизатор с учетом N-грамм и ограничением признаков
            vectorizer = TfidfVectorizer(
                max_features=1000,
                ngram_range=(1, 3),  # Учитываем униграммы, биграммы и триграммы
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
        if not os.path.exists(VECTORIZER_PATH) or not os.path.exists(KNN_MODEL_PATH) or not os.path.exists(NGRAMS_PATH):
            return True

        if os.path.exists(MODEL_TIMESTAMP_PATH):
            with open(MODEL_TIMESTAMP_PATH, "r") as f:
                timestamp_str = f.read().strip()
                timestamp = datetime.fromisoformat(timestamp_str)
                return datetime.now() - timestamp > MODEL_CACHE_TTL

        return True

    def extract_skills_from_text(self, text):
        """Извлекает навыки из текста, учитывая n-граммы"""
        if not text:
            return set()

        text = self.preprocess_text(text)

        try:
            words = word_tokenize(text)
        except Exception as e:
            logger.warning(f"Tokenization error: {e}, falling back to simple split")
            words = text.split()

        # Получаем все возможные n-граммы из текста
        extracted_skills = set()

        # Сначала проверяем более длинные n-граммы (триграммы, затем биграммы)
        for n in range(3, 1, -1):
            text_ngrams = list(ngrams(words, n))
            for gram in text_ngrams:
                gram_text = " ".join(gram)
                if gram_text in self.common_ngrams:
                    extracted_skills.add(gram_text)
                    # Удаляем слова, входящие в найденную n-грамму
                    for word in gram:
                        if word in words:
                            words.remove(word)

        # Добавляем оставшиеся отдельные слова
        extracted_skills.update(words)

        return extracted_skills

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
                with open(NGRAMS_PATH, "rb") as f:
                    self.common_ngrams = pickle.load(f)
                self.vacancies_df = self.load_vacancies_from_db()

            # Создаем структуры данных для каждой вакансии
            for _, row in self.vacancies_df.iterrows():
                vacancy_id = row['id']
                skills_text = row['key_skills']

                # Извлекаем навыки для вакансии
                skills = self.extract_skills_from_text(skills_text)

                # Сохраняем навыки в индексе
                self.skills_index[vacancy_id] = skills

            logger.info(f"Initialized skills index for {len(self.skills_index)} vacancies")

        except Exception as e:
            logger.error(f"Error initializing models: {e}")
            raise

    def extract_skills_list(self, skills_text):
        """Извлекает список навыков из текста с улучшенной обработкой"""
        if isinstance(skills_text, list):
            # Если уже список, обрабатываем каждый элемент
            return [str(skill).strip() for skill in skills_text]
        elif isinstance(skills_text, str):
            # Если строка, разделяем по запятым
            return [skill.strip() for skill in skills_text.split(',')]
        return []

    def parse_skills(self, skills_text):
        """Парсинг входных навыков с обработкой различных форматов"""
        # Обработка списка навыков в различных форматах
        if isinstance(skills_text, list):
            return " ".join(str(skill).strip() for skill in skills_text)
        elif isinstance(skills_text, str):
            return " ".join(skill.strip() for skill in skills_text.split(","))
        return str(skills_text)

    def recommend_jobs(self, student_skills, top_n=5):
        """Рекомендует вакансии на основе навыков студента"""
        try:
            start_time = datetime.now()
            logger.info(f"Processing recommendation request for skills: {student_skills[:100]}...")

            # Обработка входных навыков
            skills_text = self.parse_skills(student_skills)

            # Извлекаем навыки из текста запроса
            student_skills_set = self.extract_skills_from_text(skills_text)
            logger.info(f"Extracted student skills: {student_skills_set}")

            if not student_skills_set:
                logger.warning("Empty skills provided, returning empty recommendations")
                return []

            # Проверяем наличие вакансий
            if self.vacancies_df is None or self.vacancies_df.empty:
                logger.warning("No vacancies data available")
                return []

            # Векторизация навыков пользователя
            student_vector = self.vectorizer.transform([skills_text])

            # Получение ближайших соседей с учетом минимального количества
            n_neighbors = min(top_n * 2, len(self.vacancies_df), self.knn_model.n_neighbors)
            distances, indices = self.knn_model.kneighbors(student_vector, n_neighbors=n_neighbors)

            # Формирование рекомендаций
            recommendations = []
            for idx, dist in zip(indices[0], distances[0]):
                vac_id = int(self.vacancies_df.iloc[idx]["id"])
                sim_score = float((1 - dist).round(4))  # Повышаем точность

                # Если сходство слишком низкое, пропускаем
                if sim_score < 0.1:
                    continue

                # Получаем навыки вакансии
                vacancy_skills = self.skills_index.get(vac_id, set())

                if not vacancy_skills:
                    continue

                # Находим совпадающие и отсутствующие навыки
                matching_skills = student_skills_set.intersection(vacancy_skills)
                missing_skills = vacancy_skills.difference(student_skills_set)

                # Сортируем навыки для лучшего представления
                matching_skills = sorted(list(matching_skills))
                missing_skills = sorted(list(missing_skills))

                # Вычисляем процент соответствия
                total_skills = len(vacancy_skills)
                skills_matched = len(matching_skills)

                match_percentage = 0
                if total_skills > 0:
                    match_percentage = round(skills_matched / total_skills * 100)

                logger.info(f"Vacancy {vac_id} - Found matches: {matching_skills}")

                # Создаем объект рекомендации
                recommendations.append({
                    "vacancy_id": vac_id,
                    "similarity_score": sim_score,
                    "match_percentage": match_percentage,
                    "missing_skills": missing_skills,
                    "matching_skills": matching_skills,
                    "total_skills_required": total_skills,
                    "skills_matched": skills_matched
                })

            # Сортируем по проценту соответствия
            recommendations.sort(key=lambda x: x["match_percentage"], reverse=True)

            # Ограничиваем количество результатов
            recommendations = recommendations[:top_n]

            logger.info(f"Recommendation completed in {(datetime.now() - start_time).total_seconds():.2f} seconds")
            return recommendations
        except Exception as e:
            logger.error(f"Error in recommendation process: {e}")
            import traceback
            logger.error(traceback.format_exc())
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
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)