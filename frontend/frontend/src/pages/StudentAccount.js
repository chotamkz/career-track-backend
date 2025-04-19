import React, { useState } from "react";
import FooterComp from "../Footer/FooterComp";
import NavigationBar from "../NavigationBar/NavigationBar";
import StudentProfile from "../AccountComponents/studentProfile";
import ApplicationDetails from "../AccountComponents/ApplicationDetails";
import "./StudentAccount.css";

function StudentAccount() {
    const [activeTab, setActiveTab] = useState("profile");

    return(
        <div className="studentAccountContainer">
            <div className="Navbar">
                <NavigationBar />
            </div>
            <div className="studentAccountContent">
                <div className="account-tabs">
                    <button 
                        className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
                        onClick={() => setActiveTab("profile")}
                    >
                        Мой профиль
                    </button>
                    <button 
                        className={`tab-button ${activeTab === "applications" ? "active" : ""}`}
                        onClick={() => setActiveTab("applications")}
                    >
                        Мои заявки
                    </button>
                </div>
                
                <div className="studentAccountComponent">
                    {activeTab === "profile" ? (
                        <StudentProfile />
                    ) : (
                        <ApplicationDetails />
                    )}
                </div>
            </div>
            <FooterComp />
        </div>
    )
}

export default StudentAccount;