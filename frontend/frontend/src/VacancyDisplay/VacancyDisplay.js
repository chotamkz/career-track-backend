import React, { useState, useEffect } from "react";
import "./VacancyDisplay.css";

function VacancyDisplay() {
  const [vacancies, setVacancies] = useState([]); // ✅ Используем множественное число
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [specialty, setSpecialty] = useState("");

  useEffect(() => {
    const fetchVacancies = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/v1/vacancies");
        if (!response.ok) throw new Error("Ошибка загрузки вакансий");
        const data = await response.json();
        setVacancies(data); // ✅ Сохраняем массив вакансий
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVacancies();
  }, []);

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p>Ошибка: {error}</p>;

  return (
    <div className="vacancy-display">
      <div className="filter-section">
        <h3>Ключевые слова</h3>
        <input type="text" placeholder="Профессия или должность" />
        <label>
          <input type="checkbox" /> В названии вакансии
        </label>
        <label>
          <input type="checkbox" /> В названии компании
        </label>
        <label>
          <input type="checkbox" /> В названии описания
        </label>

        <h3>Тип работы</h3>
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className={!specialty ? "placeholder" : ""}
        >
          <option value="IT">IT</option>
          <option value="Медицина">Медицина</option>
          <option value="Образование">Образование</option>
          <option value="">Сбросить</option>
        </select>

        <h3>Навыки</h3>
        <input type="text" placeholder="Введите ваши навыки" />

        <h3>Локация</h3>
        <label>
          <input type="checkbox" /> Алматы
        </label>
        <label>
          <input type="checkbox" /> Астана
        </label>
        <label>
          <input type="checkbox" /> Караганда
        </label>
      </div>

      {/* ✅ Используем map() для отображения всех вакансий */}
      <div className="vacancies-list">
        {vacancies.map((vacancy) => (
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
    </div>
  );
}

export default VacancyDisplay;

// import React, { useState, useEffect } from "react";
// import { useParams } from "react-router-dom";
// import "./VacancyDisplay.css";

// const vacancies = [
//     {
//       title: "Стажер в компанию",
//       salary: "70 000 – 120 000 ₸ за месяц, на руки",
//       company: "ИП Александр Александр",
//       location: "Алматы",
//     },
//     {
//       title: "Стажер в компанию",
//       salary: "70 000 – 120 000 ₸ за месяц, на руки",
//       company: "ИП Александр Александр",
//       location: "Алматы",
//     },
//     {
//       title: "Стажер в компанию",
//       salary: "70 000 – 120 000 ₸ за месяц, на руки",
//       company: "ИП Александр Александр",
//       location: "Алматы",
//     },
//     {
//       title: "Стажер в компанию",
//       salary: "70 000 – 120 000 ₸ за месяц, на руки",
//       company: "ИП Александр Александр",
//       location: "Алматы",
//     },
//   ];
  
//   function VacancyDisplay() {
//     const [specialty, setSpecialty] = useState("");
//     const [activePage, setActivePage] = useState(1);

//     const handlePageClick = (page) => {
//         setActivePage(page)
//     };
    
//     return (
//       <div className="vacancy-display">
//         <div className="filter-section">
//           <h3>Ключевые слова</h3>
//           <input type="text" placeholder="Профессия или должность" />
//           <label>
//             <input id="keyWordsCheckbox" type="checkbox"/> В названии вакансии
//           </label>
//           <label>
//             <input id="keyWordsCheckbox" type="checkbox"/> В названии компании
//           </label>
//           <label>
//             <input id="keyWordsCheckbox" type="checkbox"/> В названии описания
//           </label>
  
//           <h3>Тип работы</h3>
//           <select id="selectType"
//           value={specialty}
//           onChange={(e) => setSpecialty(e.target.value)}
//           className={!specialty ? "placeholder" : ""}
//           >
//             <option className="optionVacancy" value="IT">IT</option>
//             <option className="optionVacancy" value="Медицина">Медицина</option>
//             <option className="optionVacancy" value="Образование">Образование</option>
//             <option className="optionVacancy" value="">Сбросить</option>
//             {!specialty && <span className="select-placeholder">Выбрать</span>}
//           </select>
  
//           <h3>Навыки</h3>
//           <input type="text" placeholder="Введите ваши навыки" />
  
//           <h3>Локация</h3>
//           <label>
//             <input id="locationCheckbox" type="checkbox"/> Алматы
//           </label>
//           <label>
//             <input id="locationCheckbox" type="checkbox"/> Алматы
//           </label>
//           <label>
//             <input id="locationCheckbox" type="checkbox"/> Алматы
//           </label>
//         </div>
  
    
//         <div className="vacancies-section">
//           {vacancies.map((vacancy, index) => (
//             <div key={index} className="vacancy-card">
//               <h2>{vacancy.title}</h2>
//               <p id="vacancy-salary">{vacancy.salary}</p>
//               <p>{vacancy.company}</p>
//               <p>{vacancy.location}</p>
  
//               <div className="vacancy-actions">
//                 <button className="apply-btn">Откликнуться</button>
//                 <button className="contact-btn">Контакты</button>
//               </div>
//             </div>
//           ))}

//           <div className="pagination">
//           <button className="page-btn" 
//             onClick={() => handlePageClick(activePage > 1 ? activePage - 1 : 1)}
//           >
//             {"<"}
//           </button>
//           {[1, 2, "...", 10].map((page, index) => (
//             <button
//               key={index}
//               className={`page-btn ${page === activePage ? "active" : ""}`}
//               onClick={() => typeof page === "number" && handlePageClick(page)}
//               disabled={page === "..."} // Disable ellipsis button
//             >
//               {page}
//             </button>
//           ))}

//         <button
//         className="page-btn"
//             onClick={() => handlePageClick(activePage < 10 ? activePage +1 : 10)}
//         >
//         {">"}
//         </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

// export default VacancyDisplay;