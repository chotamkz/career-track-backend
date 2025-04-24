import React from "react";
import FooterComp from "../Footer/FooterComp";
import NavigationBar from "../NavigationBar/NavigationBar";
import EmployerApplications from "../AccountComponents/EmployerApplications";
import "./EmployerAccount.css";

function EmployerApplicationsPage() {
    return(
        <div className="employerAccountContainer">
            <div className="Navbar">
                <NavigationBar />
            </div>
            <div className="employerAccountContent">
                <h1 className="employer-account-main-title">Заявки соискателей</h1>
                
                <div className="employerAccountComponent">
                    <EmployerApplications />
                </div>
            </div>
            <FooterComp />
        </div>
    );
}

export default EmployerApplicationsPage; 