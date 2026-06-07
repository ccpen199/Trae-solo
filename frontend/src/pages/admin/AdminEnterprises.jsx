import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Space, Modal, Form, Input, Select,
  message, Spin, Tabs, Descriptions, Image, Row, Col, Badge
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, EyeOutlined,
  SearchOutlined, ShopOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import api from '../../utils/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const AdminEnterprises = () => {
  const [pendingList, setPendingList] = useState([]);
  const [allList, setAllList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [currentEnterprise, setCurrentEnterprise] = useState(null);
  const [reviewForm] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    keyword: '',
  });

  useEffect(() => {
    fetchPendingEnterprises();
  }, []);

  const fetchPendingEnterprises = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/enterprises/pending');
      setPendingList(res.data.enterprises || []);
    } catch (e) {
      message.error('加载待审核企业失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEnterprises = async (page = 1, pageSize = 10, extraFilters = {}) => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        ...extraFilters,
      };
      const res = await api.get('/admin/enterprises', { params });
      setAllList(res.data.enterprises || []);
      setPagination({
        current: page,
        pageSize,
        total: res.data.total || 0,
      });
    } catch (e) {
      message.error('加载企业列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key) => {
    if (key === 'all') {
      fetchAllEnterprises(1, 10, filters);
    }
  };

  const handleViewDetail = (enterprise) => {
    setCurrentEnterprise(enterprise);
    setDetailVisible(true);
  };

  const handleOpenReview = (enterprise) => {
    setCurrentEnterprise(enterprise);
    reviewForm.resetFields();
    setReviewVisible(true);
  };

  const handleReview = async (status) => {
    try {
      const values = await reviewForm.validateFields();
      setReviewLoading(true);
      await api.put(`/admin/enterprises/${currentEnterprise.id}/qualification`, {
        status,
        review_comment: values.review_comment,
      });
      message.success(status === 'approved' ? '审核通过' : '已拒绝');
      setReviewVisible(false);
      fetchPendingEnterprises();
      if (allList.length > 0) {
        fetchAllEnterprises(pagination.current, pagination.pageSize, filters);
      }
    } catch (e) {
      message.error(e.response?.data?.error || '操作失败');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSearch = () => {
    fetchAllEnterprises(1, pagination.pageSize, filters);
  };

  const handleTableChange = (pag) => {
    fetchAllEnterprises(pag.current, pag.pageSize, filters);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待审核', icon: <ClockCircleOutlined /> },
      approved: { color: 'green', text: '已通过', icon: <CheckCircleOutlined /> },
      rejected: { color: 'red', text: '已拒绝', icon: <CloseCircleOutlined /> },
    };
    const config = statusMap[status] || statusMap.pending;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const pendingColumns = [
    {
      title: '企业名称',
      dataIndex: 'enterprise_name',
      key: 'enterprise_name',
      render: (text, record) => (
        <Space>
          <BuildingOutlined style={{ color: '#1677ff' }} />
          <strong>{text}</strong>
          {record.qualification_status === 'pending' && (
            <Badge status="processing" color="#fa8c16" />
          )}
        </Space>
      ),
    },
    {
      title: '所属行业',
      dataIndex: 'industry',
      key: 'industry',
      width: 120,
    },
    {
      title: '企业规模',
      dataIndex: 'scale',
      key: 'scale',
      width: 100,
    },
    {
      title: '联系人',
      dataIndex: 'contact_person',
      key: 'contact_person',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'contact_phone',
      key: 'contact_phone',
      width: 120,
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
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
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleOpenReview(record)}
          >
            审核
          </Button>
        </Space>
      ),
    },
  ];

  const allColumns = [
    {
      title: '企业名称',
      dataIndex: 'enterprise_name',
      key: 'enterprise_name',
      render: (text) => (
        <Space>
          <BuildingOutlined style={{ color: '#1677ff' }} />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: '所属行业',
      dataIndex: 'industry',
      key: 'industry',
      width: 120,
    },
    {
      title: '企业规模',
      dataIndex: 'scale',
      key: 'scale',
      width: 100,
    },
    {
      title: '资质状态',
      dataIndex: 'qualification_status',
      key: 'qualification_status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '联系人',
      dataIndex: 'contact_person',
      key: 'contact_person',
      width: 100,
    },
    {
      title: '审核时间',
      dataIndex: 'reviewed_at',
      key: 'reviewed_at',
      width: 160,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  if (loading && pendingList.length === 0 && allList.length === 0) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div className="page-header">
        <h2>企业资质审核</h2>
        <Space>
          {pendingList.length > 0 && (
            <Tag color="orange">
              <ClockCircleOutlined /> {pendingList.length} 家待审核
            </Tag>
          )}
        </Space>
      </div>

      <Card className="card-shadow">
        <Tabs defaultActiveKey="pending" onChange={handleTabChange}>
          <TabPane
            tab={
              <span>
                <ClockCircleOutlined /> 待审核
                {pendingList.length > 0 && (
                  <Badge
                    count={pendingList.length}
                    color="#fa8c16"
                    style={{ marginLeft: 8 }}
                  />
                )}
              </span>
            }
            key="pending"
          >
            <Table
              dataSource={pendingList}
              columns={pendingColumns}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                total: pendingList.length,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <BuildingOutlined /> 全部企业
              </span>
            }
            key="all"
          >
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={8}>
                  <Input
                    placeholder="搜索企业名称/联系人"
                    prefix={<SearchOutlined />}
                    value={filters.keyword}
                    onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                    onPressEnter={handleSearch}
                    allowClear
                  />
                </Col>
                <Col xs={24} sm={6}>
                  <Select
                    placeholder="资质状态"
                    value={filters.status || undefined}
                    onChange={(value) => setFilters({ ...filters, status: value })}
                    style={{ width: '100%' }}
                    allowClear
                  >
                    <Option value="pending">待审核</Option>
                    <Option value="approved">已通过</Option>
                    <Option value="rejected">已拒绝</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={4}>
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} block>
                    搜索
                  </Button>
                </Col>
              </Row>
            </Card>
            <Table
              dataSource={allList}
              columns={allColumns}
              rowKey="id"
              loading={loading}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
              onChange={handleTableChange}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="企业详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
          currentEnterprise?.qualification_status === 'pending' && (
            <Button
              key="review"
              type="primary"
              onClick={() => {
                setDetailVisible(false);
                handleOpenReview(currentEnterprise);
              }}
            >
              去审核
            </Button>
          ),
        ]}
        width={800}
      >
        {currentEnterprise && (
          <div>
            <Descriptions
              title="基本信息"
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="企业名称" span={2}>
                <strong>{currentEnterprise.enterprise_name}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="统一社会信用代码">
                {currentEnterprise.credit_code}
              </Descriptions.Item>
              <Descriptions.Item label="所属行业">
                {currentEnterprise.industry}
              </Descriptions.Item>
              <Descriptions.Item label="企业规模">
                {currentEnterprise.scale}
              </Descriptions.Item>
              <Descriptions.Item label="所在地区">
                {currentEnterprise.location}
              </Descriptions.Item>
              <Descriptions.Item label="联系人">
                {currentEnterprise.contact_person}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {currentEnterprise.contact_phone}
              </Descriptions.Item>
              <Descriptions.Item label="联系邮箱">
                {currentEnterprise.contact_email}
              </Descriptions.Item>
              <Descriptions.Item label="企业简介" span={2}>
                {currentEnterprise.description}
              </Descriptions.Item>
              <Descriptions.Item label="资质状态">
                {getStatusTag(currentEnterprise.qualification_status)}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {dayjs(currentEnterprise.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              {currentEnterprise.reviewed_at && (
                <>
                  <Descriptions.Item label="审核时间">
                    {dayjs(currentEnterprise.reviewed_at).format('YYYY-MM-DD HH:mm')}
                  </Descriptions.Item>
                  <Descriptions.Item label="审核人">
                    {currentEnterprise.reviewer_name}
                  </Descriptions.Item>
                </>
              )}
              {currentEnterprise.review_comment && (
                <Descriptions.Item label="审核意见" span={2}>
                  {currentEnterprise.review_comment}
                </Descriptions.Item>
              )}
            </Descriptions>

            {currentEnterprise.business_license && (
              <div style={{ marginBottom: 16 }}>
                <div className="section-title">营业执照</div>
                <Image
                  width={300}
                  src={currentEnterprise.business_license}
                  alt="营业执照"
                />
              </div>
            )}

            {currentEnterprise.qualification_certificates?.length > 0 && (
              <div>
                <div className="section-title">资质证书</div>
                <Row gutter={[16, 16]}>
                  {currentEnterprise.qualification_certificates.map((cert, idx) => (
                    <Col key={idx} xs={12} sm={8}>
                      <Image
                        width={200}
                        src={cert}
                        alt={`资质证书${idx + 1}`}
                      />
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="企业资质审核"
        open={reviewVisible}
        onCancel={() => setReviewVisible(false)}
        footer={null}
        width={600}
      >
        {currentEnterprise && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row>
                <Col span={12}>
                  <strong>企业名称：</strong>{currentEnterprise.enterprise_name}
                </Col>
                <Col span={12}>
                  <strong>所属行业：</strong>{currentEnterprise.industry}
                </Col>
                <Col span={12}>
                  <strong>联系人：</strong>{currentEnterprise.contact_person}
                </Col>
                <Col span={12}>
                  <strong>联系电话：</strong>{currentEnterprise.contact_phone}
                </Col>
              </Row>
            </Card>

            <Form form={reviewForm} layout="vertical">
              <Form.Item
                name="review_comment"
                label="审核意见"
                rules={[{ required: true, message: '请填写审核意见' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="请填写审核意见，如资质材料是否齐全、信息是否真实等"
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={reviewLoading}
                    onClick={() => handleReview('approved')}
                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  >
                    通过审核
                  </Button>
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    loading={reviewLoading}
                    onClick={() => handleReview('rejected')}
                  >
                    拒绝申请
                  </Button>
                  <Button onClick={() => setReviewVisible(false)}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminEnterprises;
