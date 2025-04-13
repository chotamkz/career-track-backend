import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerEmployer } from "../services/authService";
import "./employerReg.css";

const EmployerReg = () => {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!companyName) {
      newErrors.companyName = "Название компании обязательно";
    }
    if (!email) {
      newErrors.email = "Электронная почта обязательна";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Введите правильный формат электронной почты";
    }
    if (!password) {
      newErrors.password = "Пароль обязателен";
    } else if (password.length < 6) {
      newErrors.password = "Пароль должен быть не менее 6 символов";
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Пароли не совпадают";
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Подтверждение пароля обязательно";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await registerEmployer(companyName, email, password);
    console.log("Registration response:", result);

    if (result.user.id) {
      alert("Регистрация прошла успешно!");
      navigate("/");
    } else {
      alert("Ошибка регистрации: " + (result.message || "Неизвестная ошибка"));
    }
  };

  return (
    <div className="employer-register-container">
      <div className="employer-register-box">
        <h2 className="employer-register-title">Регистрация для работодателей</h2>

        <input
          type="text"
          placeholder="Название компании"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="employer-register-input"
        />
        {errors.companyName && <p className="error">{errors.companyName}</p>}

        <input
          type="text"
          placeholder="Электронная почта или телефон"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="employer-register-input"
        />
        {errors.email && <p className="error">{errors.email}</p>}

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="employer-register-input"
        />
        {errors.password && <p className="error">{errors.password}</p>}

        <input
          type="password"
          placeholder="Подтвердите пароль"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="employer-register-input"
        />
        {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}

        <button onClick={handleRegister} className="employer-register-button">
          Зарегистрироваться
        </button>
      </div>
    </div>
  );
};

export default EmployerReg;
