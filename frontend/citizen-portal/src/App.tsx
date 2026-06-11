import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Government from './pages/Government';
import Payment from './pages/Payment';
import Living from './pages/Living';
import Subsidy from './pages/Subsidy';
import Certificate from './pages/Certificate';
import Ticket from './pages/Ticket';
import Profile from './pages/Profile';

function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/government" element={<Government />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/living" element={<Living />} />
        <Route path="/subsidy" element={<Subsidy />} />
        <Route path="/certificate" element={<Certificate />} />
        <Route path="/ticket" element={<Ticket />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
