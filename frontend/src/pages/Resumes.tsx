import { useState, useEffect } from 'react';
import { Table, Card, Input, Button, Tag, Space, Avatar, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, UserOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAppStore } from '../store';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function Resumes() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  const fetchData = () => {
    setLoading(true);
    api.get('/resumes', { params: { keyword } }).then((d: any) => setList(d.resumes || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [keyword]);

  const columns = [
    {
      title: '求职者', dataIndex: 'user_name', key: 'user_name',
      render: (t: string, r: any) => (
        <Space>
          <Avatar size={36} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{t || '匿名'}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{r.title || '未设置标题'}</Text>
          </div>
        </Space>
      )
    },
    { title: '工作经验', dataIndex: 'experience', key: 'experience', render: (v: number) => `${v || 0} 年` },
    { title: '学历', dataIndex: 'education', key: 'education' },
    {
      title: '技能标签', dataIndex: 'skills', key: 'skills',
      render: (s: string[]) => <Space wrap>{(s || []).slice(0, 5).map(x => <Tag key={x} color="blue">{x}</Tag>)}</Space>
    },
    { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', render: (t: string) => dayjs(t).fromNow() },
    {
      title: '操作', key: 'action',
      render: (_: any, r: any) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/resumes/${r.id}`)}>查看</Button>
          {(r.user_id === user?.id || user?.role !== 'jobseeker') && (
            <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/resumes/${r.id}/edit`)}>编辑</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <Card
      title={<Title level={5} style={{ margin: 0 }}>{user?.role === 'jobseeker' ? '我的简历' : '人才简历库'}</Title>}
      extra={
        <Space>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索姓名、技能..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            style={{ width: 240 }}
          />
          {user?.role === 'jobseeker' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/resumes/new')}>创建简历</Button>
          )}
        </Space>
      }
    >
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={list}
        pagination={{ pageSize: 10 }}
        onRow={r => ({ onClick: () => navigate(`/resumes/${r.id}`), style: { cursor: 'pointer' } })}
      />
    </Card>
  );
}
