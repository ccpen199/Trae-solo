import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Button, Card, Space, message, Row, Col } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getCrops, getFarmers, createPolicy } from '../../utils/api.js';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

function PolicyCreate() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [farmers, setFarmers] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDict();
  }, []);

  const loadDict = async () => {
    try {
      const [farmersRes, cropsRes] = await Promise.all([getFarmers(), getCrops()]);
      setFarmers(farmersRes.data || []);
      setCrops(cropsRes.data || []);
    } catch (e) {
      message.error('加载数据失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const data = {
        ...values,
        start_date: values.date_range[0].format('YYYY-MM-DD'),
        end_date: values.date_range[1].format('YYYY-MM-DD'),
        deductible_ratio: (values.deductible_ratio || 0) / 100
      };
      delete data.date_range;
      await createPolicy(data);
      message.success('创建成功');
      navigate('/policies');
    } catch (e) {
      message.error('创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/policies')}>返回列表</Button>
      </Space>

      <Card title="新增保单">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ deductible_ratio: 10 }}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="farmer_id"
                label="农户"
                rules={[{ required: true, message: '请选择农户' }]}
              >
                <Select placeholder="请选择农户">
                  {farmers.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="crop_type"
                label="作物类型"
                rules={[{ required: true, message: '请选择作物类型' }]}
              >
                <Select placeholder="请选择作物类型">
                  {crops.map(c => <Option key={c.code} value={c.code}>{c.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="crop_variety"
                label="作物品种"
                rules={[{ required: true, message: '请输入作物品种' }]}
              >
                <Input placeholder="请输入作物品种" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="area"
                label="投保面积(亩)"
                rules={[{ required: true, message: '请输入投保面积' }]}
              >
                <InputNumber placeholder="请输入投保面积" min={0.01} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="plot_location"
                label="地块位置"
                rules={[{ required: true, message: '请输入地块位置' }]}
              >
                <Input placeholder="请输入地块位置" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="plot_longitude"
                label="经度"
                rules={[{ required: true, message: '请输入经度' }]}
              >
                <InputNumber placeholder="经度" step={0.000001} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="plot_latitude"
                label="纬度"
                rules={[{ required: true, message: '请输入纬度' }]}
              >
                <InputNumber placeholder="纬度" step={0.000001} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="insurance_amount"
                label="保险金额(元)"
                rules={[{ required: true, message: '请输入保险金额' }]}
              >
                <InputNumber placeholder="请输入保险金额" min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="premium"
                label="保费(元)"
                rules={[{ required: true, message: '请输入保费' }]}
              >
                <InputNumber placeholder="请输入保费" min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="date_range"
                label="保险起止日期"
                rules={[{ required: true, message: '请选择保险起止日期' }]}
              >
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="deductible_ratio"
                label="免赔率(%)"
                rules={[{ required: true, message: '请输入免赔率' }]}
              >
                <InputNumber placeholder="请输入免赔率" min={0} max={100} step={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="deductible_clause"
                label="免赔条款"
              >
                <TextArea rows={3} placeholder="请输入免赔条款" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>提交</Button>
              <Button onClick={() => navigate('/policies')}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default PolicyCreate;
