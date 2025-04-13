import React, { useState, useEffect } from "react";
import "./SearchBar.css";
import { FaSearch } from "react-icons/fa";

const SearchBar = ({ onSearch, initialQuery = "" }) => {
    const [searchQuery, setSearchQuery] = useState(initialQuery);

    useEffect(() => {
        setSearchQuery(initialQuery);
    }, [initialQuery]);

    const handleSearch = () => {
        onSearch(searchQuery);
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }

    return (
        <div className="searchContainer">
            <div className="search-bar">
                <FaSearch className="search-icon" />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Поиск вакансии"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <button className="search-button" onClick={handleSearch}>Найти</button>
            </div>
        </div>
    );
}

export default SearchBar;
