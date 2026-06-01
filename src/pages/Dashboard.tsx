import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuthStore } from '../store';

export default function Dashboard() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadData();
  }, [token, navigate]);

  const loadData = async () => {
    try {
      const [declResult, appealResult] = await Promise.all([
        api.declaration.list(),
        api.appeal.list(),
      ]);
      
      if (declResult.success) {
        setDeclarations(declResult.data || []);
      }
      if (appealResult.success) {
        setAppeals(appealResult.data || []);
      }
    } catch (e) {
      console.error('Load data failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.auth.logout();
    logout();
    navigate('/login');
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: '草稿',
      submitted: '已提交',
      approved: '已审核',
      rejected: '已驳回',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      submitted: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">自然人税务数字服务中枢</h1>
              <p className="text-xs text-gray-500">个人所得税年度汇算申报系统</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">欢迎，{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-600 transition"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm">实名认证状态</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user?.faceVerified && user?.bankCardVerified
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {user?.faceVerified && user?.bankCardVerified ? '已完成' : '待完成'}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">人脸识别</span>
                <span className={`text-sm ${user?.faceVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                  {user?.faceVerified ? '✓ 已验证' : '未验证'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">银行卡验证</span>
                <span className={`text-sm ${user?.bankCardVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                  {user?.bankCardVerified ? '✓ 已验证' : '未验证'}
                </span>
              </div>
            </div>
            {(!user?.faceVerified || !user?.bankCardVerified) && (
              <Link
                to="/verify"
                className="mt-4 block text-center text-sm text-blue-600 hover:underline"
              >
                去完成实名认证 →
              </Link>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm">年度汇算申报</h3>
              <span className="text-2xl font-bold text-blue-600">{declarations.length}</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {declarations.length > 0 
                ? `最新申报：${declarations[0]?.tax_year}年度`
                : '尚未创建年度汇算申报'}
            </p>
            <Link
              to="/declaration"
              className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              开始申报
            </Link>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm">异议申诉</h3>
              <span className="text-2xl font-bold text-orange-600">{appeals.length}</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {appeals.filter(a => a.status === 'pending').length > 0 
                ? `${appeals.filter(a => a.status === 'pending').length}条待处理`
                : '暂无待处理申诉'}
            </p>
            <Link
              to="/appeal"
              className="block w-full text-center border border-blue-600 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition"
            >
              申诉管理
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">我的申报记录</h3>
            {declarations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>暂无申报记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {declarations.slice(0, 5).map((dec: any) => (
                  <div
                    key={dec.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{dec.tax_year}年度汇算</p>
                      <p className="text-xs text-gray-500">
                        应退/补税：{dec.tax_refund > 0 ? `退税 ¥${dec.tax_refund}` : dec.tax_supplement > 0 ? `补税 ¥${dec.tax_supplement}` : '¥0'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dec.status)}`}>
                      {getStatusText(dec.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">快捷入口</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/declaration"
                className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
              >
                <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-sm text-gray-700">年度汇算</span>
              </Link>
              <Link
                to="/income"
                className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition"
              >
                <svg className="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm text-gray-700">收入明细</span>
              </Link>
              <Link
                to="/appeal"
                className="flex flex-col items-center justify-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition"
              >
                <svg className="w-8 h-8 text-orange-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <span className="text-sm text-gray-700">异议申诉</span>
              </Link>
              <Link
                to="/faq"
                className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
              >
                <svg className="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-700">帮助中心</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
