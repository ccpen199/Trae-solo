import { useState, useEffect } from 'react';
import { Table, Tag, Button, Select, Space, Modal, Descriptions, message } from 'antd';
import { EyeOutlined, AuditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { providerApi } from '../../services/api';

const categoryMap = {
  food_delivery: { label: '餐饮外卖', color: 'orange' },
  ride_hailing: { label: '出行打车', color: 'blue' },
  gov_payment: { label: '政务缴费', color: 'green' },
  retail: { label: '商超零售', color: 'purple' },
};

const statusMap = {
  pending: { label: '待审核', color: 'gold' },
  approved: { label: '已通过', color: 'green' },
  rejected: { label: '已拒绝', color: 'red' },
  disabled: { label: '已禁用', color: 'default' },
};

export default function ProviderList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({ status: undefined, category: undefined });
  const [detailVisible, setDetailVisible] = useState(false);
  const [current, setCurrent] = useState(null);
  const navigate = useNavigate();

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await providerApi.getList({ page, pageSize, ...filters });
      const d = res.data.data || res.data;
      setData(d.list || d.records || []);
      setPagination({ current: page, pageSize, total: d.total || 0 });
    } catch {
      message.error('获取服务商列表失败');
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

  const columns = [
    { title: '服务商名称', dataIndex: 'name', key: 'name' },
    { title: '营业执照号', dataIndex: 'licenseNo', key: 'licenseNo' },
    {
      title: '服务类别',
      dataIndex: 'category',
      key: 'category',
      render: (v) => {
        const c = categoryMap[v] || { label: v, color: 'default' };
        return <Tag color={c.color}>{c.label}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const s = statusMap[v] || { label: v, color: 'default' };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    { title: '结算周期', dataIndex: 'settlementCycle', key: 'settlementCycle' },
    { title: '联系人', dataIndex: 'contactName', key: 'contactName' },
    { title: '联系电话', dataIndex: 'contactPhone', key: 'contactPhone' },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => { setCurrent(record); setDetailVisible(true); }}>
            查看
          </Button>
          <Button type="link" icon={<AuditOutlined />} onClick={() => navigate('/providers/audit')}>
            审核
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="状态筛选"
          allowClear
          style={{ width: 140 }}
          value={filters.status}
          onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
        >
          {Object.entries(statusMap).map(([k, v]) => (
            <Select.Option key={k} value={k}>{v.label}</Select.Option>
          ))}
        </Select>
        <Select
          placeholder="类别筛选"
          allowClear
          style={{ width: 140 }}
          value={filters.category}
          onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
        >
          {Object.entries(categoryMap).map(([k, v]) => (
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
      <Modal title="服务商详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={600}>
        {current && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="服务商名称">{current.name}</Descriptions.Item>
            <Descriptions.Item label="营业执照号">{current.licenseNo}</Descriptions.Item>
            <Descriptions.Item label="服务类别">{(categoryMap[current.category] || {}).label || current.category}</Descriptions.Item>
            <Descriptions.Item label="状态">{(statusMap[current.status] || {}).label || current.status}</Descriptions.Item>
            <Descriptions.Item label="结算周期">{current.settlementCycle}</Descriptions.Item>
            <Descriptions.Item label="联系人">{current.contactName}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{current.contactPhone}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
