import React, { memo, useState, useEffect, useRef } from 'react';
import Select from "react-select";
import makeAnimated from 'react-select/animated';

// Иконка для кнопки фильтра
const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 18H14V16H10V18ZM3 6V8H21V6H3ZM6 13H18V11H6V13Z" fill="currentColor"/>
  </svg>
);

const FilterSection = memo(({
  initialKeywords,
  initialMlSkills,
  initialExperience,
  initialSelectedLocations,
  initialKeywordFilter,
  locationOptions,
  onSearch
}) => {
  const [keywords, setKeywords] = useState(initialKeywords || "");
  const [mlSkills, setMlSkills] = useState(initialMlSkills || "");
  const [experience, setExperience] = useState(initialExperience || "");
  const [selectedLocations, setSelectedLocations] = useState(initialSelectedLocations || []);
  const [selectedKeywordFilter, setSelectedKeywordFilter] = useState(initialKeywordFilter || {
    title: false,
    company: false,
    description: false
  });
  const [isFilterVisible, setIsFilterVisible] = useState(window.innerWidth > 768);

  // Отслеживание изменения размера окна для управления видимостью фильтра
  useEffect(() => {
    const handleResize = () => {
      setIsFilterVisible(window.innerWidth > 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setKeywords(initialKeywords || "");
    setMlSkills(initialMlSkills || "");
    setExperience(initialExperience || "");
    setSelectedLocations(initialSelectedLocations || []);
    setSelectedKeywordFilter(initialKeywordFilter || {
      title: false, 
      company: false,
      description: false
    });
  }, [initialKeywords, initialMlSkills, initialExperience, initialSelectedLocations, initialKeywordFilter]);

  const triggerSearch = () => {
    onSearch({
      keywords,
      mlSkills,
      experience,
      locations: selectedLocations,
      keywordFilter: selectedKeywordFilter
    });
  };

  const handleKeywordFilterChange = (filterType, checked) => {
    const newFilters = {
      ...selectedKeywordFilter,
      [filterType]: checked
    };
    setSelectedKeywordFilter(newFilters);
    
    setTimeout(() => {
      onSearch({
        keywords,
        mlSkills,
        experience,
        locations: selectedLocations,
        keywordFilter: newFilters
      });
    }, 0);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      triggerSearch();
    }
  };

  const selectedLocationOptions = locationOptions.filter(option => 
    selectedLocations.includes(option.value)
  );

  // Стили для компонента Select
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      border: state.isFocused ? '1px solid #3182ce' : '1px solid #e2e8f0',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(49, 130, 206, 0.15)' : 'none',
      borderRadius: '6px',
      padding: '2px',
      transition: 'all 0.2s ease',
      backgroundColor: state.isFocused ? '#fff' : '#fcfcfc',
      '&:hover': {
        border: '1px solid #cbd5e0',
        backgroundColor: '#fff',
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#ebf8ff',
      border: '1px solid #bee3f8',
      borderRadius: '4px',
      padding: '0 2px',
      transition: 'all 0.2s ease',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#2b6cb0',
      fontWeight: 500,
      fontSize: '13px',
      padding: '2px 4px',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#4299e1',
      '&:hover': {
        backgroundColor: '#c3dafe',
        color: '#2c5282',
      },
      transition: 'all 0.2s ease',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: '#718096',
      '&:hover': {
        color: '#4a5568',
      },
      transition: 'color 0.2s ease',
    }),
    clearIndicator: (base) => ({
      ...base,
      color: '#718096',
      '&:hover': {
        color: '#e53e3e',
      },
      transition: 'color 0.2s ease',
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      animation: 'fadeIn 0.2s ease',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? '#3182ce' 
        : state.isFocused 
          ? '#ebf8ff' 
          : 'white',
      color: state.isSelected ? 'white' : '#4a5568',
      padding: '8px 12px',
      transition: 'all 0.15s ease',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#3182ce',
      },
    }),
    placeholder: (base) => ({
      ...base,
      color: '#a0aec0',
    }),
  };

  return (
    <>
      {/* Кнопка переключения видимости фильтра (только на мобильных устройствах) */}
      <button 
        className="filter-toggle-button mobile-only"
        onClick={() => setIsFilterVisible(!isFilterVisible)}
      >
        <FilterIcon />
        {isFilterVisible ? 'Скрыть фильтры' : 'Показать фильтры'}
      </button>
      
      {isFilterVisible && (
        <div className="filter-section">
          <h3 className="filter-title">Ключевые слова</h3>
          <input
            type="text"
            className="filter-input"
            placeholder="Профессия или должность"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onBlur={triggerSearch}
          />
          <div className="filter-checkboxes">
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                id="CheckboxkeyWords"
                checked={selectedKeywordFilter.title}
                onChange={(e) => handleKeywordFilterChange('title', e.target.checked)}
              />
              <span>В названии вакансии</span>
            </label>
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                id="CheckboxkeyWords"
                checked={selectedKeywordFilter.company}
                onChange={(e) => handleKeywordFilterChange('company', e.target.checked)}
              />
              <span>В названии компании</span>
            </label>
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                id="CheckboxkeyWords"
                checked={selectedKeywordFilter.description}
                onChange={(e) => handleKeywordFilterChange('description', e.target.checked)}
              />
              <span>В описании вакансии</span>
            </label>
          </div>

          <h3 className="filter-title">Навыки</h3> 
          <div className="skills-filter">
            <input
              type="text"
              className="filter-input"
              placeholder="Введите навыки (например: CSS, JavaScript, React)"
              value={mlSkills}
              onChange={(e) => setMlSkills(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onBlur={triggerSearch}
            />
          </div>
          <div className="skills-hint">
            <div className="hint-icon">💡</div>
            <div className="hint-text">
              Введите ваши навыки через запятую, и ML-алгоритм найдет наиболее подходящие вакансии, показав совпадающие и недостающие навыки.
            </div>
          </div>

          <h3 className="filter-title">Опыт работы</h3>
          <div className="experience-checkboxes">
            <label className="filter-checkbox-label">
              <input
                type="radio"
                name="experience"
                id="experienceRadio"
                checked={experience === ""}
                onChange={() => {
                  setExperience("");
                  setTimeout(() => {
                    onSearch({
                      keywords,
                      mlSkills,
                      experience: "",
                      locations: selectedLocations,
                      keywordFilter: selectedKeywordFilter
                    });
                  }, 0);
                }}
              />
              <span>Не имеет значения</span>
            </label>
            <label className="filter-checkbox-label">
              <input
                type="radio"
                name="experience"
                id="experienceRadio"
                checked={experience === "Нет опыта"}
                onChange={() => {
                  setExperience("Нет опыта");
                  setTimeout(() => {
                    onSearch({
                      keywords,
                      mlSkills,
                      experience: "Нет опыта",
                      locations: selectedLocations,
                      keywordFilter: selectedKeywordFilter
                    });
                  }, 0);
                }}
              />
              <span>Нет опыта</span>
            </label>
            <label className="filter-checkbox-label">
              <input
                type="radio"
                name="experience"
                id="experienceRadio"
                checked={experience === "От 1 года до 3 лет"}
                onChange={() => {
                  setExperience("От 1 года до 3 лет");
                  setTimeout(() => {
                    onSearch({
                      keywords,
                      mlSkills,
                      experience: "От 1 года до 3 лет",
                      locations: selectedLocations,
                      keywordFilter: selectedKeywordFilter
                    });
                  }, 0);
                }}
              />
              <span>От 1 до 3 лет</span>
            </label>
            <label className="filter-checkbox-label">
              <input
                type="radio"
                name="experience"
                id="experienceRadio"
                checked={experience === "От 3 до 6 лет"}
                onChange={() => {
                  setExperience("От 3 до 6 лет");
                  setTimeout(() => {
                    onSearch({
                      keywords,
                      mlSkills,
                      experience: "От 3 до 6 лет",
                      locations: selectedLocations,
                      keywordFilter: selectedKeywordFilter
                    });
                  }, 0);
                }}
              />
              <span>От 3 до 6 лет</span>
            </label>
          </div>

          <h3 className="filter-title">Локация</h3>
          <Select
            closeMenuOnSelect={false}
            isMulti
            styles={customSelectStyles}
            options={locationOptions}
            value={selectedLocationOptions}
            onChange={(selectedOptions) => {
              const locations = selectedOptions ? selectedOptions.map(option => option.value) : [];
              setSelectedLocations(locations);
              
              setTimeout(() => {
                onSearch({
                  keywords,
                  mlSkills, 
                  experience,
                  locations: locations,
                  keywordFilter: selectedKeywordFilter
                });
              }, 0);
            }}
            components={makeAnimated()}
            placeholder="Выберите города"
            className="location-select"
          />
        </div>
      )}
    </>
  );
});

export default FilterSection; 