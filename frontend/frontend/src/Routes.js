import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage"
import VacancyPage from "./pages/VacancyPage"

const AppRoutes = () => {
    return(
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/ProfilePage" element={<ProfilePage/>} />
            <Route path="/VacancyPage" element={<VacancyPage/>} />
        </Routes>
    )
}

export default AppRoutes;