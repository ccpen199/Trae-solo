import { Home, Search, PlusSquare, Film, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { key: 'home', label: '首页', icon: Home, path: '/' },
  { key: 'discover', label: '发现', icon: Search, path: '/search' },
  { key: 'publish', label: '', icon: PlusSquare, path: '/publish' },
  { key: 'live', label: '直播', icon: Film, path: '/live' },
  { key: 'profile', label: '我', icon: User, path: '/profile' }
];

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isPublishTab = (tab) => tab.key === 'publish';

  return (
    <div className="tab-bar">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className="tab-item"
          onClick={() => navigate(tab.path)}
          style={{ color: location.pathname === tab.path ? '#fff' : '#777' }}
        >
          {isPublishTab(tab) ? (
            <div className="publish-tab">
              <tab.icon size={20} />
            </div>
          ) : (
            <tab.icon size={22} className="tab-icon" />
          )}
          {tab.label && <span>{tab.label}</span>}
        </button>
      ))}
    </div>
  );
}
