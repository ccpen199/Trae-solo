import { Link } from 'react-router-dom';
import { Home, Search, Compass, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="page-container flex flex-col items-center justify-center text-center py-16">
      <div className="relative mb-10 animate-float-slow">
        <div className="absolute inset-0 blur-3xl opacity-30 bg-brand-gradient rounded-full scale-75" />
        <div className="relative flex items-end gap-1 font-num font-black leading-none tracking-tighter select-none">
          <span className="text-[140px] md:text-[180px] bg-clip-text text-transparent bg-brand-gradient">
            4
          </span>
          <div className="relative w-28 h-28 md:w-36 md:h-36 mb-4 md:mb-6">
            <div className="absolute inset-0 rounded-full bg-brand-gradient shadow-float animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
              <Compass size={44} className="text-brand-500 md:w-14 md:h-14 animate-spin-slow" />
            </div>
          </div>
          <span className="text-[140px] md:text-[180px] bg-clip-text text-transparent bg-teal-gradient">
            4
          </span>
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <h1 className="text-2xl md:text-3xl font-bold text-ink-900 tracking-tight">
          迷路啦，这个页面不存在
        </h1>
        <p className="mt-3 text-ink-500 max-w-md leading-relaxed">
          也许是你输错了地址，或者这个页面已经被搬到了别的地方。
          别担心，我们帮你找到了这些入口——
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-xl animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
        <Link
          to="/jobs"
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-ink-100 hover:border-brand-200 hover:shadow-card hover:-translate-y-1 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center">
            <Search size={20} />
          </div>
          <span className="text-sm font-medium text-ink-700">找实习岗位</span>
        </Link>
        <Link
          to="/radar"
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-ink-100 hover:border-teal-200 hover:shadow-card hover:-translate-y-1 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-500 flex items-center justify-center">
            <Compass size={20} />
          </div>
          <span className="text-sm font-medium text-ink-700">公司雷达</span>
        </Link>
        <Link
          to="/community"
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-ink-100 hover:border-amber-200 hover:shadow-card hover:-translate-y-1 transition-all col-span-2 sm:col-span-1"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Home size={20} />
          </div>
          <span className="text-sm font-medium text-ink-700">萌新社区</span>
        </Link>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
        <Button onClick={() => window.history.back()} variant="outline" size="lg">
          <ArrowLeft size={16} />
          返回上一页
        </Button>
        <Link to="/">
          <Button variant="primary" size="lg">
            <Home size={16} />
            回到首页
          </Button>
        </Link>
      </div>
    </div>
  );
}
