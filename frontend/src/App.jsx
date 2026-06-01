import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import FlightListPage from './pages/FlightListPage';
import LoginPage from './pages/LoginPage';
import TrainPage from './pages/TrainPage';
import TrainOrderDetail from './pages/TrainOrderDetail';
import './App.css';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/train" element={<TrainPage />} />
        <Route path="/train/order/:orderId" element={<TrainOrderDetail />} />
        <Route path="/flight/list" element={<FlightListPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </div>
  );
}

export default App;
