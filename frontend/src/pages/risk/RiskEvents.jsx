import { useState, useEffect } from 'react';
import { Table, Tag, Button, Select, Space, Modal, Input, message } from 'antd';
import { riskApi } from '../../services/api';

const { TextArea } = Input;

const eventTypeMap = {
  fraud: { label: '欺诈', color: 'volcano' },
  abuse: { label: '滥用', color: 'orange' },
  suspicious: { label: '可疑交易', color: 'gold' },
  chargeback: { label: '拒付', color: 'magenta' },
};

const severityMap = {
  low: { label: '低', color: 'green' },
  medium: { label: '中', color: 'orange' },
  high: { label: '高', color: 'red' },
  critical: { label: '严重', color: '#cf1322' },
};

const handledMap = {
  true: { label: '已处理', color: 'green' },
  false: { label: '未处理', color: 'red' },
};

export default function RiskEvents() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({ severity: undefined, handled: undefined, eventType: undefined });
  const [handleVisible, setHandleVisible] = useState(false);
  const [current, setCurrent] = useState(null);
  const [handleResult, setHandleResult] = useState('');
  const [handleLoading, setHandleLoading] = useState(false);

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await riskApi.getEvents({ page, pageSize, ...filters });
      const d = res.data.data || res.data;
      setData(d.list || d.records || []);
      setPagination({ current: page, pageSize, total: d.total || 0 });
    } catch {
      message.error('获取风控事件失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleTableChange = (pag) => {
    fetchData(pag.current, pag.pageSize);
  };

  const openHandle = (record) => {
    setCurrent(record);
    setHandleResult('');
    setHandleVisible(true);
  };

  const submitHandle = async () => {
    if (!handleResult.trim()) {
      message.warning('请输入处理结果');
      return;
    }
    setHandleLoading(true);
    try {
      await riskApi.handleEvent(current.id, { result: handleResult });
      message.success('处理完成');
      setHandleVisible(false);
      fetchData(pagination.current, pagination.pageSize);
    } catch {
      message.error('处理失败');
    } finally {
      setHandleLoading(false);
    }
  };

  const columns = [
    {
      title: '事件类型',
      dataIndex: 'eventType',
      key: 'eventType',
      render: (v) => {
        const e = eventTypeMap[v] || { label: v, color: 'default' };
        return <Tag color={e.color}>{e.label}</Tag>;
      },
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (v) => {
        const s = severityMap[v] || { label: v, color: 'default' };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    { title: '用户手机号', dataIndex: 'userPhone', key: 'userPhone' },
    { title: '订单信息', dataIndex: 'orderInfo', key: 'orderInfo', ellipsis: true },
    { title: '详情', dataIndex: 'detail', key: 'detail', ellipsis: true },
    {
      title: '是否处理',
      dataIndex: 'handled',
      key: 'handled',
      render: (v) => {
        const key = String(v);
        const h = handledMap[key] || { label: v ? '已处理' : '未处理', color: 'default' };
        return <Tag color={h.color}>{h.label}</Tag>;
      },
    },
    { title: '处理结果', dataIndex: 'handleResult', key: 'handleResult', ellipsis: true },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) =>
        !record.handled ? (
          <Button type="primary" size="small" onClick={() => openHandle(record)}>
            处理
          </Button>
        ) : (
          <Button type="link" size="small" disabled>
            已处理
          </Button>
        ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="严重程度"
          allowClear
          style={{ width: 120 }}
          value={filters.severity}
          onChange={(v) => setFilters((f) => ({ ...f, severity: v }))}
        >
          {Object.entries(severityMap).map(([k, v]) => (
            <Select.Option key={k} value={k}>{v.label}</Select.Option>
          ))}
        </Select>
        <Select
          placeholder="处理状态"
          allowClear
          style={{ width: 120 }}
          value={filters.handled}
          onChange={(v) => setFilters((f) => ({ ...f, handled: v }))}
        >
          <Select.Option value="false">未处理</Select.Option>
          <Select.Option value="true">已处理</Select.Option>
        </Select>
        <Select
          placeholder="事件类型"
          allowClear
          style={{ width: 140 }}
          value={filters.eventType}
          onChange={(v) => setFilters((f) => ({ ...f, eventType: v }))}
        >
          {Object.entries(eventTypeMap).map(([k, v]) => (
            <Select.Option key={k} value={k}>{v.label}</Select.Option>
          ))}
        </Select>
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ ...pagination, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        onChange={handleTableChange}
      />
      <Modal
        title={`处理风控事件 - ${current?.eventType || ''}`}
        open={handleVisible}
        onOk={submitHandle}
        onCancel={() => setHandleVisible(false)}
        confirmLoading={handleLoading}
        okText="提交"
        cancelText="取消"
      >
        <TextArea rows={4} placeholder="请输入处理结果" value={handleResult} onChange={(e) => setHandleResult(e.target.value)} />
      </Modal>
    </div>
  );
}
