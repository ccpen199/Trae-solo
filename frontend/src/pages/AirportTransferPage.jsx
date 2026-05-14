import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AirportTransferPage() {
  const navigate = useNavigate();
  const [transferType, setTransferType] = useState('pickup');
  const [flightNumber, setFlightNumber] = useState('');
  const [pickupAddress, setPickupAddress] = useState('请选择上车点');
  const [dropoffAddress, setDropoffAddress] = useState('请选择机场');
  const [showAddressPicker, setShowAddressPicker] = useState(null);

  const airports = [
    { name: '北京首都国际机场', code: 'PEK' },
    { name: '上海浦东国际机场', code: 'PVG' },
    { name: '广州白云国际机场', code: 'CAN' },
    { name: '深圳宝安国际机场', code: 'SZX' },
    { name: '杭州萧山国际机场', code: 'HGH' },
  ];

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
          <h1 className="text-lg font-bold text-gray-800">接送机</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex rounded-xl overflow-hidden">
            <button
              onClick={() => setTransferType('pickup')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                transferType === 'pickup' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              接机
            </button>
            <button
              onClick={() => setTransferType('dropoff')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                transferType === 'dropoff' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              送机
            </button>
          </div>
        </div>

        {transferType === 'pickup' ? (
          <>
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <div className="text-sm text-gray-500 mb-2">航班号</div>
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                placeholder="请输入航班号"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-800 placeholder-gray-400"
              />
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
                  <button onClick={() => setShowAddressPicker('pickup')} className="w-full text-left py-2">
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
                  <button onClick={() => setShowAddressPicker('dropoff')} className="w-full text-left py-2">
                    <div className="text-xs text-gray-400 mb-1">机场</div>
                    <div className="text-gray-800">{dropoffAddress}</div>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <button onClick={() => setShowAddressPicker('pickup')} className="w-full text-left py-2">
                    <div className="text-xs text-gray-400 mb-1">起点</div>
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
                    <div className="text-xs text-gray-400 mb-1">机场</div>
                    <div className="text-gray-800">{dropoffAddress}</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <div className="text-sm text-gray-500 mb-2">航班号</div>
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                placeholder="请输入航班号"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-800 placeholder-gray-400"
              />
            </div>
          </>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <button
          onClick={() => alert('功能开发中')}
          className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-secondary transition-colors"
        >
          确认预约
        </button>
      </div>

      {showAddressPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowAddressPicker(null)}>
          <div className="bg-white w-full rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                {showAddressPicker === 'pickup' ? '选择起点' : '选择机场'}
              </h3>
              <button onClick={() => setShowAddressPicker(null)} className="text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {airports.map((airport, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (showAddressPicker === 'dropoff') {
                      setDropoffAddress(`${airport.name} (${airport.code})`);
                    } else {
                      setPickupAddress(airport.name);
                    }
                    setShowAddressPicker(null);
                  }}
                  className="w-full py-3 px-4 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors"
                >
                  <div className="font-medium text-gray-800">{airport.name}</div>
                  <div className="text-sm text-gray-500">机场代码: {airport.code}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AirportTransferPage;
