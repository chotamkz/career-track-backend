import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./HackaDisplay.css";
import { hackathonService } from '../services/api';

const topics = [
  { id: 1, name: "Для новичков", count: 92, prize: "1,000,000 тенге" },
  { id: 2, name: "Machine Learning", count: 59, prize: "$500,000 тенге" },
  { id: 3, name: "AI", count: 56, prize: "2,000,000 тенге" },
  { id: 4, name: "Здравоохранение", count: 38, prize: "400,000 тенге" },
  { id: 5, name: "Блокчейн", count: 23, prize: "700,000 тенге" },
  { id: 6, name: "Финтех", count: 21, prize: "1,000,000 тенге" },
  { id: 7, name: "База Данных", count: 15, prize: "800,000 тенге" },
  { id: 8, name: "Образование", count: 10, prize: "550,000 тенге" },
];

// Массив изображений для хакатонов
const hackathonImages = [
  'https://images.squarespace-cdn.com/content/v1/5e6542d2ae16460bb741a9eb/1603318636443-A846ACUKNYUBA0RPLJ94/marvin-meyer-SYTO3xs06fU-unsplash.jpg',
  'https://cdn.prod.website-files.com/5b3dd54182ecae4d1602962f/609e33e18c5000af6211f094_HR%20Hackathon%20-%20Section%202.jpg',
  'https://www.madebywifi.com/wp-content/uploads/2018/01/internet-for-hackatons-1024x480.jpg',
  'https://images.unsplash.com/photo-1542744095-fcf48d80b0fd'
];

const HackaDisplay = () => {
  const [hackathons, setHackathons] = useState([]);
  const [filteredHackathons, setFilteredHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        setLoading(true);
        
        const data = await hackathonService.getAllHackathons();

        if (data.error) {
          throw new Error(data.error);
        }

        // Добавляем изображения к хакатонам
        const hackathonsWithImages = data.map((hackathon, index) => ({
          ...hackathon,
          image: hackathonImages[index % hackathonImages.length]
        }));

        setHackathons(hackathonsWithImages);
        setFilteredHackathons(hackathonsWithImages);
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

  // Эффект для обработки изменений в параметрах URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('query');
    
    if (query) {
      const filtered = hackathons.filter(hackathon => 
        hackathon.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredHackathons(filtered);
    } else {
      setFilteredHackathons(hackathons);
    }
  }, [location.search, hackathons]);

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
          ) : filteredHackathons.length === 0 ? (
            <p className="no-results">По вашему запросу хакатонов не найдено</p>
          ) : (
            filteredHackathons.map((hackathon) => (
              <div key={hackathon.id} className="hackathon-card">
                <div className="hackathon-image" style={{ backgroundImage: `url(${hackathon.image})` }}>
                  {/* Изображение хакатона как фон */}
                </div>
                <div className="hackathon-content">
                  <h3 className="hackathon-title">{hackathon.name}</h3>
                  <div className="hackathon-meta">
                    <div className="days-left">
                      <span className="days-tag">{calculateDaysLeft(hackathon.start_date)} дней до начала</span>
                    </div>
                    <div className="format-tag">
                      <span className="format-icon">
                        {hackathon.format.toLowerCase() === "online" ? "🌐" : "🏢"}
                      </span>
                      {hackathon.format.toLowerCase() === "online" ? "Онлайн" : "Оффлайн"}
                    </div>
                  </div>
                  <div className="hackathon-footer">
                    <div className="prize-info">₸ {hackathon.prizes}</div>
                    <div className="participants-info">{hackathon.participants} участников</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="top-topics">
          <h2>Топ темы хакатонов</h2>
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
    </div>
  );
};

export default HackaDisplay;
