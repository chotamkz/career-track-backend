import React from "react";
import FooterComp from "../Footer/FooterComp";
import NavigationBar from "../NavigationBar/NavigationBar";
import StudentReg from "../AuthComponent/studentReg";
import "./StudentReg.css";

function StudentRegistration() {
    return(
        <div className="studentRegContainer">
            <div className="Navbar">
                <NavigationBar />
            </div>
            <div className="studentRegComponent">
                <StudentReg />
            </div>
            <div className="FooterSection">
                <FooterComp />
            </div>
        </div>
    )
}

export default StudentRegistration;