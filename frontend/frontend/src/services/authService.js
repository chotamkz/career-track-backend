const API_BASE_URL = "http://localhost:5000/api/v1/auth";

export const registerStudent = async (emailOrPhone, password) => {
  const response = await fetch(`${API_BASE_URL}/register/student`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: emailOrPhone, password }),
  });

  return response.json();
};

export const registerEmployer = async (emailOrPhone, password) => {
  const response = await fetch(`${API_BASE_URL}/register/employer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: emailOrPhone, password }),
  });

  return response.json();
};

export const login = async (emailOrPhone, password) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: emailOrPhone, password }),
  });

  return response.json();
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
};

export const isAuthenticated = () => {
  return localStorage.getItem("token") !== null;
};

export const getUserRole = () => {
  return localStorage.getItem("role");
};
