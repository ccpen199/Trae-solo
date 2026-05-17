import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Form, Input, Button, Switch, Typography,
  Spin, Empty, Avatar, Select, message, Space, Divider
} from 'antd';
import { UserOutlined, SettingOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { preferencesAPI } from '../services/api';
import { UserPreferences, User } from '../types';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profileForm] = Form.useForm();
  const [preferencesForm] = Form.useForm();
  const { updateUser } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await preferencesAPI.getPreferences();
      setPreferences(data.preferences);
      setUser(data.user);

      profileForm.setFieldsValue({
        nickname: data.user?.nickname,
        age: data.user?.age,
        gender: data.user?.gender
      });

      preferencesForm.setFieldsValue({
        sleepGoalHours: data.preferences?.sleep_goal_hours || 8,
        notificationsEnabled: data.preferences?.notifications_enabled ? true : false,
        autoStopMusic: data.preferences?.auto_stop_music ? true : false,
        smartDeviceEnabled: data.preferences?.smart_device_enabled ? true : false
      });
    } catch (err) {
      console.error('获取设置失败:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveProfile = async (values: Partial<User>) => {
    setSaving(true);
    try {
      await preferencesAPI.updateProfile(values);
      message.success('个人资料已保存');
      if (user) {
        updateUser({ ...user, ...values });
      }
    } catch (err) {
      console.error('保存失败:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async (values: any) => {
    setSaving(true);
    try {
      await preferencesAPI.updatePreferences({
        sleep_goal_hours: values.sleepGoalHours,
        notifications_enabled: values.notificationsEnabled ? 1 : 0,
        auto_stop_music: values.autoStopMusic ? 1 : 0,
        smart_device_enabled: values.smartDeviceEnabled ? 1 : 0
      });
      message.success('设置已保存');
    } catch (err) {
      console.error('保存失败:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Empty description="加载失败" />
        <div style={{ marginTop: 16 }}>
          <Button icon={<ReloadOutlined />} onClick={fetchData} type="primary">
            重新加载
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, marginBottom: 8 }}>个人设置</Title>
        <Text type="secondary">管理您的个人资料和应用偏好</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="个人资料" icon={<UserOutlined />}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar size={80} icon={<UserOutlined />} />
              <div style={{ marginTop: 12 }}>
                <Text strong style={{ fontSize: 16 }}>{user?.nickname || user?.username}</Text>
                <br />
                <Text type="secondary">{user?.email}</Text>
              </div>
            </div>

            <Form
              form={profileForm}
              onFinish={handleSaveProfile}
              layout="vertical"
            >
              <Form.Item
                name="nickname"
                label="昵称"
              >
                <Input placeholder="请输入昵称" />
              </Form.Item>

              <Form.Item
                name="age"
                label="年龄"
              >
                <Input type="number" placeholder="请输入年龄" />
              </Form.Item>

              <Form.Item
                name="gender"
                label="性别"
              >
                <Select placeholder="请选择性别">
                  <Option value="male">男</Option>
                  <Option value="female">女</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saving}
                  block
                >
                  保存资料
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="应用偏好" icon={<SettingOutlined />}>
            <Form
              form={preferencesForm}
              onFinish={handleSavePreferences}
              layout="vertical"
            >
              <Form.Item
                name="sleepGoalHours"
                label="每日睡眠目标"
              >
                <Select>
                  <Option value={6}>6 小时</Option>
                  <Option value={7}>7 小时</Option>
                  <Option value={8}>8 小时</Option>
                  <Option value={9}>9 小时</Option>
                  <Option value={10}>10 小时</Option>
                </Select>
              </Form.Item>

              <Divider />

              <Form.Item
                name="notificationsEnabled"
                label="消息通知"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                接收睡眠提醒和睡眠报告推送
              </Text>

              <Form.Item
                name="autoStopMusic"
                label="自动停止音乐"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                检测到您入睡后自动停止播放助眠音乐
              </Text>

              <Form.Item
                name="smartDeviceEnabled"
                label="智能设备联动"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                联动智能灯、窗帘等设备，营造最佳睡眠环境
              </Text>

              <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saving}
                  block
                >
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Settings;
