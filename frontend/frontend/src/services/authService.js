const API_BASE_URL = "http://localhost:8080/api/v1/auth";

export const registerStudent = async (name, email, education, password) => {
    const response = await fetch(`${API_BASE_URL}/register/student`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, education, password }),
    });

    const result = await response.json();
    if (result.id) {
        localStorage.setItem("token", "some-jwt-token");
        localStorage.setItem("userEmail", result.email);
        localStorage.setItem("role", result.userType);
    }
    return result;
};

export const registerEmployer = async (companyName, email, password) => {
    const response = await fetch(`${API_BASE_URL}/register/employer`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyName, email, password }),
    });

    const result = await response.json();
    if (result.user.id) {
        localStorage.setItem("token", "some-jwt-token");
        localStorage.setItem("userEmail", result.user.email);
        localStorage.setItem("role", result.user.userType);
    }
    return result;
};

export const login = async (email, password, page) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    const result = await response.json();
    console.log("Login response:", result);

    if (result.token) {
        const token = result.token;
        const decoded = JSON.parse(atob(token.split(".")[1]));
        const userType = decoded.userType;

        if (
            (page === "EMPLOYER" && userType !== "EMPLOYER") ||
            (page === "STUDENT" && userType !== "STUDENT")
        ) {
            return { error: "Вы пытаетесь войти на неверную страницу!" };
        }

        localStorage.setItem("token", token);
        localStorage.setItem("userEmail", result.email);
        localStorage.setItem("role", userType);
        return { token, userType };
    }
    return result;
};

export const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userEmail");
};

export const isAuthenticated = () => {
    return localStorage.getItem("token") !== null;
};

export const getUserRole = () => {
    const role = localStorage.getItem("role");
    console.log("Retrieved role:", role);
    return role;
};