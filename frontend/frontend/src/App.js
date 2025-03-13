import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./Routes";
import ProtectedRoute from "./components/ProtectedRoute";

const Dashboard = () => <h2>Welcome to the Dashboard</h2>;


function App() {
  return (
    <Router>
      <AppRoutes />
      <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route> 
    </Router>
  );
}

export default App;