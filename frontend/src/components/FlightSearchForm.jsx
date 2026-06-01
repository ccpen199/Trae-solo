import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CityInput from './CityInput';
import { getUserPreferences, searchFlight } from '../utils/api';

const flightTabs = [
  { id: 'domestic', name: '国内机票' },
  { id: 'international', name: '国际/港澳台机票' },
  { id: 'status', name: '出票状态查询' },
  { id: 'refund', name: '退票改签' }
];

function FlightSearchForm() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('domestic');
  const [tripType, setTripType] = useState('oneWay');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    getUserPreferences().then(res => {
      if (res.data.success) {
        const pref = res.data.data;
        setFromCity(pref.defaultFromCity || 'BJ');
        
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const defaultDate = nextWeek.toISOString().split('T')[0];
        
        const lastDate = pref.lastSearchDate;
        if (lastDate && new Date(lastDate) > today) {
          setFromDate(lastDate);
        } else {
          setFromDate(defaultDate);
        }
      }
    });
  }, []);

  const handleTabChange = (tabId) => {
    if (tabId === 'status' || tabId === 'refund') {
      const isLoggedIn = document.cookie.includes('isLoggedIn');
      if (!isLoggedIn) {
        navigate('/login');
        return;
      }
    }
    setActiveTab(tabId);
  };

  const handleSwapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!fromCity || !toCity || !fromDate) {
      alert('请填写完整的搜索信息');
      return;
    }

    if (tripType === 'roundTrip' && !toDate) {
      alert('请选择返程日期');
      return;
    }

    try {
      const res = await searchFlight({
        fromCity,
        toCity,
        fromDate,
        toDate: tripType === 'roundTrip' ? toDate : '',
        tripType
      });

      if (res.data.success) {
        navigate(res.data.data.redirectUrl);
      }
    } catch (error) {
      console.error('搜索失败:', error);
      alert('搜索失败，请重试');
    }
  };

  const renderDomesticSearch = () => (
    <>
      <div className="trip-type">
        <label>
          <input
            type="radio"
            name="tripType"
            value="oneWay"
            checked={tripType === 'oneWay'}
            onChange={() => setTripType('oneWay')}
          />
          单程
        </label>
        <label>
          <input
            type="radio"
            name="tripType"
            value="roundTrip"
            checked={tripType === 'roundTrip'}
            onChange={() => setTripType('roundTrip')}
          />
          往返
        </label>
      </div>
      <form className="search-form" onSubmit={handleSearch}>
        <CityInput
          label="出发城市"
          value={fromCity}
          onChange={setFromCity}
          placeholder="请输入出发城市"
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
          label="到达城市"
          value={toCity}
          onChange={setToCity}
          placeholder="请输入到达城市"
        />
        <div className="form-group">
          <label>出发日期</label>
          <input
            type="date"
            className="date-input"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        {tripType === 'roundTrip' && (
          <div className="form-group">
            <label>返程日期</label>
            <input
              type="date"
              className="date-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        )}
        <button type="submit" className="search-btn">
          立即搜索
        </button>
      </form>
      <div className="secondary-links">
        <a href="#">运营链接</a>
        <a href="#">更多服务</a>
      </div>
    </>
  );

  const renderOtherContent = () => (
    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
      {activeTab === 'international' && '国际/港澳台机票功能开发中...'}
      {activeTab === 'status' && '出票状态查询功能开发中...'}
      {activeTab === 'refund' && '退票改签功能开发中...'}
    </div>
  );

  return (
    <div className="search-container">
      <div className="flight-tabs">
        {flightTabs.map(tab => (
          <button
            key={tab.id}
            className={`flight-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </div>
      {activeTab === 'domestic' ? renderDomesticSearch() : renderOtherContent()}
    </div>
  );
}

export default FlightSearchForm;
