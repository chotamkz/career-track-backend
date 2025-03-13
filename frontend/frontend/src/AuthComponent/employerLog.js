import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import "./employerLog.css";

const EmployerLog = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login(emailOrPhone, password);

    if (result.token) {
      localStorage.setItem("token", result.token);
      localStorage.setItem("role", "employer");
      alert("Login successful!");
      navigate("/");
    } else {
      alert("Login failed: " + (result.message || "Unknown error"));
    }
  };

  return (
    <div className="employer-login-container">
      <div className="employer-login-box">
        <h2 className="employer-login-title">Вход для поиска стажеров и студентов</h2>
        <input
          type="text"
          placeholder="Электронная почта или телефон"
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
          className="employer-login-input"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="employer-login-input"
        />
        <a href="#" className="employer-forgot-password">Не помню пароль</a>
        <button onClick={handleLogin} className="employer-login-button">Войти</button>
        <Link to="/EmployerRegistration" style={{ textDecoration: 'none', color: 'white' }}>
          <button className="employer-register-button">Зарегистрироваться</button>
        </Link>
      </div>
    </div>
  );
};

export default EmployerLog;
