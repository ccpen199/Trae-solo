import React from 'react';
import Sidebar from '../components/Sidebar';
import FlightSearchForm from '../components/FlightSearchForm';

function HomePage() {
  return (
    <div className="home-page">
      <Sidebar />
      <main className="main-content">
        <FlightSearchForm />
      </main>
    </div>
  );
}

export default HomePage;
