import React from "react";
import "./HomePage.css"
import NavigationBar from "../NavigationBar/NavigationBar";
import VacancyComponent from "../VacancyContainer/VacancyComponent";
import FooterComp from "../Footer/FooterComp";


function HomePage() {
    return (
        <div className="App">
          <div className="Navbar">
          <NavigationBar />
            </div>
            <div className="handsImg">
              <img src="/hands.png" alt="handsPNG"></img>
            </div>
          <div className="Welcome-Text">
          <h1> Платформа для поиска стажировок и работы для студента
          </h1>
          <h2>
            Начни свой профессиональный путь, чтобы расти и достигать большего
          </h2>
          </div>
          <div className="VacancySearching">
          <h1 id="Vacancies">Вакансии</h1>
          <VacancyComponent />
          </div>
          <div className="FooterSection">
            <FooterComp />
          </div>
        </div>
      );
}

export default HomePage;