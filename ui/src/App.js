import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RideDetails from "./pages/RideDetails";
import CreateRide from "./pages/CreateRide";
import "leaflet/dist/leaflet.css"; // for map styling

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/ride/:id" element={<RideDetails />} />
        <Route path="/create-ride" element={<CreateRide />} />
      </Routes>
    </Router>
  );
}

export default App;
