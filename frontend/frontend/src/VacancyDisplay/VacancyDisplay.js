import React, { useState, useEffect } from "react";
import "./VacancyDisplay.css";

function VacancyDisplay({ searchFilters, searchQuery, onFiltersChange }) {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const vacanciesPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchVacancies = async () => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        // Add filters to the query string
        if (searchFilters.keywords) queryParams.append("keywords", searchFilters.keywords);
        if (searchFilters.location) queryParams.append("region", searchFilters.location);
        if (searchFilters.experience) queryParams.append("experience", searchFilters.experience);
        if (searchFilters.salary) queryParams.append("salary_from", searchFilters.salary);
        if (searchFilters.schedule) queryParams.append("schedule", searchFilters.schedule);

        // Add search query if present
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

    fetchVacancies();
  }, [searchFilters, searchQuery]);

  const filteredVacancies = vacancies.filter((vacancy) => {
    return (
      (!searchFilters.keywords || vacancy.title.toLowerCase().includes(searchFilters.keywords.toLowerCase())) &&
      (!searchFilters.location || vacancy.location.toLowerCase().includes(searchFilters.location.toLowerCase())) &&
      (!searchFilters.experience || vacancy.experience.toLowerCase().includes(searchFilters.experience.toLowerCase())) &&
      (!searchFilters.salary || vacancy.salary_from >= searchFilters.salary) &&
      (!searchFilters.schedule || vacancy.schedule.toLowerCase().includes(searchFilters.schedule.toLowerCase())) &&
      (!searchQuery ||
        vacancy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vacancy.requirements.toLowerCase().includes(searchQuery.toLowerCase())
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
      {/* Filter section */}
      <div className="filter-section">
        {/* Filters (e.g., keywords, location, experience, etc.) */}
        <h3>Ключевые слова</h3>
        <input
          type="text"
          placeholder="Профессия или должность"
          value={searchFilters.keywords}
          onChange={(e) => {
            onFiltersChange({ ...searchFilters, keywords: e.target.value });
          }}
        />

        <h3>Локация</h3>
        <input
          type="text"
          placeholder="Локация"
          value={searchFilters.location}
          onChange={(e) => {
            onFiltersChange({ ...searchFilters, location: e.target.value });
          }}
        />

        <h3>Опыт работы</h3>
        <input
          type="text"
          placeholder="Опыт работы"
          value={searchFilters.experience}
          onChange={(e) => {
            onFiltersChange({ ...searchFilters, experience: e.target.value });
          }}
        />

        <h3>Зарплата</h3>
        <input
          type="number"
          placeholder="Минимальная зарплата"
          value={searchFilters.salary}
          onChange={(e) => {
            onFiltersChange({ ...searchFilters, salary: e.target.value });
          }}
        />

        <h3>График работы</h3>
        <input
          type="text"
          placeholder="График работы"
          value={searchFilters.schedule}
          onChange={(e) => {
            onFiltersChange({ ...searchFilters, schedule: e.target.value });
          }}
        />
      </div>

      {/* Display vacancies */}
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

      {/* Pagination */}
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



// import React, { useState, useEffect } from "react";
// // import he from "he";
// import "./VacancyDisplay.css";

// function VacancyDisplay ({ searchFilters, searchQuery, onFiltersChange }) {
//   const [vacancies, setVacancies] = useState([]); 
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [keywords, setKeywords] = useState("");
//   const [skills, setSkills] = useState("");
//   const [selectedLocations, setSelectedLocation] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const vacanciesPerPage = 5;

//   useEffect(() => {
//     const fetchVacancies = async () => {
//       setLoading(true);
//       setError(null);
      
//       try {
//         const queryParams = new URLSearchParams();
//         if (searchFilters.keywords) queryParams.append("keywords", searchFilters.keywords);
//         if (searchFilters.skills) queryParams.append("skills", searchFilters.skills);
//         if (searchFilters.locations.length > 0) queryParams.append("locations", searchFilters.locations.join(","));

//         if (searchQuery) queryParams.append("query", searchQuery);
  
//         const response = await fetch(`http://localhost:8080/api/v1/vacancies?${queryParams.toString()}`);
//         if (!response.ok) throw new Error("Ошибка загрузки вакансий");
        
//         const data = await response.json();
//         setVacancies(data);
//       } catch (err) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };
  
//     fetchVacancies();
//   }, [searchFilters, searchQuery]);

//   if (loading) return <p id="loadingErr">Загрузка...</p>;
//   if (error) return <p id="resultErr">Ошибка: {error}</p>;

//   const filteredVacancies = vacancies.filter(vacancy => {
//     return (
//       (!searchFilters.keywords || vacancy.title.toLowerCase().includes(searchFilters.keywords.toLowerCase())) &&
//       (!searchFilters.skills || vacancy.requirements.toLowerCase().includes(searchFilters.skills.toLowerCase())) &&
//       (!searchFilters.locations.length || searchFilters.locations.includes(vacancy.location)) &&
//       (!searchQuery ||
//         vacancy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         vacancy.requirements.toLowerCase().includes(searchQuery.toLowerCase())
//       )
//     );
//   });

//   if (loading) return <p id="loadingErr">Загрузка...</p>;
//   if (error) return <p id="resultErr">Ошибка: {error}</p>;

//   const indexOfLastVacancy = currentPage * vacanciesPerPage;
//   const indexOfFirstVacancy = indexOfLastVacancy - vacanciesPerPage;
//   const currentVacancies = vacancies.slice(indexOfFirstVacancy, indexOfLastVacancy);

//   const pagesToShow = 10;
//   const totalPages = Math.ceil(filteredVacancies.length / vacanciesPerPage);
//   const startPage = Math.max(1, currentPage - Math.floor(pagesToShow/2));
//   const endPage = Math.min(totalPages, startPage + pagesToShow - 1);
//   const goToPage = (page) => {
//     if (page >= 1 && page <= totalPages) setCurrentPage(page);
//   };

//   return (
//     <div className="vacancy-display">
//       <div className="filter-section">
//         <h3>Ключевые слова</h3>
//         <input type="text" 
//          placeholder="Профессия или должность"
//          value={keywords} 
//          onChange={(e) => {
//          setKeywords(e.target.value);
//          onFiltersChange({ ...searchFilters, keywords: e.target.value });
//         }}/>
//         <label>
//           <input id="CheckboxkeyWords" type="checkbox" /> В названии вакансии
//         </label>
//         <label>
//           <input id="CheckboxkeyWords" type="checkbox" /> В названии компании
//         </label>
//         <label>
//           <input id="CheckboxkeyWords" type="checkbox" /> В названии описания
//         </label>

//         <h3>Навыки</h3>
//         <input type="text" 
//         placeholder="Введите ваши навыки"
//         value={skills}
//         onChange={(e) => { 
//           setSkills(e.target.value);
//           onFiltersChange({ ...searchFilters, skills: e.target.value });
//         }}
//         />

//         <h3>Локация</h3>
//         <label>
//           <input id="locationCheckbox" 
//           type="checkbox" 
//           checked={selectedLocations.includes("Алматы")}
//           onChange={(e) => {
//             const updatedLocations = e.target.checked
//               ? [...searchFilters.locations, "Алматы"]
//               : searchFilters.locations.filter(loc => loc !== "Алматы");
      
//             onFiltersChange({ ...searchFilters, locations: updatedLocations });
//           }}
//         /> Алматы
//         </label>

//         <label>
//           <input id="locationCheckbox"
//           type="checkbox" 
//           checked={selectedLocations.includes("Астана")}
//           onChange={(e) => {
//             const updatedLocations = e.target.checked
//               ? [...searchFilters.locations, "Астана"]
//               : searchFilters.locations.filter(loc => loc !== "Астана");
      
//             onFiltersChange({ ...searchFilters, locations: updatedLocations });
//           }}
//           /> Астана
//         </label>

//         <label>
//           <input id="locationCheckbox" 
//           type="checkbox"
//           checked={selectedLocations.includes("Караганда")}
//           onChange={(e) => {
//             const updatedLocations = e.target.checked
//               ? [...searchFilters.locations, "Караганда"]
//               : searchFilters.locations.filter(loc => loc !== "Караганда");
      
//             onFiltersChange({ ...searchFilters, locations: updatedLocations });
//           }}
//           /> Караганда
//         </label>
//       </div>

//       <div className="vacancies-list">
//       {currentVacancies.map((vacancy) => (
//           <div key={vacancy.id} className="vacancy-card">
//             <h2>{vacancy.title}</h2>
//             <p id="vacancy-salary">
//               {vacancy.salary_from && vacancy.salary_to
//                 ? `${vacancy.salary_from} - ${vacancy.salary_to} ${vacancy.salary_currency}`
//                 : "Зарплата не указана"}
//             </p>
//             <p>{vacancy.location}</p>
//             {/* <div dangerouslySetInnerHTML={{__html: he.decode(vacancy.description) }} />
//             <p>{(vacancy.description)}</p> */}

//             <div className="vacancy-actions">
//               <a href={vacancy.vacancy_url} target="_blank" rel="noopener noreferrer">
//                 <button className="apply-btn">Откликнуться</button>
//               </a>
//               <button className="contact-btn">Контакты</button>
//             </div>
//           </div>
//         ))}
//       </div>
//       <div className="pagination-container">
//         <div className="pagination">
//           <button 
//             className="pagination-btn" 
//             onClick={() => goToPage(currentPage - 1)} 
//             disabled={currentPage === 1}
//           >
//             &lt;
//           </button>

//           {startPage > 1 && (
//             <>
//               <button className="pagination-btn" onClick={() => goToPage(1)}>1</button>
//               {startPage > 2 && <span className="dots">...</span>}
//             </>
//           )}

//           {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
//             <button
//               key={page}
//               onClick={() => goToPage(page)}
//               className={`pagination-btn ${currentPage === page ? "active" : ""}`}
//             >
//               {page}
//             </button>
//           ))}

//           {endPage < totalPages && (
//             <>
//               {endPage < totalPages - 1 && <span className="dots">...</span>}
//               <button className="pagination-btn" onClick={() => goToPage(totalPages)}>{totalPages}</button>
//             </>
//           )}

//           <button 
//             className="pagination-btn" 
//             onClick={() => goToPage(currentPage + 1)} 
//             disabled={currentPage === totalPages}
//           >
//             &gt;
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
// export default VacancyDisplay;

