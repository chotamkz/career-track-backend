import React, { useState, useEffect } from 'react';
import './EmployerVacancies.css';
import { apiClient, API_ENDPOINTS, handleApiError, vacancyService } from '../services/api';
import EmployerVacancyForm from './EmployerVacancyForm';
import EmployerVacancyDetails from './EmployerVacancyDetails';

const EmployerVacancies = () => {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  useEffect(() => {
    const isModalOpen = showForm || confirmDelete || showDetails;
    if (isModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showForm, confirmDelete, showDetails]);
  
  useEffect(() => {
    fetchVacancies();
  }, [currentPage, searchTerm]);
  
  const fetchVacancies = async () => {
    try {
      setLoading(true);
      
      let url = `${API_ENDPOINTS.EMPLOYERS.VACANCIES}`;
      
      const params = new URLSearchParams();
      
      if (currentPage > 1) {
        params.append('page', currentPage - 1);
      }
      
      params.append('size', '5');
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('Fetching vacancies from:', url);
      
      const response = await apiClient.get(url);
      console.log('Vacancies response:', response.data);
      
      let vacanciesData = [];
      
      if (response.data && response.data.vacancies && Array.isArray(response.data.vacancies)) {
        vacanciesData = response.data.vacancies;
        console.log('Found vacancies in "vacancies" field:', vacanciesData.length);
      } else if (response.data && response.data.content && Array.isArray(response.data.content)) {
        vacanciesData = response.data.content;
        console.log('Found vacancies in "content" field:', vacanciesData.length);
      } else if (Array.isArray(response.data)) {
        vacanciesData = response.data;
        console.log('Vacancies data is an array:', vacanciesData.length);
      } else {
        console.error('Unexpected data format:', response.data);
        throw new Error('Неожиданный формат данных от сервера');
      }
      
      setVacancies(vacanciesData);
      
      if (response.data && response.data.totalPages) {
        setTotalPages(response.data.totalPages);
      } else {
        const totalItems = vacanciesData.length;
        const itemsPerPage = 5;
        setTotalPages(Math.max(1, Math.ceil(totalItems / itemsPerPage)));
      }
      
    } catch (error) {
      console.error('Error fetching vacancies:', error);
      setError(handleApiError(error).error || "Не удалось загрузить вакансии");
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddVacancy = () => {
    setEditingVacancy(null);
    setShowForm(true);
  };
  
  const handleEditVacancy = (vacancy) => {
    setEditingVacancy(vacancy);
    setShowForm(true);
    setShowDetails(false);
  };
  
  const handleDeleteVacancy = (vacancyId, event) => {
    // Предотвращаем всплытие события, чтобы не сработал клик по карточке
    if (event) {
      event.stopPropagation();
    }
    setConfirmDelete(vacancyId);
  };

  const handleVacancyClick = (vacancy) => {
    setSelectedVacancy(vacancy);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedVacancy(null);
  };
  
  const confirmDeleteVacancy = async () => {
    if (!confirmDelete) return;
    
    try {
      setDeleting(true);
      setError(null);
      
      const result = await vacancyService.deleteVacancy(confirmDelete);
      
      if (result.success) {
        // Успешное удаление (204 No Content)
        setVacancies(prevVacancies => 
          prevVacancies.filter(vacancy => vacancy.id !== confirmDelete)
        );
        setConfirmDelete(null);
      } else {
        // Обработка ошибок удаления
        setError(result.error || "Не удалось удалить вакансию");
        
        // При определенных ошибках (401 - истек токен) может потребоваться перенаправление
        if (result.status === 401) {
          // Здесь можно добавить редирект на страницу входа при необходимости
          // window.location.href = '/auth/employer';
        }
      }
    } catch (error) {
      setError("Произошла ошибка при удалении вакансии");
      console.error('Error deleting vacancy:', error);
    } finally {
      setDeleting(false);
    }
  };
  
  const handleFormSave = (savedVacancy) => {
    if (editingVacancy) {
      setVacancies(prevVacancies =>
        prevVacancies.map(vacancy => 
          vacancy.id === savedVacancy.id ? savedVacancy : vacancy
        )
      );
    } else {
      setVacancies(prevVacancies => [savedVacancy, ...prevVacancies]);
    }
  };
  
  const handleFormClose = () => {
    setShowForm(false);
    setEditingVacancy(null);
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  const formatSalary = (min, max, currency) => {
    if (min && max) {
      return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}`;
    } else if (min) {
      return `от ${min.toLocaleString()} ${currency}`;
    } else if (max) {
      return `до ${max.toLocaleString()} ${currency}`;
    } else {
      return 'Не указана';
    }
  };
  
  if (loading && vacancies.length === 0) {
    return <div className="employer-vacancies__loading">Загрузка вакансий...</div>;
  }
  
  return (
    <div className="employer-vacancies">
      <div className="employer-vacancies__header">
        <h2 className="employer-vacancies__title">Мои вакансии</h2>
        <button 
          className="employer-vacancies__add-btn"
          onClick={handleAddVacancy}
        >
          Добавить вакансию
        </button>
      </div>
      
      {error && (
        <div className="employer-vacancies__error">{error}</div>
      )}
      
      <div className="employer-vacancies__filters">
        <div className="employer-vacancies__search">
          <input 
            type="text"
            placeholder="Поиск по названию"
            value={searchTerm}
            onChange={handleSearchChange}
            className="employer-vacancies__search-input"
          />
        </div>
      </div>
      
      {vacancies.length === 0 ? (
        <div className="employer-vacancies__empty">
          <p>У вас пока нет активных вакансий</p>
          <button 
            className="employer-vacancies__create-btn"
            onClick={handleAddVacancy}
          >
            Создать первую вакансию
          </button>
        </div>
      ) : (
        <>
          <div className="employer-vacancies__list">
            {vacancies.map(vacancy => (
              <div 
                key={vacancy.id} 
                className="employer-vacancies__item"
                onClick={() => handleVacancyClick(vacancy)}
              >
                <div className="employer-vacancies__item-header">
                  <h3 className="employer-vacancies__item-title">
                    {vacancy.title}
                  </h3>
                </div>
                
                <div className="employer-vacancies__item-details">
                  <div className="employer-vacancies__item-location">
                    <i className="employer-vacancies__icon-location">📍</i>
                    {vacancy.location || 'Не указано'}
                  </div>
                  
                  <div className="employer-vacancies__item-salary">
                    <i className="employer-vacancies__icon-salary">💰</i>
                    {formatSalary(vacancy.salaryMin, vacancy.salaryMax, vacancy.currency)}
                  </div>
                  
                  <div className="employer-vacancies__item-date">
                    <i className="employer-vacancies__icon-date">📅</i>
                    {new Date(vacancy.createdAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
                
                <div className="employer-vacancies__item-skills">
                  {vacancy.skills && typeof vacancy.skills === 'string' && 
                   vacancy.skills.split(',').map((skill, index) => (
                    <span key={index} className="employer-vacancies__item-skill">
                      {skill.trim()}
                    </span>
                  ))}
                  
                  {vacancy.skills && Array.isArray(vacancy.skills) && 
                   vacancy.skills.map((skill, index) => (
                    <span key={index} className="employer-vacancies__item-skill">
                      {skill}
                    </span>
                   ))}
                </div>
                
                <div className="employer-vacancies__item-actions">
                  <button 
                    className="employer-vacancies__action-btn employer-vacancies__action-btn--edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditVacancy(vacancy);
                    }}
                  >
                    ✏️ Редактировать
                  </button>
                  
                  <button 
                    className="employer-vacancies__action-btn employer-vacancies__action-btn--delete"
                    onClick={(e) => handleDeleteVacancy(vacancy.id, e)}
                  >
                    🗑️ Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="employer-vacancies__pagination">
            <button 
              className="employer-vacancies__pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              &lt; Назад
            </button>
            
            <span className="employer-vacancies__pagination-info">
              Страница {currentPage} из {totalPages}
            </span>
            
            <button 
              className="employer-vacancies__pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              Вперед &gt;
            </button>
          </div>
        </>
      )}
      
      {showForm && (
        <div className="employer-vacancies__form-overlay">
          <EmployerVacancyForm 
            vacancyId={editingVacancy?.id}
            onClose={handleFormClose}
            onSave={handleFormSave}
          />
        </div>
      )}

      {showDetails && selectedVacancy && (
        <div className="employer-vacancies__details-overlay">
          <EmployerVacancyDetails
            vacancyId={selectedVacancy.id}
            onClose={handleCloseDetails}
            onEdit={() => handleEditVacancy(selectedVacancy)}
          />
        </div>
      )}
      
      {confirmDelete && (
        <div className="employer-vacancies__confirm-overlay">
          <div className="employer-vacancies__confirm-dialog">
            <h3 className="employer-vacancies__confirm-title">Удаление вакансии</h3>
            <p className="employer-vacancies__confirm-message">
              Вы уверены, что хотите удалить эту вакансию? Это действие нельзя отменить.
            </p>
            {error && (
              <div className="employer-vacancies__confirm-error">{error}</div>
            )}
            <div className="employer-vacancies__confirm-actions">
              <button 
                className="employer-vacancies__confirm-btn employer-vacancies__confirm-btn--cancel"
                onClick={() => {
                  setConfirmDelete(null);
                  setError(null);
                }}
                disabled={deleting}
              >
                Отмена
              </button>
              <button 
                className="employer-vacancies__confirm-btn employer-vacancies__confirm-btn--delete"
                onClick={confirmDeleteVacancy}
                disabled={deleting}
              >
                {deleting ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerVacancies; 