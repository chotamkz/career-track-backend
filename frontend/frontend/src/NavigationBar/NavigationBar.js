import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, getUserRole, logout } from "../services/authService";
import "./NavigationBar.css";

function NavigationBar() {
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const email = localStorage.getItem("userEmail");
        if (token && email) {
            setUserEmail(email);
        }
    }, []);

    const handleLogout = () => {
        logout();
        setUserEmail(null);
        setShowDropdown(false);
        window.location.reload(); // Reload to reset state
    };

    return (
        <header className="navigationbar">
            <div className="logo" onClick={() => navigate("/")}>Logo</div>
            <nav>
                <ul className="nav-links">
                    <li><Link to="/VacancyPage">Поиск вакансий</Link></li>
                    <li><Link to="/ProfilePage">Мои заявки</Link></li>
                    <li><Link to="/">Прогноз востребованных навыков</Link></li>
                    <li><Link to="/Hackathons">Хакатоны</Link></li>
                    <li><Link to="/">О нас</Link></li>
                </ul>
            </nav>
            <div className="authbuttons">
                <button className="button-city">Город</button>
                
                {userEmail ? (
                    <div className="dropdown">
                        <button 
                            className="auth-buttons-log" 
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            {userEmail}
                        </button>
                        {showDropdown && (
                            <ul className="dropdown-menu">
                                <li><Link to="/ProfilePage">Account</Link></li>
                                <li onClick={handleLogout}>Log Off</li>
                            </ul>
                        )}
                    </div>
                ) : (
                    <button className="auth-buttons-log" onClick={() => navigate("/StudentAuth")}>
                        Войти
                    </button>
                )}
            </div>
        </header>
    );
}

export default NavigationBar;

// import React from "react";
// import { Link, useNavigate } from "react-router-dom";
// import "./NavigationBar.css"

// function NavigationBar() {
//     const navigate = useNavigate();
//     return(
//         <header className="navigationbar">
//             <div className="logo" onClick={() => navigate("/")}>Logo</div>
//             <nav>
//                 <ul className="nav-links">
//                 <li><Link to ="/VacancyPage">Поиск вакансий</Link></li>
//                 <li><Link to ="/ProfilePage">Мои заявки</Link></li>
//                 <li><Link to ="/">Прогноз востребованных навыков</Link></li>
//                 <li><Link to ="/Hackathons">Хакатоны </Link></li>
//                 <li><Link to ="/">О нас</Link></li>
//                 </ul>
//             </nav>
//             <div className="authbuttons">
//                 <button className="button-city">Город</button>
//                 <button className="auth-buttons-log" onClick={() => navigate("/StudentAuth")}>Войти</button>
//             </div>
//         </header>
//     );
// }

// export default NavigationBar;