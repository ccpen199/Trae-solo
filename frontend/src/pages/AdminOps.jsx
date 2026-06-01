import React, { useEffect, useState } from 'react';
import { Table } from 'antd';
import { api } from '../api.js';
import dayjs from 'dayjs';

export default function AdminOps() {
  const [data, setData] = useState([]);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setData(await api.adminOps());
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '操作人', dataIndex: 'operator' },
    { title: '操作', dataIndex: 'action' },
    { title: '目标类型', dataIndex: 'target_type', render: v => v || '-' },
    { title: '目标ID', dataIndex: 'target_id', render: v => v || '-' },
    { title: '详情', dataIndex: 'detail', ellipsis: true, render: v => v || '-' },
    { title: '时间', dataIndex: 'created_at', render: v => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
  ];

  return (
    <div>
      <Table columns={columns} dataSource={data} rowKey="id" size="small" />
    </div>
  );
}
