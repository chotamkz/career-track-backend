import React from "react";
import { useParams } from "react-router-dom";
import NavigationBar from "../NavigationBar/NavigationBar";
import FooterComp from "../Footer/FooterComp";
import VacancyDetails from "../VacancyDetails/VacancyDetails";
import "./VacancyDetailsPage.css";

const VacancyDetailsPage = () => {
  const { id } = useParams();

  return (
    <div className="VacancyDetailsPage">
      <NavigationBar />
      <div className="ContentWrapper">
        <div className="VacancyDetailContainer">
          <VacancyDetails />
        </div>
      </div>
      <FooterComp />
    </div>
  );
};

export default VacancyDetailsPage; 