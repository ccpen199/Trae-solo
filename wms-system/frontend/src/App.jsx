import React, { useState } from 'react';
import Appointment from './pages/Appointment';
import Inbound from './pages/Inbound';
import Outbound from './pages/Outbound';
import Audit from './pages/Audit';

const App = () => {
  const [currentPage, setCurrentPage] = useState('appointment');

  const renderPage = () => {
    switch (currentPage) {
      case 'appointment':
        return <Appointment />;
      case 'inbound':
        return <Inbound />;
      case 'outbound':
        return <Outbound />;
      case 'audit':
        return <Audit />;
      default:
        return <Appointment />;
    }
  };

  const menuItems = [
    { id: 'appointment', label: '到货预约', icon: '📅' },
    { id: 'inbound', label: '入库管理', icon: '📥' },
    { id: 'outbound', label: '出库管理', icon: '📤' },
    { id: 'audit', label: '库存盘点', icon: '📊' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      <aside style={{ width: '240px', background: 'white', boxShadow: '2px 0 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
          <h1 style={{ fontSize: '20px', margin: 0, color: '#007bff' }}>WMS</h1>
          <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>仓储管理系统</p>
        </div>

        <nav style={{ flex: 1, padding: '10px 0' }}>
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              style={{
                padding: '15px 20px',
                cursor: 'pointer',
                background: currentPage === item.id ? '#e7f3ff' : 'transparent',
                borderLeft: currentPage === item.id ? '3px solid #007bff' : '3px solid transparent',
                color: currentPage === item.id ? '#007bff' : '#333',
                fontWeight: currentPage === item.id ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ marginRight: '10px' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>

        <div style={{ padding: '15px 20px', borderTop: '1px solid #eee', fontSize: '12px', color: '#666' }}>
          <div>仓库主管 | 管理员</div>
          <div style={{ marginTop: '5px' }}>v1.0.0</div>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto' }}>
        {renderPage()}
      </main>
    </div>
  );
};

export default App;