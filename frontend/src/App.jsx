import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Board from './pages/Board';
import Topic from './pages/Topic';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateTopic from './pages/CreateTopic';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="board/:id" element={<Board />} />
        <Route path="topic/:id" element={<Topic />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="topic/create" element={
          <ProtectedRoute>
            <CreateTopic />
          </ProtectedRoute>
        } />
        <Route path="profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="admin/*" element={
          <ProtectedRoute requireModerator>
            <Admin />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

export default App;
