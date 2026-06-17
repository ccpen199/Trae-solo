import { Link } from 'react-router-dom';

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-white p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-card p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">闪跑注册</h1>
          <p className="text-gray-500">创建您的账号</p>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-600">
            注册页面 - 占位组件
          </div>
          <Link
            to="/login"
            className="block w-full py-3 text-center text-brand-600 font-medium hover:bg-brand-50 rounded-xl transition-colors"
          >
            已有账号？去登录
          </Link>
        </div>
      </div>
    </div>
  );
}
