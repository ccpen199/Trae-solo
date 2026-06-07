import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Building2,
  Shield,
  Loader2,
  LogOut,
  Camera,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import StatusBadge from '@/components/common/StatusBadge';
import { cn } from '@/lib/utils';

const certStatusMap: Record<string, { variant: 'success' | 'pending' | 'danger' | 'info'; label: string }> = {
  certified: { variant: 'success', label: '已认证' },
  pending: { variant: 'pending', label: '认证中' },
  rejected: { variant: 'danger', label: '认证失败' },
  uncertified: { variant: 'info', label: '未认证' },
};

const roleMap: Record<string, string> = {
  admin: '系统管理员',
  director: '总监',
  manager: '经理',
  agent: '经纪人',
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, fetchMe, certify, logout } = useAuthStore();

  const [formData, setFormData] = useState({
    realName: '',
    idCard: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [certifyLoading, setCertifyLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!user) {
      fetchMe();
    }
  }, [fetchMe, user]);

  useEffect(() => {
    if (user?.real_name) {
      setFormData((prev) => ({
        ...prev,
        realName: user.real_name || '',
      }));
    }
  }, [user]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.realName.trim()) {
      newErrors.realName = '请输入真实姓名';
    }

    if (!formData.idCard.trim()) {
      newErrors.idCard = '请输入身份证号';
    } else if (!/^\d{17}[\dXx]$/.test(formData.idCard)) {
      newErrors.idCard = '请输入正确的18位身份证号';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');

    if (!validate()) return;

    setCertifyLoading(true);
    const result = await certify({ realName: formData.realName, idCard: formData.idCard });
    setCertifyLoading(false);

    if (result.success) {
      setSuccessMessage('认证申请已提交，等待审核');
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setApiError(result.error || '提交失败');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getCertIcon = (status: string) => {
    switch (status) {
      case 'certified':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'pending':
      return <Clock className="w-5 h-5 text-secondary-500" />;
      case 'rejected':
      return <XCircle className="w-5 h-5 text-red-500" />;
      default:
      return <Shield className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 mb-4">请先登录</p>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 bg-primary-800 text-white rounded-lg hover:bg-primary-700"
        >
          去登录
        </button>
      </div>
    </div>
    );
  }

  const certStatus = user.cert_status || 'uncertified';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-primary-800 to-primary-700 h-24" />
            <div className="px-6 pb-6">
              <div className="flex flex-col items-center -mt-12">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary-800 rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <h2 className="mt-4 text-xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-500">@{user.username}</p>

                <div className="mt-3">
                  <StatusBadge
                    status={certStatus}
                    statusMap={certStatusMap}
                    className="text-sm px-3 py-1"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">{roleMap[user.role] || user.role}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">{user.phone}</span>
                  </div>
                )}
                {user.org_name && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">{user.org_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                {getCertIcon(certStatus)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">实名认证</h3>
                  <p className="text-sm text-gray-500">
                    {certStatus === 'certified'
                      ? '您的账号已完成实名认证'
                      : certStatus === 'pending'
                      ? '认证申请正在审核中，请耐心等待'
                      : certStatus === 'rejected'
                      ? '认证未通过，请重新提交'
                      : '完成实名认证后可使用全部功能'}
                  </p>
                </div>
              </div>

              {certStatus === 'pending' && (
                <div className="mb-6 p-4 bg-secondary-50 border border-secondary-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-secondary-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-secondary-800">认证审核中</h4>
                      <p className="text-sm text-secondary-700 mt-1">
                        您的实名认证申请正在审核中，通常需要1-3个工作日。审核结果将通过系统通知您。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {certStatus === 'rejected' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800">认证未通过</h4>
                      <p className="text-sm text-red-700 mt-1">
                        您的实名认证未通过，请检查信息后重新提交。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {certStatus !== 'certified' ? (
                <form onSubmit={handleSubmit}>
                  {apiError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {apiError}
                    </div>
                  )}

                  {successMessage && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                      {successMessage}
                    </div>
                  )}

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        真实姓名
                      </label>
                      <input
                        type="text"
                        name="realName"
                        value={formData.realName}
                        onChange={handleInputChange}
                        placeholder="请输入您的真实姓名"
                        disabled={certStatus === 'pending'}
                        className={cn(
                          'w-full px-4 py-2.5 rounded-lg border text-sm',
                          errors.realName
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
                          'focus:outline-none focus:ring-2 focus:ring-opacity-20',
                          certStatus === 'pending' && 'bg-gray-100 cursor-not-allowed'
                        )}
                      />
                      {errors.realName && (
                        <p className="mt-1 text-sm text-red-600">{errors.realName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        身份证号
                      </label>
                      <input
                        type="text"
                        name="idCard"
                        value={formData.idCard}
                        onChange={handleInputChange}
                        placeholder="请输入18位身份证号"
                        maxLength={18}
                        disabled={certStatus === 'pending'}
                        className={cn(
                          'w-full px-4 py-2.5 rounded-lg border text-sm',
                          errors.idCard
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
                          'focus:outline-none focus:ring-2 focus:ring-opacity-20',
                          certStatus === 'pending' && 'bg-gray-100 cursor-not-allowed'
                        )}
                      />
                      {errors.idCard && (
                        <p className="mt-1 text-sm text-red-600">{errors.idCard}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={certifyLoading || certStatus === 'pending'}
                      className="w-full py-3 px-4 bg-gradient-to-r from-primary-800 to-primary-700 text-white font-medium rounded-lg hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {certifyLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          提交中...
                        </>
                      ) : certStatus === 'pending' ? (
                        '审核中，无法修改'
                      ) : (
                        '提交认证'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <h4 className="font-semibold text-green-800">认证已通过</h4>
                  <p className="text-sm text-green-700 mt-1">
                    您的实名认证已通过审核</p>
                  <p className="text-sm text-green-600 mt-2">
                    真实姓名：{user.real_name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
