import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/utils/api';
import {
  User,
  Shield,
  Trash2,
  X,
  Loader2,
  Save,
  AlertTriangle,
  Lock,
  Smartphone,
  CheckCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Eye,
  Edit,
  Settings,
  History,
  Database,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  LogOut,
  FileText,
  Users,
  Bell,
} from 'lucide-react';

interface DataInventoryItem {
  name: string;
  count: number;
  description: string;
}

interface DataInventory {
  categories: DataInventoryItem[];
  total_records: number;
}

interface SensitiveLog {
  id: number;
  type: string;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  ip_address: string | null;
  created_at: string;
}

interface OperationLog {
  id: number;
  action: string;
  description: string;
  ip_address: string | null;
  created_at: string;
}

interface PrivacySettings {
  profile_visibility: 'private' | 'public' | 'friends';
  authorized_departments: string[];
  personalized_recommendations: boolean;
  data_export_allowed: boolean;
}

interface DeleteStatus {
  has_application: boolean;
  application_no?: string;
  status?: 'none' | 'pending' | 'cancelled' | 'completed';
  reason?: string;
  applied_at?: string;
  cool_down_end?: string;
  completed_at?: string;
  cancelled_at?: string;
  days_remaining?: number;
  audit_log?: Array<{ step: number; action: string; timestamp: string; applicationNo?: string }>;
}

type DeleteStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type ActiveTab = 'basic' | 'security' | 'privacy' | 'sensitive' | 'operations' | 'account';

const departments = ['卫健委', '交通局', '文旅局', '人社局', '公安局', '民政局', '住建局', '城管局'];

export default function Profile() {
  const { user, fetchProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('basic');

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<DeleteStep>(1);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [password, setPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsCountdown, setSmsCountdown] = useState(0);

  const [dataInventory, setDataInventory] = useState<DataInventory | null>(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus | null>(null);

  const [sensitiveLogs, setSensitiveLogs] = useState<SensitiveLog[]>([]);
  const [sensitiveLogType, setSensitiveLogType] = useState<string>('all');
  const [sensitiveLoading, setSensitiveLoading] = useState(false);

  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [operationLoading, setOperationLoading] = useState(false);

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [privacySaving, setPrivacySaving] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    if (smsCountdown > 0) {
      const timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [smsCountdown]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/profile', { name, phone });
      await fetchProfile();
      showNotification('success', '个人信息更新成功');
    } catch (e: unknown) {
      const error = e as { message?: string };
      showNotification('error', error.message || '保存失败');
    }
    setSaving(false);
  };

  const fetchDeleteStatus = useCallback(async () => {
    try {
      const status = await api.get<DeleteStatus>('/profile/delete-status');
      setDeleteStatus(status);
    } catch (e: unknown) {
      console.error(e);
    }
  }, []);

  const fetchDataInventory = useCallback(async () => {
    try {
      const data = await api.get<DataInventory>('/profile/data-inventory');
      setDataInventory(data);
    } catch (e: unknown) {
      console.error(e);
    }
  }, []);

  const fetchSensitiveLogs = useCallback(async (type: string = 'all') => {
    setSensitiveLoading(true);
    try {
      const query = type !== 'all' ? `?type=${type}` : '';
      const data = await api.get<{ list: SensitiveLog[] }>(`/profile/sensitive-logs${query}`);
      setSensitiveLogs(data.list);
    } catch (e: unknown) {
      const error = e as { message?: string };
      showNotification('error', error.message || '获取敏感日志失败');
    }
    setSensitiveLoading(false);
  }, []);

  const fetchOperationLogs = useCallback(async () => {
    setOperationLoading(true);
    try {
      const data = await api.get<{ list: OperationLog[] }>('/profile/operation-logs');
      setOperationLogs(data.list);
    } catch (e: unknown) {
      const error = e as { message?: string };
      showNotification('error', error.message || '获取操作日志失败');
    }
    setOperationLoading(false);
  }, []);

  const fetchPrivacySettings = useCallback(async () => {
    try {
      const data = await api.get<PrivacySettings>('/profile/privacy-settings');
      setPrivacySettings(data);
    } catch (e: unknown) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'sensitive') fetchSensitiveLogs(sensitiveLogType);
    if (activeTab === 'operations') fetchOperationLogs();
    if (activeTab === 'privacy') fetchPrivacySettings();
    if (activeTab === 'account') fetchDeleteStatus();
  }, [activeTab, fetchOperationLogs, fetchSensitiveLogs, sensitiveLogType, fetchPrivacySettings, fetchDeleteStatus]);

  useEffect(() => {
    if (deleteStep === 3 && !dataInventory) {
      fetchDataInventory();
    }
  }, [deleteStep, dataInventory]);

  const handleSendSmsCode = async () => {
    try {
      await api.post('/profile/send-sms-code');
      setSmsCountdown(60);
      showNotification('success', '验证码已发送，测试验证码为：123456');
    } catch (e: unknown) {
      const error = e as { message?: string };
      showNotification('error', error.message || '发送失败');
    }
  };

  const handleVerifyIdentity = async () => {
    if (!password || !smsCode) {
      showNotification('error', '请输入密码和验证码');
      return;
    }
    setDeleteLoading(true);
    try {
      await api.post('/profile/verify-identity', { password, sms_code: smsCode });
      setDeleteStep(3);
      showNotification('success', '身份验证成功');
    } catch (e: unknown) {
      const error = e as { message?: string };
      showNotification('error', error.message || '验证失败');
    }
    setDeleteLoading(false);
  };

  const handleSubmitDeleteApply = async () => {
    if (!deleteConfirmed) {
      showNotification('error', '请确认已了解注销后果');
      return;
    }
    setDeleteLoading(true);
    try {
      const result = await api.post<{ application_no: string; cool_down_end: string }>('/profile/delete-apply', {
        reason: deleteReason,
        confirmed: true,
      });
      setDeleteStep(6);
      setDeleteStatus({
        has_application: true,
        application_no: result.application_no,
        status: 'pending',
        cool_down_end: result.cool_down_end,
        days_remaining: 7,
      });
      showNotification('success', '注销申请已提交');
    } catch (e: unknown) {
      const error = e as { message?: string };
      showNotification('error', error.message || '提交失败');
    }
    setDeleteLoading(false);
  };

  const handleCancelDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.post('/profile/delete-cancel');
      setDeleteStatus(null);
      setDeleteStep(7);
      showNotification('success', '注销申请已撤销');
    } catch (e: unknown) {
      const error = e as { message?: string };
      showNotification('error', error.message || '撤销失败');
    }
    setDeleteLoading(false);
  };

  const handleSavePrivacy = async () => {
    if (!privacySettings) return;
    setPrivacySaving(true);
    try {
      await api.put('/profile/privacy-settings', privacySettings);
      showNotification('success', '隐私设置已保存');
    } catch (e: unknown) {
      const error = e as { message?: string };
      showNotification('error', error.message || '保存失败');
    }
    setPrivacySaving(false);
  };

  const handleDepartmentToggle = (dept: string) => {
    if (!privacySettings) return;
    const depts = privacySettings.authorized_departments.includes(dept)
      ? privacySettings.authorized_departments.filter((d) => d !== dept)
      : [...privacySettings.authorized_departments, dept];
    setPrivacySettings({ ...privacySettings, authorized_departments: depts });
  };

  const resetDeleteFlow = () => {
    setDeleteOpen(false);
    setDeleteStep(1);
    setPassword('');
    setSmsCode('');
    setDeleteConfirmed(false);
    setDeleteReason('');
    setDataInventory(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  const getSensitiveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      access: '数据访问',
      modify: '数据修改',
      delete: '数据删除',
      export: '数据导出',
    };
    return labels[type] || type;
  };

  const getSensitiveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      access: 'bg-blue-50 text-blue-600',
      modify: 'bg-yellow-50 text-yellow-600',
      delete: 'bg-red-50 text-red-600',
      export: 'bg-green-50 text-green-600',
    };
    return colors[type] || 'bg-gray-50 text-gray-600';
  };

  const tabs: Array<{ key: ActiveTab; label: string; icon: JSX.Element }> = [
    { key: 'basic', label: '基本信息', icon: <User className="w-4 h-4" /> },
    { key: 'security', label: '安全设置', icon: <Shield className="w-4 h-4" /> },
    { key: 'privacy', label: '隐私设置', icon: <Settings className="w-4 h-4" /> },
    { key: 'sensitive', label: '敏感记录', icon: <ShieldAlert className="w-4 h-4" /> },
    { key: 'operations', label: '操作日志', icon: <History className="w-4 h-4" /> },
    { key: 'account', label: '账号管理', icon: <Trash2 className="w-4 h-4" /> },
  ];

  const deleteSteps = [
    { step: 1, title: '风险提示', icon: <AlertTriangle className="w-5 h-5" /> },
    { step: 2, title: '身份核验', icon: <Lock className="w-5 h-5" /> },
    { step: 3, title: '数据清单', icon: <Database className="w-5 h-5" /> },
    { step: 4, title: '确认勾选', icon: <CheckCircle className="w-5 h-5" /> },
    { step: 5, title: '提交申请', icon: <FileText className="w-5 h-5" /> },
    { step: 6, title: '冷静期', icon: <Clock className="w-5 h-5" /> },
    { step: 7, title: '完成通知', icon: <Bell className="w-5 h-5" /> },
  ];

  const renderDeleteModal = () => {
    if (!deleteOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-warm-100">
            <h3 className="font-semibold text-warm-800 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-accent" />
              账号注销
            </h3>
            <button onClick={resetDeleteFlow}>
              <X className="w-5 h-5 text-warm-400 hover:text-warm-600" />
            </button>
          </div>

          <div className="px-6 pt-4">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-warm-100 -z-10" />
              <div
                className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-300 -z-10"
                style={{ width: `${((deleteStep - 1) / 6) * 100}%` }}
              />
              {deleteSteps.slice(0, 6).map((s) => (
                <div key={s.step} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      s.step < deleteStep
                        ? 'bg-primary text-white'
                        : s.step === deleteStep
                        ? 'bg-primary text-white ring-4 ring-primary-100'
                        : 'bg-warm-100 text-warm-500'
                    }`}
                  >
                    {s.step < deleteStep ? <CheckCircle className="w-4 h-4" /> : s.icon}
                  </div>
                  <span
                    className={`text-xs mt-1.5 ${
                      s.step <= deleteStep ? 'text-primary font-medium' : 'text-warm-400'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            {deleteStep === 1 && (
              <div>
                <div className="p-4 bg-accent-50 rounded-lg mb-4">
                  <h4 className="font-semibold text-accent mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    重要风险提示
                  </h4>
                  <ul className="space-y-2 text-sm text-accent-700">
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">•</span>
                      账号注销后，所有个人数据将被永久删除，无法恢复
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">•</span>
                      您的预约记录、办事申请、投诉建议等所有信息将被清除
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">•</span>
                      注销后您将无法使用本平台的任何服务
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent font-bold">•</span>
                      提交注销申请后有7天冷静期，期间可随时撤销
                    </li>
                  </ul>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setDeleteStep(2)}
                    className="px-6 py-2.5 bg-accent text-white rounded-md hover:bg-accent-light flex items-center gap-2"
                  >
                    我已知晓，继续
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {deleteStep === 2 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-warm-800">身份验证</h4>
                <p className="text-sm text-warm-500">请验证您的身份以继续注销流程</p>

                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">登录密码</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入登录密码"
                    className="w-full h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">短信验证码</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      placeholder="请输入6位验证码"
                      maxLength={6}
                      className="flex-1 h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={handleSendSmsCode}
                      disabled={smsCountdown > 0}
                      className="px-4 h-10 bg-primary-50 text-primary rounded-md text-sm font-medium hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {smsCountdown > 0 ? `${smsCountdown}s后重发` : '发送验证码'}
                    </button>
                  </div>
                  <p className="text-xs text-warm-400 mt-1">验证码将发送至：{user?.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</p>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => setDeleteStep(1)}
                    className="px-5 py-2.5 border border-warm-300 rounded-md text-warm-600 hover:bg-warm-50 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    上一步
                  </button>
                  <button
                    onClick={handleVerifyIdentity}
                    disabled={deleteLoading}
                    className="px-5 py-2.5 bg-primary text-white rounded-md hover:bg-primary-light disabled:opacity-60 flex items-center gap-2"
                  >
                    {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    验证身份
                  </button>
                </div>
              </div>
            )}

            {deleteStep === 3 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-warm-800">数据清单</h4>
                <p className="text-sm text-warm-500">以下数据将被永久删除，请仔细确认</p>

                {!dataInventory ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-primary-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-primary">总计将删除</span>
                        <span className="text-lg font-bold text-primary">{dataInventory.total_records} 条记录</span>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {dataInventory.categories.map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
                          <div>
                            <div className="text-sm font-medium text-warm-800">{cat.name}</div>
                            <div className="text-xs text-warm-500">{cat.description}</div>
                          </div>
                          <span className="text-lg font-bold text-accent">{cat.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => setDeleteStep(2)}
                    className="px-5 py-2.5 border border-warm-300 rounded-md text-warm-600 hover:bg-warm-50 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    上一步
                  </button>
                  <button
                    onClick={() => setDeleteStep(4)}
                    className="px-5 py-2.5 bg-primary text-white rounded-md hover:bg-primary-light flex items-center gap-2"
                  >
                    下一步
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {deleteStep === 4 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-warm-800">确认注销</h4>
                <p className="text-sm text-warm-500">请仔细阅读并确认以下内容</p>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 bg-warm-50 rounded-lg cursor-pointer hover:bg-warm-100">
                    <input
                      type="checkbox"
                      checked={deleteConfirmed}
                      onChange={(e) => setDeleteConfirmed(e.target.checked)}
                      className="mt-1 w-4 h-4 text-primary accent-primary"
                    />
                    <span className="text-sm text-warm-700">
                      我已阅读并理解《账号注销须知》，确认了解注销后果，包括但不限于：所有个人数据将被永久删除且无法恢复，账号将无法登录使用。
                    </span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-1.5">注销原因（可选）</label>
                    <textarea
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="请告诉我们您注销账号的原因，帮助我们改进服务"
                      rows={3}
                      className="w-full px-3 py-2 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => setDeleteStep(3)}
                    className="px-5 py-2.5 border border-warm-300 rounded-md text-warm-600 hover:bg-warm-50 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    上一步
                  </button>
                  <button
                    onClick={handleSubmitDeleteApply}
                    disabled={!deleteConfirmed || deleteLoading}
                    className="px-5 py-2.5 bg-accent text-white rounded-md hover:bg-accent-light disabled:opacity-60 flex items-center gap-2"
                  >
                    {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    提交注销申请
                  </button>
                </div>
              </div>
            )}

            {deleteStep === 6 && deleteStatus?.status === 'pending' && (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-10 h-10 text-yellow-600" />
                </div>
                <h4 className="text-xl font-semibold text-warm-800">注销申请已提交</h4>
                <div className="bg-warm-50 rounded-lg p-4 text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-warm-500">申请编号</span>
                    <span className="font-mono text-primary font-medium">{deleteStatus.application_no}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-warm-500">申请时间</span>
                    <span className="text-warm-700">{deleteStatus.applied_at ? formatDate(deleteStatus.applied_at) : '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-warm-500">冷静期剩余</span>
                    <span className="text-accent font-bold">{deleteStatus.days_remaining} 天</span>
                  </div>
                </div>
                <p className="text-sm text-warm-500">
                  在冷静期内，您可以随时撤销注销申请。冷静期结束后，账号将被永久注销。
                </p>
                <div className="flex gap-3 justify-center pt-2">
                  <button
                    onClick={handleCancelDelete}
                    disabled={deleteLoading}
                    className="px-6 py-2.5 border border-primary text-primary rounded-md hover:bg-primary-50 flex items-center gap-2"
                  >
                    {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    撤销注销申请
                  </button>
                  <button
                    onClick={resetDeleteFlow}
                    className="px-6 py-2.5 bg-primary text-white rounded-md hover:bg-primary-light"
                  >
                    返回
                  </button>
                </div>
              </div>
            )}

            {deleteStep === 7 && (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h4 className="text-xl font-semibold text-warm-800">
                  {deleteStatus?.status === 'cancelled' ? '注销已撤销' : '注销已完成'}
                </h4>
                <p className="text-sm text-warm-500">
                  {deleteStatus?.status === 'cancelled'
                    ? '您的注销申请已撤销，账号恢复正常使用。'
                    : '您的账号已完成注销，所有数据已被永久删除。'}
                </p>
                {deleteStatus?.status !== 'cancelled' && (
                  <button
                    onClick={() => {
                      useAuthStore.getState().logout();
                      window.location.href = '/';
                    }}
                    className="px-6 py-2.5 bg-primary text-white rounded-md hover:bg-primary-light flex items-center gap-2 mx-auto"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                )}
                {deleteStatus?.status === 'cancelled' && (
                  <button
                    onClick={resetDeleteFlow}
                    className="px-6 py-2.5 bg-primary text-white rounded-md hover:bg-primary-light"
                  >
                    完成
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-accent text-white'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {notification.message}
        </div>
      )}

      <h1 className="font-serif text-2xl font-bold text-warm-800 mb-6 flex items-center gap-2">
        <User className="w-6 h-6 text-primary" />
        个人中心
      </h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-primary text-white'
                : 'bg-warm-50 text-warm-600 hover:bg-warm-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'basic' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            基本信息
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">角色</label>
              <input
                type="text"
                value={user?.role === 'admin' ? '管理员' : '市民'}
                disabled
                className="w-full h-10 px-3 border border-warm-200 rounded-md text-sm bg-warm-50 text-warm-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">实名认证</label>
              <span
                className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${
                  user?.verified ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                }`}
              >
                {user?.verified ? '已认证' : '未认证'}
              </span>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-6 py-2.5 bg-primary text-white rounded-md hover:bg-primary-light disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              保存修改
            </button>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            安全设置
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-warm-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-warm-700">登录密码</div>
                  <div className="text-xs text-warm-500">定期修改密码可提高账号安全性</div>
                </div>
              </div>
              <button className="text-sm text-primary hover:underline">修改密码</button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-warm-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-warm-700">手机绑定</div>
                  <div className="text-xs text-warm-500">
                    已绑定：{user?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
                  </div>
                </div>
              </div>
              <button className="text-sm text-primary hover:underline">更换手机</button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-warm-700">登录记录</div>
                  <div className="text-xs text-warm-500">查看近期登录设备和地点</div>
                </div>
              </div>
              <button className="text-sm text-primary hover:underline">查看记录</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'privacy' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            隐私设置
          </h2>

          {!privacySettings ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-warm-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-warm-700 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      个人信息可见范围
                    </div>
                    <div className="text-xs text-warm-500 mt-1">控制您的个人信息对其他用户的可见程度</div>
                  </div>
                  <select
                    value={privacySettings.profile_visibility}
                    onChange={(e) =>
                      setPrivacySettings({
                        ...privacySettings,
                        profile_visibility: e.target.value as 'private' | 'public' | 'friends',
                      })
                    }
                    className="h-9 px-3 border border-warm-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="private">仅自己可见</option>
                    <option value="friends">好友可见</option>
                    <option value="public">公开可见</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-warm-700">数据授权管理</span>
                  </div>
                  <span className="text-xs text-warm-500">
                    已授权 {privacySettings.authorized_departments.length} 个部门
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {departments.map((dept) => (
                    <label
                      key={dept}
                      className={`flex items-center gap-2 p-2 rounded-md text-sm cursor-pointer transition-colors ${
                        privacySettings.authorized_departments.includes(dept)
                          ? 'bg-primary-50 text-primary border border-primary-200'
                          : 'bg-warm-50 text-warm-600 border border-transparent hover:bg-warm-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={privacySettings.authorized_departments.includes(dept)}
                        onChange={() => handleDepartmentToggle(dept)}
                        className="w-4 h-4 accent-primary"
                      />
                      {dept}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-warm-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-warm-700">个性化推荐</div>
                    <div className="text-xs text-warm-500">根据您的使用习惯推荐相关服务</div>
                  </div>
                  <button
                    onClick={() =>
                      setPrivacySettings({
                        ...privacySettings,
                        personalized_recommendations: !privacySettings.personalized_recommendations,
                      })
                    }
                    className="text-primary"
                  >
                    {privacySettings.personalized_recommendations ? (
                      <ToggleRight className="w-10 h-10" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-warm-400" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-warm-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-warm-700">允许数据导出</div>
                    <div className="text-xs text-warm-500">允许您导出个人数据副本</div>
                  </div>
                  <button
                    onClick={() =>
                      setPrivacySettings({
                        ...privacySettings,
                        data_export_allowed: !privacySettings.data_export_allowed,
                      })
                    }
                    className="text-primary"
                  >
                    {privacySettings.data_export_allowed ? (
                      <ToggleRight className="w-10 h-10" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-warm-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSavePrivacy}
                disabled={privacySaving}
                className="w-full py-2.5 bg-primary text-white rounded-md hover:bg-primary-light disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {privacySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                保存隐私设置
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'sensitive' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-warm-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" />
              敏感信息处理记录
            </h2>
            <button
              onClick={() => fetchSensitiveLogs(sensitiveLogType)}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {[
              { key: 'all', label: '全部' },
              { key: 'access', label: '数据访问' },
              { key: 'modify', label: '数据修改' },
              { key: 'delete', label: '数据删除' },
              { key: 'export', label: '数据导出' },
            ].map((type) => (
              <button
                key={type.key}
                onClick={() => {
                  setSensitiveLogType(type.key);
                  fetchSensitiveLogs(type.key);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  sensitiveLogType === type.key
                    ? 'bg-primary text-white'
                    : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {sensitiveLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sensitiveLogs.length === 0 ? (
            <div className="text-center py-8 text-warm-500">
              <Database className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>暂无敏感信息处理记录</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sensitiveLogs.map((log) => (
                <div key={log.id} className="p-4 bg-warm-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSensitiveTypeColor(log.type)}`}>
                        {getSensitiveTypeLabel(log.type)}
                      </span>
                      <span className="text-sm font-medium text-warm-700">{log.action}</span>
                    </div>
                    <span className="text-xs text-warm-400">{formatDate(log.created_at)}</span>
                  </div>
                  {log.field_name && (
                    <div className="text-sm text-warm-600">
                      <span className="text-warm-500">字段：</span>
                      {log.field_name}
                    </div>
                  )}
                  {log.old_value !== null && (
                    <div className="text-sm text-warm-600">
                      <span className="text-warm-500">修改前：</span>
                      <span className="line-through text-accent">{log.old_value}</span>
                      <span className="mx-2">→</span>
                      <span className="text-green-600">{log.new_value}</span>
                    </div>
                  )}
                  {log.ip_address && (
                    <div className="text-xs text-warm-400 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <Smartphone className="w-3 h-3" />
                        IP: {log.ip_address}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'operations' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-warm-800 flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              操作日志
            </h2>
            <button
              onClick={fetchOperationLogs}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
          </div>

          {operationLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : operationLogs.length === 0 ? (
            <div className="text-center py-8 text-warm-500">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>暂无操作记录</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {operationLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-warm-50 rounded-lg">
                  <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Edit className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-warm-700">{log.action}</span>
                      <span className="text-xs text-warm-400">{formatDate(log.created_at)}</span>
                    </div>
                    <p className="text-sm text-warm-500 mt-0.5">{log.description}</p>
                    {log.ip_address && (
                      <span className="text-xs text-warm-400 inline-flex items-center gap-1 mt-1">
                        <Smartphone className="w-3 h-3" />
                        IP: {log.ip_address}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'account' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-primary" />
            账号管理
          </h2>

          {deleteStatus?.has_application && deleteStatus.status === 'pending' ? (
            <div className="p-6 bg-yellow-50 rounded-lg mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800">注销申请处理中</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-yellow-700">申请编号</span>
                      <span className="font-mono text-yellow-800">{deleteStatus.application_no}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-700">冷静期剩余</span>
                      <span className="font-bold text-accent">{deleteStatus.days_remaining} 天</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        setDeleteStep(6);
                        setDeleteOpen(true);
                      }}
                      className="px-4 py-2 bg-white text-primary border border-primary rounded-md text-sm hover:bg-primary-50"
                    >
                      查看详情
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      disabled={deleteLoading}
                      className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-light disabled:opacity-60"
                    >
                      撤销注销申请
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {deleteStatus?.status === 'completed' && (
            <div className="p-6 bg-red-50 rounded-lg mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800">账号已注销</h3>
                  <p className="text-sm text-red-700 mt-1">
                    您的账号已于 {deleteStatus.completed_at ? formatDate(deleteStatus.completed_at) : '-'} 完成注销，所有数据已被永久删除。
                  </p>
                  <button
                    onClick={() => {
                      useAuthStore.getState().logout();
                      window.location.href = '/';
                    }}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                  >
                    退出登录
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 border border-accent-200 bg-accent-50 rounded-lg">
            <h3 className="font-semibold text-accent mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              注销账号
            </h3>
            <p className="text-sm text-accent-700 mb-4">
              账号注销后，所有个人数据将被永久删除，无法恢复。注销申请提交后有7天冷静期，期间可随时撤销。
            </p>
            <button
              onClick={() => {
                if (deleteStatus?.has_application && deleteStatus.status === 'pending') {
                  setDeleteStep(6);
                } else {
                  setDeleteStep(1);
                }
                setDeleteOpen(true);
              }}
              disabled={deleteStatus?.status === 'completed'}
              className="px-5 py-2.5 bg-accent text-white rounded-md hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              {deleteStatus?.has_application && deleteStatus.status === 'pending'
                ? '查看注销申请'
                : '申请注销账号'}
            </button>
          </div>

          {deleteStatus?.audit_log && deleteStatus.audit_log.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-warm-800 mb-3">审计日志</h3>
              <div className="space-y-2">
                {deleteStatus.audit_log.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-warm-50 rounded-lg">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-warm-700">{item.action}</div>
                      <div className="text-xs text-warm-500">{formatDate(item.timestamp)}</div>
                    </div>
                    {item.applicationNo && (
                      <span className="text-xs font-mono text-primary">#{item.applicationNo}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {renderDeleteModal()}
    </div>
  );
}
