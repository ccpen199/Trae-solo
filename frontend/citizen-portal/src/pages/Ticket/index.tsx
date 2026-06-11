import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, List, Space, Tag, Typography, message } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import request from '@/services/request';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

interface TicketItem {
  id: string;
  title: string;
  status: string;
  department: string;
  updatedAt: string;
}

export default function Ticket() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [form] = Form.useForm();

  const loadTickets = () => {
    request.get<unknown, TicketItem[]>('/ticket/my').then(setTickets);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSubmit = async (values: { title: string; content: string }) => {
    await request.post('/ticket/create', values);
    message.success('诉求已提交');
    form.resetFields();
    loadTickets();
  };

  return (
    <div style={{ padding: 32, background: '#f5f5f5', minHeight: '100%' }}>
      <Title level={2} style={{ color: '#1B5E20' }}>诉求提交</Title>
      <Paragraph type="secondary">对接 12345 热线，诉求自动分派到责任部门。</Paragraph>

      <Card title="新建诉求" style={{ marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="诉求标题" rules={[{ required: true, message: '请输入诉求标题' }]}>
            <Input prefix={<MessageOutlined />} placeholder="例如：医保异地结算咨询" />
          </Form.Item>
          <Form.Item name="content" label="诉求内容" rules={[{ required: true, message: '请输入诉求内容' }]}>
            <TextArea rows={4} placeholder="请描述办理诉求或问题情况" />
          </Form.Item>
          <Button type="primary" htmlType="submit">提交诉求</Button>
        </Form>
      </Card>

      <Card title="我的诉求">
        <List
          dataSource={tickets}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={<Space>{item.title}<Tag color={item.status === '已办结' ? 'green' : 'blue'}>{item.status}</Tag></Space>}
                description={<Text type="secondary">{item.department} · {item.updatedAt}</Text>}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
