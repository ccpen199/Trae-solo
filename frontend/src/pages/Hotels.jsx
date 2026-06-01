import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hotelAPI } from '../api';
import { useAuth } from '../context/AuthContext';

function Hotels() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [searchParams, setSearchParams] = useState({
    destination: '',
    checkin: new Date().toISOString().split('T')[0],
    checkout: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    rooms: 1,
    guests: 2
  });
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);

  useEffect(() => {
    loadHotels();
  }, []);

  const loadHotels = async () => {
    try {
      const res = await hotelAPI.getHotels();
      setHotels(res.data.list || []);
    } catch (err) {
      console.error('加载酒店失败', err);
    }
  };

  const handleSearch = () => {
    console.log('搜索酒店:', searchParams);
  };

  const openOrderModal = (hotel) => {
    if (!user) {
      alert('请先登录');
      navigate('/login');
      return;
    }
    setSelectedHotel(hotel);
    setShowOrderModal(true);
  };

  const handleConfirmOrder = async () => {
    if (!selectedHotel) return;
    try {
      await hotelAPI.createOrder(selectedHotel.id, {
        checkin_date: searchParams.checkin,
        checkout_date: searchParams.checkout,
        rooms: searchParams.rooms,
        guests: searchParams.guests
      });
      alert('预订成功！可在"我的"中查看订单');
      setShowOrderModal(false);
      navigate('/profile');
    } catch (err) {
      alert('预订失败，请重试');
    }
  };

  const destinations = ['东京', '曼谷', '大理', '厦门', '丽江'];

  return (
    <div className="hotels-page">
      <div className="container">
        <h1 className="page-title">酒店预订</h1>

        <div className="search-panel">
          <div className="search-row">
            <div className="search-item">
              <label>目的地</label>
              <select 
                value={searchParams.destination}
                onChange={(e) => setSearchParams({...searchParams, destination: e.target.value})}
              >
                <option value="">全部城市</option>
                {destinations.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="search-item">
              <label>入住日期</label>
              <input 
                type="date" 
                value={searchParams.checkin}
                onChange={(e) => setSearchParams({...searchParams, checkin: e.target.value})}
              />
            </div>
            <div className="search-item">
              <label>退房日期</label>
              <input 
                type="date" 
                value={searchParams.checkout}
                onChange={(e) => setSearchParams({...searchParams, checkout: e.target.value})}
              />
            </div>
            <div className="search-item">
              <label>房间/人数</label>
              <div className="guest-selector">
                <select 
                  value={searchParams.rooms}
                  onChange={(e) => setSearchParams({...searchParams, rooms: parseInt(e.target.value)})}
                >
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}间</option>)}
                </select>
                <select 
                  value={searchParams.guests}
                  onChange={(e) => setSearchParams({...searchParams, guests: parseInt(e.target.value)})}
                >
                  {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}人</option>)}
                </select>
              </div>
            </div>
            <div className="search-item search-btn">
              <button className="btn btn-primary" onClick={handleSearch}>
                🔍 查询酒店
              </button>
            </div>
          </div>
        </div>

        <div className="hotels-grid">
          {hotels.map((hotel) => (
            <div key={hotel.id} className="hotel-card">
              <div className="hotel-image">
                <img src={`https://picsum.photos/400/300?random=${hotel.id + 200}`} alt={hotel.name} />
              </div>
              <div className="hotel-info">
                <h3 className="hotel-name">{hotel.name}</h3>
                <p className="hotel-dest">📍 {hotel.destination}</p>
                <p className="hotel-address">{hotel.address}</p>
                <div className="hotel-rating">
                  <span className="rating-score">{hotel.rating || 4.5}</span>
                  <span>分</span>
                </div>
                <div className="hotel-facilities">
                  {hotel.facilities?.split(',').slice(0, 3).map((f, i) => (
                    <span key={i} className="facility-tag">{f}</span>
                  ))}
                </div>
                <div className="hotel-bottom">
                  <div className="hotel-price">
                    ¥{hotel.price || 299}<span>/晚起</span>
                  </div>
                  <button className="btn btn-primary" onClick={() => openOrderModal(hotel)}>
                    立即预订
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showOrderModal && selectedHotel && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>确认预订</h3>
              <button className="modal-close" onClick={() => setShowOrderModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="order-hotel-info">
                <img src={`https://picsum.photos/200/150?random=${selectedHotel.id + 300}`} alt="" />
                <div>
                  <h4>{selectedHotel.name}</h4>
                  <p>📍 {selectedHotel.destination}</p>
                  <p className="order-price">¥{selectedHotel.price} <span>/晚</span></p>
                </div>
              </div>
              <div className="order-details">
                <div className="order-row">
                <span>入住日期</span>
                <span>{searchParams.checkin}</span>
              </div>
              <div className="order-row">
                <span>退房日期</span>
                <span>{searchParams.checkout}</span>
              </div>
              <div className="order-row">
                <span>房间数</span>
                <span>{searchParams.rooms}间</span>
              </div>
              <div className="order-row">
                <span>入住人数</span>
                <span>{searchParams.guests}人</span>
              </div>
              <div className="order-row total">
                <span>总计</span>
                <span className="total-price">
                  ¥{selectedHotel.price * searchParams.rooms * 
                    Math.ceil((new Date(searchParams.checkout) - new Date(searchParams.checkin)) / 86400000)}
                </span>
              </div>
            </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowOrderModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleConfirmOrder}>确认预订</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Hotels;
