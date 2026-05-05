import { Table, Card, Button, Input, Select, Space, message, Tag, Modal, Form, Radio } from 'antd';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import StatusTag from '../components/StatusTag';
import dayjs from 'dayjs';

const { Search, TextArea } = Input;
const { Option } = Select;

const ApprovalList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('approving');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      let params = {
        type: typeFilter === 'approved' ? 'approved' : 'approver',
        page,
        pageSize,
      };
      if (searchText) params.search = searchText;
      if (statusFilter) params.status = statusFilter;

      const response = await api.get('/applications', { params });
      setData(response.data.list);
      setPagination({
        current: response.data.page,
        pageSize: response.data.pageSize,
        total: response.data.total,
      });
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchText, statusFilter, typeFilter]);

  const handleApprove = (record) => {
    setSelectedApplication(record);
    form.setFieldsValue({ action: 'approve', comment: '' });
    setModalVisible(true);
  };

  const handleReject = (record) => {
    setSelectedApplication(record);
    form.setFieldsValue({ action: 'reject', comment: '' });
    setModalVisible(true);
  };

  const handleSubmitApproval = async (values) => {
    if (!selectedApplication) return;
    
    setActionLoading(true);
    try {
      await api.post(`/applications/${selectedApplication.id}/approver-approve`, {
        action: values.action,
        comment: values.comment,
        submit_finance: values.action === 'approve',
      });
      message.success(values.action === 'approve' ? '审批通过' : '已驳回');
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error(error.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: '申请单号',
      dataIndex: 'application_no',
      key: 'application_no',
      render: (text, record) => (
        <a onClick={() => navigate(`/applications/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '申请人',
      dataIndex: 'applicant_name',
      key: 'applicant_name',
    },
    {
      title: '部门',
      dataIndex: 'applicant_department',
      key: 'applicant_department',
    },
    {
      title: '项目',
      dataIndex: 'project_name',
      key: 'project_name',
    },
    {
      title: '报销类型',
      dataIndex: 'expense_type_name',
      key: 'expense_type_name',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `¥${amount?.toFixed(2) || '0.00'}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const canApprove = ['submitted', 'approving'].includes(record.status);
        return (
          <Space>
            <Button type="link" size="small" onClick={() => navigate(`/applications/${record.id}`)}>
              详情
            </Button>
            {canApprove && (
              <>
                <Button type="link" size="small" onClick={() => handleApprove(record)}>
                  同意
                </Button>
                <Button type="link" size="small" danger onClick={() => handleReject(record)}>
                  驳回
                </Button>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  const handleTableChange = (pagination) => {
    fetchData(pagination.current, pagination.pageSize);
  };

  return (
    <div>
      <Card title="我的审批">
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Radio.Group value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <Radio.Button value="approving">待我审批</Radio.Button>
            <Radio.Button value="approved">已审批</Radio.Button>
          </Radio.Group>
          <Search
            placeholder="搜索申请单号、项目、申请人"
            allowClear
            style={{ width: 250 }}
            onSearch={(value) => setSearchText(value)}
          />
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title="审批"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitApproval}
        >
          <Form.Item label="申请信息">
            <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
              <p style={{ margin: 0 }}>申请单号: {selectedApplication?.application_no}</p>
              <p style={{ margin: '8px 0 0 0' }}>申请人: {selectedApplication?.applicant_name}</p>
              <p style={{ margin: '8px 0 0 0' }}>
                金额: <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                  ¥{selectedApplication?.amount?.toFixed(2)}
                </span>
              </p>
            </div>
          </Form.Item>

          <Form.Item name="action" label="审批操作" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="approve">同意并提交财务复核</Radio>
              <Radio value="reject">驳回</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="comment" label="审批意见">
            <TextArea rows={4} placeholder="请输入审批意见（可选）" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={actionLoading}>
                确认
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ApprovalList;
