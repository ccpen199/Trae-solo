import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Dashboard from './pages/Dashboard';
import PhotographerList from './pages/PhotographerList';
import PhotographerDetail from './pages/PhotographerDetail';
import BookingList from './pages/BookingList';
import BookingForm from './pages/BookingForm';
import OrderList from './pages/OrderList';
import OrderDetail from './pages/OrderDetail';
import DeliveryList from './pages/DeliveryList';
import DeliveryDetail from './pages/DeliveryDetail';
import Reports from './pages/Reports';
import './index.css';

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <BrowserRouter>
    <Nav />
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/photographers" element={<PhotographerList />} />
        <Route path="/photographers/:id" element={<PhotographerDetail />} />
        <Route path="/bookings" element={<BookingList />} />
        <Route path="/booking" element={<BookingForm />} />
        <Route path="/booking/:photographerId" element={<BookingForm />} />
        <Route path="/orders" element={<OrderList />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/deliveries" element={<DeliveryList />} />
        <Route path="/deliveries/:id" element={<DeliveryDetail />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </div>
  </BrowserRouter>
);
