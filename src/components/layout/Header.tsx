import { Bell, Search, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const searchResults = [
  { title: '翠湖天地 雅苑 3室2厅', label: '房源详情', path: '/properties/p1', desc: '已验真，支持 VR 全景与产权核验详情' },
  { title: '保利西岸 1室1厅', label: '异常房源', path: '/properties/p4', desc: '图片检测异常，待后台复核' },
  { title: '经纪人工作台', label: '人员管理', path: '/agents', desc: '查看经纪人信用分、任务和成交表现' },
  { title: '管理后台', label: '后台管理', path: '/admin', desc: '组织、审计、业绩复查和系统配置' },
];

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [query, setQuery] = useState('');
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const navigate = useNavigate();

  const filteredResults = query.trim()
    ? searchResults.filter((item) => `${item.title}${item.label}${item.desc}`.includes(query.trim()))
    : searchResults;

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-surface-200 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setShowSearchPanel(true);
            }}
            onFocus={() => setShowSearchPanel(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') setShowSearchPanel(true);
            }}
            placeholder="搜索房源、经纪人、客户..."
            className="w-80 pl-10 pr-4 py-2 bg-surface-100 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
          {showSearchPanel && (
            <div className="absolute left-0 top-12 w-[420px] rounded-xl border border-surface-200 bg-white shadow-card z-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-surface-800">搜索结果</div>
                <button onClick={() => setShowSearchPanel(false)} className="text-xs text-surface-400 hover:text-surface-600">关闭</button>
              </div>
              <div className="space-y-2">
                {filteredResults.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setShowSearchPanel(false);
                    }}
                    className="w-full rounded-lg border border-surface-100 p-3 text-left hover:border-primary-200 hover:bg-primary-50/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-surface-800">{item.title}</span>
                      <span className="rounded bg-primary-50 px-2 py-0.5 text-xs text-primary-600">{item.label}</span>
                    </div>
                    <div className="mt-1 text-xs text-surface-500">{item.desc}</div>
                    <div className="mt-1 text-xs font-medium text-primary-500">查看详情</div>
                  </button>
                ))}
                {filteredResults.length === 0 && (
                  <div className="rounded-lg bg-surface-50 p-4 text-center text-sm text-surface-400">暂无结果，可尝试房源、经纪人、后台、详情等关键词</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-lg hover:bg-surface-100 transition-colors"
        >
          <Bell className="w-5 h-5 text-surface-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-status-danger rounded-full" />
        </button>

        <div className="h-6 w-px bg-surface-200" />

        <div className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 hover:bg-surface-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
            管
          </div>
          <span className="text-sm font-medium text-surface-700">管理员</span>
          <ChevronDown className="w-4 h-4 text-surface-400" />
        </button>
        {showUserMenu && (
          <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-surface-200 bg-white p-2 shadow-card">
            {[
              { title: '个人中心', desc: '我的购房画像、收藏房源、办事记录', path: '/buyers' },
              { title: '账号设置', desc: '角色权限、通知偏好和安全设置', path: '/admin' },
              { title: '管理后台', desc: '审计记录、业绩复查和组织管理', path: '/admin' },
            ].map((item) => (
              <button
                key={item.title}
                onClick={() => {
                  navigate(item.path);
                  setShowUserMenu(false);
                }}
                className="w-full rounded-lg px-3 py-2 text-left hover:bg-surface-100"
              >
                <div className="text-sm font-semibold text-surface-800">{item.title}</div>
                <div className="text-xs text-surface-400">{item.desc}</div>
              </button>
            ))}
          </div>
        )}
        </div>
      </div>
    </header>
  );
}
