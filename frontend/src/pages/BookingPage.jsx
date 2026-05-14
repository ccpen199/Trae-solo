import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCities, fetchLandmarks, fetchCarTypes, createOrder } from '../utils/api';

function BookingPage() {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [currentCity, setCurrentCity] = useState(null);
  const [pickupAddress, setPickupAddress] = useState('请选择出发地');
  const [dropoffAddress, setDropoffAddress] = useState('请选择目的地');
  const [landmarks, setLandmarks] = useState([]);
  const [carTypes, setCarTypes] = useState([]);
  const [selectedCarType, setSelectedCarType] = useState(null);
  const [showAddressPicker, setShowAddressPicker] = useState(null);
  const [showCarPicker, setShowCarPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  const [months, setMonths] = useState([]);
  const [days, setDays] = useState([]);
  const [hours, setHours] = useState([]);
  const [minutes, setMinutes] = useState([]);

  const [monthIndex, setMonthIndex] = useState(0);
  const [dayIndex, setDayIndex] = useState(0);
  const [hourIndex, setHourIndex] = useState(0);
  const [minuteIndex, setMinuteIndex] = useState(0);

  useEffect(() => {
    loadCities();
    loadCarTypes();
    initTimePickers();
  }, []);

  useEffect(() => {
    if (currentCity) {
      loadLandmarks(currentCity.id);
    }
  }, [currentCity]);

  const initTimePickers = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const currentHour = now.getHours();
    const currentMinute = Math.ceil(now.getMinutes() / 5) * 5;

    const monthList = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date(now.getFullYear(), currentMonth + i, 1);
      monthList.push(`${date.getFullYear()}年${date.getMonth() + 1}月`);
    }
    setMonths(monthList);
    setMonthIndex(0);

    const dayCount = new Date(now.getFullYear(), currentMonth + 1, 0).getDate();
    const dayList = [];
    for (let i = 1; i <= dayCount; i++) {
      dayList.push(`${i}日`);
    }
    setDays(dayList);
    setDayIndex(currentDay - 1);

    const hourList = [];
    for (let i = 0; i < 24; i++) {
      hourList.push(`${i.toString().padStart(2, '0')}点`);
    }
    setHours(hourList);
    setHourIndex(currentHour);

    const minuteList = [];
    for (let i = 0; i < 60; i += 5) {
      minuteList.push(`${i.toString().padStart(2, '0')}分`);
    }
    setMinutes(minuteList);
    setMinuteIndex(currentMinute / 5);
  };

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

  const loadCarTypes = async () => {
    const result = await fetchCarTypes();
    if (result.success) {
      setCarTypes(result.data);
    }
  };

  const handleConfirmTime = () => {
    const timeStr = `${months[monthIndex]} ${days[dayIndex]} ${hours[hourIndex]}${minutes[minuteIndex]}`;
    setSelectedTime(timeStr);
    setShowTimePicker(false);
  };

  const handleAddressSelect = (address, type) => {
    if (type === 'pickup') {
      setPickupAddress(address);
    } else {
      setDropoffAddress(address);
    }
    setShowAddressPicker(null);
  };

  const handleSubmitOrder = async () => {
    if (!pickupAddress || pickupAddress === '请选择出发地') {
      alert('请选择出发地');
      return;
    }
    if (!dropoffAddress || dropoffAddress === '请选择目的地') {
      alert('请选择目的地');
      return;
    }
    if (!selectedTime) {
      alert('请选择预约时间');
      return;
    }
    if (!selectedCarType) {
      alert('请选择车型');
      return;
    }

    const orderData = {
      order_type: 'booking',
      pickup_city: currentCity?.name || '',
      pickup_address: pickupAddress,
      dropoff_address: dropoffAddress,
      scheduled_time: selectedTime,
      car_type_id: selectedCarType.id,
    };

    const result = await createOrder(orderData);
    if (result.success) {
      setOrderResult(result.data);
      setShowSuccess(true);
    } else {
      alert(result.message || '创建订单失败');
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-light flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-dark mb-2">预约成功</h1>
        <p className="text-gray-600 mb-6">您的预约订单已提交，司机将按时到达</p>
        
        <div className="bg-white rounded-xl p-4 w-full max-w-sm mb-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">订单编号</span>
              <span className="font-medium">{orderResult?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">预约时间</span>
              <span className="font-medium">{selectedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">出发地</span>
              <span className="font-medium">{pickupAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">目的地</span>
              <span className="font-medium">{dropoffAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">车型</span>
              <span className="font-medium">{selectedCarType?.name}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-primary text-white rounded-full font-medium hover:bg-secondary transition-colors"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-800">预约用车</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">选择城市</span>
            <button onClick={() => setShowCityPicker(true)} className="flex items-center gap-1 text-primary">
              <span>{currentCity?.name || '选择城市'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <button onClick={() => setShowAddressPicker('pickup')} className="w-full text-left py-2">
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
              <button onClick={() => setShowAddressPicker('dropoff')} className="w-full text-left py-2">
                <div className="text-xs text-gray-400 mb-1">目的地</div>
                <div className="text-gray-800">{dropoffAddress}</div>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <button onClick={() => setShowTimePicker(true)} className="w-full flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-400">预约时间</div>
                <div className="text-gray-800">{selectedTime || '请选择时间'}</div>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <button onClick={() => setShowCarPicker(true)} className="w-full flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-400">选择车型</div>
                <div className="text-gray-800">
                  {selectedCarType?.name || '请选择车型'}
                  {selectedCarType && (
                    <span className="text-gray-400 ml-2">
                      ¥{selectedCarType.base_price}起
                    </span>
                  )}
                </div>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-bottom">
        <button
          onClick={handleSubmitOrder}
          className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-secondary transition-colors"
        >
          确认预约
        </button>
      </div>

      {showTimePicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowTimePicker(false)}>
          <div className="bg-white w-full rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">选择预约时间</h3>
              <button onClick={() => setShowTimePicker(false)} className="text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex justify-center gap-4 mb-6">
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">月</div>
                <div className="relative scroll-picker-container h-36 w-20">
                  <div className="scroll-picker">
                    <div 
                      className="scroll-picker-list"
                      style={{ transform: `translateY(-${monthIndex * 50}px)` }}
                    >
                      {months.map((month, index) => (
                        <div 
                          key={index}
                          className={`scroll-picker-item ${index === monthIndex ? 'text-primary font-bold' : 'text-gray-400'}`}
                          onClick={() => setMonthIndex(index)}
                        >
                          {month}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="scroll-picker-center-line"></div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">日</div>
                <div className="relative scroll-picker-container h-36 w-20">
                  <div className="scroll-picker">
                    <div 
                      className="scroll-picker-list"
                      style={{ transform: `translateY(-${dayIndex * 50}px)` }}
                    >
                      {days.map((day, index) => (
                        <div 
                          key={index}
                          className={`scroll-picker-item ${index === dayIndex ? 'text-primary font-bold' : 'text-gray-400'}`}
                          onClick={() => setDayIndex(index)}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="scroll-picker-center-line"></div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">时</div>
                <div className="relative scroll-picker-container h-36 w-20">
                  <div className="scroll-picker">
                    <div 
                      className="scroll-picker-list"
                      style={{ transform: `translateY(-${hourIndex * 50}px)` }}
                    >
                      {hours.map((hour, index) => (
                        <div 
                          key={index}
                          className={`scroll-picker-item ${index === hourIndex ? 'text-primary font-bold' : 'text-gray-400'}`}
                          onClick={() => setHourIndex(index)}
                        >
                          {hour}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="scroll-picker-center-line"></div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">分</div>
                <div className="relative scroll-picker-container h-36 w-20">
                  <div className="scroll-picker">
                    <div 
                      className="scroll-picker-list"
                      style={{ transform: `translateY(-${minuteIndex * 50}px)` }}
                    >
                      {minutes.map((minute, index) => (
                        <div 
                          key={index}
                          className={`scroll-picker-item ${index === minuteIndex ? 'text-primary font-bold' : 'text-gray-400'}`}
                          onClick={() => setMinuteIndex(index)}
                        >
                          {minute}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="scroll-picker-center-line"></div>
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirmTime}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium"
            >
              确认时间
            </button>
          </div>
        </div>
      )}

      {showCarPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowCarPicker(false)}>
          <div className="bg-white w-full rounded-t-2xl p-4 max-h-[70vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">选择车型</h3>
              <button onClick={() => setShowCarPicker(false)} className="text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {carTypes.map((car) => (
                <button
                  key={car.id}
                  onClick={() => {
                    setSelectedCarType(car);
                    setShowCarPicker(false);
                  }}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedCarType?.id === car.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-medium ${selectedCarType?.id === car.id ? 'text-white' : 'text-gray-800'}`}>
                        {car.name}
                      </div>
                      <div className={`text-sm ${selectedCarType?.id === car.id ? 'text-white/80' : 'text-gray-500'}`}>
                        {car.description}
                      </div>
                    </div>
                    <div className={`text-right ${selectedCarType?.id === car.id ? 'text-white' : 'text-primary'}`}>
                      <div className="font-bold">¥{car.base_price}</div>
                      <div className="text-xs opacity-70">起</div>
                    </div>
                  </div>
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

      {showCityPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowCityPicker(false)}>
          <div className="bg-white w-full rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
}

export default BookingPage;
