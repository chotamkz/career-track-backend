import React from "react";
import FooterComp from "../Footer/FooterComp";
import NavigationBar from "../NavigationBar/NavigationBar";
import EmployerProfile from "../AccountComponents/employerProfile";
import "./EmployerAccount.css";


function EmployerAccount() {
    return(
        <div className="employerAccountContainer">
            <div className="Navbar">
                <NavigationBar />
            </div>
            <div className="employerAccountComponent">
                <EmployerProfile />
            </div>
                <FooterComp />
        </div>
    )
}

export default EmployerAccount;