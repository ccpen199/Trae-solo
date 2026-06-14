import { Link } from 'react-router-dom';
import {
  Home,
  Mail,
  Phone,
  MapPin,
  Building2,
  Heart,
  ShoppingCart,
  UserPlus,
} from 'lucide-react';

const quickLinks = [
  { label: '首页', path: '/', icon: Home },
  { label: '案例库', path: '/cases', icon: Building2 },
  { label: '户型匹配', path: '/floorplan-match' },
  { label: '采购清单', path: '/purchase-list', icon: ShoppingCart },
  { label: '设计师入驻', path: '/designer/register', icon: UserPlus },
];

const aboutItems = [
  '筑家数据是专注于家装案例数字化的平台',
  '我们致力于为用户提供真实、详细、可落地的装修案例参考',
  '覆盖全国主要城市，汇聚上千位优秀设计师的作品',
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-6 h-6 text-primary-400" />
              <span className="text-white text-xl font-bold font-heading">
                筑家数据
              </span>
            </div>
            <h3 className="text-white font-semibold mb-3">关于我们</h3>
            <ul className="space-y-2 text-sm">
              {aboutItems.map((item, index) => (
                <li key={index} className="text-gray-400">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">快速链接</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2"
                  >
                    {link.icon && <link.icon className="w-4 h-4" />}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">联系方式</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400">
                  浙江省杭州市西湖区文三路 478 号华星时代广场
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <span className="text-gray-400">400-888-8888</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <span className="text-gray-400">contact@zhujia.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <span>© 2024 筑家数据 版权所有</span>
              <Heart className="w-4 h-4 text-red-400 inline" />
            </div>
            <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1 justify-center">
              <span>浙ICP备2024000000号-1</span>
              <span>浙公网安备 33010602000000号</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
