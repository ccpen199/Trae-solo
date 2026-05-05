import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from '@/components/Header';
import LoginModal from '@/components/LoginModal';
import DatePicker from '@/components/DatePicker';
import Home from '@/pages/Home';
import Search from '@/pages/Search';
import PropertyDetail from '@/pages/PropertyDetail';
import BookingConfirm from '@/pages/BookingConfirm';
import Bookings from '@/pages/Bookings';

const App: React.FC = () => {
  const appStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  };

  return (
    <BrowserRouter>
      <div style={appStyle}>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/booking/:id/confirm" element={<BookingConfirm />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/bookings/:id" element={<Bookings />} />
        </Routes>
        <LoginModal />
        <DatePicker />
      </div>
    </BrowserRouter>
  );
};

export default App;
