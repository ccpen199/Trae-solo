import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Select, Button, Space, Tag, Modal, Descriptions, Image, message, Spin, Popconfirm, Row, Col } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import { getRenewals, reviewRenewal } from '../../api/admin';

const { Option } = Select;

const Renewals = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [detailModal, setDetailModal] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const [reviewType, setReviewType] = useState('approve');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize]);

  const loadData = async (overrides = {}) => {
    const nextPagination = overrides.pagination || pagination;
    const nextSearchText = overrides.searchText ?? searchText;
    const nextStatusFilter = overrides.statusFilter ?? statusFilter;
    const nextTypeFilter = overrides.typeFilter ?? typeFilter;
    try {
      setLoading(true);
      const res = await getRenewals({
        page: nextPagination.current,
        page_size: nextPagination.pageSize,
        keyword: nextSearchText,
        status: nextStatusFilter,
        type: nextTypeFilter
      });
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
    setStatusFilter('');
    setTypeFilter('');
    setPagination(nextPagination);
    loadData({
      pagination: nextPagination,
      searchText: '',
      statusFilter: '',
      typeFilter: ''
    });
  };

  const handleViewDetail = (record) => {
    setSelectedRenewal(record);
    setDetailModal(true);
  };

  const openReviewModal = (record, type) => {
    setSelectedRenewal(record);
    setReviewType(type);
    setRejectReason('');
    setReviewModal(true);
  };

  const handleReview = async () => {
    try {
      await reviewRenewal(selectedRenewal.id, {
        result: reviewType,
        reason: rejectReason
      });
      message.success(reviewType === 'approve' ? '审核通过' : '审核已拒绝');
      setReviewModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      message.error('操作失败');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'gold', text: '待审核' },
      approved: { color: 'green', text: '已通过' },
      rejected: { color: 'red', text: '已拒绝' }
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getTypeTag = (type) => {
    const typeMap = {
      student: { color: 'green', text: '学生卡年审' },
      elderly: { color: 'orange', text: '老年卡年审' },
      disabled: { color: 'purple', text: '爱心卡年审' }
    };
    const config = typeMap[type] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '申请编号',
      dataIndex: 'application_no',
      key: 'application_no',
      width: 160
    },
    {
      title: '申请人',
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
      title: '年审类型',
      dataIndex: 'renewal_type',
      key: 'renewal_type',
      width: 130,
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
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160
    },
    {
      title: '审核人',
      dataIndex: 'reviewer_name',
      key: 'reviewer_name',
      width: 100,
      render: (name) => name || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => openReviewModal(record, 'approve')}
              >
                通过
              </Button>
              <Button
                type="link"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => openReviewModal(record, 'reject')}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="admin-renewals">
      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索申请编号/姓名/卡号"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="审核状态"
            value={statusFilter || undefined}
            onChange={(value) => setStatusFilter(value)}
            style={{ width: 140 }}
            allowClear
          >
            <Option value="pending">待审核</Option>
            <Option value="approved">已通过</Option>
            <Option value="rejected">已拒绝</Option>
          </Select>
          <Select
            placeholder="年审类型"
            value={typeFilter || undefined}
            onChange={(value) => setTypeFilter(value)}
            style={{ width: 140 }}
            allowClear
          >
            <Option value="student">学生卡年审</Option>
            <Option value="elderly">老年卡年审</Option>
            <Option value="disabled">爱心卡年审</Option>
          </Select>
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
        title="年审申请详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={
          selectedRenewal && selectedRenewal.status === 'pending' ? (
            <Space>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
                onClick={() => { setDetailModal(false); openReviewModal(selectedRenewal, 'approve'); }}
              >
                审核通过
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => { setDetailModal(false); openReviewModal(selectedRenewal, 'reject'); }}
              >
                审核拒绝
              </Button>
              <Button onClick={() => setDetailModal(false)}>关闭</Button>
            </Space>
          ) : null
        }
        width={700}
      >
        {selectedRenewal && (
          <>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="申请编号">{selectedRenewal.application_no}</Descriptions.Item>
              <Descriptions.Item label="年审类型">{getTypeTag(selectedRenewal.renewal_type)}</Descriptions.Item>
              <Descriptions.Item label="申请人">{selectedRenewal.user_name}</Descriptions.Item>
              <Descriptions.Item label="手机号">{selectedRenewal.user_phone}</Descriptions.Item>
              <Descriptions.Item label="卡号">{selectedRenewal.card_number}</Descriptions.Item>
              <Descriptions.Item label="身份证号">{selectedRenewal.id_card}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(selectedRenewal.status)}</Descriptions.Item>
              <Descriptions.Item label="申请时间">{selectedRenewal.created_at}</Descriptions.Item>
              {selectedRenewal.status !== 'pending' && (
                <>
                  <Descriptions.Item label="审核人">{selectedRenewal.reviewer_name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="审核时间">{selectedRenewal.reviewed_at || '-'}</Descriptions.Item>
                  {selectedRenewal.reason && (
                    <Descriptions.Item label="审核意见" span={2}>
                      {selectedRenewal.reason}
                    </Descriptions.Item>
                  )}
                </>
              )}
            </Descriptions>

            <Card
              title={<><FileTextOutlined /> 申请材料</>}
              style={{ marginTop: 16 }}
              size="small"
            >
              <Row gutter={[16, 16]}>
                {selectedRenewal.materials?.map((material, idx) => (
                  <Col xs={12} sm={8} key={idx}>
                    <div style={{ textAlign: 'center' }}>
                      <Image
                        width={120}
                        height={160}
                        src={material.url}
                        fallback="https://via.placeholder.com/120x160"
                      />
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{material.name}</div>
                    </div>
                  </Col>
                ))}
                {(!selectedRenewal.materials || selectedRenewal.materials.length === 0) && (
                  <Col span={24}>
                    <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                      暂无材料
                    </div>
                  </Col>
                )}
              </Row>
            </Card>
          </>
        )}
      </Modal>

      <Modal
        title={reviewType === 'approve' ? '审核通过' : '审核拒绝'}
        open={reviewModal}
        onCancel={() => setReviewModal(false)}
        footer={
          <Space>
            <Button onClick={() => setReviewModal(false)}>取消</Button>
            <Popconfirm
              title={`确定要${reviewType === 'approve' ? '通过' : '拒绝'}该申请吗？`}
              onConfirm={handleReview}
              okText="确定"
              cancelText="取消"
            >
              <Button type={reviewType === 'approve' ? 'primary' : 'primary'} danger={reviewType !== 'approve'}>
                确认{reviewType === 'approve' ? '通过' : '拒绝'}
              </Button>
            </Popconfirm>
          </Space>
        }
        width={500}
      >
        {reviewType === 'reject' ? (
          <div>
            <p style={{ marginBottom: 16 }}>请填写拒绝原因：</p>
            <Input.TextArea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="请输入拒绝原因..."
              maxLength={500}
              showCount
            />
          </div>
        ) : (
          <p>确定要通过该年审申请吗？</p>
        )}
      </Modal>
    </div>
  );
};

export default Renewals;
