import joblib
import os

knn_loaded = None
vectorizer_loaded = None

def load_model_and_vectorizer():
    """Загружает модель и векторизатор из файлов."""
    global knn_loaded, vectorizer_loaded
    try:
        knn_loaded = joblib.load(os.path.join(os.path.dirname(__file__), "knn_model.pkl"))
        vectorizer_loaded = joblib.load(os.path.join(os.path.dirname(__file__), "vectorizer.pkl"))
    except Exception as e:
        raise Exception(f"Ошибка загрузки модели или векторизатора: {e}")

def predict(student_skills: str, job_type: str, location: str, df: 'pandas.DataFrame'):
    """
    Выполняет предсказание вакансий на основе навыков студента и фильтрует по типу занятости и локации.

    :param student_skills: Строка с навыками студента (например, "html css")
    :param job_type: Фильтр по типу занятости (например, "Полная занятость")
    :param location: Фильтр по локации (например, "Алматы")
    :param df: DataFrame с данными вакансий
    :return: DataFrame с рекомендованными вакансиями
    """
    filtered_df = df.copy()
    if job_type:
        filtered_df = filtered_df[filtered_df["conditions"].str.contains(job_type, case=False, na=False)]
    if location:
        filtered_df = filtered_df[filtered_df["locations"].str.contains(location, case=False, na=False)]

    if filtered_df.empty:
        raise Exception("Ничего не найдено по заданным критериям.")

    student_vector = vectorizer_loaded.transform([" ".join(student_skills.lower().split())])

    n_neighbors = min(5, len(filtered_df))

    try:
        distances, indices = knn_loaded.kneighbors(student_vector, n_neighbors=n_neighbors)
    except Exception as e:
        raise Exception(f"Ошибка при выполнении предсказания: {e}")

    recommended_jobs = filtered_df.iloc[indices[0]].copy()
    recommended_jobs["similarity_score"] = 1 - distances[0]

    return recommended_jobs
