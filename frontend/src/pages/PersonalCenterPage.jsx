import { useNavigate } from 'react-router-dom';

function PersonalCenterPage() {
  const navigate = useNavigate();

  const handleMenuItemClick = (label) => {
    const messages = {
      '我的订单': '订单功能开发中，敬请期待',
      '优惠券': '您有3张优惠券可使用',
      '行程收藏': '您还没有收藏任何行程',
      '常用地址': '常用地址管理功能开发中',
      '联系客服': '客服热线：400-123-4567',
      '设置': '设置功能开发中',
    };
    alert(messages[label] || '功能开发中');
  };

  const menuItems = [
    { label: '我的订单', icon: 'receipt' },
    { label: '优惠券', icon: 'ticket' },
    { label: '行程收藏', icon: 'star' },
    { label: '常用地址', icon: 'map' },
    { label: '联系客服', icon: 'phone' },
    { label: '设置', icon: 'settings' },
  ];

  const renderIcon = (iconName) => {
    const icons = {
      receipt: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      ticket: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      star: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      map: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      phone: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      settings: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    };
    return icons[iconName] || icons.settings;
  };

  return (
    <div className="min-h-screen bg-light">
      <header className="bg-gradient-to-r from-primary to-secondary text-white">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">阳光用户</h2>
              <p className="text-sm opacity-80">欢迎使用阳光出行</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="p-4 text-center">
              <div className="text-xl font-bold text-primary">0</div>
              <div className="text-sm text-gray-500">进行中</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-xl font-bold text-gray-800">0</div>
              <div className="text-sm text-gray-500">已完成</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-xl font-bold text-gray-800">3</div>
              <div className="text-sm text-gray-500">优惠券</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleMenuItemClick(item.label)}
              className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {renderIcon(item.icon)}
              </div>
              <span className="flex-1 text-left text-gray-700">{item.label}</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </main>

      <button
        onClick={() => navigate('/')}
        className="fixed bottom-4 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-secondary transition-colors"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </button>
    </div>
  );
}

export default PersonalCenterPage;
