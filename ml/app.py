import os
import re
import pickle
import psycopg2
import pandas as pd
from flask import Flask, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors

# Функция предобработки текста
def preprocess_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'[^a-zа-я0-9#+\s]', ' ', text)
    return text.strip()

# Получаем соединение с БД
def get_db_connection():
    conn_str = "postgresql://careertrack_f38p_user:ib08LVqEQeueQCKGw60SiOHprXg0TQIG@dpg-cvc4okaj1k6c73e50ov0-a.oregon-postgres.render.com/careertrack_f38p"
    if not conn_str:
        raise ValueError("DATABASE_URL not set")
    return psycopg2.connect(conn_str)

# Загружаем вакансии из базы
def load_vacancies_from_db():
    conn = get_db_connection()
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
    return df

# Обучаем модель
def train_models(df):
    df["key_skills"] = df["key_skills"].fillna("").apply(preprocess_text)
    vectorizer = TfidfVectorizer()
    X = vectorizer.fit_transform(df["key_skills"])
    knn = NearestNeighbors(n_neighbors=min(5, X.shape[0]), metric="cosine")
    knn.fit(X)
    with open("tfidf_vectorizer.pkl", "wb") as f:
        pickle.dump(vectorizer, f)
    with open("knn_model.pkl", "wb") as f:
        pickle.dump(knn, f)
    return vectorizer, knn

# Загружаем модели или переобучаем
def load_or_train_models():
    try:
        with open("tfidf_vectorizer.pkl", "rb") as f:
            vectorizer = pickle.load(f)
        with open("knn_model.pkl", "rb") as f:
            knn = pickle.load(f)
    except:
        df = load_vacancies_from_db()
        vectorizer, knn = train_models(df)
    return vectorizer, knn

# Функция рекомендаций
def recommend_jobs_ml(student_skills, top_n=5):
    # Предобрабатываем входные навыки: набор слов в нижнем регистре.
    processed_skills = set(preprocess_text(student_skills).split())

    conn = get_db_connection()
    df = load_vacancies_from_db()
    conn.close()

    if df.empty:
        return []

    # Приводим поле key_skills к нижнему регистру для корректного сравнения.
    df["key_skills"] = df["key_skills"].fillna("").apply(preprocess_text)

    X_filtered = vectorizer.transform(df["key_skills"])
    student_vector = vectorizer.transform([" ".join(processed_skills)])

    n_neighbors = min(top_n, knn.n_neighbors)
    distances, indices = knn.kneighbors(student_vector, n_neighbors=n_neighbors)

    recommendations = []
    for idx, dist in zip(indices[0], distances[0]):
        row = df.iloc[idx]
        vac_id = int(row["id"])
        sim_score = float((1 - dist).round(2))
        # Вычисляем недостающие навыки для конкретной вакансии:
        vacancy_skills = set(row["key_skills"].split())
        missing = list(vacancy_skills - processed_skills)
        recommendations.append({
            "vacancy_id": vac_id,
            "similarity_score": sim_score,
            "missing_skills": missing
        })

    return recommendations

# Инициализация Flask
app = Flask(__name__)
vectorizer, knn = load_or_train_models()

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json()
    student_skills = data.get("student_skills", "")
    recommendations = recommend_jobs_ml(student_skills)
    return jsonify({"recommendations": recommendations})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
