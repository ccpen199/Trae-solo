import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Select, Button, Space, Tag, Modal, Descriptions, DatePicker, message, Spin } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { getTransactions, getTransactionDetail } from '../../api/admin';

const { Option } = Select;
const { RangePicker } = DatePicker;

const Transactions = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [detailModal, setDetailModal] = useState(false);
  const [transactionDetail, setTransactionDetail] = useState(null);

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize]);

  const loadData = async (overrides = {}) => {
    const nextPagination = overrides.pagination || pagination;
    const nextSearchText = overrides.searchText ?? searchText;
    const nextTypeFilter = overrides.typeFilter ?? typeFilter;
    const nextStatusFilter = overrides.statusFilter ?? statusFilter;
    const nextDateRange = overrides.dateRange ?? dateRange;
    try {
      setLoading(true);
      const params = {
        page: nextPagination.current,
        page_size: nextPagination.pageSize,
        keyword: nextSearchText,
        transaction_type: nextTypeFilter,
        status: nextStatusFilter
      };
      if (nextDateRange && nextDateRange.length === 2) {
        params.start_date = nextDateRange[0].format('YYYY-MM-DD');
        params.end_date = nextDateRange[1].format('YYYY-MM-DD');
      }
      const res = await getTransactions(params);
      setData(res?.list || []);
      setPagination(prev => ({ ...prev, total: res?.total || 0 }));
    } catch (err) {
      console.error(err);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const nextPagination = { ...pagination, current: 1 };
    setPagination(nextPagination);
    loadData({ pagination: nextPagination });
  };

  const handleReset = () => {
    const nextPagination = { ...pagination, current: 1 };
    setSearchText('');
    setTypeFilter('');
    setStatusFilter('');
    setDateRange(null);
    setPagination(nextPagination);
    loadData({
      pagination: nextPagination,
      searchText: '',
      typeFilter: '',
      statusFilter: '',
      dateRange: null
    });
  };

  const handleViewDetail = async (id) => {
    try {
      setLoading(true);
      const res = await getTransactionDetail(id);
      setTransactionDetail(res);
      setDetailModal(true);
    } catch (err) {
      console.error(err);
      message.error('获取交易详情失败');
    } finally {
      setLoading(false);
    }
  };

  const getTypeTag = (type) => {
    const typeMap = {
      ride_start: { color: 'blue', text: '进站' },
      ride_complete: { color: 'blue', text: '乘车消费' },
      recharge: { color: 'green', text: '卡充值' },
      refund: { color: 'orange', text: '退款' },
      transfer: { color: 'purple', text: '转账' },
      exchange: { color: 'gold', text: '积分兑换' }
    };
    const config = typeMap[type] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getStatusTag = (status) => {
    const statusMap = {
      success: { color: 'green', text: '成功' },
      pending: { color: 'gold', text: '处理中' },
      failed: { color: 'red', text: '失败' },
      reversed: { color: 'default', text: '已撤销' }
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '交易单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 200
    },
    {
      title: '用户',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 120
    },
    {
      title: '卡号',
      dataIndex: 'card_number',
      key: 'card_number',
      width: 180
    },
    {
      title: '金额（元）',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount, record) => (
        <span style={{ color: record.type === 'recharge' || record.type === 'refund' ? '#52c41a' : '#f5222d' }}>
          {record.type === 'recharge' || record.type === 'refund' ? '+' : '-'}¥ {amount?.toFixed(2) || '0.00'}
        </span>
      )
    },
    {
      title: '交易类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type) => getTypeTag(type)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status)
    },
    {
      title: '交易渠道',
      dataIndex: 'channel',
      key: 'channel',
      width: 100
    },
    {
      title: '交易时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record.id)}
        >
          详情
        </Button>
      )
    }
  ];

  return (
    <div className="admin-transactions">
      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索单号/用户名/卡号"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="交易类型"
            value={typeFilter || undefined}
            onChange={(value) => setTypeFilter(value)}
            style={{ width: 140 }}
            allowClear
          >
            <Option value="ride_complete">乘车消费</Option>
            <Option value="recharge">卡充值</Option>
            <Option value="refund">退款</Option>
            <Option value="transfer">转账</Option>
            <Option value="exchange">积分兑换</Option>
          </Select>
          <Select
            placeholder="交易状态"
            value={statusFilter || undefined}
            onChange={(value) => setStatusFilter(value)}
            style={{ width: 140 }}
            allowClear
          >
            <Option value="success">成功</Option>
            <Option value="pending">处理中</Option>
            <Option value="failed">失败</Option>
            <Option value="reversed">已撤销</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            style={{ width: 260 }}
          />
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
            }}
            scroll={{ x: 1300 }}
          />
        </Spin>
      </Card>

      <Modal
        title="交易详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={700}
      >
        {transactionDetail && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="交易单号">{transactionDetail.order_no}</Descriptions.Item>
            <Descriptions.Item label="交易类型">{getTypeTag(transactionDetail.type)}</Descriptions.Item>
            <Descriptions.Item label="用户">{transactionDetail.user_name}</Descriptions.Item>
            <Descriptions.Item label="手机号">{transactionDetail.user_phone}</Descriptions.Item>
            <Descriptions.Item label="卡号">{transactionDetail.card_number}</Descriptions.Item>
            <Descriptions.Item label="交易金额">
              <span style={{ color: transactionDetail.type === 'recharge' || transactionDetail.type === 'refund' ? '#52c41a' : '#f5222d' }}>
                {transactionDetail.type === 'recharge' || transactionDetail.type === 'refund' ? '+' : '-'}¥ {transactionDetail.amount?.toFixed(2) || '0.00'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="交易状态">{getStatusTag(transactionDetail.status)}</Descriptions.Item>
            <Descriptions.Item label="交易渠道">{transactionDetail.channel || '-'}</Descriptions.Item>
            <Descriptions.Item label="线路/站点">{transactionDetail.route_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="设备编号">{transactionDetail.device_no || '-'}</Descriptions.Item>
            <Descriptions.Item label="交易时间">{transactionDetail.created_at}</Descriptions.Item>
            <Descriptions.Item label="完成时间">{transactionDetail.completed_at || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>
              {transactionDetail.remark || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Transactions;
