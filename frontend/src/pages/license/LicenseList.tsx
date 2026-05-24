import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Modal, Form, Input, Select, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { licenseApi } from '../../services/api';
import { LicenseVerification, LicenseStatusMap } from '../../types';

const { Option } = Select;
const { TextArea } = Input;

const LicenseList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [licenses, setLicenses] = useState<LicenseVerification[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [currentLicense, setCurrentLicense] = useState<LicenseVerification | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({ status: '' });

  useEffect(() => {
    loadLicenses();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const res = await licenseApi.list({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters
      });
      setLicenses(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('加载审核记录失败', err);
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (record: LicenseVerification, action: 'approve' | 'reject') => {
    setCurrentLicense(record);
    setReviewAction(action);
    form.resetFields();
    setReviewModalVisible(true);
  };

  const handleReview = async (values: any) => {
    if (!currentLicense) return;
    try {
      await licenseApi.review(currentLicense.id, {
        status: reviewAction === 'approve' ? 'approved' : 'rejected',
        review_remark: values.review_remark
      });
      message.success(reviewAction === 'approve' ? '审核通过' : '已拒绝');
      setReviewModalVisible(false);
      loadLicenses();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '申请人', dataIndex: 'user_name', key: 'user_name' },
    { title: '手机号', dataIndex: 'user_phone', key: 'user_phone' },
    { title: '驾照号', dataIndex: 'license_number', key: 'license_number' },
    { title: '驾照类型', dataIndex: 'license_type', key: 'license_type' },
    { title: '领证日期', dataIndex: 'issue_date', key: 'issue_date' },
    { title: '有效期至', dataIndex: 'expiry_date', key: 'expiry_date' },
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => v.slice(0, 19).replace('T', ' ') },
    { title: '审核备注', dataIndex: 'review_remark', key: 'review_remark', render: (v?: string) => v || '-' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (status: string) => (
        <Tag color={LicenseStatusMap[status]?.color}>
          {LicenseStatusMap[status]?.text}
        </Tag>
      )
    },
    {
      title: '操作', key: 'action',
      render: (_, record: LicenseVerification) => record.status === 'pending' ? (
        <Space>
          <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => openReviewModal(record, 'approve')}>
            通过
          </Button>
          <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => openReviewModal(record, 'reject')}>
            拒绝
          </Button>
        </Space>
      ) : null
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">驾照审核</h2>
        <Space>
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ status: value })}
          >
            {Object.entries(LicenseStatusMap).map(([key, val]) => (
              <Option key={key} value={key}>{val.text}</Option>
            ))}
          </Select>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={licenses}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          total,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (page, pageSize) => setPagination({ current: page, pageSize })
        }}
      />

      <Modal
        title={reviewAction === 'approve' ? '通过审核' : '拒绝审核'}
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
      >
        <p style={{ marginBottom: 16 }}>
          申请人：<strong>{currentLicense?.user_name}</strong>，驾照号：<strong>{currentLicense?.license_number}</strong>
        </p>
        <Form form={form} layout="vertical" onFinish={handleReview}>
          <Form.Item name="review_remark" label={reviewAction === 'approve' ? '审核意见(可选)' : '拒绝原因'} rules={reviewAction === 'reject' ? [{ required: true, message: '请填写拒绝原因' }] : []}>
            <TextArea rows={4} placeholder={reviewAction === 'approve' ? '请输入审核意见' : '请填写拒绝原因'} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" danger={reviewAction === 'reject'}>
                {reviewAction === 'approve' ? '确认通过' : '确认拒绝'}
              </Button>
              <Button onClick={() => setReviewModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LicenseList;
