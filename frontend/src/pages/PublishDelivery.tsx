import React from 'react';
import { Card, Form, Input, Select, InputNumber, Button, message, DatePicker, Space } from 'antd';
import { PlusOutlined, EnvironmentOutlined, CalculatorOutlined, CarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const { Option } = Select;
const { TextArea } = Input;

function PublishDelivery() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useAuth();

  const vehicleTypes = ['厢式货车', '平板货车', '高栏货车', '冷藏车', '自卸车', '其他'];
  const goodsTypes = ['普通货物', '易碎品', '生鲜冷链', '危险品', '家具家电', '其他'];

  const onFinish = async (values: any) => {
    try {
      await api.post('/delivery-orders', {
        ...values,
        base_price: values.bid_start_price,
      });
      message.success('发布成功');
      navigate('/delivery');
    } catch (error: any) {
      message.error(error.response?.data?.error || '发布失败');
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <Card title="发布找车需求" extra={<Button onClick={() => navigate(-1)}>返回</Button>}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            vehicle_type_required: '厢式货车',
            weight: 1,
            volume: 2,
            bid_start_price: 200,
          }}
        >
          <Form.Item label="需求标题" name="title" rules={[{ required: true, message: '请输入需求标题' }]}>
            <Input placeholder="请简要描述您的货运需求" size="large" />
          </Form.Item>

          <Form.Item label="所需车型" name="vehicle_type_required" rules={[{ required: true, message: '请选择车型' }]}>
            <Select placeholder="请选择车型">
              {vehicleTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="货物信息">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="weight" noStyle rules={[{ required: true, message: '请输入重量' }]}>
                <InputNumber style={{ width: '50%' }} min={0} addonBefore="重量" addonAfter="吨" />
              </Form.Item>
              <Form.Item name="volume" noStyle rules={[{ required: true, message: '请输入体积' }]}>
                <InputNumber style={{ width: '50%' }} min={0} addonBefore="体积" addonAfter="m³" />
              </Form.Item>
            </Space.Compact>
          </Form.Item>

          <Form.Item label="货物类型" name="goods_type">
            <Select placeholder="请选择货物类型">
              {goodsTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="发货地址">
            <Form.Item name="pickup_address" noStyle rules={[{ required: true, message: '请输入发货地址' }]}>
              <Input placeholder="请输入发货详细地址" prefix={<EnvironmentOutlined />} />
            </Form.Item>
          </Form.Item>

          <Form.Item label="收货地址">
            <Form.Item name="delivery_address" noStyle rules={[{ required: true, message: '请输入收货地址' }]}>
              <Input placeholder="请输入收货详细地址" prefix={<EnvironmentOutlined />} />
            </Form.Item>
          </Form.Item>

          <Form.Item label="预计距离 (公里)" name="distance">
            <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入预计运输距离" />
          </Form.Item>

          <Form.Item label="起拍价格 (元)" name="bid_start_price" rules={[{ required: true, message: '请输入起拍价' }]}>
            <InputNumber style={{ width: '100%' }} min={1} placeholder="请输入起拍价格，司机将在此基础上竞价" />
          </Form.Item>

          <Form.Item label="期望取货时间" name="pickup_time">
            <DatePicker showTime style={{ width: '100%' }} placeholder="选择期望取货时间" />
          </Form.Item>

          <Form.Item label="货物描述" name="description">
            <TextArea rows={4} placeholder="请详细描述货物情况，包括包装、装卸要求等" />
          </Form.Item>

          <Card size="small" style={{ marginBottom: 24, background: '#f5f5f5', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalculatorOutlined /> 起拍价格
              </span>
              <span style={{ fontSize: 24, fontWeight: 600, color: '#fa8c16' }}>
                ¥{form.getFieldValue('bid_start_price') || 0}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
              最终价格以司机竞价结果为准
            </div>
          </Card>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" size="large" htmlType="submit" block>
              <PlusOutlined /> 发布找车需求
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default PublishDelivery;
