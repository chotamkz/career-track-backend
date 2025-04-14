import React from "react";
import "./HackaStorage.css";
import NavigationBar from "../NavigationBar/NavigationBar";
import FooterComp from "../Footer/FooterComp";
import HackaStoreComp from "../HackaStorage/hackaStoreComp";

function HackaStorage() {
    return(
        <div className="HackathonStorage">
            <div className="Navbar">
                <NavigationBar />
            </div>

            <div className="HackaStorage">
                <HackaStoreComp />
            </div> 
                <FooterComp />
        </div>
    )
}

export default HackaStorage;