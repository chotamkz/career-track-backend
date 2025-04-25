import React, { useState, useEffect } from "react";
import "./EmployerVacancyDetails.css";
import { vacancyService } from "../services/api";

const EmployerVacancyDetails = ({ vacancyId, onClose, onEdit }) => {
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVacancyData = async () => {
      try {
        setLoading(true);
        const data = await vacancyService.getVacancyById(vacancyId);
        setVacancy(data);
      } catch (error) {
        setError(error.error || "Произошла ошибка при загрузке данных вакансии");
      } finally {
        setLoading(false);
      }
    };

    if (vacancyId) {
      fetchVacancyData();
    }
  }, [vacancyId]);

  // Форматирование зарплаты
  const formatSalary = (vacancy) => {
    if (!vacancy) return "Не указана";
    
    let salaryText = "";
    
    if (vacancy.salary_from && vacancy.salary_to) {
      salaryText = `${vacancy.salary_from} — ${vacancy.salary_to} ${vacancy.salary_currency || ""}`;
    } else if (vacancy.salary_from) {
      salaryText = `от ${vacancy.salary_from} ${vacancy.salary_currency || ""}`;
    } else if (vacancy.salary_to) {
      salaryText = `до ${vacancy.salary_to} ${vacancy.salary_currency || ""}`;
    } else {
      return "Не указана";
    }
    
    return salaryText;
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return "Не указана";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  // Преобразование HTML в безопасный для отображения формат
  const createMarkup = (htmlString) => {
    return { __html: htmlString || "" };
  };

  if (loading) {
    return (
      <div className="ev-details__loading">
        Загрузка данных вакансии...
      </div>
    );
  }

  if (error) {
    return (
      <div className="ev-details__error">
        <p>{error}</p>
        <button className="ev-details__close-btn" onClick={onClose}>
          Закрыть
        </button>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="ev-details__error">
        <p>Вакансия не найдена</p>
        <button className="ev-details__close-btn" onClick={onClose}>
          Закрыть
        </button>
      </div>
    );
  }

  return (
    <div className="ev-details">
      <div className="ev-details__header">
        <h2 className="ev-details__title">{vacancy.title}</h2>
        <button className="ev-details__close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="ev-details__content">
        <div className="ev-details__section">
          <div className="ev-details__info-grid">
            <div className="ev-details__info-item">
              <span className="ev-details__label">Зарплата:</span>
              <span className="ev-details__value">{formatSalary(vacancy)}</span>
            </div>
            
            <div className="ev-details__info-item">
              <span className="ev-details__label">Местоположение:</span>
              <span className="ev-details__value">{vacancy.location || "Не указано"}</span>
            </div>
            
            <div className="ev-details__info-item">
              <span className="ev-details__label">Опыт работы:</span>
              <span className="ev-details__value">{vacancy.experience || "Не указан"}</span>
            </div>
            
            <div className="ev-details__info-item">
              <span className="ev-details__label">График работы:</span>
              <span className="ev-details__value">{vacancy.work_schedule || "Не указан"}</span>
            </div>
            
            <div className="ev-details__info-item">
              <span className="ev-details__label">Дата публикации:</span>
              <span className="ev-details__value">{formatDate(vacancy.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="ev-details__section">
          <h3 className="ev-details__subtitle">Описание вакансии</h3>
          <div 
            className="ev-details__description"
            dangerouslySetInnerHTML={createMarkup(vacancy.description)}
          />
        </div>

        {vacancy.skills && vacancy.skills.length > 0 && (
          <div className="ev-details__section">
            <h3 className="ev-details__subtitle">Ключевые навыки</h3>
            <div className="ev-details__skills">
              {Array.isArray(vacancy.skills) ? (
                vacancy.skills.map((skill, index) => (
                  <span key={index} className="ev-details__skill-tag">
                    {skill}
                  </span>
                ))
              ) : typeof vacancy.skills === 'string' ? (
                vacancy.skills.split(',').map((skill, index) => (
                  <span key={index} className="ev-details__skill-tag">
                    {skill.trim()}
                  </span>
                ))
              ) : null}
            </div>
          </div>
        )}
      </div>

      <div className="ev-details__actions">
        <button 
          className="ev-details__edit-btn"
          onClick={() => onEdit(vacancy)}
        >
          Редактировать вакансию
        </button>
      </div>
    </div>
  );
};

export default EmployerVacancyDetails; 