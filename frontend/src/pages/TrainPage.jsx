import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import CityInput from '../components/CityInput';
import { getHotCities, bookTrain, getTrainOrders } from '../utils/api';

const mockTrains = [
  { id: 1, trainNo: 'G1', fromCode: 'BJ', toCode: 'SH', fromStation: '北京', toStation: '上海', price: 553, startTime: '07:00', endTime: '11:36', duration: '4小时36分' },
  { id: 2, trainNo: 'G5', fromCode: 'BJ', toCode: 'SH', fromStation: '北京', toStation: '上海', price: 662, startTime: '08:00', endTime: '12:28', duration: '4小时28分' },
  { id: 3, trainNo: 'D701', fromCode: 'BJ', toCode: 'SH', fromStation: '北京', toStation: '上海', price: 292, startTime: '19:22', endTime: '07:21+1', duration: '11小时59分' },
  { id: 4, trainNo: 'T109', fromCode: 'BJ', toCode: 'SH', fromStation: '北京', toStation: '上海', price: 177, startTime: '20:03', endTime: '11:03+1', duration: '15小时' },
  { id: 5, trainNo: 'Z281', fromCode: 'BJ', toCode: 'SH', fromStation: '北京', toStation: '上海', price: 177, startTime: '21:15', endTime: '12:35+1', duration: '15小时20分' }
];

function TrainPage() {
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [date, setDate] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [trains, setTrains] = useState([]);
  const [hotCities, setHotCities] = useState([]);
  const [orders, setOrders] = useState([]);
  const [booking, setBooking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getHotCities().then(res => {
      if (res.data.success) {
        setHotCities(res.data.data);
      }
    });
    loadOrders();
  }, []);

  const loadOrders = () => {
    getTrainOrders().then(res => {
      if (res.data.success) {
        setOrders(res.data.data);
      }
    });
  };

  const getCityName = (code) => {
    const city = hotCities.find(c => c.code === code);
    return city ? city.name : code;
  };

  const handleSwapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!fromCity || !toCity || !date) {
      alert('请填写完整的搜索信息');
      return;
    }
    setTrains(mockTrains.map(t => ({
      ...t,
      fromCode: fromCity,
      toCode: toCity,
      fromStation: getCityName(fromCity),
      toStation: getCityName(toCity)
    })));
    setShowResults(true);
  };

  const handleBook = async (train) => {
    if (booking) return;
    setBooking(true);
    
    try {
      const res = await bookTrain({
        trainNo: train.trainNo,
        fromCity: fromCity,
        toCity: toCity,
        date: date,
        price: train.price,
        fromStation: train.fromStation,
        toStation: train.toStation,
        startTime: train.startTime,
        endTime: train.endTime
      });
      
      if (res.data.success) {
        loadOrders();
        navigate(`/train/order/${res.data.data.orderId}`);
      }
    } catch (err) {
      console.error('预订失败:', err);
      alert('预订失败，请重试');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="home-page">
      <Sidebar />
      <main className="main-content">
        <div className="search-container">
          <div style={{ marginBottom: '25px', borderBottom: '2px solid #eee', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="flight-tab active" style={{ padding: '10px 20px', border: 'none', background: '#e3f2fd', fontSize: '16px', color: '#1e88e5', cursor: 'pointer', borderRadius: '6px', fontWeight: 600 }}>
              火车票
            </button>
            {orders.length > 0 && (
              <div style={{ fontSize: '14px', color: '#666' }}>
                已有 <span style={{ color: '#1e88e5', fontWeight: 600 }}>{orders.length}</span> 个订单
              </div>
            )}
          </div>
          
          <form className="search-form" onSubmit={handleSearch}>
            <CityInput
              label="出发站"
              value={fromCity}
              onChange={setFromCity}
              placeholder="请输入出发站"
            />
            <button
              type="button"
              className="swap-btn"
              onClick={handleSwapCities}
              title="交换出发和到达城市"
            >
              ⇄
            </button>
            <CityInput
              label="到达站"
              value={toCity}
              onChange={setToCity}
              placeholder="请输入到达站"
            />
            <div className="form-group">
              <label>出发日期</label>
              <input
                type="date"
                className="date-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <button type="submit" className="search-btn">
              查询火车票
            </button>
          </form>

          {showResults && (
            <div style={{ marginTop: '30px' }}>
              <h3 style={{ marginBottom: '15px', color: '#333' }}>
                {getCityName(fromCity)} → {getCityName(toCity)} ({date})
              </h3>
              {trains.map(train => (
                <div key={train.id} className="flight-item" style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', flex: 1, gap: '30px', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '18px', color: '#1e88e5' }}>{train.trainNo}</div>
                      <div style={{ color: '#666', fontSize: '14px' }}>{train.duration}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 600 }}>{train.startTime}</div>
                        <div style={{ color: '#666', fontSize: '14px' }}>{train.fromStation}</div>
                      </div>
                      <div style={{ color: '#1e88e5', fontSize: '24px' }}>→</div>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 600 }}>{train.endTime}</div>
                        <div style={{ color: '#666', fontSize: '14px' }}>{train.toStation}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="flight-price">¥{train.price}</div>
                    <button 
                      className="search-btn" 
                      style={{ padding: '8px 25px', fontSize: '14px', marginTop: '10px' }}
                      onClick={() => handleBook(train)}
                      disabled={booking}
                    >
                      {booking ? '预订中...' : '预订'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default TrainPage;
