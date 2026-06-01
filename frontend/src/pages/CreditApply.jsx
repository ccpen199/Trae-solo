import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Steps,
  Form,
  Input,
  Select,
  Button,
  Card,
  Upload,
  message,
  Row,
  Col,
} from 'antd';
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { creditAPI } from '../services/api';
import AppLayout from '../components/Layout';

const { Step } = Steps;
const { Option } = Select;

const CreditApply = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form1] = Form.useForm();
  const [form2] = Form.useForm();
  const [idCardFront, setIdCardFront] = useState(false);
  const [idCardBack, setIdCardBack] = useState(false);

  if (!id) {
    return (
      <AppLayout title="授信申请">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>无效的申请ID</p>
          <Button type="primary" onClick={() => navigate('/products')}>
            返回产品列表
          </Button>
        </div>
      </AppLayout>
    );
  }

  const steps = [
    { title: '上传身份证', description: '请上传身份证正反面' },
    { title: '个人信息', description: '填写个人基本信息' },
    { title: '联系人信息', description: '填写紧急联系人信息' },
  ];

  const handleUpload = (file, type) => {
    try {
      if (!file) {
        message.error('未选择文件');
        return false;
      }
      const isImage = file.type?.startsWith('image/');
      if (!isImage) {
        message.error('请上传图片文件');
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        message.error('图片大小不能超过10MB');
        return false;
      }
      if (type === 'front') {
        setIdCardFront(true);
      } else {
        setIdCardBack(true);
      }
      message.success('上传成功');
    } catch (e) {
      message.error('上传失败: ' + (e.message || '未知错误'));
    }
    return false;
  };

  const saveIdCard = async () => {
    if (!idCardFront || !idCardBack) {
      message.error('请上传身份证正反面');
      return false;
    }
    try {
      setLoading(true);
      await creditAPI.saveIdCard(id, {
        idCardFront: 'uploaded',
        idCardBack: 'uploaded',
        ocrData: { name: '测试用户', idCard: '110101199001011234' },
      });
      message.success('身份证信息已保存');
      return true;
    } catch (err) {
      message.error('保存失败，请重试');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const savePersonalInfo = async () => {
    try {
      setLoading(true);
      const values = await form1.validateFields();
      await creditAPI.savePersonalInfo(id, values);
      message.success('个人信息已保存');
      return true;
    } catch (err) {
      if (err.errorFields) {
        message.error('请填写完整的个人信息');
      } else {
        message.error('保存失败，请重试');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const saveContactInfo = async () => {
    try {
      setLoading(true);
      const values = await form2.validateFields();
      await creditAPI.saveContactInfo(id, values);
      message.success('申请提交成功');
      navigate(`/credit/result/${id}`);
      return true;
    } catch (err) {
      if (err.errorFields) {
        message.error('请填写完整的联系人信息');
      } else {
        message.error('提交失败，请重试');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const next = async () => {
    let success = false;
    if (current === 0) {
      success = await saveIdCard();
    } else if (current === 1) {
      success = await savePersonalInfo();
    }
    if (success) {
      setCurrent(current + 1);
    }
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  return (
    <AppLayout title="授信申请">
      <div className="page-container">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/products')}
          style={{ marginBottom: 16 }}
        >
          返回
        </Button>

        <Steps current={current} items={steps} style={{ marginBottom: 24 }} />

        <div className="step-content">
          {current === 0 && (
            <Card title="请上传身份证照片">
              <Row gutter={16}>
                <Col span={12}>
                  <p style={{ marginBottom: 8 }}>身份证正面</p>
                  <Upload
                    listType="picture-card"
                    showUploadList={false}
                    beforeUpload={(file) => handleUpload(file, 'front')}
                  >
                    {idCardFront ? (
                      <div>
                        <div style={{ fontSize: 24, color: '#52c41a' }}>✓</div>
                        <div style={{ marginTop: 8, color: '#52c41a' }}>已上传</div>
                      </div>
                    ) : (
                      <div>
                        <UploadOutlined />
                        <div style={{ marginTop: 8 }}>点击上传</div>
                      </div>
                    )}
                  </Upload>
                </Col>
                <Col span={12}>
                  <p style={{ marginBottom: 8 }}>身份证反面</p>
                  <Upload
                    listType="picture-card"
                    showUploadList={false}
                    beforeUpload={(file) => handleUpload(file, 'back')}
                  >
                    {idCardBack ? (
                      <div>
                        <div style={{ fontSize: 24, color: '#52c41a' }}>✓</div>
                        <div style={{ marginTop: 8, color: '#52c41a' }}>已上传</div>
                      </div>
                    ) : (
                      <div>
                        <UploadOutlined />
                        <div style={{ marginTop: 8 }}>点击上传</div>
                      </div>
                    )}
                  </Upload>
                </Col>
              </Row>
            </Card>
          )}

          {current === 1 && (
            <Card title="请填写个人基本信息">
              <Form form={form1} layout="vertical">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="name"
                      label="姓名"
                      rules={[{ required: true, message: '请输入姓名' }]}
                    >
                      <Input placeholder="请输入姓名" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="idCard"
                      label="身份证号"
                      rules={[
                        { required: true, message: '请输入身份证号' },
                        { pattern: /^\d{17}[\dXx]$/, message: '身份证号格式不正确' },
                      ]}
                    >
                      <Input placeholder="请输入身份证号" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="education"
                      label="学历"
                      rules={[{ required: true, message: '请选择学历' }]}
                    >
                      <Select placeholder="请选择学历">
                        <Option value="high_school">高中及以下</Option>
                        <Option value="college">大专</Option>
                        <Option value="bachelor">本科</Option>
                        <Option value="master">硕士及以上</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="maritalStatus"
                      label="婚姻状况"
                      rules={[{ required: true, message: '请选择婚姻状况' }]}
                    >
                      <Select placeholder="请选择">
                        <Option value="single">未婚</Option>
                        <Option value="married">已婚</Option>
                        <Option value="divorced">离异</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item
                  name="address"
                  label="居住地址"
                  rules={[{ required: true, message: '请输入居住地址' }]}
                >
                  <Input placeholder="请输入详细居住地址" />
                </Form.Item>
                <Form.Item
                  name="company"
                  label="工作单位"
                  rules={[{ required: true, message: '请输入工作单位' }]}
                >
                  <Input placeholder="请输入工作单位名称" />
                </Form.Item>
              </Form>
            </Card>
          )}

          {current === 2 && (
            <Card title="请填写紧急联系人信息">
              <Form form={form2} layout="vertical">
                <p style={{ marginBottom: 16, color: '#666' }}>
                  请填写两位紧急联系人，我们承诺不会泄露您的个人信息
                </p>
                <Card size="small" title="第一联系人" style={{ marginBottom: 16 }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        name={['contact1', 'name']}
                        label="姓名"
                        rules={[{ required: true, message: '请输入姓名' }]}
                      >
                        <Input placeholder="姓名" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name={['contact1', 'phone']}
                        label="手机号"
                        rules={[
                          { required: true, message: '请输入手机号' },
                          { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
                        ]}
                      >
                        <Input placeholder="手机号" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name={['contact1', 'relation']}
                        label="关系"
                        rules={[{ required: true, message: '请选择关系' }]}
                      >
                        <Select placeholder="请选择">
                          <Option value="parent">父母</Option>
                          <Option value="spouse">配偶</Option>
                          <Option value="sibling">兄弟姐妹</Option>
                          <Option value="friend">朋友</Option>
                          <Option value="colleague">同事</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
                <Card size="small" title="第二联系人">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        name={['contact2', 'name']}
                        label="姓名"
                        rules={[{ required: true, message: '请输入姓名' }]}
                      >
                        <Input placeholder="姓名" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name={['contact2', 'phone']}
                        label="手机号"
                        rules={[
                          { required: true, message: '请输入手机号' },
                          { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
                        ]}
                      >
                        <Input placeholder="手机号" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name={['contact2', 'relation']}
                        label="关系"
                        rules={[{ required: true, message: '请选择关系' }]}
                      >
                        <Select placeholder="请选择">
                          <Option value="parent">父母</Option>
                          <Option value="spouse">配偶</Option>
                          <Option value="sibling">兄弟姐妹</Option>
                          <Option value="friend">朋友</Option>
                          <Option value="colleague">同事</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              </Form>
            </Card>
          )}

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            {current > 0 && (
              <Button style={{ marginRight: 8 }} onClick={prev} disabled={loading}>
                上一步
              </Button>
            )}
            {current < steps.length - 1 && (
              <Button type="primary" loading={loading} onClick={next}>
                下一步
              </Button>
            )}
            {current === steps.length - 1 && (
              <Button type="primary" loading={loading} onClick={saveContactInfo}>
                提交申请
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CreditApply;
