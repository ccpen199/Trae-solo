import React, { useState, useMemo } from 'react';
import {
  Building2,
  ShieldCheck,
  User,
  CreditCard,
  Phone,
  MapPin,
  Users,
  Briefcase,
  FileCheck,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  Bell,
  Settings,
  Edit3,
  Save,
  X,
  ChevronRight,
  FileUp,
  Banknote,
  Shield,
  History,
  MessageSquare,
  ListPlus,
  FileSignature,
  TrendingUp,
  UserPlus,
  UserMinus,
  ClipboardList,
  ArrowRight,
  Eye,
  Download,
  AlertTriangle,
  LayoutDashboard,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { mockEnterpriseUser, mockOperationLogs, mockMessages, mockInsuranceChanges, mockUnemploymentApplications, mockLaborContracts } from '@/mock/data';
import { formatCurrency, formatDate } from '@/utils/format';
import type { AuthStatus, Message, InsuranceChange, UnemploymentApplication, LaborContract } from '@/types';

type TabKey = 'workbench' | 'verification' | 'info' | 'logs' | 'messages';

const authStatusMap: Record<AuthStatus, { text: string; color: string; icon: React.ReactNode }> = {
  unverified: {
    text: '未认证',
    color: 'default',
    icon: <AlertCircle className="w-4 h-4" />,
  },
  pending: {
    text: '审核中',
    color: 'warning',
    icon: <Clock className="w-4 h-4" />,
  },
  verified: {
    text: '已认证',
    color: 'success',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  failed: {
    text: '认证失败',
    color: 'danger',
    icon: <AlertCircle className="w-4 h-4" />,
  },
};

const EnterpriseInfoCard: React.FC = () => {
  const statusInfo = authStatusMap[mockEnterpriseUser.authStatus];

  const basicInfo = [
    { label: '行业类型', value: mockEnterpriseUser.industry, icon: <Briefcase className="w-4 h-4" /> },
    { label: '员工人数', value: `${mockEnterpriseUser.employeeCount} 人`, icon: <Users className="w-4 h-4" /> },
    { label: '联系电话', value: mockEnterpriseUser.contactPhone, icon: <Phone className="w-4 h-4" /> },
    { label: '企业地址', value: '北京市朝阳区建国路88号', icon: <MapPin className="w-4 h-4" /> },
  ];

  return (
    <Card className="animate-fade-in-up sticky top-4">
      <div className="text-center pb-6 border-b border-neutral-100">
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white shadow-lg mx-auto">
            <Building2 className="w-10 h-10" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success-500 rounded-full border-2 border-white flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
        </div>
        <h2 className="text-lg font-bold text-neutral-700 mt-4">
          {mockEnterpriseUser.companyName}
        </h2>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className={`badge badge-${statusInfo.color} gap-1`}>
            {statusInfo.icon}
            {statusInfo.text}
          </span>
        </div>
      </div>

      <div className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <CreditCard className="w-4 h-4" />
            <span>统一社会信用代码</span>
          </div>
          <span className="text-sm text-neutral-600 font-medium">
            {mockEnterpriseUser.creditCode}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <User className="w-4 h-4" />
            <span>法人姓名</span>
          </div>
          <span className="text-sm text-neutral-600 font-medium">
            {mockEnterpriseUser.legalPerson}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-600 mb-3">企业基本信息</h3>
        <div className="space-y-3">
          {basicInfo.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center text-primary-500">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-neutral-400">{item.label}</p>
                <p className="text-sm text-neutral-600 truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

const WorkbenchTab: React.FC = () => {
  const stats = useMemo(() => {
    const addCount = mockInsuranceChanges.filter(c => c.type === 'add').length;
    const removeCount = mockInsuranceChanges.filter(c => c.type === 'remove').length;
    const pendingApplications = mockUnemploymentApplications.filter(a => a.status === 'pending_review').length;
    const activeContracts = mockLaborContracts.filter(c => c.status === 'signed' || c.status === 'pending_sign').length;
    const totalEmployees = mockEnterpriseUser.employeeCount;
    return { addCount, removeCount, pendingApplications, activeContracts, totalEmployees };
  }, []);

  const getChangeStatusBadge = (status: InsuranceChange['status']) => {
    const map: Record<string, { text: string; color: string }> = {
      completed: { text: '已完成', color: 'success' },
      processing: { text: '处理中', color: 'primary' },
      pending: { text: '待审核', color: 'warning' },
      failed: { text: '失败', color: 'danger' },
    };
    return map[status] || { text: status, color: 'default' };
  };

  const getApplicationStatusBadge = (status: UnemploymentApplication['status']) => {
    const map: Record<string, { text: string; color: string }> = {
      pending_review: { text: '待预审', color: 'warning' },
      approved: { text: '预审通过', color: 'success' },
      rejected: { text: '预审驳回', color: 'danger' },
      paid: { text: '已发放', color: 'success' },
    };
    return map[status] || { text: status, color: 'default' };
  };

  const getContractStatusBadge = (status: LaborContract['status']) => {
    const map: Record<string, { text: string; color: string }> = {
      signed: { text: '已签订', color: 'success' },
      pending_sign: { text: '待签订', color: 'warning' },
      expired: { text: '已到期', color: 'default' },
      terminated: { text: '已终止', color: 'danger' },
    };
    return map[status] || { text: status, color: 'default' };
  };

  return (
    <div className="animate-fade-in space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <UserPlus className="w-5 h-5 opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">本月</span>
          </div>
          <p className="text-2xl font-bold">{stats.addCount}</p>
          <p className="text-xs opacity-80 mt-1">参保增员</p>
        </div>
        <div className="bg-gradient-to-br from-warning-500 to-orange-500 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <UserMinus className="w-5 h-5 opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">本月</span>
          </div>
          <p className="text-2xl font-bold">{stats.removeCount}</p>
          <p className="text-xs opacity-80 mt-1">参保减员</p>
        </div>
        <div className="bg-gradient-to-br from-secondary-500 to-violet-500 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <FileSignature className="w-5 h-5 opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">有效</span>
          </div>
          <p className="text-2xl font-bold">{stats.activeContracts}</p>
          <p className="text-xs opacity-80 mt-1">电子合同存证</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <ClipboardList className="w-5 h-5 opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">待处理</span>
          </div>
          <p className="text-2xl font-bold">{stats.pendingApplications}</p>
          <p className="text-xs opacity-80 mt-1">失业金预审</p>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-primary-500" />
            <h3 className="text-base font-semibold text-neutral-700">近期参保增减员</h3>
          </div>
          <button className="text-xs text-primary-500 hover:text-primary-600 inline-flex items-center gap-1">
            查看全部 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-neutral-400 border-b border-neutral-100">
                <th className="pb-3 font-medium">员工姓名</th>
                <th className="pb-3 font-medium">类型</th>
                <th className="pb-3 font-medium">操作日期</th>
                <th className="pb-3 font-medium">生效月份</th>
                <th className="pb-3 font-medium">状态</th>
                <th className="pb-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {mockInsuranceChanges.slice(0, 5).map((change) => (
                <tr key={change.id} className="text-sm">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center text-xs font-medium">
                        {change.employeeName.charAt(0)}
                      </div>
                      <span className="text-neutral-700">{change.employeeName}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      change.type === 'add' ? 'bg-emerald-50 text-emerald-600' : 'bg-danger-50 text-danger-500'
                    }`}>
                      {change.type === 'add' ? '增员' : '减员'}
                    </span>
                  </td>
                  <td className="py-3 text-neutral-500 text-xs">{change.operationDate}</td>
                  <td className="py-3 text-neutral-500 text-xs">{change.effectiveMonth}</td>
                  <td className="py-3">
                    <span className={`badge badge-${getChangeStatusBadge(change.status).color} gap-1 text-[10px]`}>
                      {getChangeStatusBadge(change.status).text}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button className="text-xs text-primary-500 hover:text-primary-600 inline-flex items-center gap-1">
                      <Eye className="w-3 h-3" /> 详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-warning-500" />
              <h3 className="text-base font-semibold text-neutral-700">失业金预审申请</h3>
            </div>
            <button className="text-xs text-primary-500 hover:text-primary-600 inline-flex items-center gap-1">
              全部申请 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {mockUnemploymentApplications.slice(0, 3).map((app) => {
              const statusBadge = getApplicationStatusBadge(app.status);
              return (
                <div key={app.id} className="p-3 bg-neutral-50 rounded-xl hover:bg-primary-50/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-700">{app.applicantName}</span>
                      <span className={`badge badge-${statusBadge.color} gap-1 text-[10px]`}>
                        {statusBadge.text}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-400">{app.applyDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>申请编号：{app.applicationNo}</span>
                    <span>{formatCurrency(app.monthlyBenefit)} × {app.benefitMonths}月</span>
                  </div>
                  {app.status === 'pending_review' && (
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <button className="text-xs px-3 py-1 border border-danger-200 text-danger-500 rounded-lg hover:bg-danger-50 transition-colors">
                        驳回
                      </button>
                      <button className="text-xs px-3 py-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                        通过预审
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-secondary-500" />
              <h3 className="text-base font-semibold text-neutral-700">电子合同存证</h3>
            </div>
            <button className="text-xs text-primary-500 hover:text-primary-600 inline-flex items-center gap-1">
              全部合同 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {mockLaborContracts.slice(0, 3).map((contract) => {
              const statusBadge = getContractStatusBadge(contract.status);
              return (
                <div key={contract.id} className="p-3 bg-neutral-50 rounded-xl hover:bg-primary-50/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-secondary-500" />
                      <span className="text-sm font-medium text-neutral-700">{contract.employeeName}</span>
                      <span className={`badge badge-${statusBadge.color} gap-1 text-[10px]`}>
                        {statusBadge.text}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-400">{contract.contractNo}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500">
                    <span>岗位：{contract.position}</span>
                    <span>薪资：{formatCurrency(contract.salary)}/月</span>
                    <span className="col-span-2">
                      合同期限：{contract.startDate} 至 {contract.endDate || '无固定期限'}
                    </span>
                  </div>
                  {contract.storageHash && (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400 truncate">
                        存证哈希：{contract.storageHash.slice(0, 20)}...
                      </span>
                      <button className="text-[10px] text-primary-500 hover:text-primary-600 inline-flex items-center gap-1">
                        <Download className="w-3 h-3" /> 下载
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

const VerificationTab: React.FC = () => {
  const statusInfo = authStatusMap[mockEnterpriseUser.authStatus];
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(true);

  const authMethods = [
    {
      key: 'legal',
      label: '法人实名认证',
      icon: <User className="w-5 h-5" />,
      desc: '法人身份信息核验',
      status: 'completed',
    },
    {
      key: 'license',
      label: '企业营业执照核验',
      icon: <FileCheck className="w-5 h-5" />,
      desc: '营业执照信息审核',
      status: 'completed',
    },
    {
      key: 'bank',
      label: '对公账户打款验证',
      icon: <Banknote className="w-5 h-5" />,
      desc: '企业对公账户验证',
      status: 'current',
    },
  ];

  const progressSteps = [
    { step: 1, title: '提交认证申请', status: 'completed' },
    { step: 2, title: '法人实名认证', status: 'completed' },
    { step: 3, title: '营业执照核验', status: 'completed' },
    { step: 4, title: '对公账户验证', status: 'current' },
    { step: 5, title: '认证完成', status: 'pending' },
  ];

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploaded(true);
    }, 2000);
  };

  return (
    <div className="animate-fade-in space-y-5">
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-700">企业认证状态</h3>
              <p className="text-xs text-neutral-400 mt-0.5">完成企业认证后可办理更多业务</p>
            </div>
          </div>
          <span className={`badge badge-${statusInfo.color} gap-1 px-3 py-1`}>
            {statusInfo.icon}
            {statusInfo.text}
          </span>
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-neutral-700 mb-4">认证方式</h3>
        <div className="grid grid-cols-3 gap-3">
          {authMethods.map((method) => (
            <div
              key={method.key}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                method.status === 'completed'
                  ? 'border-success-200 bg-success-50/30'
                  : method.status === 'current'
                  ? 'border-primary-500 bg-primary-50/50'
                  : 'border-neutral-100'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    method.status === 'completed'
                      ? 'bg-success-500 text-white'
                      : method.status === 'current'
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-400'
                  }`}
                >
                  {method.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    method.icon
                  )}
                </div>
                {method.status === 'completed' && (
                  <span className="text-xs text-success-500 font-medium">已完成</span>
                )}
                {method.status === 'current' && (
                  <span className="text-xs text-primary-500 font-medium">进行中</span>
                )}
              </div>
              <h4 className="text-sm font-semibold text-neutral-700">{method.label}</h4>
              <p className="text-xs text-neutral-400 mt-1">{method.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-neutral-700 mb-5">认证进度</h3>
        <div className="flex items-center justify-between relative">
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-neutral-100" />
          <div className="absolute top-4 left-6 w-3/5 h-0.5 bg-gradient-to-r from-success-500 to-primary-500" />
          {progressSteps.map((step, index) => (
            <div key={step.step} className="relative z-10 flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.status === 'completed'
                    ? 'bg-success-500 text-white'
                    : step.status === 'current'
                    ? 'bg-primary-500 text-white ring-4 ring-primary-100'
                    : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                {step.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  step.step
                )}
              </div>
              <span
                className={`text-xs mt-2 text-center ${
                  step.status === 'completed' || step.status === 'current'
                    ? 'text-neutral-600 font-medium'
                    : 'text-neutral-400'
                }`}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-neutral-700">营业执照</h3>
            <p className="text-xs text-neutral-400 mt-1">上传企业营业执照副本照片</p>
          </div>
          {uploaded && (
            <span className="badge badge-success gap-1">
              <CheckCircle2 className="w-3 h-3" />
              已上传
            </span>
          )}
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            uploaded
              ? 'border-success-200 bg-success-50/30'
              : 'border-neutral-200 hover:border-primary-300'
          }`}
        >
          {uploaded ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-xl bg-success-50 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-success-500" />
              </div>
              <p className="text-sm font-medium text-neutral-700 mb-1">营业执照副本.jpg</p>
              <p className="text-xs text-neutral-400 mb-4">上传时间：2025-06-01 10:05</p>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" icon={<FileUp className="w-4 h-4" />}>
                  重新上传
                </Button>
                <Button variant="ghost" size="sm">
                  查看大图
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-xl bg-neutral-50 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-neutral-300" />
              </div>
              <p className="text-sm text-neutral-600 mb-2">
                拖拽文件到此处，或
                <button
                  onClick={handleUpload}
                  className="text-primary-500 hover:text-primary-600 font-medium ml-1"
                >
                  点击上传
                </button>
              </p>
              <p className="text-xs text-neutral-400">
                支持 JPG、PNG 格式，文件大小不超过 5MB
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 p-4 bg-primary-50/50 rounded-xl">
          <h4 className="text-sm font-medium text-primary-700 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            上传须知
          </h4>
          <ul className="space-y-1">
            {[
              '请上传营业执照副本原件彩色扫描件或照片',
              '确保文字清晰可辨，无涂改、遮挡',
              '营业执照应在有效期内，且已完成年检',
              '文件格式支持 JPG、PNG，大小不超过 5MB',
            ].map((item, index) => (
              <li key={index} className="text-xs text-primary-600/80 flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 text-primary-500 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
};

const InfoTab: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: mockEnterpriseUser.companyName,
    creditCode: mockEnterpriseUser.creditCode,
    legalPerson: mockEnterpriseUser.legalPerson,
    legalPersonIdCard: '110101********1234',
    contactPhone: mockEnterpriseUser.contactPhone,
    industry: mockEnterpriseUser.industry,
    employeeCount: String(mockEnterpriseUser.employeeCount),
    address: '北京市朝阳区建国路88号',
    email: 'contact@zhihui.com',
    contactPerson: '张明华',
    contactPosition: '总经理',
    contactMobile: '138****8888',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const baseInfoFields = [
    { label: '企业名称', field: 'companyName', placeholder: '请输入企业名称' },
    { label: '统一社会信用代码', field: 'creditCode', placeholder: '请输入统一社会信用代码', disabled: true },
    { label: '法人姓名', field: 'legalPerson', placeholder: '请输入法人姓名', disabled: true },
    { label: '法人身份证号', field: 'legalPersonIdCard', placeholder: '请输入法人身份证号', disabled: true },
    { label: '行业类型', field: 'industry', placeholder: '请选择行业类型' },
    { label: '员工人数', field: 'employeeCount', placeholder: '请输入员工人数' },
  ];

  const contactInfoFields = [
    { label: '联系人姓名', field: 'contactPerson', placeholder: '请输入联系人姓名' },
    { label: '联系人职位', field: 'contactPosition', placeholder: '请输入联系人职位' },
    { label: '联系电话', field: 'contactPhone', placeholder: '请输入联系电话' },
    { label: '联系手机', field: 'contactMobile', placeholder: '请输入联系手机' },
    { label: '电子邮箱', field: 'email', placeholder: '请输入电子邮箱' },
    { label: '企业地址', field: 'address', placeholder: '请输入企业地址' },
  ];

  return (
    <div className="animate-fade-in space-y-5">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-500">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-700">企业基本信息</h3>
              <p className="text-xs text-neutral-400 mt-0.5">维护企业的基本信息</p>
            </div>
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" icon={<X className="w-4 h-4" />} onClick={() => setIsEditing(false)}>
                取消
              </Button>
              <Button variant="primary" size="sm" icon={<Save className="w-4 h-4" />} onClick={handleSave}>
                保存
              </Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" icon={<Edit3 className="w-4 h-4" />} onClick={() => setIsEditing(true)}>
              编辑
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {baseInfoFields.map((field) => (
            <div key={field.field}>
              <label className="text-sm text-neutral-500 mb-1.5 block">{field.label}</label>
              <input
                type="text"
                value={formData[field.field as keyof typeof formData]}
                onChange={(e) => handleInputChange(field.field, e.target.value)}
                disabled={!isEditing || field.disabled}
                className="input-base"
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-secondary-50 flex items-center justify-center text-secondary-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-neutral-700">联系人信息</h3>
            <p className="text-xs text-neutral-400 mt-0.5">企业业务联系人信息</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {contactInfoFields.map((field) => (
            <div key={field.field}>
              <label className="text-sm text-neutral-500 mb-1.5 block">{field.label}</label>
              <input
                type="text"
                value={formData[field.field as keyof typeof formData]}
                onChange={(e) => handleInputChange(field.field, e.target.value)}
                disabled={!isEditing}
                className="input-base"
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const LogsTab: React.FC = () => {
  const getTypeColor = (type: string) => {
    const map: Record<string, string> = {
      '信息修改': 'primary',
      '认证提交': 'warning',
      '审核通过': 'success',
      '资料上传': 'primary',
      '账号登录': 'default',
      '注册完成': 'success',
    };
    return map[type] || 'default';
  };

  return (
    <div className="animate-fade-in">
      <Card padding="none">
        <div className="p-5 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning-50 flex items-center justify-center text-warning-500">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-neutral-700">操作日志</h3>
                <p className="text-xs text-neutral-400 mt-0.5">企业账号操作记录</p>
              </div>
            </div>
            <span className="text-sm text-neutral-400">共 {mockOperationLogs.length} 条记录</span>
          </div>
        </div>

        <div className="divide-y divide-neutral-100">
          {mockOperationLogs.map((log, index) => (
            <div
              key={log.id}
              className="p-4 hover:bg-neutral-50 transition-colors animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-500 flex-shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`badge badge-${getTypeColor(log.type)}`}>{log.type}</span>
                      <span className="text-sm text-neutral-600 font-medium">{log.operator}</span>
                    </div>
                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.time}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 mt-2">{log.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const MessagesTab: React.FC = () => {
  const enterpriseMessages: Message[] = mockMessages.slice(0, 6).map((msg, index) => ({
    ...msg,
    type: ['system', 'business', 'policy', 'warning', 'system', 'business'][index] as Message['type'],
  }));

  const getTypeInfo = (type: Message['type']) => {
    const map = {
      system: { label: '系统通知', color: 'primary', icon: <Bell className="w-4 h-4" /> },
      business: { label: '业务通知', color: 'success', icon: <FileCheck className="w-4 h-4" /> },
      warning: { label: '预警提醒', color: 'warning', icon: <AlertCircle className="w-4 h-4" /> },
      policy: { label: '政策通知', color: 'secondary', icon: <MessageSquare className="w-4 h-4" /> },
    };
    return map[type] || map.system;
  };

  const unreadCount = enterpriseMessages.filter((m) => !m.isRead).length;

  return (
    <div className="animate-fade-in">
      <Card padding="none">
        <div className="p-5 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary-50 flex items-center justify-center text-secondary-500">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-neutral-700">消息通知</h3>
                <p className="text-xs text-neutral-400 mt-0.5">企业相关的消息通知</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-400">
                共 {enterpriseMessages.length} 条，未读 {unreadCount} 条
              </span>
              <Button variant="ghost" size="sm">全部已读</Button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-neutral-100">
          {enterpriseMessages.map((msg, index) => {
            const typeInfo = getTypeInfo(msg.type);
            return (
              <div
                key={msg.id}
                className={`p-4 hover:bg-neutral-50 transition-colors cursor-pointer animate-fade-in-up ${
                  !msg.isRead ? 'bg-primary-50/30' : ''
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      msg.type === 'system'
                        ? 'bg-primary-50 text-primary-500'
                        : msg.type === 'business'
                        ? 'bg-success-50 text-success-500'
                        : msg.type === 'warning'
                        ? 'bg-warning-50 text-warning-500'
                        : 'bg-secondary-50 text-secondary-500'
                    }`}
                  >
                    {typeInfo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {!msg.isRead && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                        )}
                        <h4 className={`text-sm font-medium truncate ${!msg.isRead ? 'text-neutral-700' : 'text-neutral-500'}`}>
                          {msg.title}
                        </h4>
                      </div>
                      <span className="text-xs text-neutral-400 flex-shrink-0">
                        {formatDate(msg.createTime)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-400 mt-1.5 line-clamp-1">{msg.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`badge badge-${typeInfo.color} text-xs`}>{typeInfo.label}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0 mt-3" />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

const EnterpriseProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('workbench');

  const tabs = [
    { key: 'workbench' as const, label: 'HR工作台', icon: LayoutDashboard },
    { key: 'verification' as const, label: '法人认证', icon: ShieldCheck },
    { key: 'info' as const, label: '企业信息', icon: Building2 },
    { key: 'logs' as const, label: '操作日志', icon: History },
    { key: 'messages' as const, label: '消息通知', icon: Bell },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'workbench':
        return <WorkbenchTab />;
      case 'verification':
        return <VerificationTab />;
      case 'info':
        return <InfoTab />;
      case 'logs':
        return <LogsTab />;
      case 'messages':
        return <MessagesTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-8">
      <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">企业中心</h1>
                <p className="text-sm text-white/70">HR工作台 · 社保办理 · 合同存证 · 失业金预审</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4">
            <EnterpriseInfoCard />
          </div>

          <div className="lg:col-span-8">
            <Card padding="none" className="overflow-hidden">
              <div className="flex border-b border-neutral-100 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all relative whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'text-primary-500'
                        : 'text-neutral-400 hover:text-neutral-600'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {activeTab === tab.key && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-5">{renderTabContent()}</div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseProfile;
