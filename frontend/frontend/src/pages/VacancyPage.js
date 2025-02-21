import React from "react";
import "./VacancyPage.css";
import NavigationBar from "../NavigationBar/NavigationBar";
import FooterComp from "../Footer/FooterComp";
import SearchBar from "../SearchBar/SearchBar";
import VacancyDisplay from "../VacancyDisplay/VacancyDisplay";


function VacancyPage() {
    return (
        <div className="VacancyPage">
          <div className="Navbar">
          <NavigationBar />
            </div>

          <div className="SearchBar">
          <SearchBar />
          </div>
          
          <div className="VacancyDisplay">
          <VacancyDisplay />
          </div>

          <div className="FooterSection">
            <FooterComp />
          </div>
        </div>
      );
}

export default VacancyPage;