import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "./VacancyPage.css";
import NavigationBar from "../NavigationBar/NavigationBar";
import FooterComp from "../Footer/FooterComp";
import SearchBar from "../SearchBar/SearchBar";
import VacancyDisplay from "../VacancyDisplay/VacancyDisplay";
import { vacancyService } from "../services/api";

function VacancyPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const queryParams = new URLSearchParams(location.search);
  
  const [searchQuery, setSearchQuery] = useState(queryParams.get("query") || "");
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [searchFilters, setSearchFilters] = useState({
    keywords: queryParams.get("keywords") || "",
    experience: queryParams.get("experience") || "",
    ml_skills: queryParams.get("ml_skills") || "",
    locations: queryParams.get("region") ? queryParams.get("region").split(",") : [],
    keywordsInTitle: queryParams.get("in_title") === "true",
    keywordsInCompany: queryParams.get("in_company") === "true",
    keywordsInDescription: queryParams.get("in_description") === "true"
  });

  useEffect(() => {
    if (id) {
      const fetchVacancy = async () => {
        setLoading(true);
        try {
          const data = await vacancyService.getVacancyById(id);
          if (data.error) {
            throw new Error(data.error);
          }
          setVacancy(data);
        } catch (err) {
          setError(err.message || "Ошибка загрузки вакансии");
        } finally {
          setLoading(false);
        }
      };
      
      fetchVacancy();
    }
  }, [id]);

  const updateUrlParams = (filters, query) => {
    const params = new URLSearchParams();
    
    if (query) params.set("query", query);
    if (filters.keywords) params.set("keywords", filters.keywords);
    if (filters.experience) params.set("experience", filters.experience);
    if (filters.ml_skills) params.set("ml_skills", filters.ml_skills);
    if (filters.locations && filters.locations.length > 0) params.set("region", filters.locations.join(","));
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

  if (id) {
    return (
      <div className="VacancyPage">
        <div className="Navbar">
          <NavigationBar />
        </div>
        
        <div className="VacancyDetail">
          {loading ? (
            <p>Загрузка вакансии...</p>
          ) : error ? (
            <p>Ошибка: {error}</p>
          ) : vacancy ? (
            <div className="vacancy-detail">
              <h1>{vacancy.title}</h1>
              <p className="company">{vacancy.company}</p>
              <p className="salary">
                {vacancy.salary_from && vacancy.salary_to
                  ? `${vacancy.salary_from} - ${vacancy.salary_to} ${vacancy.salary_currency}`
                  : "Зарплата не указана"}
              </p>
              <p className="location">{vacancy.location}</p>
              <div className="description">
                <h3>Описание</h3>
                <p>{vacancy.description}</p>
              </div>
              <div className="requirements">
                <h3>Требования</h3>
                <p>{vacancy.requirements}</p>
              </div>
              <div className="vacancy-actions">
                <a href={vacancy.vacancy_url} target="_blank" rel="noopener noreferrer">
                  <button className="apply-btn">Откликнуться</button>
                </a>
              </div>
            </div>
          ) : (
            <p>Вакансия не найдена</p>
          )}
        </div>
        
        <div className="FooterSection">
          <FooterComp />
        </div>
      </div>
    );
  }

  return (
    <div className="VacancyPage">
      <div className="Navbar">
        <NavigationBar />
      </div>

      <div className="SearchBar">
        <SearchBar onSearch={handleSearch} initialQuery={searchQuery} />
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