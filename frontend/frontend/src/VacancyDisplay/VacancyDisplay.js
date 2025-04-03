import React, { useState, useEffect, useCallback } from "react";
import "./VacancyDisplay.css";
import { API_ENDPOINTS, apiClient, handleApiError, vacancyService } from '../services/api';
import FilterSection from './FilterSection';

function VacancyDisplay({ searchFilters, searchQuery, onFiltersChange }) {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationOptions, setLocationOptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const vacanciesPerPage = 5;

  // Загружаем начальные вакансии
  useEffect(() => {
    fetchVacancies();
  }, []);

  // Функция загрузки вакансий без фильтров
  const fetchVacancies = async () => {
    setLoading(true);
    try {
      const data = await vacancyService.getAllVacancies();
      
      setVacancies(Array.isArray(data) ? data : 
                  (data.vacancies ? data.vacancies : []));
      
      // Получаем уникальные города для выпадающего списка
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

  // Функция для поиска вакансий по фильтрам
  const handleSearch = useCallback(async (filters) => {
    setLoading(true);
    try {
      // Обновляем глобальные фильтры
      const updatedFilters = {
        ...searchFilters,
        keywords: filters.keywords,
        ml_skills: filters.mlSkills,
        experience: filters.experience,
        locations: filters.locations,
        keywordsInTitle: filters.keywordFilter.title,
        keywordsInCompany: filters.keywordFilter.company,
        keywordsInDescription: filters.keywordFilter.description
      };
      
      onFiltersChange(updatedFilters);

      // Если есть ключевые слова, но не выбран ни один чекбокс, не показываем вакансии
      const hasKeywords = filters.keywords?.trim() !== "";
      const hasKeywordFilter = filters.keywordFilter.title || 
                              filters.keywordFilter.company || 
                              filters.keywordFilter.description;

      if (hasKeywords && !hasKeywordFilter) {
        setVacancies([]);
        setLoading(false);
        return;
      }

      // Проверяем, есть ли активные фильтры
      const hasActiveFilters = 
        filters.keywords?.trim() ||
        filters.locations.length > 0 ||
        filters.experience?.trim() ||
        filters.mlSkills?.trim() ||
        searchFilters.salary ||
        searchFilters.schedule ||
        searchQuery?.trim();

      let data;
      if (hasActiveFilters) {
        const searchParams = {
          keywords: filters.keywords?.trim() || undefined,
          region: filters.locations.length ? filters.locations.join(",") : undefined,
          experience: filters.experience?.trim() || undefined,
          salary_from: searchFilters.salary || undefined,
          schedule: searchFilters.schedule || undefined,
          ml_skills: filters.mlSkills?.trim() || undefined,
          query: searchQuery?.trim() || undefined
        };

        // Удаляем пустые параметры
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

        // Только если остались параметры, используем эндпоинт /search
        if (Object.keys(searchParams).length > 0) {
          data = await vacancyService.searchVacancies(searchParams);
        } else {
          // Если все параметры пустые, используем обычный эндпоинт
          data = await vacancyService.getAllVacancies();
        }
      } else {
        // Если нет активных фильтров, загружаем все вакансии
        data = await vacancyService.getAllVacancies();
      }
      
      let filteredData = Array.isArray(data) ? data : (data.vacancies ? data.vacancies : []);

      // Фильтруем по чекбоксам на фронтенде
      if (hasKeywords && hasKeywordFilter) {
        const keywords = filters.keywords.toLowerCase().trim();
        console.log("Пример вакансии:", filteredData[0]);
        filteredData = filteredData.filter(vacancy => {
          const matchesTitle = filters.keywordFilter.title && 
                             vacancy.title.toLowerCase().includes(keywords);
          const matchesCompany = filters.keywordFilter.company && 
                               vacancy.company_name?.toLowerCase().includes(keywords);
          const matchesDescription = filters.keywordFilter.description && 
                                   (vacancy.requirements?.toLowerCase().includes(keywords));
          
          return matchesTitle || matchesCompany || matchesDescription;
        });
      }
      
      setVacancies(filteredData);

      // Сбрасываем на первую страницу при новом поиске
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

  // Фильтрация вакансий
  const filteredVacancies = vacancies;

  // Пагинация
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
            <div key={vacancy.id} className="vacancy-card">
              {searchFilters.ml_skills && vacancy.match_percentage !== undefined && (
                <div className={`match-circle ${getMatchClass(vacancy.match_percentage)}`}>
                  {vacancy.match_percentage}%
                </div>
              )}
              <h2>{vacancy.title}</h2>
              <p>{vacancy.salary_from && vacancy.salary_to
                  ? `${vacancy.salary_from} - ${vacancy.salary_to} ${vacancy.salary_currency}`
                  : "Зарплата не указана"}
              </p>
              <p>{vacancy.location}</p>
              <div className="vacancy-actions">
                <a href={vacancy.vacancy_url} target="_blank" rel="noopener noreferrer">
                  <button className="apply-btn">Откликнуться</button>
                </a>
                <button className="contact-btn">Контакты</button>
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