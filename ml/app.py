import os
import re
import pickle
import psycopg2
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors
from flask import Flask, request, jsonify

# Preprocessing function
def preprocess_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'[^a-zа-я0-9#+\s]', ' ', text)
    return text.strip()

# Function to get DB connection using DATABASE_URL env variable
def get_db_connection():
    conn_str = "postgresql://careertrack_f38p_user:ib08LVqEQeueQCKGw60SiOHprXg0TQIG@dpg-cvc4okaj1k6c73e50ov0-a.oregon-postgres.render.com/careertrack_f38p"
    return psycopg2.connect(conn_str)

# Load vacancies from DB with aggregated key skills
def load_vacancies_from_db(conn):
    # В этом запросе агрегируются ключевые навыки из таблицы skills через связь vacancy_skills.
    query = """
    SELECT 
      v.id, 
      v.title, 
      v.description, 
      v.vacancy_url, 
      v.location,
      to_char(v.posted_date, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as posted_date,
      COALESCE(string_agg(s.name, ' ' ORDER BY s.name), '') as key_skills
    FROM vacancies v
    LEFT JOIN vacancy_skills vs ON v.id = vs.vacancy_id
    LEFT JOIN skills s ON vs.skill_id = s.id
    GROUP BY v.id;
    """
    df = pd.read_sql(query, conn)
    return df

# Train ML model: vectorizer and kNN using vacancies from DB.
def train_models(df, logger):
    logger("Training ML models using DB data...")
    df["key_skills"] = df["key_skills"].fillna("").apply(preprocess_text)
    vectorizer = TfidfVectorizer()
    X = vectorizer.fit_transform(df["key_skills"])
    knn = NearestNeighbors(n_neighbors=min(5, X.shape[0]), metric="cosine")
    knn.fit(X)
    # Save models to disk for later re-use.
    with open("tfidf_vectorizer.pkl", "wb") as f:
        pickle.dump(vectorizer, f)
    with open("knn_model.pkl", "wb") as f:
        pickle.dump(knn, f)
    logger("Models trained and saved.")
    return vectorizer, knn

# Load models from disk if available; otherwise, train using DB.
def load_or_train_models(logger):
    try:
        with open("tfidf_vectorizer.pkl", "rb") as f:
            vectorizer = pickle.load(f)
        with open("knn_model.pkl", "rb") as f:
            knn = pickle.load(f)
        logger("Models loaded from disk.")
    except Exception as e:
        logger(f"Failed to load models from disk: {e}. Training models from DB...")
        conn = get_db_connection()
        df = load_vacancies_from_db(conn)
        vectorizer, knn = train_models(df, logger)
        conn.close()
    return vectorizer, knn

# Recommendation function using kNN.
def recommend_jobs_ml(student_skills, top_n=5):
    student_skills_processed = preprocess_text(student_skills)
    student_vector = vectorizer.transform([student_skills_processed])
    distances, indices = knn.kneighbors(student_vector, n_neighbors=top_n)
    # Load vacancies to get details for recommendations.
    conn = get_db_connection()
    df = load_vacancies_from_db(conn)
    conn.close()
    recommended = df.iloc[indices[0]].copy()
    recommended["similarity_score"] = (1 - distances[0]).round(2)
    return recommended.to_dict(orient="records")

# Initialize Flask app.
app = Flask(__name__)

# Logger function using simple print (можно заменить на более сложный логгер).
def logger(msg):
    print(f"[ML SERVICE] {msg}")

# Load or train models.
vectorizer, knn = load_or_train_models(logger)

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json()
    student_skills = data.get("student_skills", "")
    recommendations = recommend_jobs_ml(student_skills)
    return jsonify({"recommendations": recommendations})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
