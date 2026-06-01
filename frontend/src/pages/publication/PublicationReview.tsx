import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, Modal, Form, message, Row, Col, Descriptions, Alert, Steps, Card } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, SafetyOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { publicationApi, courseApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Option } = Select;
const { Step } = Steps;

const PublicationReview: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState<any>({});
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [checkModalVisible, setCheckModalVisible] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<any>(null);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await publicationApi.list({
        page: pagination.current,
        page_size: pagination.pageSize,
        ...filters,
      });
      setData(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.total }));
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values: any) => {
    setFilters(values);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleCheck = async (record: any) => {
    setCurrentCourse(record);
    setCheckResult(null);
    setCheckModalVisible(true);
    try {
      const res = await publicationApi.check(record.id);
      setCheckResult(res.data);
    } catch (error: any) {
      message.error(error.response?.data?.error || '检查失败');
    }
  };

  const handleReview = (record: any) => {
    setCurrentCourse(record);
    form.resetFields();
    setReviewModalVisible(true);
  };

  const handleReviewSubmit = async (result: string) => {
    try {
      const values = await form.validateFields();
      await publicationApi.review(currentCourse.id, {
        result,
        comment: values.comment,
      });
      message.success(result === 'approved' ? '审核通过' : '审核拒绝');
      setReviewModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handlePublish = async (record: any) => {
    try {
      await publicationApi.publish(record.id);
      message.success('发布成功');
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '发布失败');
    }
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    pending_review: { color: 'processing', text: '待审核' },
    approved: { color: 'success', text: '审核通过' },
    rejected: { color: 'error', text: '审核拒绝' },
    published: { color: 'green', text: '已发布' },
  };

  const columns = [
    {
      title: '课程编码',
      dataIndex: 'course_code',
      key: 'course_code',
      width: 130,
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: '课程名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '讲师',
      dataIndex: ['lecturer', 'name'],
      key: 'lecturer_name',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '素材数量',
      dataIndex: 'material_count',
      key: 'material_count',
      width: 100,
      render: (count: number) => count || 0,
    },
    {
      title: '已授权素材',
      dataIndex: 'authorized_material_count',
      key: 'authorized_material_count',
      width: 120,
      render: (count: number, record: any) => (
        <Space>
          <span>{count || 0}</span>
          {record.material_count > 0 && count < record.material_count && (
            <Tag color="warning">待授权: {record.material_count - count}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const cfg = statusMap[status] || { color: 'default', text: status };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '提交时间',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      width: 160,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 260,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/courses/${record.id}`)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<SafetyOutlined />} onClick={() => handleCheck(record)}>
            合规检查
          </Button>
          {record.status === 'pending_review' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleReview(record)}>
              审核
            </Button>
          )}
          {record.status === 'approved' && (
            <Button type="primary" size="small" onClick={() => handlePublish(record)}>
              发布
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">上架审核</h1>
          <p className="page-description">课程上架前的合规检查和审核流程</p>
        </div>
      </div>

      <div className="filter-bar">
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="搜索">
            <Input placeholder="课程编码/名称" prefix={<SearchOutlined />} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              {Object.entries(statusMap).map(([key, value]) => (
                <Option key={key} value={key}>{value.text}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button onClick={() => { setFilters({}); loadData(); }}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
        }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="合规检查"
        open={checkModalVisible}
        onCancel={() => setCheckModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setCheckModalVisible(false)}>关闭</Button>,
        ]}
        width={700}
      >
        {checkResult ? (
          <div>
            <Steps direction="vertical" size="small" current={checkResult.checks?.filter((c: any) => c.passed).length}>
              <Step
                status={checkResult.authorization_check ? 'finish' : 'error'}
                title="素材授权检查"
                description={
                  checkResult.authorization_check ? (
                    <span style={{ color: '#52c41a' }}>所有素材已获得有效授权</span>
                  ) : (
                    <span style={{ color: '#ff4d4f' }}>存在未授权或授权过期的素材</span>
                  )
                }
              />
              <Step
                status={checkResult.content_check ? 'finish' : 'error'}
                title="内容合规检查"
                description={
                  checkResult.content_check ? (
                    <span style={{ color: '#52c41a' }}>内容符合平台规范</span>
                  ) : (
                    <span style={{ color: '#ff4d4f' }}>内容可能存在违规风险</span>
                  )
                }
              />
              <Step
                status={checkResult.metadata_check ? 'finish' : 'error'}
                title="元数据完整性检查"
                description={
                  checkResult.metadata_check ? (
                    <span style={{ color: '#52c41a' }}>所有必填字段已填写</span>
                  ) : (
                    <span style={{ color: '#ff4d4f' }}>缺少必要的元数据信息</span>
                  )
                }
              />
            </Steps>

            {checkResult.can_publish ? (
              <Alert
                message="检查通过"
                description="该课程已通过所有合规检查，可以提交审核或直接发布。"
                type="success"
                showIcon
                style={{ marginTop: 16 }}
              />
            ) : (
              <Alert
                message="检查未通过"
                description="请修复以下问题后再提交审核。"
                type="error"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}

            {checkResult.issues && checkResult.issues.length > 0 && (
              <Card title="问题详情" size="small" style={{ marginTop: 16 }}>
                {checkResult.issues.map((issue: any, index: number) => (
                  <div key={index} style={{ marginBottom: 8, padding: 8, background: '#fff2f0', borderRadius: 4 }}>
                    <Space>
                      <InfoCircleOutlined style={{ color: '#ff4d4f' }} />
                      <span>{issue.message}</span>
                      {issue.severity === 'high' && <Tag color="red">严重</Tag>}
                      {issue.severity === 'medium' && <Tag color="orange">中等</Tag>}
                      {issue.severity === 'low' && <Tag color="blue">轻微</Tag>}
                    </Space>
                  </div>
                ))}
              </Card>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Space direction="vertical" align="center">
              <div className="ant-spin ant-spin-spinning ant-spin-lg">
                <span className="ant-spin-dot ant-spin-dot-spin" />
              </div>
              <span>正在进行合规检查...</span>
            </Space>
          </div>
        )}
      </Modal>

      <Modal
        title="课程审核"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setReviewModalVisible(false)}>取消</Button>,
          <Button key="reject" danger onClick={() => handleReviewSubmit('rejected')}>
            <CloseCircleOutlined /> 拒绝
          </Button>,
          <Button key="approve" type="primary" onClick={() => handleReviewSubmit('approved')}>
            <CheckCircleOutlined /> 通过
          </Button>,
        ]}
        width={600}
      >
        {currentCourse && (
          <div>
            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="课程编码">{currentCourse.course_code}</Descriptions.Item>
              <Descriptions.Item label="课程名称">{currentCourse.name}</Descriptions.Item>
              <Descriptions.Item label="讲师">{currentCourse.lecturer?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="分类">{currentCourse.category || '-'}</Descriptions.Item>
            </Descriptions>
            <Form form={form} layout="vertical">
              <Form.Item name="comment" label="审核意见" rules={[{ required: true, message: '请输入审核意见' }]}>
                <Input.TextArea rows={4} placeholder="请输入审核意见..." />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PublicationReview;
