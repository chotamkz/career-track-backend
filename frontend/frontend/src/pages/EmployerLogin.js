import React from "react";
import NavigationBar from "../NavigationBar/NavigationBar";
import FooterComp from "../Footer/FooterComp";
import EmployerLog from "../AuthComponent/employerLog";
import "./EmployerLogin.css";

function EmployerLogin() {
    return(
        <div className="employerLogContainer">
            <div className="Navbar">
                <NavigationBar />
            </div>
            <div className="employerLogComponent">
                <EmployerLog />
            </div>
                <FooterComp />
        </div>
    )
}

export default EmployerLogin;