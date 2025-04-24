import React, { useState, useEffect } from "react";
import FooterComp from "../Footer/FooterComp";
import NavigationBar from "../NavigationBar/NavigationBar";
import EmployerProfile from "../AccountComponents/employerProfile";
import EmployerVacancies from "../AccountComponents/EmployerVacancies";
import EmployerApplications from "../AccountComponents/EmployerApplications";
import "./EmployerAccount.css";

function EmployerAccount() {
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Для отладки - выводим текущую активную вкладку
    useEffect(() => {
        console.log("Active tab changed to:", activeTab);
    }, [activeTab]);

    // Функция для обработки ошибок в дочерних компонентах
    const handleComponentError = (componentName, error) => {
        console.error(`Error in ${componentName}:`, error);
        setError(`Ошибка загрузки компонента ${componentName}: ${error.message}`);
    };

    // Функция для безопасного рендеринга компонентов
    const renderSafeComponent = (Component, name) => {
        try {
            return <Component />;
        } catch (err) {
            handleComponentError(name, err);
            return <div className="employer-account-error">Ошибка рендеринга компонента {name}</div>;
        }
    };

    return(
        <div className="employerAccountContainer">
            <div className="Navbar">
                <NavigationBar />
            </div>
            <div className="employerAccountContent">
                <div className="employer-account-tabs">
                    <button 
                        className={`employer-account-tab ${activeTab === "profile" ? "active" : ""}`}
                        onClick={() => setActiveTab("profile")}
                    >
                        Профиль компании
                    </button>
                    <button 
                        className={`employer-account-tab ${activeTab === "vacancies" ? "active" : ""}`}
                        onClick={() => setActiveTab("vacancies")}
                    >
                        Управление вакансиями
                    </button>
                    <button 
                        className={`employer-account-tab ${activeTab === "applications" ? "active" : ""}`}
                        onClick={() => setActiveTab("applications")}
                    >
                        Заявки соискателей
                    </button>
                </div>
                
                {error && (
                    <div className="employer-account-error">{error}</div>
                )}
                
            <div className="employerAccountComponent">
                    {loading ? (
                        <div className="employer-account-loading">Загрузка...</div>
                    ) : (
                        <>
                            {activeTab === "profile" && <EmployerProfile />}
                            {activeTab === "vacancies" && <EmployerVacancies />}
                            {activeTab === "applications" && <EmployerApplications />}
                        </>
                    )}
                </div>
            </div>
                <FooterComp />
        </div>
    );
}

export default EmployerAccount;