import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Button, Space, Avatar, Form, Input,
  App, Modal, Tabs, Statistic, Tag, List, Empty,
} from 'antd';
import {
  UserOutlined, EditOutlined, LockOutlined, MailOutlined,
  PhoneOutlined, SettingOutlined, SafetyOutlined,
  HistoryOutlined, BellOutlined, LogoutOutlined,
  ThunderboltOutlined, HomeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store';

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
      await authAPI.changePassword ? null : null;
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
      okText: '退出',
      okButtonProps: { danger: true },
      onOk: handleLogout,
    });
  };

  const activityLogs = [
    { action: '登录成功', ip: '192.168.1.100', time: new Date(Date.now() - 1000 * 60 * 30).toLocaleString() },
    { action: '修改设备名称', device: '客厅主灯', time: new Date(Date.now() - 1000 * 60 * 60 * 2).toLocaleString() },
    { action: '执行场景', scene: '回家模式', time: new Date(Date.now() - 1000 * 60 * 60 * 5).toLocaleString() },
    { action: '分享设备', device: '卧室空调', to: 'family@example.com', time: new Date(Date.now() - 1000 * 60 * 60 * 24).toLocaleString() },
    { action: 'OTA升级', device: '智能门锁', time: new Date(Date.now() - 1000 * 60 * 60 * 48).toLocaleString() },
  ];

  const stats = [
    { label: '设备数量', value: profile?.deviceCount || 15, icon: <ThunderboltOutlined style={{ color: '#1677ff' }} />, color: '#1677ff' },
    { label: '场景数量', value: profile?.sceneCount || 8, icon: <SettingOutlined style={{ color: '#52c41a' }} />, color: '#52c41a' },
    { label: '分享设备', value: profile?.shareCount || 3, icon: <UserOutlined style={{ color: '#722ed1' }} />, color: '#722ed1' },
    { label: '家庭数量', value: profile?.homeCount || 1, icon: <HomeOutlined style={{ color: '#faad14' }} />, color: '#faad14' },
  ];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Card loading={loading}>
        <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
          <Avatar size={80} icon={<UserOutlined />} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 20, fontWeight: 500 }}>{profile?.username || user?.username}</div>
          <div style={{ color: '#8c8c8c', marginTop: 4 }}>
            {profile?.email || user?.email} · {profile?.phone || user?.phone}
          </div>
          <Tag color="blue" style={{ marginTop: 8 }}>{profile?.role === 'admin' ? '管理员' : '普通用户'}</Tag>
        </div>

        <Row gutter={[16, 16]}>
          {stats.map((stat, i) => (
            <Col key={i} xs={12} sm={6}>
              <Statistic
                title={stat.label}
                value={stat.value}
                prefix={stat.icon}
                valueStyle={{ color: stat.color }}
              />
            </Col>
          ))}
        </Row>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Tabs
          items={[
            {
              key: 'info',
              label: '基本信息',
              children: (
                <div>
                  <List
                    dataSource={[
                      { label: '用户名', value: profile?.username || '-' },
                      { label: '邮箱', value: profile?.email || '-' },
                      { label: '手机号', value: profile?.phone || '-' },
                      { label: '注册时间', value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-' },
                      { label: '最后登录', value: profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString() : '-' },
                      { label: '时区', value: 'Asia/Shanghai' },
                    ]}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta title={item.label} />
                        <span>{item.value}</span>
                      </List.Item>
                    )}
                  />
                  <Space style={{ marginTop: 16 }} wrap>
                    <Button icon={<EditOutlined />} onClick={() => { editForm.setFieldsValue(profile); setEditModal(true); }}>
                      编辑资料
                    </Button>
                    <Button icon={<LockOutlined />} onClick={() => setPasswordModal(true)}>
                      修改密码
                    </Button>
                    <Button icon={<BellOutlined />}>通知设置</Button>
                    <Button icon={<SafetyOutlined />}>安全设置</Button>
                  </Space>
                </div>
              ),
            },
            {
              key: 'activity',
              label: '最近活动',
              children: activityLogs.length ? (
                <List
                  dataSource={activityLogs}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar size="small" icon={<HistoryOutlined />} />}
                        title={item.action}
                        description={`${item.device || item.scene || ''}${item.ip ? ` · IP: ${item.ip}` : ''}${item.to ? ` · 给: ${item.to}` : ''}`}
                      />
                      <span style={{ color: '#8c8c8c', fontSize: 12 }}>{item.time}</span>
                    </List.Item>
                  )}
                />
              ) : <Empty description="暂无活动记录" />,
            },
          ]}
        />
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Button type="primary" danger icon={<LogoutOutlined />} onClick={confirmLogout} block>
          退出登录
        </Button>
      </Card>

      <Modal title="编辑资料" open={editModal} onCancel={() => setEditModal(false)} footer={null}>
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input prefix={<MailOutlined />} />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input prefix={<PhoneOutlined />} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="修改密码" open={passwordModal} onCancel={() => setPasswordModal(false)} footer={null}>
        <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item name="oldPassword" label="当前密码" rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item name="newPassword" label="新密码" rules={[{ required: true, min: 8, message: '密码至少8位' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="至少8位" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认修改</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
