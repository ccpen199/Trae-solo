import { Link } from 'react-router-dom';
import { Scale, Phone, Mail, MapPin, Shield, FileCheck, Gavel, Users } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-white">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                <Scale className="w-6 h-6 text-primary-900" />
              </div>
              <div>
                <span className="font-serif font-bold text-lg">法拍通</span>
                <span className="block text-xs text-primary-300 -mt-0.5">司法拍卖服务平台</span>
              </div>
            </div>
            <p className="text-sm text-primary-200 leading-relaxed mb-4">
              专注司法拍卖房产全流程服务，提供专业尽调、风险评估、智能选房，让法拍更透明、更安心。
            </p>
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-800 flex items-center justify-center hover:bg-primary-700 transition-colors cursor-pointer">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary-800 flex items-center justify-center hover:bg-primary-700 transition-colors cursor-pointer">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-serif font-bold text-base mb-4 text-white">快速导航</h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/list" className="text-sm text-primary-200 hover:text-gold-400 transition-colors">
                  标的列表
                </Link>
              </li>
              <li>
                <Link to="/compare" className="text-sm text-primary-200 hover:text-gold-400 transition-colors">
                  智能对比
                </Link>
              </li>
              <li>
                <Link to="/auction" className="text-sm text-primary-200 hover:text-gold-400 transition-colors">
                  竞买中心
                </Link>
              </li>
              <li>
                <Link to="/due-diligence" className="text-sm text-primary-200 hover:text-gold-400 transition-colors">
                  尽调服务
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif font-bold text-base mb-4 text-white">服务保障</h3>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-primary-200">法院合作 信息真实</span>
              </li>
              <li className="flex items-start gap-2">
                <FileCheck className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-primary-200">专业尽调 风险透明</span>
              </li>
              <li className="flex items-start gap-2">
                <Gavel className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-primary-200">全程监管 资金安全</span>
              </li>
              <li className="flex items-start gap-2">
                <Users className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-primary-200">专属顾问 一对一服务</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-serif font-bold text-base mb-4 text-white">联系我们</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-gold-400" />
                </div>
                <div>
                  <span className="block text-xs text-primary-400">客服热线</span>
                  <span className="text-sm text-white font-medium">400-888-9999</span>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-gold-400" />
                </div>
                <div>
                  <span className="block text-xs text-primary-400">邮箱</span>
                  <span className="text-sm text-white">service@fapaiz.cn</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-gold-400" />
                </div>
                <div>
                  <span className="block text-xs text-primary-400">办公地址</span>
                  <span className="text-sm text-white">上海市浦东新区陆家嘴金融中心</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-primary-400">
            © 2026 法拍通 司法拍卖服务平台 版权所有
          </p>
          <div className="flex gap-6 text-xs text-primary-400">
            <a href="#" className="hover:text-gold-400 transition-colors">用户协议</a>
            <a href="#" className="hover:text-gold-400 transition-colors">隐私政策</a>
            <a href="#" className="hover:text-gold-400 transition-colors">免责声明</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
