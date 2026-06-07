import React, { useEffect, useState } from 'react';
import { Typography, Spin, Table, Select, Tag, message } from 'antd';
import api from '../../api';

const { Title } = Typography;
const { Option } = Select;

const moduleMap = { credit: '信用画像', payment: '生活缴费', business: '本地商圈', finance: '金融产品', coordinator: '协理员', system: '系统' };
const moduleColor = { credit: 'green', payment: 'blue', business: 'orange', finance: 'purple', coordinator: 'cyan', system: 'default' };

export default function SystemLogs() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [module, setModule] = useState('');

  const load = async (p = page, nextModule = module) => {
    setLoading(true);
    try {
      const params = { page: p, pageSize: 20 };
      if (nextModule) params.module = nextModule;
      const res = await api.get('/dashboard/logs', { params });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (e) { message.error(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { title: '时间', dataIndex: 'created_at', width: 170 },
    { title: '模块', dataIndex: 'module', width: 100, render: v => <Tag color={moduleColor[v]}>{moduleMap[v] || v}</Tag> },
    { title: '操作', dataIndex: 'action', width: 150 },
    { title: '操作人', dataIndex: 'operator', width: 120 },
    { title: '详情', dataIndex: 'detail' },
  ];

  return (
    <div>
      <Title level={4}>系统操作日志</Title>
      <div style={{ marginBottom: 16 }}>
        <Select placeholder="模块筛选" value={module || undefined} onChange={v => { const nextModule = v || ''; setModule(nextModule); setPage(1); load(1, nextModule); }} style={{ width: 150 }} allowClear>
          <Option value="credit">信用画像</Option>
          <Option value="payment">生活缴费</Option>
          <Option value="business">本地商圈</Option>
          <Option value="finance">金融产品</Option>
          <Option value="coordinator">协理员</Option>
        </Select>
      </div>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: p => { setPage(p); load(p); } }} scroll={{ x: 800 }} />
    </div>
  );
}
