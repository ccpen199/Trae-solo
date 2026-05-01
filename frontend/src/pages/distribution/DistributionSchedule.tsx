import React from 'react';
import { Card, Form, Input, Select, DatePicker, Button, Space, message, Row, Col } from 'antd';
import { SendOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const DistributionSchedule: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const channels = [
    { value: 'WEB', label: '官网' },
    { value: 'APP', label: 'App' },
    { value: 'WECHAT', label: '微信公众号' },
    { value: 'WEIBO', label: '微博' },
    { value: 'DOUYIN', label: '抖音' },
    { value: 'XIAOHONGSHU', label: '小红书' },
    { value: 'ZHIHU', label: '知乎' },
  ];

  const mockContents = [
    { id: '1', title: '年度工作总结报告' },
    { id: '2', title: '新产品发布公告' },
    { id: '3', title: '公司重要通知' },
  ];

  const handleSubmit = (values: any) => {
    console.log('Schedule distribution:', values);
    message.success('已创建定时分发任务');
    navigate('/distribution');
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/distribution')}
          style={{ marginBottom: 8 }}
        >
          返回分发列表
        </Button>
        <h2 style={{ margin: 0 }}>定时分发</h2>
      </div>

      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="contentId"
                label="选择内容"
                rules={[{ required: true, message: '请选择要分发的内容' }]}
              >
                <Select placeholder="选择已审核通过的内容" showSearch optionFilterProp="children">
                  {mockContents.map((content) => (
                    <Select.Option key={content.id} value={content.id}>
                      {content.title}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="channels"
                label="选择渠道"
                rules={[{ required: true, message: '请选择分发渠道' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="选择分发渠道"
                  options={channels}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="scheduledAt"
                label="定时发布时间"
                rules={[{ required: true, message: '请选择发布时间' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
              >
                <Select placeholder="选择优先级" defaultValue="normal">
                  <Select.Option value="high">高优先级</Select.Option>
                  <Select.Option value="normal">正常</Select.Option>
                  <Select.Option value="low">低优先级</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="备注说明"
          >
            <Input.TextArea rows={3} placeholder="请输入分发备注说明" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />} size="large">
                创建定时任务
              </Button>
              <Button onClick={() => navigate('/distribution')} size="large">
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default DistributionSchedule;
