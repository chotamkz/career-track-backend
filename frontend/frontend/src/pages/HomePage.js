import React, { useState } from "react";
import "./HomePage.css";
import NavigationBar from "../NavigationBar/NavigationBar";
import VacancyComponent from "../VacancyContainer/VacancyComponent";
import FooterComp from "../Footer/FooterComp";
import vacancyImage from "../assets/images/vacancy.jpg";
import internshipImage from "../assets/images/internship.jpg";
import hackathonImage from "../assets/images/hackathon.png";
import logo from "../assets/images/talentbridge-logo.png";
import {useEffect, useRef } from "react";



function HomePage() {
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

   const sliderRef = useRef(null);  // Reference to the slider
     const [currentIndex, setCurrentIndex] = useState(0);
     const slideCount = 4; // Number of slides

     // Function to automatically scroll to the next slide
     const autoScroll = () => {
         const nextIndex = (currentIndex + 1) % slideCount;
         setCurrentIndex(nextIndex);
         sliderRef.current.scrollTo({
             left: sliderRef.current.offsetWidth * nextIndex,
             behavior: "smooth"
         });
     };

     // Set interval to scroll automatically every 2 seconds
     useEffect(() => {
         const interval = setInterval(autoScroll, 2000);

         // Cleanup the interval on component unmount
         return () => clearInterval(interval);
     }, [currentIndex]);

    return (
        <div className="App">
            <div className="Navbar">
                <NavigationBar />
            </div>





             <div className="FullWidthSliderWrapper">
                            <div
                                className="FullWidthSlider"
                                ref={sliderRef}
                                style={{ display: "flex", overflowX: "hidden", scrollBehavior: "smooth" }}
                            >
                                {/* Slide 1 */}
                                <div className="slide" style={{ flex: "0 0 100%" }}>
                                    <div className="slide-content">
                                        <h1>Платформа для поиска возможностей стажировок, хакатонов и работы для студентов IT-сферы</h1>
                                        <h2>Начни свой карьерный путь с нами и получай рекомендации по вакансиям с использованием искусственного интеллекта</h2>
                                    </div>
                                </div>

                                {/* Slide 2 */}
                                <div className="slide" style={{ flex: "0 0 100%" }}>
                                    <div className="slide-content">
                                        <h2>Основные преимущества:</h2>
                                        <ul>
                                            <li>Простой и удобный интерфейс для поиска стажировок и работы</li>
                                            <li>Рекомендации, основанные на искусственном интеллекте</li>
                                            <li>Актуальные предложения по хакатонам и другим мероприятиям</li>
                                            <li>Широкая база данных вакансий от ведущих компаний</li>
                                            <li>Поддержка студентов на всех этапах их карьерного роста</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Slide 3 */}
                                <div className="slide" style={{ flex: "0 0 100%" }}>
                                    <div className="slide-content">
                                        <h2>Мы предлагаем:</h2>
                                        <ul>
                                            <li>Полную поддержку в поиске карьерных возможностей</li>
                                            <li>Доступ к информации о стажировках и хакатонах</li>
                                            <li>Широкий выбор вакансий от мировых лидеров</li>
                                            <li>Систему рекомендаций, которая помогает найти идеальную работу</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Slide 4 */}
                                <div className="slide" style={{ flex: "0 0 100%" }}>
                                    <div className="slide-content">
                                        <h2>Преимущества нашей платформы:</h2>
                                        <ul>
                                            <li>Платформа доступна 24/7, всегда актуальная информация</li>
                                            <li>Простота в использовании и доступность на всех устройствах</li>
                                            <li>Рекомендации на основе AI с использованием ваших предпочтений</li>
                                            <li>Единственная платформа, которая соединяет студентов с работодателями по всему миру</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>


            <div className="Welcome-Text">
                <h1>Платформа для поиска стажировок, хакатонов и работы для студентов IT</h1>
                <h2>Начни свой профессиональный путь с нами и получи рекомендации по вакансиям с использованием ИИ</h2>
            </div>

            <div className="ProjectAdvantages">
                <h3>Преимущества проекта:</h3>
                <ul>
                    <li>Удобный интерфейс для поиска стажировок и работы</li>
                    <li>Интеллектуальные рекомендации на основе ИИ</li>
                    <li>Актуальные предложения о хакатонах и других мероприятиях</li>
                    <li>Обширная база данных с вакансиями от ведущих компаний</li>
                    <li>Поддержка студентов на всех этапах карьерного роста</li>
                </ul>
            </div>

            {/* Add more content to extend the page */}
            <div className="AdditionalContent">
                <h3>Что еще мы предлагаем?</h3>
                <p>На нашей платформе вы найдете </p>
                <div className="image-gallery">
                    <img src={vacancyImage} alt="vacancies" />
                    <img src={internshipImage} alt="internships" />
                    <img src={hackathonImage} alt="hackathons" />
                </div>
            </div>


                <h1 id="Vacancies">Найди подходящую вакансию</h1>



            <div className="FooterSection">
                <FooterComp />
            </div>
        </div>
    );
}

export default HomePage;
