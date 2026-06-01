import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Requirements from './pages/Requirements';
import RequirementDetail from './pages/RequirementDetail';
import { useAuth } from './context/AuthContext';

const App = () => {
  const { currentUser, setCurrentUser, users, roleNames } = useAuth();

  return (
    <div style={styles.app}>
      <nav style={styles.sidebar}>
        <div style={styles.logo}>
          <h2>工商注册平台</h2>
        </div>
        <div style={styles.userSection}>
          <div style={styles.userInfo}>
            <span style={styles.userAvatar}>
              {currentUser.name.charAt(0)}
            </span>
            <div>
              <div style={styles.userName}>{currentUser.name}</div>
              <div style={styles.userRole}>{roleNames[currentUser.role]}</div>
            </div>
          </div>
          <select 
            style={styles.roleSelect}
            value={currentUser.id}
            onChange={(e) => {
              const user = users.find(u => u.id === parseInt(e.target.value));
              if (user) setCurrentUser(user);
            }}
          >
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} - {roleNames[user.role]}
              </option>
            ))}
          </select>
        </div>
        <ul style={styles.navList}>
          <li style={styles.navItem}>
            <Link to="/" style={styles.navLink}>工作台</Link>
          </li>
          <li style={styles.navItem}>
            <Link to="/clients" style={styles.navLink}>客户管理</Link>
          </li>
          <li style={styles.navItem}>
            <Link to="/requirements" style={styles.navLink}>注册需求</Link>
          </li>
        </ul>
      </nav>
      <main style={styles.mainContent}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/requirements" element={<Requirements />} />
          <Route path="/requirements/:id" element={<RequirementDetail />} />
        </Routes>
      </main>
    </div>
  );
};

const styles = {
  app: {
    display: 'flex',
    minHeight: '100vh'
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '20px 0'
  },
  logo: {
    padding: '0 20px 20px',
    borderBottom: '1px solid #34495e'
  },
  navList: {
    listStyle: 'none',
    padding: '20px 0'
  },
  navItem: {
    marginBottom: '4px'
  },
  navLink: {
    display: 'block',
    padding: '12px 20px',
    color: '#ecf0f1',
    textDecoration: 'none',
    fontSize: '15px',
    transition: 'background-color 0.2s'
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: '24px'
  },
  userSection: {
    padding: '16px 20px',
    borderBottom: '1px solid #34495e',
    marginBottom: '10px'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#3498db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 600,
    color: 'white'
  },
  userName: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '2px'
  },
  userRole: {
    fontSize: '12px',
    color: '#bdc3c7'
  },
  roleSelect: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #34495e',
    backgroundColor: '#34495e',
    color: 'white',
    fontSize: '12px',
    cursor: 'pointer'
  }
};

export default App;
