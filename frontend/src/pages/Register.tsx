import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Radio, Checkbox, InputNumber, Select, Divider, Alert } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, SafetyCertificateOutlined, CarOutlined, ToolOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const { Option } = Select;
const { TextArea } = Input;

const WORKER_SKILLS = ['水电工', '木工', '瓦工', '搬运工', '家政保洁', '油漆工', '电工', '管道工', '空调维修', '家电维修'];
const VEHICLE_TYPES = ['厢式货车', '平板货车', '高栏货车', '冷藏车', '自卸货车', '集装箱车', '面包车'];

function Register() {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('employer');
  const [insuranceVerified, setInsuranceVerified] = useState<boolean | null>(null);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const verifyInsurance = (insuranceNo: string) => {
    if (insuranceNo && insuranceNo.length >= 8) {
      setInsuranceVerified(true);
      message.success('保险凭证核验通过');
    } else {
      setInsuranceVerified(false);
      message.error('保险凭证号格式不正确，请输入至少8位');
    }
  };

  const onFinish = async (values: any) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    if (role === 'driver' && insuranceVerified !== true) {
      message.error('请先完成保险凭证核验');
      return;
    }

    setLoading(true);
    try {
      const registerData: any = await register({
        username: values.username,
        password: values.password,
        real_name: values.real_name,
        phone: values.phone,
        role,
      });

      if (role === 'worker') {
        await api.put('/auth/worker-profile', {
          skills: values.skills || [],
          service_radius: values.service_radius || 5,
          hourly_rate: values.hourly_rate || 50,
          task_rate: 200,
          bio: values.bio || '',
        });
      } else if (role === 'driver') {
        await api.put('/auth/driver-profile', {
          vehicle_type: values.vehicle_type || '厢式货车',
          vehicle_brand: values.vehicle_brand || '',
          plate_number: values.plate_number || '',
          load_capacity: values.load_capacity || 1,
          vehicle_length: values.vehicle_length || 4.2,
          bio: values.bio || '',
        });
      }

      message.success('注册成功');
      navigate('/');
    } catch (error: any) {
      message.error(error.response?.data?.error || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
      padding: 20,
    }}>
      <Card 
        style={{ width: 420, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        title={<div style={{ textAlign: 'center', fontSize: 24, color: '#1890ff' }}>注册账号</div>}
      >
        <div style={{ marginBottom: 24 }}>
          <Radio.Group 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-around' }}
          >
            <Radio.Button value="employer">我是雇主</Radio.Button>
            <Radio.Button value="worker">我是工人</Radio.Button>
            <Radio.Button value="driver">我是司机</Radio.Button>
          </Radio.Group>
        </div>

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          layout="vertical"
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '用户名至少3个字符' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            label="真实姓名"
            name="real_name"
            rules={[{ required: true, message: '请输入真实姓名' }]}
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>

          <Form.Item
            label="手机号"
            name="phone"
            rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6个字符' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirmPassword"
            rules={[{ required: true, message: '请确认密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" />
          </Form.Item>

          {role === 'worker' && (
            <>
              <Divider orientation="left">
                <ToolOutlined style={{ marginRight: 8 }} />
                工人技能资料
              </Divider>
              
              <Form.Item
                label="技能标签"
                name="skills"
                rules={[{ required: true, message: '请选择至少一项技能' }]}
              >
                <Checkbox.Group style={{ width: '100%' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {WORKER_SKILLS.map(skill => (
                      <Checkbox key={skill} value={skill}>{skill}</Checkbox>
                    ))}
                  </div>
                </Checkbox.Group>
              </Form.Item>

              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item
                  label="服务半径 (km)"
                  name="service_radius"
                  initialValue={5}
                  rules={[{ required: true, message: '请输入服务半径' }]}
                  style={{ flex: 1 }}
                >
                  <InputNumber min={1} max={100} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  label="时薪 (元/小时)"
                  name="hourly_rate"
                  initialValue={50}
                  rules={[{ required: true, message: '请输入时薪' }]}
                  style={{ flex: 1 }}
                >
                  <InputNumber min={10} max={1000} style={{ width: '100%' }} />
                </Form.Item>
              </div>

              <Form.Item
                label="个人简介"
                name="bio"
              >
                <TextArea rows={3} placeholder="请简单介绍您的工作经验和专业能力" maxLength={200} showCount />
              </Form.Item>
            </>
          )}

          {role === 'driver' && (
            <>
              <Divider orientation="left">
                <CarOutlined style={{ marginRight: 8 }} />
                司机车辆资料
              </Divider>

              <Form.Item
                label="车型"
                name="vehicle_type"
                initialValue="厢式货车"
                rules={[{ required: true, message: '请选择车型' }]}
              >
                <Select>
                  {VEHICLE_TYPES.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="车牌号"
                name="plate_number"
                rules={[{ required: true, message: '请输入车牌号' }, { pattern: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4,5}[A-Z0-9挂学警港澳]?$/, message: '请输入正确的车牌号' }]}
              >
                <Input placeholder="例如：京A12345" maxLength={10} />
              </Form.Item>

              <div style={{ display: 'flex', gap: 16 }}>
                <Form.Item
                  label="载重 (吨)"
                  name="load_capacity"
                  initialValue={1}
                  rules={[{ required: true, message: '请输入载重' }]}
                  style={{ flex: 1 }}
                >
                  <InputNumber min={0.5} max={50} step={0.5} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  label="车长 (米)"
                  name="vehicle_length"
                  initialValue={4.2}
                  rules={[{ required: true, message: '请输入车长' }]}
                  style={{ flex: 1 }}
                >
                  <InputNumber min={2} max={20} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
              </div>

              <Form.Item
                label="车辆品牌"
                name="vehicle_brand"
              >
                <Input placeholder="例如：东风、解放、江淮等" />
              </Form.Item>

              <Divider orientation="left">
                <SafetyCertificateOutlined style={{ marginRight: 8 }} />
                保险凭证核验
              </Divider>

              <Alert
                type="info"
                showIcon
                message="保险凭证核验要求"
                description="请输入有效的保险凭证号进行核验，核验通过后方可注册。"
                style={{ marginBottom: 16 }}
              />

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Form.Item
                  label="保险凭证号"
                  name="insurance_certificate_no"
                  style={{ flex: 1, marginBottom: 0 }}
                >
                  <Input placeholder="请输入至少8位保险凭证号" />
                </Form.Item>
                <Button 
                  onClick={() => {
                    const values = form.getFieldsValue();
                    verifyInsurance(values.insurance_certificate_no || '');
                  }}
                  style={{ marginTop: 30 }}
                  type={insuranceVerified === true ? 'default' : 'primary'}
                  disabled={insuranceVerified === true}
                >
                  {insuranceVerified === true ? '已核验' : '核验'}
                </Button>
              </div>
              {insuranceVerified === true && (
                <div style={{ color: '#52c41a', fontSize: 13, marginTop: 8 }}>
                  ✓ 保险凭证核验通过
                </div>
              )}
              {insuranceVerified === false && (
                <div style={{ color: '#ff4d4f', fontSize: 13, marginTop: 8 }}>
                  ✗ 保险凭证核验未通过，请重新输入
                </div>
              )}

              <Form.Item
                label="个人简介"
                name="bio"
                style={{ marginTop: 16 }}
              >
                <TextArea rows={3} placeholder="请简单介绍您的运输经验和熟悉路线" maxLength={200} showCount />
              </Form.Item>
            </>
          )}

          <Form.Item style={{ marginTop: 24 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%' }}
              size="large"
            >
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', color: '#8c8c8c', fontSize: 13 }}>
            已有账号？
            <a onClick={() => navigate('/login')} style={{ color: '#1890ff' }}>立即登录</a>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default Register;
