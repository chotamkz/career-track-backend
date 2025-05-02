import React, { useState, useEffect } from "react";
import "./studentProfile.css";
import { studentProfileService } from "../services/profileService";
import { isAuthenticated } from "../services/authService";

const StudentProfile = () => {
  const [profile, setProfile] = useState({
    name: "",
    city: "",
    education: "",
    status: false,
    phone: "",
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [savedVacancies, setSavedVacancies] = useState([]);
  const [applications, setApplications] = useState([]);
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

    const fetchSavedVacancies = async () => {
      try {
        const vacancies = await studentProfileService.getSavedVacancies();
        if (!vacancies.error) {
          setSavedVacancies(vacancies);
        }
      } catch (err) {
        console.error("Error fetching saved vacancies:", err);
      }
    };

    const fetchApplications = async () => {
      try {
        const apps = await studentProfileService.getApplicationHistory();
        if (!apps.error) {
          setApplications(apps);
        }
      } catch (err) {
        console.error("Error fetching applications:", err);
      }
    };

    fetchProfileData();
    fetchSavedVacancies();
    fetchApplications();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      // Для чекбокса используем checked, для остальных полей - value
      [name]: type === 'checkbox' ? checked : value,
    }));
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

  if (isLoading) {
    return <div className="loading">Загрузка профиля...</div>;
  }

  return (
    <div className="student-account-container">
      <div className="student-profile">
        <div className="profile-info">
          <img 
            src={profile.avatarUrl || "/default-avatar.png"} 
            alt="Profile" 
            className="profile-img" 
          />
          <div>
            {isEditing ? (
              <>
                {error && <div className="validation-error">{error}</div>}
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  className="profile-input"
                  placeholder="Имя"
                  required
                />
                <input
                  type="text"
                  name="education"
                  value={formData.education || ""}
                  onChange={handleInputChange}
                  className="profile-input"
                  placeholder="Образование"
                  required
                />
                <input
                  type="text"
                  name="city"
                  value={formData.city || ""}
                  onChange={handleInputChange}
                  className="profile-input"
                  placeholder="Город"
                />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                  className="profile-input"
                  placeholder="Телефон"
                />
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
                <h2>{profile.name || "Нет данных"}</h2>
                <p>{profile.education || "Не указано образование"}</p>
                <p>{profile.city || "Не указан город"}</p>
                <p>{profile.phone || "Не указан телефон"}</p>
                <p className="job-status">
                  Статус: {profile.status ? "Ищу работу" : "Не ищу работу"}
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
