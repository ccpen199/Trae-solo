import { useState } from 'react';
import { Card, Descriptions, Tag, Space, Button, Timeline, Input, Avatar, Typography, Divider, Rate, App } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text } = Typography;

const typeMap: Record<string, { text: string; color: string }> = {
  REPAIR: { text: '报修', color: 'blue' },
  COMPLAINT: { text: '投诉', color: 'red' },
  SUGGESTION: { text: '建议', color: 'green' },
};

const statusMap: Record<string, { text: string; color: string }> = {
  PENDING: { text: '待处理', color: 'warning' },
  ASSIGNED: { text: '已分配', color: 'processing' },
  PROCESSING: { text: '处理中', color: 'processing' },
  COMPLETED: { text: '已完成', color: 'success' },
  CLOSED: { text: '已关闭', color: 'default' },
};

const mockTicket = {
  id: 'TK-00001',
  type: 'REPAIR',
  title: '客厅灯不亮了',
  content: '客厅的主灯开关按了没反应，可能是灯泡坏了或者线路问题，请安排电工师傅来看看。家里工作日晚上和周末都有人。',
  status: 'PROCESSING',
  priority: 'MEDIUM',
  creatorName: '陈居民',
  creatorPhone: '138****0005',
  handlerName: '李客服',
  handlerPhone: '138****0003',
  communityName: '阳光花园小区',
  houseInfo: '1号楼1单元0101',
  location: '客厅',
  createdAt: '2026-06-19 09:15:00',
  assignedAt: '2026-06-19 09:20:00',
  startedAt: '2026-06-19 10:00:00',
  completedAt: null,
  rating: null,
  images: [],
  tags: ['水电'],
};

const mockLogs = [
  { time: '2026-06-19 09:15:00', action: '工单已提交', operator: '陈居民', color: 'blue' },
  { time: '2026-06-19 09:20:00', action: '工单已受理，分配给李客服处理', operator: '系统', color: 'cyan' },
  { time: '2026-06-19 10:00:00', action: '王师傅已出发上门维修', operator: '李客服', color: 'green' },
];

const mockComments = [
  { id: 1, user: '李客服', role: '物业客服', content: '您好，我已经安排了王师傅，今天下午3点上门维修。', time: '2026-06-19 09:25:00', isInternal: false },
  { id: 2, user: '陈居民', role: '业主', content: '好的，谢谢！下午家里有人。', time: '2026-06-19 09:30:00', isInternal: false },
];

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [comment, setComment] = useState('');

  const handleSubmitComment = () => {
    if (!comment.trim()) return;
    message.success('回复已发送');
    setComment('');
  };

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>
        返回列表
      </Button>

      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Tag color={typeMap[mockTicket.type].color}>{typeMap[mockTicket.type].text}</Tag>
            <Title level={4} style={{ margin: 0 }}>{mockTicket.title}</Title>
          </div>
          <Tag color={statusMap[mockTicket.status].color}>{statusMap[mockTicket.status].text}</Tag>
        </div>

        <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
          <Descriptions.Item label="工单编号">{mockTicket.id}</Descriptions.Item>
          <Descriptions.Item label="优先级">{mockTicket.priority === 'MEDIUM' ? '中' : mockTicket.priority}</Descriptions.Item>
          <Descriptions.Item label="提交人">{mockTicket.creatorName} ({mockTicket.creatorPhone})</Descriptions.Item>
          <Descriptions.Item label="处理人">{mockTicket.handlerName} ({mockTicket.handlerPhone || '-'})</Descriptions.Item>
          <Descriptions.Item label="小区">{mockTicket.communityName}</Descriptions.Item>
          <Descriptions.Item label="房产">{mockTicket.houseInfo}</Descriptions.Item>
          <Descriptions.Item label="具体位置">{mockTicket.location || '-'}</Descriptions.Item>
          <Descriptions.Item label="标签">{mockTicket.tags.map(t => <Tag key={t}>{t}</Tag>)}</Descriptions.Item>
          <Descriptions.Item label="提交时间" span={2}>{mockTicket.createdAt}</Descriptions.Item>
        </Descriptions>

        <Title level={5} style={{ marginBottom: 12 }}>问题描述</Title>
        <p style={{ color: '#475569', lineHeight: 1.8, marginBottom: 24 }}>{mockTicket.content}</p>

        <Divider />

        <Title level={5} style={{ marginBottom: 16 }}>处理进度</Title>
        <Timeline
          items={mockLogs.map(log => ({
            color: log.color,
            children: (
              <div>
                <div style={{ fontWeight: 500 }}>{log.action}</div>
                <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>
                  {log.operator} · {log.time}
                </div>
              </div>
            ),
          }))}
          style={{ marginBottom: 24 }}
        />

        {mockTicket.rating && (
          <>
            <Divider />
            <Title level={5} style={{ marginBottom: 12 }}>用户评价</Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Rate disabled value={mockTicket.rating} />
              <Text type="secondary">({mockTicket.rating}星)</Text>
            </div>
          </>
        )}

        {mockTicket.status !== 'CLOSED' && mockTicket.status !== 'COMPLETED' && (
          <>
            <Divider />
            <Title level={5} style={{ marginBottom: 12 }}>操作回复</Title>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <Button type="primary">分配处理人</Button>
              <Button>开始处理</Button>
              <Button>标记完成</Button>
              <Button danger>关闭工单</Button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Title level={5} style={{ marginBottom: 12 }}>沟通记录</Title>
              {mockComments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <Avatar style={{ backgroundColor: c.isInternal ? '#F59E0B' : '#10B981' }}>
                    {c.user.charAt(0)}
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text strong>{c.user}</Text>
                      <Tag color={c.isInternal ? 'orange' : 'green'}>{c.role}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>{c.time}</Text>
                    </div>
                    <div style={{ color: '#334155' }}>{c.content}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <TextArea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="输入回复内容..."
                rows={3}
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmitComment}
                style={{ alignSelf: 'flex-end', height: 40 }}
              >
                发送
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
