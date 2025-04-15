import react, {useState, useEffect } from "react";
import { FaSearch, FaCalendarAlt, FaUsers, FaMapMarkerAlt, FaClock } from "react-icons/fa";
import "./hackaStoreComp.css";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const HackaStoreComp = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({
      location: [],
      duration: [],
      tags: [],
      access: "",
    });
    const [hackathons, setHackathons] = useState([]);
    const navigate = useNavigate();
  
    // Массив изображений для хакатонов
    const hackathonImages = [
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
      'https://images.unsplash.com/photo-1558655146-d09347e92766',
      'https://images.unsplash.com/photo-1581092335397-9fa73b389d58',
      'https://images.unsplash.com/photo-1550439062-609e1531270e',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998',
    ];
  
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
            image: hackathonImages[0]
          },
          {
            id: 2,
            title: "Хакатон в сфере AI для студентов университетов Казахстана",
            location: "Казахстан",
            duration: "3 дня",
            type: "Machine learning",
            date: "May 03, 2025",
            status: "Открыт",
            image: hackathonImages[1]
          },
          {
            id: 3,
            title: "Хакатон в сфере AI для студентов университетов Казахстана",
            location: "Казахстан",
            duration: "3 дня",
            type: "Machine learning",
            date: "May 03, 2025",
            status: "Открыт",
            image: hackathonImages[2]
          },
        ];
        setHackathons(data);
      };
  
      fetchHackathons();
    }, []);
  
    const handleSearch = () => {
      console.log("Searching for:", searchQuery);
    };
  
    const renderHackathonCards = () => {
      return hackathons.map((hackathon) => (
        <div className="hackathonCard" key={hackathon.id} onClick={() => navigateToHackathon(hackathon.id)}>
          <div className="hackathonImage">
            <img src={hackathon.image || 'https://via.placeholder.com/300x150'} alt={hackathon.title} />
          </div>
          <div className="hackathonDetails">
            <h2>{hackathon.title}</h2>
            <p><FaMapMarkerAlt />{hackathon.location}</p>
            <p><FaClock />{hackathon.duration} дней</p>
            <div className="statusBadge">{hackathon.status}</div>
          </div>
        </div>
      ));
    };
  
    const navigateToHackathon = (id) => {
      navigate(`/hackathon/${id}`);
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
          <aside className="hackafilters">
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
            {renderHackathonCards()}
          </div>
        </div>
      </div>
    );
  };
  
  export default HackaStoreComp;