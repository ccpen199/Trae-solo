import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import TaskList from './pages/TaskList';
import TaskDetail from './pages/TaskDetail';
import PublishTask from './pages/PublishTask';
import Profile from './pages/Profile';
import Ranking from './pages/Ranking';
import Admin from './pages/Admin';
import RedPacket from './pages/RedPacket';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/publish" element={<PublishTask />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/red-packet" element={<RedPacket />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
