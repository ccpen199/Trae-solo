import { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Row,
  Col,
  Descriptions,
  Tag,
  Tabs,
  Switch,
  Divider,
  message,
  Upload,
  Space,
  Modal,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  CameraOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  MobileOutlined,
  MailOutlined,
  BellOutlined,
  ShieldOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import useAuth from '../../hooks/useAuth';
import { formatPhone, formatIdCard } from '../../utils/format';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [securitySettings, setSecuritySettings] = useState({
    loginNotify: true,
    passwordExpire: true,
    twoFactor: false,
    deviceBind: true,
  });

  const role = user?.role || user?.roles?.[0] || 'personal';

  const getRoleName = () => {
    const roleMap = {
      personal: '个人用户',
      enterprise: '企业HR',
      staff: '基层经办',
    };
    return roleMap[role] || '个人用户';
  };

  const getVerifyStatus = () => {
    const statusMap = {
      verified: { color: 'green', text: '已认证', icon: <SafetyCertificateOutlined /> },
      pending: { color: 'orange', text: '待审核', icon: <ClockCircleOutlined /> },
      unverified: { color: 'red', text: '未认证', icon: <ExclamationCircleOutlined /> },
    };
    const status = user?.verifyStatus || 'verified';
    return statusMap[status] || statusMap.unverified;
  };

  const handleEdit = () => {
    form.setFieldsValue({
      name: user?.name || user?.username || '',
      phone: user?.phone || '',
      email: user?.email || '',
      idCard: user?.idCard || '',
      address: user?.address || '',
    });
    setEditMode(true);
  };

  const handleSave = async (values) => {
    try {
      const updatedUser = { ...user, ...values };
      await updateUser(updatedUser);
      message.success('个人信息更新成功');
      setEditMode(false);
    } catch {
      message.error('更新失败，请重试');
    }
  };

  const handlePasswordChange = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    try {
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch {
      message.error('密码修改失败');
    }
  };

  const handleSecurityChange = (key, checked) => {
    setSecuritySettings((prev) => ({ ...prev, [key]: checked }));
    message.success(checked ? '已开启' : '已关闭');
  };

  const handleVerify = () => {
    Modal.info({
      title: '实名认证',
      content: (
        <div>
          <p>实名认证需要您提供以下信息：</p>
          <ul style={{ paddingLeft: 20 }}>
            <li>真实姓名</li>
            <li>身份证号码</li>
            <li>人脸识别验证</li>
          </ul>
          <p style={{ marginTop: 16, color: '#999', fontSize: 13 }}>
            您的信息将被严格保密，仅用于身份验证
          </p>
        </div>
      ),
      okText: '立即认证',
      onOk() {
        message.info('实名认证功能开发中');
      },
    });
  };

  const uploadProps = {
    name: 'avatar',
    action: '/api/upload',
    showUploadList: false,
    beforeUpload: () => {
      message.info('头像上传功能开发中');
      return false;
    },
  };

  const verifyStatus = getVerifyStatus();

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Avatar size={100} icon={<UserOutlined />} src={user?.avatar} />
              <Upload {...uploadProps}>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#1E6FDB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: '2px solid #fff',
                  }}
                >
                  <CameraOutlined style={{ color: '#fff', fontSize: 14 }} />
                </div>
              </Upload>
            </div>
            <div style={{ marginTop: 16 }}>
              <Tag color={verifyStatus.color} icon={verifyStatus.icon}>
                {verifyStatus.text}
              </Tag>
              {verifyStatus.color !== 'green' && (
                <Button type="link" size="small" onClick={handleVerify}>
                  去认证
                </Button>
              )}
            </div>
          </div>

          {editMode ? (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              initialValues={{
                name: user?.name || user?.username || '',
                phone: user?.phone || '',
                email: user?.email || '',
                idCard: user?.idCard || '',
                address: user?.address || '',
              }}
            >
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="name"
                    label="姓名"
                    rules={[{ required: true, message: '请输入姓名' }]}
                  >
                    <Input placeholder="请输入姓名" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="phone" label="手机号">
                    <Input prefix={<MobileOutlined />} placeholder="请输入手机号" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="email" label="邮箱">
                    <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="idCard" label="身份证号">
                    <Input placeholder="请输入身份证号" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item name="address" label="联系地址">
                    <Input.TextArea rows={3} placeholder="请输入联系地址" />
                  </Form.Item>
                </Col>
              </Row>
              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setEditMode(false)}>取消</Button>
                  <Button type="primary" htmlType="submit">
                    保存
                  </Button>
                </Space>
              </div>
            </Form>
          ) : (
            <div>
              <Descriptions column={2} bordered>
                <Descriptions.Item label="用户名">{user?.username || '-'}</Descriptions.Item>
                <Descriptions.Item label="用户角色">{getRoleName()}</Descriptions.Item>
                <Descriptions.Item label="姓名">{user?.name || user?.username || '-'}</Descriptions.Item>
                <Descriptions.Item label="性别">{user?.gender || '-'}</Descriptions.Item>
                <Descriptions.Item label="手机号">
                  {user?.phone ? formatPhone(user.phone) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="邮箱">{user?.email || '-'}</Descriptions.Item>
                <Descriptions.Item label="身份证号">
                  {user?.idCard ? formatIdCard(user.idCard) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="出生日期">{user?.birthday || '-'}</Descriptions.Item>
                <Descriptions.Item label="联系地址" span={2}>
                  {user?.address || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="注册时间" span={2}>
                  {user?.createTime || '2024-01-01 00:00:00'}
                </Descriptions.Item>
              </Descriptions>
              <div style={{ marginTop: 24, textAlign: 'right' }}>
                <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
                  编辑信息
                </Button>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'security',
      label: '修改密码',
      children: (
        <Card>
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordChange}
            style={{ maxWidth: 500, margin: '0 auto' }}
          >
            <Form.Item
              name="oldPassword"
              label="当前密码"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入当前密码" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码长度不能少于6位' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="确认新密码"
              rules={[{ required: true, message: '请再次输入新密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
            </Form.Item>
            <div style={{ marginTop: 16 }}>
              <Button type="primary" htmlType="submit" block>
                确认修改
              </Button>
            </div>
          </Form>
        </Card>
      ),
    },
    {
      key: 'settings',
      label: '账号安全',
      children: (
        <Card>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <BellOutlined style={{ fontSize: 20, color: '#1E6FDB' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>登录提醒</div>
                  <div style={{ fontSize: 12, color: '#999' }}>新设备登录时发送短信提醒</div>
                </div>
              </div>
              <Switch
                checked={securitySettings.loginNotify}
                onChange={(checked) => handleSecurityChange('loginNotify', checked)}
              />
            </div>
            <Divider style={{ margin: 0 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ShieldOutlined style={{ fontSize: 20, color: '#52C41A' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>密码过期提醒</div>
                  <div style={{ fontSize: 12, color: '#999' }}>密码到期前7天提醒修改</div>
                </div>
              </div>
              <Switch
                checked={securitySettings.passwordExpire}
                onChange={(checked) => handleSecurityChange('passwordExpire', checked)}
              />
            </div>
            <Divider style={{ margin: 0 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <SafetyCertificateOutlined style={{ fontSize: 20, color: '#FAAD14' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>两步验证</div>
                  <div style={{ fontSize: 12, color: '#999' }}>登录时需要手机验证码</div>
                </div>
              </div>
              <Switch
                checked={securitySettings.twoFactor}
                onChange={(checked) => handleSecurityChange('twoFactor', checked)}
              />
            </div>
            <Divider style={{ margin: 0 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <MobileOutlined style={{ fontSize: 20, color: '#722ED1' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>设备绑定</div>
                  <div style={{ fontSize: 12, color: '#999' }}>仅允许已绑定设备登录</div>
                </div>
              </div>
              <Switch
                checked={securitySettings.deviceBind}
                onChange={(checked) => handleSecurityChange('deviceBind', checked)}
              />
            </div>
          </div>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="个人中心"
        extra={
          <Space>
            <Tag color="blue">{getRoleName()}</Tag>
            <Tag color={verifyStatus.color} icon={verifyStatus.icon}>
              实名认证：{verifyStatus.text}
            </Tag>
          </Space>
        }
      >
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
};

export default Profile;
