import React, { useState, useEffect } from "react";
import "./employerProfile.css";
import { employerProfileService } from "../services/profileService";
import { isAuthenticated } from "../services/authService";

const EmployerProfile = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    description: "",
    website: "",
    industry: "",
    size: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);

  // Загрузка данных профиля при монтировании компонента
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
        const profileData = await employerProfileService.getProfile();
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditClick = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    try {
      const result = await employerProfileService.updateProfile(formData);
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
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const result = await employerProfileService.uploadLogo(file);
        if (result.error) {
          setError(result.error);
        } else {
          setProfile(prev => ({
            ...prev,
            logoUrl: result.logoUrl
          }));
          setError(null);
        }
      } catch (err) {
        setError("Не удалось загрузить логотип");
        console.error("Error uploading logo:", err);
      }
    }
  };

  if (isLoading) {
    return <div className="loading">Загрузка профиля...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="employer-account-container">
      <div className="employer-profile">
        <div className="profile-header">
          {isEditing ? (
            <div className="edit-logo-container">
              <div className="logo-preview">
                <img
                  src={profile.logoUrl || "/company-logo.png"}
                  alt="Company Logo"
                  className="company-logo"
                />
              </div>
              <input 
                type="file" 
                onChange={handleLogoUpload} 
                accept="image/*"
                className="logo-upload" 
              />
            </div>
          ) : (
            <img
              src={profile.logoUrl || "/company-logo.png"}
              alt="Company Logo"
              className="company-logo"
            />
          )}
          
          <div className="company-info">
            {isEditing ? (
              <>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  className="company-input"
                  placeholder="Название компании"
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                  className="company-input"
                  placeholder="Email"
                />
                <textarea
                  name="description"
                  value={formData.description || ""}
                  onChange={handleInputChange}
                  className="company-textarea"
                  placeholder="Описание компании"
                />
                <div className="edit-buttons">
                  <button 
                    className="save-button" 
                    onClick={handleSaveProfile}
                  >
                    Сохранить
                  </button>
                  <button 
                    className="cancel-button" 
                    onClick={() => {
                      setFormData(profile);
                      setIsEditing(false);
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>{profile.name || "Название компании"}</h2>
                <p className="email">{profile.email || "email@company.com"}</p>
            <p className="description">
                  {profile.description || "Описание компании отсутствует"}
            </p>
                <button 
                  className="edit-button" 
                  onClick={handleEditClick}
                >
                  Редактировать
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="company-overview">
        <h3>Детали компании</h3>
        {isEditing ? (
          <>
            <div className="overview-form">
              <div className="form-group">
                <label>Веб-сайт:</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website || ""}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                />
              </div>
              <div className="form-group">
                <label>Отрасль:</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry || ""}
                  onChange={handleInputChange}
                  placeholder="Сфера деятельности"
                />
              </div>
              <div className="form-group">
                <label>Размер компании:</label>
                <select 
                  name="size" 
                  value={formData.size || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Выберите размер</option>
                  <option value="1-10 сотрудников">1-10 сотрудников</option>
                  <option value="11-50 сотрудников">11-50 сотрудников</option>
                  <option value="51-200 сотрудников">51-200 сотрудников</option>
                  <option value="201-500 сотрудников">201-500 сотрудников</option>
                  <option value="501-1000 сотрудников">501-1000 сотрудников</option>
                  <option value="1001+ сотрудников">1001+ сотрудников</option>
                </select>
              </div>
            </div>
          </>
        ) : (
          <>
        <p>
          <strong>Веб-сайт:</strong>{" "}
              {profile.website ? (
          <a
                  href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
          >
                  {profile.website}
          </a>
              ) : (
                "Не указан"
              )}
        </p>
        <p>
              <strong>Отрасль:</strong> {profile.industry || "Не указана"}
        </p>
        <p>
              <strong>Размер компании:</strong> {profile.size || "Не указан"}
        </p>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployerProfile;

