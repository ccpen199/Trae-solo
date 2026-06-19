import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Select, Button, Row, Col, message, Tag } from 'antd';
import { EnvironmentOutlined, WarningOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../api';

const categoryOptions = [
  { value: 'discussion', label: '讨论' },
  { value: 'secondhand', label: '二手' },
  { value: 'activity', label: '活动' },
  { value: 'complaint', label: '投诉' },
];

const TopicCreate: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [sensitiveWords, setSensitiveWords] = useState<string[]>([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const checkSensitive = async (content: string) => {
    if (!content) return;
    try {
      const { data } = await api.post('/topics/check-sensitive', { content });
      setSensitiveWords(data.words || []);
    } catch {
      setSensitiveWords([]);
    }
  };

  const handleSubmit = async (values: {
    title: string;
    content: string;
    category: string;
    geoLat: number;
    geoLng: number;
    geoLabel: string;
  }) => {
    setLoading(true);
    try {
      await api.post('/topics', values);
      message.success('发布成功');
      navigate('/topics');
    } catch {
      message.error('发布失败');
    } finally {
      setLoading(false);
    }
  };

  const contentValue = Form.useWatch('content', form);

  return (
    <div>
      <Card title="发布新话题">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ category: 'discussion' }}
        >
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入话题标题" maxLength={100} showCount />
          </Form.Item>

          <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select options={categoryOptions} />
          </Form.Item>

          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <Input.TextArea rows={6} placeholder="请输入话题内容" />
          </Form.Item>

          {sensitiveWords.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Tag color="warning" icon={<WarningOutlined />}>
                检测到敏感词
              </Tag>
              {sensitiveWords.map((w) => (
                <Tag key={w} color="red">{w}</Tag>
              ))}
              <span style={{ color: '#888', marginLeft: 8 }}>发布后将自动过滤</span>
            </div>
          )}

          <Card size="small" title="地理位置" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="geoLat" label="纬度">
                  <Input type="number" placeholder="如 30.57" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="geoLng" label="经度">
                  <Input type="number" placeholder="如 104.07" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="geoLabel" label="位置标签">
                  <Input prefix={<EnvironmentOutlined />} placeholder="如 3号楼" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <div style={{ textAlign: 'right' }}>
            <Button
              style={{ marginRight: 8 }}
              icon={<EyeOutlined />}
              onClick={() => {
                setPreviewing(!previewing);
                checkSensitive(contentValue || '');
              }}
            >
              {previewing ? '关闭预览' : '预览'}
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              发布话题
            </Button>
          </div>
        </Form>
      </Card>

      {previewing && (
        <Card title="预览" style={{ marginTop: 16 }}>
          <h2>{form.getFieldValue('title') || '未填写标题'}</h2>
          <Tag>{categoryOptions.find((c) => c.value === form.getFieldValue('category'))?.label}</Tag>
          <p style={{ marginTop: 16, lineHeight: 1.8 }}>{form.getFieldValue('content') || '未填写内容'}</p>
          {form.getFieldValue('geoLabel') && (
            <div style={{ color: '#888' }}>
              <EnvironmentOutlined /> {form.getFieldValue('geoLabel')}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default TopicCreate;
