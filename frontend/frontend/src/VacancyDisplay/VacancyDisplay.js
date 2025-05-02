import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./VacancyDisplay.css";
import { API_ENDPOINTS, apiClient, handleApiError, vacancyService } from '../services/api';
import FilterSection from './FilterSection';
import { getUserRole, isAuthenticated } from "../services/authService";

function VacancyDisplay({ searchFilters, searchQuery, onFiltersChange }) {
  const navigate = useNavigate();
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationOptions, setLocationOptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [totalCount, setTotalCount] = useState(0);
  const vacanciesPerPage = 5;
  const [cache, setCache] = useState({});
  // Новые состояния для модальных окон и откликов
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [selectedVacancy, setSelectedVacancy] = useState(null);

  const userRole = getUserRole();
  const isStudent = userRole === "STUDENT";

  // Константа с фиксированными статусами заявок
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
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    fetchVacancies();
  }, [currentPage]);

  useEffect(() => {
    // Вызываем handleSearch при любом изменении searchQuery, включая пустые строки
    handleSearch(searchFilters);
  }, [searchQuery]);

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchVacancies = async () => {
    setLoading(true);
    try {
      if (cache[currentPage]) {
        setVacancies(cache[currentPage]);
        setLoading(false);
        const totalP = Math.ceil(totalCount / vacanciesPerPage);
        if (currentPage < totalP && !cache[currentPage + 1]) {
          apiClient.get(`${API_ENDPOINTS.VACANCIES.GET_ALL}?page=${currentPage + 1}&size=${vacanciesPerPage}`)
            .then(res => setCache(prev => ({ ...prev, [currentPage + 1]: res.data.vacancies })))
            .catch(() => {});
        }
        return;
      }
      const response = await apiClient.get(`${API_ENDPOINTS.VACANCIES.GET_ALL}?page=${currentPage}&size=${vacanciesPerPage}`);
      const data = response.data;
      
      setVacancies(data.vacancies || []);
      setTotalCount(data.totalCount || 0);
      setCache(prev => ({ ...prev, [currentPage]: data.vacancies }));
      const totalP = Math.ceil((data.totalCount || 0) / vacanciesPerPage);
      if (currentPage < totalP) {
        apiClient.get(`${API_ENDPOINTS.VACANCIES.GET_ALL}?page=${currentPage + 1}&size=${vacanciesPerPage}`)
          .then(res => setCache(prev => ({ ...prev, [currentPage + 1]: res.data.vacancies })))
          .catch(() => {});
      }
    } catch (err) {
      setError(err.message || "Ошибка загрузки вакансий");
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const regions = await vacancyService.getRegions();
      const options = regions.map(region => ({ value: region, label: region }));
      setLocationOptions(options);
    } catch (err) {
      console.error("Ошибка при получении списка регионов:", err);
      setLocationOptions([]);
    }
  };

  const handleSearch = useCallback(async (filters) => {
    setLoading(true);
    try {
      const updatedFilters = {
        ...searchFilters,
        keywords: filters.keywords,
        ml_skills: filters.mlSkills,
        experience: filters.experience,
        locations: filters.locations,
        keywordsInTitle: filters.keywordFilter?.title,
        keywordsInCompany: filters.keywordFilter?.company,
        keywordsInDescription: filters.keywordFilter?.description
      };
      
      onFiltersChange(updatedFilters);

      const hasKeywords = filters.keywords?.trim() !== "";
      const hasKeywordFilter = filters.keywordFilter?.title || 
                              filters.keywordFilter?.company || 
                              filters.keywordFilter?.description;

      if (hasKeywords && !hasKeywordFilter) {
        setVacancies([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const hasActiveFilters = 
        filters.keywords?.trim() ||
        (filters.locations && filters.locations.length > 0) ||
        filters.experience?.trim() ||
        filters.mlSkills?.trim() ||
        searchFilters.salary ||
        searchFilters.schedule ||
        (searchQuery && searchQuery.trim() !== "");

      let data;
      if (hasActiveFilters) {
        const searchParams = {
          keywords: filters.keywords?.trim() || undefined,
          region: filters.locations && filters.locations.length ? filters.locations.join(",") : undefined,
          experience: filters.experience?.trim() || undefined,
          salary_from: searchFilters.salary || undefined,
          schedule: searchFilters.schedule || undefined,
          ml_skills: filters.mlSkills?.trim() || undefined,
          query: searchQuery || undefined,
          page: currentPage,
          size: vacanciesPerPage
        };

        Object.keys(searchParams).forEach(key => {
          if (
            searchParams[key] === undefined || 
            searchParams[key] === "" || 
            (Array.isArray(searchParams[key]) && searchParams[key].length === 0)
          ) {
            delete searchParams[key];
          }
        });

        console.log("Поисковый запрос:", searchParams);

        if (Object.keys(searchParams).length > 0) {
          const response = await apiClient.get(`${API_ENDPOINTS.VACANCIES.SEARCH}?${new URLSearchParams(searchParams)}`);
          data = response.data;
        } else {
          const response = await apiClient.get(`${API_ENDPOINTS.VACANCIES.GET_ALL}?page=${currentPage}&size=${vacanciesPerPage}`);
          data = response.data;
        }
      } else {
        const response = await apiClient.get(`${API_ENDPOINTS.VACANCIES.GET_ALL}?page=${currentPage}&size=${vacanciesPerPage}`);
        data = response.data;
      }
      
      setVacancies(data.vacancies || []);
      setTotalCount(data.totalCount || 0);

      if (hasKeywords && hasKeywordFilter) {
        const keywords = filters.keywords.toLowerCase().trim();
        console.log("Пример вакансии:", data.vacancies[0]);
        const filteredData = (data.vacancies || []).filter(vacancy => {
          const matchesTitle = filters.keywordFilter?.title && 
                             vacancy.title?.toLowerCase().includes(keywords);
          const matchesCompany = filters.keywordFilter?.company && 
                               vacancy.company_name?.toLowerCase().includes(keywords);
          const matchesDescription = filters.keywordFilter?.description && 
                                   ((vacancy.requirements?.toLowerCase() || '').includes(keywords) ||
                                    (vacancy.description?.toLowerCase() || '').includes(keywords));
          
          return matchesTitle || matchesCompany || matchesDescription;
        });
        
        setVacancies(filteredData);
        setTotalCount(filteredData.length);
      }
      
      if (searchQuery !== undefined) {
        if (searchQuery.trim() !== "") {
          const query = searchQuery.toLowerCase().trim();
          const filteredData = (data.vacancies || []).filter(vacancy => 
            vacancy.title?.toLowerCase().includes(query) || 
            vacancy.company_name?.toLowerCase().includes(query) || 
            vacancy.description?.toLowerCase().includes(query) || 
            vacancy.requirements?.toLowerCase().includes(query)
          );
          
          setVacancies(filteredData);
          setTotalCount(filteredData.length);
        }
      }

      setCurrentPage(1);
    } catch (err) {
      console.error("Ошибка поиска вакансий:", err);
      setError(err.message || "Ошибка загрузки вакансий");
    } finally {
      setLoading(false);
    }
  }, [searchFilters, searchQuery, onFiltersChange, currentPage, vacanciesPerPage]);

  const getMatchClass = (percentage) => {
    if (percentage >= 75) return 'high';
    if (percentage >= 40) return 'medium';
    return 'low';
  };

  const getMatchText = (percentage) => {
    if (percentage >= 75) return 'Отличное соответствие';
    if (percentage >= 40) return 'Среднее соответствие';
    return 'Низкое соответствие';
  };

  // Используем серверную пагинацию, не нужно делить на страницы на клиенте
  const currentVacancies = vacancies;

  // Рассчитываем общее количество страниц на основе totalCount с сервера
  const totalPages = Math.ceil(totalCount / vacanciesPerPage);
  const pagesToShow = 10;
  const startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
  const endPage = Math.min(totalPages, startPage + pagesToShow - 1);
  
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleVacancyClick = (vacancyId) => {
    navigate(`/vacancies/${vacancyId}`);
  };

  // Открыть модальное окно отклика для конкретной вакансии
  const openApplyModal = (vacancy, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (!isAuthenticated()) {
      setShowLoginModal(true);
      setSelectedVacancy(vacancy);
      return;
    }
    
    if (!isStudent) {
      alert("Только студенты могут откликаться на вакансии");
      return;
    }
    
    if (vacancy.applied) {
      alert("Вы уже откликнулись на эту вакансию");
      return;
    }
    
    setSelectedVacancy(vacancy);
    setShowApplyModal(true);
  };

  // Закрыть модальное окно авторизации
  const closeLoginModal = () => {
    setShowLoginModal(false);
    setSelectedVacancy(null);
  };

  // Перенаправление на страницу регистрации
  const handleRedirectToRegister = () => {
    navigate('/auth/student/register');
    closeLoginModal();
  };

  // Перенаправление на страницу входа
  const handleRedirectToLogin = () => {
    navigate('/auth/student');
    closeLoginModal();
  };

  // Закрыть модальное окно отклика
  const closeApplyModal = () => {
    setShowApplyModal(false);
    setSelectedVacancy(null);
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
      const result = await vacancyService.applyToVacancy(selectedVacancy.id, coverLetter);
      
      if (result.error) {
        if (result.error.includes("already applied")) {
          setApplyError("Вы уже откликнулись на эту вакансию.");
          return;
        }
        throw new Error(result.error);
      }
      
      setApplySuccess(true);
      
      // Обновляем статус применения в локальном состоянии
      const updatedVacancies = vacancies.map(v => {
        if (v.id === selectedVacancy.id) {
          return { ...v, applied: true };
        }
        return v;
      });
      setVacancies(updatedVacancies);
      
      // Обновляем кэш
      if (cache[currentPage]) {
        setCache({
          ...cache,
          [currentPage]: cache[currentPage].map(v => {
            if (v.id === selectedVacancy.id) {
              return { ...v, applied: true };
            }
            return v;
          })
        });
      }
    } catch (err) {
      setApplyError(err.message || "Произошла ошибка при отклике на вакансию");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="vacancy-display">
      <FilterSection
        initialKeywords={searchFilters.keywords || ""}
        initialMlSkills={searchFilters.ml_skills || ""}
        initialExperience={searchFilters.experience || ""}
        initialSelectedLocations={searchFilters.locations || []}
        initialKeywordFilter={{
          title: searchFilters.keywordsInTitle || false,
          company: searchFilters.keywordsInCompany || false,
          description: searchFilters.keywordsInDescription || false
        }}
        locationOptions={locationOptions}
        onSearch={handleSearch}
      />

      <div className="vacancies-list">
        {loading ? (
          <p id="loadingErr">Загрузка...</p>
        ) : error ? (
          <p id="resultErr">Ошибка: {error}</p>
        ) : currentVacancies.length === 0 ? (
          <p id="resultErr">Вакансии не найдены</p>
        ) : (
          currentVacancies.map((vacancy) => (
            <div key={vacancy.id} className="vacancy-card" onClick={() => handleVacancyClick(vacancy.id)}>
              {searchFilters.ml_skills && vacancy.match_percentage !== undefined && (
                <div className="match-indicator">
                <div className={`match-circle ${getMatchClass(vacancy.match_percentage)}`}>
                  {vacancy.match_percentage}%
                  </div>
                  <span className={`match-text ${getMatchClass(vacancy.match_percentage)}`}>
                    {getMatchText(vacancy.match_percentage)}
                  </span>
                </div>
              )}
              <h2>{vacancy.title}</h2>
              
              <div className="vacancy-details">
                <p className="salary">
                  {vacancy.salary_from && vacancy.salary_to
                  ? `${vacancy.salary_from} - ${vacancy.salary_to} ${vacancy.salary_currency}`
                  : "Зарплата не указана"}
              </p>
                
                <div className="vacancy-meta-info">
                  {vacancy.location && (
                    <p className="location">{vacancy.location}</p>
                  )}
                  
                  {vacancy.work_schedule && (
                    <p className="schedule">{vacancy.work_schedule}</p>
                  )}
                  
                  {vacancy.experience && (
                    <div className="experience">{vacancy.experience}</div>
                  )}
                </div>
              </div>
              
              {searchFilters.ml_skills && vacancy.matching_skills && vacancy.missing_skills && (
                <div className="skills-match-container">
                  <div className="match-info">
                    <div className="match-score">
                      <div className="match-label">Соответствие навыков</div>
                      <div className="match-value">{vacancy.skills_matched} из {vacancy.total_skills_required}</div>
                    </div>
                    <div className="similarity-score">
                      <div className="similarity-label">Индекс схожести</div>
                      <div className="similarity-value">{(vacancy.similarity_score * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                  
                  <div className="skills-lists">
                    {vacancy.matching_skills.length > 0 && (
                      <div className="matching-skills">
                        <div className="skills-title">Совпадающие навыки:</div>
                        <div className="skills-tags">
                          {vacancy.matching_skills.map((skill, index) => (
                            <div key={index} className="skill-tag matching">{skill}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {vacancy.missing_skills.length > 0 && (
                      <div className="missing-skills">
                        <div className="skills-title">Недостающие навыки:</div>
                        <div className="skills-tags">
                          {vacancy.missing_skills.map((skill, index) => (
                            <div key={index} className="skill-tag missing">{skill}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {vacancy.skills && vacancy.skills.length > 0 && !searchFilters.ml_skills && (
                <div className="vacancy-skills">
                  {vacancy.skills.slice(0, 3).map((skill, index) => (
                    <div key={index} className="vacancy-skill-tag">{skill}</div>
                  ))}
                  {vacancy.skills.length > 3 && (
                    <div className="vacancy-skill-more">+{vacancy.skills.length - 3}</div>
                  )}
                </div>
              )}
              
              <div className="vacancy-actions">
                {isStudent && vacancy.applied ? (
                  <div className="already-applied-badge">
                    <span className="applied-icon">✓</span>
                    <span>Вы откликнулись</span>
                  </div>
                ) : (
                  <button 
                    className="apply-btn"
                    onClick={(e) => openApplyModal(vacancy, e)}
                  >
                    Откликнуться
                  </button>
                )}
                <button 
                  className="contact-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVacancyClick(vacancy.id);
                  }}
                >
                  Подробнее
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pagination-container">
        <div className="pagination">
          <button className="pagination-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
            &lt;
          </button>

          {startPage > 1 && (
            <>
              <button className="pagination-btn" onClick={() => goToPage(1)}>
                1
              </button>
              {startPage > 2 && <span className="dots">...</span>}
            </>
          )}

          {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => {
            const isMobileHidden = (
              windowWidth <= 480 && 
              page !== currentPage && 
              page !== startPage && 
              page !== endPage && 
              page !== 1 && 
              page !== totalPages &&
              Math.abs(page - currentPage) > 1
            );
            
            return (
              <button 
                key={page} 
                onClick={() => goToPage(page)} 
                className={`pagination-btn ${currentPage === page ? "active" : ""} ${isMobileHidden ? "mobile-hide" : ""}`}
              >
              {page}
            </button>
            );
          })}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="dots">...</span>}
              <button className="pagination-btn" onClick={() => goToPage(totalPages)}>
                {totalPages}
              </button>
            </>
          )}

          <button className="pagination-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
            &gt;
          </button>
        </div>
      </div>

      {/* Модальное окно для авторизации */}
      {showLoginModal && (
        <div className="modal-overlay">
          <div className="apply-modal">
            <div className="modal-header">
              <h3>Требуется авторизация</h3>
              <button className="close-modal" onClick={closeLoginModal}>×</button>
            </div>
            
            <div className="login-required-content">
              <div className="login-icon">👨‍💻</div>
              <h4>Для отклика на вакансию требуется авторизация</h4>
              <p>
                Чтобы откликнуться на эту вакансию, вам необходимо войти или зарегистрироваться 
                как студент.
              </p>
              
              <div className="login-options">
                <button 
                  className="modal-button primary" 
                  onClick={handleRedirectToLogin}
                >
                  Войти
                </button>
                <button 
                  className="modal-button secondary register-btn" 
                  onClick={handleRedirectToRegister}
                >
                  Зарегистрироваться
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для отклика на вакансию */}
      {showApplyModal && selectedVacancy && (
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
            ) : (
              <>
                <div className="modal-content">
                  <div className="vacancy-title-small">
                    <strong>Вакансия:</strong> {selectedVacancy.title}
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
}

export default VacancyDisplay;