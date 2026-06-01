import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuthStore } from '../store';

export default function Verify() {
  const { user, token, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'face' | 'bank'>('face');
  const [loading, setLoading] = useState(false);
  
  const [bankCardNumber, setBankCardNumber] = useState('');
  const [bankName, setBankName] = useState('');

  if (!token) {
    navigate('/login');
    return null;
  }

  const handleFaceVerify = async () => {
    setLoading(true);
    try {
      const mockFaceImage = 'data:image/png;base64,' + 'mock_face_image_data_'.repeat(10);
      const result = await api.auth.faceVerify(mockFaceImage);
      
      if (result.success) {
        alert('人脸识别验证成功！');
        if (user) {
          setUser({ ...user, faceVerified: true });
        }
      } else {
        alert(result.error || '验证失败');
      }
    } catch (e) {
      alert('验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleBankVerify = async () => {
    if (!bankCardNumber) {
      alert('请输入银行卡号');
      return;
    }

    setLoading(true);
    try {
      const result = await api.auth.bankVerify({ bankCardNumber, bankName });
      
      if (result.success) {
        alert('银行卡验证成功！');
        if (user) {
          setUser({ ...user, bankCardVerified: true });
        }
        setBankCardNumber('');
        setBankName('');
      } else {
        alert(result.error || '验证失败');
      }
    } catch (e) {
      alert('验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
              ← 返回
            </Link>
            <h1 className="text-xl font-bold text-gray-800">实名认证</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">当前认证状态</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border-2 ${
              user?.faceVerified ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">人脸识别</span>
                <span className={user?.faceVerified ? 'text-green-600' : 'text-gray-400'}>
                  {user?.faceVerified ? '✓ 已验证' : '未验证'}
                </span>
              </div>
            </div>
            <div className={`p-4 rounded-lg border-2 ${
              user?.bankCardVerified ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">银行卡验证</span>
                <span className={user?.bankCardVerified ? 'text-green-600' : 'text-gray-400'}>
                  {user?.bankCardVerified ? '✓ 已验证' : '未验证'}
                </span>
              </div>
            </div>
          </div>
          {user?.faceVerified && user?.bankCardVerified && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg text-center">
              <p className="text-green-700 font-medium">🎉 您已完成全部实名认证，可以提交年度汇算申报了！</p>
              <Link
                to="/declaration"
                className="inline-block mt-2 text-blue-600 hover:underline text-sm"
              >
                前往申报 →
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('face')}
              className={`flex-1 py-4 text-center font-medium transition ${
                activeTab === 'face'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              人脸识别验证
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`flex-1 py-4 text-center font-medium transition ${
                activeTab === 'bank'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              银行卡验证
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'face' && (
              <div className="text-center">
                <div className="w-40 h-40 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">人脸识别验证</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  请保持面部在取景框内，光线充足，完成活体检测。系统将比对您的身份信息进行验证。
                </p>
                {user?.faceVerified ? (
                  <div className="text-green-600 font-medium">✓ 您已完成人脸识别验证</div>
                ) : (
                  <button
                    onClick={handleFaceVerify}
                    disabled={loading}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading ? '验证中...' : '开始人脸识别'}
                  </button>
                )}
              </div>
            )}

            {activeTab === 'bank' && (
              <div className="max-w-md mx-auto">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">银行卡验证</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    请输入您本人名下的银行卡号，用于接收退税款项
                  </p>
                </div>

                {user?.bankCardVerified ? (
                  <div className="text-center py-8">
                    <div className="text-green-600 font-medium">✓ 您已完成银行卡验证</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        银行卡号 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bankCardNumber}
                        onChange={(e) => setBankCardNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="请输入银行卡号"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono"
                        maxLength={19}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        开户银行
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="请输入开户银行（选填）"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
                    <button
                      onClick={handleBankVerify}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {loading ? '验证中...' : '验证银行卡'}
                    </button>
                  </div>
                )}

                <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-yellow-700">
                    <span className="font-medium">温馨提示：</span>
                    请确保银行卡为您本人名下的Ⅰ类账户，以便顺利接收退税款项。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
