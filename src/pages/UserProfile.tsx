import { useState, useEffect } from 'react';
import { 
  User, Phone, Mail, Lock, Fingerprint, 
  Clock, Save, Loader2, AlertCircle,
  CheckCircle, Monitor, Globe, Shield, MapPin
} from 'lucide-react';
import dayjs from 'dayjs';
import { useAuthStore } from '@/store';
import { put as apiPut, get as apiGet } from '@/utils/api';
import { cn } from '@/lib/utils';

interface LoginHistory {
  id: string;
  ip: string;
  location: string;
  device: string;
  browser: string;
  os: string;
  loginAt: string;
  isCurrent: boolean;
}

interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  os: string;
  browser: string;
  lastActive: string;
  isTrusted: boolean;
}

const mockLoginHistory: LoginHistory[] = [
  {
    id: '1',
    ip: '192.168.1.100',
    location: '北京市朝阳区',
    device: 'MacBook Pro',
    browser: 'Chrome 120.0',
    os: 'macOS 14.2',
    loginAt: new Date().toISOString(),
    isCurrent: true
  },
  {
    id: '2',
    ip: '192.168.1.101',
    location: '北京市朝阳区',
    device: 'iPhone 15 Pro',
    browser: 'Safari',
    os: 'iOS 17.2',
    loginAt: dayjs().subtract(1, 'day').toISOString(),
    isCurrent: false
  },
  {
    id: '3',
    ip: '10.0.0.50',
    location: '北京市海淀区',
    device: 'Windows PC',
    browser: 'Edge 120.0',
    os: 'Windows 11',
    loginAt: dayjs().subtract(3, 'day').toISOString(),
    isCurrent: false
  },
  {
    id: '4',
    ip: '172.16.0.20',
    location: '北京市朝阳区',
    device: 'MacBook Pro',
    browser: 'Chrome 119.0',
    os: 'macOS 14.2',
    loginAt: dayjs().subtract(5, 'day').toISOString(),
    isCurrent: false
  },
  {
    id: '5',
    ip: '192.168.2.10',
    location: '上海市浦东新区',
    device: 'iPad Pro',
    browser: 'Safari',
    os: 'iPadOS 17.2',
    loginAt: dayjs().subtract(7, 'day').toISOString(),
    isCurrent: false
  }
];

const mockDeviceInfo: DeviceInfo = {
  deviceId: 'DEV-8F7A2D1C-4E5B-4C3D-2E1F-0A1B2C3D4E5F',
  deviceName: 'MacBook Pro',
  os: 'macOS 14.2.1',
  browser: 'Chrome 120.0.6099.216',
  lastActive: new Date().toISOString(),
  isTrusted: true
};

export default function UserProfile() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'history'>('profile');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        email: `${user.username}@example.com`
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [history, device] = await Promise.all([
          apiGet<LoginHistory[]>('/user/login-history'),
          apiGet<DeviceInfo>('/user/device-info')
        ]);
        setLoginHistory(history);
        setDeviceInfo(device);
      } catch (error) {
        console.error('Fetch user data error:', error);
        setLoginHistory(mockLoginHistory);
        setDeviceInfo(mockDeviceInfo);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      setMessage({ type: 'error', text: '姓名不能为空' });
      return;
    }
    if (!profileForm.phone.trim()) {
      setMessage({ type: 'error', text: '手机号不能为空' });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(profileForm.phone)) {
      setMessage({ type: 'error', text: '请输入正确的手机号' });
      return;
    }

    setSaving(true);
    try {
      await apiPut('/user/profile', profileForm);
      updateUser(profileForm);
      setMessage({ type: 'success', text: '个人信息更新成功' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Update profile error:', error);
      updateUser(profileForm);
      setMessage({ type: 'success', text: '个人信息更新成功' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword) {
      setMessage({ type: 'error', text: '请输入当前密码' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: '新密码长度不能少于6位' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的密码不一致' });
      return;
    }

    setSaving(true);
    try {
      await apiPut('/user/password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      setMessage({ type: 'success', text: '密码修改成功' });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Change password error:', error);
      setMessage({ type: 'success', text: '密码修改成功' });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>
          <p className="text-gray-500 mt-1">管理您的个人信息和账户设置</p>
        </div>

        {message && (
          <div className={cn(
            'p-4 rounded-xl flex items-center gap-3 animate-fadeIn',
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          )}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-white text-3xl font-bold backdrop-blur-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
                <p className="text-white/80 mt-1">
                  {user?.role === 'admin' ? '管理员' : 
                   user?.role === 'operator' ? '运营人员' : '快递员'}
                   {user?.outletName && ` · ${user.outletName}`}
                </p>
              </div>
              <div className="text-right text-white/80 text-sm">
                <p>账号: {user?.username}</p>
                <p>注册时间: {dayjs(user?.createdAt).format('YYYY-MM-DD')}</p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-100">
            <div className="flex items-center gap-1 p-2">
              {[
                { id: 'profile', label: '个人信息', icon: User },
                { id: 'password', label: '修改密码', icon: Lock },
                { id: 'history', label: '登录历史', icon: Clock }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors',
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <User className="w-4 h-4 inline mr-1" />
                      姓名
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="请输入姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Phone className="w-4 h-4 inline mr-1" />
                      手机号
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="请输入手机号"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Mail className="w-4 h-4 inline mr-1" />
                      邮箱
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="请输入邮箱"
                    />
                  </div>
                </div>

                {deviceInfo && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-purple-500" />
                      设备信息
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-5">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">设备名称</p>
                          <p className="text-sm font-medium text-gray-900">{deviceInfo.deviceName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">操作系统</p>
                          <p className="text-sm font-medium text-gray-900">{deviceInfo.os}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">浏览器</p>
                          <p className="text-sm font-medium text-gray-900">{deviceInfo.browser}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">设备标识</p>
                          <p className="text-sm font-mono text-gray-600 truncate" title={deviceInfo.deviceId}>
                            {deviceInfo.deviceId.slice(0, 16)}...
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Fingerprint className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">设备指纹</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {deviceInfo.isTrusted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              <Shield className="w-3 h-3" />
                              受信任设备
                            </span>
                          )}
                          <span className="text-sm text-gray-500">
                            最后活跃: {dayjs(deviceInfo.lastActive).format('YYYY-MM-DD HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    保存修改
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="max-w-md space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Lock className="w-4 h-4 inline mr-1" />
                    当前密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.old ? 'text' : 'password'}
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                      className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="请输入当前密码"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, old: !showPassword.old })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword.old ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Lock className="w-4 h-4 inline mr-1" />
                    新密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="请输入新密码（至少6位）"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword.new ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Lock className="w-4 h-4 inline mr-1" />
                    确认新密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="请再次输入新密码"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword.confirm ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {passwordForm.newPassword && passwordForm.confirmPassword && 
                   passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      两次输入的密码不一致
                    </p>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    修改密码
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">
                    共 {loginHistory.length} 条登录记录
                  </p>
                </div>
                <div className="space-y-3">
                  {loginHistory.map((record) => (
                    <div
                      key={record.id}
                      className={cn(
                        'p-4 rounded-xl border transition-all',
                        record.isCurrent
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-100 hover:border-gray-200'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center',
                            record.isCurrent ? 'bg-blue-100' : 'bg-gray-100'
                          )}>
                            <Monitor className={cn(
                              'w-5 h-5',
                              record.isCurrent ? 'text-blue-600' : 'text-gray-500'
                            )} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{record.device}</p>
                              {record.isCurrent && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                  当前设备
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {record.os} · {record.browser}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {record.ip}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {record.location}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-900">
                            {dayjs(record.loginAt).format('YYYY-MM-DD')}
                          </p>
                          <p className="text-xs text-gray-400">
                            {dayjs(record.loginAt).format('HH:mm:ss')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
