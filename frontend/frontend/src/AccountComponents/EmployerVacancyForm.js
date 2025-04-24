import React, { useState, useEffect } from "react";
import "./EmployerVacancyForm.css";
import { apiClient, API_ENDPOINTS, handleApiError } from "../services/api";

const EmployerVacancyForm = ({ vacancyId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    responsibilities: "",
    salary: "",
    location: "",
    employmentType: "FULL_TIME",
    experienceLevel: "ENTRY",
    skills: []
  });
  
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Если передан ID вакансии, значит режим редактирования
    if (vacancyId) {
      setIsEditing(true);
      fetchVacancyData(vacancyId);
    }
  }, [vacancyId]);

  const fetchVacancyData = async (id) => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.VACANCIES.GET_BY_ID(id));
      
      // Преобразуем строку навыков в массив, если она пришла в виде строки
      let skills = response.data.skills;
      if (typeof skills === 'string') {
        skills = skills.split(',').map(skill => skill.trim());
      }
      
      setFormData({
        ...response.data,
        skills: skills || []
      });
      
    } catch (error) {
      setError(handleApiError(error).error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Подготовка данных для отправки
      const dataToSend = {
        ...formData,
        skills: formData.skills.join(', ')
      };
      
      let response;
      if (isEditing) {
        response = await apiClient.put(
          API_ENDPOINTS.VACANCIES.UPDATE(vacancyId),
          dataToSend
        );
      } else {
        response = await apiClient.post(
          API_ENDPOINTS.VACANCIES.CREATE,
          dataToSend
        );
      }
      
      if (onSave) {
        onSave(response.data);
      }
      
      if (onClose) {
        onClose();
      }
      
    } catch (error) {
      setError(handleApiError(error).error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return <div className="employer-vacancy-form__loading">Загрузка данных вакансии...</div>;
  }

  return (
    <div className="employer-vacancy-form">
      <h2 className="employer-vacancy-form__title">
        {isEditing ? "Редактирование вакансии" : "Создание новой вакансии"}
      </h2>
      
      {error && (
        <div className="employer-vacancy-form__error">{error}</div>
      )}
      
      <form onSubmit={handleSubmit} className="employer-vacancy-form__form">
        <div className="employer-vacancy-form__group">
          <label className="employer-vacancy-form__label">Название вакансии</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="employer-vacancy-form__input"
            required
          />
        </div>
        
        <div className="employer-vacancy-form__group">
          <label className="employer-vacancy-form__label">Описание вакансии</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="employer-vacancy-form__textarea"
            required
          />
        </div>
        
        <div className="employer-vacancy-form__group">
          <label className="employer-vacancy-form__label">Требования</label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleInputChange}
            className="employer-vacancy-form__textarea"
          />
        </div>
        
        <div className="employer-vacancy-form__group">
          <label className="employer-vacancy-form__label">Обязанности</label>
          <textarea
            name="responsibilities"
            value={formData.responsibilities}
            onChange={handleInputChange}
            className="employer-vacancy-form__textarea"
          />
        </div>
        
        <div className="employer-vacancy-form__row">
          <div className="employer-vacancy-form__group employer-vacancy-form__group--half">
            <label className="employer-vacancy-form__label">Зарплата</label>
            <input
              type="text"
              name="salary"
              value={formData.salary}
              onChange={handleInputChange}
              className="employer-vacancy-form__input"
              placeholder="например: 80 000 - 120 000 руб."
            />
          </div>
          
          <div className="employer-vacancy-form__group employer-vacancy-form__group--half">
            <label className="employer-vacancy-form__label">Местоположение</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="employer-vacancy-form__input"
              placeholder="например: Москва или Удаленно"
            />
          </div>
        </div>
        
        <div className="employer-vacancy-form__row">
          <div className="employer-vacancy-form__group employer-vacancy-form__group--half">
            <label className="employer-vacancy-form__label">Тип занятости</label>
            <select
              name="employmentType"
              value={formData.employmentType}
              onChange={handleInputChange}
              className="employer-vacancy-form__select"
            >
              <option value="FULL_TIME">Полная занятость</option>
              <option value="PART_TIME">Частичная занятость</option>
              <option value="CONTRACT">Контракт</option>
              <option value="INTERNSHIP">Стажировка</option>
            </select>
          </div>
          
          <div className="employer-vacancy-form__group employer-vacancy-form__group--half">
            <label className="employer-vacancy-form__label">Уровень опыта</label>
            <select
              name="experienceLevel"
              value={formData.experienceLevel}
              onChange={handleInputChange}
              className="employer-vacancy-form__select"
            >
              <option value="ENTRY">Начальный (Junior)</option>
              <option value="MID">Средний (Middle)</option>
              <option value="SENIOR">Высокий (Senior)</option>
              <option value="LEAD">Ведущий (Lead)</option>
            </select>
          </div>
        </div>
        
        <div className="employer-vacancy-form__group">
          <label className="employer-vacancy-form__label">Навыки и технологии</label>
          <div className="employer-vacancy-form__skills-input">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              className="employer-vacancy-form__input employer-vacancy-form__input--skill"
              placeholder="Добавьте навык и нажмите кнопку"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="employer-vacancy-form__add-skill-btn"
            >
              Добавить
            </button>
          </div>
          
          <div className="employer-vacancy-form__skills-list">
            {formData.skills.map((skill, index) => (
              <div key={index} className="employer-vacancy-form__skill-tag">
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="employer-vacancy-form__remove-skill-btn"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="employer-vacancy-form__actions">
          <button
            type="button"
            onClick={onClose}
            className="employer-vacancy-form__button employer-vacancy-form__button--cancel"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="employer-vacancy-form__button employer-vacancy-form__button--submit"
            disabled={loading}
          >
            {loading ? "Сохранение..." : isEditing ? "Обновить вакансию" : "Создать вакансию"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployerVacancyForm; 