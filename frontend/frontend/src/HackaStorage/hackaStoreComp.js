import react, {useState, useEffect } from "react";
import { FaSearch, FaCalendarAlt, FaUsers } from "react-icons/fa";
import "./hackaStoreComp.css";

const HackaStoreComp = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({
      location: [],
      duration: [],
      tags: [],
      access: "",
    });
    const [hackathons, setHackathons] = useState([]);
  
    useEffect(() => {
      // Simulating fetching data from an API
      const fetchHackathons = async () => {
        // Replace this with actual API call
        const data = [
          {
            id: 1,
            title: "Хакатон в сфере AI для студентов университетов Казахстана",
            location: "Казахстан",
            duration: "3 дня",
            type: "Machine learning",
            date: "May 03, 2025",
            status: "Открыт",
          },
          {
            id: 2,
            title: "Хакатон в сфере AI для студентов университетов Казахстана",
            location: "Казахстан",
            duration: "3 дня",
            type: "Machine learning",
            date: "May 03, 2025",
            status: "Открыт",
          },
          {
            id: 3,
            title: "Хакатон в сфере AI для студентов университетов Казахстана",
            location: "Казахстан",
            duration: "3 дня",
            type: "Machine learning",
            date: "May 03, 2025",
            status: "Открыт",
          },
        ];
        setHackathons(data);
      };
  
      fetchHackathons();
    }, []);
  
    const handleSearch = () => {
      console.log("Searching for:", searchQuery);
    };
  
    return (
      <div className="hackaStoreContainer">
        <h1 className="title">Хранилище хакатонов</h1>
        <p className="subtitle">
          Площадка для разработчиков и объединёнств для совместного творчества, предложений и реализации инновационных решений.
        </p>
  
        <div className="searchContainer">
          <input
            type="text"
            className="searchInput"
            placeholder="Поиск хакатонов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="searchButton" onClick={handleSearch}>
            <FaSearch /> Найти хакатоны
          </button>
        </div>
  
        <div className="content">
          <aside className="filters">
            <h3>Локация</h3>
            <label><input type="checkbox" /> Алматы</label>
            <label><input type="checkbox" /> Нур-Султан</label>
            <label><input type="checkbox" /> Шымкент</label>
  
            <h3>Длительность</h3>
            <label><input type="checkbox" /> 1 день</label>
            <label><input type="checkbox" /> 3 дня</label>
            <label><input type="checkbox" /> 1 неделя</label>
  
            <h3>Интересующие теги</h3>
            <label><input type="checkbox" /> AI</label>
            <label><input type="checkbox" /> Blockchain</label>
            <label><input type="checkbox" /> FinTech</label>
  
            <h3>Открыт для</h3>
            <label><input type="radio" name="access" /> Все</label>
            <label><input type="radio" name="access" /> Регистрация</label>
          </aside>
  
          <div className="hackathonList">
            {hackathons.map((hackathon) => (
              <div key={hackathon.id} className="hackathonCard">
                <div className="hackathonImage"></div>
                <div className="hackathonDetails">
                  <h2>{hackathon.title}</h2>
                  <p>
                    <FaUsers /> {hackathon.type}
                  </p>
                  <p>
                    <FaCalendarAlt /> Дата: {hackathon.date}
                  </p>
                  <p className="status">{hackathon.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  export default HackaStoreComp;