import { useNavigate } from 'react-router-dom';

const quickActions = [
  { label: '扫码使用', icon: '📷', action: 'scan', color: 'bg-blue-500' },
  { label: '预约设备', icon: '📅', action: 'reserve', color: 'bg-green-500' },
  { label: '我的订单', icon: '📋', action: 'orders', color: 'bg-orange-500' },
  { label: '报修中心', icon: '🔧', action: 'repair', color: 'bg-purple-500' }
];

const deviceTypes = [
  { type: 'washing_machine', label: '洗衣机', icon: '🧺', count: 5 },
  { type: 'water_purifier', label: '饮水机', icon: '💧', count: 2 },
  { type: 'shower', label: '淋浴终端', icon: '🚿', count: 1 }
];

const HomePage = () => {
  const navigate = useNavigate();

  const handleAction = (action: string) => {
    switch (action) {
      case 'scan':
        alert('扫码功能：扫描设备二维码');
        break;
      case 'reserve':
        navigate('/devices');
        break;
      case 'orders':
        navigate('/orders');
        break;
      case 'repair':
        alert('报修功能开发中');
        break;
    }
  };

  return (
    <div className="p-4 space-y-5">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-primary-100 text-sm">下午好</p>
            <h2 className="text-xl font-bold mt-1">欢迎使用共享设备</h2>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-3xl">👋</span>
          </div>
        </div>
        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 flex items-center justify-around">
          <div className="text-center">
            <p className="text-2xl font-bold">23</p>
            <p className="text-xs text-primary-100">可用设备</p>
          </div>
          <div className="w-px h-10 bg-white/30" />
          <div className="text-center">
            <p className="text-2xl font-bold">156</p>
            <p className="text-xs text-primary-100">累计积分</p>
          </div>
          <div className="w-px h-10 bg-white/30" />
          <div className="text-center">
            <p className="text-2xl font-bold">7</p>
            <p className="text-xs text-primary-100">连续签到</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {quickActions.map((item) => (
          <button
            key={item.action}
            onClick={() => handleAction(item.action)}
            className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-2`}>
              <span className="text-xl">{item.icon}</span>
            </div>
            <span className="text-xs text-gray-700">{item.label}</span>
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">设备分类</h3>
          <button
            onClick={() => navigate('/devices')}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            查看全部 →
          </button>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {deviceTypes.map((item) => (
            <button
              key={item.type}
              onClick={() => navigate('/devices', { state: { type: item.type } })}
              className="flex flex-col items-center p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mb-1">
                <span className="text-xl">{item.icon}</span>
              </div>
              <span className="text-xs text-gray-700">{item.label}</span>
              <span className="text-xs text-gray-400">{item.count}台</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">最近活动</h3>
        <div className="space-y-2">
          {[
            { title: '洗衣机-001 使用完成', time: '2小时前', desc: '标准洗衣30分钟' },
            { title: '获得签到奖励', time: '今天 08:30', desc: '+10 积分' },
            { title: '烘干机-003 预约成功', time: '昨天 18:00', desc: '19:00-19:45' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl p-4 shadow-sm flex items-center">
              <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center mr-3">
                <span className="text-lg">📌</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              <span className="text-xs text-gray-400">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
