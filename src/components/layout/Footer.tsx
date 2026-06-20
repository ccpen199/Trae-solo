import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    公司信息: [
      { label: '关于我们', href: '/about' },
      { label: '加入我们', href: '/careers' },
      { label: '新闻中心', href: '/press' },
      { label: '联系我们', href: '/contact' },
    ],
    预订服务: [
      { label: '酒店预订', href: '/search' },
      { label: '优惠活动', href: '/deals' },
      { label: '渠道码专区', href: '/channel-codes' },
      { label: '礼品卡', href: '/gift-cards' },
    ],
    会员服务: [
      { label: '会员权益', href: '/member/benefits' },
      { label: '积分商城', href: '/member/rewards' },
      { label: 'VIP服务', href: '/member/vip' },
      { label: '企业客户', href: '/business' },
    ],
    帮助中心: [
      { label: '常见问题', href: '/help' },
      { label: '预订须知', href: '/help/booking' },
      { label: '取消政策', href: '/help/cancellation' },
      { label: '支付方式', href: '/help/payment' },
    ],
    合作伙伴: [
      { label: '酒店入驻', href: '/partner/hotel' },
      { label: '渠道合作', href: '/partner/channel' },
      { label: 'API对接', href: '/partner/api' },
      { label: '联盟营销', href: '/partner/affiliate' },
    ],
    法律条款: [
      { label: '服务条款', href: '/terms' },
      { label: '隐私政策', href: '/privacy' },
      { label: 'Cookie政策', href: '/cookies' },
      { label: 'GDPR合规', href: '/gdpr' },
    ],
  };

  return (
    <footer className="bg-graphite-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-cloud-300 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-graphite-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-deep-blue-light to-coral-orange rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold">
                StayGlobal
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-cloud-400">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>support@stayglobal.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+86 400-888-8888</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>全球 200+ 国家和地区</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <a href="#" className="text-cloud-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-cloud-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-cloud-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-cloud-400 hover:text-white transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-cloud-500">
            <div className="text-center md:text-left">
              © {currentYear} StayGlobal. 保留所有权利。
            </div>
            <div className="flex items-center gap-4">
              <img src="https://img.shields.io/badge/PCI_DSS-Compliant-blue" alt="PCI DSS" className="h-6" />
              <img src="https://img.shields.io/badge/GDPR-Compliant-green" alt="GDPR" className="h-6" />
              <img src="https://img.shields.io/badge/ISO_27001-Certified-gold" alt="ISO 27001" className="h-6" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
