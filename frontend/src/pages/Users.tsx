import { useState, useEffect } from 'react';
import { Card, Table, Input, Select, Button, Tag, Space, Typography, Avatar } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import api from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;

const roleMap: Record<string, { name: string; color: string }> = {
  jobseeker: { name: '求职者', color: 'blue' },
  hr: { name: 'HR', color: 'green' },
  trainer: { name: '培训师', color: 'purple' },
  admin: { name: '管理员', color: 'red' }
};

export default function Users() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState('');

  const fetchData = () => {
    setLoading(true);
    api.get('/users', { params: { keyword, role } }).then((d: any) => setList(d.users || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [keyword, role]);

  const columns = [
    { title: '用户', dataIndex: 'username', render: (t: string, r: any) => <Space><Avatar icon={<UserOutlined />} src={r.avatar} /><div><div style={{ fontWeight: 500 }}>{r.name}</div><div style={{ fontSize: 12, color: '#999' }}>@{t}</div></div></Space> },
    { title: '邮箱', dataIndex: 'email' },
    { title: '角色', dataIndex: 'role', render: (r: string) => roleMap[r] ? <Tag color={roleMap[r].color}>{roleMap[r].name}</Tag> : r },
    { title: '积分', dataIndex: 'points', render: (p: number) => <Tag color="gold">{p || 0} 分</Tag> },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '正常' : '禁用'}</Tag> },
    { title: '注册时间', dataIndex: 'created_at', render: (t: string) => dayjs(t).format('YYYY-MM-DD') }
  ];

  return (
    <Card
      title={<Title level={5} style={{ margin: 0 }}>用户管理</Title>}
      extra={
        <Space>
          <Input prefix={<SearchOutlined />} placeholder="搜索用户名/姓名/邮箱" value={keyword} onChange={e => setKeyword(e.target.value)} style={{ width: 240 }} allowClear />
          <Select placeholder="角色" value={role} onChange={setRole} allowClear style={{ width: 140 }}>
            {Object.entries(roleMap).map(([k, v]) => <Select.Option key={k} value={k}>{v.name}</Select.Option>)}
          </Select>
          <Button onClick={fetchData}>刷新</Button>
        </Space>
      }
    >
      <Table rowKey="id" loading={loading} columns={columns} dataSource={list} pagination={{ pageSize: 20 }} />
    </Card>
  );
}
