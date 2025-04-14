import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, logout, getUserRole } from "../services/authService";
import "./NavigationBar.css";


function NavigationBar() {
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (isAuthenticated()) {
            setUserRole(getUserRole());
        }
    }, []);
    
    // Обработчик прокрутки для изменения стиля навбара
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        
        window.addEventListener('scroll', handleScroll);
        
        // Очистка слушателя события при размонтировании
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Блокировка прокрутки страницы при открытом мобильном меню
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [mobileMenuOpen]);

    const handleLogout = () => {
        logout();
        setUserRole(null);
        setMobileMenuOpen(false);
        navigate("/auth/student");
    };
    
    // Закрытие выпадающего меню при клике вне его
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownOpen && !event.target.closest('.nav-dropdown')) {
                setDropdownOpen(false);
            }
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [dropdownOpen]);

    // Закрытие мобильного меню при изменении размера окна
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768 && mobileMenuOpen) {
                setMobileMenuOpen(false);
            }
        };
        
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [mobileMenuOpen]);

    // Обработчик нажатия на ссылки в мобильном меню
    const handleNavLinkClick = () => {
        setMobileMenuOpen(false);
    };

    return (
        <header className={`navigationbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="footer-logo">
                <h2>TalentBridge</h2>
            </div>
            
            {/* Кнопка мобильного меню */}
            <button 
                className={`mobile-menu-btn ${mobileMenuOpen ? 'open' : ''}`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Меню"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>
            
            {/* Затемнение фона при открытом мобильном меню */}
            <div 
                className={`overlay ${mobileMenuOpen ? 'open' : ''}`} 
                onClick={() => setMobileMenuOpen(false)}
            ></div>
            
            <nav className={mobileMenuOpen ? 'open' : ''}>
                <ul className="nav-links">
                    <li><Link to="/vacancies" onClick={handleNavLinkClick}>Поиск вакансий</Link></li>
                    <li><Link to="/profile" onClick={handleNavLinkClick}>Мои заявки</Link></li>
                    <li><Link to="/hackathons" onClick={handleNavLinkClick}>Хакатоны</Link></li>
                    <li><Link to="/" onClick={handleNavLinkClick}>О нас</Link></li>
                </ul>
            </nav>
            
            <div className="authbuttons">
                {isAuthenticated() ? (
                    <div className="nav-dropdown">
                        <button className="auth-buttons-log" onClick={() => setDropdownOpen(!dropdownOpen)}>
                            Аккаунт ▼
                        </button>
                        {dropdownOpen && (
                            <div className="dropdown-menu">
                                {userRole === "STUDENT" ? (
                                    <Link to="/account/student" className="dropdown-item" onClick={() => setDropdownOpen(false)}>Профиль студента</Link>
                                ) : userRole === "EMPLOYER" ? (
                                    <Link to="/account/employer" className="dropdown-item" onClick={() => setDropdownOpen(false)}>Профиль работодателя</Link>
                                ) : (
                                    <p className="dropdown-item">Неизвестный профиль</p>
                                )}
                                <button onClick={handleLogout} className="dropdown-item">Выйти</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button className="auth-buttons-log" onClick={() => navigate("/auth/student")}>Войти</button>
                )}
            </div>
        </header>
    );
}

export default NavigationBar;
