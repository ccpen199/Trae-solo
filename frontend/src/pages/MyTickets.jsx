import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import useStore from '../store';
import { ticketAPI } from '../api/client';

function MyTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('valid');
  const currentUser = useStore((state) => state.currentUser);

  useEffect(() => {
    loadTickets();
  }, [currentUser, activeTab]);

  const loadTickets = async () => {
    if (!currentUser) return;
    try {
      const params = { user_id: currentUser.id };
      if (activeTab !== 'all') {
        params.status = activeTab === 'valid' ? 'valid' : activeTab;
      }
      const result = await ticketAPI.list(params);
      setTickets(result.data || []);
    } catch (e) {
      console.error('Load tickets failed:', e);
    }
  };

  const tabs = [
    { key: 'valid', label: '有效票券' },
    { key: 'verified', label: '已使用' },
    { key: 'refunded', label: '已退票' },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: '1rem' }}>我的票券</h1>
      
      <div className="tabs">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {tickets.length === 0 ? (
        <div className="user-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#666' }}>暂无票券</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>
            去购票
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="user-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/ticket/${ticket.id}`)}
            >
              <div style={{ display: 'flex', gap: '1rem' }}>
                <img
                  src={ticket.poster_url || 'https://picsum.photos/120/160'}
                  alt={ticket.event_title}
                  style={{ width: '100px', height: '130px', objectFit: 'cover', borderRadius: '8px' }}
                />
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginBottom: '0.5rem' }}>{ticket.event_title}</h3>
                  <p style={{ color: '#666' }}>
                    {dayjs(ticket.start_time).format('YYYY年MM月DD日 HH:mm')}
                  </p>
                  <p style={{ color: '#666' }}>{ticket.venue_name}</p>
                  <div style={{ marginTop: '0.5rem' }}>
                    <span
                      className={`status-badge ${ticket.status === 'valid' ? 'status-onsale' : ticket.status === 'verified' ? 'status-presale' : 'status-soldout'}`}
                    >
                      {ticket.status === 'valid' ? '有效' : ticket.status === 'verified' ? '已核销' : '已失效'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyTickets;
