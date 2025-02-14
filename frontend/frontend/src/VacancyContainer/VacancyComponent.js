import React, { useState /*, useEffect*/ } from "react";
import { motion } from "framer-motion";
import { FaSearch } from "react-icons/fa";
import { IoIosOptions } from "react-icons/io";
import "./VacancyComponent.css"
import "./Filter.css"
import { useNavigate } from "react-router-dom";

const FilterComponent = ({ onClose }) => {
    const [keywords, setKeywords] = useState("");
    const [region, setRegion] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [experience, setExperience] = useState("Не имеет значения");
    const [salary, setSalary] = useState("");
    const [workSchedule, setWorkSchedule] = useState("Полный день");

// useEffect(() => {
//     const selectElement = document.getElementById("select");
//     if (selectElement){
//         selectElement.addEventListener("change", function () {
//             if (this.value === "") {
//                 this.style.color = "#ABB7C2";
//             } else{
//                 this.style.color = "black";
//             }
//         });
//         selectElement.style.color = specialty ? "black" : "#ABB7C2"
//     }
// }, [specialty]);

    return (
        <><motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 10}}
            exit={{ opacity: 0, y: -10}}
            transition={{ duration: 0.3, ease: "easeOut"}}
            className="filterbox"
        >
            <div className="filter-box">
                <div className="filter-item">
                    <label>Ключевые слова</label>
                    <input
                        type="text"
                        placeholder="Профессия или должность"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)} />
                </div>

                <div className="filter-item">
                    <label>Специальность</label>
                    <select 
                    id="select" 
                    value={specialty} 
                    onChange={(e) => setSpecialty(e.target.value)} 
                    className={!specialty ? "placeholder" : ""} 
                    >
                        <option className="optionVacancy" value="IT">IT</option>
                        <option className="optionVacancy" value="Медицина">Медицина</option>
                        <option className="optionVacancy" value="Образование">Образование</option>
                        <option className="optionVacancy" value="">Сбросить</option>
                    </select>
                    {!specialty && <span className="select-placeholder">Выбрать</span>}
                </div>

                <div className="filter-item">
                    <label>Регион</label>
                    <input
                        type="text"
                        placeholder="Введите название региона"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)} />
                </div>

                <div className="filter-item">
                    <label>Опыт</label>
                    <div className="radio-group">
                        {["Не имеет значения", "Нет опыта", "От 1 года до 3 лет", "От 3 до 6 лет"].map(
                            (exp) => (
                                <label key={exp}>
                                    <input
                                        type="radio"
                                        value={exp}
                                        checked={experience === exp}
                                        onChange={() => setExperience(exp)} />
                                    {exp}
                                </label>
                            )
                        )}
                    </div>
                </div>

                <div className="filter-item">
                    <label>Заработная плата</label>
                    <input
                        type="number"
                        placeholder="Уровень дохода от"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)} />
                </div>

                <div className="filter-item">
                    <label>График работы</label>
                    <div id="radioGroup2" className="radio-group">
                        {["Полный день", "Частичная занятость", "Проектная работа", "Стажировка"].map(
                            (schedule) => (
                                <label key={schedule}>
                                    <input
                                        type="radio"
                                        value={schedule}
                                        checked={workSchedule === schedule}
                                        onChange={() => setWorkSchedule(schedule)} />
                                    {schedule}
                                </label>
                            )
                        )}
                    </div>
                </div>
            </div>
        </motion.div></>         
    );
};

  

const VacancyComponent = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilter, setShowFilter] = useState(false);
    const navigate = useNavigate();

    return (
    <div className={`vacancy-container ${showFilter ? "expanded" : ""}`}>
        <div className="search-bar">
          <FaSearch className="search-icon" /> 
          <input
          type="text"
          className="search-input"
          placeholder="Поиск вакансии"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
          <button className="filter-button" onClick={() => setShowFilter(!showFilter)}>
            <IoIosOptions className="filter-icon" />
          </button>
        </div>
        <button className="search-button" onClick={() => navigate("/VacancyPage") }> Найти</button>
        {showFilter && <FilterComponent onClose={() => setShowFilter(false)}/>}
      </div>
    );
  };

export default VacancyComponent;