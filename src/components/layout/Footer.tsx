import { Link } from 'react-router-dom';
import { Building2, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const FOOTER_LINKS = {
  关于我们: [
    { label: '公司介绍', href: '/about' },
    { label: '发展历程', href: '/about/history' },
    { label: '加入我们', href: '/careers' },
    { label: '联系我们', href: '/contact' },
  ],
  房源服务: [
    { label: '二手房', href: '/secondhand' },
    { label: '新房', href: '/new' },
    { label: '租房', href: '/rent' },
    { label: '发布房源', href: '/publish' },
  ],
  帮助中心: [
    { label: '常见问题', href: '/help' },
    { label: '用户协议', href: '/terms' },
    { label: '隐私政策', href: '/privacy' },
    { label: '投诉建议', href: '/feedback' },
  ],
  房产工具: [
    { label: '房贷计算器', href: '/calculator' },
    { label: '税费计算', href: '/calculator/tax' },
    { label: '房价走势', href: '/trend' },
    { label: '地图找房', href: '/map' },
  ],
};

const SOCIAL_LINKS = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'Youtube' },
];

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">安居寻房</span>
            </Link>
            <p className="text-sm text-gray-400 mb-6 max-w-sm">
              专业的房产信息服务平台，为您提供真实、优质的二手房、新房、租房信息，
              让您安心找到理想的家。
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-blue-400" />
                <span>客服热线：400-888-8888</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>邮箱：support@anju.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>地址：北京市朝阳区建国路88号</span>
              </div>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-white font-semibold mb-4">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="py-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="p-2 bg-gray-800 hover:bg-blue-600 rounded-lg transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            <div className="text-sm text-gray-500 text-center md:text-right">
              <p>© 2024 安居寻房. 保留所有权利.</p>
              <p className="mt-1">
                <a href="#" className="hover:text-white transition-colors">京ICP备12345678号</a>
                {' · '}
                <a href="#" className="hover:text-white transition-colors">京公网安备11010502012345号</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
