import React, { useEffect, useState } from 'react';
import { Card, Table, Select, message, Tag } from 'antd';
import api from '../utils/api';

const { Option } = Select;

export default function AccountTransactions() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [type, setType] = useState('');

  useEffect(() => {
    loadTransactions();
  }, [pagination.page, type]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, pageSize: pagination.pageSize };
      if (type) params.type = type;
      
      const response = await api.get('/account/transactions', { params });
      setData(response.data.records);
      setPagination(prev => ({ ...prev, total: response.data.pagination.total }));
    } catch (error) {
      message.error('加载交易明细失败');
    } finally {
      setLoading(false);
    }
  };

  const getTypeTag = (type) => {
    const typeMap = {
      deposit: { color: 'green', text: '汇缴' },
      withdrawal: { color: 'red', text: '提取' },
      interest: { color: 'blue', text: '结息' },
      transfer: { color: 'orange', text: '转移' }
    };
    const info = typeMap[type] || { color: 'default', text: type };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    { title: '交易时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
    { title: '交易类型', dataIndex: 'type', key: 'type', render: (t) => getTypeTag(t) },
    { title: '交易金额', dataIndex: 'amount', key: 'amount', render: (v) => `¥${v.toFixed(2)}` },
    { title: '交易后余额', dataIndex: 'balance_after', key: 'balance_after', render: (v) => v ? `¥${v.toFixed(2)}` : '-' },
    { title: '备注', dataIndex: 'description', key: 'description' }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>交易明细</h2>
        <Select
          style={{ width: 150 }}
          placeholder="选择交易类型"
          value={type}
          onChange={(v) => { setType(v); setPagination(p => ({ ...p, page: 1 })); }}
          allowClear
        >
          <Option value="deposit">汇缴</Option>
          <Option value="withdrawal">提取</Option>
          <Option value="interest">结息</Option>
          <Option value="transfer">转移</Option>
        </Select>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page) => setPagination(p => ({ ...p, page }))
          }}
        />
      </Card>
    </div>
  );
}
