import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import TabBar from './components/TabBar';

import Home from './pages/Home';
import Wordbook from './pages/Wordbook';
import Discover from './pages/Discover';
import Profile from './pages/Profile';
import Login from './pages/Login';
import DailyWord from './pages/DailyWord';
import DailyReading from './pages/DailyReading';
import DailyMovie from './pages/DailyMovie';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-container">
          <div className="page-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/wordbook" element={<Wordbook />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/daily/word" element={<DailyWord />} />
              <Route path="/daily/reading" element={<DailyReading />} />
              <Route path="/daily/movie" element={<DailyMovie />} />
            </Routes>
          </div>
          <TabBar />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
