import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Card,
  Statistic,
  Row,
  Col,
  Timeline,
  Divider,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { workflowApi, contentApi } from '../../services/api';
import { ReviewStatus } from '../../common/enums';
import dayjs from 'dayjs';

const { TextArea } = Input;

const ReviewCenter: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    setLoading(true);
    try {
      const response: any = await workflowApi.getPending();
      setPendingReviews(response.data || []);
    } catch (error) {
      console.error('Failed to fetch pending reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessReview = (record: any) => {
    setSelectedReview(record);
    form.resetFields();
    setShowModal(true);
  };

  const handleViewContent = (contentId: string) => {
    navigate(`/content/edit/${contentId}`);
  };

  const handleSubmitReview = async (values: any) => {
    if (!selectedReview) return;

    try {
      await workflowApi.processReview(selectedReview.id, {
        status: values.status,
        comment: values.comment,
      });
      message.success('审核完成');
      setShowModal(false);
      fetchPendingReviews();
    } catch (error) {
      message.error('审核失败');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'default',
      IN_PROGRESS: 'processing',
      APPROVED: 'success',
      REJECTED: 'error',
      NEEDS_REVISION: 'warning',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      PENDING: '待处理',
      IN_PROGRESS: '处理中',
      APPROVED: '通过',
      REJECTED: '驳回',
      NEEDS_REVISION: '需修改',
    };
    return texts[status] || status;
  };

  const getStepTypeText = (type: string) => {
    const texts: Record<string, string> = {
      FIRST_REVIEW: '初审',
      SECOND_REVIEW: '二审',
      THIRD_REVIEW: '三审',
      FIRST_PROOFREAD: '一校',
      SECOND_PROOFREAD: '二校',
      THIRD_PROOFREAD: '三校',
    };
    return texts[type] || type;
  };

  const columns = [
    {
      title: '内容标题',
      dataIndex: ['workflowInstance', 'content', 'title'],
      key: 'title',
      ellipsis: true,
      width: 250,
    },
    {
      title: '作者',
      dataIndex: ['workflowInstance', 'content', 'author', 'displayName'],
      key: 'author',
      width: 100,
      render: (name: string, record: any) =>
        name || record.workflowInstance?.content?.author?.username || '-',
    },
    {
      title: '步骤',
      dataIndex: 'stepName',
      key: 'stepName',
      width: 100,
      render: (name: string, record: any) => (
        <Tag color="blue">
          {getStepTypeText(record.stepType)} - {name}
        </Tag>
      ),
    },
    {
      title: '步骤编号',
      dataIndex: 'stepNumber',
      key: 'stepNumber',
      width: 100,
      render: (n: number, record: any) => (
        <span>
          {n}/{record.workflowInstance?.totalSteps}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '分配角色',
      dataIndex: 'assignedRole',
      key: 'assignedRole',
      width: 100,
      render: (role: string) => {
        const roleMap: Record<string, string> = {
          CHIEF_EDITOR: '主编',
          EDITOR: '编辑',
        };
        return roleMap[role] || role;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'startedAt',
      key: 'startedAt',
      width: 180,
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => handleViewContent(record.workflowInstance?.contentId)}
          >
            查看内容
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleProcessReview(record)}
          >
            处理审核
          </Button>
        </Space>
      ),
    },
  ];

  const stats = [
    {
      title: '待处理',
      value: pendingReviews.filter((r) => r.status === 'IN_PROGRESS').length,
      icon: <ClockCircleOutlined style={{ color: '#faad14' }} />,
      color: '#fffbe6',
    },
    {
      title: '总待审核',
      value: pendingReviews.length,
      icon: <FileTextOutlined style={{ color: '#1890ff' }} />,
      color: '#e6f7ff',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>审核中心</h2>
        <p style={{ color: 'rgba(0,0,0,0.45)' }}>处理待审核的内容稿件</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <Col xs={12} sm={6} key={index}>
            <Card size="small" style={{ background: stat.color, border: 'none' }}>
              <Statistic title={stat.title} value={stat.value} prefix={stat.icon} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={pendingReviews}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title="处理审核"
        open={showModal}
        onCancel={() => setShowModal(false)}
        width={600}
        footer={null}
      >
        {selectedReview && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <div style={{ color: 'rgba(0,0,0,0.45)' }}>内容标题</div>
                  <div>{selectedReview.workflowInstance?.content?.title}</div>
                </Col>
                <Col span={6}>
                  <div style={{ color: 'rgba(0,0,0,0.45)' }}>审核步骤</div>
                  <div>
                    {getStepTypeText(selectedReview.stepType)} - {selectedReview.stepName}
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ color: 'rgba(0,0,0,0.45)' }}>作者</div>
                  <div>
                    {selectedReview.workflowInstance?.content?.author?.displayName ||
                      selectedReview.workflowInstance?.content?.author?.username ||
                      '-'}
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ color: 'rgba(0,0,0,0.45)' }}>步骤进度</div>
                  <div>
                    {selectedReview.stepNumber}/{selectedReview.workflowInstance?.totalSteps}
                  </div>
                </Col>
              </Row>
            </Card>

            <Form form={form} layout="vertical" onFinish={handleSubmitReview}>
              <Form.Item
                name="status"
                label="审核结果"
                rules={[{ required: true, message: '请选择审核结果' }]}
              >
                <Select placeholder="请选择审核结果">
                  <Select.Option value="APPROVED">
                    <CheckCircleOutlined style={{ color: '#52c41a' }} /> 通过
                  </Select.Option>
                  <Select.Option value="NEEDS_REVISION">
                    <EditOutlined style={{ color: '#faad14' }} /> 需修改
                  </Select.Option>
                  <Select.Option value="REJECTED">
                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> 驳回
                  </Select.Option>
                </Select>
              </Form.Item>

              <Form.Item name="comment" label="审核意见">
                <TextArea rows={4} placeholder="请输入审核意见" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    提交
                  </Button>
                  <Button onClick={() => setShowModal(false)}>取消</Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReviewCenter;
