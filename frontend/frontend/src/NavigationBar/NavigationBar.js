import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./NavigationBar.css"

function NavigationBar() {
    const navigate = useNavigate();
    return(
        <header className="navigationbar">
            <div className="logo" onClick={() => navigate("/")}>Logo</div>
            <nav>
                <ul className="nav-links">
                <li><Link to ="/VacancyPage">Поиск вакансий</Link></li>
                <li><Link to ="/ProfilePage">Мои заявки</Link></li>
                <li><Link to ="/">Прогноз востребованных навыков</Link></li>
                <li><Link to ="/">О нас</Link></li>
                </ul>
            </nav>
            <div className="authbuttons">
                <button className="button-city">Город</button>
                <button className="auth-buttons-log">Войти</button>
            </div>
        </header>
    );
}

export default NavigationBar;