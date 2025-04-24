import React, { useState, useEffect } from "react";
import FooterComp from "../Footer/FooterComp";
import NavigationBar from "../NavigationBar/NavigationBar";
import EmployerProfile from "../AccountComponents/employerProfile";
import "./EmployerAccount.css";

function EmployerAccount() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
                <h1 className="employer-account-main-title">Профиль компании</h1>
                
                {error && (
                    <div className="employer-account-error">{error}</div>
                )}
                
                <div className="employerAccountComponent">
                    {loading ? (
                        <div className="employer-account-loading">Загрузка...</div>
                    ) : (
                        <EmployerProfile />
                    )}
                </div>
            </div>
            <FooterComp />
        </div>
    );
}

export default EmployerAccount;