import React from "react";
import "./employerProfile.css";

const EmployerProfile = () => {
  return (
    <div className="employer-account-container">
      <div className="employer-profile">
        <div className="profile-header">
          <div className="company-info">
            <h2>CrossTech</h2>
            <p className="email">crosstech@outlook.com</p>
            <p className="description">
              Разработчик решений для мониторинга, контроля и комплексной защиты
            </p>
          </div>
          <img
            src="/company-logo.png"
            alt="Company Logo"
            className="company-logo"
          />
        </div>
      </div>

      <div className="tabs">
        <button className="tab-button active">Общие сведения</button>
        <button className="tab-button">Вакансии</button>
      </div>

      <div className="company-overview">
        <h3>Обзор</h3>
        <p>
          <strong>Веб-сайт:</strong>{" "}
          <a
            href="https://crosstech.kz/"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://crosstech.kz/
          </a>
        </p>
        <p>
          <strong>Отрасль:</strong> Разработчик решений для мониторинга,
          контроля и комплексной защиты
        </p>
        <p>
          <strong>Размер компании:</strong> 51-200 сотрудников
        </p>
      </div>
    </div>
  );
};

export default EmployerProfile;

