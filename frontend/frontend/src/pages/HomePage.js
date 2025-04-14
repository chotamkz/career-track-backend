import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import "./HomePage.css";
import NavigationBar from "../NavigationBar/NavigationBar";
import FooterComp from "../Footer/FooterComp";


function HomePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentSlide, setCurrentSlide] = useState(0);
    const sliderRef = useRef(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Обработчик изменения размера окна
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Автоматическая прокрутка слайдов
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % 3);
        }, 5000);
        
        return () => clearInterval(interval);
    }, []);

    // Обработчик смены слайда с улучшенной анимацией
    const handleSlideChange = (index) => {
        // Добавляем класс для анимации исчезновения
        if (sliderRef.current) {
            const slides = sliderRef.current.querySelectorAll('.slide');
            slides[currentSlide].classList.add('fade-out');
            
            // Через небольшую задержку меняем слайд и добавляем класс для появления
            setTimeout(() => {
                setCurrentSlide(index);
                setTimeout(() => {
                    const newActiveSlide = sliderRef.current.querySelector('.slide.active');
                    if (newActiveSlide) {
                        newActiveSlide.classList.add('fade-in');
                        // Удаляем класс через время анимации
                        setTimeout(() => {
                            newActiveSlide.classList.remove('fade-in');
                            slides[currentSlide].classList.remove('fade-out');
                        }, 500);
                    }
                }, 50);
            }, 200);
        } else {
            setCurrentSlide(index);
        }
    };

    // Свайп на мобильных устройствах
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && currentSlide < 2) {
            handleSlideChange(currentSlide + 1);
        } else if (isRightSwipe && currentSlide > 0) {
            handleSlideChange(currentSlide - 1);
        }

        setTouchStart(null);
        setTouchEnd(null);
    };

    // Контент слайдов
    const slideContents = [
        {
            title: "Для студентов",
            subtitle: "Преимущества для начинающих IT-специалистов",
            items: [
                "Подбор стажировок и вакансий, соответствующих вашим навыкам и предпочтениям",
                "Прямой контакт с IT-компаниями, заинтересованными в молодых талантах",
                "Актуальная информация о требованиях рынка труда в IT-сфере",
                "Возможность создания профессионального портфолио",
                "Рекомендации по подготовке к интервью и улучшению резюме"
            ]
        },
        {
            title: "Для работодателей",
            subtitle: "Почему стоит нанимать молодых специалистов",
            items: [
                "Доступ к пулу мотивированных и амбициозных IT-студентов",
                "Свежий взгляд и современные подходы к решению задач",
                "Возможность растить специалистов под потребности вашей компании",
                "Эффективный рекрутинг с фокусом на специфичные технологии",
                "Укрепление бренда работодателя среди молодого поколения IT-специалистов"
            ]
        },
        {
            title: "О платформе",
            subtitle: "Почему выбирают нас",
            items: [
                "Уникальный алгоритм подбора вакансий с учетом навыков и предпочтений",
                "Фокус на специалистов начального и среднего уровня в IT-сфере",
                "Удобный интерфейс для поиска и откликов на вакансии",
                "Регулярные обновления базы предложений от IT-компаний",
                "Возможность быстро сравнивать и отслеживать заинтересовавшие вакансии"
            ]
        }
    ];

    // Генерируем частицы для фона
    const generateParticles = () => {
        const particles = [];
        const particleCount = isMobile ? 8 : 15;
        
        for (let i = 0; i < particleCount; i++) {
            const size = Math.random() * (isMobile ? 20 : 30) + 10;
            particles.push(
                <div 
                    key={i}
                    className="particle"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        width: `${size}px`,
                        height: `${size}px`,
                        animationDelay: `${Math.random() * 15}s`,
                        animationDuration: `${Math.random() * 10 + 10}s`
                    }}
                />
            );
        }
        return particles;
    };

    return (
        <div className="App">
            <NavigationBar />

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-particles">
                    {generateParticles()}
                </div>
                <div className="hero-content">
                    <h1 className="hero-title">Найдите свою идеальную <span>IT-вакансию</span></h1>
                    <p className="hero-subtitle">
                        Платформа для IT-студентов, которая связывает талантливых молодых специалистов с лучшими компаниями. Начните свою карьеру прямо сейчас!
                    </p>
                    <div className="hero-buttons">
                        <Link to="/vacancies" className="hero-btn">Найти вакансии</Link>
                        <Link to="/login" className="hero-btn hero-btn-secondary">Войти</Link>
                    </div>
                </div>
            </section>

            {/* Slider Section */}
            <div className="FullWidthSliderWrapper">
                <div 
                    className="FullWidthSlider" 
                    ref={sliderRef}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Отображаем только активный слайд */}
                    <div className={`slide ${currentSlide === 0 ? 'active' : 'inactive'}`}>
                        <div className="slide-content">
                            <h1>{slideContents[0].title}</h1>
                            <h2>{slideContents[0].subtitle}</h2>
                            <ul>
                                {slideContents[0].items.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    
                    <div className={`slide ${currentSlide === 1 ? 'active' : 'inactive'}`}>
                        <div className="slide-content">
                            <h1>{slideContents[1].title}</h1>
                            <h2>{slideContents[1].subtitle}</h2>
                            <ul>
                                {slideContents[1].items.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    
                    <div className={`slide ${currentSlide === 2 ? 'active' : 'inactive'}`}>
                        <div className="slide-content">
                            <h1>{slideContents[2].title}</h1>
                            <h2>{slideContents[2].subtitle}</h2>
                            <ul>
                                {slideContents[2].items.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
                
                {/* Слайдер навигация и стрелки */}
                <div className="slider-nav">
                    <button 
                        className="slider-arrow slider-arrow-left" 
                        onClick={() => handleSlideChange(currentSlide > 0 ? currentSlide - 1 : 2)}
                        aria-label="Предыдущий слайд"
                    >
                        &lt;
                    </button>
                    <div className="slider-dots">
                        {[0, 1, 2].map((index) => (
                            <div 
                                key={index}
                                className={`dot ${currentSlide === index ? 'active' : ''}`}
                                onClick={() => handleSlideChange(index)}
                            />
                        ))}
                    </div>
                    <button 
                        className="slider-arrow slider-arrow-right" 
                        onClick={() => handleSlideChange(currentSlide < 2 ? currentSlide + 1 : 0)}
                        aria-label="Следующий слайд"
                    >
                        &gt;
                    </button>
                </div>
            </div>

            {/* Features Section */}
            <section className="features-section">
                <div className="features-bg"></div>
                <div className="features-container">
                    <h2 className="section-title">Как это работает</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="feature-title">Создайте профиль</h3>
                            <p className="feature-description">
                                Зарегистрируйтесь и заполните профиль, указав ваши навыки, образование и предпочтения в работе
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="feature-title">Ищите вакансии</h3>
                            <p className="feature-description">
                                Используйте удобные фильтры для поиска подходящих стажировок и начальных позиций в IT-компаниях
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="feature-title">Подавайте заявки</h3>
                            <p className="feature-description">
                                Откликайтесь на интересующие вас позиции всего в несколько кликов и отслеживайте их статус
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="categories-section">
                <div className="categories-container">
                    <h2 className="section-title">Популярные направления</h2>
                    <div className="categories-grid">
                        <div className="category-card">
                            <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c" alt="Разработка" className="category-img" />
                            <div className="category-content">
                                <h3 className="category-title">Разработка</h3>
                                <p className="category-count">125 вакансий</p>
                            </div>
                        </div>
                        <div className="category-card">
                            <img src="https://images.unsplash.com/photo-1558655146-d09347e92766" alt="Data Science" className="category-img" />
                            <div className="category-content">
                                <h3 className="category-title">Data Science</h3>
                                <p className="category-count">87 вакансий</p>
                            </div>
                        </div>
                        <div className="category-card">
                            <img src="https://images.unsplash.com/photo-1575089976121-8ed7b2a54265" alt="Дизайн" className="category-img" />
                            <div className="category-content">
                                <h3 className="category-title">UX/UI Дизайн</h3>
                                <p className="category-count">64 вакансии</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <FooterComp />
        </div>
    );
}

export default HomePage;