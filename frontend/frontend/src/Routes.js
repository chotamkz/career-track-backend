import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage"
import Hackathons from "./pages/Hackathons";
import VacancyPage from "./pages/VacancyPage"
import HackaStorage from "./pages/HackaStorage";
import StudentAuth from "./pages/StudentAuth";
import StudentRegistration from "./pages/StudentRegistration";
import EmployerLogin from "./pages/EmployerLogin";
import EmployerRegistration from "./pages/EmployerRegistration";
import StudentAccount from "./pages/StudentAccount";
import EmployerAccount from "./pages/EmployerAccount";

const AppRoutes = () => {
    return(
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/ProfilePage" element={<ProfilePage/>} />
            <Route path="/VacancyPage" element={<VacancyPage/>} />
            <Route path="/Hackathons" element={<Hackathons />} />
            <Route path="/HackaStorage" element={<HackaStorage />} />
            <Route path="/StudentAuth" element={<StudentAuth />} />
            <Route path="/StudentRegistration" element={<StudentRegistration />} />
            <Route path="/EmployerLogin" element={<EmployerLogin />} />
            <Route path="/EmployerRegistration" element={<EmployerRegistration />} /> 
            <Route path="/StudentAccount" element={<StudentAccount />} />
            <Route path="/EmployerAccount" element={<EmployerAccount />} />
        </Routes>
    )
}

export default AppRoutes;