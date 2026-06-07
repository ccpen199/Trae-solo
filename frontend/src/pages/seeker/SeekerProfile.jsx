import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Row, Col, Select, message, Spin, Avatar, Upload } from 'antd';
import { UserOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import api from '../../utils/api';
import useAuthStore from '../../store/authStore';

const { TextArea } = Input;
const { Option } = Select;

const SeekerProfile = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { getCurrentUser } = useAuthStore();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/job-seekers/profile');
      form.setFieldsValue(res.data.profile || {});
    } catch (e) {
      message.error('加载个人资料失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      await api.put('/job-seekers/profile', values);
      message.success('保存成功');
      getCurrentUser();
    } catch (e) {
      message.error(e.response?.data?.error || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header">
        <h2>个人资料</h2>
      </div>

      <Row gutter={24}>
        <Col xs={24} md={8}>
          <Card className="card-shadow" style={{ textAlign: 'center' }}>
            <Avatar size={120} icon={<UserOutlined />} style={{ background: '#1677ff', marginBottom: 16 }} />
            <Form layout="vertical">
              <Form.Item>
                <Upload
                  showUploadList={false}
                  beforeUpload={(file) => {
                    const isImage = file.type.startsWith('image/');
                    if (!isImage) {
                      message.error('只能上传图片文件');
                    }
                    return isImage;
                  }}
                >
                  <Button icon={<UploadOutlined />}>更换头像</Button>
                </Upload>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card className="card-shadow">
            <div className="section-title">基本信息</div>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              size="large"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="真实姓名"
                    rules={[{ required: true, message: '请输入真实姓名' }]}
                  >
                    <Input placeholder="请输入真实姓名" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="gender"
                    label="性别"
                    rules={[{ required: true, message: '请选择性别' }]}
                  >
                    <Select placeholder="请选择性别">
                      <Option value="男">男</Option>
                      <Option value="女">女</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="age"
                    label="年龄"
                    rules={[
                      { required: true, message: '请输入年龄' },
                      { type: 'number', min: 18, max: 65, message: '年龄应在18-65岁之间' },
                    ]}
                  >
                    <Input type="number" placeholder="请输入年龄" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="education"
                    label="最高学历"
                    rules={[{ required: true, message: '请选择学历' }]}
                  >
                    <Select placeholder="请选择学历">
                      <Option value="高中">高中/中专</Option>
                      <Option value="大专">大专</Option>
                      <Option value="本科">本科</Option>
                      <Option value="硕士">硕士</Option>
                      <Option value="博士">博士</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="手机号码"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                    ]}
                  >
                    <Input placeholder="请输入手机号" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="电子邮箱"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入正确的邮箱地址' },
                    ]}
                  >
                    <Input placeholder="请输入邮箱地址" />
                  </Form.Item>
                </Col>
              </Row>

              <div className="section-title" style={{ marginTop: 24 }}>求职意向</div>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="expected_salary_min"
                    label="期望最低薪资（元/月）"
                    rules={[{ required: true, message: '请输入期望最低薪资' }]}
                  >
                    <Input type="number" placeholder="请输入期望最低薪资" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="expected_salary_max"
                    label="期望最高薪资（元/月）"
                    rules={[{ required: true, message: '请输入期望最高薪资' }]}
                  >
                    <Input type="number" placeholder="请输入期望最高薪资" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="expected_city"
                    label="期望工作城市"
                    rules={[{ required: true, message: '请输入期望工作城市' }]}
                  >
                    <Select placeholder="请选择期望城市">
                      <Option value="上海">上海</Option>
                      <Option value="苏州">苏州</Option>
                      <Option value="深圳">深圳</Option>
                      <Option value="东莞">东莞</Option>
                      <Option value="广州">广州</Option>
                      <Option value="无锡">无锡</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="work_years"
                    label="工作年限"
                    rules={[{ required: true, message: '请输入工作年限' }]}
                  >
                    <Input type="number" placeholder="请输入工作年限" addonAfter="年" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="self_introduction"
                label="自我评价"
              >
                <TextArea rows={4} placeholder="介绍一下自己，让HR更好地了解您" maxLength={500} showCount />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={saving}
                  icon={<SaveOutlined />}
                  style={{ height: 44, minWidth: 160 }}
                >
                  保存资料
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SeekerProfile;
