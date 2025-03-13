import React from "react"
import { Link } from "react-router-dom"
import "./HackaDisplay.css";

const hackathons = [
  {
    id: 1,
    title: "Хакатон в сфере AI для студентов университетов Казахстана",
    daysLeft: 15,
    prize: "$28,750 для победителей",
    participants: 1200,
    online: true,
  },
  {
    id: 2,
    title: "Хакатон в сфере AI для студентов университетов Казахстана",
    daysLeft: 15,
    prize: "$28,750 для победителей",
    participants: 1200,
    online: true,
  },
  {
    id: 3,
    title: "Хакатон в сфере AI для студентов университетов Казахстана",
    daysLeft: 15,
    prize: "$28,750 для победителей",
    participants: 1200,
    online: true,
  },
];

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
  return (
    <div className="hackathons">
      <h2 id="forYou">Хакатоны для вас</h2>
      <div className="hackathons-container">
        <div className="hackathons-list">
          {hackathons.map((hackathon) => (
            <div key={hackathon.id} className="hackathon-card">
              <div className="hackathon-image-placeholder"></div>
              <div className="hackathon-details">
                <h3>{hackathon.title}</h3>
                <span className="days-left">{hackathon.daysLeft} дней до начала</span>
                <span className="status">{hackathon.online ? "🌐 Онлайн" : "🏢 Оффлайн"}</span>
                <p className="prize">{hackathon.prize}</p>
                <p className="participants">{hackathon.participants} участников</p>
              </div>
            </div>
          ))}
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
      <Link style={{ textDecoration: 'none', color: 'white'  }} to ="/HackaStorage"><button className="view-all-button">Все хакатоны</button></Link>
   </div>
  );
};

export default HackaDisplay;
