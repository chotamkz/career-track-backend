import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, logout, getUserRole } from "../services/authService";
import "./NavigationBar.css";

function NavigationBar() {
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        if (isAuthenticated()) {
            setUserRole(getUserRole());
        }
    }, []);

    const handleLogout = () => {
        logout();
        setUserRole(null);
        navigate("/StudentAuth");
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

                {isAuthenticated() ? (
                    <div className="nav-dropdown">
                        <button className="auth-buttons-log" onClick={() => setDropdownOpen(!dropdownOpen)}>
                            Аккаунт ▼
                        </button>
                        {dropdownOpen && (
                            <div className="dropdown-menu">
                                {userRole === "STUDENT" ? (
                                    <Link to="/StudentAccount" className="dropdown-item">Профиль студента</Link>
                                ) : userRole === "EMPLOYER" ? (
                                    <Link to="/EmployerAccount" className="dropdown-item">Профиль работодателя</Link>
                                ) : (
                                    <p className="dropdown-item">Неизвестный профиль</p>
                                )}
                                <button onClick={handleLogout} className="dropdown-item">Выйти</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button className="auth-buttons-log" onClick={() => navigate("/StudentAuth")}>Войти</button>
                )}
            </div>
        </header>
    );
}

export default NavigationBar;


// import React, { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { isAuthenticated, logout, getUserRole } from "../services/authService";
// import "./NavigationBar.css";

// function NavigationBar() {
//     const navigate = useNavigate();
//     const [dropdownOpen, setDropdownOpen] = useState(false);

//     const handleLogout = () => {
//         logout();
//         navigate("/StudentAuth");
//     };

//     return (
//         <header className="navigationbar">
//             <div className="logo" onClick={() => navigate("/")}>Logo</div>
//             <nav>
//                 <ul className="nav-links">
//                     <li><Link to="/VacancyPage">Поиск вакансий</Link></li>
//                     <li><Link to="/ProfilePage">Мои заявки</Link></li>
//                     <li><Link to="/">Прогноз востребованных навыков</Link></li>
//                     <li><Link to="/Hackathons">Хакатоны</Link></li>
//                     <li><Link to="/">О нас</Link></li>
//                 </ul>
//             </nav>
//             <div className="authbuttons">
//                 <button className="button-city">Город</button>

//                 {isAuthenticated() ? (
//                     <div className="nav-dropdown">
//                         <button className="auth-buttons-log" onClick={() => setDropdownOpen(!dropdownOpen)}>
//                             Аккаунт ▼
//                         </button>
//                         {dropdownOpen && (
//                             <div className="dropdown-menu">
//                                 <Link 
//                                     to={getUserRole() === "STUDENT" ? "/StudentAccount" : "/EmployerAccount"} 
//                                     className="dropdown-item"
//                                 >
//                                     Профиль
//                                 </Link>
//                                 <button onClick={handleLogout} className="dropdown-item">Выйти</button>
//                             </div>
//                         )}
//                     </div>
//                 ) : (
//                     <button className="auth-buttons-log" onClick={() => navigate("/StudentAuth")}>Войти</button>
//                 )}
//             </div>
//         </header>
//     );
// }

// export default NavigationBar;
