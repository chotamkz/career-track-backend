import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./VacancyDisplay.css";

function VacancyDisplay() {
  const { id } = useParams();
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [specialty, setSpecialty] = useState("");

  useEffect(() => {
    const fetchVacancy = async () => {
      try {
        const response = await fetch(`/api/v1/vacancies/${id}`);
        if (!response.ok) throw new Error("Ошибка загрузки вакансии");
        const data = await response.json();
        setVacancy(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };     

    fetchVacancy();
  }, [id]);

  if (loading) return <p>Загрузка вакансии...</p>;
  if (error) return <p>Ошибка: {error}</p>;

  return (
    <div className="vacancy-display">
              <div className="filter-section">
           <h3>Ключевые слова</h3>
           <input type="text" placeholder="Профессия или должность" />
           <label>
             <input id="keyWordsCheckbox" type="checkbox"/> В названии вакансии
           </label>
           <label>
             <input id="keyWordsCheckbox" type="checkbox"/> В названии компании
           </label>
           <label>
             <input id="keyWordsCheckbox" type="checkbox"/> В названии описания
           </label>
  
           <h3>Тип работы</h3>
           <select id="selectType"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className={!specialty ? "placeholder" : ""}
          >
            <option className="optionVacancy" value="IT">IT</option>
            <option className="optionVacancy" value="Медицина">Медицина</option>
            <option className="optionVacancy" value="Образование">Образование</option>
            <option className="optionVacancy" value="">Сбросить</option>
            {!specialty && <span className="select-placeholder">Выбрать</span>}
          </select>
  
          <h3>Навыки</h3>
          <input type="text" placeholder="Введите ваши навыки" />
  
          <h3>Локация</h3>
          <label>
            <input id="locationCheckbox" type="checkbox"/> Алматы
          </label>
          <label>
            <input id="locationCheckbox" type="checkbox"/> Алматы
          </label>
          <label>
            <input id="locationCheckbox" type="checkbox"/> Алматы
          </label>
        </div>
      <div className="vacancy-card">
        <h2>{vacancy.title}</h2>
        <p id="vacancy-salary">{vacancy.salary || "Зарплата не указана"}</p>
        <p>{vacancy.company}</p>
        <p>{vacancy.location}</p>

        <div className="vacancy-actions">
          <button className="apply-btn">Откликнуться</button>
          <button className="contact-btn">Контакты</button>
        </div>
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