import React, { useState } from 'react';
import { Card, Form, Input, Button, Select, Typography, message, Steps, Alert, Tag, Space, Table } from 'antd';
import { FileTextOutlined, ThunderboltOutlined, SafetyOutlined } from '@ant-design/icons';
import { contractAPI } from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

function ContractGenerator({ user, role }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const contractCategories = [
    { value: '劳动合同', label: '劳动合同' },
    { value: '租赁合同', label: '房屋租赁合同' },
    { value: '买卖合同', label: '买卖合同' },
    { value: '借款合同', label: '借款合同' },
    { value: '服务合同', label: '服务合同' },
  ];

  const handleSubmit = async (values) => {
    if (!user) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await contractAPI.generate(values);
      if (res.data.success) {
        setResult(res.data);
        message.success('合同生成成功');
      }
    } catch (err) {
      message.error(err.response?.data?.error || '生成失败');
    } finally {
      setLoading(false);
    }
  };

  const riskLevelColor = {
    low: 'green',
    medium: 'orange',
    high: 'red',
  };

  const riskColumns = [
    { title: '风险点', dataIndex: 'point', key: 'point' },
    { title: '风险说明', dataIndex: 'risk', key: 'risk' },
    {
      title: '风险等级',
      dataIndex: 'level',
      key: 'level',
      render: (level) => <Tag color={riskLevelColor[level]}>{level === 'low' ? '低' : level === 'medium' ? '中' : '高'}</Tag>,
    },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>合同智能起草</Title>

      <Card>
        <Steps current={result ? 2 : 0} style={{ marginBottom: 40 }}>
          <Step title="选择模板" icon={<FileTextOutlined />} />
          <Step title="AI生成" icon={<ThunderboltOutlined />} />
          <Step title="风险审查" icon={<SafetyOutlined />} />
        </Steps>

        {!result ? (
          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item name="title" label="合同名称" rules={[{ required: true, message: '请输入合同名称' }]}>
              <Input placeholder="例如：2024年员工劳动合同" size="large" />
            </Form.Item>

            <Form.Item name="category" label="合同类型" rules={[{ required: true, message: '请选择合同类型' }]}>
              <Select placeholder="选择合同类型" size="large">
                {contractCategories.map(cat => (
                  <Option key={cat.value} value={cat.value}>{cat.label}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="clauses" label="特殊条款要求">
              <TextArea
                rows={4}
                placeholder="如有特殊条款要求，请在此描述，AI将为您定制合同内容..."
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                智能生成合同
              </Button>
            </Form.Item>

            <Alert
              message="智能合同说明"
              description="基于NLP训练的行业条款库，自动生成专业合同并高亮风险点。生成后可下载、打印或请律师审核。"
              type="info"
              showIcon
            />
          </Form>
        ) : (
          <div>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Alert
                message="合同生成成功"
                description="系统已为您生成标准合同，并自动识别了潜在风险点。"
                type="success"
                showIcon
              />

              <Card title="风险点审查" type="inner">
                <Table
                  dataSource={result.risk_points}
                  columns={riskColumns}
                  pagination={false}
                  rowKey="point"
                />
              </Card>

              <Card title="合同内容预览" type="inner">
                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: '#fafafa', padding: 20, borderRadius: 4, maxHeight: 400, overflow: 'auto' }}>
                  {result.content}
                </div>
              </Card>

              <Space style={{ marginTop: 16 }}>
                <Button type="primary" size="large">
                  下载合同 (PDF)
                </Button>
                <Button size="large">
                  打印合同
                </Button>
                <Button size="large">
                  请求律师审核
                </Button>
                <Link to="/contracts">
                  <Button>查看我的合同</Button>
                </Link>
              </Space>
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
}

export default ContractGenerator;
