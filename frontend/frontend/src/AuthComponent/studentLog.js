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
    const result = await login(emailOrPhone, password, "STUDENT"); // Pass "student" to check role

    if (result.error) {
      alert("Login failed: " + result.error);
    } else {
      localStorage.setItem("token", result.token);
      localStorage.setItem("role", result.userType); // Store the actual userType
      alert("Login successful!");
      navigate("/");
    }
  };

  return (
    <div className="student-login-container">
      <div className="student-login-box">
        <h2 className="student-login-title">Вход для поиска стажировок</h2>
        <input
          type="text"
          placeholder="Электронная почта или телефон"
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
          className="student-login-input"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="student-login-input"
        />
        <a href="#" className="student-forgot-password">Не помню пароль</a>
        <button onClick={handleLogin} className="student-login-button">Войти</button>
        <Link to="/auth/student/register" style={{ textDecoration: "none" }}>
          <button className="student-register-button">Зарегистрироваться</button>
        </Link>
        <div className="employer-section">
          <h3 className="employer-title">Для работодателей</h3>
          <p className="employer-description">Размещение вакансий и стажировок</p>
          <Link to="/auth/employer">
            <button className="employer-button">Начать искать</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentLog;



// import React, { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { login } from "../services/authService";
// import "./studentLog.css";

// const StudentLog = () => {
//   const [emailOrPhone, setEmailOrPhone] = useState("");
//   const [password, setPassword] = useState("");
//   const navigate = useNavigate();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     const result = await login(emailOrPhone, password);

//     if (result.token) {
//       localStorage.setItem("token", result.token);
//       localStorage.setItem("role", "student");
//       alert("Login successful!");
//       navigate("/");
//     } else {
//       alert("Login failed: " + (result.message || "Unknown error"));
//     }
//   };

//   return (
//     <div className="student-login-container">
//       <div className="student-login-box">
//         <h2 className="student-login-title">Вход для поиска стажировок</h2>
//         <input id="logHolder"
//           type="text"
//           placeholder="Электронная почта или телефон"
//           value={emailOrPhone}
//           onChange={(e) => setEmailOrPhone(e.target.value)}
//           className="student-login-input"
//         />
//         <input id="passholder"
//           type="password"
//           placeholder="Пароль"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           className="student-login-input"
//         />
//         <a href="#" className="student-forgot-password">Не помню пароль</a>
//         <button onClick={handleLogin} className="student-login-button">Войти</button>
//         <Link to="/StudentRegistration" style={{ textDecoration: 'none', color: 'white' }}>
//           <button className="student-register-button">Зарегистрироваться</button>
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default StudentLog;
