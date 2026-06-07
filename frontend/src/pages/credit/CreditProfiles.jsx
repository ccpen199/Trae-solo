import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Select, Tag, Space, Modal, message } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const { Option } = Select;

const typeMap = { farmer: '农户', merchant: '商户' };
const levelColor = { AAA: 'green', AA: 'green', A: 'blue', B: 'orange', C: 'red', D: 'red' };

export default function CreditProfiles() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState('');
  const [creditLevel, setCreditLevel] = useState('');
  const navigate = useNavigate();

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, pageSize: 10 };
      if (keyword) params.keyword = keyword;
      if (type) params.type = type;
      if (creditLevel) params.credit_level = creditLevel;
      const res = await api.get('/credit/profiles', { params });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (e) { message.error(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { title: '姓名', dataIndex: 'name', width: 100 },
    { title: '身份证号', dataIndex: 'id_card', width: 190 },
    { title: '类型', dataIndex: 'type', width: 80, render: v => <Tag color={v === 'farmer' ? 'green' : 'blue'}>{typeMap[v]}</Tag> },
    { title: '乡镇', dataIndex: 'town', width: 100 },
    { title: '村/社区', dataIndex: 'village', width: 100 },
    { title: '土地面积(亩)', dataIndex: 'land_area', width: 110, render: v => v || '-' },
    { title: '补贴汇总(元)', dataIndex: 'subsidy_total', width: 120, render: v => v ? v.toLocaleString() : '-' },
    { title: '经营收入(元)', dataIndex: 'business_income', width: 120, render: v => v ? v.toLocaleString() : '-' },
    { title: '信用评分', dataIndex: 'credit_score', width: 90 },
    { title: '信用等级', dataIndex: 'credit_level', width: 90, render: v => <Tag color={levelColor[v] || 'default'}>{v}</Tag> },
    { title: '操作', width: 120, render: (_, r) => <Space><Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/credit/${r.id}`)}>详情</Button></Space> },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Input placeholder="姓名/身份证号" value={keyword} onChange={e => setKeyword(e.target.value)} style={{ width: 200 }} allowClear />
        <Select placeholder="类型" value={type || undefined} onChange={v => setType(v || '')} style={{ width: 120 }} allowClear>
          <Option value="farmer">农户</Option>
          <Option value="merchant">商户</Option>
        </Select>
        <Select placeholder="信用等级" value={creditLevel || undefined} onChange={v => setCreditLevel(v || '')} style={{ width: 120 }} allowClear>
          <Option value="AAA">AAA</Option><Option value="AA">AA</Option><Option value="A">A</Option>
          <Option value="B">B</Option><Option value="C">C</Option><Option value="D">D</Option>
        </Select>
        <Button type="primary" icon={<SearchOutlined />} onClick={() => load(1)}>查询</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/credit/new')}>新建画像</Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
        pagination={{ current: page, total, pageSize: 10, onChange: p => { setPage(p); load(p); } }} scroll={{ x: 1300 }} />
    </div>
  );
}
