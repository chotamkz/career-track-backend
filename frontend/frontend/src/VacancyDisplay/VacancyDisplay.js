import React, { useState, useEffect } from "react";
import Select from "react-select";
import makeAnimated from 'react-select/animated';
import "./VacancyDisplay.css";

function VacancyDisplay({ searchFilters, searchQuery, onFiltersChange }) {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keywords, setKeywords] = useState(searchFilters.keywords || "");
  const [experience, setExperience] = useState(searchFilters.experience || ""); 
  const [selectedLocations, setSelectedLocations] = useState(searchFilters.locations || []); 
  const [selectedKeywordFilter, setSelectedKeywordFilter] = useState({
    title: searchFilters.keywordsInTitle || false,
    company: searchFilters.keywordsInCompany || false,
    description: searchFilters.keywordsInDescription || false
  });

  const [locationOptions, setLocationOptions] = useState([]);
  const handleLocationChange = (selectedOptions) => {
    const locations = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setSelectedLocations(locations);
    onFiltersChange({ ...searchFilters, locations });
  };

  useEffect(() => {
      if (selectedLocations.length > 0){
        handleSearch();
      }
    }, [selectedLocations]);

  const vacanciesPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchVacancies = async () => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        if (keywords) queryParams.append("keywords", keywords);
        if (selectedLocations.length) queryParams.append("region", selectedLocations.join(","));
        if (experience) queryParams.append("experience", experience);

        if (searchQuery) queryParams.append("query", searchQuery);

        const response = await fetch("http://localhost:8080/api/v1/vacancies");
        if (!response.ok) throw new Error("Ошибка загрузки вакансий");

        const data = await response.json();
        setVacancies(data);

      const uniqueCities = [
        ...new Set(
          data
            .map((vacancy) => {
              console.log("Vacancy location:", vacancy.location);
              if (!vacancy.location) return null;

              let city = vacancy.location.trim().split(",")[0];


              city = city.replace(/\d+(\.\d+)?/g, "").trim();

              return city;
            })
            .filter((city) => city)
        ),
      ];

      console.log("Extracted unique locations:", uniqueCities);

      setLocationOptions(
        uniqueCities.map((city) => ({ value: city, label: city }))
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  

    fetchVacancies();
  }, []);

  
  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      if (searchFilters.keywords) queryParams.append("keywords", searchFilters.keywords);
      if (selectedLocations.length) queryParams.append("region", selectedLocations.join(","));
      if (searchFilters.experience) queryParams.append("experience", searchFilters.experience);
      if (searchFilters.salary) queryParams.append("salary_from", searchFilters.salary);
      if (searchFilters.schedule) queryParams.append("schedule", searchFilters.schedule);

      if (searchQuery) queryParams.append("query", searchQuery);

      const response = await fetch(`http://localhost:8080/api/v1/vacancies/filter?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Ошибка загрузки вакансий");

      const data = await response.json();
      setVacancies(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isLocationMatch = (vacancy) => {
    if (!vacancy.location || selectedLocations.length === 0) return true;
  
    return selectedLocations.some((selectedCity) =>
      vacancy.location.toLowerCase().includes(selectedCity.toLowerCase())
    );
  };
  
  const filteredVacancies = vacancies.filter((vacancy) => {
    const isKeywordMatch = (vacancyTitle, vacancyCompany, vacancyDescription) => {
      if (!keywords) return true;
      const lowerCaseKeywords = keywords.toLowerCase();
      return (
        (selectedKeywordFilter.title && vacancyTitle?.toLowerCase().includes(lowerCaseKeywords)) ||
        (selectedKeywordFilter.company && vacancyCompany?.toLowerCase().includes(lowerCaseKeywords)) ||
        (selectedKeywordFilter.description && vacancyDescription?.toLowerCase().includes(lowerCaseKeywords))
      );
    };


    return (
       isKeywordMatch(vacancy.title, vacancy.company, vacancy.description) &&
    (experience ? vacancy.experience?.toLowerCase().includes(experience.toLowerCase()) : true) &&
    isLocationMatch(vacancy.location) &&
    (!searchQuery ||
      vacancy.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vacancy.requirements?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  });

  if (loading) return <p id="loadingErr">Загрузка...</p>;
  if (error) return <p id="resultErr">Ошибка: {error}</p>;

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
      <div className="filter-section">
       <h3>Ключевые слова</h3>
        <input
          type="text"
          placeholder="Профессия или должность"
          value={keywords}
          onChange={(e) => {
            setKeywords(e.target.value);
            onFiltersChange({ ...searchFilters, keywords: e.target.value });
          }}
        />
        <label>
          <input
            id="CheckboxkeyWords"
            type="checkbox"
            checked={selectedKeywordFilter.title}
            onChange={(e) => {
              const updated = { ...selectedKeywordFilter, title: e.target.checked };
              setSelectedKeywordFilter(updated);
              onFiltersChange({
                ...searchFilters,
                keywordsInTitle: e.target.checked
              });
            }}
          />{" "}
          В названии вакансии
        </label>
        <label>
          <input
            id="CheckboxkeyWords"
            type="checkbox"
            checked={selectedKeywordFilter.company}
            onChange={(e) => {
              const updated = { ...selectedKeywordFilter, company: e.target.checked };
              setSelectedKeywordFilter(updated);
              onFiltersChange({
                ...searchFilters,
                keywordsInCompany: e.target.checked
              });
            }}
          />{" "}
          В названии компании
        </label>
        <label>
          <input
            id="CheckboxkeyWords"
            type="checkbox"
            checked={selectedKeywordFilter.description}
            onChange={(e) => {
              const updated = { ...selectedKeywordFilter, description: e.target.checked };
              setSelectedKeywordFilter(updated);
              onFiltersChange({
                ...searchFilters,
                keywordsInDescription: e.target.checked
              });
            }}
          />{" "}
          В описании вакансии
        </label>

        <h3>Опыт работы</h3>
        <input
          type="text"
          placeholder="Введите опыт"
          value={experience}
          onChange={(e) => {
            setExperience(e.target.value);
            onFiltersChange({ ...searchFilters, experience: e.target.value });
          }}
        />

        <h3>Локация</h3>
        <Select
          closeMenuOnSelect={false}
          isMulti
          options={locationOptions}
          value={locationOptions.filter(option => selectedLocations.includes(option.value))}
          onChange={handleLocationChange}
          components={makeAnimated()}
          placeholder="Выберите города"
        />
      </div>

      <div className="vacancies-list">
        {currentVacancies.map((vacancy) => (
          <div key={vacancy.id} className="vacancy-card">
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
        ))}
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
