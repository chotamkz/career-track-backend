import React from "react";
import FooterComp from "../Footer/FooterComp";
import NavigationBar from "../NavigationBar/NavigationBar";
import StudentLog from "../AuthComponent/studentLog";
import "./StudentAuth.css";


function StudentAuth() {
    return(
        <div className="studentLogContainer">
            <div className="Navbar">
                <NavigationBar />
            </div>
            <div className="studentLogComponent">
                <StudentLog />
            </div>
                <FooterComp />
        </div>
    )
}

export default StudentAuth;