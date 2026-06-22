import React, { useState } from 'react';
import {
  User,
  Briefcase,
  Shield,
  Bell,
  Camera,
  Phone,
  Mail,
  Building2,
  Calendar,
  FileCheck,
  Upload,
  Lock,
  Smartphone,
  KeyRound,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import {
  Tabs,
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Upload as AntUpload,
  DatePicker,
  Switch,
  message,
  Divider,
  Tag,
  Tooltip,
} from 'antd';
import type { UploadProps } from 'antd';
import { mockUser } from '@/mock/data';
import { formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';

const uploadProps: UploadProps = {
  name: 'file',
  action: '/api/upload',
  headers: { authorization: 'authorization-text' },
  beforeUpload: (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB！');
      return false;
    }
    return true;
  },
  onChange(info) {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} 文件上传成功`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 文件上传失败`);
    }
  },
};

const notificationGroups = [
  {
    title: '案件相关通知',
    key: 'case',
    items: [
      { key: 'case_status', label: '案件状态变更', desc: '案件立案、开庭、判决等状态更新时通知', default: true },
      { key: 'case_node', label: '诉讼节点提醒', desc: '举证期限、开庭日期等重要节点提醒', default: true },
      { key: 'case_task', label: '案件任务分配', desc: '收到新的案件任务时通知', default: true },
      { key: 'case_comment', label: '案件评论提及', desc: '在案件讨论中被@时通知', default: true },
    ],
  },
  {
    title: '财务相关通知',
    key: 'finance',
    items: [
      { key: 'finance_income', label: '到账通知', desc: '客户付款到账时通知', default: true },
      { key: 'finance_expense', label: '支出审批', desc: '报销申请审批结果通知', default: true },
      { key: 'finance_invoice', label: '发票开具', desc: '发票申请开具完成时通知', default: false },
    ],
  },
  {
    title: '系统相关通知',
    key: 'system',
    items: [
      { key: 'system_update', label: '系统更新公告', desc: '平台功能更新、维护公告等', default: true },
      { key: 'system_security', label: '安全提醒', desc: '登录异常、密码修改等安全相关', default: true },
      { key: 'system_marketing', label: '营销推广', desc: '新功能推荐、活动优惠等', default: false },
    ],
  },
];

const Settings: React.FC = () => {
  const [profileForm] = Form.useForm();
  const [licenseForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notifications, setNotifications] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    notificationGroups.forEach(group => {
      group.items.forEach(item => {
        initial[item.key] = item.default;
      });
    });
    return initial;
  });
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  const handleProfileSave = async (values: any) => {
    message.success('个人信息已更新');
  };

  const handleLicenseSave = async (values: any) => {
    message.success('执业档案已更新');
  };

  const handlePasswordChange = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的新密码不一致');
      return;
    }
    message.success('密码修改成功');
    passwordForm.resetFields();
  };

  const handleNotificationToggle = (key: string, checked: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: checked }));
    message.success(checked ? '已开启通知' : '已关闭通知');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-primary-900">个人设置</h1>
        <p className="text-neutral-ink-500 mt-1">管理您的个人信息、执业档案、安全设置及通知偏好</p>
      </div>

      <Tabs
        defaultActiveKey="profile"
        size="large"
        items={[
          {
            key: 'profile',
            label: <span className="flex items-center gap-2"><User className="w-4 h-4" />个人信息</span>,
            children: (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lc-card border-0 lg:col-span-1">
                  <div className="flex flex-col items-center text-center py-4">
                    <div className="relative mb-4">
                      <Avatar size={120} src={mockUser.avatar} className="!border-4 !border-accent-gold/20" />
                      <AntUpload {...uploadProps} showUploadList={false}>
                        <button className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary-900 text-white flex items-center justify-center shadow-card hover:bg-primary-700 transition-colors">
                          <Camera className="w-4 h-4" />
                        </button>
                      </AntUpload>
                    </div>
                    <h3 className="font-serif font-bold text-xl text-neutral-ink-900">{mockUser.name}</h3>
                    <p className="text-sm text-neutral-ink-500 mt-1">{mockUser.firmInfo?.position}</p>
                    <div className="flex items-center gap-2 mt-3">
                      {mockUser.verified && (
                        <Tag color="success" icon={<CheckCircle2 className="w-3 h-3" />}>已实名认证</Tag>
                      )}
                      <Tag color="blue">信用分 {mockUser.creditScore}</Tag>
                    </div>
                    <Divider />
                    <div className="w-full space-y-3 text-left">
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-neutral-ink-400" />
                        <span className="text-neutral-ink-700">{mockUser.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Building2 className="w-4 h-4 text-neutral-ink-400" />
                        <span className="text-neutral-ink-700">{mockUser.firmInfo?.firmName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="w-4 h-4 text-neutral-ink-400" />
                        <span className="text-neutral-ink-700">入职于 {formatDate(mockUser.firmInfo?.joinedAt)}</span>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="lc-card border-0 lg:col-span-2" title={<span className="font-serif font-semibold text-base">基本资料</span>}>
                  <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={handleProfileSave}
                    className="mt-2"
                    initialValues={{
                      name: mockUser.name,
                      phone: mockUser.phone,
                      email: 'zhangming@justicelaw.com',
                      bio: '执业律师，专注于民商事诉讼、企业法律顾问领域，具有丰富的实务经验。',
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Form.Item
                        label="姓名"
                        name="name"
                        rules={[{ required: true, message: '请输入姓名' }]}
                      >
                        <Input prefix={<User className="w-4 h-4 text-neutral-ink-400" />} placeholder="请输入真实姓名" />
                      </Form.Item>
                      <Form.Item
                        label="手机号"
                        name="phone"
                        rules={[{ required: true, message: '请输入手机号' }]}
                      >
                        <Input prefix={<Phone className="w-4 h-4 text-neutral-ink-400" />} placeholder="请输入手机号" />
                      </Form.Item>
                      <Form.Item
                        label="邮箱"
                        name="email"
                        rules={[
                          { required: true, message: '请输入邮箱' },
                          { type: 'email', message: '请输入有效的邮箱地址' },
                        ]}
                      >
                        <Input prefix={<Mail className="w-4 h-4 text-neutral-ink-400" />} placeholder="请输入邮箱地址" />
                      </Form.Item>
                      <Form.Item label="所属律所" name="firm">
                        <Input
                          prefix={<Building2 className="w-4 h-4 text-neutral-ink-400" />}
                          value={mockUser.firmInfo?.firmName}
                          disabled
                        />
                      </Form.Item>
                    </div>
                    <Form.Item
                      label="个人简介"
                      name="bio"
                    >
                      <Input.TextArea
                        placeholder="简要介绍您的专业领域、执业经验等"
                        rows={4}
                        maxLength={500}
                        showCount
                      />
                    </Form.Item>
                    <div className="flex justify-end pt-4">
                      <Button type="primary" htmlType="submit" className="!bg-primary-900 hover:!bg-primary-700 !px-8">
                        保存修改
                      </Button>
                    </div>
                  </Form>
                </Card>
              </div>
            ),
          },
          {
            key: 'license',
            label: <span className="flex items-center gap-2"><Briefcase className="w-4 h-4" />执业档案</span>,
            children: (
              <Card className="lc-card border-0" title={<span className="font-serif font-semibold text-base">律师执业信息</span>}>
                <Form
                  form={licenseForm}
                  layout="vertical"
                  onFinish={handleLicenseSave}
                  className="mt-2"
                  initialValues={{
                    licenseNumber: mockUser.licenseInfo?.licenseNumber,
                    issuingAuthority: mockUser.licenseInfo?.issuingAuthority,
                    issueDate: mockUser.licenseInfo?.issueDate,
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Form.Item
                      label="执业证号"
                      name="licenseNumber"
                      rules={[{ required: true, message: '请输入执业证号' }]}
                    >
                      <Input prefix={<FileCheck className="w-4 h-4 text-neutral-ink-400" />} placeholder="请输入律师执业证号" />
                    </Form.Item>
                    <Form.Item
                      label="发证机关"
                      name="issuingAuthority"
                      rules={[{ required: true, message: '请输入发证机关' }]}
                    >
                      <Input prefix={<Building2 className="w-4 h-4 text-neutral-ink-400" />} placeholder="请输入发证机关名称" />
                    </Form.Item>
                    <Form.Item
                      label="发证日期"
                      name="issueDate"
                      rules={[{ required: true, message: '请选择发证日期' }]}
                    >
                      <DatePicker className="w-full" placeholder="选择发证日期" />
                    </Form.Item>
                    <Form.Item
                      label="首次执业日期"
                      name="firstPracticeDate"
                    >
                      <DatePicker className="w-full" placeholder="选择首次执业日期" />
                    </Form.Item>
                  </div>

                  <Divider />

                  <div className="mb-6">
                    <h4 className="font-medium text-neutral-ink-800 mb-3 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-accent-gold" />
                      执业证书照片
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border-2 border-dashed border-neutral-ink-200 rounded-lg text-center hover:border-primary-300 hover:bg-primary-50/30 transition-colors cursor-pointer">
                        <div className="w-full aspect-video bg-neutral-ink-50 rounded mb-3 flex items-center justify-center">
                          <img
                            src={mockUser.licenseInfo?.licenseImage || 'https://api.dicebear.com/7.x/shapes/svg?seed=license'}
                            alt="执业证书"
                            className="w-full h-full object-contain rounded"
                          />
                        </div>
                        <p className="text-sm text-neutral-ink-600 font-medium">律师执业证（正本）</p>
                        <p className="text-xs text-neutral-ink-400 mt-1">已上传</p>
                      </div>
                      <div className="p-4 border-2 border-dashed border-neutral-ink-200 rounded-lg text-center hover:border-primary-300 hover:bg-primary-50/30 transition-colors cursor-pointer">
                        <div className="w-full aspect-video bg-neutral-ink-50 rounded mb-3 flex items-center justify-center">
                          <div className="flex flex-col items-center text-neutral-ink-400">
                            <Upload className="w-8 h-8 mb-2" />
                            <span className="text-sm">点击上传</span>
                          </div>
                        </div>
                        <p className="text-sm text-neutral-ink-600 font-medium">律师执业证（副本）</p>
                        <p className="text-xs text-neutral-ink-400 mt-1">支持 JPG、PNG，不超过 5MB</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="primary" htmlType="submit" className="!bg-primary-900 hover:!bg-primary-700 !px-8">
                      保存修改
                    </Button>
                  </div>
                </Form>
              </Card>
            ),
          },
          {
            key: 'security',
            label: <span className="flex items-center gap-2"><Shield className="w-4 h-4" />安全设置</span>,
            children: (
              <div className="space-y-6">
                <Card className="lc-card border-0" title={<span className="font-serif font-semibold text-base">修改密码</span>}>
                  <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handlePasswordChange}
                    className="mt-2 max-w-lg"
                  >
                    <Form.Item
                      label="当前密码"
                      name="oldPassword"
                      rules={[{ required: true, message: '请输入当前密码' }]}
                    >
                      <Input.Password
                        prefix={<Lock className="w-4 h-4 text-neutral-ink-400" />}
                        placeholder="请输入当前密码"
                        iconRender={(visible) => (
                          visible ? <EyeOff className="w-4 h-4 cursor-pointer" onClick={() => setShowOldPassword(!visible)} />
                                  : <Eye className="w-4 h-4 cursor-pointer" onClick={() => setShowOldPassword(!visible)} />
                        )}
                      />
                    </Form.Item>
                    <Form.Item
                      label="新密码"
                      name="newPassword"
                      rules={[
                        { required: true, message: '请输入新密码' },
                        { min: 8, message: '密码长度至少8位' },
                        { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: '密码需包含大小写字母和数字' },
                      ]}
                    >
                      <Input.Password
                        prefix={<KeyRound className="w-4 h-4 text-neutral-ink-400" />}
                        placeholder="请输入新密码"
                        iconRender={(visible) => (
                          visible ? <EyeOff className="w-4 h-4 cursor-pointer" onClick={() => setShowNewPassword(!visible)} />
                                  : <Eye className="w-4 h-4 cursor-pointer" onClick={() => setShowNewPassword(!visible)} />
                        )}
                      />
                    </Form.Item>
                    <Form.Item
                      label="确认新密码"
                      name="confirmPassword"
                      rules={[{ required: true, message: '请再次输入新密码' }]}
                    >
                      <Input.Password
                        prefix={<KeyRound className="w-4 h-4 text-neutral-ink-400" />}
                        placeholder="请再次输入新密码"
                        iconRender={(visible) => (
                          visible ? <EyeOff className="w-4 h-4 cursor-pointer" onClick={() => setShowConfirmPassword(!visible)} />
                                  : <Eye className="w-4 h-4 cursor-pointer" onClick={() => setShowConfirmPassword(!visible)} />
                        )}
                      />
                    </Form.Item>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 mb-4">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-yellow-700">密码强度建议：至少8位，包含大小写字母、数字和特殊字符</p>
                    </div>
                    <Button type="primary" htmlType="submit" className="!bg-primary-900 hover:!bg-primary-700 !px-8">
                      修改密码
                    </Button>
                  </Form>
                </Card>

                <Card className="lc-card border-0">
                  <div className="flex items-center justify-between p-1">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary-50 text-primary-500">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-medium text-neutral-ink-900">手机号绑定</h4>
                        <p className="text-sm text-neutral-ink-500 mt-0.5">当前绑定手机：{mockUser.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</p>
                      </div>
                    </div>
                    <Button type="link" className="!text-primary-500 flex items-center gap-1 !p-0">
                      更换手机号 <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <Divider />
                  <div className="flex items-center justify-between p-1">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-accent-gold/10 text-accent-gold">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-medium text-neutral-ink-900">双重身份验证 (2FA)</h4>
                        <p className="text-sm text-neutral-500 mt-0.5">登录时需要输入验证码，提升账户安全性</p>
                      </div>
                    </div>
                    <Switch
                      checked={twoFAEnabled}
                      onChange={(checked) => {
                        setTwoFAEnabled(checked);
                        message.success(checked ? '双重身份验证已开启' : '双重身份验证已关闭');
                      }}
                    />
                  </div>
                </Card>
              </div>
            ),
          },
          {
            key: 'notifications',
            label: <span className="flex items-center gap-2"><Bell className="w-4 h-4" />通知偏好</span>,
            children: (
              <div className="space-y-6">
                {notificationGroups.map(group => (
                  <Card key={group.key} className="lc-card border-0" title={<span className="font-serif font-semibold text-base">{group.title}</span>}>
                    <div className="space-y-1">
                      {group.items.map((item, idx) => (
                        <div
                          key={item.key}
                          className={cn(
                            'flex items-center justify-between p-4 rounded-lg transition-colors',
                            idx !== group.items.length - 1 && 'border-b border-neutral-ink-50'
                          )}
                        >
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-neutral-ink-800">{item.label}</span>
                              {item.default && notifications[item.key] && (
                                <Tag color="blue" className="!text-xs !m-0">推荐</Tag>
                              )}
                            </div>
                            <p className="text-sm text-neutral-ink-500 mt-0.5">{item.desc}</p>
                          </div>
                          <Tooltip title={notifications[item.key] ? '点击关闭' : '点击开启'}>
                            <Switch
                              checked={notifications[item.key]}
                              onChange={(checked) => handleNotificationToggle(item.key, checked)}
                            />
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}

                <Card className="lc-card border-0" title={<span className="font-serif font-semibold text-base">通知渠道</span>}>
                  <div className="space-y-1">
                    {[
                      { key: 'in_app', label: '站内消息', desc: '平台内消息通知，登录后可查看', default: true },
                      { key: 'sms', label: '短信通知', desc: '重要事项通过短信发送到绑定手机', default: true },
                      { key: 'email', label: '邮件通知', desc: '将通知发送到您的邮箱', default: false },
                    ].map((channel, idx) => (
                      <div
                        key={channel.key}
                        className={cn(
                          'flex items-center justify-between p-4 rounded-lg transition-colors',
                          idx < 2 && 'border-b border-neutral-ink-50'
                        )}
                      >
                        <div className="flex-1 pr-4">
                          <span className="font-medium text-neutral-ink-800">{channel.label}</span>
                          <p className="text-sm text-neutral-ink-500 mt-0.5">{channel.desc}</p>
                        </div>
                        <Switch defaultChecked={channel.default} onChange={(checked) => message.success(checked ? '已开启' : '已关闭')} />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default Settings;
