import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import "./studentLog.css";

const StudentLog = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login(emailOrPhone, password);

    if (result.token) {
      localStorage.setItem("token", result.token);
      alert("Login successful!");
      navigate("/");
    } else {
      alert("Login failed: " + (result.message || "Unknown error"));
    }
  };

  return (
    <div className="student-login-container">
      <div className="auth-box">
        <h2>Вход для поиска стажировок</h2>
        <input
          type="text"
          placeholder="Электронная почта или телефон"
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Войти</button>
        <Link to="/StudentRegistration">
          <button className="register-btn">Зарегистрироваться</button>
        </Link>
      </div>
    </div>
  );
};

export default StudentLog;
