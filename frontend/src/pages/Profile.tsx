import React, { useState } from 'react';
import { Card, Form, Input, Button, Avatar, Tabs, message, InputNumber, Select, Switch, Space } from 'antd';
import { UserOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import type { User } from '../types';

const { Option } = Select;
const { TextArea } = Input;

function Profile() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleEdit = () => {
    form.setFieldsValue({
      real_name: user.real_name,
      phone: user.phone,
      city: user.city,
      address: user.address,
    });
    setEditing(true);
  };

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      await updateProfile(values);
      message.success('资料更新成功');
      setEditing(false);
    } catch (error: any) {
      message.error(error.response?.data?.error || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkerProfile = async (values: any) => {
    try {
      await api.put('/auth/worker-profile', values);
      message.success('工人资料更新成功');
    } catch (error: any) {
      message.error(error.response?.data?.error || '更新失败');
    }
  };

  const handleUpdateDriverProfile = async (values: any) => {
    try {
      await api.put('/auth/driver-profile', values);
      message.success('司机资料更新成功');
    } catch (error: any) {
      message.error(error.response?.data?.error || '更新失败');
    }
  };

  const basicInfoTab = (
    <Card style={{ marginTop: 16 }}>
      {editing ? (
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item label="真实姓名" name="real_name">
            <Input />
          </Form.Item>
          <Form.Item label="手机号" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="所在城市" name="city">
            <Input />
          </Form.Item>
          <Form.Item label="详细地址" name="address">
            <Input />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                保存
              </Button>
              <Button onClick={() => setEditing(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar size={64} icon={<UserOutlined />} src={user.avatar} />
              <div style={{ marginLeft: 16 }}>
                <h3 style={{ marginBottom: 4 }}>{user.real_name || user.username}</h3>
                <div style={{ color: '#8c8c8c', fontSize: 13 }}>
                  用户名: {user.username}
                </div>
                <div style={{ marginTop: 8 }}>
                  <span style={{ background: '#e6f7ff', color: '#1890ff', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                    {user.role === 'employer' ? '雇主' : user.role === 'worker' ? '工人' : user.role === 'driver' ? '司机' : '管理员'}
                  </span>
                </div>
              </div>
            </div>
            <Button type="text" icon={<EditOutlined />} onClick={handleEdit}>
              编辑资料
            </Button>
          </div>
          
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <Card size="small">
              <div style={{ color: '#8c8c8c', fontSize: 13 }}>信用分</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>{user.credit_score}</div>
            </Card>
            <Card size="small">
              <div style={{ color: '#8c8c8c', fontSize: 13 }}>账户余额</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#fa8c16' }}>¥{user.balance}</div>
            </Card>
            <Card size="small">
              <div style={{ color: '#8c8c8c', fontSize: 13 }}>所在城市</div>
              <div style={{ fontSize: 18, fontWeight: 500 }}>{user.city || '未填写'}</div>
            </Card>
          </div>
        </>
      )}
    </Card>
  );

  const workerProfileTab = user.worker_profile && (
    <Card title="工人资料" style={{ marginTop: 16 }} extra={<span>认证状态: {user.worker_profile.id_card_verified ? '已认证' : '未认证'}</span>}>
      <Form
        layout="vertical"
        initialValues={{
          skills: user.worker_profile.skills,
          service_radius: user.worker_profile.service_radius,
          hourly_rate: user.worker_profile.hourly_rate,
          task_rate: user.worker_profile.task_rate,
          bio: user.worker_profile.bio,
        }}
        onFinish={handleUpdateWorkerProfile}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <Form.Item label="服务半径 (公里)" name="service_radius">
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="每小时价格 (元)" name="hourly_rate">
            <InputNumber min={10} style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <Form.Item label="任务起价 (元)" name="task_rate">
            <InputNumber min={10} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="完成订单数">
            <InputNumber value={user.worker_profile.completed_orders} disabled style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <Form.Item label="评分">
          <div>⭐ {user.worker_profile.rating} 分</div>
        </Form.Item>
        <Form.Item label="个人简介" name="bio">
          <TextArea rows={3} />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit">保存</Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const driverProfileTab = user.driver_profile && (
    <Card title="司机资料" style={{ marginTop: 16 }} extra={<span>保险状态: {user.driver_profile.insurance_verified ? '已验证' : '未验证'}</span>}>
      <Form
        layout="vertical"
        initialValues={{
          vehicle_type: user.driver_profile.vehicle_type,
          vehicle_brand: user.driver_profile.vehicle_brand,
          plate_number: user.driver_profile.plate_number,
          load_capacity: user.driver_profile.load_capacity,
          vehicle_length: user.driver_profile.vehicle_length,
          bio: user.driver_profile.bio,
        }}
        onFinish={handleUpdateDriverProfile}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <Form.Item label="车型" name="vehicle_type">
            <Select>
              <Option value="厢式货车">厢式货车</Option>
              <Option value="平板货车">平板货车</Option>
              <Option value="高栏货车">高栏货车</Option>
              <Option value="冷藏车">冷藏车</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item label="车辆品牌" name="vehicle_brand">
            <Input />
          </Form.Item>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <Form.Item label="车牌号" name="plate_number">
            <Input />
          </Form.Item>
          <Form.Item label="载重 (吨)" name="load_capacity">
            <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <Form.Item label="车长 (米)" name="vehicle_length">
            <InputNumber min={2} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="完成订单数">
            <InputNumber value={user.driver_profile.completed_orders} disabled style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <Form.Item label="评分">
          <div>⭐ {user.driver_profile.rating} 分</div>
        </Form.Item>
        <Form.Item label="个人简介" name="bio">
          <TextArea rows={3} />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit">保存</Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const tabItems: any[] = [
    { key: 'basic', label: '基本信息', children: basicInfoTab },
  ];

  if (user.role === 'worker') {
    tabItems.push({ key: 'worker', label: '工人资料', children: workerProfileTab });
  }
  if (user.role === 'driver') {
    tabItems.push({ key: 'driver', label: '司机资料', children: driverProfileTab });
  }

  return (
    <div className="page-container">
      <Card title="个人中心" style={{ marginBottom: 16 }} />
      <Tabs items={tabItems} />
    </div>
  );
}

export default Profile;
