import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCities, fetchLandmarks, createOrder, fetchUserLocations } from '../utils/api';

function ElderlyModePage() {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [currentCity, setCurrentCity] = useState(null);
  const [nearbyLandmarks, setNearbyLandmarks] = useState([]);
  const [userLocations, setUserLocations] = useState([]);
  const [pickupAddress, setPickupAddress] = useState('正在定位...');
  const [dropoffAddress, setDropoffAddress] = useState('请选择目的地');
  const [showDropoffPicker, setShowDropoffPicker] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  useEffect(() => {
    loadCities();
    loadUserLocations();
  }, []);

  useEffect(() => {
    if (currentCity) {
      loadNearbyLandmarks(currentCity.id);
      setPickupAddress('阳光小区1号楼');
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

  const loadNearbyLandmarks = async (cityId) => {
    const result = await fetchLandmarks(cityId, 'nearby');
    if (result.success) {
      setNearbyLandmarks(result.data);
    }
  };

  const loadUserLocations = async () => {
    const result = await fetchUserLocations();
    if (result.success) {
      setUserLocations(result.data);
    }
  };

  const handleConfirmCall = async () => {
    if (!dropoffAddress || dropoffAddress === '请选择目的地') {
      alert('请先选择目的地');
      return;
    }

    setIsCalling(true);
    
    setTimeout(async () => {
      const orderData = {
        order_type: 'elderly',
        pickup_city: currentCity?.name || '',
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        car_type_id: 4,
      };

      const result = await createOrder(orderData);
      if (result.success) {
        setOrderResult(result.data);
        setIsCalling(false);
        setShowSuccess(true);
      } else {
        setIsCalling(false);
        alert(result.message || '呼叫失败，请重试');
      }
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white p-6 safe-area-bottom">
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-32 h-32 rounded-full bg-green-100 flex items-center justify-center mb-8">
            <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-800 mb-4">呼叫成功</h1>
          
          <p className="text-xl text-gray-600 text-center mb-8">
            司机正在赶来，请稍等
          </p>
          
          <div className="bg-gray-100 rounded-2xl p-6 w-full mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary">3</div>
                <div className="text-lg text-gray-500">预计等待时间</div>
                <div className="text-xl text-gray-800">分钟</div>
              </div>
              <div className="w-px h-16 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-5xl font-bold text-primary">1.2</div>
                <div className="text-lg text-gray-500">距离您</div>
                <div className="text-xl text-gray-800">公里</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between text-xl">
                <span className="text-gray-500">订单编号</span>
                <span className="font-bold text-gray-800">{orderResult?.id}</span>
              </div>
              <div className="flex justify-between text-xl">
                <span className="text-gray-500">出发地</span>
                <span className="font-bold text-gray-800">{pickupAddress}</span>
              </div>
              <div className="flex justify-between text-xl">
                <span className="text-gray-500">目的地</span>
                <span className="font-bold text-gray-800">{dropoffAddress}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full py-5 bg-primary text-white text-xl font-bold rounded-2xl hover:bg-secondary transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white safe-area-bottom">
      <header className="bg-primary text-white p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold">助老模式</h1>
          <div className="w-14 h-14"></div>
        </div>
      </header>

      <main className="p-6">
        <div className="bg-gray-100 rounded-2xl p-6 mb-6">
          <div className="text-center mb-6">
            <div className="text-lg text-gray-500 mb-2">当前位置</div>
            <div className="text-2xl font-bold text-gray-800">{pickupAddress}</div>
          </div>
          
          {userLocations.length > 0 && (
            <div className="flex gap-3 mb-6">
              {userLocations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => setPickupAddress(loc.name)}
                  className={`flex-1 py-3 rounded-xl text-lg font-medium transition-colors ${
                    pickupAddress === loc.name
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700'
                  }`}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center py-4 mb-6">
          <div className="w-px h-12 bg-gray-300"></div>
          <svg className="w-8 h-8 text-primary mx-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <div className="w-px h-12 bg-gray-300"></div>
        </div>

        <div className="bg-gray-100 rounded-2xl p-6 mb-8">
          <button
            onClick={() => setShowDropoffPicker(true)}
            className="w-full flex items-center justify-between"
          >
            <div>
              <div className="text-lg text-gray-500 mb-2">目的地</div>
              <div className="text-2xl font-bold text-gray-800">{dropoffAddress}</div>
            </div>
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <button
          onClick={handleConfirmCall}
          disabled={isCalling}
          className={`w-full py-6 rounded-2xl text-2xl font-bold transition-all ${
            isCalling
              ? 'bg-gray-300 text-gray-500'
              : 'bg-primary text-white hover:bg-secondary'
          }`}
        >
          {isCalling ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              正在呼叫中...
            </span>
          ) : (
            '确认呼叫'
          )}
        </button>

        <div className="mt-6 text-center">
          <p className="text-lg text-gray-500">
            助老专车 · 贴心服务
          </p>
        </div>
      </main>

      {showDropoffPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowDropoffPicker(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">选择目的地</h3>
              <button onClick={() => setShowDropoffPicker(false)} className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="text-lg text-gray-500 mb-4">常用地点</div>
              <div className="grid grid-cols-2 gap-4">
                {userLocations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => {
                      setDropoffAddress(loc.name);
                      setShowDropoffPicker(false);
                    }}
                    className="p-4 bg-gray-100 rounded-xl text-left hover:bg-gray-200 transition-colors"
                  >
                    <div className="text-xl font-bold text-gray-800">{loc.name}</div>
                    <div className="text-lg text-gray-500">{loc.address}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-lg text-gray-500 mb-4">附近地标</div>
              <div className="space-y-3">
                {nearbyLandmarks.map((landmark) => (
                  <button
                    key={landmark.id}
                    onClick={() => {
                      setDropoffAddress(landmark.name);
                      setShowDropoffPicker(false);
                    }}
                    className="w-full p-4 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-xl font-bold text-gray-800">{landmark.name}</div>
                    <div className="text-lg text-gray-500">{landmark.address}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ElderlyModePage;
