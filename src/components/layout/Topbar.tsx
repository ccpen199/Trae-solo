
import { NavLink } from 'react-router-dom';
import { Search, UserRoundCheck, Bell } from 'lucide-react';
import { useNotificationStore } from '@/store';
import { motion } from 'framer-motion';

function Topbar() {
  const { unreadCount } = useNotificationStore();

  return (
    <motion.header
      className="topbar"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <p className="eyebrow">生产 · 加工 · 物流 · 销售</p>
        <h1>农产品全链条可信溯源与交易协同平台</h1>
      </div>
      <div className="topbar-actions">
        <NavLink to="/trace" className="icon-button" title="溯源查询">
          <Search size={18} />
        </NavLink>
        <button className="icon-button" title="消息通知">
          <Bell size={18} />
          {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        </button>
        <NavLink to="/profile" className="profile-chip">
          <UserRoundCheck size={18} />
          <span>监管专员</span>
        </NavLink>
      </div>
    </motion.header>
  );
}

export default Topbar;
