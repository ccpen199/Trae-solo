import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Avatar, Button, List, Tag, Modal, Form, Input, message, Row, Col, Statistic, Divider, Space } from 'antd';
import { UserOutlined, EditOutlined, IdcardOutlined, FileTextOutlined, TeamOutlined, SafetyOutlined, SwapOutlined, AlertOutlined, ToolOutlined, DashboardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/user';
import api from '../utils/api';

function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useUserStore();
  const [profile, setProfile] = useState(null);
  const [editVisible, setEditVisible] = useState(false);
  const [certCount, setCertCount] = useState(0);
  const [appCount, setAppCount] = useState(0);
  const [form] = Form.useForm();

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const loadProfile = async () => {
    try { setProfile(await api.get('/auth/profile')); } catch (e) {}
  };

  const loadStats = async () => {
    try { const c = await api.get('/certificates'); setCertCount(c.length); } catch (e) {}
    try { const a = await api.get('/applications'); setAppCount(a.length); } catch (e) {}
  };

  const handleUpdate = async (values) => {
    message.success('更新成功');
    setEditVisible(false);
    loadProfile();
  };

  const personalActions = [
    { title: '我的证照', icon: <IdcardOutlined />, path: '/certificates' },
    { title: '我的办件', icon: <FileTextOutlined />, path: '/applications' },
    { title: '服务大厅', icon: <FileTextOutlined />, path: '/services' },
    { title: '修改密码', icon: <EditOutlined />, action: () => Modal.info({ title: '修改密码功能开发中' }) },
  ];

  const legalActions = [
    { title: '企业证照', icon: <IdcardOutlined />, path: '/certificates' },
    { title: '法人办件', icon: <FileTextOutlined />, path: '/applications' },
    { title: '授权管理', icon: <TeamOutlined />, action: () => Modal.info({ title: '法人授权链管理' }) },
    { title: '法人办事', icon: <FileTextOutlined />, path: '/services' },
  ];

  const adminActions = [
    { title: '管理看板', icon: <DashboardOutlined />, path: '/admin' },
    { title: '事项配置中心', icon: <ToolOutlined />, path: '/admin/services' },
    { title: '跨部门网关', icon: <SwapOutlined />, path: '/admin/gateway' },
    { title: '办件质量审计', icon: <AlertOutlined />, path: '/admin/audit' },
  ];

  const getActions = () => {
    if (user?.type === 'admin') return adminActions;
    if (user?.type === 'legal') return legalActions;
    return personalActions;
  };

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
          <Avatar size={80} style={{
            backgroundColor: user?.type === 'admin' ? '#ff4d4f' : user?.type === 'legal' ? '#fa8c16' : '#1890ff'
          }} icon={<UserOutlined />} />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>{profile?.name || user?.name}</h2>
            <div style={{ marginTop: 8 }}>
              <Tag color={user?.type === 'admin' ? 'red' : user?.type === 'legal' ? 'orange' : 'blue'}>
                {user?.type === 'admin' ? '管理员' : user?.type === 'legal' ? '法人用户' : '个人用户'}
              </Tag>
              <span style={{ marginLeft: 8, color: '#666' }}>用户名：{profile?.username || user?.username}</span>
            </div>
          </div>
          <Button icon={<EditOutlined />} onClick={() => { form.setFieldsValue(profile); setEditVisible(true); }}>
            编辑资料
          </Button>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={8}>
            <Card size="small">
              <Statistic title="电子证照" value={certCount} suffix="张" valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
          <Col xs={8}>
            <Card size="small">
              <Statistic title="办件记录" value={appCount} suffix="件" valueStyle={{ color: '#fa8c16' }} />
            </Card>
          </Col>
          <Col xs={8}>
            <Card size="small">
              <Statistic title="账户状态" value="正常" valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
        </Row>

        <Descriptions column={2} bordered>
          <Descriptions.Item label="真实姓名">{profile?.name || user?.name}</Descriptions.Item>
          <Descriptions.Item label="身份证号">{profile?.id_card || '未填写'}</Descriptions.Item>
          <Descriptions.Item label="手机号">{profile?.phone || user?.phone}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{profile?.email || '未设置'}</Descriptions.Item>
          <Descriptions.Item label="联系地址">{profile?.address || '未设置'}</Descriptions.Item>
          <Descriptions.Item label="注册时间">{profile?.created_at || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={user?.type === 'admin' ? '管理后台快捷入口' : user?.type === 'legal' ? '法人服务' : '个人服务'}
        style={{ marginTop: 16 }}
      >
        <Row gutter={[16, 16]}>
          {getActions().map((item, idx) => (
            <Col xs={12} sm={6} key={idx}>
              <Button
                block
                style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={item.action || (() => navigate(item.path))}
              >
                {item.icon}
                <span>{item.title}</span>
              </Button>
            </Col>
          ))}
        </Row>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <SafetyOutlined style={{ color: '#1890ff' }} />
              <span>安全设置</span>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button onClick={() => Modal.info({ title: '修改密码功能开发中' })}>修改密码</Button>
              <Button danger onClick={() => { logout(); navigate('/login'); }}>退出登录</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Modal title="编辑资料" open={editVisible} onCancel={() => setEditVisible(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item name="phone" label="手机号"><Input /></Form.Item>
          <Form.Item name="email" label="邮箱"><Input /></Form.Item>
          <Form.Item name="address" label="联系地址"><Input /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">保存</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Profile;
