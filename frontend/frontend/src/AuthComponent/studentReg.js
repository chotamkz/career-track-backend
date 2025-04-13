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
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Пароли не совпадают");
      return;
    }

    const result = await registerStudent(name, email, education, password);
    console.log("Registration response:", result);

    if (result.name !== '') {
      alert("Registration successful!");
      navigate("/");
    } else {
      alert("Registration failed: " + (result.message || "Unknown error"));
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
        <input
          type="text"
          placeholder="Электронная почта или телефон"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
        type="education"
        placeholder="Образование"
        value={education}
        onChange={(e) => setEducation(e.target.value)}
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
