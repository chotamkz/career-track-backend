import React from "react";
import "./ProfilePage.css";
import NavigationBar from "../NavigationBar/NavigationBar";
import FooterComp from "../Footer/FooterComp";


function ProfilePage() {
    return (
        <div className="ProfilePage">
          <div className="Navbar">
          <NavigationBar />
            </div>
            <div className="profile-container">
        <div className="card profile-card">
          <div className="profile-info">
            <h2 className="profile-name">Имя Фамилия</h2>
            <p className="profile-city">Город</p>
            <button className="edit-button">Редактировать</button>
          </div>
          <div className="profile-avatar"></div>
        </div>
        <div className="card resume-card">
          <p className="upload-text">Загрузите свой резюме</p>
          <div className="file-formats">
            <span className="file-box">PDF</span>
            <span className="file-box">DOCX</span>
            <span className="file-box">TXT</span>
            <span id="sizebox" className="size-box">{">"} 10 MB</span>
          </div>
        </div>
        <div className="card history-card">
          <h3>История откликов</h3>
        </div>
        <div className="card recommendations-card">
          <h3>Рекомендации</h3>
        </div>
      </div>
            <FooterComp />
        </div>
      );
}

export default ProfilePage;