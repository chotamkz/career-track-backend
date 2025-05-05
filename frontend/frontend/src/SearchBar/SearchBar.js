import React, { useState, useEffect, useRef } from "react";
import "./SearchBar.css";
import { FaSearch } from "react-icons/fa";

const SearchBar = ({ onSearch, initialQuery = "" }) => {
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [isFocused, setIsFocused] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);
    const buttonRef = useRef(null);

    useEffect(() => {
        setSearchQuery(initialQuery);
    }, [initialQuery]);
    
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 576);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSearch = () => {
        onSearch(searchQuery);
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }

    const handleInputChange = (e) => {
        setSearchQuery(e.target.value);
        if (!e.target.value.trim()) {
            onSearch("");
        }
    }

    return (
        <div className="searchContainer">
            <div className={`search-bar ${isFocused ? 'focused' : ''}`}>
                <FaSearch className="search-icon" />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Поиск вакансии..."
                    value={searchQuery}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
                <button 
                    ref={buttonRef}
                    className="search-button" 
                    onClick={handleSearch}
                    aria-label="Поиск"
                >
                    {isMobile ? 'Поиск' : 'Найти'}
                </button>
            </div>
        </div>
    );
}

export default SearchBar;
