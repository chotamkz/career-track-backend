import React, { useState } from "react";
import "./HackaSearch.css";
import { FaSearch } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

const HackaSearch = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    const handleSearch = (e) => {
        e.preventDefault();
        
        // Создаем объект URLSearchParams из текущего query string
        const searchParams = new URLSearchParams(location.search);
        
        // Обновляем или добавляем параметр query
        if (searchQuery.trim()) {
            searchParams.set("query", searchQuery);
        } else {
            searchParams.delete("query");
        }
        
        // Перенаправляем на ту же страницу, но с обновленными параметрами
        navigate({
            pathname: location.pathname,
            search: searchParams.toString()
        });
    };

    return(
        <div className="hackaSearchContainer">    
            <form className="hackasearch-bar" onSubmit={handleSearch}>
                <FaSearch className="hackasearch-icon" /> 
                <input 
                    type="text"
                    className="hackasearch-input"
                    placeholder="Поиск хакатонов"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                    type="submit"
                    className="hackasearch-button"
                >
                    Найти хакатоны
                </button>
            </form>
        </div>
    )
}

export default HackaSearch;