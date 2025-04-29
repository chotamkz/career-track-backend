import React from "react";
import FooterComp from "../Footer/FooterComp";
import NavigationBar from "../NavigationBar/NavigationBar";
import StudentProfile from "../AccountComponents/StudentProfileNew";
import "./StudentAccount.css";

function StudentAccount() {
    return(
        <div className="studentAccountContainer">
            <div className="Navbar">
                <NavigationBar />
            </div>
            <div className="studentAccountContent">
                <div className="account-header">
                    <h1>Мой профиль</h1>
                </div>
                
                <div className="studentAccountComponent">
                    <StudentProfile />
                </div>
            </div>
            <FooterComp />
        </div>
    )
}

export default StudentAccount;