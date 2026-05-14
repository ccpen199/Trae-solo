import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCities, fetchLandmarks, fetchPromotions, fetchUnreadMessageCount, createOrder } from '../utils/api';

function HomePage({ hasLocationPermission }) {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [currentCity, setCurrentCity] = useState(null);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('请选择出发地');
  const [dropoffAddress, setDropoffAddress] = useState('请选择目的地');
  const [showAddressPicker, setShowAddressPicker] = useState(null);
  const [landmarks, setLandmarks] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isCalling, setIsCalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  useEffect(() => {
    loadCities();
    loadPromotions();
    loadUnreadCount();
  }, []);

  useEffect(() => {
    if (currentCity) {
      loadLandmarks(currentCity.id);
    }
  }, [currentCity]);

  const loadCities = async () => {
    const result = await fetchCities();
    if (result.success) {
      setCities(result.data);
      if (result.data.length > 0) {
        setCurrentCity(result.data[0]);
      }
    }
  };

  const loadLandmarks = async (cityId) => {
    const result = await fetchLandmarks(cityId);
    if (result.success) {
      setLandmarks(result.data);
    }
  };

  const loadPromotions = async () => {
    const result = await fetchPromotions();
    if (result.success) {
      setPromotions(result.data);
    }
  };

  const loadUnreadCount = async () => {
    const result = await fetchUnreadMessageCount();
    if (result.success) {
      setUnreadCount(result.data);
    }
  };

  const handleAddressSelect = (address, type) => {
    if (type === 'pickup') {
      setPickupAddress(address);
    } else {
      setDropoffAddress(address);
    }
    setShowAddressPicker(null);
  };

  const handleImmediateCall = async () => {
    if (pickupAddress === '请选择出发地') {
      alert('请先选择出发地');
      return;
    }
    if (dropoffAddress === '请选择目的地') {
      alert('请先选择目的地');
      return;
    }

    setIsCalling(true);

    const orderData = {
      order_type: 'immediate',
      pickup_city: currentCity?.name || '',
      pickup_address: pickupAddress,
      dropoff_address: dropoffAddress,
      car_type_id: 1,
    };

    const result = await createOrder(orderData);
    if (result.success) {
      setOrderResult(result.data);
      setIsCalling(false);
      setShowSuccess(true);
    } else {
      setIsCalling(false);
      alert(result.message || '叫车失败，请重试');
    }
  };

  const quickActions = [
    { id: 'booking', label: '预约', icon: 'calendar', path: '/booking' },
    { id: 'airport', label: '接送机', icon: 'plane', path: '/airport' },
    { id: 'train', label: '接送火车', icon: 'train', path: '/train' },
    { id: 'charter', label: '包车', icon: 'car', path: '/charter' },
  ];

  const renderIcon = (iconName) => {
    const icons = {
      calendar: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      plane: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      ),
      train: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      car: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    };
    return icons[iconName] || icons.car;
  };

  return (
    <div className="min-h-screen bg-light">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>

          <button 
            onClick={() => setShowCityPicker(true)}
            className="flex items-center gap-1 text-gray-700 font-medium"
          >
            <span>{currentCity?.name || '选择城市'}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <button 
            onClick={() => navigate('/messages')}
            className="relative w-10 h-10 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {promotions.length > 0 && (
          <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-4 mb-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{promotions[0].title}</h3>
                <p className="text-sm opacity-90">{promotions[0].description}</p>
              </div>
              <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <button 
                onClick={() => setShowAddressPicker('pickup')}
                className="w-full text-left py-2"
              >
                <div className="text-xs text-gray-400 mb-1">出发地</div>
                <div className="text-gray-800">{pickupAddress}</div>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center py-2">
            <div className="w-px h-6 bg-gray-300"></div>
            <svg className="w-4 h-4 text-primary mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <div className="w-px h-6 bg-gray-300"></div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <button 
                onClick={() => setShowAddressPicker('dropoff')}
                className="w-full text-left py-2"
              >
                <div className="text-xs text-gray-400 mb-1">目的地</div>
                <div className="text-gray-800">{dropoffAddress}</div>
              </button>
            </div>
          </div>

          <button 
            onClick={handleImmediateCall}
            disabled={isCalling}
            className={`w-full mt-4 py-3 rounded-xl font-medium transition-colors ${
              isCalling 
                ? 'bg-gray-300 text-gray-500' 
                : 'bg-primary text-white hover:bg-secondary'
            }`}
          >
            {isCalling ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                叫车中...
              </span>
            ) : (
              '立即叫车'
            )}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary">{renderIcon(action.icon)}</span>
              </div>
              <span className="text-sm text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate('/elderly')}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-bold text-lg">助老模式</div>
              <div className="text-sm opacity-80">大字体、简操作</div>
            </div>
          </div>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </main>

      {showCityPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowCityPicker(false)}>
          <div className="bg-white w-full rounded-t-2xl p-4 max-h-[70vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">选择城市</h3>
              <button onClick={() => setShowCityPicker(false)} className="text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => {
                    setCurrentCity(city);
                    setShowCityPicker(false);
                  }}
                  className={`py-3 px-4 rounded-xl text-left transition-colors ${
                    currentCity?.id === city.id 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{city.name}</div>
                  <div className="text-xs opacity-70">{city.code}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAddressPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowAddressPicker(null)}>
          <div className="bg-white w-full rounded-t-2xl p-4 max-h-[70vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                {showAddressPicker === 'pickup' ? '选择出发地' : '选择目的地'}
              </h3>
              <button onClick={() => setShowAddressPicker(null)} className="text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {landmarks.map((landmark) => (
                <button
                  key={landmark.id}
                  onClick={() => handleAddressSelect(landmark.name, showAddressPicker)}
                  className="w-full py-3 px-4 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors"
                >
                  <div className="font-medium text-gray-800">{landmark.name}</div>
                  <div className="text-xs text-gray-500">{landmark.address}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">叫车成功</h2>
            <p className="text-gray-600 mb-4">司机正在赶来，请稍等</p>
            
            <div className="bg-gray-100 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">3</div>
                  <div className="text-sm text-gray-500">预计等待</div>
                  <div className="text-sm text-gray-800">分钟</div>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">1.2</div>
                  <div className="text-sm text-gray-500">距离您</div>
                  <div className="text-sm text-gray-800">公里</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSuccess(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                返回
              </button>
              <button
                onClick={() => setShowSuccess(false)}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-secondary transition-colors"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
