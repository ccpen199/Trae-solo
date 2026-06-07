import { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Modal, Input, message } from 'antd';
import dayjs from 'dayjs';
import { arbitrationApi } from '../../services/api';

const { TextArea } = Input;

const statusMap = {
  pending: { label: '待处理', color: 'gold' },
  processing: { label: '处理中', color: 'blue' },
  resolved: { label: '已解决', color: 'green' },
  closed: { label: '已关闭', color: 'default' },
};

export default function Arbitration() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [resolveVisible, setResolveVisible] = useState(false);
  const [current, setCurrent] = useState(null);
  const [resolution, setResolution] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await arbitrationApi.getList({ page, pageSize });
      const d = res.data.data || res.data;
      setData(d.list || d.records || []);
      setPagination({ current: page, pageSize, total: d.total || 0 });
    } catch {
      message.error('获取仲裁工单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTableChange = (pag) => {
    fetchData(pag.current, pag.pageSize);
  };

  const openResolve = (record) => {
    setCurrent(record);
    setResolution('');
    setResolveVisible(true);
  };

  const submitResolve = async () => {
    if (!resolution.trim()) {
      message.warning('请输入处理结果');
      return;
    }
    setResolveLoading(true);
    try {
      await arbitrationApi.resolve(current.id, { resolution });
      message.success('处理完成');
      setResolveVisible(false);
      fetchData(pagination.current, pagination.pageSize);
    } catch {
      message.error('处理失败');
    } finally {
      setResolveLoading(false);
    }
  };

  const columns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
    { title: '发起人', dataIndex: 'initiator', key: 'initiator' },
    { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const s = statusMap[v] || { label: v, color: 'default' };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    { title: '处理人', dataIndex: 'handler', key: 'handler' },
    {
      title: '处理时间',
      dataIndex: 'handleAt',
      key: 'handleAt',
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) =>
        record.status === 'pending' || record.status === 'processing' ? (
          <Button type="primary" size="small" onClick={() => openResolve(record)}>
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
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ ...pagination, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        onChange={handleTableChange}
      />
      <Modal
        title={`处理仲裁工单 - ${current?.orderNo || ''}`}
        open={resolveVisible}
        onOk={submitResolve}
        onCancel={() => setResolveVisible(false)}
        confirmLoading={resolveLoading}
        okText="提交"
        cancelText="取消"
      >
        <TextArea rows={4} placeholder="请输入处理结果" value={resolution} onChange={(e) => setResolution(e.target.value)} />
      </Modal>
    </div>
  );
}
