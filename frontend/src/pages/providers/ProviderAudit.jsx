import { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, Radio, Input, message, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { providerApi } from '../../services/api';

const categoryMap = {
  food_delivery: { label: '餐饮外卖', color: 'orange' },
  ride_hailing: { label: '出行打车', color: 'blue' },
  gov_payment: { label: '政务缴费', color: 'green' },
  retail: { label: '商超零售', color: 'purple' },
};

const { TextArea } = Input;

export default function ProviderAudit() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [auditVisible, setAuditVisible] = useState(false);
  const [current, setCurrent] = useState(null);
  const [auditResult, setAuditResult] = useState('approved');
  const [remark, setRemark] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await providerApi.getList({ page, pageSize, status: 'pending' });
      const d = res.data.data || res.data;
      setData(d.list || d.records || []);
      setPagination({ current: page, pageSize, total: d.total || 0 });
    } catch {
      message.error('获取待审核列表失败');
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

  const openAudit = (record) => {
    setCurrent(record);
    setAuditResult('approved');
    setRemark('');
    setAuditVisible(true);
  };

  const submitAudit = async () => {
    if (!current) return;
    setAuditLoading(true);
    try {
      await providerApi.audit(current.id, { result: auditResult, remark });
      message.success('审核完成');
      setAuditVisible(false);
      fetchData(pagination.current, pagination.pageSize);
    } catch {
      message.error('审核操作失败');
    } finally {
      setAuditLoading(false);
    }
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
    { title: '联系人', dataIndex: 'contactName', key: 'contactName' },
    { title: '联系电话', dataIndex: 'contactPhone', key: 'contactPhone' },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button type="primary" size="small" onClick={() => openAudit(record)}>
          审核
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
        title={`审核 - ${current?.name || ''}`}
        open={auditVisible}
        onOk={submitAudit}
        onCancel={() => setAuditVisible(false)}
        confirmLoading={auditLoading}
        okText="提交"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <span style={{ marginRight: 8 }}>审核结果：</span>
            <Radio.Group value={auditResult} onChange={(e) => setAuditResult(e.target.value)}>
              <Radio value="approved">
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> 通过
              </Radio>
              <Radio value="rejected">
                <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> 拒绝
              </Radio>
            </Radio.Group>
          </div>
          <TextArea rows={4} placeholder="审核备注" value={remark} onChange={(e) => setRemark(e.target.value)} />
        </Space>
      </Modal>
    </div>
  );
}
