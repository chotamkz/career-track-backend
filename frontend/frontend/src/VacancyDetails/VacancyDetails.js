import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./VacancyDetails.css";
import { vacancyService } from "../services/api";
import { getUserRole, isAuthenticated } from "../services/authService";

const VacancyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [hasApplied, setHasApplied] = useState(false);

  const userRole = getUserRole();
  const isStudent = userRole === "STUDENT";

  useEffect(() => {
    const fetchVacancy = async () => {
      setLoading(true);
      try {
        const data = await vacancyService.getVacancyById(id);
        if (data.error) throw new Error(data.error);
        setVacancy(data);
        
        if (data.applicationStatus) {
          setHasApplied(true);
        }
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

  // Открыть модальное окно отклика
  const openApplyModal = () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    if (!isStudent) {
      alert("Только студенты могут откликаться на вакансии");
      return;
    }
    
    setShowApplyModal(true);
  };

  // Закрыть модальное окно отклика
  const closeApplyModal = () => {
    setShowApplyModal(false);
    if (applySuccess) {
      setApplySuccess(false);
      setCoverLetter("");
    }
  };

  // Отправить отклик на вакансию
  const handleApply = async () => {
    if (!coverLetter.trim()) {
      setApplyError("Пожалуйста, заполните сопроводительное письмо");
      return;
    }

    setApplying(true);
    setApplyError("");
    
    try {
      const result = await vacancyService.applyToVacancy(id, coverLetter);
      
      if (result.error) {
        if (result.error.includes("already applied")) {
          setHasApplied(true);
          setApplyError("Вы уже откликнулись на эту вакансию.");
          
          return;
        }
        throw new Error(result.error);
      }
      
      setApplySuccess(true);
      setHasApplied(true);
      const updatedVacancy = await vacancyService.getVacancyById(id);
      if (!updatedVacancy.error) {
        setVacancy(updatedVacancy);
      }
    } catch (err) {
      setApplyError(err.message || "Произошла ошибка при отклике на вакансию");
    } finally {
      setApplying(false);
    }
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

  // Получение текста статуса отклика для отображения
  const getStatusText = (status) => {
    switch (status) {
      case "APPLIED": return "На рассмотрении";
      case "VIEWED": return "Просмотрено";
      case "INVITED": return "Приглашение";
      case "REJECTED": return "Отклонено";
      default: return status;
    }
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
        {isStudent && vacancy.applicationStatus ? (
          <div className="already-applied">
            <div className="applied-badge">
              <div className="applied-icon">✓</div>
              <span>Вы уже откликнулись</span>
            </div>
            <div className="application-status">
              <span className="status-label">Статус:</span>
              <span className={`status-value ${vacancy.applicationStatus.toLowerCase()}`}>
                {getStatusText(vacancy.applicationStatus)}
              </span>
              {vacancy.applicationDate && (
                <span className="application-date">
                  Отклик отправлен: {new Date(vacancy.applicationDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ) : (
          <button 
            className="apply-btn" 
            onClick={openApplyModal}
            disabled={!isStudent}
          >
            Откликнуться на вакансию
          </button>
        )}
        <button 
          className="save-btn" 
          onClick={handleSaveVacancy}
        >
          {saved ? "Сохранено" : "Сохранить вакансию"}
        </button>
      </div>

      {/* Модальное окно для отклика на вакансию */}
      {showApplyModal && (
        <div className="modal-overlay">
          <div className="apply-modal">
            <div className="modal-header">
              <h3>{applySuccess ? "Отклик отправлен!" : "Отклик на вакансию"}</h3>
              <button className="close-modal" onClick={closeApplyModal}>×</button>
            </div>
            
            {applySuccess ? (
              <div className="success-content">
                <div className="success-icon">✓</div>
                <p>Ваш отклик был успешно отправлен работодателю.</p>
                <p>Вы получите уведомление, когда работодатель рассмотрит вашу заявку.</p>
                <button className="modal-button" onClick={closeApplyModal}>Закрыть</button>
              </div>
            ) : vacancy.applicationStatus ? (
              <div className="success-content">
                <div className="already-applied-icon">!</div>
                <h4>Вы уже откликнулись на эту вакансию</h4>
                {vacancy.applicationDate && (
                  <p>Дата отклика: {new Date(vacancy.applicationDate).toLocaleDateString()}</p>
                )}
                <p>Текущий статус: 
                  <span className={`status-text ${vacancy.applicationStatus.toLowerCase()}`}>
                    {getStatusText(vacancy.applicationStatus)}
                  </span>
                </p>
                <button className="modal-button" onClick={closeApplyModal}>Закрыть</button>
              </div>
            ) : (
              <>
                <div className="modal-content">
                  <div className="vacancy-title-small">
                    <strong>Вакансия:</strong> {vacancy.title}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="coverLetter">Сопроводительное письмо</label>
                    <textarea
                      id="coverLetter"
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Расскажите о себе и почему вы подходите на эту вакансию..."
                      rows="6"
                    />
                    {applyError && <div className="error-message">{applyError}</div>}
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button 
                    className="modal-button secondary" 
                    onClick={closeApplyModal}
                    disabled={applying}
                  >
                    Отмена
                  </button>
                  <button 
                    className="modal-button primary" 
                    onClick={handleApply}
                    disabled={applying}
                  >
                    {applying ? "Отправка..." : "Отправить отклик"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VacancyDetails; 