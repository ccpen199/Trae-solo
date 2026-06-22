import {
  HomeOutlined,
  MessageOutlined,
  FileTextOutlined,
  BarChartOutlined,
  CloudSyncOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Badge } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMessageStore } from '@/store/messageStore';
import { useOfflineStore } from '@/store/offlineStore';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useMessageStore();
  const { pendingSync } = useOfflineStore();

  const navItems = [
    { path: '/', icon: <HomeOutlined />, label: '首页', badge: 0 },
    { path: '/messages', icon: <MessageOutlined />, label: '消息', badge: unreadCount },
    { path: '/appeals', icon: <FileTextOutlined />, label: '申诉', badge: 0 },
    { path: '/stats', icon: <BarChartOutlined />, label: '数据', badge: 0 },
    { path: '/offline', icon: <CloudSyncOutlined />, label: '离线', badge: pendingSync.length },
    { path: '/profile', icon: <UserOutlined />, label: '我的', badge: 0 },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-14 z-50">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive(item.path) ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <span className="text-xl relative">
            {item.badge > 0 ? (
              <Badge count={item.badge} size="small" offset={[6, -2]}>
                {item.icon}
              </Badge>
            ) : (
              item.icon
            )}
          </span>
          <span className="text-xs mt-1">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNav;
