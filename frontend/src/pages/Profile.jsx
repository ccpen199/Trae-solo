import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Input, Button, Avatar, Tag, Divider, Descriptions, List, message, Tabs, Upload, Modal, Switch } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined, SettingOutlined, SafetyOutlined, CreditCardOutlined, HistoryOutlined, LogoutOutlined, UploadOutlined, EditOutlined, SaveOutlined, CameraOutlined } from '@ant-design/icons';
import { getProfile, updateProfile } from '../api/auth';
import { getMyPoints, getPointHistory } from '../api/points';
import { getMyCards, getTransactions } from '../api/card';
import { useNavigate } from 'react-router-dom';

const { TabPane } = Tabs;
const { TextArea } = Input;

const levelConfig = [
  { level: 1, name: '普通会员', min: 0, color: '#8c8c8c' },
  { level: 2, name: '银卡会员', min: 1000, color: '#c0c0c0' },
  { level: 3, name: '金卡会员', min: 5000, color: '#faad14' },
  { level: 4, name: '铂金会员', min: 20000, color: '#d3af37' },
  { level: 5, name: '钻石会员', min: 50000, color: '#1890ff' },
  { level: 6, name: '至尊会员', min: 100000, color: '#722ed1' },
];

const Profile = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [points, setPoints] = useState(null);
  const [cards, setCards] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!localStorage.getItem('tft_user') || !localStorage.getItem('tft_token')) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const [profileRes, pointsRes, cardsRes, transRes] = await Promise.all([
        getProfile(),
        getMyPoints(),
        getMyCards(),
        getTransactions({ page: 1, page_size: 5 }),
      ]);
      const userProfile = profileRes?.user || profileRes;
      const normalizedProfile = {
        ...userProfile,
        username: userProfile?.username || userProfile?.phone || userProfile?.real_name || ''
      };
      setProfile(normalizedProfile);
      form.setFieldsValue(normalizedProfile);
      setPoints(pointsRes || profileRes?.points || null);
      setCards(Array.isArray(cardsRes) ? cardsRes : profileRes?.cards || []);
      setRecentTransactions(Array.isArray(transRes) ? transRes : transRes?.list || []);
    } catch (error) {
      message.error('加载用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    try {
      await updateProfile(values);
      const nextProfile = { ...profile, ...values };
      message.success('个人信息更新成功');
      setProfile(nextProfile);
      localStorage.setItem('tft_user', JSON.stringify(nextProfile));
      setEditing(false);
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出登录',
      content: '退出后需要重新登录才能使用功能',
      okText: '确认退出',
      cancelText: '取消',
      onOk: () => {
        localStorage.removeItem('tft_token');
        localStorage.removeItem('tft_user');
        message.success('已退出登录');
        navigate('/login');
      },
    });
  };

  const handlePasswordChange = async (values) => {
    try {
      message.success('密码修改成功（演示）');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error('密码修改失败');
    }
  };

  const getCurrentLevel = (points) => {
    for (let i = levelConfig.length - 1; i >= 0; i--) {
      if (points >= levelConfig[i].min) return levelConfig[i];
    }
    return levelConfig[0];
  };

  const currentLevel = points ? getCurrentLevel(points.available_points) : null;

  const menuItems = [
    { icon: <CreditCardOutlined />, label: '我的卡片', onClick: () => navigate('/my-cards') },
    { icon: <HistoryOutlined />, label: '交易记录', onClick: () => navigate('/my-cards') },
    { icon: <SafetyOutlined />, label: '修改密码', onClick: () => setPasswordModalVisible(true) },
    { icon: <SettingOutlined />, label: '账号设置', onClick: () => {} },
    { icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout, danger: true },
  ];

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片不能大于 2MB!');
    }
    return isImage && isLt2M;
  };

  const handleAvatarChange = (info) => {
    if (info.file.status === 'done') {
      message.success('头像更新成功');
    }
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card style={{ borderRadius: '12px', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Avatar size={96} icon={<UserOutlined />} src={profile?.avatar} style={{ backgroundColor: '#1890ff', fontSize: '36px' }} />
                <Upload
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  onChange={handleAvatarChange}
                  style={{ position: 'absolute', bottom: 0, right: 0 }}
                >
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '28px',
                    height: '28px',
                    backgroundColor: '#1890ff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: '2px solid #fff',
                  }}>
                    <CameraOutlined style={{ color: '#fff', fontSize: '14px' }} />
                  </div>
                </Upload>
              </div>
              <h2 style={{ marginTop: '16px', marginBottom: '4px' }}>{profile?.real_name || profile?.username}</h2>
              <div style={{ color: '#8c8c8c', fontSize: '14px', marginBottom: '8px' }}>
                <PhoneOutlined /> {profile?.phone || '未绑定'}
              </div>
              {currentLevel && (
                <Tag color={currentLevel.color} style={{ fontSize: '12px', padding: '2px 12px' }}>
                  {currentLevel.name}
                </Tag>
              )}
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <List
              dataSource={menuItems}
              renderItem={item => (
                <List.Item
                  style={{ padding: '12px 0', cursor: 'pointer', borderRadius: '8px' }}
                  className={item.danger ? 'menu-item-danger' : 'menu-item'}
                  onClick={item.onClick}
                >
                  <span style={{ color: item.danger ? '#ff4d4f' : 'inherit' }}>
                    {item.icon} <span style={{ marginLeft: '12px' }}>{item.label}</span>
                  </span>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} md={18}>
          <Card style={{ borderRadius: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>个人信息</h3>
              {!editing ? (
                <Button type="primary" icon={<EditOutlined />} onClick={() => setEditing(true)}>
                  编辑
                </Button>
              ) : (
                <div>
                  <Button style={{ marginRight: '8px' }} onClick={() => { setEditing(false); form.setFieldsValue(profile); }}>
                    取消
                  </Button>
                  <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()}>
                    保存
                  </Button>
                </div>
              )}
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              disabled={!editing}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                    <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="real_name" label="真实姓名">
                    <Input placeholder="请输入真实姓名" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
                    <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="email" label="邮箱">
                    <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="id_card" label="身份证号">
                    <Input placeholder="请输入身份证号" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="region" label="所属区域">
                    <Input prefix={<EnvironmentOutlined />} placeholder="请选择区域" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item name="address" label="详细地址">
                    <TextArea rows={2} placeholder="请输入详细地址" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          <Tabs defaultActiveKey="overview">
            <TabPane tab="账户概览" key="overview">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card style={{ borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '8px' }}>可用积分</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fa8c16' }}>{points?.available_points || 0}</div>
                    <Button type="link" onClick={() => navigate('/points-mall')}>前往积分商城</Button>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card style={{ borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '8px' }}>我的卡片</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff' }}>{cards.length}</div>
                    <Button type="link" onClick={() => navigate('/my-cards')}>管理卡片</Button>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card style={{ borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '8px' }}>本月乘车</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#52c41a' }}>{points?.monthly_rides || 0}</div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>累计节省 ¥{((points?.monthly_rides || 0) * 0.5).toFixed(2)}</div>
                  </Card>
                </Col>
              </Row>
            </TabPane>

            <TabPane tab="最近交易" key="transactions">
              <Card style={{ borderRadius: '12px' }}>
                <List
                  dataSource={recentTransactions}
                  renderItem={item => (
                    <List.Item style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <List.Item.Meta
                        avatar={<Avatar style={{ backgroundColor: item.type === 'recharge' ? '#52c41a' : '#1890ff' }}>
                          {item.type === 'recharge' ? '充' : item.type === 'ride' ? '乘' : '消'}
                        </Avatar>}
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{item.type_name || item.description}</span>
                            <span style={{ 
                              color: item.amount > 0 ? '#52c41a' : '#ff4d4f',
                              fontWeight: 'bold',
                              fontSize: '16px',
                            }}>
                              {item.amount > 0 ? '+' : ''}¥{Math.abs(item.amount).toFixed(2)}
                            </span>
                          </div>
                        }
                        description={
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                              {item.payment_method && `支付方式：${item.payment_method}`}
                              {item.line_name && ` · ${item.line_name}`}
                            </span>
                            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>{item.created_at}</span>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
                {recentTransactions.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
                    暂无交易记录
                  </div>
                )}
              </Card>
            </TabPane>

            <TabPane tab="通知设置" key="settings">
              <Card style={{ borderRadius: '12px' }}>
                <List
                  dataSource={[
                    { title: '乘车提醒', description: '首末班车时间提醒', checked: true },
                    { title: '交易通知', description: '消费、充值实时通知', checked: true },
                    { title: '优惠活动', description: '地铁沿线商户优惠推送', checked: true },
                    { title: '积分提醒', description: '积分到期、等级变动通知', checked: true },
                    { title: '系统公告', description: '重要系统维护公告', checked: false },
                  ]}
                  renderItem={item => (
                    <List.Item
                      style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}
                      actions={[<Switch defaultChecked={item.checked} />]}
                    >
                      <List.Item.Meta
                        title={item.title}
                        description={item.description}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </TabPane>
          </Tabs>
        </Col>
      </Row>

      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        footer={null}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          <Form.Item
            name="old_password"
            label="原密码"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>
          <Form.Item
            name="new_password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="确认新密码"
            dependencies={['new_password']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
