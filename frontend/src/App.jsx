import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import ContainerList from './pages/ContainerList';
import ContainerDetail from './pages/ContainerDetail';
import CustomerTrack from './pages/CustomerTrack';
import ExceptionList from './pages/ExceptionList';

const App = () => {
  return (
    <div style={styles.app}>
      <nav style={styles.nav}>
        <div style={styles.navBrand}>
          <h1 style={styles.title}>🚢 集装箱状态追踪平台</h1>
        </div>
        <div style={styles.navLinks}>
          <Link to="/" style={styles.navLink}>箱号管理</Link>
          <Link to="/exceptions" style={styles.navLink}>异常处理</Link>
          <Link to="/track" style={styles.navLink}>客户查询</Link>
        </div>
      </nav>
      <main style={styles.main}>
        <Routes>
          <Route path="/" element={<ContainerList />} />
          <Route path="/container/:id" element={<ContainerDetail />} />
          <Route path="/exceptions" element={<ExceptionList />} />
          <Route path="/track" element={<CustomerTrack />} />
        </Routes>
      </main>
    </div>
  );
};

const styles = {
  app: {
    minHeight: '100vh',
  },
  nav: {
    backgroundColor: '#1a365d',
    color: 'white',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  navBrand: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 600,
    margin: 0,
  },
  navLinks: {
    display: 'flex',
    gap: '2rem',
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1rem',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
  main: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
};

export default App;
