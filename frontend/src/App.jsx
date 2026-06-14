import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Movies from './pages/Movies.jsx';
import MovieDetail from './pages/MovieDetail.jsx';
import Search from './pages/Search.jsx';
import Playlists from './pages/Playlists.jsx';
import Community from './pages/Community.jsx';
import Quizzes from './pages/Quizzes.jsx';
import Live from './pages/Live.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Admin from './pages/Admin.jsx';

const TVShows = () => {
  return (
    <div className="container section">
      <h1 className="section-title">剧集库</h1>
      <p className="empty-state">剧集页面正在开发中...</p>
    </div>
  );
};

const People = () => {
  return (
    <div className="container section">
      <h1 className="section-title">影人库</h1>
      <p className="empty-state">影人页面正在开发中...</p>
    </div>
  );
};

const News = () => {
  return (
    <div className="container section">
      <h1 className="section-title">资讯流</h1>
      <p className="empty-state">资讯页面正在开发中...</p>
    </div>
  );
};

const Profile = () => {
  return (
    <div className="container section">
      <h1 className="section-title">个人中心</h1>
      <p className="empty-state">个人中心页面正在开发中...</p>
    </div>
  );
};

const NotFound = () => {
  return (
    <div className="container section" style={{ textAlign: 'center' }}>
      <h1 className="section-title">404</h1>
      <p style={{ color: 'var(--text-secondary)' }}>页面不存在</p>
    </div>
  );
};

const App = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/:id" element={<MovieDetail />} />
          <Route path="/tv" element={<TVShows />} />
          <Route path="/tv/:id" element={<TVShows />} />
          <Route path="/people" element={<People />} />
          <Route path="/people/:id" element={<People />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<News />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/playlists/:id" element={<Playlists />} />
          <Route path="/community" element={<Community />} />
          <Route path="/quizzes" element={<Quizzes />} />
          <Route path="/live" element={<Live />} />
          <Route path="/search" element={<Search />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
