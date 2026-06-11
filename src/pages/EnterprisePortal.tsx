import React from 'react';

const EnterprisePortal: React.FC = () => {
  const serviceCards = [
    {
      title: '社保缴纳管理',
      desc: '社保费用查询、缴纳及明细',
      gradient: 'from-blue-500 to-blue-700',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      title: '劳动合同签署',
      desc: '在线签署、续签与归档管理',
      gradient: 'from-orange-500 to-orange-700',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      title: '用工登记备案',
      desc: '员工入职、离职登记与备案',
      gradient: 'from-green-500 to-green-700',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
      ),
    },
    {
      title: '人才招聘服务',
      desc: '岗位发布、简历筛选与招聘',
      gradient: 'from-purple-500 to-purple-700',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      title: '工资薪金申报',
      desc: '工资核算、个税申报与发放',
      gradient: 'from-cyan-500 to-cyan-700',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="10" x2="16" y2="10" />
          <line x1="8" y1="14" x2="12" y2="14" />
        </svg>
      ),
    },
    {
      title: '劳动监察响应',
      desc: '监察通知接收与整改回复',
      gradient: 'from-red-500 to-red-700',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
  ];

  const todoItems = [
    { title: '3月社保费未缴纳', tag: '紧急', tagColor: 'bg-red-500' },
    { title: '劳动合同到期提醒', tag: '待处理', tagColor: 'bg-orange-500' },
    { title: '新员工用工备案', tag: '进行中', tagColor: 'bg-blue-500' },
    { title: '工资薪金申报', tag: '待申报', tagColor: 'bg-yellow-500' },
    { title: '劳动监察回复', tag: '待回复', tagColor: 'bg-red-500' },
  ];

  const stats = [
    { label: '在职员工', value: '156人', icon: '👥' },
    { label: '本月入职', value: '8人', icon: '➕' },
    { label: '本月离职', value: '3人', icon: '➖' },
    { label: '合同到期', value: '12人', icon: '📄' },
  ];

  const policies = [
    { date: '2026-06-08', title: '关于调整2026年度社会保险缴费基数的通知', source: '市人社局' },
    { date: '2026-06-05', title: '进一步规范企业用工登记备案管理有关问题的通知', source: '市人社局' },
    { date: '2026-06-02', title: '关于阶段性降低失业保险费率的通知', source: '市社保中心' },
    { date: '2026-05-28', title: '加强劳动监察执法保障劳动者合法权益的实施意见', source: '市人社局' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 pb-8">
      {/* 企业信息横幅 */}
      <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-blue-600 px-5 pt-10 pb-6 text-white">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold">重庆XX科技有限公司</h1>
          <span className="text-xs bg-white/20 rounded-full px-3 py-1">已认证</span>
        </div>
        <p className="text-xs text-blue-200 mb-4">统一社会信用代码：91500100MA60XXXXX</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
            <p className="text-xl font-bold">156</p>
            <p className="text-xs text-blue-200 mt-1">在保人数</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
            <p className="text-xl font-bold">¥89,340</p>
            <p className="text-xs text-blue-200 mt-1">本月应缴</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
            <p className="text-xl font-bold">5</p>
            <p className="text-xs text-blue-200 mt-1">待办事项</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-4">
        {/* 企业服务卡片 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-3">企业服务</h2>
          <div className="grid grid-cols-2 gap-3">
            {serviceCards.map((card) => (
              <div
                key={card.title}
                className={`bg-gradient-to-br ${card.gradient} rounded-xl p-4 text-white relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform`}
              >
                <div className="mb-2 opacity-90">{card.icon}</div>
                <h3 className="text-sm font-bold mb-1">{card.title}</h3>
                <p className="text-xs text-white/80 leading-relaxed">{card.desc}</p>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 absolute right-3 top-3 opacity-60"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* 企业待办 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800">企业待办</h2>
            <span className="text-xs text-blue-600">查看全部 &gt;</span>
          </div>
          <div className="space-y-3">
            {todoItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-3">
                  <span className={`${item.tagColor} text-white text-xs px-2 py-0.5 rounded`}>{item.tag}</span>
                  <span className="text-sm text-gray-700">{item.title}</span>
                </div>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-gray-400"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* 用工概览 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-3">用工概览</h2>
          <div className="grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <span className="text-lg">{s.icon}</span>
                <p className="text-sm font-bold text-gray-800 mt-1">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 政策速递 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800">政策速递</h2>
            <span className="text-xs text-blue-600">更多 &gt;</span>
          </div>
          <div className="space-y-3">
            {policies.map((p, idx) => (
              <div key={idx} className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0">
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{p.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-gray-400">{p.date}</span>
                  <span className="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">{p.source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterprisePortal;
