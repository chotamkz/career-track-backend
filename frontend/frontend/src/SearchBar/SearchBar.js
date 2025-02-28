import React, { useState } from "react";
import "./SearchBar.css";
import { FaSearch } from "react-icons/fa";


const SearchBar = ({ onSearch }) => {
    const [searchQuery, setSearchQuery] = useState("");   

    const handleSearch = () => {
        onSearch(searchQuery);
    }
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
                    <button className="search-button" onClick={(handleSearch)}> Найти</button>
            </div>
        </div>
    )
}

export default SearchBar;