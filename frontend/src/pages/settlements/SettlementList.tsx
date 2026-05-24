import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Select } from 'antd';
import { settlementApi } from '../../services/api';
import { Settlement } from '../../types';

const { Option } = Select;

const SettlementList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({ status: '' });

  useEffect(() => {
    loadSettlements();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadSettlements = async () => {
    setLoading(true);
    try {
      const res = await settlementApi.list({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters
      });
      setSettlements(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('加载结算记录失败', err);
    } finally {
      setLoading(false);
    }
  };

  const statusMap: Record<string, { text: string; color: string }> = {
    pending: { text: '待结算', color: 'warning' },
    confirmed: { text: '已确认', color: 'blue' },
    paid: { text: '已支付', color: 'processing' },
    completed: { text: '已完成', color: 'success' }
  };

  const columns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 160 },
    { title: '客户', dataIndex: 'user_name', key: 'user_name' },
    { title: '车牌号', dataIndex: 'plate_number', key: 'plate_number' },
    { title: '基础租金', dataIndex: 'base_amount', key: 'base_amount', render: (v: number) => `¥${v}` },
    { title: '油费', dataIndex: 'fuel_fee', key: 'fuel_fee', render: (v: number) => `¥${v}` },
    { title: '违章费', dataIndex: 'violation_fee', key: 'violation_fee', render: (v: number) => `¥${v}` },
    { title: '损失费', dataIndex: 'damage_fee', key: 'damage_fee', render: (v: number) => `¥${v}` },
    { title: '结算总额', dataIndex: 'total_settlement', key: 'total_settlement', render: (v: number) => <span style={{ color: '#1677ff', fontWeight: 600 }}>¥{v}</span> },
    { title: '押金退还', dataIndex: 'deposit_refund', key: 'deposit_refund', render: (v: number) => `¥${v}` },
    { title: '结算时间', dataIndex: 'settlement_time', key: 'settlement_time', render: (v?: string) => v?.slice(0, 19).replace('T', ' ') || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text}</Tag> }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">结算管理</h2>
        <Space>
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ status: value })}
          >
            {Object.entries(statusMap).map(([key, val]) => (
              <Option key={key} value={key}>{val.text}</Option>
            ))}
          </Select>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={settlements}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1400 }}
        pagination={{
          ...pagination,
          total,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (page, pageSize) => setPagination({ current: page, pageSize })
        }}
      />
    </div>
  );
};

export default SettlementList;
