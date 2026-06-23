import { useEffect, useState } from 'react';
import { Card, List, Tag, Button, Empty, Drawer, message, Badge, Space, Modal, Form, Input, Select, Checkbox, Typography } from 'antd';
import { MessageOutlined, SendOutlined } from '@ant-design/icons';
import api from '../../api';
import dayjs from 'dayjs';
import Messages from '../common/Messages';

const { Title, Paragraph } = Typography;

const categoryMap: Record<string, { color: string; text: string }> = {
  system: { color: 'blue', text: '系统' },
  bill: { color: 'orange', text: '缴费' },
  workorder: { color: 'purple', text: '工单' },
  order: { color: 'green', text: '订单' },
  activity: { color: 'cyan', text: '活动' },
};

export default function AdminMessages() {
  const [list, setList] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [unread, setUnread] = useState(0);
  const [sendModal, setSendModal] = useState(false);
  const [form] = Form.useForm();

  const loadData = () => {
    api.get('/messages').then((res) => setList(res.data));
    api.get('/messages/unread-count').then((res) => setUnread(res.data.count));
  };

  useEffect(() => { loadData(); }, []);

  const markAllRead = async () => {
    await api.post('/messages/read-all');
    message.success('已全部标记为已读');
    loadData();
  };

  const openDetail = async (msg: any) => {
    if (msg.status === 'unread') {
      await api.post(`/messages/${msg.id}/read`);
    }
    setDetail(msg);
    loadData();
  };

  const handleSend = async (values: any) => {
    try {
      const payload = {
        ...values,
        channels: {
          inbox: values.channels?.includes('inbox'),
          sms: values.channels?.includes('sms'),
          template: values.channels?.includes('template'),
        },
      };
      await api.post('/messages/send', payload);
      message.success('消息发送成功');
      setSendModal(false);
      form.resetFields();
    } catch (err: any) {
      message.error(err.response?.data?.message || '发送失败');
    }
  };

  return (
    <div>
      <Card
        title={
          <Space>
            <Badge count={unread}><MessageOutlined /></Badge>
            消息中心
          </Space>
        }
        style={{ borderRadius: 12, marginBottom: 16 }}
        extra={
          <Space>
            <Button type="primary" icon={<SendOutlined />} onClick={() => setSendModal(true)}>
              群发消息
            </Button>
            <Button onClick={markAllRead}>全部已读</Button>
          </Space>
        }
      >
        {list.length === 0 ? (
          <Empty description="暂无消息" />
        ) : (
          <List
            dataSource={list}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                onClick={() => openDetail(item)}
                style={{
                  cursor: 'pointer',
                  padding: 16,
                  background: item.status === 'unread' ? '#f0f7ff' : 'transparent',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <List.Item.Meta
                  avatar={<Badge dot={item.status === 'unread'}><MessageOutlined style={{ fontSize: 24, color: '#1677ff' }} /></Badge>}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: item.status === 'unread' ? 600 : 400 }}>{item.title}</span>
                      <Tag color={categoryMap[item.category]?.color} style={{ marginLeft: 8 }}>
                        {categoryMap[item.category]?.text || item.category}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ color: '#666', marginBottom: 4 }}>{item.content.substring(0, 80)}...</div>
                      <div style={{ color: '#999', fontSize: 12 }}>{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</div>
                      {item.channels && (
                        <Space style={{ marginTop: 4 }}>
                          {item.channels.inbox && <Tag color="blue" style={{ fontSize: 11, padding: '0 4px', margin: 0 }}>站内信</Tag>}
                          {item.channels.sms && <Tag color="orange" style={{ fontSize: 11, padding: '0 4px', margin: 0 }}>短信</Tag>}
                          {item.channels.template && <Tag color="purple" style={{ fontSize: 11, padding: '0 4px', margin: 0 }}>模板消息</Tag>}
                        </Space>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Drawer title="消息详情" open={!!detail} onClose={() => setDetail(null)} width={560}>
        {detail && (
          <div>
            <Tag color={categoryMap[detail.category]?.color}>{categoryMap[detail.category]?.text}</Tag>
            <Title level={4} style={{ marginTop: 16 }}>{detail.title}</Title>
            <div style={{ color: '#999', marginBottom: 24 }}>{dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}</div>
            <Paragraph style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{detail.content}</Paragraph>
            {detail.channels && (
              <div style={{ marginTop: 24, padding: 16, background: '#fafafa', borderRadius: 8 }}>
                <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>触达渠道：</div>
                <Space>
                  {detail.channels.inbox && <Tag color="blue">站内信</Tag>}
                  {detail.channels.sms && <Tag color="orange">短信</Tag>}
                  {detail.channels.template && <Tag color="purple">小程序模板消息</Tag>}
                </Space>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal title="群发消息" open={sendModal} onCancel={() => setSendModal(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSend}>
          <Form.Item label="消息标题" name="title" rules={[{ required: true }]}>
            <Input placeholder="请输入消息标题" maxLength={50} />
          </Form.Item>
          <Form.Item label="消息内容" name="content" rules={[{ required: true }]}>
            <Input.TextArea rows={5} placeholder="请输入消息内容" maxLength={500} showCount />
          </Form.Item>
          <Form.Item label="消息分类" name="category" initialValue="system">
            <Select options={[
              { value: 'system', label: '系统通知' },
              { value: 'bill', label: '缴费通知' },
              { value: 'workorder', label: '工单通知' },
              { value: 'activity', label: '活动通知' },
            ]} />
          </Form.Item>
          <Form.Item label="接收用户" name="userIds" rules={[{ required: true, message: '请选择接收用户' }]}>
            <Select
              mode="tags"
              placeholder="输入用户ID，多个用逗号分隔或回车添加"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="触达渠道" name="channels" initialValue={['inbox']} rules={[{ required: true }]}>
            <Checkbox.Group>
              <Checkbox value="inbox">站内信</Checkbox>
              <Checkbox value="sms">短信</Checkbox>
              <Checkbox value="template">小程序模板消息</Checkbox>
            </Checkbox.Group>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block icon={<SendOutlined />}>
              发送消息
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
