import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const mockFlights = [
  { id: 1, flightNo: 'CA1234', from: '北京', to: '上海', date: '2026-05-20', departure: '07:00', arrival: '09:30', price: 553, airline: '中国国航' },
  { id: 2, flightNo: 'MU5678', from: '北京', to: '上海', date: '2026-05-20', departure: '08:00', arrival: '10:28', price: 662, airline: '东方航空' },
  { id: 3, flightNo: 'D701', from: '北京', to: '上海', date: '2026-05-20', departure: '19:22', arrival: '07:21+1', price: 292, airline: '中国国航' },
  { id: 4, flightNo: 'T109', from: '北京', to: '上海', date: '2026-05-20', departure: '20:03', arrival: '11:03+1', price: 177, airline: '中国铁路' },
  { id: 5, flightNo: 'Z281', from: '北京', to: '上海', date: '2026-05-20', departure: '21:15', arrival: '12:35+1', price: 177, airline: '中国铁路' },
];

function Flights() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useState({
    from: '北京',
    to: '上海',
    date: '2026-05-20',
    passengers: 1
  });
  const [flights, setFlights] = useState(mockFlights);

  const handleSearch = () => {
    console.log('搜索航班:', searchParams);
    setFlights(mockFlights);
  };

  const handleBook = (flight) => {
    if (!user) {
      alert('请先登录');
      navigate('/login');
      return;
    }
    alert(`预订成功！${flight.flightNo} ${flight.from} → ${flight.to}，¥${flight.price}/人\n可在"我的"中查看订单`);
    navigate('/profile');
  };

  const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '西安', '重庆', '南京', '武汉'];

  return (
    <div className="flights-page">
      <div className="container">
        <h1 className="page-title">机票预订</h1>

        <div className="search-panel flight-search">
          <div className="search-row">
            <div className="search-item">
              <label>出发城市</label>
              <select 
                value={searchParams.from}
                onChange={(e) => setSearchParams({...searchParams, from: e.target.value})}
              >
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="search-item swap-btn">
              <button onClick={() => setSearchParams({
                ...searchParams, 
                from: searchParams.to, 
                to: searchParams.from
              })}>⇄</button>
            </div>
            <div className="search-item">
              <label>到达城市</label>
              <select 
                value={searchParams.to}
                onChange={(e) => setSearchParams({...searchParams, to: e.target.value})}
              >
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="search-item">
              <label>出发日期</label>
              <input 
                type="date" 
                value={searchParams.date}
                onChange={(e) => setSearchParams({...searchParams, date: e.target.value})}
              />
            </div>
            <div className="search-item">
              <label>乘客人数</label>
              <select 
                value={searchParams.passengers}
                onChange={(e) => setSearchParams({...searchParams, passengers: parseInt(e.target.value)})}
              >
                {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n}人</option>)}
              </select>
            </div>
            <div className="search-item search-btn">
              <button className="btn btn-primary" onClick={handleSearch}>
                🔍 查询机票
              </button>
            </div>
          </div>
        </div>

        <div className="flights-result">
          <div className="result-header">
            <span>{searchParams.from} → {searchParams.to}</span>
            <span>{searchParams.date} · 共 {flights.length} 个航班</span>
          </div>
          
          <div className="flights-list">
            {flights.map((flight) => (
              <div key={flight.id} className="flight-card">
                <div className="flight-info">
                  <div className="flight-route">
                    <div className="flight-time">
                      <div className="time">{flight.departure}</div>
                      <div className="city">{flight.from}</div>
                    </div>
                    <div className="flight-line">
                      <div className="line"></div>
                      <div className="flight-no">{flight.flightNo}</div>
                    </div>
                    <div className="flight-time">
                      <div className="time">{flight.arrival}</div>
                      <div className="city">{flight.to}</div>
                    </div>
                  </div>
                  <div className="flight-airline">{flight.airline}</div>
                </div>
                <div className="flight-price">
                  <div className="price">¥{flight.price}<span>/人</span></div>
                  <button className="btn btn-primary" onClick={() => handleBook(flight)}>预订</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Flights;
