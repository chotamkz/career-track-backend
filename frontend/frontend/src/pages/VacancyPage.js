import React, { useState } from "react";
import "./VacancyPage.css";
import NavigationBar from "../NavigationBar/NavigationBar";
import FooterComp from "../Footer/FooterComp";
import SearchBar from "../SearchBar/SearchBar";
import VacancyDisplay from "../VacancyDisplay/VacancyDisplay";


function VacancyPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [vacancies, setVacancies] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    keywords: "", 
    specialty: "", 
    skills: "", 
    locations: []
  });

  const handleSearch = (query) => {
    setSearchQuery(query);
  };
  
  const handleFiltersChange = (filters) => {
    setSearchFilters(filters);
  }

    return (
        <div className="VacancyPage">
          <div className="Navbar">
          <NavigationBar />
            </div>

          <div className="SearchBar">
          <SearchBar onSearch={handleSearch}/>
          </div>
          
          <div className="VacancyDisplay">
          <VacancyDisplay 
           searchFilters={searchFilters}
           searchQuery={searchQuery}
           onFiltersChange={handleFiltersChange} />
          </div>

          <div className="FooterSection">
            <FooterComp />
          </div>
        </div>
      );
}

export default VacancyPage;