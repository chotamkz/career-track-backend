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
  const vacanciesPerPage = 5;

  useEffect(() => {
    fetchVacancies();
  }, []);

  useEffect(() => {
    handleSearch(searchFilters);
  }, [searchQuery]);

  const fetchVacancies = async () => {
    setLoading(true);
    try {
      const data = await vacancyService.getAllVacancies();
      
      setVacancies(Array.isArray(data) ? data : 
                  (data.vacancies ? data.vacancies : []));
      
      const uniqueCities = [
        ...new Set(
          (Array.isArray(data) ? data : (data.vacancies ? data.vacancies : []))
            .map((vacancy) => {
              if (!vacancy.location) return null;
              let city = vacancy.location.trim().split(",")[0];
              city = city.replace(/\d+(\.\d+)?/g, "").trim();
              return city;
            })
            .filter((city) => city)
        ),
      ];

      setLocationOptions(
        uniqueCities.map((city) => ({ value: city, label: city }))
      );
    } catch (err) {
      setError(err.message || "Ошибка загрузки вакансий");
    } finally {
      setLoading(false);
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
          query: searchQuery || undefined
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
          data = await vacancyService.searchVacancies(searchParams);
        } else {
          data = await vacancyService.getAllVacancies();
        }
      } else {
        data = await vacancyService.getAllVacancies();
      }
      
      let filteredData = Array.isArray(data) ? data : (data.vacancies ? data.vacancies : []);

      if (hasKeywords && hasKeywordFilter) {
        const keywords = filters.keywords.toLowerCase().trim();
        console.log("Пример вакансии:", filteredData[0]);
        filteredData = filteredData.filter(vacancy => {
          const matchesTitle = filters.keywordFilter?.title && 
                             vacancy.title?.toLowerCase().includes(keywords);
          const matchesCompany = filters.keywordFilter?.company && 
                               vacancy.company_name?.toLowerCase().includes(keywords);
          const matchesDescription = filters.keywordFilter?.description && 
                                   ((vacancy.requirements?.toLowerCase() || '').includes(keywords) ||
                                    (vacancy.description?.toLowerCase() || '').includes(keywords));
          
          return matchesTitle || matchesCompany || matchesDescription;
        });
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        filteredData = filteredData.filter(vacancy => 
          vacancy.title?.toLowerCase().includes(query) || 
          vacancy.company_name?.toLowerCase().includes(query) || 
          vacancy.description?.toLowerCase().includes(query) || 
          vacancy.requirements?.toLowerCase().includes(query)
        );
      }
      
      setVacancies(filteredData);

      setCurrentPage(1);
    } catch (err) {
      console.error("Ошибка поиска вакансий:", err);
      setError(err.message || "Ошибка загрузки вакансий");
    } finally {
      setLoading(false);
    }
  }, [searchFilters, searchQuery, onFiltersChange]);

  const getMatchClass = (percentage) => {
    if (percentage >= 70) return 'high';
    if (percentage >= 40) return 'medium';
    return 'low';
  };

  const filteredVacancies = vacancies;

  const indexOfLastVacancy = currentPage * vacanciesPerPage;
  const indexOfFirstVacancy = indexOfLastVacancy - vacanciesPerPage;
  const currentVacancies = filteredVacancies.slice(indexOfFirstVacancy, indexOfLastVacancy);

  const pagesToShow = 10;
  const totalPages = Math.ceil(filteredVacancies.length / vacanciesPerPage);
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
                <div className={`match-circle ${getMatchClass(vacancy.match_percentage)}`}>
                  {vacancy.match_percentage}%
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
              
              {vacancy.skills && vacancy.skills.length > 0 && (
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
                <a 
                  href={vacancy.vacancy_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button className="apply-btn">Откликнуться</button>
                </a>
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

          {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
            <button key={page} onClick={() => goToPage(page)} className={`pagination-btn ${currentPage === page ? "active" : ""}`}>
              {page}
            </button>
          ))}

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