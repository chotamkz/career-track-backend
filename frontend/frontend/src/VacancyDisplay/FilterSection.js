import React, { memo, useState, useEffect, useRef } from 'react';
import Select from "react-select";
import makeAnimated from 'react-select/animated';

const FilterSection = memo(({
  initialKeywords,
  initialMlSkills,
  initialExperience,
  initialSelectedLocations,
  initialKeywordFilter,
  locationOptions,
  onSearch
}) => {
  // Локальные состояния для фильтров
  const [keywords, setKeywords] = useState(initialKeywords || "");
  const [mlSkills, setMlSkills] = useState(initialMlSkills || "");
  const [experience, setExperience] = useState(initialExperience || "");
  const [selectedLocations, setSelectedLocations] = useState(initialSelectedLocations || []);
  const [selectedKeywordFilter, setSelectedKeywordFilter] = useState(initialKeywordFilter || {
    title: false,
    company: false,
    description: false
  });

  // Обновляем локальное состояние при изменении пропсов
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
    
    // Отложенный вызов поиска, чтобы состояние успело обновиться
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
    // Отправляем поиск при нажатии Enter
    if (e.key === 'Enter') {
      triggerSearch();
    }
  };

  // Подготавливаем опции для компонента Select (локации)
  const selectedLocationOptions = locationOptions.filter(option => 
    selectedLocations.includes(option.value)
  );

  return (
    <div className="filter-section">
      <h3>Ключевые слова</h3>
      <input
        type="text"
        placeholder="Профессия или должность"
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
        onKeyDown={handleInputKeyDown}
        onBlur={triggerSearch}
      />
      <label>
        <input
          id="CheckboxkeyWords"
          type="checkbox"
          checked={selectedKeywordFilter.title}
          onChange={(e) => handleKeywordFilterChange('title', e.target.checked)}
        />
        В названии вакансии
      </label>
      <label>
        <input
          id="CheckboxkeyWords"
          type="checkbox"
          checked={selectedKeywordFilter.company}
          onChange={(e) => handleKeywordFilterChange('company', e.target.checked)}
        />
        В названии компании
      </label>
      <label>
        <input
          id="CheckboxkeyWords"
          type="checkbox"
          checked={selectedKeywordFilter.description}
          onChange={(e) => handleKeywordFilterChange('description', e.target.checked)}
        />
        В описании вакансии
      </label>

      <h3>Навыки</h3> 
      <div className="skills-filter">
        <input
          type="text"
          placeholder="Введите навыки (например: Python, TensorFlow)"
          value={mlSkills}
          onChange={(e) => setMlSkills(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={triggerSearch}
        />
      </div>

      <h3>Опыт работы</h3>
      <input
        type="text"
        placeholder="Введите опыт"
        value={experience}
        onChange={(e) => setExperience(e.target.value)}
        onKeyDown={handleInputKeyDown}
        onBlur={triggerSearch}
      />

      <h3>Локация</h3>
      <Select
        closeMenuOnSelect={false}
        isMulti
        options={locationOptions}
        value={selectedLocationOptions}
        onChange={(selectedOptions) => {
          const locations = selectedOptions ? selectedOptions.map(option => option.value) : [];
          setSelectedLocations(locations);
          
          // Отложенный вызов поиска, чтобы состояние успело обновиться
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
      />
    </div>
  );
});

export default FilterSection; 