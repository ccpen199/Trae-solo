import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Upload,
  Avatar,
  Spin,
  message,
  Tag,
  List,
  Descriptions,
  Space,
  Divider,
} from 'antd';
import {
  UserOutlined,
  UploadOutlined,
  SaveOutlined,
  EditOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  SafetyOutlined,
  LockOutlined,
  DesktopOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { auth } from '../api';

const { TabPane } = Tabs;

function Profile() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [avatarFile, setAvatarFile] = useState(null);
  const [loginRecords, setLoginRecords] = useState([]);

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue(user);
    }
    loadLoginRecords();
  }, [user]);

  const loadLoginRecords = () => {
    const mockRecords = [
      {
        id: 1,
        device: 'MacBook Pro - Chrome',
        ip: '192.168.1.100',
        location: '北京市朝阳区',
        time: dayjs().subtract(0, 'hour').toISOString(),
        isCurrent: true,
      },
      {
        id: 2,
        device: 'iPhone 14 - Safari',
        ip: '192.168.1.101',
        location: '北京市朝阳区',
        time: dayjs().subtract(2, 'hour').toISOString(),
        isCurrent: false,
      },
      {
        id: 3,
        device: 'Windows 11 - Edge',
        ip: '10.0.0.50',
        location: '上海市浦东新区',
        time: dayjs().subtract(1, 'day').toISOString(),
        isCurrent: false,
      },
      {
        id: 4,
        device: 'MacBook Pro - Chrome',
        ip: '192.168.1.100',
        location: '北京市朝阳区',
        time: dayjs().subtract(2, 'day').toISOString(),
        isCurrent: false,
      },
      {
        id: 5,
        device: 'iPad Pro - Safari',
        ip: '192.168.1.102',
        location: '北京市海淀区',
        time: dayjs().subtract(3, 'day').toISOString(),
        isCurrent: false,
      },
    ];
    setLoginRecords(mockRecords);
  };

  const handleSaveProfile = async () => {
    try {
      const values = await profileForm.validateFields();
      setSaving(true);

      const submitData = { ...values };
      if (avatarFile) {
        submitData.avatar = avatarFile;
      }

      const res = await auth.updateProfile(submitData);
      if (res.code === 0) {
        message.success('个人资料更新成功');
        setAvatarFile(null);
      } else {
        message.error(res.message || '更新失败');
      }
    } catch (err) {
      if (err.errorFields) {
        message.warning('请完善表单信息');
      } else {
        message.error('更新失败');
        console.error('更新个人资料失败:', err);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      if (values.new_password !== values.confirm_password) {
        message.error('两次输入的新密码不一致');
        return;
      }
      setPasswordLoading(true);

      const res = await auth.updatePassword({
        old_password: values.old_password,
        new_password: values.new_password,
      });
      if (res.code === 0) {
        message.success('密码修改成功');
        passwordForm.resetFields();
      } else {
        message.error(res.message || '密码修改失败');
      }
    } catch (err) {
      if (err.errorFields) {
        message.warning('请完善密码信息');
      } else {
        message.error('密码修改失败');
        console.error('修改密码失败:', err);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const avatarUploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只支持上传图片文件');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('图片大小不能超过 2MB');
        return false;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarFile(e.target.result);
      };
      reader.readAsDataURL(file);
      return false;
    },
    fileList: avatarFile
      ? [
          {
            uid: '-1',
            name: 'avatar.png',
            status: 'done',
            url: avatarFile,
          },
        ]
      : [],
  };

  const getRoleTag = (role) => {
    const roleMap = {
      admin: { color: 'red', text: '超级管理员' },
      hr_manager: { color: 'blue', text: 'HR经理' },
      hr: { color: 'green', text: 'HR专员' },
      recruiter: { color: 'orange', text: '招聘专员' },
      interviewer: { color: 'purple', text: '面试官' },
      employee: { color: 'default', text: '普通员工' },
    };
    return roleMap[role] || { color: 'default', text: role };
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const roleInfo = getRoleTag(user.role);

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 16 }}>
              <Avatar
                size={100}
                src={avatarFile || user.avatar}
                icon={!avatarFile && !user.avatar && <UserOutlined />}
                style={{
                  border: '4px solid #f0f0f0',
                  marginBottom: 12,
                }}
              />
              <h3 style={{ margin: '8px 0 4px 0' }}>{user.name || user.username}</h3>
              <Tag color={roleInfo.color}>{roleInfo.text}</Tag>
            </div>

            <Descriptions column={1} size="small">
              <Descriptions.Item label="部门">
                <Space>
                  <EnvironmentOutlined />
                  {user.department || '未设置'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="职位">
                <Space>
                  <UserOutlined />
                  {user.position || '未设置'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="手机号">
                <Space>
                  <PhoneOutlined />
                  {user.phone || '未设置'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                <Space>
                  <MailOutlined />
                  {user.email || '未设置'}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} md={18}>
          <Card>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="基本资料" key="basic">
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={8} style={{ textAlign: 'center' }}>
                    <Card size="small" title="头像">
                      <div style={{ marginBottom: 16 }}>
                        <Avatar
                          size={120}
                          src={avatarFile || user.avatar}
                          icon={!avatarFile && !user.avatar && <UserOutlined />}
                          style={{ border: '4px solid #f0f0f0' }}
                        />
                      </div>
                      <Upload {...avatarUploadProps} maxCount={1}>
                        <Button icon={<UploadOutlined />}>更换头像</Button>
                      </Upload>
                    </Card>
                  </Col>

                  <Col xs={24} md={16}>
                    <Card size="small" title="基本信息">
                      <Form
                        form={profileForm}
                        layout="vertical"
                        initialValues={user}
                      >
                        <Row gutter={16}>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="name"
                              label="姓名"
                              rules={[{ required: true, message: '请输入姓名' }]}
                            >
                              <Input placeholder="请输入姓名" prefix={<UserOutlined />} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="phone"
                              label="手机号"
                              rules={[
                                { required: true, message: '请输入手机号' },
                                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
                              ]}
                            >
                              <Input placeholder="请输入手机号" prefix={<PhoneOutlined />} />
                            </Form.Item>
                          </Col>
                          <Col xs={24}>
                            <Form.Item
                              name="email"
                              label="邮箱"
                              rules={[
                                { required: true, message: '请输入邮箱' },
                                { type: 'email', message: '请输入有效的邮箱地址' },
                              ]}
                            >
                              <Input placeholder="请输入邮箱" prefix={<MailOutlined />} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item name="department" label="部门">
                              <Input placeholder="请输入部门" prefix={<EnvironmentOutlined />} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item name="position" label="职位">
                              <Input placeholder="请输入职位" prefix={<UserOutlined />} />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                          <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={handleSaveProfile}
                            loading={saving}
                          >
                            保存修改
                          </Button>
                        </Form.Item>
                      </Form>
                    </Card>
                  </Col>
                </Row>
              </TabPane>

              <TabPane tab="修改密码" key="password">
                <Card size="small" title="修改密码">
                  <Form
                    form={passwordForm}
                    layout="vertical"
                    style={{ maxWidth: '500px' }}
                  >
                    <Form.Item
                      name="old_password"
                      label="当前密码"
                      rules={[
                        { required: true, message: '请输入当前密码' },
                        { min: 6, message: '密码至少6位' },
                      ]}
                    >
                      <Input.Password
                        placeholder="请输入当前密码"
                        prefix={<LockOutlined />}
                        autoComplete="current-password"
                      />
                    </Form.Item>

                    <Form.Item
                      name="new_password"
                      label="新密码"
                      rules={[
                        { required: true, message: '请输入新密码' },
                        { min: 6, message: '密码至少6位' },
                        {
                          pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
                          message: '密码需包含字母和数字',
                        },
                      ]}
                    >
                      <Input.Password
                        placeholder="请输入新密码（至少6位，包含字母和数字）"
                        prefix={<LockOutlined />}
                        autoComplete="new-password"
                      />
                    </Form.Item>

                    <Form.Item
                      name="confirm_password"
                      label="确认新密码"
                      rules={[
                        { required: true, message: '请再次输入新密码' },
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
                      <Input.Password
                        placeholder="请再次输入新密码"
                        prefix={<LockOutlined />}
                        autoComplete="new-password"
                      />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0 }}>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleChangePassword}
                        loading={passwordLoading}
                      >
                        修改密码
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </TabPane>

              <TabPane tab="账号安全" key="security">
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <SafetyOutlined />
                          最近登录设备
                        </Space>
                      }
                      extra={<Tag color="success">当前设备</Tag>}
                    >
                      <List
                        dataSource={loginRecords.slice(0, 5)}
                        renderItem={(item) => (
                          <List.Item key={item.id}>
                            <List.Item.Meta
                              avatar={
                                <Avatar
                                  style={{
                                    background: item.isCurrent ? '#52c41a' : '#d9d9d9',
                                  }}
                                  icon={<DesktopOutlined />}
                                />
                              }
                              title={
                                <Space>
                                  {item.device}
                                  {item.isCurrent && <Tag color="success">当前</Tag>}
                                </Space>
                              }
                              description={
                                <div>
                                  <div style={{ fontSize: '12px', color: '#999' }}>
                                    <Space size="small">
                                      <span>IP: {item.ip}</span>
                                      <span>•</span>
                                      <span>{item.location}</span>
                                    </Space>
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#999', marginTop: 2 }}>
                                    <Space size="small">
                                      <ClockCircleOutlined />
                                      {dayjs(item.time).format('YYYY-MM-DD HH:mm')}
                                    </Space>
                                  </div>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </Card>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Card
                      size="small"
                      title={
                        <Space>
                          <SafetyOutlined />
                          登录记录
                        </Space>
                      }
                    >
                      <List
                        dataSource={loginRecords}
                        renderItem={(item) => (
                          <List.Item key={item.id}>
                            <List.Item.Meta
                              avatar={
                                <Avatar
                                  style={{
                                    background: item.isCurrent ? '#52c41a' : '#1890ff',
                                  }}
                                  icon={item.isCurrent ? <DesktopOutlined /> : <ClockCircleOutlined />}
                                />
                              }
                              title={
                                <Space>
                                  {item.device}
                                  {item.isCurrent && <Tag color="success">当前</Tag>}
                                </Space>
                              }
                              description={
                                <div>
                                  <div style={{ fontSize: '12px', color: '#999' }}>
                                    {item.ip} • {item.location}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#999', marginTop: 2 }}>
                                    {dayjs(item.time).format('YYYY-MM-DD HH:mm')}
                                  </div>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    </Card>

                    <Card
                      size="small"
                      title={
                        <Space>
                          <EditOutlined />
                          账号管理
                        </Space>
                      }
                      style={{ marginTop: 16 }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Button block icon={<PhoneOutlined />}>
                          修改手机号
                        </Button>
                        <Button block icon={<MailOutlined />}>
                          修改邮箱
                        </Button>
                        <Divider style={{ margin: '8px 0' }} />
                        <Button block danger icon={<LockOutlined />}>
                          退出所有登录
                        </Button>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Profile;
