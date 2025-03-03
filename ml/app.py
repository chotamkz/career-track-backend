from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
from model import load_model_and_vectorizer, predict

try:
    load_model_and_vectorizer()
except Exception as e:
    raise Exception(e)

try:
    df = pd.read_csv("processed_jobs.csv", encoding="utf-8")
except Exception as e:
    raise Exception(f"Ошибка загрузки датасета: {e}")

app = FastAPI(
    title="Сервис рекомендаций вакансий",
    description="Сервис для выдачи рекомендаций вакансий на основе навыков студента.",
    version="1.0"
)

class RecommendRequest(BaseModel):
    student_skills: str  # Пример: "html css"
    job_type: Optional[str] = "Полная занятость"  # Фильтр по типу занятости
    location: Optional[str] = "Алматы"  # Фильтр по локации

class JobRecommendation(BaseModel):
    title: str
    locations: str
    similarity_score: float
    vacancy_url: str

class RecommendResponse(BaseModel):
    recommended_jobs: List[JobRecommendation]

@app.post("/recommend", response_model=RecommendResponse)
async def recommend_jobs(request: RecommendRequest):
    try:
        recommended_jobs_df = predict(
            student_skills=request.student_skills,
            job_type=request.job_type,
            location=request.location,
            df=df
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

    jobs_list = []
    for _, row in recommended_jobs_df.iterrows():
        job = JobRecommendation(
            title=row["title"],
            locations=row["locations"],
            similarity_score=float(row["similarity_score"]),
            vacancy_url=row["vacancy_url"]
        )
        jobs_list.append(job)

    return RecommendResponse(recommended_jobs=jobs_list)
