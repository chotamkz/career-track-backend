import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerStudent } from "../services/authService";
import "./studentReg.css";

const StudentReg = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [education, setEducation] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!name) {
      newErrors.name = "Имя обязательно"
    }

    if (!email) {
      newErrors.email = "Электронная почта обязательна";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Введите правильный формат электронной почты";
    }

    if (!education) {
      newErrors.education = "Название ВУЗа обязательно";
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

    const result = await registerStudent(name, email, education, password);
    console.log("Registration response:", result);

    if (result.user.id) {
      alert("Регистрация прошла успешно!");
      navigate("/");
    } else {
      alert("Ошибка регистрации: " + (result.message || "Неизвестная ошибка"));
    }
  };

  return (
    <div className="student-reg-container">
      <div className="auth-box">
        <h2>Регистрация для поиска стажировок</h2>
        <input
          type="text"
          placeholder="Ваше имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {errors.name && <p className="error">{errors.name}</p>}

        <input
          type="text"
          placeholder="Электронная почта или телефон"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p className="error">{errors.email}</p>}

        <input
        type="education"
        placeholder="Образование"
        value={education}
        onChange={(e) => setEducation(e.target.value)}
        />
        {errors.education && <p className="error">{errors.education}</p>}
        
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && <p className="error">{errors.password}</p>}

        <input
          type="password"
          placeholder="Подтвердите пароль"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {errors.confirmPassord && <p className="error">{errors.confirmPassword}</p>}

        <button onClick={handleRegister}>Зарегистрироваться</button>
      </div>
    </div>
  );
};

export default StudentReg;
