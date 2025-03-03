import React from "react";
import "./HackaSearch.css";
import { FaSearch } from "react-icons/fa";

const HackaSearch = () => {
    return(
        <div className="hackaSearchContainer">    
            <div className="hackasearch-bar">
                    <FaSearch className="hackasearch-icon" /> 
                    <input 
                    type="text"
                    className="hackasearch-input"
                    placeholder="Поиск хакатонов"
                    />
                    <button className="hackasearch-button"> Найти хакатоны</button>
            </div>
        </div>
    )
}

export default HackaSearch;