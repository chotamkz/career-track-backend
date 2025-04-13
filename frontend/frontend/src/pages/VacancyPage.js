import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./VacancyPage.css";
import NavigationBar from "../NavigationBar/NavigationBar";
import FooterComp from "../Footer/FooterComp";
import VacancyDisplay from "../VacancyDisplay/VacancyDisplay";
import SearchBar from "../SearchBar/SearchBar";

function VacancyPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);

  const [searchQuery, setSearchQuery] = useState(queryParams.get("query") || "");
  const [searchFilters, setSearchFilters] = useState({
    keywords: queryParams.get("keywords") || "",
    experience: queryParams.get("experience") || "",
    ml_skills: queryParams.get("ml_skills") || "",
    locations: queryParams.get("region") ? queryParams.get("region").split(",") : [],
    keywordsInTitle: queryParams.get("in_title") === "true",
    keywordsInCompany: queryParams.get("in_company") === "true",
    keywordsInDescription: queryParams.get("in_description") === "true"
  });

  const updateUrlParams = (filters, query) => {
    const params = new URLSearchParams();

    if (query) params.set("query", query);
    if (filters.keywords) params.set("keywords", filters.keywords);
    if (filters.experience) params.set("experience", filters.experience);
    if (filters.ml_skills) params.set("ml_skills", filters.ml_skills);
    if (filters.locations.length > 0) params.set("region", filters.locations.join(","));
    if (filters.keywordsInTitle) params.set("in_title", "true");
    if (filters.keywordsInCompany) params.set("in_company", "true");
    if (filters.keywordsInDescription) params.set("in_description", "true");

    navigate({
      pathname: "/vacancies/search",
      search: params.toString()
    });
  };
  
  const handleSearch = (query) => {
    setSearchQuery(query);
    updateUrlParams(searchFilters, query);
  };

  const handleFiltersChange = (filters) => {
    setSearchFilters(filters);
    updateUrlParams(filters, searchQuery);
  };

  return (
    <div className="VacancyPage">
      <NavigationBar />
      <div className="ContentWrapper">
        <div className="SearchBarContainer">
          <SearchBar onSearch={handleSearch} initialQuery={searchQuery} />
        </div>
        <VacancyDisplay
          searchFilters={searchFilters}
          searchQuery={searchQuery}
          onFiltersChange={handleFiltersChange}
        />
      </div>
      <FooterComp />
    </div>
  );
}

export default VacancyPage;
