import { useNavigate } from 'react-router-dom';
import { Truck, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="text-center max-w-lg">
        <div className="relative mb-8">
          <div className="w-40 h-40 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
            <Truck className="w-20 h-20 text-blue-500" />
          </div>
          <div className="absolute top-0 right-1/4 -rotate-12">
            <div className="text-8xl font-bold text-blue-500/10 select-none">404</div>
          </div>
          <div className="absolute -top-4 left-1/4 rotate-12">
            <div className="w-8 h-8 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          </div>
          <div className="absolute -bottom-2 right-1/3 rotate-6">
            <div className="w-6 h-6 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
          </div>
          <div className="absolute top-1/2 -left-4 -rotate-6">
            <div className="w-5 h-5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          哎呀！快递迷路了
        </h1>
        <p className="text-lg text-gray-500 mb-8 leading-relaxed">
          您访问的页面似乎不存在，或者已经被派送到其他地方了。
          <br />
          让我们帮您重新找到正确的路线！
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200"
          >
            <Home className="w-5 h-5" />
            返回首页
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-200 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            返回上一页
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <p className="text-sm text-gray-400">
            错误代码：404 | 页面未找到
          </p>
        </div>
      </div>
    </div>
  );
}
