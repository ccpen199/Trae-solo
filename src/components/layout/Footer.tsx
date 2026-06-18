import { Link } from 'react-router-dom';
import { Shield, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-surface border-t border-slate-700/50 mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Shield className="w-7 h-7 text-primary" />
              <span className="font-serif text-lg font-bold text-white">可信评价中枢</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              基于多源数据融合的垂直领域可信评价平台，为消费者提供客观、专业、可溯源的评价服务。
            </p>
          </div>

          <div>
            <h4 className="font-serif font-semibold text-white mb-4">评价领域</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/ranking/consumer" className="text-slate-400 hover:text-primary transition-colors">消费品牌</Link></li>
              <li><Link to="/ranking/education" className="text-slate-400 hover:text-primary transition-colors">教育服务</Link></li>
              <li><Link to="/ranking/medical" className="text-slate-400 hover:text-primary transition-colors">医疗健康</Link></li>
              <li><Link to="/ranking/travel" className="text-slate-400 hover:text-primary transition-colors">旅游出行</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-semibold text-white mb-4">快速链接</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/ranking" className="text-slate-400 hover:text-primary transition-colors">榜单排行</Link></li>
              <li><Link to="/compare" className="text-slate-400 hover:text-primary transition-colors">竞品对比</Link></li>
              <li><Link to="/brand/register" className="text-slate-400 hover:text-primary transition-colors">品牌入驻</Link></li>
              <li><Link to="/reviewer/tasks" className="text-slate-400 hover:text-primary transition-colors">成为评测员</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-semibold text-white mb-4">联系我们</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                contact@trusteval.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                400-888-8888
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                北京市海淀区中关村科技园
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700/50 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            © 2025 可信评价中枢. 保留所有权利.
          </p>
          <div className="flex gap-6 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-400 transition-colors">用户协议</a>
            <a href="#" className="hover:text-slate-400 transition-colors">隐私政策</a>
            <a href="#" className="hover:text-slate-400 transition-colors">关于我们</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
