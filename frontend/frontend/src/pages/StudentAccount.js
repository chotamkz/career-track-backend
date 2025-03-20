import React from "react";
import FooterComp from "../Footer/FooterComp";
import NavigationBar from "../NavigationBar/NavigationBar";
import StudentProfile from "../AccountComponents/studentProfile";
import "./StudentAccount.css";


function StudentAccount() {
    return(
        <div className="studentAccountContainer">
            <div className="Navbar">
                <NavigationBar />
            </div>
            <div className="studentAccountComponent">
                <StudentProfile />
            </div>
            <div className="FooterSection">
                <FooterComp />
            </div>
        </div>
    )
}

export default StudentAccount;