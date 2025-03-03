import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage"
import Hackathons from "./pages/Hackathons";
import VacancyPage from "./pages/VacancyPage"

const AppRoutes = () => {
    return(
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/ProfilePage" element={<ProfilePage/>} />
            <Route path="/VacancyPage" element={<VacancyPage/>} />
            <Route path="/Hackathons" element={<Hackathons />} />
        </Routes>
    )
}

export default AppRoutes;