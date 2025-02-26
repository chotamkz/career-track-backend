import React, { useState, useEffect } from "react";
import "./VacancyDisplay.css";

function VacancyDisplay ({ searchFilters, searchQuery }) {
  const [vacancies, setVacancies] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [specialty, setSpecialty] = useState("");
  const [keywords, setKeywords] = useState("");
  const [skills, setSkills] = useState("");
  const [selectedLocations, setSelectedLocation] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const vacanciesPerPage = 5;

  useEffect(() => {
    const fetchVacancies = async () => {
      setLoading(true);
      setError(null);
  
      try {
        const queryParams = new URLSearchParams();
        if (searchFilters.keywords) queryParams.append("keywords", searchFilters.keywords);
        if (searchFilters.specialty) queryParams.append("specialty", searchFilters.specialty);
        if (searchFilters.skills) queryParams.append("skills", searchFilters.skills);
        if (searchFilters.locations.length > 0) queryParams.append("locations", searchFilters.locations.join(","));

        if (searchQuery) queryParams.append("query", searchQuery);
  
        const response = await fetch(`http://localhost:8080/api/v1/vacancies?${queryParams.toString()}`);
        if (!response.ok) throw new Error("Ошибка загрузки вакансий");
        
        const data = await response.json();
        setVacancies(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchVacancies();
  }, [searchFilters, searchQuery]);

  // const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <p id="loadingErr">Загрузка...</p>;
  if (error) return <p id="resultErr">Ошибка: {error}</p>;

  const indexOfLastVacancy = currentPage * vacanciesPerPage;
  const indexOfFirstVacancy = indexOfLastVacancy - vacanciesPerPage;
  const currentVacancies = vacancies.slice(indexOfFirstVacancy, indexOfLastVacancy);

  const pagesToShow = 10;
  const totalPages = Math.ceil(vacancies.length / vacanciesPerPage);
  const startPage = Math.max(1, currentPage - Math.floor(pagesToShow/2));
  const endPage = Math.min(totalPages, startPage + pagesToShow - 1);
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="vacancy-display">
      <div className="filter-section">
        <h3>Ключевые слова</h3>
        <input type="text" 
         placeholder="Профессия или должность"
         value={keywords} 
         onChange={(e) => setKeywords(e.target.value)}/>
        <label>
          <input id="CheckboxkeyWords" type="checkbox" /> В названии вакансии
        </label>
        <label>
          <input id="CheckboxkeyWords" type="checkbox" /> В названии компании
        </label>
        <label>
          <input id="CheckboxkeyWords" type="checkbox" /> В названии описания
        </label>

        <h3>Тип работы</h3>
        <select id="selectType"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className={!specialty ? "placeholder" : ""}
        >
          <option value="backend">Backend</option>
          <option value="frontend">Frontend</option>
          <option value="UI/UX">UI/UX</option>
          <option value="Data">Data</option>
        </select>

        <h3>Навыки</h3>
        <input type="text" 
        placeholder="Введите ваши навыки"
        value={skills}
        onChange={(e) => setSkills(e.target.value)}
        />

        <h3>Локация</h3>
        <label>
          <input id="locationCheckbox" 
          type="checkbox" 
          checked={selectedLocations.includes("Алматы")}
          onChange={(e) => {
            setSelectedLocation(prev =>
              e.target.checked ? [...prev, "Алматы"] : prev.filter(loc => loc !== "Алматы")
            );
          }}
          /> Алматы
        </label>

        <label>
          <input id="locationCheckbox"
          type="checkbox" 
          checked={selectedLocations.includes("Астана")}
          onChange={(e) => {
            setSelectedLocation(prev =>
              e.target.checked ? [...prev, "Астана"] : prev.filter(loc => loc !== "Астана")
            )
          }}
          /> Астана
        </label>

        <label>
          <input id="locationCheckbox" 
          type="checkbox"
          checked={selectedLocations.includes("Караганда")}
          onChange={(e) => {
            setSelectedLocation(prev =>
              e.target.checked ? [...prev, "Караганда"] : prev.filter(loc => loc !== "Караганда")
            )
          }}
          /> Караганда
        </label>
      </div>

      <div className="vacancies-list">
      {currentVacancies.map((vacancy) => (
          <div key={vacancy.id} className="vacancy-card">
            <h2>{vacancy.title}</h2>
            <p id="vacancy-salary">
              {vacancy.salary_from && vacancy.salary_to
                ? `${vacancy.salary_from} - ${vacancy.salary_to} ${vacancy.salary_currency}`
                : "Зарплата не указана"}
            </p>
            <p>{vacancy.location}</p>
            <p>{vacancy.description}</p>

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
          <button 
            className="pagination-btn" 
            onClick={() => goToPage(currentPage - 1)} 
            disabled={currentPage === 1}
          >
            &lt;
          </button>

          {startPage > 1 && (
            <>
              <button className="pagination-btn" onClick={() => goToPage(1)}>1</button>
              {startPage > 2 && <span className="dots">...</span>}
            </>
          )}

          {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`pagination-btn ${currentPage === page ? "active" : ""}`}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="dots">...</span>}
              <button className="pagination-btn" onClick={() => goToPage(totalPages)}>{totalPages}</button>
            </>
          )}

          <button 
            className="pagination-btn" 
            onClick={() => goToPage(currentPage + 1)} 
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
export default VacancyDisplay;

