import React, { useState, useEffect } from "react";
import "./EmployerVacancyForm.css";
import { apiClient, API_ENDPOINTS, handleApiError } from "../services/api";
import RichTextEditor from "../components/RichTextEditor";
import "../components/RichTextEditor.css";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
// Библиотека установлена: npm install react-quill-new

const EmployerVacancyForm = ({ vacancyId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    location: "",
    salary_from: "",
    salary_to: "",
    salary_currency: "KZT",
    salary_gross: true,
    work_schedule: "Полный день",
    experience: "Нет опыта",
    skills: []
  });
  
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Фиксированные значения для выпадающих списков
  const experienceOptions = [
    "Нет опыта",
    "От 1 года до 3 лет",
    "От 3 до 6 лет"
  ];

  const scheduleOptions = [
    "Полный день",
    "Удаленная работа",
    "Сменный график",
    "Гибкий график"
  ];

  const currencyOptions = ["KZT", "USD", "EUR", "RUB"];

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
      } else if (!Array.isArray(skills)) {
        skills = [];
      }
      
      setFormData({
        ...response.data,
        skills: skills
      });
      
    } catch (error) {
      setError(handleApiError(error).error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Обработчик для редактора текста
  const handleEditorChange = (value, fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
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
        salary_from: formData.salary_from ? Number(formData.salary_from) : undefined,
        salary_to: formData.salary_to ? Number(formData.salary_to) : undefined
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
            placeholder="Введите название вакансии"
            required
          />
        </div>
        
        <div className="employer-vacancy-form__group">
          <label className="employer-vacancy-form__label">Описание вакансии</label>
          <div className="employer-vacancy-form__rich-editor-container">
            <RichTextEditor 
              value={formData.description}
              onChange={(value) => handleEditorChange(value, 'description')}
              placeholder="Подробно опишите вакансию, обязанности и условия работы"
            />
          </div>
        </div>
        
        <div className="employer-vacancy-form__group">
          <label className="employer-vacancy-form__label">Требования к кандидату</label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleInputChange}
            className="employer-vacancy-form__textarea"
            placeholder="Укажите необходимые навыки, образование, опыт работы"
          />
        </div>
        
        <div className="employer-vacancy-form__group">
          <label className="employer-vacancy-form__label">Место работы</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="employer-vacancy-form__input"
            placeholder="Например: Алматы, Астана, Каскелен, Удаленно"
            required
          />
        </div>
                
        <div className="employer-vacancy-form__group">
          <label className="employer-vacancy-form__label">Зарплата</label>
          <div className="employer-vacancy-form__salary">
            <div className="employer-vacancy-form__salary-range">
              <input
                type="number"
                name="salary_from"
                value={formData.salary_from}
                onChange={handleInputChange}
                className="employer-vacancy-form__input employer-vacancy-form__input--salary"
                placeholder="От"
              />
              <span className="employer-vacancy-form__salary-separator">—</span>
              <input
                type="number"
                name="salary_to"
                value={formData.salary_to}
                onChange={handleInputChange}
                className="employer-vacancy-form__input employer-vacancy-form__input--salary"
                placeholder="До"
              />
              <select
                name="salary_currency"
                value={formData.salary_currency}
                onChange={handleInputChange}
                className="employer-vacancy-form__select employer-vacancy-form__select--currency"
              >
                {currencyOptions.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
            <div className="employer-vacancy-form__salary-gross">
              <input
                type="checkbox"
                id="salaryGross"
                name="salary_gross"
                checked={formData.salary_gross}
                onChange={handleInputChange}
                className="employer-vacancy-form__checkbox"
              />
              <label htmlFor="salaryGross" className="employer-vacancy-form__checkbox-label">
                До вычета налогов
              </label>
            </div>
          </div>
        </div>
        
        <div className="employer-vacancy-form__row">
          <div className="employer-vacancy-form__group employer-vacancy-form__group--half">
            <label className="employer-vacancy-form__label">График работы</label>
            <select
              name="work_schedule"
              value={formData.work_schedule}
              onChange={handleInputChange}
              className="employer-vacancy-form__select"
            >
              {scheduleOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          <div className="employer-vacancy-form__group employer-vacancy-form__group--half">
            <label className="employer-vacancy-form__label">Требуемый опыт</label>
            <select
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              className="employer-vacancy-form__select"
            >
              {experienceOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="employer-vacancy-form__group">
          <label className="employer-vacancy-form__label">Ключевые навыки</label>
          <div className="employer-vacancy-form__skills-input">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              className="employer-vacancy-form__input employer-vacancy-form__input--skill"
              placeholder="Введите навык и нажмите 'Добавить'"
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
                  aria-label="Удалить навык"
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
            {loading ? "Сохранение..." : isEditing ? "Сохранить изменения" : "Опубликовать вакансию"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployerVacancyForm; 