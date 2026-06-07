import React, { useState } from 'react';
import { Form, Input, InputNumber, Select, Button, Card, message, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const { Title } = Typography;

export default function CreditProfileForm() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await api.post('/credit/profiles', values);
      message.success('信用画像创建成功');
      navigate('/credit');
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/credit')} style={{ marginBottom: 16 }}>返回列表</Button>
      <Title level={4}>新建信用画像</Title>
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 600 }}>
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}><Input /></Form.Item>
          <Form.Item label="身份证号" name="id_card" rules={[{ required: true, message: '请输入身份证号' }]}><Input maxLength={18} /></Form.Item>
          <Form.Item label="类型" name="type" rules={[{ required: true, message: '请选择类型' }]}>
            <Select><Select.Option value="farmer">农户</Select.Option><Select.Option value="merchant">商户</Select.Option></Select>
          </Form.Item>
          <Form.Item label="乡镇" name="town"><Input /></Form.Item>
          <Form.Item label="村/社区" name="village"><Input /></Form.Item>
          <Form.Item label="土地面积(亩)" name="land_area"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="土地确权证号" name="land_cert_no"><Input /></Form.Item>
          <Form.Item label="补贴汇总(元)" name="subsidy_total"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="经营收入(元)" name="business_income"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="信用评分" name="credit_score"><InputNumber min={0} max={1000} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="信用等级" name="credit_level">
            <Select allowClear><Select.Option value="AAA">AAA</Select.Option><Select.Option value="AA">AA</Select.Option><Select.Option value="A">A</Select.Option><Select.Option value="B">B</Select.Option><Select.Option value="C">C</Select.Option><Select.Option value="D">D</Select.Option></Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>提交</Button>
            <Button style={{ marginLeft: 8 }} onClick={() => navigate('/credit')}>取消</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
