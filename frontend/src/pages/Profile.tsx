import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Space, message, Tabs, Descriptions, Tag, Modal, DatePicker, Select, Spin, Alert, Row, Col, Statistic, Avatar } from 'antd';
const { Option } = Select;
import { User, RoleMap } from '../types';
import { userApi, licenseApi } from '../services/api';
import { LicenseStatusMap } from '../types';

interface ProfileProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUserUpdate }) => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [licenseForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [myLicense, setMyLicense] = useState<any>(null);
  const [licenseModalVisible, setLicenseModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        real_name: user.real_name || '',
        phone: user.phone || '',
        email: user.email || '',
        id_card: user.id_card || '',
        license_number: user.license_number || ''
      });
      loadMyLicense();
    }
  }, [user]);

  const loadMyLicense = async () => {
    try {
      const res = await licenseApi.my();
      setMyLicense(res.data);
    } catch (err) {
      console.error('加载驾照信息失败', err);
    }
  };

  const handleProfileUpdate = async (values: any) => {
    setLoading(true);
    try {
      await userApi.updateProfile(values);
      message.success('个人信息更新成功');
      onUserUpdate({ ...user, ...values });
    } catch (err) {
      message.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (values: any) => {
    setLoading(true);
    try {
      await userApi.updatePassword(values);
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (err) {
      message.error('密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLicenseSubmit = async (values: any) => {
    setLoading(true);
    try {
      await licenseApi.submit(values);
      message.success('驾照信息提交成功，等待审核');
      setLicenseModalVisible(false);
      loadMyLicense();
    } catch (err) {
      message.error('提交失败');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: '1',
      label: '基本信息',
      children: (
        <div style={{ maxWidth: 500, padding: '24px 0' }}>
          <Form form={form} layout="vertical" onFinish={handleProfileUpdate}>
            <Form.Item name="real_name" label="真实姓名">
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="手机号">
              <Input />
            </Form.Item>
            <Form.Item name="email" label="邮箱">
              <Input />
            </Form.Item>
            <Form.Item name="id_card" label="身份证号">
              <Input />
            </Form.Item>
            <Form.Item name="license_number" label="驾照号">
              <Input />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </div>
      )
    },
    {
      key: '2',
      label: '修改密码',
      children: (
        <div style={{ maxWidth: 500, padding: '24px 0' }}>
          <Form form={passwordForm} layout="vertical" onFinish={handlePasswordUpdate}>
            <Form.Item name="old_password" label="原密码" rules={[{ required: true, message: '请输入原密码' }]}>
              <Input.Password />
            </Form.Item>
            <Form.Item name="new_password" label="新密码" rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码至少6位' }]}>
              <Input.Password />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </div>
      )
    },
    {
      key: '3',
      label: '驾照信息',
      children: (
        <div style={{ padding: '24px 0' }}>
          {myLicense ? (
            <>
              <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="驾照号">{myLicense.license_number}</Descriptions.Item>
                <Descriptions.Item label="驾照类型">{myLicense.license_type || '-'}</Descriptions.Item>
                <Descriptions.Item label="领证日期">{myLicense.issue_date || '-'}</Descriptions.Item>
                <Descriptions.Item label="有效期至">{myLicense.expiry_date || '-'}</Descriptions.Item>
                <Descriptions.Item label="审核状态">
                  <Tag color={LicenseStatusMap[myLicense.status]?.color}>
                    {LicenseStatusMap[myLicense.status]?.text}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="审核备注">{myLicense.review_remark || '-'}</Descriptions.Item>
              </Descriptions>
              {myLicense.status !== 'pending' && (
                <Button type="primary" onClick={() => setLicenseModalVisible(true)}>
                  重新提交
                </Button>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: 'rgba(0,0,0,0.45)', marginBottom: 16 }}>您还没有提交驾照审核信息</p>
              <Button type="primary" onClick={() => setLicenseModalVisible(true)}>
                提交驾照信息
              </Button>
            </div>
          )}
        </div>
      )
    }
  ];

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" tip="正在加载用户信息..." />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <Alert
          message="操作异常"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Avatar size={64} style={{ backgroundColor: '#1677ff', fontSize: 28 }}>
              {user.real_name?.charAt(0) || user.username?.charAt(0) || '用'}
            </Avatar>
          </Col>
          <Col flex="1">
            <h2 style={{ margin: 0, marginBottom: 8, fontSize: 20, fontWeight: 600 }}>
              {user.real_name || user.username}
            </h2>
            <div style={{ color: 'rgba(0,0,0,0.45)' }}>
              <Tag color="blue">{RoleMap[user.role as keyof typeof RoleMap] || user.role}</Tag>
              <span>账号：{user.username}</span>
            </div>
          </Col>
          <Col>
            <Row gutter={[24, 0]}>
              <Col>
                <Statistic title="订单数" value={0} />
              </Col>
              <Col>
                <Statistic title="驾照状态" value={myLicense ? LicenseStatusMap[myLicense.status]?.text : '未提交'} />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs items={tabItems} defaultActiveKey="1" />
      </Card>

      <Modal title="提交驾照信息" open={licenseModalVisible} onCancel={() => setLicenseModalVisible(false)} footer={null} width={500}>
        <Form form={licenseForm} layout="vertical" onFinish={handleLicenseSubmit}>
          <Form.Item name="license_number" label="驾照号" rules={[{ required: true, message: '请输入驾照号' }]}>
            <Input placeholder="请输入驾照号" />
          </Form.Item>
          <Form.Item name="license_type" label="驾照类型" initialValue="C1">
            <Select placeholder="请选择驾照类型">
              <Option value="C1">C1 - 小型汽车</Option>
              <Option value="C2">C2 - 小型自动挡汽车</Option>
              <Option value="B1">B1 - 中型客车</Option>
              <Option value="B2">B2 - 大型货车</Option>
              <Option value="A1">A1 - 大型客车</Option>
              <Option value="A2">A2 - 牵引车</Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="issue_date" label="领证日期">
                <DatePicker style={{ width: '100%' }} placeholder="请选择领证日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expiry_date" label="有效期至">
                <DatePicker style={{ width: '100%' }} placeholder="请选择有效期" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>提交审核</Button>
              <Button onClick={() => setLicenseModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
