import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CharterPage() {
  const navigate = useNavigate();
  const [city, setCity] = useState('请选择城市');
  const [pickupAddress, setPickupAddress] = useState('请选择上车点');
  const [dropoffAddress, setDropoffAddress] = useState('请选择目的地');
  const [serviceHours, setServiceHours] = useState('');

  const cities = ['北京', '上海', '广州', '深圳', '杭州'];

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
          <h1 className="text-lg font-bold text-gray-800">包车服务</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-4 mb-4 text-white">
          <h3 className="font-bold text-lg mb-2">包车服务</h3>
          <p className="text-sm opacity-90">专业司机全程服务，灵活行程安排，适合商务出行、旅游等多种场景</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <button onClick={() => setShowCityPicker(true)} className="w-full flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 mb-1">服务城市</div>
              <div className="text-gray-800 font-medium">{city}</div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <button onClick={() => alert('选择上车点')} className="w-full text-left py-2">
                <div className="text-xs text-gray-400 mb-1">上车点</div>
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
              <button onClick={() => alert('选择目的地')} className="w-full text-left py-2">
                <div className="text-xs text-gray-400 mb-1">目的地</div>
                <div className="text-gray-800">{dropoffAddress}</div>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="text-sm text-gray-500 mb-2">服务时长（小时）</div>
          <input
            type="number"
            value={serviceHours}
            onChange={(e) => setServiceHours(e.target.value)}
            placeholder="请输入服务时长"
            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-800 placeholder-gray-400"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm text-gray-500 mb-3">服务车型</div>
          <div className="space-y-3">
            {[
              { name: '5座轿车', desc: '适合1-4人', price: '¥300/小时起' },
              { name: '7座商务车', desc: '适合5-6人', price: '¥400/小时起' },
              { name: '12座面包车', desc: '适合7-10人', price: '¥500/小时起' },
            ].map((car, index) => (
              <button
                key={index}
                className="w-full p-4 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">{car.name}</div>
                    <div className="text-sm text-gray-500">{car.desc}</div>
                  </div>
                  <div className="text-primary font-bold">{car.price}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <button
          onClick={() => alert('功能开发中')}
          className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-secondary transition-colors"
        >
          确认预约
        </button>
      </div>

      <div id="showCityPicker" style={{ display: 'none' }}>
        {cities.map((c, i) => (
          <button key={i} onClick={() => { setCity(c); document.getElementById('showCityPicker').style.display = 'none'; }}>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

export default CharterPage;
