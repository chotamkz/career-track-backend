import React, { useState, useEffect } from "react";
import "./EmployerApplications.css";
import { apiClient, API_ENDPOINTS, handleApiError } from "../services/api";
import { useParams } from 'react-router-dom';
import { applicationService } from '../services/api.js';

const EmployerApplications = () => {
  const [applications, setApplications] = useState([]);
  const [allApplications, setAllApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterByVacancy, setFilterByVacancy] = useState("");
  const [vacancies, setVacancies] = useState([]);
  const ITEMS_PER_PAGE = 10;
  const [selectedVacancyId, setSelectedVacancyId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  
  const APPLICATION_STATUSES = [
    { value: 'APPLIED', label: 'Новая заявка', icon: '📋', color: 'blue' },
    { value: 'CV_SCREENING', label: 'Рассмотрение резюме', icon: '👀', color: 'yellow' },
    { value: 'INTERVIEW_SCHEDULED', label: 'Собеседование назначено', icon: '📅', color: 'indigo' },
    { value: 'INTERVIEW_COMPLETED', label: 'Собеседование проведено', icon: '✓', color: 'purple' },
    { value: 'OFFER_EXTENDED', label: 'Предложение отправлено', icon: '📨', color: 'teal' },
    { value: 'ACCEPTED', label: 'Кандидат принят', icon: '🎉', color: 'green' },
    { value: 'REJECTED', label: 'Кандидат отклонен', icon: '❌', color: 'red' },
  ];

  
  useEffect(() => {
    if (selectedApplication) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [selectedApplication]);

  useEffect(() => {
    fetchVacancies();
  }, []);

  useEffect(() => {
    
    if (selectedVacancyId) {
      fetchApplicationsForVacancy(selectedVacancyId);
    }
  }, [selectedVacancyId]);

  
  useEffect(() => {
    if (allApplications.length > 0) {
      applyFiltersAndPagination();
    }
  }, [allApplications, currentPage, filter]);

  const fetchVacancies = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.EMPLOYERS.VACANCIES);
      console.log("Vacancies response:", response.data);
      
      
      let vacanciesData = [];
      if (response.data && response.data.vacancies && Array.isArray(response.data.vacancies)) {
        vacanciesData = response.data.vacancies;
      } else if (Array.isArray(response.data)) {
        vacanciesData = response.data;
      } else if (response.data && response.data.content && Array.isArray(response.data.content)) {
        vacanciesData = response.data.content;
      }
      
      console.log("Parsed vacancies:", vacanciesData);
      setVacancies(vacanciesData);
      
      
      if (vacanciesData.length > 0) {
        const firstVacancyId = vacanciesData[0].id;
        setSelectedVacancyId(firstVacancyId);
        setFilterByVacancy(firstVacancyId);
      } else {
        setError("У вас пока нет вакансий. Создайте вакансию, чтобы просматривать заявки.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching vacancies:", error);
      setError("Не удалось загрузить вакансии");
      setLoading(false);
    }
  };

  const fetchApplicationsForVacancy = async (vacancyId) => {
    if (!vacancyId) return;
    
    try {
      setLoading(true);
      console.log(`Fetching applications for vacancy: ${vacancyId}`);
      
      
      const response = await apiClient.get(API_ENDPOINTS.APPLICATIONS.GET_VACANCY_APPLICATIONS(vacancyId));
      console.log("Applications response:", response.data);
      
      
      let applicationsData = [];
      if (response.data && response.data.applications && Array.isArray(response.data.applications)) {
        applicationsData = response.data.applications;
      } else if (Array.isArray(response.data)) {
        applicationsData = response.data;
      } else if (response.data && response.data.content && Array.isArray(response.data.content)) {
        applicationsData = response.data.content;
      }
      
      console.log("Parsed applications:", applicationsData);
      
      
      const enhancedApplications = applicationsData.map(app => {
        
        const applicationData = app.application || app;
        const studentData = app.studentName ? app : applicationData;
        
        return {
          
          id: applicationData.id,
          studentId: applicationData.studentId,
          vacancyId: applicationData.vacancyId,
          coverLetter: applicationData.coverLetter,
          submittedDate: applicationData.submittedDate,
          status: applicationData.status || "APPLIED",
          updatedDate: applicationData.updatedDate,
          
          
          vacancyTitle: vacancies.find(v => v.id === applicationData.vacancyId)?.title || `Вакансия #${applicationData.vacancyId}`,
          
          
          studentName: app.studentName || `Студент #${applicationData.studentId}`,
          applicantName: app.studentName || `Студент #${applicationData.studentId}`,
          applicantEmail: app.email || 'не указан',
          applicationDate: applicationData.submittedDate || applicationData.createdAt || new Date().toISOString(),
          
          
          education: app.education || "Не указано",
          city: app.city || "Не указан",
          phone: app.phone || "Не указан",
          email: app.email || "Не указан"
        };
      });
      
      setAllApplications(enhancedApplications);
      applyFiltersAndPagination(enhancedApplications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setError(handleApiError(error).error || "Не удалось загрузить заявки");
    } finally {
      setLoading(false);
    }
  };

  
  const applyFiltersAndPagination = (apps = allApplications) => {
    
    let filteredApps = [...apps];
    if (filter !== "ALL") {
      filteredApps = filteredApps.filter(app => app.status === filter);
    }

    
    const totalItems = filteredApps.length;
    const calculatedTotalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    setTotalPages(calculatedTotalPages || 1);

    
    if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
      setCurrentPage(1);
      return;
    }

    
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedApps = filteredApps.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    
    setApplications(paginatedApps);
  };

  const handleVacancyChange = (e) => {
    const vacancyId = e.target.value;
    setSelectedVacancyId(vacancyId);
    setFilterByVacancy(vacancyId);
    setCurrentPage(1); 
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      setIsLoading(true);
      
      
      const oldStatus = applications.find(app => app.id === applicationId)?.status;
      const newStatusLabel = APPLICATION_STATUSES.find(s => s.value === newStatus)?.label;

      await applicationService.updateApplicationStatus(null, applicationId, newStatus);
      
      
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
      
      
      setAllApplications(allApplications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
      
      
      if (selectedApplication && selectedApplication.id === applicationId) {
        setSelectedApplication(prev => ({ ...prev, status: newStatus }));
      }
      
      
      setNotification({
        visible: true,
        message: `Статус изменен на "${newStatusLabel}"`,
        type: "success"
      });
      
      
      setTimeout(() => {
        setNotification({ visible: false, message: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Ошибка при обновлении статуса заявки:", error);
      setNotification({
        visible: true,
        message: `Ошибка при обновлении статуса: ${error.message || "Неизвестная ошибка"}`,
        type: "error"
      });
      setTimeout(() => {
        setNotification({ visible: false, message: "", type: "" });
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const viewApplicationDetails = (application) => {
    setSelectedApplication(application);
  };

  const closeDetails = () => {
    setSelectedApplication(null);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1); 
  };

  const getStatusText = (status) => {
    const statusObj = APPLICATION_STATUSES.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  const getStatusClassName = (status) => {
    const statusObj = APPLICATION_STATUSES.find(s => s.value === status);
    const color = statusObj ? statusObj.color : 'gray';
    
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-800';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800';
      case 'indigo':
        return 'bg-indigo-100 text-indigo-800';
      case 'purple':
        return 'bg-purple-100 text-purple-800';
      case 'teal':
        return 'bg-teal-100 text-teal-800';
      case 'green':
        return 'bg-green-100 text-green-800';
      case 'red':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    const statusObj = APPLICATION_STATUSES.find(s => s.value === status);
    return statusObj ? statusObj.icon : '❓';
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Дата не указана";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  if (loading && applications.length === 0) {
    return <div className="employer-applications__loading">Загрузка заявок...</div>;
  }

  
  if (vacancies.length === 0) {
    return (
      <div className="employer-applications">
        <h2 className="employer-applications__title">Заявки от соискателей</h2>
        <div className="employer-applications__empty">
          У вас пока нет вакансий. Создайте вакансию, чтобы получать заявки от соискателей.
        </div>
      </div>
    );
  }

  return (
    <div className="employer-applications">
      <h2 className="employer-applications__title">Заявки от соискателей</h2>
      
      {notification && notification.visible && (
        <div className={`notification notification--${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      {error && (
        <div className="employer-applications__error">{error}</div>
      )}
      
      <div className="employer-applications__filters">
        <div className="employer-applications__filter-group">
          <label className="employer-applications__filter-label">Статус</label>
          <select 
            className="employer-applications__filter-select"
            value={filter}
            onChange={handleFilterChange}
          >
            <option value="ALL">Все заявки</option>
            {APPLICATION_STATUSES.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="employer-applications__filter-group">
          <label className="employer-applications__filter-label">Вакансия</label>
          <select 
            className="employer-applications__filter-select"
            value={selectedVacancyId || ""}
            onChange={handleVacancyChange}
          >
            {vacancies.map(vacancy => (
              <option key={vacancy.id} value={vacancy.id}>
                {vacancy.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {applications.length === 0 ? (
        <div className="employer-applications__empty">
          Заявок по выбранным критериям не найдено
        </div>
      ) : (
        <>
          <div className="employer-applications__list">
            {applications.map((application) => (
              <div 
                key={application.id} 
                className="employer-applications__item"
                onClick={() => viewApplicationDetails(application)}
              >
                <div className="employer-applications__item-header">
                  <h3 className="employer-applications__vacancy-title">
                    {application.vacancyTitle}
                  </h3>
                  <span className={`employer-applications__status ${getStatusClassName(application.status)}`}>
                    {getStatusIcon(application.status)} {getStatusText(application.status)}
                  </span>
                </div>
                
                <div className="employer-applications__applicant-info">
                  <span className="employer-applications__applicant-name">
                    {application.studentName || application.applicantName}
                  </span>
                  <div className="employer-applications__applicant-details">
                    {application.email && (
                      <span className="employer-applications__applicant-email">
                        ✉️ {application.email}
                      </span>
                    )}
                    {application.city && (
                      <span className="employer-applications__applicant-city">
                        📍 {application.city}
                      </span>
                    )}
                    {application.education && (
                      <span className="employer-applications__applicant-education">
                        🎓 {application.education}
                      </span>
                    )}
                  </div>
                  <span className="employer-applications__date">
                    {formatDate(application.applicationDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="employer-applications__pagination">
            <button 
              className="employer-applications__pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              &lt; Назад
            </button>
            
            <span className="employer-applications__pagination-info">
              Страница {currentPage} из {totalPages}
            </span>
            
            <button 
              className="employer-applications__pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              Вперед &gt;
            </button>
          </div>
        </>
      )}
      
      {selectedApplication && (
        <div className="employer-applications__details-overlay">
          <div className="employer-applications__details">
            <button 
              className="employer-applications__close-btn"
              onClick={closeDetails}
            >
              ×
            </button>
            
            <h3 className="employer-applications__details-title">
              Заявка на вакансию "{selectedApplication.vacancyTitle}"
            </h3>
            
            <div className="employer-applications__details-info">
              <div className="employer-applications__details-row">
                <span className="employer-applications__details-label">Соискатель:</span>
                <span className="employer-applications__details-value">{selectedApplication.studentName || selectedApplication.applicantName}</span>
              </div>
              
              <div className="employer-applications__details-row">
                <span className="employer-applications__details-label">Email:</span>
                <span className="employer-applications__details-value">{selectedApplication.email || selectedApplication.applicantEmail}</span>
              </div>

              <div className="employer-applications__details-row">
                <span className="employer-applications__details-label">Телефон:</span>
                <span className="employer-applications__details-value">{selectedApplication.phone || "Не указан"}</span>
              </div>

              <div className="employer-applications__details-row">
                <span className="employer-applications__details-label">Образование:</span>
                <span className="employer-applications__details-value">{selectedApplication.education || "Не указано"}</span>
              </div>

              <div className="employer-applications__details-row">
                <span className="employer-applications__details-label">Город:</span>
                <span className="employer-applications__details-value">{selectedApplication.city || "Не указан"}</span>
              </div>
              
              <div className="employer-applications__details-row">
                <span className="employer-applications__details-label">Дата заявки:</span>
                <span className="employer-applications__details-value">
                  {formatDate(selectedApplication.applicationDate)}
                </span>
              </div>
              
              <div className="employer-applications__details-row">
                <span className="employer-applications__details-label">Статус:</span>
                <div className="employer-applications__status-container">
                  <select 
                    className={`employer-applications__status-select ${getStatusClassName(selectedApplication.status)}`}
                    value={selectedApplication.status}
                    onChange={(e) => handleStatusChange(selectedApplication.id, e.target.value)}
                    disabled={isLoading}
                  >
                    {APPLICATION_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.icon} {status.label}
                      </option>
                    ))}
                  </select>
                  {isLoading && <span className="employer-applications__loading-indicator">⏳</span>}
                </div>
              </div>
              
              {selectedApplication.resume && (
                <div className="employer-applications__details-row">
                  <span className="employer-applications__details-label">Резюме:</span>
                  <a 
                    href={selectedApplication.resume}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="employer-applications__resume-link"
                  >
                    Скачать резюме
                  </a>
                </div>
              )}
            </div>
            
            {selectedApplication.coverLetter && (
              <div className="employer-applications__cover-letter">
                <h4>Сопроводительное письмо:</h4>
                <p>{selectedApplication.coverLetter}</p>
              </div>
            )}
            
            <div className="employer-applications__actions">
              <button 
                className="employer-applications__action-btn employer-applications__action-btn--reject"
                onClick={() => handleStatusChange(selectedApplication.id, "REJECTED")}
                disabled={selectedApplication.status === "REJECTED" || isLoading}
              >
                ❌ Отклонить кандидата
              </button>
              
              <button 
                className="employer-applications__action-btn employer-applications__action-btn--interview"
                onClick={() => handleStatusChange(selectedApplication.id, "INTERVIEW_SCHEDULED")}
                disabled={selectedApplication.status === "INTERVIEW_SCHEDULED" || isLoading}
              >
                📅 Назначить собеседование
              </button>
              
              <button 
                className="employer-applications__action-btn employer-applications__action-btn--accept"
                onClick={() => handleStatusChange(selectedApplication.id, "ACCEPTED")}
                disabled={selectedApplication.status === "ACCEPTED" || isLoading}
              >
                🎉 Принять кандидата
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerApplications; 