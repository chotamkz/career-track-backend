import React from "react";
import NavigationBar from "../NavigationBar/NavigationBar";
import FooterComp from "../Footer/FooterComp";
import EmployerReg from "../AuthComponent/employerReg";
import "./EmployerReg.css";

function EmployerRegistration() {
    return(
        <div className="employerRegContainer">
            <div className="Navbar">
                <NavigationBar />
            </div>
            <div className="employerRegComponent">
                <EmployerReg />
            </div>
            <div className="FooterSection">
                <FooterComp />
            </div>
        </div>
    )
}

export default EmployerRegistration;