import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  Avatar,
  Descriptions,
  Divider,
  Statistic,
  Tabs,
  Table,
  Tag,
  message,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  FileTextOutlined,
  AuditOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { userApi, auditApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import dayjs from 'dayjs';

const { TabPane } = Tabs;

const Profile: React.FC = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [contentStats, setContentStats] = useState<any>({
    total: 0,
    draft: 0,
    published: 0,
  });
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchProfile();
    fetchActivityLogs();
  }, []);

  const fetchProfile = async () => {
    try {
      const response: any = await userApi.getProfile();
      const data = response.data;
      setUserProfile(data);
      form.setFieldsValue({
        displayName: data.displayName,
        email: data.email,
        phone: data.phone,
        department: data.department,
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const response: any = await auditApi.getMyActivity({ limit: 10 });
      setActivityLogs(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    }
  };

  const handleUpdateProfile = async (values: any) => {
    try {
      await userApi.updateProfile(values);
      message.success('个人信息更新成功');
      fetchProfile();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleChangePassword = async (values: any) => {
    try {
      await userApi.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || '密码修改失败');
    }
  };

  const getRoleText = (role: string) => {
    const map: Record<string, string> = {
      ADMIN: '系统管理员',
      CHIEF_EDITOR: '主编',
      EDITOR: '编辑',
      CHANNEL_OPERATOR: '渠道运营',
      DATA_ANALYST: '数据分析师',
    };
    return map[role] || role;
  };

  const getRoleColor = (role: string) => {
    const map: Record<string, string> = {
      ADMIN: 'red',
      CHIEF_EDITOR: 'purple',
      EDITOR: 'blue',
      CHANNEL_OPERATOR: 'orange',
      DATA_ANALYST: 'green',
    };
    return map[role] || 'default';
  };

  const getActionText = (action: string) => {
    const map: Record<string, string> = {
      CONTENT_CREATE: '创建内容',
      CONTENT_UPDATE: '更新内容',
      CONTENT_DELETE: '删除内容',
      MEDIA_UPLOAD: '上传媒体',
      REVIEW_PROCESS: '处理审核',
      USER_LOGIN: '登录',
    };
    return map[action] || action;
  };

  const activityColumns = [
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => <Tag>{getActionText(action)}</Tag>,
    },
    {
      title: '资源标题',
      dataIndex: 'resourceTitle',
      key: 'resourceTitle',
      render: (title: string) => title || '-',
    },
    {
      title: '状态码',
      dataIndex: 'statusCode',
      key: 'statusCode',
      render: (code: number) => (
        <Tag color={code === 200 || code === 201 ? 'success' : 'error'}>{code}</Tag>
      ),
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>个人中心</h2>
        <p style={{ color: 'rgba(0,0,0,0.45)' }}>管理您的个人信息</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card>
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Avatar size={100} icon={<UserOutlined />} />
              <h3 style={{ marginTop: 16, marginBottom: 8 }}>
                {userProfile?.displayName || user?.displayName || user?.username}
              </h3>
              <Tag color={getRoleColor(user?.role || '')} style={{ fontSize: 14, padding: '4px 12px' }}>
                {getRoleText(user?.role || '')}
              </Tag>
            </div>

            <Divider />

            <Descriptions column={1} size="small">
              <Descriptions.Item label="用户名">
                {userProfile?.username || user?.username}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {userProfile?.email || user?.email}
              </Descriptions.Item>
              <Descriptions.Item label="部门">
                {userProfile?.department || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="最后登录">
                {userProfile?.lastLoginAt
                  ? dayjs(userProfile.lastLoginAt).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {userProfile?.createdAt
                  ? dayjs(userProfile.createdAt).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="内容统计" style={{ marginTop: 16 }}>
            <Row gutter={[8, 8]}>
              <Col span={8}>
                <Statistic
                  title="总内容"
                  value={contentStats.total}
                  prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="草稿"
                  value={contentStats.draft}
                  prefix={<EditOutlined style={{ color: '#faad14' }} />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="已发布"
                  value={contentStats.published}
                  prefix={<SaveOutlined style={{ color: '#52c41a' }} />}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card>
            <Tabs defaultActiveKey="info">
              <TabPane tab={<span><UserOutlined /> 基本信息</span>} key="info">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleUpdateProfile}
                  style={{ maxWidth: 500 }}
                >
                  <Form.Item
                    name="displayName"
                    label="显示名称"
                    rules={[{ required: true, message: '请输入显示名称' }]}
                  >
                    <Input placeholder="请输入显示名称" />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' },
                    ]}
                  >
                    <Input placeholder="请输入邮箱" />
                  </Form.Item>

                  <Form.Item name="phone" label="联系电话">
                    <Input placeholder="请输入联系电话" />
                  </Form.Item>

                  <Form.Item name="department" label="所属部门">
                    <Input placeholder="请输入所属部门" />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                      保存修改
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>

              <TabPane tab={<span><AuditOutlined /> 操作日志</span>} key="logs">
                <Table
                  columns={activityColumns}
                  dataSource={activityLogs}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              </TabPane>

              <TabPane tab="修改密码" key="password">
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handleChangePassword}
                  style={{ maxWidth: 400 }}
                >
                  <Form.Item
                    name="oldPassword"
                    label="原密码"
                    rules={[{ required: true, message: '请输入原密码' }]}
                  >
                    <Input.Password placeholder="请输入原密码" />
                  </Form.Item>

                  <Form.Item
                    name="newPassword"
                    label="新密码"
                    rules={[
                      { required: true, message: '请输入新密码' },
                      { min: 8, message: '密码至少8个字符' },
                    ]}
                  >
                    <Input.Password placeholder="请输入新密码" />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    label="确认新密码"
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: '请确认新密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
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
                    <Button type="primary" htmlType="submit">
                      修改密码
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
