import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ApplicationDetails.css";
import { applicationService } from "../services/api";

const ApplicationDetails = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        setError(null);
        setDebugInfo(null);
        
        console.log("Начинаем запрос заявок...");
        const result = await applicationService.getMyApplications();
        console.log("Получен ответ API:", result);
        
        if (result.error) {
          setError(result.error);
          setDebugInfo({
            error: result.error,
            status: result.status,
            timestamp: new Date().toISOString()
          });
        } else {
          // Проверяем структуру ответа, сервер возвращает объект с полем applications
          if (result && result.applications && Array.isArray(result.applications)) {
            setApplications(result.applications);
            console.log(`Получено ${result.applications.length} заявок`);
          } else if (Array.isArray(result)) {
            // На случай, если API изменится и будет возвращать массив напрямую
            setApplications(result);
            console.log(`Получено ${result.length} заявок`);
          } else {
            setError("Сервер вернул некорректные данные");
            setDebugInfo({
              receivedData: result,
              expectedType: "Array или объект с полем applications",
              actualType: typeof result,
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        const errorMessage = "Не удалось загрузить заявки: " + (err.message || "Неизвестная ошибка");
        setError(errorMessage);
        console.error("Error fetching applications:", err);
        setDebugInfo({
          errorMessage,
          stack: err.stack,
          timestamp: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  // Функция для преобразования статуса API в человекочитаемый текст
  const getStatusText = (apiStatus) => {
    switch (apiStatus.toUpperCase()) {
      case "APPLIED":
        return "На рассмотрении";
      case "ACCEPTED":
      case "APPROVED":
        return "Принято";
      case "REJECTED":
      case "DECLINED":
        return "Отклонено";
      case "PENDING":
        return "Ожидает рассмотрения";
      case "PROCESSING":
        return "В обработке";
      default:
        return apiStatus;
    }
  };

  // Функция для преобразования человекочитаемого статуса в API-статус
  const getApiStatus = (readableStatus) => {
    switch (readableStatus.toLowerCase()) {
      case "на рассмотрении":
        return ["APPLIED", "PENDING", "PROCESSING"];
      case "принято":
        return ["ACCEPTED", "APPROVED"];
      case "отклонено":
        return ["REJECTED", "DECLINED"];
      default:
        return [readableStatus.toUpperCase()];
    }
  };

  const getStatusClass = (status) => {
    // Приводим к верхнему регистру для унификации
    const statusUpper = status.toUpperCase();
    
    if (statusUpper === "APPLIED" || statusUpper === "PENDING" || statusUpper === "PROCESSING") {
      return "status-pending";
    } else if (statusUpper === "ACCEPTED" || statusUpper === "APPROVED") {
      return "status-accepted";
    } else if (statusUpper === "REJECTED" || statusUpper === "DECLINED") {
      return "status-rejected";
    } else {
      return "status-other";
    }
  };

  const getStatusIcon = (status) => {
    // Приводим к верхнему регистру для унификации
    const statusUpper = status.toUpperCase();
    
    if (statusUpper === "APPLIED" || statusUpper === "PENDING" || statusUpper === "PROCESSING") {
      return "⏳";
    } else if (statusUpper === "ACCEPTED" || statusUpper === "APPROVED") {
      return "✅";
    } else if (statusUpper === "REJECTED" || statusUpper === "DECLINED") {
      return "❌";
    } else {
      return "❓";
    }
  };

  const filterApplications = () => {
    if (selectedFilter === "all") {
      return applications;
    }
    
    // Получаем соответствующие API-статусы
    const apiStatuses = getApiStatus(selectedFilter);
    
    // Фильтруем по статусу
    return applications.filter(app => 
      apiStatuses.includes(app.status.toUpperCase())
    );
  };

  // Функция для перехода на страницу вакансии
  const handleViewVacancy = (vacancyId) => {
    navigate(`/vacancies/${vacancyId}`);
  };

  if (loading) {
    return <div className="application-loading">Загрузка заявок...</div>;
  }

  if (error) {
    return (
      <div className="application-error">
        <p>{error}</p>
        {debugInfo && (
          <details>
            <summary>Отладочная информация</summary>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </details>
        )}
      </div>
    );
  }

  const filteredApplications = filterApplications();

  return (
    <div className="application-details-container">
      <h2 className="application-details-title">Мои заявки</h2>
      
      <div className="application-filters">
        <button 
          className={`filter-button ${selectedFilter === "all" ? "active" : ""}`}
          onClick={() => setSelectedFilter("all")}
        >
          Все заявки
        </button>
        <button 
          className={`filter-button ${selectedFilter === "на рассмотрении" ? "active" : ""}`}
          onClick={() => setSelectedFilter("на рассмотрении")}
        >
          На рассмотрении
        </button>
        <button 
          className={`filter-button ${selectedFilter === "принято" ? "active" : ""}`}
          onClick={() => setSelectedFilter("принято")}
        >
          Принято
        </button>
        <button 
          className={`filter-button ${selectedFilter === "отклонено" ? "active" : ""}`}
          onClick={() => setSelectedFilter("отклонено")}
        >
          Отклонено
        </button>
      </div>

      {filteredApplications.length > 0 ? (
        <div className="applications-list">
          {filteredApplications.map((application) => (
            <div 
              className="application-card" 
              key={application.id}
              onClick={() => handleViewVacancy(application.vacancyId)}
            >
              <div className="application-header">
                <h3 className="application-job-title">
                  {application.vacancyTitle || `Вакансия ID: ${application.vacancyId}`}
                </h3>
                <span className={`application-status ${getStatusClass(application.status)}`}>
                  {getStatusIcon(application.status)} {getStatusText(application.status)}
                </span>
              </div>
              
              <div className="application-company-info">
                <span>{application.companyName || "Компания не указана"}</span>
                {application.location && (
                  <span className="application-location">📍 {application.location}</span>
                )}
              </div>
              
              {application.updateDate && application.updateDate !== application.submittedDate && (
                <div className="application-date">
                  <span>Обновлено: {new Date(application.updateDate).toLocaleDateString()}</span>
                </div>
              )}
              
              {application.submittedDate && (
                <div className="application-date">
                  <span>Дата подачи: {new Date(application.submittedDate).toLocaleDateString()}</span>
                </div>
              )}
              
              {application.feedback && (
                <div className="application-feedback">
                  <h4>Отзыв от работодателя:</h4>
                  <p>{application.feedback}</p>
                </div>
              )}
              
              {application.coverLetter && (
                <div className="application-cover-letter">
                  <details>
                    <summary>Сопроводительное письмо</summary>
                    <p>{application.coverLetter}</p>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-applications">
          <p>У вас пока нет заявок на вакансии</p>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetails; 