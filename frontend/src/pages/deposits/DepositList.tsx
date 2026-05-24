import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { depositApi } from '../../services/api';
import { Deposit, DepositStatusMap } from '../../types';

const { Option } = Select;

const DepositList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({ status: '' });

  useEffect(() => {
    loadDeposits();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadDeposits = async () => {
    setLoading(true);
    try {
      const res = await depositApi.list({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters
      });
      setDeposits(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('加载押金记录失败', err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 160 },
    { title: '客户', dataIndex: 'user_name', key: 'user_name' },
    { title: '车牌号', dataIndex: 'plate_number', key: 'plate_number' },
    { title: '押金金额', dataIndex: 'amount', key: 'amount', render: (v: number) => `¥${v}` },
    { title: '退款金额', dataIndex: 'refund_amount', key: 'refund_amount', render: (v?: number) => v ? `¥${v}` : '-' },
    { title: '扣除金额', dataIndex: 'deduction_amount', key: 'deduction_amount', render: (v?: number) => v ? `¥${v}` : '-' },
    { title: '扣除原因', dataIndex: 'deduction_reason', key: 'deduction_reason', render: (v?: string) => v || '-' },
    { title: '支付时间', dataIndex: 'paid_at', key: 'paid_at', render: (v?: string) => v?.slice(0, 19).replace('T', ' ') || '-' },
    { title: '退款时间', dataIndex: 'refund_at', key: 'refund_at', render: (v?: string) => v?.slice(0, 19).replace('T', ' ') || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={DepositStatusMap[s]?.color}>{DepositStatusMap[s]?.text}</Tag> }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">押金管理</h2>
        <Space>
          <Select
            placeholder="状态"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ status: value })}
          >
            {Object.entries(DepositStatusMap).map(([key, val]) => (
              <Option key={key} value={key}>{val.text}</Option>
            ))}
          </Select>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={deposits}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
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

export default DepositList;
