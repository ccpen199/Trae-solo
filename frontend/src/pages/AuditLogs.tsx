import { useState, useEffect } from 'react';
import { Card, Table, Typography, Tag, Pagination, Input, Space, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import api from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function AuditLogs() {
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  const fetchData = () => {
    setLoading(true);
    api.get('/users/audit/logs', { params: { page, size } }).then((d: any) => {
      setList(d.logs || []);
      setTotal(d.total || 0);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, size]);

  const columns = [
    { title: '操作人', dataIndex: 'user_name' },
    { title: '操作', dataIndex: 'action', render: (a: string) => <Tag color="blue">{a}</Tag> },
    { title: '资源类型', dataIndex: 'resource_type', render: (r: string) => r ? <Tag>{r}</Tag> : '-' },
    { title: '资源ID', dataIndex: 'resource_id', render: (r: string) => r || '-' },
    { title: 'IP', dataIndex: 'ip', render: (i: string) => i || '-' },
    { title: '详情', dataIndex: 'details', ellipsis: true, render: (d: string) => { try { return JSON.stringify(JSON.parse(d)); } catch { return d; } } },
    { title: '时间', dataIndex: 'created_at', render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss') }
  ];

  return (
    <Card
      title={<Title level={5} style={{ margin: 0 }}>操作审计日志</Title>}
      extra={<Button onClick={fetchData}>刷新</Button>}
    >
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={list}
        pagination={{
          current: page, pageSize: size, total, showSizeChanger: true,
          onChange: (p, s) => { setPage(p); setSize(s); },
          showTotal: (t) => `共 ${t} 条记录`
        }}
      />
    </Card>
  );
}
