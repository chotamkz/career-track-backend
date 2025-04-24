import React from "react";
import FooterComp from "../Footer/FooterComp";
import NavigationBar from "../NavigationBar/NavigationBar";
import EmployerVacancies from "../AccountComponents/EmployerVacancies";
import "./EmployerAccount.css";

function EmployerVacanciesPage() {
    return(
        <div className="employerAccountContainer">
            <div className="Navbar">
                <NavigationBar />
            </div>
            <div className="employerAccountContent">
                <h1 className="employer-account-main-title">Управление вакансиями</h1>
                
                <div className="employerAccountComponent">
                    <EmployerVacancies />
                </div>
            </div>
            <FooterComp />
        </div>
    );
}

export default EmployerVacanciesPage; 