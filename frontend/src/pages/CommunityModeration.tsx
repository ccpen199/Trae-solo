import { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, App, Typography, Modal } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function CommunityModeration() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const fetchData = () => {
    setLoading(true);
    api.get('/community/topics', { params: { status: 'pending' } }).then((d: any) => setTopics(d.topics || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const approve = async (id: string, approved: boolean) => {
    Modal.confirm({
      title: approved ? '确认通过审核？' : '确认拒绝？',
      onOk: async () => {
        await api.put(`/community/topics/${id}/approve`, { approved });
        message.success(approved ? '已通过' : '已拒绝');
        fetchData();
      }
    });
  };

  const columns = [
    { title: '标题', dataIndex: 'title', ellipsis: true, render: (t: string, r: any) => <a>{t} {r.status !== 'approved' && <Tag color="orange">{r.status}</Tag>}</a> },
    { title: '发布人', dataIndex: 'user_name' },
    { title: '标签', dataIndex: 'tags', render: (t: string[]) => <Space wrap>{(t || []).map(x => <Tag key={x}>{x}</Tag>)}</Space> },
    { title: '统计', render: (_: any, r: any) => <Space><Tag>👁 {r.views}</Tag><Tag>❤ {r.likes}</Tag><Tag>💬 {r.comments}</Tag></Space> },
    { title: '发布时间', dataIndex: 'created_at', render: (t: string) => dayjs(t).fromNow() },
    {
      title: '操作', render: (_: any, r: any) => (
        <Space>
          <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => approve(r.id, true)}>通过</Button>
          <Button danger size="small" icon={<CloseOutlined />} onClick={() => approve(r.id, false)}>拒绝</Button>
        </Space>
      )
    }
  ];

  return (
    <Card title={<Title level={5} style={{ margin: 0 }}>内容审核管理</Title>} extra={<Button onClick={fetchData} loading={loading}>刷新</Button>}>
      <Table rowKey="id" loading={loading} columns={columns} dataSource={topics} pagination={{ pageSize: 20 }} />
    </Card>
  );
}
