import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./VacancyDisplay.css";
import { API_ENDPOINTS, apiClient, handleApiError, vacancyService } from '../services/api';
import FilterSection from './FilterSection';

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
      
      if (searchQuery) {
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
                <button 
                  className="apply-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVacancyClick(vacancy.id);
                  }}
                >
                  Откликнуться
                </button>
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
    </div>
  );
}

export default VacancyDisplay;