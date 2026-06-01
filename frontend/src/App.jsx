import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import NewsDetailPage from './pages/NewsDetailPage';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import FavoritesPage from './pages/FavoritesPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/news/:slug" element={<NewsDetailPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
