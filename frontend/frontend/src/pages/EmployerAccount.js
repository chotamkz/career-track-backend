import React from "react";
import FooterComp from "../Footer/FooterComp";
import NavigationBar from "../NavigationBar/NavigationBar";
import EmployerProfile from "../AccountComponents/employerProfile";
import "./EmployerAccount.css";


function EmployerAccount() {
    return(
        <div className="studentLogContainer">
            <div className="Navbar">
                <NavigationBar />
            </div>
            <div className="employerAccountComponent">
                <EmployerProfile />
            </div>
            <div className="FooterSection">
                <FooterComp />
            </div>
        </div>
    )
}

export default EmployerAccount;