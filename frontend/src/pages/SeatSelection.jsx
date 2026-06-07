import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import useStore from '../store';
import { sessionAPI, orderAPI } from '../api/client';

function SeatSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const selectedSeats = useStore((state) => state.selectedSeats);
  const selectSeat = useStore((state) => state.selectSeat);
  const clearSelectedSeats = useStore((state) => state.clearSelectedSeats);
  const currentUser = useStore((state) => state.currentUser);

  useEffect(() => {
    loadData();
    return () => clearSelectedSeats();
  }, [id]);

  const loadData = async () => {
    try {
      const [sessionData, seatsData] = await Promise.all([
        sessionAPI.get(id),
        sessionAPI.getSeats(id),
      ]);
      setSession(sessionData);
      setSections(seatsData);
    } catch (e) {
      console.error('Load seats failed:', e);
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.status !== 'available') return;
    selectSeat(seat);
  };

  const getSeatClass = (seat) => {
    const isSelected = selectedSeats.find((s) => s.session_seat_id === seat.session_seat_id);
    if (isSelected) return 'seat-selected';
    if (seat.status === 'sold') return 'seat-sold';
    if (seat.status === 'locked') return 'seat-locked';
    return 'seat-available';
  };

  const getSeatsByRow = (seats) => {
    const rows = {};
    seats.forEach((seat) => {
      if (!rows[seat.row_label]) rows[seat.row_label] = [];
      rows[seat.row_label].push(seat);
    });
    return Object.entries(rows).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const handleCreateOrder = async () => {
    if (!currentUser) {
      alert('请先登录');
      return;
    }
    if (selectedSeats.length === 0) return;

    setLoading(true);
    try {
      const seatIds = selectedSeats.map((s) => s.session_seat_id);
      await sessionAPI.lockSeats(id, { seat_ids: seatIds, user_id: currentUser.id });
      
      const order = await orderAPI.create({
        user_id: currentUser.id,
        session_id: id,
        seat_ids: seatIds,
      });
      
      navigate(`/order/${order.id}/confirm`);
    } catch (e) {
      alert(e.error || '创建订单失败');
      setLoading(false);
    }
  };

  const totalPrice = selectedSeats.reduce((sum, s) => sum + (s.price || 0), 0);

  if (!session) return <div>加载中...</div>;

  return (
    <div className="seat-selection" style={{ marginBottom: '100px' }}>
      <h2>{session.event_title}</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        {dayjs(session.start_time).format('YYYY年MM月DD日 HH:mm')} | {session.venue_name}
      </p>

      <div className="stage">舞 台</div>

      {sections.map((section) => (
        <div key={section.id} className="seat-section">
          <div className="section-header">
            <span className="section-title">
              {section.section_name}
              {section.price_level === 'vip' && <span style={{ color: '#ffc107', marginLeft: '0.5rem' }}>⭐</span>}
            </span>
            {section.is_blind_zone ? (
              <span className="blind-zone-badge">⚠️ 盲区座位</span>
            ) : null}
            <span style={{ color: '#667eea', fontWeight: '600' }}>¥{section.base_price}</span>
          </div>
          {getSeatsByRow(section.seats || []).map(([rowLabel, seats]) => (
            <div key={rowLabel} className="seats-row">
              <span style={{ width: '30px', textAlign: 'center', color: '#999' }}>{rowLabel}</span>
              {seats
                .sort((a, b) => a.seat_number - b.seat_number)
                .map((seat) => (
                  <button
                    key={seat.session_seat_id}
                    className={`seat ${getSeatClass(seat)} ${section.is_blind_zone ? 'seat-blind' : ''}`}
                    onClick={() => handleSeatClick(seat)}
                    title={`${rowLabel}排${seat.seat_number}座`}
                    disabled={seat.status !== 'available'}
                  >
                    {seat.seat_number}
                  </button>
                ))}
            </div>
          ))}
        </div>
      ))}

      <div className="seat-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#e8f5e9' }}></div>
          <span>可选</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#667eea' }}></div>
          <span>已选</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#e0e0e0' }}></div>
          <span>已售</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#ffe0b2' }}></div>
          <span>盲区</span>
        </div>
      </div>

      <div className="seat-summary">
        <div>
          <span>已选 {selectedSeats.length} 个座位：</span>
          {selectedSeats.map((s) => (
            <span key={s.session_seat_id} style={{ marginLeft: '0.5rem' }}>
              {s.row_label}排{s.seat_number}座
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#667eea' }}>
            ¥{totalPrice}
          </span>
          <button
            className="btn btn-primary"
            onClick={handleCreateOrder}
            disabled={selectedSeats.length === 0 || loading}
          >
            {loading ? '处理中...' : '确认选座'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SeatSelection;
