import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';

function VenueList({ user, canCreate }) {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [courts, setCourts] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    try {
      const res = await api.get('/venues');
      setVenues(res.data);
    } catch (err) {
      console.error('加载场馆失败', err);
    }
  };

  const loadVenueDetail = async (venueId) => {
    setSelectedVenue(venueId);
    try {
      const [courtsRes, slotsRes] = await Promise.all([
        api.get(`/venues/${venueId}/courts`),
        api.get(`/venues/${venueId}/time-slots`, { params: { date: selectedDate } })
      ]);
      setCourts(courtsRes.data);
      setTimeSlots(slotsRes.data);
    } catch (err) {
      console.error('加载场馆详情失败', err);
    }
  };

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    if (selectedVenue) {
      try {
        const res = await api.get(`/venues/${selectedVenue}/time-slots`, { params: { date } });
        setTimeSlots(res.data);
      } catch (err) {
        console.error('加载时段失败', err);
      }
    }
  };

  const getSlotsByCourt = (courtId) => {
    return timeSlots.filter(ts => ts.court_id === courtId);
  };

  const getStatusText = (status) => {
    const map = { available: '可预订', booked: '已预订', used: '已使用' };
    return map[status] || status;
  };

  return (
    <div>
      <div className="grid">
        {venues.map(venue => (
          <div key={venue.id} className="card" style={{ cursor: 'pointer' }}
            onClick={() => loadVenueDetail(venue.id)}>
            <h3>{venue.name}</h3>
            <p className="game-meta">📍 {venue.address}</p>
            <p className="game-meta">📞 {venue.phone}</p>
            <p className="game-meta">🕐 营业时间：{venue.business_hours}</p>
            <p className="game-meta">💡 {venue.lighting}</p>
            {venue.manager_name && (
              <p className="game-meta">👤 场馆经理：{venue.manager_name}</p>
            )}
          </div>
        ))}
      </div>

      {selectedVenue && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div className="game-header">
            <h3>场地时段查询 - {venues.find(v => v.id === selectedVenue)?.name}</h3>
            <div>
              <input type="date" value={selectedDate} onChange={(e) => handleDateChange(e.target.value)}
                style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
            </div>
          </div>
          {courts.map(court => (
            <div key={court.id} style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '15px 0 10px' }}>
                {court.name} - {court.sport_type} - ¥{court.price_per_hour}/小时
              </h4>
              <div className="time-slot-grid">
                {getSlotsByCourt(court.id).map(ts => (
                  <div key={ts.id} className={`time-slot ${ts.status}`}>
                    {ts.start_time}-{ts.end_time}
                    <br />
                    <small>{getStatusText(ts.status)}</small>
                  </div>
                ))}
              </div>
            </div>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => navigate('/create-game')}>
              + 在此场馆发起约球
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default VenueList;
