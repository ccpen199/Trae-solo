import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, message, Select } from 'antd';
import api from '../utils/api';

const { Option } = Select;

const typeLabels = {
  rent: '租房提取',
  house_purchase: '购房提取',
  resignation: '离职提取',
  serious_illness: '大病提取',
  renovation: '装修提取',
  retirement: '退休提取'
};

export default function WithdrawalList() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadApplications();
  }, [status]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (status) params.status = status;
      const response = await api.get('/withdrawal/my-applications', { params });
      setData(response.data);
    } catch (error) {
      message.error('加载申请记录失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待审批' },
      approved: { color: 'green', text: '已通过' },
      rejected: { color: 'red', text: '已驳回' }
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    { title: '申请编号', dataIndex: 'id', key: 'id' },
    { title: '提取类型', dataIndex: 'type', key: 'type', render: (t) => typeLabels[t] || t },
    { title: '提取金额', dataIndex: 'amount', key: 'amount', render: (v) => `¥${v.toFixed(2)}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => getStatusTag(s) },
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at' },
    { title: '审批时间', dataIndex: 'approve_time', key: 'approve_time', render: (t) => t || '-' },
    { title: '驳回原因', dataIndex: 'reject_reason', key: 'reject_reason', render: (t) => t || '-' }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>申请记录</h2>
        <Select
          style={{ width: 150 }}
          placeholder="选择状态"
          value={status}
          onChange={setStatus}
          allowClear
        >
          <Option value="pending">待审批</Option>
          <Option value="approved">已通过</Option>
          <Option value="rejected">已驳回</Option>
        </Select>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: '暂无申请记录' }}
        />
      </Card>
    </div>
  );
}
