import { useEffect, useState } from 'react';
import { Button, Result } from 'antd';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div
        className={`relative z-10 text-center px-4 transition-all duration-1000 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <AlertTriangle className="w-24 h-24 text-yellow-500" />
            <div className="absolute -inset-4 bg-yellow-500/20 rounded-full filter blur-xl animate-pulse" />
          </div>
        </div>

        <Result
          status="404"
          title={
            <span className="text-8xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              404
            </span>
          }
          subTitle={
            <div className="mt-4">
              <p className="text-xl text-slate-300 mb-2">抱歉，您访问的页面不存在</p>
              <p className="text-sm text-slate-500">
                请求路径：<code className="px-2 py-1 bg-slate-800 rounded text-blue-400">{location.pathname}</code>
              </p>
            </div>
          }
          extra={[
            <Button
              key="home"
              type="primary"
              icon={<HomeOutlined />}
              onClick={handleGoHome}
              className="h-10 px-6 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 border-none shadow-lg shadow-blue-500/30"
            >
              返回首页
            </Button>,
            <Button
              key="back"
              icon={<ArrowLeftOutlined />}
              onClick={handleGoBack}
              className="h-10 px-6 border-slate-600 text-slate-300 hover:text-white hover:border-blue-400 bg-slate-800/50 backdrop-blur-sm"
            >
              返回上一页
            </Button>,
          ]}
        />

        <div className="mt-12 p-6 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 max-w-md mx-auto">
          <h4 className="text-lg font-semibold text-white mb-4">可能的原因</h4>
          <ul className="text-left text-slate-400 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>您输入的网址有误，请检查拼写</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>该页面已被删除或移动到其他位置</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>您没有访问该页面的权限</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>服务器暂时不可用，请稍后重试</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 text-sm text-slate-500">
          <p>如有疑问，请联系系统管理员</p>
          <p className="mt-2">山东省文化和旅游厅 · 智慧监管服务平台</p>
        </div>
      </div>
    </div>
  );
}
