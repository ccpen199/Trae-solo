import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Input, Select, DatePicker, InputNumber, Button, Space, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getDisasters, getPolicies, createReport } from '../../utils/api.js';

const disasterLabels = { DROUGHT: '旱灾', FLOOD: '洪涝', HAIL: '冰雹', TYPHOON: '台风', FREEZE: '冻害', PEST: '病虫害', FIRE: '火灾', OTHER: '其他' };
const statusColors = {
  pending: 'orange',
  surveying: 'blue',
  surveyed: 'cyan',
  approved: 'green',
  rejected: 'red',
  paid: 'purple'
};

const statusLabels = {
  pending: '待查勘',
  surveying: '查勘中',
  surveyed: '已查勘',
  approved: '已通过',
  rejected: '已拒赔',
  paid: '已赔付'
};

function ReportCreate() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [disasters, setDisasters] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDisasters();
    loadPolicies();
  }, []);

  const loadDisasters = async () => {
    try {
      const res = await getDisasters();
      setDisasters(res.data || []);
    } catch (e) {
      console.error('Load disasters failed:', e);
      message.error('加载灾害类型失败');
    }
  };

  const loadPolicies = async () => {
    try {
      const res = await getPolicies({ payment_status: 'paid', status: 'active' });
      setPolicies(res.data.data || []);
    } catch (e) {
      console.error('Load policies failed:', e);
      message.error('加载保单列表失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      
      const submitData = {
        ...values,
        disaster_time: values.disaster_time ? values.disaster_time.format('YYYY-MM-DD HH:mm:ss') : null
      };
      
      if (submitData.photos) {
        try {
          JSON.parse(submitData.photos);
        } catch (e) {
          message.error('照片格式不正确，请输入有效的JSON字符串');
          setSubmitting(false);
          return;
        }
      }
      
      const res = await createReport(submitData);
      message.success('报案创建成功');
      navigate(`/reports/${res.data.id}`);
    } catch (e) {
      console.error('Create report failed:', e);
      if (e.errorFields) {
        return;
      }
      message.error(e.response?.data?.message || '创建报案失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/reports');
  };

  return (
    <div>
      <div className="page-header">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleCancel}
          style={{ marginRight: 16 }}
        >
          返回列表
        </Button>
        <span className="page-title">新增报案</span>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            damaged_area: 0
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="policy_id"
                label="选择保单"
                rules={[{ required: true, message: '请选择保单' }]}
              >
                <Select placeholder="请选择已支付保费的有效保单">
                  {policies.map(p => (
                    <Select.Option key={p.id} value={p.id}>
                      {p.policy_no} - {p.farmer_name} - {p.crop_type}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="disaster_type"
                label="灾害类型"
                rules={[{ required: true, message: '请选择灾害类型' }]}
              >
                <Select placeholder="请选择灾害类型">
                  {Object.entries(disasterLabels).map(([value, label]) => (
                    <Select.Option key={value} value={value}>{label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="disaster_time"
                label="灾害发生时间"
                rules={[{ required: true, message: '请选择灾害发生时间' }]}
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD HH:mm:ss"
                  maxDate={dayjs()}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                name="description"
                label="灾害描述"
                rules={[{ required: true, message: '请输入灾害描述' }]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="请详细描述灾害情况"
                  maxLength={1000}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={16}>
              <Form.Item
                name="location"
                label="位置地址"
                rules={[{ required: true, message: '请输入位置地址' }]}
              >
                <Input placeholder="请输入灾害发生地址" />
              </Form.Item>
            </Col>
            <Col xs={12} sm={4}>
              <Form.Item
                name="latitude"
                label="纬度"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="纬度"
                  min={-90}
                  max={90}
                  step={0.000001}
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={4}>
              <Form.Item
                name="longitude"
                label="经度"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="经度"
                  min={-180}
                  max={180}
                  step={0.000001}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="damaged_area"
                label="受损面积(亩)"
                rules={[{ required: true, message: '请输入受损面积' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入受损面积"
                  min={0}
                  step={0.01}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="emergency_contact"
                label="紧急联系人"
                rules={[{ required: true, message: '请输入紧急联系人' }]}
              >
                <Input placeholder="请输入紧急联系人姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="emergency_phone"
                label="紧急联系电话"
                rules={[
                  { required: true, message: '请输入紧急联系电话' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
                ]}
              >
                <Input placeholder="请输入紧急联系电话" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                name="photos"
                label="照片"
                help='请输入JSON字符串，例如：["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]'
              >
                <Input.TextArea
                  rows={4}
                  placeholder='请输入照片JSON字符串，例如：["https://example.com/photo1.jpg"]'
                />
              </Form.Item>
            </Col>
          </Row>

          <Row>
            <Col xs={24} style={{ textAlign: 'center' }}>
              <Space>
                <Button size="large" onClick={handleCancel}>
                  取消
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={submitting}
                  onClick={handleSubmit}
                >
                  提交报案
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
}

export default ReportCreate;
