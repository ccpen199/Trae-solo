import React, { useState } from 'react';
import {
  User,
  Shield,
  Camera,
  CreditCard,
  Smartphone,
  Lock,
  Monitor,
  Heart,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  MapPin,
  Mail,
  Eye,
  EyeOff,
  Settings,
  HelpCircle,
  Star,
  ExternalLink,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { mockUser, mockPolicyDocuments } from '@/mock/data';
import {
  formatIdCard,
  formatPhone,
  formatDate,
} from '@/utils/format';
import type { AuthStatus } from '@/types';

type TabKey = 'verification' | 'security' | 'favorites' | 'guide';

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

const UserInfoCard: React.FC = () => {
  const statusInfo = authStatusMap[mockUser.authStatus];

  const basicInfo = [
    { label: '用户编号', value: mockUser.id, icon: <User className="w-4 h-4" /> },
    { label: '电子邮箱', value: mockUser.email || '未设置', icon: <Mail className="w-4 h-4" /> },
    { label: '居住地址', value: mockUser.address || '未设置', icon: <MapPin className="w-4 h-4" /> },
  ];

  return (
    <Card className="animate-fade-in-up sticky top-4">
      <div className="text-center pb-6 border-b border-neutral-100">
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg mx-auto">
            {mockUser.name.charAt(0)}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success-500 rounded-full border-2 border-white flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        </div>
        <h2 className="text-lg font-bold text-neutral-700 mt-4">{mockUser.name}</h2>
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
            <span>身份证号</span>
          </div>
          <span className="text-sm text-neutral-600 font-medium">
            {formatIdCard(mockUser.idCard)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Smartphone className="w-4 h-4" />
            <span>手机号码</span>
          </div>
          <span className="text-sm text-neutral-600 font-medium">
            {formatPhone(mockUser.phone)}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-600 mb-3">基本信息</h3>
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

const VerificationTab: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<string>('face');
  const [isScanning, setIsScanning] = useState(false);
  const statusInfo = authStatusMap[mockUser.authStatus];

  const authMethods = [
    {
      key: 'face',
      label: '人脸识别',
      icon: <Camera className="w-5 h-5" />,
      desc: '刷脸验证，快速便捷',
    },
    {
      key: 'idcard',
      label: '身份证核验',
      icon: <CreditCard className="w-5 h-5" />,
      desc: '上传身份证正反面',
    },
    {
      key: 'bankcard',
      label: '银行卡核验',
      icon: <Smartphone className="w-5 h-5" />,
      desc: '银行卡四要素验证',
    },
  ];

  const progressSteps = [
    { step: 1, title: '身份信息提交', status: 'completed' },
    { step: 2, title: '人脸活体检测', status: 'current' },
    { step: 3, title: '人工审核', status: 'pending' },
    { step: 4, title: '认证完成', status: 'pending' },
  ];

  const handleStartVerify = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 3000);
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
              <h3 className="text-base font-semibold text-neutral-700">实名认证状态</h3>
              <p className="text-xs text-neutral-400 mt-0.5">完成实名认证后可办理更多业务</p>
            </div>
          </div>
          <span className={`badge badge-${statusInfo.color} gap-1 px-3 py-1`}>
            {statusInfo.icon}
            {statusInfo.text}
          </span>
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-neutral-700 mb-4">认证方式选择</h3>
        <div className="grid grid-cols-3 gap-3">
          {authMethods.map((method) => (
            <button
              key={method.key}
              onClick={() => setSelectedMethod(method.key)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                selectedMethod === method.key
                  ? 'border-primary-500 bg-primary-50/50'
                  : 'border-neutral-100 hover:border-primary-200'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                  selectedMethod === method.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                {method.icon}
              </div>
              <h4 className="text-sm font-semibold text-neutral-700">{method.label}</h4>
              <p className="text-xs text-neutral-400 mt-1">{method.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      {selectedMethod === 'face' && (
        <Card>
          <h3 className="text-base font-semibold text-neutral-700 mb-4">人脸识别</h3>
          <div className="flex flex-col items-center">
            <div className="relative w-64 h-64 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 overflow-hidden mb-4">
              <div className="absolute inset-0 flex items-center justify-center">
                {isScanning ? (
                  <div className="relative w-40 h-48">
                    <div className="absolute inset-0 border-2 border-primary-400 rounded-3xl animate-pulse" />
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-400 to-transparent animate-bounce" />
                    <User className="absolute inset-0 m-auto w-16 h-16 text-primary-300" />
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                      <Camera className="w-10 h-10 text-white/60" />
                    </div>
                    <p className="text-white/60 text-sm">请将面部对准框内</p>
                  </div>
                )}
              </div>
              <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-primary-400 rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-primary-400 rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-primary-400 rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-primary-400 rounded-br-lg" />
            </div>
            <Button
              onClick={handleStartVerify}
              loading={isScanning}
              className="w-full max-w-xs"
            >
              {isScanning ? '识别中...' : '开始人脸识别'}
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-base font-semibold text-neutral-700 mb-5">认证进度</h3>
        <div className="flex items-center justify-between relative">
          <div className="absolute top-4 left-8 right-8 h-0.5 bg-neutral-100" />
          <div className="absolute top-4 left-8 w-1/3 h-0.5 bg-gradient-to-r from-success-500 to-primary-500" />
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
                className={`text-xs mt-2 ${
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
        <h3 className="text-base font-semibold text-neutral-700 mb-3">认证说明</h3>
        <ul className="space-y-2">
          {[
            '请确保您的身份信息真实有效，与身份证件一致',
            '人脸识别时请保持光线充足，面部清晰可见',
            '认证审核通常在1-3个工作日内完成',
            '如有疑问请拨打服务热线：12333',
          ].map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-neutral-500">
              <CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

const SecurityTab: React.FC = () => {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const securitySettings = [
    {
      title: '登录密码',
      desc: '定期修改密码可提高账户安全性',
      icon: <Lock className="w-5 h-5" />,
      action: '修改',
      type: 'password',
    },
    {
      title: '手机绑定',
      desc: '已绑定手机：' + formatPhone(mockUser.phone),
      icon: <Smartphone className="w-5 h-5" />,
      action: '更换',
      type: 'phone',
    },
    {
      title: '登录设备',
      desc: '管理您的登录设备，保障账户安全',
      icon: <Monitor className="w-5 h-5" />,
      action: '管理',
      type: 'device',
    },
    {
      title: '安全设置',
      desc: '指纹登录、面容登录等生物识别设置',
      icon: <Settings className="w-5 h-5" />,
      action: '设置',
      type: 'settings',
    },
  ];

  const devices = [
    { name: 'iPhone 15 Pro', location: '北京', lastLogin: '2025-06-09 14:30', isCurrent: true },
    { name: 'MacBook Pro', location: '北京', lastLogin: '2025-06-08 09:15', isCurrent: false },
    { name: 'iPad Air', location: '上海', lastLogin: '2025-06-01 16:45', isCurrent: false },
  ];

  return (
    <div className="animate-fade-in space-y-5">
      <Card>
        <h3 className="text-base font-semibold text-neutral-700 mb-4">修改登录密码</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="text-sm text-neutral-500 mb-1.5 block">当前密码</label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="input-base pr-10"
                placeholder="请输入当前密码"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-neutral-500 mb-1.5 block">新密码</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-base pr-10"
                placeholder="请输入新密码"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-neutral-500 mb-1.5 block">确认新密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-base"
              placeholder="请再次输入新密码"
            />
          </div>
          <Button className="w-full">确认修改</Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-500">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-700">手机号绑定</h3>
              <p className="text-xs text-neutral-400">用于接收验证码和重要通知</p>
            </div>
          </div>
          <Button variant="secondary" size="sm">更换手机</Button>
        </div>
        <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl">
          <Smartphone className="w-5 h-5 text-success-500" />
          <div className="flex-1">
            <p className="text-sm text-neutral-600 font-medium">
              当前绑定手机号：{formatPhone(mockUser.phone)}
            </p>
            <p className="text-xs text-success-500">已绑定</p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-success-500" />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning-50 flex items-center justify-center text-warning-500">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-700">登录设备管理</h3>
              <p className="text-xs text-neutral-400">查看和管理您的登录设备</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {devices.map((device, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 hover:border-primary-200 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400">
                <Monitor className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-neutral-700">{device.name}</p>
                  {device.isCurrent && (
                    <span className="badge badge-primary text-xs">当前设备</span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {device.location} · 最后登录 {device.lastLogin}
                </p>
              </div>
              {!device.isCurrent && (
                <Button variant="ghost" size="sm">
                  移除
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-neutral-700 mb-4">安全设置</h3>
        <div className="space-y-1">
          {securitySettings.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-500">
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-700">{item.title}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-300" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const FavoritesTab: React.FC = () => {
  const favorites = mockPolicyDocuments.slice(0, 4);

  if (favorites.length === 0) {
    return (
      <div className="animate-fade-in">
        <Card>
          <div className="py-16 text-center">
            <Heart className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
            <p className="text-neutral-400">暂无收藏的政策文件</p>
            <p className="text-sm text-neutral-300 mt-1">快去收藏感兴趣的政策吧</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-3">
      {favorites.map((doc, index) => (
        <Card
          key={doc.id}
          hover
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 0.08}s` }}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-500 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-sm font-semibold text-neutral-700 hover:text-primary-500 transition-colors cursor-pointer line-clamp-2">
                  {doc.title}
                </h4>
                <Star className="w-4 h-4 text-warning-500 flex-shrink-0 fill-warning-500" />
              </div>
              <p className="text-xs text-neutral-400 mt-1.5">
                {doc.documentNo} · {doc.issuingAuthority}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                发布日期：{formatDate(doc.publishDate)}
              </p>
              <p className="text-sm text-neutral-500 mt-2 line-clamp-2">{doc.summary}</p>
              <div className="flex items-center gap-2 mt-3">
                {doc.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag.id}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

const GuideTab: React.FC = () => {
  const [expandedId, setExpandedId] = useState<number | null>(0);

  const faqs = [
    {
      id: 1,
      question: '如何办理社保关系转移？',
      answer:
        '您可以通过以下方式办理社保关系转移：1. 登录网上服务平台，在"社保关系转移"模块在线申请；2. 携带身份证原件到就近的社保经办机构窗口办理；3. 通过"掌上12333"APP申请。办理时限一般为15个工作日。',
    },
    {
      id: 2,
      question: '医保报销比例是多少？',
      answer:
        '职工医保门诊报销比例：一级医院90%，二级医院85%，三级医院80%。住院报销比例：一级医院95%，二级医院90%，三级医院85%。退休人员报销比例相应提高5个百分点。具体报销比例以当地政策为准。',
    },
    {
      id: 3,
      question: '公积金提取条件有哪些？',
      answer:
        '公积金提取条件包括：1. 购买、建造、翻建、大修自住住房的；2. 偿还购房贷款本息的；3. 租房自住的；4. 离休、退休的；5. 完全丧失劳动能力，并与单位终止劳动关系的；6. 出境定居的；7. 生活困难，正在领取城镇最低生活保障金的。',
    },
    {
      id: 4,
      question: '失业金如何申领？',
      answer:
        '失业人员可通过以下方式申领失业保险金：1. 线上申领：登录网上服务平台或"掌上12333"APP；2. 线下申领：携带身份证、解除劳动关系证明到户籍地或常住地公共就业服务机构办理。申领条件：失业前已缴纳失业保险满一年，非因本人意愿中断就业，已办理失业登记并有求职要求。',
    },
    {
      id: 5,
      question: '社保卡丢失了怎么办？',
      answer:
        '社保卡丢失后，请及时办理挂失补卡：1. 电话挂失：拨打12333服务热线；2. 线上挂失：通过网上服务平台或手机APP办理；3. 窗口挂失：携带身份证到社保经办机构窗口办理。挂失后可申请补卡，补卡一般需要10-15个工作日。',
    },
    {
      id: 6,
      question: '如何查询社保缴费记录？',
      answer:
        '您可以通过以下方式查询社保缴费记录：1. 网上查询：登录网上服务平台查询；2. 手机查询：通过"掌上12333"APP查询；3. 电话查询：拨打12333服务热线；4. 窗口查询：携带身份证到社保经办机构查询。',
    },
  ];

  return (
    <div className="animate-fade-in space-y-3">
      {faqs.map((faq, index) => (
        <Card
          key={faq.id}
          className="animate-fade-in-up overflow-hidden"
          style={{ animationDelay: `${index * 0.06}s` }}
        >
          <button
            onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
            className="w-full flex items-start justify-between gap-4 text-left"
          >
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-primary-50 flex items-center justify-center text-primary-500 flex-shrink-0 mt-0.5">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-medium text-neutral-700 pt-0.5">
                {faq.question}
              </h4>
            </div>
            <ChevronRight
              className={`w-4 h-4 text-neutral-400 flex-shrink-0 mt-1 transition-transform duration-200 ${
                expandedId === faq.id ? 'rotate-90' : ''
              }`}
            />
          </button>
          {expandedId === faq.id && (
            <div className="mt-3 pl-9 animate-fade-in">
              <p className="text-sm text-neutral-500 leading-relaxed">{faq.answer}</p>
            </div>
          )}
        </Card>
      ))}

      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary-50 flex items-center justify-center text-secondary-500">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-700">更多办事指南</h3>
              <p className="text-xs text-neutral-400">查看完整的业务办理流程说明</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" icon={<ExternalLink className="w-4 h-4" />}>
            查看更多
          </Button>
        </div>
      </Card>
    </div>
  );
};

const PersonalProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('verification');

  const tabs = [
    { key: 'verification' as const, label: '实名认证', icon: Shield },
    { key: 'security' as const, label: '账号安全', icon: Lock },
    { key: 'favorites' as const, label: '我的收藏', icon: Heart },
    { key: 'guide' as const, label: '办事指南', icon: BookOpen },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'verification':
        return <VerificationTab />;
      case 'security':
        return <SecurityTab />;
      case 'favorites':
        return <FavoritesTab />;
      case 'guide':
        return <GuideTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-8">
      <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">个人中心</h1>
                <p className="text-sm text-white/70">账户信息 · 安全设置 · 我的服务</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4">
            <UserInfoCard />
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

export default PersonalProfile;
