import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const mockFlights = [
  { id: 1, airline: '中国国航', flightNo: 'CA1234', from: '北京', to: '上海', price: 680, time: '08:00 - 10:30' },
  { id: 2, airline: '东方航空', flightNo: 'MU5678', from: '北京', to: '上海', price: 720, time: '09:30 - 12:00' },
  { id: 3, airline: '南方航空', flightNo: 'CZ9012', from: '北京', to: '上海', price: 650, time: '14:00 - 16:30' },
  { id: 4, airline: '海南航空', flightNo: 'HU3456', from: '北京', to: '上海', price: 580, time: '18:00 - 20:30' },
  { id: 5, airline: '深圳航空', flightNo: 'ZH7890', from: '北京', to: '上海', price: 690, time: '20:00 - 22:30' }
];

function FlightListPage() {
  const [searchParams] = useSearchParams();
  const [flights, setFlights] = useState([]);
  const fromCity = searchParams.get('from') || '北京';
  const toCity = searchParams.get('to') || '上海';
  const date = searchParams.get('date') || '';

  useEffect(() => {
    setFlights(mockFlights);
  }, []);

  return (
    <div className="flight-list-page">
      <div className="flight-list-container" style={{ maxWidth: '800px' }}>
        <h2>
          {fromCity} → {toCity} {date && `(${date})`}
        </h2>
        <div style={{ marginTop: '20px' }}>
          {flights.map(flight => (
            <div key={flight.id} className="flight-item">
              <div className="flight-info">
                <div>
                  <div style={{ fontWeight: '600' }}>{flight.airline}</div>
                  <div style={{ color: '#666', fontSize: '14px' }}>{flight.flightNo}</div>
                </div>
                <div className="flight-route">
                  <span className="flight-city">{flight.from}</span>
                  <span className="flight-arrow">→</span>
                  <span className="flight-city">{flight.to}</span>
                </div>
                <div style={{ color: '#666' }}>{flight.time}</div>
              </div>
              <div className="flight-price">¥{flight.price}</div>
            </div>
          ))}
        </div>
        <Link to="/" className="back-link">← 返回首页重新搜索</Link>
      </div>
    </div>
  );
}

export default FlightListPage;
