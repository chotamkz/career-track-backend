import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./HackaDisplay.css";
import { hackathonService } from '../services/api';

const topics = [
  { id: 1, name: "Для новичков", count: 92, prize: "$1,000,000" },
  { id: 2, name: "Machine Learning", count: 59, prize: "$1,000,000" },
  { id: 3, name: "AI", count: 56, prize: "$1,000,000" },
  { id: 4, name: "Здравоохранение", count: 38, prize: "$1,000,000" },
  { id: 5, name: "Блокчейн", count: 23, prize: "$1,000,000" },
  { id: 6, name: "Финтех", count: 21, prize: "$1,000,000" },
  { id: 7, name: "База Данных", count: 15, prize: "$1,000,000" },
  { id: 8, name: "Образование", count: 10, prize: "$1,000,000" },
];

const HackaDisplay = () => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        setLoading(true);
        
        // Используем сервисную функцию для получения хакатонов
        const data = await hackathonService.getAllHackathons();
        
        // Проверяем на ошибки
        if (data.error) {
          throw new Error(data.error);
        }
        
        setHackathons(data);
        setError(null);
      } catch (err) {
        setError('Не удалось загрузить данные хакатонов');
        console.error('Ошибка при загрузке хакатонов:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHackathons();
  }, []);

  const calculateDaysLeft = (startDate) => {
    const today = new Date();
    const hackathonStart = new Date(startDate);
    const diffTime = hackathonStart - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="hackathons">
      <h2 id="forYou">Хакатоны для вас</h2>
      <div className="hackathons-container">
        <div className="hackathons-list">
          {loading ? (
            <p>Загрузка хакатонов...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : (
            hackathons.map((hackathon) => (
              <div key={hackathon.id} className="hackathon-card">
                <div className="hackathon-image-placeholder"></div>
                <div className="hackathon-content">
                  <h3 className="hackathon-title">{hackathon.name}</h3>
                  <div className="hackathon-meta">
                    <div className="days-tag">{calculateDaysLeft(hackathon.start_date)} дней до начала</div>
                    <div className="format-tag">
                      <span className="format-icon">
                        {hackathon.format.toLowerCase() === "online" ? "🌐" : "🏢"}
                      </span> 
                      {hackathon.format.toLowerCase() === "online" ? "Онлайн" : "Оффлайн"}
                    </div>
                  </div>
                  <div className="hackathon-footer">
                    <div className="prize-info">₸ {hackathon.prizes}</div>
                    <div className="participants-info">2000 участников</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="top-topics">
          <h2>Топ тем хакатонов</h2>
          <table>
            <thead>
              <tr>
                <th>Темы</th>
                <th>Хакатоны</th>
                <th>Общий приз</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((topic) => (
                <tr key={topic.id}>
                  <td>{topic.name}</td>
                  <td>{topic.count}</td>
                  <td>{topic.prize}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Link style={{ textDecoration: 'none', color: 'white' }} to="/hackatons-storage">
        <button className="view-all-button">Все хакатоны</button>
      </Link>
    </div>
  );
};

export default HackaDisplay;
