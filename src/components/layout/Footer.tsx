import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Github, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative mt-20 bg-ink-900 text-ink-300 overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500 rounded-full blur-3xl" />
      </div>

      <div className="container relative py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-float">
                <span className="text-white font-bold text-lg font-num">Z</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-white font-semibold text-[15px]">展翅实习</span>
                <span className="text-ink-500 text-[11px]">大专生实习就业赋能平台</span>
              </div>
            </Link>
            <p className="text-sm text-ink-400 leading-relaxed max-w-sm mb-5">
              专注大专生实习就业服务，连接靠谱企业与优质院校，
              提供岗位匹配、内推加速、技能测评、AI简历优化等全流程赋能。
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 text-ink-400">
                <Mail size={14} className="text-brand-400 shrink-0" />
                contact@zhanchi.edu.cn
              </div>
              <div className="flex items-center gap-2 text-ink-400">
                <Phone size={14} className="text-brand-400 shrink-0" />
                400-888-0000
              </div>
              <div className="flex items-center gap-2 text-ink-400">
                <MapPin size={14} className="text-brand-400 shrink-0" />
                上海市 · 浦东新区 · 张江科学城
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">关于我们</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="hover:text-brand-400 transition-colors">
                  平台介绍
                </Link>
              </li>
              <li>
                <Link to="/about/team" className="hover:text-brand-400 transition-colors">
                  核心团队
                </Link>
              </li>
              <li>
                <Link to="/about/news" className="hover:text-brand-400 transition-colors">
                  新闻动态
                </Link>
              </li>
              <li>
                <Link to="/about/contact" className="hover:text-brand-400 transition-colors">
                  联系我们
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">服务板块</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/jobs" className="hover:text-brand-400 transition-colors">
                  实习岗位
                </Link>
              </li>
              <li>
                <Link to="/radar" className="hover:text-brand-400 transition-colors">
                  公司雷达
                </Link>
              </li>
              <li>
                <Link to="/community" className="hover:text-brand-400 transition-colors">
                  萌新社区
                </Link>
              </li>
              <li>
                <Link to="/tools" className="hover:text-brand-400 transition-colors">
                  赋能工具箱
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">友情链接</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand-400 transition-colors"
                >
                  教育部职业教育司
                </a>
              </li>
              <li>
                <a
                  href="#"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand-400 transition-colors"
                >
                  全国职业院校联盟
                </a>
              </li>
              <li>
                <a
                  href="#"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand-400 transition-colors"
                >
                  实习备案系统
                </a>
              </li>
              <li>
                <a
                  href="#"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand-400 transition-colors"
                >
                  大学生就业服务平台
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-ink-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-ink-500">
          <div className="flex items-center gap-1.5">
            © {new Date().getFullYear()} 展翅实习 Zhanchi Internship Platform ·
            <span className="inline-flex items-center gap-1">
              Made with <Heart size={11} className="text-danger-500 fill-danger-500" /> for
              大专生
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/legal/privacy" className="hover:text-ink-300 transition-colors">
              隐私政策
            </Link>
            <Link to="/legal/terms" className="hover:text-ink-300 transition-colors">
              服务协议
            </Link>
            <Link to="/legal/icp" className="hover:text-ink-300 transition-colors">
              沪ICP备 2025000000号
            </Link>
            <a
              href="#"
              target="_blank"
              rel="noreferrer"
              className="hover:text-ink-300 transition-colors inline-flex items-center gap-1"
            >
              <Github size={12} />
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
