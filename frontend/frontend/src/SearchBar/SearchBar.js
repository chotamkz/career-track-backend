import React, { useState } from "react";
import "./SearchBar.css";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";


const SearchBar = () => {
    const [searchQuery, setSearchQuery] = useState("");   
    const navigate = useNavigate(); 
    return(
        <div className="searchContainer">    
            <div className="search-bar">
                    <FaSearch className="search-icon" /> 
                    <input 
                    type="text"
                    className="search-input"
                    placeholder="Поиск вакансии"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="search-button" onClick={() => navigate("/VacancyPage") }> Найти</button>
        </div>
        </div>
    )
}

export default SearchBar;