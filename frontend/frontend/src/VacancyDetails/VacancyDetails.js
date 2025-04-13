import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./VacancyDetails.css";
import { vacancyService } from "../services/api";

const VacancyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchVacancy = async () => {
      setLoading(true);
      try {
        const data = await vacancyService.getVacancyById(id);
        if (data.error) throw new Error(data.error);
        setVacancy(data);
      } catch (err) {
        setError(err.message || "Ошибка загрузки вакансии");
      } finally {
        setLoading(false);
      }
    };

    fetchVacancy();
  }, [id]);

  // Функция для возврата к списку вакансий
  const handleBackToList = () => {
    navigate('/vacancies');
  };

  // Функция для сохранения вакансии
  const handleSaveVacancy = () => {
    setSaved(!saved);
    // Здесь можно добавить логику сохранения вакансии в избранное
  };

  // Преобразовать HTML-строку в безопасный HTML
  const createMarkup = (htmlString) => {
    return { __html: htmlString };
  };

  // Получить первую букву компании для логотипа
  const getCompanyInitial = () => {
    if (!vacancy || !vacancy.title) return "?";
    return vacancy.title.charAt(0).toUpperCase();
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return "Не указано";
    const date = new Date(dateString);
    
    // Функция для получения правильного окончания месяца
    const getMonthName = (month) => {
      const monthNames = [
        "января", "февраля", "марта", "апреля", "мая", "июня",
        "июля", "августа", "сентября", "октября", "ноября", "декабря"
      ];
      return monthNames[month];
    };
    
    return `${date.getDate()} ${getMonthName(date.getMonth())} ${date.getFullYear()}`;
  };

  if (loading) {
    return <p className="loading-text">Загрузка вакансии...</p>;
  }

  if (error) {
    return <p className="error-text">Ошибка: {error}</p>;
  }

  if (!vacancy) {
    return <p className="not-found-text">Вакансия не найдена</p>;
  }

  return (
    <div className="vacancy-detail">
      <div className="vacancy-header">
        <button className="back-button" onClick={handleBackToList}>Назад к вакансиям</button>
        
        <h1>{vacancy.title}</h1>
        
        <div className="employer-info">
          <div className="employer-logo">
            {getCompanyInitial()}
          </div>
          <span className="employer-name">Работодатель ID: {vacancy.employerId}</span>
        </div>
        
        {vacancy.work_schedule && (
          <div className="job-tag">{vacancy.work_schedule}</div>
        )}
        {vacancy.experience && (
          <div className="job-tag">{vacancy.experience}</div>
        )}
      </div>
      
      <div className="vacancy-meta">
        <div className="vacancy-info">
          <div className="info-block">
            <span className="info-label">Зарплата</span>
            <span className="salary-value">
              {vacancy.salary_from && vacancy.salary_to
                ? `${vacancy.salary_from} - ${vacancy.salary_to} ${vacancy.salary_currency}`
                : "По договоренности"}
            </span>
          </div>
          
          <div className="info-block">
            <span className="info-label">Опыт работы</span>
            <span className="info-value">{vacancy.experience || "Не указан"}</span>
          </div>
          
          <div className="info-block">
            <span className="info-label">График работы</span>
            <span className="info-value">{vacancy.work_schedule || "Не указан"}</span>
          </div>
          
          <div className="info-block">
            <span className="info-label">Местоположение</span>
            <span className="info-value">{vacancy.location || "Удаленная работа"}</span>
          </div>
          
          <div className="info-block">
            <span className="info-label">Дата публикации</span>
            <span className="info-value">
              {formatDate(vacancy.postedDate)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="vacancy-content">

        <div className="description">
          <h3>Описание вакансии</h3>
          <div dangerouslySetInnerHTML={createMarkup(vacancy.description)} />
        </div>

        {vacancy.skills && vacancy.skills.length > 0 && (
          <div className="skills-section">
            <h3>Ключевые навыки</h3>
            <div className="skills-list">
              {vacancy.skills.map((skill, index) => (
                <div key={index} className="skill-tag">{skill}</div>
              ))}
            </div>
          </div>
        )}
        
      </div>
      
      <div className="vacancy-actions">
        <a href={vacancy.vacancy_url} target="_blank" rel="noopener noreferrer">
          <button className="apply-btn">Откликнуться на вакансию</button>
        </a>
        <button 
          className="save-btn" 
          onClick={handleSaveVacancy}
        >
          {saved ? "Сохранено" : "Сохранить вакансию"}
        </button>
      </div>
    </div>
  );
};

export default VacancyDetails; 