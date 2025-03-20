import React from "react";
import "./studentProfile.css";

const StudentProfile = () => {
  return (
    <div className="student-account-container">
      <div className="student-profile">
        <div className="profile-info">
          <img src="/default-avatar.png" alt="Profile" className="profile-img" />
          <div>
            <h2>John Doe</h2>
            <p>Алматы</p>
            <button className="edit-button">Редактировать</button>
          </div>
        </div>
      </div>

      <div className="resume-section">
        <h3>Резюме</h3>
        <div className="resume-upload-box">
          <p>Загрузите своё резюме</p>
          <input type="file" className="upload-input" />
        </div>
      </div>

      <div className="saved-jobs">
        <h3>Сохраненные вакансии</h3>
        <div className="job-list">
          <div className="job-card">Junior Programmatic Specialist - Crosstech</div>
          <div className="job-card">iOS Development Trainee - OLX</div>
          <div className="job-card">Data Project Manager - EPAM Systems</div>
        </div>
      </div>

      <div className="application-history">
        <h3>История заявок</h3>
        <div className="history-box">В настоящий момент у вас нет активных заявок</div>
      </div>

      <div className="recommendations">
        <h3>Рекомендации</h3>
        <div className="recommendation-box">Упс... ваша лента рекомендаций пуста</div>
      </div>
    </div>
  );
};

export default StudentProfile;
