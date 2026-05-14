import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function TrainTransferPage() {
  const navigate = useNavigate();
  const [transferType, setTransferType] = useState('pickup');
  const [trainNumber, setTrainNumber] = useState('');
  const [pickupAddress, setPickupAddress] = useState('请选择上车点');
  const [dropoffAddress, setDropoffAddress] = useState('请选择火车站');

  const stations = [
    { name: '北京西站', type: '高铁站' },
    { name: '北京南站', type: '高铁站' },
    { name: '上海虹桥站', type: '高铁站' },
    { name: '上海站', type: '普通站' },
    { name: '广州南站', type: '高铁站' },
    { name: '广州站', type: '普通站' },
    { name: '深圳北站', type: '高铁站' },
    { name: '杭州东站', type: '高铁站' },
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
          <h1 className="text-lg font-bold text-gray-800">接送火车</h1>
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
              接站
            </button>
            <button
              onClick={() => setTransferType('dropoff')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                transferType === 'dropoff' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              送站
            </button>
          </div>
        </div>

        {transferType === 'pickup' ? (
          <>
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <div className="text-sm text-gray-500 mb-2">车次</div>
              <input
                type="text"
                value={trainNumber}
                onChange={(e) => setTrainNumber(e.target.value)}
                placeholder="请输入车次（如G1234）"
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
                  <button onClick={() => alert('选择火车站')} className="w-full text-left py-2">
                    <div className="text-xs text-gray-400 mb-1">火车站</div>
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
                  <button onClick={() => alert('选择起点')} className="w-full text-left py-2">
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
                  <button onClick={() => alert('选择火车站')} className="w-full text-left py-2">
                    <div className="text-xs text-gray-400 mb-1">火车站</div>
                    <div className="text-gray-800">{dropoffAddress}</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <div className="text-sm text-gray-500 mb-2">车次</div>
              <input
                type="text"
                value={trainNumber}
                onChange={(e) => setTrainNumber(e.target.value)}
                placeholder="请输入车次（如G1234）"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-800 placeholder-gray-400"
              />
            </div>
          </>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm text-gray-500 mb-3">推荐站点</div>
          <div className="grid grid-cols-2 gap-2">
            {stations.map((station, index) => (
              <button
                key={index}
                className="p-3 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-800">{station.name}</div>
                <div className="text-xs text-gray-500">{station.type}</div>
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
    </div>
  );
}

export default TrainTransferPage;
