import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, Row, Col, Button, Space, Avatar, Form, Input,
  App, Modal, Tabs, Statistic, Tag, List, Empty, Progress,
  Descriptions, Table, Tooltip, Divider, Alert,
} from 'antd';
import {
  UserOutlined, EditOutlined, LockOutlined, MailOutlined,
  PhoneOutlined, SettingOutlined, SafetyOutlined,
  HistoryOutlined, BellOutlined, LogoutOutlined,
  ThunderboltOutlined, HomeOutlined, EyeOutlined,
  ControlOutlined, ShareAltOutlined, CrownOutlined,
  TeamOutlined, SafetyCertificateOutlined, ApiOutlined,
  CheckCircleOutlined, CloseCircleOutlined, WarningOutlined,
  InfoCircleOutlined, DashboardOutlined, BulbOutlined,
  CloudUploadOutlined, BarChartOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store';
import { SharePermission } from '@iot/shared';

type UserRoleType = 'user' | 'admin' | 'super_admin';

const ROLE_META: Record<UserRoleType, { label: string; color: string; icon: React.ReactNode; desc: string }> = {
  user: { label: '普通用户', color: 'blue', icon: <TeamOutlined />, desc: '面向终端家庭用户，管理个人设备、场景、分享、语音控制' },
  admin: { label: '厂商接入方', color: 'geekblue', icon: <SafetyCertificateOutlined />, desc: '面向硬件厂商，管理厂商白名单、API Key、固件发布、接入数据看板' },
  super_admin: { label: '平台超级管理员', color: 'magenta', icon: <CrownOutlined />, desc: '面向平台运营方，全局设备、用户、厂商、告警、数据分析管理' },
};

const MODULE_PERMISSIONS: { key: string; label: string; icon: React.ReactNode; user: boolean; admin: boolean; super: boolean; desc: string }[] = [
  { key: 'dashboard', label: '工作台', icon: <DashboardOutlined />, user: true, admin: true, super: true, desc: '总览设备、场景、告警、能耗统计' },
  { key: 'devices', label: '设备管理', icon: <BulbOutlined />, user: true, admin: true, super: true, desc: '多品牌设备统一管控、抽象属性、状态监控' },
  { key: 'scenes', label: '智能场景', icon: <ThunderboltOutlined />, user: true, admin: true, super: true, desc: 'IF-THEN 规则编排、时间/传感器触发' },
  { key: 'voice', label: '语音控制', icon: <SafetyOutlined />, user: true, admin: true, super: true, desc: '天猫精灵/小爱同学 ASR/NLU 语义解析' },
  { key: 'alerts', label: '告警中心', icon: <BellOutlined />, user: true, admin: true, super: true, desc: '设备离线、异常功耗、低电量告警' },
  { key: 'ota', label: '固件升级', icon: <CloudUploadOutlined />, user: true, admin: true, super: true, desc: '固件版本管理、OTA 批量升级' },
  { key: 'share', label: '设备分享', icon: <ShareAltOutlined />, user: true, admin: true, super: true, desc: '细粒度分享权限：仅查看/可操作/可分享' },
  { key: 'analytics', label: '数据分析', icon: <BarChartOutlined />, user: true, admin: true, super: true, desc: '在线率、能耗、使用习惯多维分析' },
  { key: 'learning', label: 'AI 学习', icon: <InfoCircleOutlined />, user: true, admin: true, super: true, desc: '用户习惯学习、智能场景优化建议' },
  { key: 'homes', label: '家庭管理', icon: <HomeOutlined />, user: true, admin: true, super: true, desc: '家庭空间、房间、成员管理' },
  { key: 'admin_vendors', label: '厂商白名单管理', icon: <ApiOutlined />, user: false, admin: true, super: true, desc: '厂商接入审核、API Key 颁发、IP 白名单' },
  { key: 'admin_dashboard', label: '平台运营仪表盘', icon: <CrownOutlined />, user: false, admin: false, super: true, desc: '全平台数据总览、2000+厂商接入管控' },
];

const SHARE_PERMISSION_META: Record<string, { label: string; color: string; icon: React.ReactNode; desc: string }> = {
  [SharePermission.VIEW_ONLY]: {
    label: '仅查看', color: 'default', icon: <EyeOutlined />,
    desc: '只能查看设备状态、历史数据，不能执行任何操作',
  },
  [SharePermission.CONTROLLABLE]: {
    label: '可操作', color: 'blue', icon: <ControlOutlined />,
    desc: '可远程控制设备（开关、亮度、温度等），但不能再次分享或修改配置',
  },
  [SharePermission.FULL_SHARE]: {
    label: '可分享', color: 'green', icon: <ShareAltOutlined />,
    desc: '拥有完整操作权限，并可将设备继续分享给其他用户',
  },
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const [editModal, setEditModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [editForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const role = ((profile?.role || user?.role) as UserRoleType) || 'user';
  const roleMeta = ROLE_META[role];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res: any = await authAPI.getProfile().catch(() => user);
      setProfile(res || user);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (values: any) => {
    try {
      setProfile({ ...profile, ...values });
      setUser(values);
      message.success('资料已更新');
      setEditModal(false);
    } catch (err: any) {
      message.error(err.message || '更新失败');
    }
  };

  const handleChangePassword = async (values: any) => {
    try {
      await authAPI.changePassword(values);
      message.success('密码已修改，请重新登录');
      setPasswordModal(false);
      passwordForm.resetFields();
      handleLogout();
    } catch (err: any) {
      message.error(err.message || '修改失败');
    }
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authAPI.logout({ refreshToken }).catch(() => {});
      }
      logout();
      navigate('/login');
    } catch {
      logout();
      navigate('/login');
    }
  };

  const confirmLogout = () => {
    modal.confirm({
      title: '确认退出登录？',
      content: `当前身份：${roleMeta.label}（${profile?.username || user?.username}）`,
      okText: '退出',
      okButtonProps: { danger: true },
      onOk: handleLogout,
    });
  };

  const activityLogs = useMemo(() => [
    { action: '登录成功', ip: '192.168.1.100', time: new Date(Date.now() - 1000 * 60 * 30).toLocaleString(), type: 'success' },
    { action: '远程控制', device: '客厅主灯 → 亮度 80%', time: new Date(Date.now() - 1000 * 60 * 58).toLocaleString(), type: 'info' },
    { action: '修改设备名称', device: '客厅主灯 → 客厅吸顶灯', time: new Date(Date.now() - 1000 * 60 * 60 * 2).toLocaleString(), type: 'info' },
    { action: '执行场景', scene: '回家模式 → 7 个设备动作', time: new Date(Date.now() - 1000 * 60 * 60 * 5).toLocaleString(), type: 'success' },
    { action: '分享设备', device: '卧室空调', to: 'family@example.com', permission: '可操作', time: new Date(Date.now() - 1000 * 60 * 60 * 24).toLocaleString(), type: 'warning' },
    { action: '创建场景', scene: '影院模式', time: new Date(Date.now() - 1000 * 60 * 60 * 30).toLocaleString(), type: 'info' },
    { action: 'OTA升级', device: '智能门锁 → v1.2.3', time: new Date(Date.now() - 1000 * 60 * 60 * 48).toLocaleString(), type: 'success' },
    { action: '语音指令', content: '"打开客厅空调"', result: '成功执行', time: new Date(Date.now() - 1000 * 60 * 60 * 52).toLocaleString(), type: 'success' },
  ], []);

  const stats = useMemo(() => ([
    { label: '我的设备', value: 15, icon: <BulbOutlined style={{ color: '#1677ff', fontSize: 20 }} />, color: '#1677ff', tip: '接入了 8 家厂商的设备' },
    { label: '智能场景', value: 7, icon: <ThunderboltOutlined style={{ color: '#52c41a', fontSize: 20 }} />, color: '#52c41a', tip: '其中 3 个为定时自动触发' },
    { label: '已分享设备', value: 3, icon: <ShareAltOutlined style={{ color: '#722ed1', fontSize: 20 }} />, color: '#722ed1', tip: '2 个可操作 + 1 个仅查看' },
    { label: '家庭空间', value: 2, icon: <HomeOutlined style={{ color: '#faad14', fontSize: 20 }} />, color: '#faad14', tip: '我的家 + 父母家' },
  ]), []);

  const myShareRecords = [
    { device: '主卧空调', sharedTo: '家人（老婆）', permission: SharePermission.CONTROLLABLE, sharedAt: '2026-06-10 14:30', status: '生效中' },
    { device: '客厅电视', sharedTo: '家人（老爸）', permission: SharePermission.CONTROLLABLE, sharedAt: '2026-06-08 09:15', status: '生效中' },
    { device: '温湿度传感器', sharedTo: '同事（小明）', permission: SharePermission.VIEW_ONLY, sharedAt: '2026-06-01 18:45', status: '生效中' },
    { device: '扫地机器人', sharedTo: '钟点工阿姨', permission: SharePermission.CONTROLLABLE, sharedAt: '2026-05-15 10:00', status: '已取消' },
  ];

  const permissionColumns = [
    { title: '分享设备', dataIndex: 'device', key: 'device', width: 140 },
    { title: '分享给', dataIndex: 'sharedTo', key: 'sharedTo', width: 140 },
    {
      title: '权限等级',
      dataIndex: 'permission',
      key: 'permission',
      width: 130,
      render: (p: string) => {
        const m = SHARE_PERMISSION_META[p];
        return m ? <Tag color={m.color} icon={m.icon}>{m.label}</Tag> : p;
      },
    },
    {
      title: '权限说明',
      dataIndex: 'permission',
      key: 'desc',
      render: (p: string) => SHARE_PERMISSION_META[p]?.desc || '-',
    },
    { title: '分享时间', dataIndex: 'sharedAt', key: 'sharedAt', width: 160 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => s === '生效中'
        ? <Tag color="green" icon={<CheckCircleOutlined />}>{s}</Tag>
        : <Tag color="default" icon={<CloseCircleOutlined />}>{s}</Tag>,
    },
  ];

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto' }}>
      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message={
          <Space>
            <Tag color={roleMeta.color} icon={roleMeta.icon} style={{ margin: 0 }}>
              当前身份：{roleMeta.label}
            </Tag>
            <span style={{ fontSize: 13, color: '#555' }}>{roleMeta.desc}</span>
          </Space>
        }
        style={{ marginBottom: 16, borderRadius: 10 }}
      />

      <Card loading={loading} style={{ borderRadius: 12 }} bodyStyle={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <Avatar
            size={96}
            icon={<UserOutlined style={{ fontSize: 40 }} />}
            src={profile?.avatar || user?.avatar}
            style={{
              flexShrink: 0,
              border: `4px solid ${role === 'super_admin' ? '#eb2f96' : role === 'admin' ? '#1677ff' : '#52c41a'}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          />
          <div style={{ flex: 1, minWidth: 280 }}>
            <Space align="center" style={{ marginBottom: 8 }} wrap>
              <span style={{ fontSize: 26, fontWeight: 700, color: '#111' }}>
                {profile?.username || user?.username}
              </span>
              <Tag color={roleMeta.color} icon={roleMeta.icon} style={{ fontSize: 13, padding: '2px 12px', height: 24, lineHeight: '22px' }}>
                {roleMeta.label}
              </Tag>
              <Tag color="green" icon={<CheckCircleOutlined />} style={{ fontSize: 12 }}>
                账户已认证
              </Tag>
              <Tag color="purple" style={{ fontSize: 12 }}>
                跨品牌设备 {role === 'super_admin' ? '全局' : role === 'admin' ? '厂商' : '个人'} 管控
              </Tag>
            </Space>
            <div style={{ color: '#555', fontSize: 14, marginBottom: 12, lineHeight: 1.8 }}>
              <Space size={16} wrap>
                <span><MailOutlined style={{ color: '#888', marginRight: 4 }} />{profile?.email || user?.email}</span>
                <span><PhoneOutlined style={{ color: '#888', marginRight: 4 }} />{profile?.phone || user?.phone}</span>
              </Space>
            </div>
            <Space wrap>
              <Button type="primary" icon={<EditOutlined />} onClick={() => { editForm.setFieldsValue(profile || user); setEditModal(true); }}>
                编辑资料
              </Button>
              <Button icon={<LockOutlined />} onClick={() => setPasswordModal(true)}>修改密码</Button>
              <Button icon={<BellOutlined />}>通知偏好</Button>
              <Button icon={<SafetyOutlined />}>安全中心</Button>
              <Button danger icon={<LogoutOutlined />} onClick={confirmLogout}>退出登录</Button>
            </Space>
          </div>
        </div>

        <Divider style={{ margin: '24px 0' }} />

        <Row gutter={[16, 16]}>
          {stats.map((stat, i) => (
            <Col key={i} xs={12} sm={12} md={6}>
              <Tooltip title={stat.tip}>
                <Card size="small" style={{
                  borderRadius: 10,
                  border: `1px solid ${stat.color}22`,
                  background: `linear-gradient(135deg, ${stat.color}08, transparent)`,
                  cursor: 'pointer',
                }}>
                  <Statistic
                    title={<span style={{ color: '#555', fontSize: 13, fontWeight: 500 }}>{stat.label}</span>}
                    value={stat.value}
                    prefix={stat.icon}
                    valueStyle={{ color: stat.color, fontSize: 28, fontWeight: 700 }}
                  />
                </Card>
              </Tooltip>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        style={{ marginTop: 16, borderRadius: 12 }}
        bodyStyle={{ padding: '8px 24px 24px' }}
      >
        <Tabs
          size="large"
          style={{ marginTop: 4 }}
          items={[
            {
              key: 'info',
              label: '基本信息',
              children: (
                <div>
                  <Descriptions column={2} bordered size="middle" style={{ marginBottom: 16 }}>
                    <Descriptions.Item label="用户名" labelStyle={{ width: 120, background: '#fafafa' }}>
                      {profile?.username || user?.username || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="账户ID" labelStyle={{ background: '#fafafa' }}>
                      <span style={{ fontFamily: 'monospace', color: '#666', fontSize: 12 }}>
                        {profile?.id || user?.id || '-'}
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="邮箱" labelStyle={{ background: '#fafafa' }}>
                      {profile?.email || user?.email || '-'}{profile?.email ? <Tag color="green" style={{ marginLeft: 8 }} icon={<CheckCircleOutlined />}>已验证</Tag> : null}
                    </Descriptions.Item>
                    <Descriptions.Item label="手机号" labelStyle={{ background: '#fafafa' }}>
                      {profile?.phone || user?.phone || '-'}{profile?.phone ? <Tag color="green" style={{ marginLeft: 8 }} icon={<CheckCircleOutlined />}>已验证</Tag> : null}
                    </Descriptions.Item>
                    <Descriptions.Item label="注册时间" labelStyle={{ background: '#fafafa' }}>
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : '2026-01-15 10:30:22'}
                    </Descriptions.Item>
                    <Descriptions.Item label="最后登录" labelStyle={{ background: '#fafafa' }}>
                      刚刚（IP: 192.168.1.100，北京）
                    </Descriptions.Item>
                    <Descriptions.Item label="账户状态" labelStyle={{ background: '#fafafa' }}>
                      <Tag color="green" icon={<CheckCircleOutlined />}>正常活跃</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="接入方式" labelStyle={{ background: '#fafafa' }}>
                      <Space>
                        <Tag color="cyan">MQTT</Tag>
                        <Tag color="purple">HTTP API</Tag>
                        <Tag color="geekblue">厂商白名单</Tag>
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              ),
            },
            {
              key: 'permissions',
              label: '权限边界',
              children: (
                <div>
                  <Alert
                    type={role === 'super_admin' ? 'success' : role === 'admin' ? 'info' : 'warning'}
                    showIcon
                    icon={roleMeta.icon}
                    message={<b>当前角色：{roleMeta.label}</b>}
                    description={<span style={{ color: '#555' }}>{roleMeta.desc}。下表显示该角色在各业务模块的可用权限边界：</span>}
                    style={{ marginBottom: 20, borderRadius: 10 }}
                  />
                  <Row gutter={[12, 12]}>
                    {MODULE_PERMISSIONS.map((m) => {
                      const allowed = role === 'super_admin' ? m.super : role === 'admin' ? m.admin : m.user;
                      return (
                        <Col key={m.key} xs={24} sm={12} md={8}>
                          <div
                            style={{
                              padding: '14px 16px',
                              borderRadius: 10,
                              border: `1px solid ${allowed ? '#d9d9d9' : '#f0f0f0'}`,
                              background: allowed ? '#fff' : '#fafafa',
                              opacity: allowed ? 1 : 0.5,
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 12,
                              minHeight: 88,
                            }}
                          >
                            <div style={{
                              fontSize: 22,
                              color: allowed ? '#1677ff' : '#ccc',
                              marginTop: 2,
                              flexShrink: 0,
                            }}>
                              {m.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: allowed ? '#222' : '#999' }}>
                                  {m.label}
                                </span>
                                {allowed
                                  ? <Tag color="green" icon={<CheckCircleOutlined />} style={{ fontSize: 11, padding: '0 6px', margin: 0 }}>可用</Tag>
                                  : <Tag color="default" icon={<CloseCircleOutlined />} style={{ fontSize: 11, padding: '0 6px', margin: 0 }}>无权限</Tag>
                                }
                              </div>
                              <div style={{ fontSize: 11, color: allowed ? '#888' : '#bbb', lineHeight: 1.5 }}>
                                {m.desc}
                              </div>
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>

                  <Divider orientation="left" style={{ margin: '28px 0 16px' }}>
                    设备分享的细粒度权限说明
                  </Divider>
                  <Row gutter={[12, 12]}>
                    {Object.entries(SHARE_PERMISSION_META).map(([key, m]) => (
                      <Col key={key} xs={24} sm={8}>
                        <Card
                          size="small"
                          style={{
                            borderRadius: 10,
                            borderColor: m.color === 'default' ? '#d9d9d9' : m.color + '55',
                            background: `linear-gradient(135deg, ${m.color === 'default' ? '#f5f5f5' : m.color + '08'} 0%, #fff 60%)`,
                          }}
                        >
                          <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <Tag color={m.color} icon={m.icon} style={{ fontSize: 14, padding: '2px 14px', margin: 0, alignSelf: 'flex-start' }}>
                              {m.label}（{key}）
                            </Tag>
                            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.7 }}>{m.desc}</div>
                            <div style={{ fontSize: 11, color: '#999' }}>
                              操作权限：{key === SharePermission.VIEW_ONLY ? '❌ 无操作' : key === SharePermission.CONTROLLABLE ? '✅ 可操作 / ❌ 不可再分享' : '✅ 可操作 / ✅ 可再分享'}
                            </div>
                          </Space>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              ),
            },
            {
              key: 'share-records',
              label: '分享记录',
              children: (
                <div>
                  <Alert
                    type="info"
                    showIcon
                    message="设备分享的细粒度业务状态总览"
                    description="可在「设备管理 → 设备详情 → 分享」中随时新增/取消设备分享权限"
                    style={{ marginBottom: 16, borderRadius: 10 }}
                  />
                  <Table
                    dataSource={myShareRecords}
                    columns={permissionColumns}
                    pagination={false}
                    size="middle"
                    rowKey="device"
                    style={{ borderRadius: 10 }}
                  />
                </div>
              ),
            },
            {
              key: 'activity',
              label: '操作轨迹',
              children: activityLogs.length ? (
                <List
                  dataSource={activityLogs}
                  renderItem={(item: any) => (
                    <List.Item style={{ padding: '14px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            size="small"
                            style={{
                              background: item.type === 'success' ? '#52c41a' : item.type === 'warning' ? '#faad14' : '#1677ff',
                            }}
                            icon={item.type === 'success' ? <CheckCircleOutlined /> : item.type === 'warning' ? <WarningOutlined /> : <HistoryOutlined />}
                          />
                        }
                        title={<span style={{ fontSize: 14, fontWeight: 500 }}>{item.action}</span>}
                        description={
                          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8, marginTop: 4 }}>
                            {item.device || item.scene || item.content || ''}
                            {item.to ? ` · 接收方: ${item.to}` : ''}
                            {item.permission ? ` · 权限: ${SHARE_PERMISSION_META[item.permission]?.label || item.permission}` : ''}
                            {item.result ? ` · 结果: ${item.result}` : ''}
                            {item.ip ? ` · IP: ${item.ip}` : ''}
                          </div>
                        }
                      />
                      <span style={{ color: '#999', fontSize: 12, whiteSpace: 'nowrap' }}>{item.time}</span>
                    </List.Item>
                  )}
                />
              ) : <Empty description="暂无活动记录" />,
            },
            {
              key: 'security',
              label: '安全中心',
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Card size="small" style={{ borderRadius: 10 }}>
                      <Space direction="vertical" style={{ width: '100%' }} size={8}>
                        <Space><LockOutlined style={{ color: '#52c41a' }} /><b>登录密码</b></Space>
                        <Progress percent={100} showInfo={false} strokeColor="#52c41a" size="small" />
                        <div style={{ fontSize: 12, color: '#888' }}>
                          上次修改：45 天前 · 强度：高
                        </div>
                        <Button size="small" icon={<EditOutlined />} onClick={() => setPasswordModal(true)}>修改密码</Button>
                      </Space>
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small" style={{ borderRadius: 10 }}>
                      <Space direction="vertical" style={{ width: '100%' }} size={8}>
                        <Space><SafetyCertificateOutlined style={{ color: '#1677ff' }} /><b>邮箱验证</b></Space>
                        <Progress percent={100} showInfo={false} strokeColor="#52c41a" size="small" />
                        <div style={{ fontSize: 12, color: '#888' }}>
                          {profile?.email || user?.email} · 已绑定
                        </div>
                        <Button size="small" icon={<EditOutlined />}>更换邮箱</Button>
                      </Space>
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small" style={{ borderRadius: 10 }}>
                      <Space direction="vertical" style={{ width: '100%' }} size={8}>
                        <Space><UserOutlined style={{ color: '#faad14' }} /><b>手机验证</b></Space>
                        <Progress percent={100} showInfo={false} strokeColor="#52c41a" size="small" />
                        <div style={{ fontSize: 12, color: '#888' }}>
                          {profile?.phone || user?.phone} · 已绑定
                        </div>
                        <Button size="small" icon={<EditOutlined />}>更换手机</Button>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              ),
            },
          ]}
        />
      </Card>

      <Modal title="编辑资料" open={editModal} onCancel={() => setEditModal(false)} footer={null} destroyOnClose>
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">保存修改</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="修改密码" open={passwordModal} onCancel={() => setPasswordModal(false)} footer={null} destroyOnClose>
        <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item name="oldPassword" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请输入当前登录密码" />
          </Form.Item>
          <Form.Item name="newPassword" label="新密码" rules={[{ required: true, min: 8, message: '密码至少8位' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="至少8位，建议字母数字组合" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">确认修改密码</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
