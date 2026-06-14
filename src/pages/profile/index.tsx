import { useState } from 'react';
import { Card, Form, Input, Button, Avatar, Tabs, Table, message, Descriptions, Row, Col, Progress, Tag, Space } from 'antd';
import { UserOutlined, LockOutlined, HistoryOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { PageContainer, StatusTag } from '@/components/common';
import { useUserStore } from '@/stores/useUserStore';
import { updateProfile, changePassword, getLoginHistory, type LoginHistoryItem } from '@/services/api/auth';
import { formatDateTime } from '@/utils/format';

const ProfilePage = () => {
  const { userInfo, updateUserInfo } = useUserStore();
  const [activeTab, setActiveTab] = useState('basic');

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const { run: doUpdateProfile, loading: updatingProfile } = useRequest(updateProfile, {
    manual: true,
    onSuccess: () => {
      message.success('个人信息更新成功');
      const values = profileForm.getFieldsValue();
      updateUserInfo(values);
    },
  });

  const { run: doChangePassword, loading: changingPassword } = useRequest(changePassword, {
    manual: true,
    onSuccess: () => {
      message.success('密码修改成功');
      passwordForm.resetFields();
    },
  });

  const { data: loginHistoryData } = useRequest(() => getLoginHistory({ limit: 20 }));

  const handleProfileSave = async () => {
    try {
      const values = await profileForm.validateFields();
      doUpdateProfile(values);
    } catch { /* validation failed */ }
  };

  const handlePasswordChange = async () => {
    try {
      const values = await passwordForm.validateFields();
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的密码不一致');
        return;
      }
      doChangePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
    } catch { /* validation failed */ }
  };

  const getPasswordStrength = (password: string): { level: number; text: string; color: string } => {
    if (!password) return { level: 0, text: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 33, text: '弱', color: '#f5222d' };
    if (score <= 3) return { level: 66, text: '中', color: '#faad14' };
    return { level: 100, text: '强', color: '#52c41a' };
  };

  const [newPwd, setNewPwd] = useState('');
  const strength = getPasswordStrength(newPwd);

  const loginColumns = [
    {
      title: '登录时间',
      dataIndex: 'loginTime',
      key: 'loginTime',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 130 },
    { title: '归属地', dataIndex: 'location', key: 'location', width: 120 },
    { title: '设备', dataIndex: 'device', key: 'device', ellipsis: true },
    { title: '浏览器', dataIndex: 'browser', key: 'browser', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <StatusTag status={status === 'success' ? 'success' : 'danger'} text={status === 'success' ? '成功' : '失败'} />
      ),
    },
  ];

  return (
    <PageContainer title="个人中心" subTitle="个人信息与安全设置">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'basic',
            label: (
              <span><UserOutlined /> 基本信息</span>
            ),
            children: (
              <Row gutter={24}>
                <Col xs={24} lg={8}>
                  <Card style={{ textAlign: 'center', marginBottom: 16 }}>
                    <Avatar
                      size={96}
                      src={userInfo?.avatar}
                      icon={!userInfo?.avatar && <UserOutlined />}
                      style={{ marginBottom: 12 }}
                    />
                    <div style={{ fontSize: 18, fontWeight: 500 }}>{userInfo?.realName || '-'}</div>
                    <div style={{ color: '#86909C', marginTop: 4 }}>{userInfo?.role || '-'}</div>
                    <Descriptions column={1} size="small" style={{ marginTop: 16, textAlign: 'left' }}>
                      <Descriptions.Item label="用户名">{userInfo?.username}</Descriptions.Item>
                      <Descriptions.Item label="部门">{userInfo?.department}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
                <Col xs={24} lg={16}>
                  <Card title="编辑基本信息">
                    <Form
                      form={profileForm}
                      labelCol={{ span: 5 }}
                      wrapperCol={{ span: 16 }}
                      initialValues={{
                        realName: userInfo?.realName,
                        phone: userInfo?.phone,
                        email: userInfo?.email,
                      }}
                    >
                      <Form.Item name="realName" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                        <Input placeholder="请输入姓名" />
                      </Form.Item>
                      <Form.Item name="phone" label="手机号" rules={[{ pattern: /^1\d{10}$/, message: '请输入正确手机号' }]}>
                        <Input placeholder="请输入手机号" />
                      </Form.Item>
                      <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '请输入正确邮箱' }]}>
                        <Input placeholder="请输入邮箱" />
                      </Form.Item>
                      <Form.Item wrapperCol={{ offset: 5, span: 16 }}>
                        <Button type="primary" onClick={handleProfileSave} loading={updatingProfile}>
                          保存修改
                        </Button>
                      </Form.Item>
                    </Form>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'password',
            label: (
              <span><LockOutlined /> 修改密码</span>
            ),
            children: (
              <Card style={{ maxWidth: 560 }}>
                <Form
                  form={passwordForm}
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 16 }}
                >
                  <Form.Item name="oldPassword" label="旧密码" rules={[{ required: true, message: '请输入旧密码' }]}>
                    <Input.Password placeholder="请输入旧密码" />
                  </Form.Item>
                  <Form.Item name="newPassword" label="新密码" rules={[
                    { required: true, message: '请输入新密码' },
                    { min: 8, message: '密码至少8位' },
                    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: '密码需包含大小写字母和数字' },
                  ]}>
                    <Input.Password placeholder="请输入新密码" onChange={(e) => setNewPwd(e.target.value)} />
                  </Form.Item>
                  {newPwd && (
                    <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
                      <Space>
                        <span style={{ fontSize: 12, color: '#86909C' }}>密码强度:</span>
                        <Progress percent={strength.level} size="small" style={{ width: 120 }} strokeColor={strength.color} />
                        <Tag color={strength.level <= 33 ? 'red' : strength.level <= 66 ? 'orange' : 'green'}>{strength.text}</Tag>
                      </Space>
                    </Form.Item>
                  )}
                  <Form.Item name="confirmPassword" label="确认密码" rules={[
                    { required: true, message: '请确认新密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'));
                      },
                    }),
                  ]}>
                    <Input.Password placeholder="请再次输入新密码" />
                  </Form.Item>
                  <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
                    <Button type="primary" onClick={handlePasswordChange} loading={changingPassword}>
                      修改密码
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: 'history',
            label: (
              <span><HistoryOutlined /> 登录历史</span>
            ),
            children: (
              <Card>
                <Table
                  rowKey="id"
                  columns={loginColumns}
                  dataSource={loginHistoryData?.data || ([] as LoginHistoryItem[])}
                  pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
                  size="middle"
                />
              </Card>
            ),
          },
        ]}
      />
    </PageContainer>
  );
};

export default ProfilePage;
