import React from "react";
import "./VacancyPage.css";
import NavigationBar from "../NavigationBar/NavigationBar";
import VacancyComponent from "../VacancyContainer/VacancyComponent";
import FooterComp from "../Footer/FooterComp";


function VacancyPage() {
    return (
        <div className="VacancyPage">
          <div className="Navbar">
          <NavigationBar />
            </div>

          <div className="VacancySearching">
          <VacancyComponent />
          </div>

          <div className="FooterSection">
            <FooterComp />
          </div>
        </div>
      );
}

export default VacancyPage;