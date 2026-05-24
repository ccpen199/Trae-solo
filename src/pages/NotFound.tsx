import { AlertTriangle, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-neutral-100 rounded-full mb-6">
          <AlertTriangle className="w-10 h-10 text-neutral-400" />
        </div>
        <h1 className="font-noto-serif-sc text-6xl font-bold text-neutral-300 mb-4">404</h1>
        <h2 className="font-noto-serif-sc text-2xl font-semibold text-neutral-800 mb-2">页面未找到</h2>
        <p className="text-neutral-500 mb-8">抱歉，您访问的页面不存在或已被移除。</p>
        <a href="/dashboard" className="inline-flex items-center gap-2 btn-primary">
          <Home className="w-5 h-5" />
          返回工作台
        </a>
      </div>
    </div>
  );
}
