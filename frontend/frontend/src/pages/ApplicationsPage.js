import React from "react";
import NavigationBar from "../NavigationBar/NavigationBar";
import FooterComp from "../Footer/FooterComp";
import ApplicationDetails from "../AccountComponents/ApplicationDetails";
import "./ApplicationsPage.css";

const ApplicationsPage = () => {
  return (
    <div className="applications-page-container">
      <div className="Navbar">
        <NavigationBar />
      </div>
      <div className="applications-content">
        <ApplicationDetails />
      </div>
      <FooterComp />
    </div>
  );
};

export default ApplicationsPage; 