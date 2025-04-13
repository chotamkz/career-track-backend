import React, { useState, useEffect } from "react";
import "./studentProfile.css";
import { studentProfileService } from "../services/profileService";
import { isAuthenticated } from "../services/authService";

const StudentProfile = () => {
  const [profile, setProfile] = useState({
    name: "",
    city: "",
    education: "",
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditClick = () => {
    if (isEditing) {
      handleSaveProfile();
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    try {
      const result = await studentProfileService.updateProfile(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setProfile(formData);
        setError(null);
      }
    } catch (err) {
      setError("Не удалось обновить профиль");
      console.error("Error updating profile:", err);
    }
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

  if (error) {
    return <div className="error">{error}</div>;
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
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  className="profile-input"
                  placeholder="Имя"
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
                  type="text"
                  name="education"
                  value={formData.education || ""}
                  onChange={handleInputChange}
                  className="profile-input"
                  placeholder="Образование"
                />
              </>
            ) : (
              <>
                <h2>{profile.name || "Нет данных"}</h2>
                <p>{profile.city || "Не указан город"}</p>
                <p>{profile.education || "Не указано образование"}</p>
              </>
            )}
            <button 
              className="student-edit-button" 
              onClick={handleEditClick}
            >
              {isEditing ? "Сохранить" : "Редактировать"}
            </button>
          </div>
        </div>
      </div>

      <div className="resume-section">
        <h3>Резюме</h3>
        <div className="resume-upload-box">
          {profile.hasResume ? (
            <div className="resume-info">
              <p>Ваше резюме загружено</p>
              <a 
                href={profile.resumeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="resume-link"
              >
                Просмотреть резюме
              </a>
            </div>
          ) : (
            <p>Загрузите своё резюме</p>
          )}
          <input 
            type="file" 
            className="upload-input" 
            onChange={handleResumeUpload}
            accept=".pdf,.doc,.docx" 
          />
        </div>
      </div>

      <div className="saved-jobs">
        <h3>Сохраненные вакансии</h3>
        <div className="job-list">
          {savedVacancies.length > 0 ? (
            savedVacancies.map((vacancy) => (
              <div className="job-card" key={vacancy.id}>
                {vacancy.title} - {vacancy.companyName}
              </div>
            ))
          ) : (
            <div className="empty-list">У вас нет сохраненных вакансий</div>
          )}
        </div>
      </div>

      <div className="application-history">
        <h3>История заявок</h3>
        <div className="job-list">
          {applications.length > 0 ? (
            applications.map((app) => (
              <div className="job-card" key={app.id}>
                {app.vacancyTitle} - {app.companyName}
                <span className="application-status">{app.status}</span>
              </div>
            ))
          ) : (
            <div className="history-box">В настоящий момент у вас нет активных заявок</div>
          )}
        </div>
      </div>

      <div className="recommendations">
        <h3>Рекомендации</h3>
        <div className="recommendation-box">Упс... ваша лента рекомендаций пуста</div>
      </div>
    </div>
  );
};

export default StudentProfile;
