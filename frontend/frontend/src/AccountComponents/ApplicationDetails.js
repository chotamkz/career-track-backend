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

  const APPLICATION_STATUSES = [
    { value: 'APPLIED', label: 'Новая заявка', icon: '📋', color: 'blue' },
    { value: 'CV_SCREENING', label: 'Рассмотрение резюме', icon: '👀', color: 'yellow' },
    { value: 'INTERVIEW_SCHEDULED', label: 'Собеседование назначено', icon: '📅', color: 'indigo' },
    { value: 'INTERVIEW_COMPLETED', label: 'Собеседование проведено', icon: '✓', color: 'purple' },
    { value: 'OFFER_EXTENDED', label: 'Предложение получено', icon: '📨', color: 'teal' },
    { value: 'ACCEPTED', label: 'Предложение принято', icon: '🎉', color: 'green' },
    { value: 'REJECTED', label: 'Отказано', icon: '❌', color: 'red' },
    { value: 'PENDING', label: 'В ожидании', icon: '⏳', color: 'orange' },
    { value: 'PROCESSING', label: 'В обработке', icon: '⚙️', color: 'gray' },
  ];

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        setError(null);
        setDebugInfo(null);
        
        console.log("Начинаем запрос заявок...");
        
        try {
          const result = await applicationService.getMyApplications();
          console.log("Получен ответ API:", result);
          
          
          if (result && result.error) {
            
            if (result.error.includes("не найдены") || 
                result.error.includes("отсутствуют") || 
                result.error.includes("not found") || 
                result.error.includes("applications") || 
                result.error.includes("заявки") || 
                result.status === 404) {
              console.log("Заявки отсутствуют. Возвращаем пустой массив.");
              setApplications([]);
            } else {
              
              throw new Error(result.error);
            }
          } else {
            
            if (result && result.applications && Array.isArray(result.applications)) {
              setApplications(result.applications);
              console.log(`Получено ${result.applications.length} заявок`);
            } else if (Array.isArray(result)) {
              setApplications(result);
              console.log(`Получено ${result.length} заявок`);
            } else {
              
              console.log("Неизвестный формат данных для заявок. Возвращаем пустой массив:", result);
              setApplications([]);
            }
          }
        } catch (innerError) {
          
          if (innerError && innerError.message && (
              innerError.message.includes("не найдены") ||
              innerError.message.includes("отсутствуют") ||
              innerError.message.includes("not found") ||
              innerError.message.includes("applications") ||
              innerError.message.includes("заявки"))) {
            console.log("Обработка ошибки как отсутствие заявок:", innerError.message);
            setApplications([]);
          } else {
            throw innerError;
          }
        }
        
      } catch (err) {
        console.error("Error fetching applications:", err);
        
        
        if (err && err.message && (
            err.message.includes("не найдены") ||
            err.message.includes("отсутствуют") ||
            err.message.includes("not found") ||
            err.message.includes("applications") ||
            err.message.includes("заявки"))) {
          console.log("Обработка ошибки как отсутствие заявок во внешнем блоке:", err.message);
          setApplications([]);
        } else {
          const errorMessage = "Не удалось загрузить заявки: " + (err.message || "Неизвестная ошибка");
          setError(errorMessage);
          setDebugInfo({
            errorMessage,
            stack: err.stack,
            timestamp: new Date().toISOString()
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  
  const getStatusText = (apiStatus) => {
    const statusObj = APPLICATION_STATUSES.find(s => s.value === apiStatus.toUpperCase());
    return statusObj ? statusObj.label : apiStatus;
  };

  
  const getApiStatus = (filterName) => {
    if (filterName === "all") {
      return APPLICATION_STATUSES.map(status => status.value);
    }
    
    switch (filterName) {
      case "на рассмотрении":
        return ["APPLIED", "PENDING", "PROCESSING", "CV_SCREENING"];
      case "собеседование":
        return ["INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED"];
      case "принято":
        return ["ACCEPTED", "OFFER_EXTENDED"];
      case "отклонено":
        return ["REJECTED"];
      default:
        const status = APPLICATION_STATUSES.find(s => s.label.toLowerCase() === filterName.toLowerCase());
        return status ? [status.value] : [];
    }
  };

  const getStatusClass = (status) => {
    const statusObj = APPLICATION_STATUSES.find(s => s.value === status.toUpperCase());
    const color = statusObj ? statusObj.color : 'gray';
    
    switch (color) {
      case 'blue':
        return 'status-blue';
      case 'yellow':
        return 'status-yellow';
      case 'indigo':
        return 'status-indigo';
      case 'purple':
        return 'status-purple';
      case 'teal':
        return 'status-teal';
      case 'green':
        return 'status-accepted';
      case 'red':
        return 'status-rejected';
      case 'orange':
        return 'status-pending';
      default:
        return 'status-other';
    }
  };

  const getStatusIcon = (status) => {
    const statusObj = APPLICATION_STATUSES.find(s => s.value === status.toUpperCase());
    return statusObj ? statusObj.icon : '❓';
  };

  const filterApplications = () => {
    if (selectedFilter === "all") {
      return applications;
    }
    
    
    const apiStatuses = getApiStatus(selectedFilter);
    
    
    return applications.filter(app => 
      apiStatuses.includes(app.status.toUpperCase())
    );
  };

  
  const handleViewVacancy = (vacancyId) => {
    navigate(`/vacancies/${vacancyId}`);
  };

  if (loading) {
    return <div className="application-loading">Загрузка заявок...</div>;
  }

  if (error) {
    
    if (error.includes("не найдены") || 
        error.includes("отсутствуют") || 
        error.includes("not found") || 
        error.includes("applications") || 
        error.includes("заявки")) {
      
      return (
        <div className="application-details-container">
          <h2 className="application-details-title">Мои заявки</h2>
          <div className="no-applications">
            <div className="no-applications-icon">📩</div>
            <p>У вас пока нет заявок на вакансии</p>
            <p className="no-applications-subtext">Отправьте отклик на интересующую вас вакансию, чтобы она появилась здесь</p>
            <button className="search-vacancies-btn" onClick={() => navigate('/vacancies/search')}>
              Найти вакансии
            </button>
          </div>
        </div>
      );
    }
    
    
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

  
  if (applications.length === 0) {
    return (
      <div className="application-details-container">
        <h2 className="application-details-title">Мои заявки</h2>
        <div className="no-applications">
          <div className="no-applications-icon">📩</div>
          <p>У вас пока нет заявок на вакансии</p>
          <p className="no-applications-subtext">Отправьте отклик на интересующую вас вакансию, чтобы она появилась здесь</p>
          <button className="search-vacancies-btn" onClick={() => navigate('/vacancies/search')}>
            Найти вакансии
          </button>
        </div>
      </div>
    );
  }

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
          <span className="filter-icon">👀</span> На рассмотрении
        </button>
        <button 
          className={`filter-button ${selectedFilter === "собеседование" ? "active" : ""}`}
          onClick={() => setSelectedFilter("собеседование")}
        >
          <span className="filter-icon">📅</span> Собеседование
        </button>
        <button 
          className={`filter-button ${selectedFilter === "принято" ? "active" : ""}`}
          onClick={() => setSelectedFilter("принято")}
        >
          <span className="filter-icon">🎉</span> Принято
        </button>
        <button 
          className={`filter-button ${selectedFilter === "отклонено" ? "active" : ""}`}
          onClick={() => setSelectedFilter("отклонено")}
        >
          <span className="filter-icon">❌</span> Отказано
        </button>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="no-applications">
          По выбранному фильтру заявок не найдено
        </div>
      ) : (
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
                <span className="application-company-name">{application.companyName || "Компания не указана"}</span>
                {application.location && (
                  <span className="application-location">📍 {application.location}</span>
                )}
              </div>
              
              {application.updatedDate && application.updatedDate !== application.submittedDate && (
                <div className="application-date">
                  <span>Обновлено: {new Date(application.updatedDate).toLocaleDateString()}</span>
                </div>
              )}
              
              {application.submittedDate && (
                <div className="application-date">
                  <span>Отправлено: {new Date(application.submittedDate).toLocaleDateString()}</span>
                </div>
              )}

              {application.coverLetter && (
                <details 
                  className="application-cover-letter"
                  onClick={(e) => e.stopPropagation()}
                >
                  <summary>Сопроводительное письмо</summary>
                  <p>{application.coverLetter}</p>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationDetails; 