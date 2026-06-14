import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useUserStore } from './stores/userStore';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Joke from './pages/Joke';
import Idiom from './pages/Idiom';
import Water from './pages/Water';
import Steps from './pages/Steps';
import Fashion from './pages/Fashion';
import FashionQuiz from './pages/FashionQuiz';
import Invite from './pages/Invite';
import Wallet from './pages/Wallet';
import Withdraw from './pages/Withdraw';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTasks from './pages/admin/AdminTasks';
import AdminTaskPool from './pages/admin/AdminTaskPool';
import AdminUsers from './pages/admin/AdminUsers';
import AdminWithdraw from './pages/admin/AdminWithdraw';
import BottomNav from './components/BottomNav';

function App() {
  const { fetchProfile, isLoggedIn } = useUserStore();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetchProfile();
    }
  }, []);

  const isAdminRoute = window.location.pathname.startsWith('/admin');

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark-50">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tasks/joke" element={<Joke />} />
          <Route path="/tasks/idiom" element={<Idiom />} />
          <Route path="/tasks/water" element={<Water />} />
          <Route path="/tasks/steps" element={<Steps />} />
          <Route path="/tasks/fashion" element={<Fashion />} />
          <Route path="/tasks/fashion/hairstyle" element={<FashionQuiz type="hairstyle" />} />
          <Route path="/tasks/fashion/clothing" element={<FashionQuiz type="clothing" />} />
          <Route path="/invite" element={<Invite />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/tasks/audit" element={<AdminTasks />} />
          <Route path="/admin/tasks/pool" element={<AdminTaskPool />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/withdraw" element={<AdminWithdraw />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {!isAdminRoute && <BottomNav />}
      </div>
    </BrowserRouter>
  );
}

export default App;
