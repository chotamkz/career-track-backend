import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerStudent } from "../services/authService";
import "./studentReg.css";

const StudentReg = () => {
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

    const result = await registerStudent(emailOrPhone, password);
    if (result.message === "Student registered successfully") {
      alert("Registration successful!");
      navigate("/StudentLogin");
    } else {
      alert("Registration failed: " + result.message);
    }
  };

  return (
    <div className="student-reg-container">
      <div className="auth-box">
        <h2>Регистрация для поиска стажировок</h2>
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
        <input
          type="password"
          placeholder="Подтвердите пароль"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button onClick={handleRegister}>Зарегистрироваться</button>
      </div>
    </div>
  );
};

export default StudentReg;
