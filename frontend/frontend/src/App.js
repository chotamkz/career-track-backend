import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./Routes";


const Dashboard = () => <h2>Welcome to the Dashboard</h2>;


function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;