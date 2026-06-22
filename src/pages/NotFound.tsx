import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-full flex items-center justify-center p-10 animate-fade-in-up">
      <div className="text-center max-w-md">
        <div className="w-28 h-28 mx-auto mb-6 flex items-end justify-center relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-100 to-slate-100 rotate-6" />
          <div className="absolute inset-0 rounded-3xl bg-white shadow-card border border-slate-200 -rotate-3" />
          <div className="relative font-serif text-6xl font-bold text-brand-700 mb-3 select-none">
            404
          </div>
        </div>
        <h2 className="font-serif text-2xl font-bold text-slate-900 mb-2">页面走丢了</h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          您访问的页面不存在、已被删除，或者您输入了错误的地址。
          建议返回首页继续使用。
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/" className="btn-primary">
            <Home className="w-4 h-4" />
            返回仪表盘
          </Link>
          <button className="btn-secondary" onClick={() => history.back()}>
            <ArrowLeft className="w-4 h-4" />
            返回上一页
          </button>
        </div>
      </div>
    </div>
  );
}
