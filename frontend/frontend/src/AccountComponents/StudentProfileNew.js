import React, { useState, useEffect } from "react";
import "./studentProfileNew.css";
import { studentProfileService } from "../services/profileService";
import { isAuthenticated } from "../services/authService";

const StudentProfile = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    city: "",
    education: "",
    status: false,
    phone: "",
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);

  // Получение данных профиля при загрузке компонента
  useEffect(() => {
    // Проверяем, авторизован ли пользователь
    if (!isAuthenticated()) {
      setError("Для просмотра профиля необходимо авторизоваться");
      setIsLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const profileData = await studentProfileService.getProfile();
        if (profileData.error) {
          if (profileData.status === 401 || profileData.status === 403) {
            setError("Ваша сессия истекла. Пожалуйста, авторизуйтесь снова.");
          } else {
            setError(profileData.error);
          }
        } else {
          setProfile(profileData);
          setFormData(profileData);
        }
      } catch (err) {
        setError("Не удалось загрузить данные профиля");
        console.error("Error fetching profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      // Для чекбокса используем checked, для остальных полей - value
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      let formattedPhone = '';
      
      if (value.length > 0) {
        formattedPhone = '+';
        if (value.length > 1) {
          formattedPhone += value.substring(0, 1) + ' ';
        } else {
          formattedPhone += value.substring(0, 1);
        }
        
        if (value.length > 4) {
          formattedPhone += '(' + value.substring(1, 4) + ') ';
        } else if (value.length > 1) {
          formattedPhone += '(' + value.substring(1, value.length);
        }
        
        if (value.length > 7) {
          formattedPhone += value.substring(4, 7) + '-';
        } else if (value.length > 4) {
          formattedPhone += value.substring(4, value.length);
        }
        
        if (value.length > 9) {
          formattedPhone += value.substring(7, 9) + '-';
        } else if (value.length > 7) {
          formattedPhone += value.substring(7, value.length);
        }
        
        if (value.length > 9) {
          formattedPhone += value.substring(9, 11);
        }
      }
      
      setFormData((prev) => ({
        ...prev,
        phone: formattedPhone
      }));
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    // Валидация обязательных полей перед отправкой
    if (!formData.name || !formData.education) {
      setError("Имя и образование являются обязательными полями!");
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await studentProfileService.updateProfile(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setProfile(formData);
        setIsEditing(false);
        setError(null);
      }
    } catch (err) {
      setError("Не удалось обновить профиль");
      console.error("Error updating profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    // Сбрасываем изменения, возвращаем исходные данные
    setFormData(profile);
    setIsEditing(false);
    setError(null);
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const result = await studentProfileService.uploadResume(file);
        if (result.error) {
          setError(result.error);
        } else {
          // Обновляем данные профиля после успешной загрузки резюме
          setProfile(prev => ({
            ...prev,
            hasResume: true,
            resumeUrl: result.resumeUrl
          }));
          setError(null);
        }
      } catch (err) {
        setError("Не удалось загрузить резюме");
        console.error("Error uploading resume:", err);
      }
    }
  };

  // Форматирование номера телефона для отображения
  const formatPhoneNumber = (phone) => {
    if (!phone) return "Не указан телефон";
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length < 10) return phone;
    
    const formatted = `+${cleaned.substring(0, 1)} (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9, 11)}`;
    
    return formatted;
  };

  if (isLoading) {
    return <div className="loading">Загрузка профиля...</div>;
  }

  // Заглушка для аватара, если нет фото
  const defaultAvatar = "/default-avatar.svg";

  return (
    <div className="student-account-container">
      <div className="student-profile">
        <div className="profile-info">
          <img 
            src={profile.avatarUrl || defaultAvatar} 
            alt="Profile" 
            className="profile-img" 
          />
          <div className="profile-details">
            {isEditing ? (
              <>
                {error && <div className="validation-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label">
                    Имя <span className="required-field">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleInputChange}
                    className="profile-input"
                    placeholder="Имя"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    Образование <span className="required-field">*</span>
                  </label>
                  <input
                    type="text"
                    name="education"
                    value={formData.education || ""}
                    onChange={handleInputChange}
                    className="profile-input"
                    placeholder="Образование"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    Город
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city || ""}
                    onChange={handleInputChange}
                    className="profile-input"
                    placeholder="Город"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handlePhoneChange}
                    className="profile-input"
                    placeholder="+7 (XXX) XXX-XX-XX"
                  />
                </div>
                
                <div className="status-toggle">
                  <label className="status-label">
                    <input
                      type="checkbox"
                      name="status"
                      checked={formData.status || false}
                      onChange={handleInputChange}
                      className="status-checkbox"
                    />
                    <span>Я ищу работу</span>
                  </label>
                </div>
                
                <div className="edit-buttons">
                  <button 
                    className="student-edit-button" 
                    onClick={handleSaveProfile}
                  >
                    Сохранить
                  </button>
                  <button 
                    className="cancel-button" 
                    onClick={handleCancelEdit}
                  >
                    Отмена
                  </button>
                </div>
              </>
            ) : (
              <>
                {error && <div className="error">{error}</div>}
                <h2>{profile.name || "Нет данных"}</h2>
                <div className="profile-field-container">
                  <i className="profile-icon email-icon"></i>
                  <p className="profile-field">{profile.email || "Не указан email"}</p>
                </div>
                <div className="profile-field-container">
                  <i className="profile-icon education-icon"></i>
                  <p className="profile-field">{profile.education || "Не указано образование"}</p>
                </div>
                <div className="profile-field-container">
                  <i className="profile-icon location-icon"></i>
                  <p className="profile-field">{profile.city || "Не указан город"}</p>
                </div>
                <div className="profile-field-container">
                  <i className="profile-icon phone-icon"></i>
                  <p className="profile-field">{formatPhoneNumber(profile.phone)}</p>
                </div>
                <p className="job-status">
                  {profile.status ? "Ищу работу" : "Не ищу работу"}
                </p>
                <button 
                  className="student-edit-button" 
                  onClick={handleEditClick}
                >
                  Редактировать
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile; 