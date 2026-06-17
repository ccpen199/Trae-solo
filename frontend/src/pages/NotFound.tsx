import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <div className="text-8xl font-bold text-brand-500 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">页面未找到</h1>
        <p className="text-gray-500 mb-8">您访问的页面不存在或已被移除</p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
