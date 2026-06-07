import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { ticketAPI } from '../api/client';

function TicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');

  useEffect(() => {
    loadTicket();
  }, [id]);

  const loadTicket = async () => {
    try {
      const data = await ticketAPI.get(id);
      setTicket(data);
    } catch (e) {
      console.error('Load ticket failed:', e);
    }
  };

  const handleVerify = async () => {
    if (!verifyCode) {
      alert('请输入核销码');
      return;
    }
    try {
      await ticketAPI.verify(id, { verify_code: verifyCode, method: 'qrcode' });
      alert('核销成功！');
      loadTicket();
    } catch (e) {
      alert(e.error || '核销失败');
    }
  };

  if (!ticket) return <div>加载中...</div>;

  return (
    <div className="ticket-detail">
      <h2 style={{ marginBottom: '2rem' }}>电子票券</h2>
      
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div className="ticket-qr">
          <span style={{ fontSize: '3rem' }}>🎫</span>
        </div>
        
        <div style={{ margin: '1rem 0' }}>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>核销码</p>
          <div className="verify-code">{ticket.verify_code}</div>
        </div>

        <div className="user-card" style={{ textAlign: 'left' }}>
          <h3>{ticket.event_title}</h3>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>
            {dayjs(ticket.start_time).format('YYYY年MM月DD日 HH:mm')}
          </p>
          <p style={{ color: '#666' }}>{ticket.venue_name} - {ticket.city}</p>
          <p style={{ color: '#666' }}>座位：{ticket.seat_info?.section || ''} {ticket.seat_info?.row || ''}排{ticket.seat_info?.number || ''}座</p>
        </div>

        <div className="user-card" style={{ textAlign: 'left' }}>
          <p>
            <strong>票券状态：</strong>
            <span className={ticket.status === 'valid' ? 'status-onsale' : ticket.status === 'verified' ? 'status-presale' : 'status-soldout'} style={{ padding: '0.25rem 0.75rem', borderRadius: '12px' }}>
              {ticket.status === 'valid' ? '有效' : ticket.status === 'verified' ? '已核销' : '已失效'}
            </span>
          </p>
          <p style={{ marginTop: '0.5rem' }}><strong>核销次数：</strong>{ticket.verify_count}</p>
          {ticket.last_verify_time && (
            <p style={{ marginTop: '0.5rem' }}>
              <strong>最近核销：</strong>{dayjs(ticket.last_verify_time).format('YYYY-MM-DD HH:mm')}
            </p>
          )}
        </div>

        {ticket.status === 'valid' && (
          <div style={{ marginTop: '1rem' }}>
            <input
              type="text"
              placeholder="输入核销码进行核验"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '1rem',
              }}
            />
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleVerify}>
              核验入场
            </button>
          </div>
        )}

        {ticket.verify_records?.length > 0 && (
          <div className="user-card" style={{ textAlign: 'left', marginTop: '1rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>核验记录</h4>
            {ticket.verify_records.map((record) => (
              <div key={record.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: record.result === 'success' ? '#28a745' : '#dc3545' }}>
                  {record.result === 'success' ? '✓' : '✗'}
                </span>
                <span style={{ marginLeft: '0.5rem' }}>
                  {dayjs(record.verify_time).format('YYYY-MM-DD HH:mm')}
                </span>
                <span style={{ marginLeft: '1rem', color: '#666' }}>{record.verify_method}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TicketDetail;
