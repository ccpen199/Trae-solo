import { AlertTriangle, Home } from 'lucide-react';

export default function Forbidden() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-danger-100 rounded-full mb-6">
          <AlertTriangle className="w-10 h-10 text-danger-500" />
        </div>
        <h1 className="font-noto-serif-sc text-6xl font-bold text-danger-200 mb-4">403</h1>
        <h2 className="font-noto-serif-sc text-2xl font-semibold text-neutral-800 mb-2">访问被拒绝</h2>
        <p className="text-neutral-500 mb-8">抱歉，您没有权限访问此页面。</p>
        <a href="/dashboard" className="inline-flex items-center gap-2 btn-primary">
          <Home className="w-5 h-5" />
          返回工作台
        </a>
      </div>
    </div>
  );
}
