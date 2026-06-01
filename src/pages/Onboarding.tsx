import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    real_name: '',
    phone: '',
    id_card: '',
  });
  const [enterpriseData, setEnterpriseData] = useState({
    name: '',
    credit_code: '',
    industry: '',
    region: '',
    address: '',
    contact_person: '',
    contact_phone: '',
  });
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  const handleProfileSubmit = async () => {
    if (!profileData.real_name || !profileData.id_card) {
      alert('请填写完整信息');
      return;
    }

    setLoading(true);
    try {
      await api.auth.verify({
        real_name: profileData.real_name,
        id_card: profileData.id_card,
      });
      updateUser({ real_name: profileData.real_name, is_verified: 1 });

      if (user?.role === 'supplier') {
        setStep(2);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      alert(err.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterpriseSubmit = async () => {
    if (!enterpriseData.name) {
      alert('请填写企业名称');
      return;
    }

    setLoading(true);
    try {
      await api.enterprises.create(enterpriseData);
      navigate('/');
    } catch (err: any) {
      alert(err.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">完善账号信息</h1>
            <p className="text-gray-600 mt-2">
              {step === 1 ? '请完成实名认证以便使用平台功能' : '请完善企业信息以便接收订单'}
            </p>
          </div>

          <div className="flex items-center justify-center mb-8">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              1
            </div>
            <div className={`w-20 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              2
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  真实姓名 *
                </label>
                <input
                  type="text"
                  value={profileData.real_name}
                  onChange={(e) => setProfileData({ ...profileData, real_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入真实姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  身份证号 *
                </label>
                <input
                  type="text"
                  value={profileData.id_card}
                  onChange={(e) => setProfileData({ ...profileData, id_card: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入身份证号码"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  手机号
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入手机号"
                />
              </div>

              <button
                onClick={handleProfileSubmit}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? '提交中...' : '提交并继续'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  企业名称 *
                </label>
                <input
                  type="text"
                  value={enterpriseData.name}
                  onChange={(e) => setEnterpriseData({ ...enterpriseData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入企业全称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  统一社会信用代码
                </label>
                <input
                  type="text"
                  value={enterpriseData.credit_code}
                  onChange={(e) => setEnterpriseData({ ...enterpriseData, credit_code: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入统一社会信用代码"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    所属行业
                  </label>
                  <select
                    value={enterpriseData.industry}
                    onChange={(e) => setEnterpriseData({ ...enterpriseData, industry: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">请选择</option>
                    <option value="电子制造">电子制造</option>
                    <option value="机械加工">机械加工</option>
                    <option value="汽车零部件">汽车零部件</option>
                    <option value="五金制品">五金制品</option>
                    <option value="塑料制品">塑料制品</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    所在地区
                  </label>
                  <input
                    type="text"
                    value={enterpriseData.region}
                    onChange={(e) => setEnterpriseData({ ...enterpriseData, region: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="如：广东省深圳市"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  企业地址
                </label>
                <input
                  type="text"
                  value={enterpriseData.address}
                  onChange={(e) => setEnterpriseData({ ...enterpriseData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入详细地址"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    联系人
                  </label>
                  <input
                    type="text"
                    value={enterpriseData.contact_person}
                    onChange={(e) => setEnterpriseData({ ...enterpriseData, contact_person: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="联系人姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    联系电话
                  </label>
                  <input
                    type="tel"
                    value={enterpriseData.contact_phone}
                    onChange={(e) => setEnterpriseData({ ...enterpriseData, contact_phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="联系电话"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  上一步
                </button>
                <button
                  onClick={handleEnterpriseSubmit}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? '提交中...' : '完成注册'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
