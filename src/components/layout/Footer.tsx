import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Shield,
  Award,
  FileCheck,
  Users,
} from 'lucide-react';

const quickLinks = [
  { label: '首页', path: '/' },
  { label: '在线鉴定', path: '/appraise' },
  { label: '鉴定证书', path: '/certificate' },
  { label: '行家知识库', path: '/knowledge' },
  { label: '价值评估', path: '/valuation' },
  { label: '社区问答', path: '/community' },
  { label: 'API开放平台', path: '/openapi' },
];

const aboutLinks = [
  { label: '关于我们', path: '/about' },
  { label: '服务协议', path: '/terms' },
  { label: '隐私政策', path: '/privacy' },
  { label: '帮助中心', path: '/help' },
  { label: '联系客服', path: '/support' },
  { label: '加入我们', path: '/join' },
];

export function Footer() {
  return (
    <footer className="bg-ink-gradient border-t border-gold-400 mt-auto">
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-md bg-jade-700 flex items-center justify-center border-2 border-gold-400 shadow-gold-glow">
                <span className="font-serif text-2xl font-bold text-gold-300 text-shadow-gold">
                  鉴
                </span>
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-gold-300">鉴真阁</h2>
                <p className="text-xs text-gold-400 tracking-widest">权威鉴定 · 传承有序</p>
              </div>
            </div>
            <p className="text-jade-200 mb-6 leading-relaxed max-w-md">
              鉴真阁是国内领先的文玩艺术品在线鉴定平台，汇聚国家级、省级权威鉴定专家，
              运用 AI 图像识别与区块链存证技术，为藏家提供专业、可信、便捷的鉴定服务。
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-jade-700/50 border border-gold-400/30">
                  <Award className="w-5 h-5 text-gold-400" />
                </div>
                <p className="text-lg font-bold text-gold-300">200+</p>
                <p className="text-xs text-jade-300">认证专家</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-jade-700/50 border border-gold-400/30">
                  <FileCheck className="w-5 h-5 text-gold-400" />
                </div>
                <p className="text-lg font-bold text-gold-300">50万+</p>
                <p className="text-xs text-jade-300">鉴定证书</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-jade-700/50 border border-gold-400/30">
                  <Users className="w-5 h-5 text-gold-400" />
                </div>
                <p className="text-lg font-bold text-gold-300">100万+</p>
                <p className="text-xs text-jade-300">注册藏家</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-jade-700/50 border border-gold-400/30">
                  <Shield className="w-5 h-5 text-gold-400" />
                </div>
                <p className="text-lg font-bold text-gold-300">99.9%</p>
                <p className="text-xs text-jade-300">鉴定准确率</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold text-gold-300 mb-4">快捷链接</h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-jade-200 hover:text-gold-400 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold text-gold-300 mb-4">关于平台</h3>
            <ul className="space-y-2.5">
              {aboutLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-jade-200 hover:text-gold-400 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold text-gold-300 mb-4">联系方式</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-jade-200 text-sm">客服热线</p>
                  <p className="text-gold-300 font-medium">400-888-8888</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-jade-200 text-sm">邮箱</p>
                  <p className="text-gold-300 font-medium">contact@jianzhenge.com</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-jade-200 text-sm">服务时间</p>
                  <p className="text-gold-300 font-medium">9:00 - 21:00</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-jade-200 text-sm">地址</p>
                  <p className="text-gold-300 font-medium text-sm">北京市东城区琉璃厂文化街</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-jade-700/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-jade-300 text-sm">
              © {new Date().getFullYear()} 鉴真阁艺术品鉴定有限公司 版权所有
            </p>
            <div className="flex items-center gap-6 text-sm text-jade-300">
              <span>京ICP备2024000000号-1</span>
              <span>京公网安备 11010102000000号</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
