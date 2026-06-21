import React, { useEffect, useState } from 'react';
import {
  Card, Form, Input, Button, Avatar, Upload, Tabs, Table, Tag, Modal,
  Switch, message, Space, Tooltip, Descriptions, Empty, List, Timeline,
  Badge, Divider, Alert as AntAlert
} from 'antd';
import {
  UserOutlined, LockOutlined, SafetyOutlined,
  PhoneOutlined, MailOutlined, UploadOutlined,
  EyeInvisibleOutlined, EyeTwoTone, DeleteOutlined,
  ExclamationCircleOutlined, LogoutOutlined,
  EnvironmentOutlined, GlobalOutlined
} from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import appStore from '@/store';
import { userApi } from '@/services/api';
import { formatTime, getRiskLevelColor, maskPhone } from '@/utils/format';
import { LoginLog } from '@/types';

const Settings: React.FC = observer(() => {
  const [profileForm] = Form.useForm();
  const [pwdForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(1);

  useEffect(() => {
    loadData();
    if (appStore.user) {
      profileForm.setFieldsValue({
        nickname: appStore.user.nickname,
        phone: appStore.user.phone,
        email: appStore.user.email,
      });
    }
  }, [logPage]);

  const loadData = async () => {
    try {
      const [logs, trusted] = await Promise.all([
        userApi.listLoginLogs({ page: logPage, pageSize: 10 }),
        userApi.listTrustedDevices().catch(() => ({ list: [] }))
      ]);
      setLoginLogs(logs?.list || []);
      setLogTotal(logs?.total || 0);
      setDevices(Array.isArray(trusted) ? trusted : trusted?.list || []);
    } catch (e) {}
  };

  const submitProfile = async () => {
    try {
      const values = await profileForm.validateFields();
      setLoading(true);
      await userApi.updateProfile(values);
      await appStore.loadCurrentUser();
      message.success('个人信息已更新');
    } catch (e: any) {
      if (e?.errorFields) return;
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async () => {
    try {
      const values = await pwdForm.validateFields();
      setLoading(true);
      await userApi.changePassword(values);
      message.success('密码修改成功，请重新登录');
      pwdForm.resetFields();
      setTimeout(() => appStore.logout(), 800);
    } catch (e: any) {
      if (e?.errorFields) return;
    } finally {
      setLoading(false);
    }
  };

  const toggleTrustDevice = async (device: any, trust: boolean) => {
    try {
      await userApi.verifyTrustedDevice({ deviceId: device.id, isTrusted: trust });
      message.success(trust ? '已标记为信任设备' : '已取消信任');
      loadData();
    } catch (e) {}
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card
        className="!rounded-xl"
        title={<span className="font-semibold"><UserOutlined /> 账号与安全设置</span>}
      >
        <Tabs
          defaultActiveKey="profile"
          size="large"
          items={[
            {
              key: 'profile',
              label: '个人信息',
              children: (
                <div className="py-4 max-w-2xl">
                  <div className="flex items-center gap-6 mb-8 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <Avatar size={80} icon={<UserOutlined />} src={appStore.user?.avatar}>
                      </Avatar>
                    </div>
                    <div>
                      <div className="text-xl font-medium">{appStore.user?.nickname || appStore.user?.username}</div>
                      <div className="text-gray-500 mt-1">
                        @{appStore.user?.username} ·
                        <Tag color={
                          appStore.user?.role === 'owner' ? 'purple' :
                          appStore.user?.role === 'member' ? 'blue' : 'default'
                        } className="!ml-2">
                          {appStore.user?.role === 'owner' ? '主账号' :
                           appStore.user?.role === 'member' ? '家庭成员' : '访客'}
                        </Tag>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        注册时间：{appStore.user?.created_at && formatTime(appStore.user.created_at, 'YYYY-MM-DD')}
                      </div>
                    </div>
                    <div className="ml-auto">
                      <Upload
                        showUploadList={false}
                        beforeUpload={(file) => {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            userApi.updateProfile({ avatar: e.target?.result as string }).then(() => {
                              appStore.loadCurrentUser();
                              message.success('头像已更新');
                            });
                          };
                          reader.readAsDataURL(file);
                          return false;
                        }}
                      >
                        <Button icon={<UploadOutlined />}>更换头像</Button>
                      </Upload>
                    </div>
                  </div>

                  <Form form={profileForm} layout="vertical" onFinish={submitProfile}>
                    <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
                      <Input placeholder="设置昵称" />
                    </Form.Item>
                    <Form.Item
                      name="phone"
                      label="手机号"
                      rules={[{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }]}
                    >
                      <Input prefix={<PhoneOutlined />} placeholder="绑定手机号" maxLength={11} />
                    </Form.Item>
                    <Form.Item
                      name="email"
                      label="邮箱"
                      rules={[{ type: 'email', message: '邮箱格式不正确' }]}
                    >
                      <Input prefix={<MailOutlined />} placeholder="绑定邮箱" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={loading}>保存修改</Button>
                    </Form.Item>
                  </Form>
                </div>
              )
            },
            {
              key: 'password',
              label: '修改密码',
              children: (
                <div className="py-4 max-w-xl">
                  <AntAlert
                    type="info"
                    showIcon
                    message="密码安全建议"
                    description={
                      <ul className="list-disc ml-5 text-sm mt-1 space-y-0.5">
                        <li>密码长度至少 8 位</li>
                        <li>建议混合使用大小写字母、数字和特殊字符</li>
                        <li>定期更换密码，避免使用常见密码</li>
                      </ul>
                    }
                    className="!mb-6"
                  />
                  <Form form={pwdForm} layout="vertical" onFinish={submitPassword}>
                    <Form.Item name="oldPassword" label="当前密码" rules={[{ required: true }]}>
                      <Input.Password iconRender={(v) => v ? <EyeTwoTone /> : <EyeInvisibleOutlined />} placeholder="请输入当前密码" />
                    </Form.Item>
                    <Form.Item
                      name="newPassword"
                      label="新密码"
                      rules={[
                        { required: true, message: '请输入新密码' },
                        { min: 8, message: '密码至少 8 位' }
                      ]}
                    >
                      <Input.Password iconRender={(v) => v ? <EyeTwoTone /> : <EyeInvisibleOutlined />} placeholder="请输入新密码" />
                    </Form.Item>
                    <Form.Item
                      name="confirmPassword"
                      label="确认新密码"
                      dependencies={['newPassword']}
                      rules={[
                        { required: true },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                            return Promise.reject(new Error('两次密码输入不一致'));
                          }
                        })
                      ]}
                    >
                      <Input.Password iconRender={(v) => v ? <EyeTwoTone /> : <EyeInvisibleOutlined />} placeholder="再次输入新密码" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={loading} icon={<LockOutlined />}>
                        确认修改密码
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
              )
            },
            {
              key: 'security',
              label: '登录与安全',
              children: (
                <div className="py-4 space-y-6">
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="flex items-start gap-3">
                      <SafetyOutlined className="text-2xl text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-orange-800">安全防护概览</div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                          <div className="bg-white p-3 rounded">
                            <div className="text-xs text-gray-500">国密传输加密</div>
                            <div className="font-medium text-green-600 mt-1">✓ SM4 已启用</div>
                          </div>
                          <div className="bg-white p-3 rounded">
                            <div className="text-xs text-gray-500">设备IMEI绑定</div>
                            <div className="font-medium text-green-600 mt-1">✓ 已启用校验</div>
                          </div>
                          <div className="bg-white p-3 rounded">
                            <div className="text-xs text-gray-500">异常登录风控</div>
                            <div className="font-medium text-green-600 mt-1">✓ 5次/小时锁定</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="font-medium mb-3 flex items-center gap-2">
                      <GlobalOutlined /> 登录设备管理
                      {devices.length > 0 && <Badge count={devices.length} />}
                    </div>
                    {devices.length === 0 ? (
                      <Empty description="暂无设备记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    ) : (
                      <div className="space-y-2">
                        {devices.map((d) => (
                          <div key={d.id} className="p-3 border rounded-lg flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{d.device_model || '未知设备'}</span>
                                {d.is_trusted ? <Tag color="green">受信任</Tag> : <Tag color="orange">未信任</Tag>}
                              </div>
                              {d.imei && <div className="text-xs text-gray-500 mt-0.5 font-mono">IMEI: {maskPhone(d.imei)}</div>}
                              {d.last_login_at && <div className="text-xs text-gray-500 mt-0.5">最后登录: {formatTime(d.last_login_at)}</div>}
                            </div>
                            <Button
                              size="small"
                              type={d.is_trusted ? 'default' : 'primary'}
                              onClick={() => toggleTrustDevice(d, !d.is_trusted)}
                            >
                              {d.is_trusted ? '取消信任' : '信任此设备'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="font-medium mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2"><LogoutOutlined /> 近期登录记录</span>
                      <span className="text-xs text-gray-400">共 {logTotal} 条</span>
                    </div>
                    <Table
                      rowKey="id"
                      size="small"
                      columns={[
                        {
                          title: '账号',
                          dataIndex: 'username',
                          width: 120,
                          render: (v) => <code className="text-sm">{v}</code>
                        },
                        {
                          title: 'IP / 位置',
                          key: 'ip',
                          render: (_, r: LoginLog) => (
                            <div>
                              <div className="font-mono text-xs">{r.ip}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <EnvironmentOutlined /> {r.location || '未知'}
                              </div>
                            </div>
                          )
                        },
                        {
                          title: '状态',
                          key: 'status',
                          width: 100,
                          render: (_, r: LoginLog) => (
                            <Tag color={r.status === 1 ? 'success' : 'red'} icon={r.status === 1 ? null : <ExclamationCircleOutlined />}>
                              {r.status === 1 ? '成功' : '失败'}
                            </Tag>
                          )
                        },
                        {
                          title: '风险',
                          dataIndex: 'risk_level',
                          key: 'risk',
                          width: 100,
                          render: (v: string) => <Tag color={getRiskLevelColor(v)}>{v === 'low' ? '低' : v === 'medium' ? '中' : '高'}</Tag>
                        },
                        {
                          title: '失败原因',
                          dataIndex: 'fail_reason',
                          key: 'reason',
                          render: (v: string) => v || '-'
                        },
                        {
                          title: '时间',
                          dataIndex: 'created_at',
                          key: 'time',
                          width: 160,
                          render: (v: string) => formatTime(v, 'MM-DD HH:mm:ss')
                        },
                      ]}
                      dataSource={loginLogs}
                      pagination={{
                        current: logPage,
                        pageSize: 10,
                        total: logTotal,
                        onChange: (p) => setLogPage(p),
                        size: 'small'
                      }}
                    />
                  </div>
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
});

export default Settings;
