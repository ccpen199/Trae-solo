
import { NavLink } from 'react-router-dom';
import {
  Home,
  ScanSearch,
  Boxes,
  ShoppingBasket,
  PackageCheck,
  FileSignature,
  Sprout,
  ShieldCheck,
  Leaf,
  BadgeCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';

const navLinks = [
  { to: '/', label: '看板', icon: Home },
  { to: '/trace', label: '溯源', icon: ScanSearch },
  { to: '/market/b2b', label: 'B2B', icon: Boxes },
  { to: '/market/b2c', label: 'B2C', icon: ShoppingBasket },
  { to: '/orders', label: '订单', icon: PackageCheck },
  { to: '/contracts', label: '合同', icon: FileSignature },
  { to: '/agtech/qa', label: '农技', icon: Sprout },
  { to: '/regulatory', label: '监管', icon: ShieldCheck },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <motion.div
        className="brand-block"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="brand-mark">
          <Leaf size={24} />
        </div>
        <div>
          <strong>农品链</strong>
          <span>可信溯源交易平台</span>
        </div>
      </motion.div>

      <nav className="nav-list" aria-label="主导航">
        {navLinks.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            >
              <NavLink
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      <motion.div
        className="side-status"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <BadgeCheck size={18} />
        <div>
          <strong>链上存证正常</strong>
          <span>区块高度 8,927,523</span>
        </div>
      </motion.div>
    </aside>
  );
}

export default Sidebar;
