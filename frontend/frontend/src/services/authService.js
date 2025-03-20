const API_BASE_URL = "http://localhost:8080/api/v1/auth";

export const registerStudent = async (name, email, education, password) => {
  const response = await fetch(`${API_BASE_URL}/register/student`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email: email, education, password }),
  });

  return response.json();
};

export const registerEmployer = async (companyName, email, password) => {
  const response = await fetch(`${API_BASE_URL}/register/employer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ companyName: companyName, email, password }),
  });

  return response.json();
};


export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password }),
  });

  const result = await response.json();
  if (result.id) {
      localStorage.setItem("token", "some-jwt-token"); 
      localStorage.setItem("userEmail", result.email);
      localStorage.setItem("role", result.userType);
  }
  return result;
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
