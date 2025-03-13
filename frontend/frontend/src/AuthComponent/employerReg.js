import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerEmployer } from "../services/authService";
import "./employerReg.css";

const EmployerReg = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Пароли не совпадают");
      return;
    }

    const result = await registerEmployer(emailOrPhone, password);
    if (result.message === "Employer registered successfully") {
      alert("Registration successful!");
      navigate("/EmployerLogin"); // Redirect to login
    } else {
      alert("Registration failed: " + result.message);
    }
  };

  return (
    <div className="employer-register-container">
      <div className="employer-register-box">
        <h2 className="employer-register-title">Регистрация для работодателей</h2>
        <input
          type="text"
          placeholder="Электронная почта или телефон"
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
          className="employer-register-input"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="employer-register-input"
        />
        <input
          type="password"
          placeholder="Подтвердите пароль"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="employer-register-input"
        />
        <button onClick={handleRegister} className="employer-register-button">Зарегистрироваться</button>
      </div>
    </div>
  );
};

export default EmployerReg;
