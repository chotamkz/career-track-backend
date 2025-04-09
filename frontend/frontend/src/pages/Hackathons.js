import React from "react";
import "./Hackathons.css"
import NavigationBar from "../NavigationBar/NavigationBar";
import FooterComp from "../Footer/FooterComp";
import HackaSearch from "../HackathonComp/HackaSearch";
import HackaDisplay from "../HackathonComp/HackaDisplay";

function Hackathons() {
      return (
          <div className="HackathonsPage">
            <div className="Navbar">
                <NavigationBar />
             </div>
            <div className="HackaText">
                <h1>Тут ищут хакатоны</h1>
                <p>Площадка, где разработчики объединяются для совместного творчества, вдохновения и реализации инновационных решений.</p>
            </div>
            <div className="HackaSearch">
                <HackaSearch />
            </div>
            
            <div className="HackathonDisplay">
                <HackaDisplay />
            </div>  
                <FooterComp />
          </div>
        );
  }
  
  export default Hackathons;