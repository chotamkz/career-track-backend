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
            <Route path="/profile" element={<ProfilePage/>} />
            
            {/* Маршруты для страницы вакансий */}
            <Route path="/vacancies" element={<VacancyPage/>} />
            <Route path="/vacancies/search" element={<VacancyPage/>} />
            <Route path="/vacancies/:id" element={<VacancyPage/>} />
            
            {/* Маршруты для страницы хакатонов */}
            <Route path="/hackathons" element={<Hackathons />} />
            <Route path="/hackathons/:id" element={<Hackathons />} />
            
            <Route path="/hackatons-storage" element={<HackaStorage />} />
            <Route path="/auth/student" element={<StudentAuth />} />
            <Route path="/auth/student/register" element={<StudentRegistration />} />
            <Route path="/auth/employer" element={<EmployerLogin />} />
            <Route path="/auth/employer/register" element={<EmployerRegistration />} /> 
            <Route path="/account/student" element={<StudentAccount />} />
            <Route path="/account/employer" element={<EmployerAccount />} />
        </Routes>
    )
}

export default AppRoutes;