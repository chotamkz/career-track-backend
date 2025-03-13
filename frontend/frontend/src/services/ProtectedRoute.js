import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const isAuthenticated = localStorage.getItem("token") !== null;
  return isAuthenticated ? <Outlet /> : <Navigate to="/StudentLogin" />;
};

export default ProtectedRoute;
