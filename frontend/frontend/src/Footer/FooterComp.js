import React from "react";
import { FaLinkedin, FaInstagram, FaFacebook, FaTwitter, FaYoutube } from "react-icons/fa";
import "./FooterComp.css";
import bigLogo from "../assets/images/big-logo.png";

const FooterComp = () => {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-logo">
          <img src={bigLogo} alt="TalentBridge Logo" className="footer-logo-image" />
        </div>
        <div className="footer-columns">
          <div className="footer-column">
            <h4>О компании</h4>
            <p>Почему Мы?</p>
            <p>Что нового?</p>
          </div>
          <div className="footer-column">
            <h4>Помощь</h4>
            <p>Помощь & поддержка</p>
          </div>
          <div className="footer-column">
            <h4>Компания</h4>
            <p>О нас</p>
            <p>Связаться с нами</p>
          </div>
          <div className="footer-column">
            <h4>Связаться с нами</h4>
            <div className="social-icons">
              <FaLinkedin />
              <FaInstagram />
              <FaFacebook />
              <FaTwitter />
              <FaYoutube />
            </div>
          </div>
        </div>
      </div>
      <hr />
      <div className="footer-bottom">
        <p>Terms of Use</p>
        <p>Privacy Statement</p>
        <p id="rights">@2025 All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default FooterComp;
