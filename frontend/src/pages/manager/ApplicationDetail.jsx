import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Table, Button, Spin, Empty, Divider, Timeline, Modal, Form, Select, message, Input, Space } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { applicationApi } from '../../services/api.js';
import { getStatusInfo, getFraudRiskInfo, getRepaymentStatusInfo, formatCurrency, formatDateTime } from '../../utils/status.js';

const { Option } = Select;
const { TextArea } = Input;

function ManagerApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewForm] = Form.useForm();
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await applicationApi.getApplication(id);
      setDetail(res.data);
    } catch (error) {
      console.error('Fetch detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (values) => {
    try {
      setActionLoading(true);
      await applicationApi.managerReview(id, {
        action: values.action,
        comment: values.comment
      });
      message.success('审核操作成功');
      setReviewModalVisible(false);
      fetchDetail();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!detail?.application) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
          返回
        </Button>
        <Empty description="申请不存在" />
      </div>
    );
  }

  const app = detail.application;
  const statusInfo = getStatusInfo(app.status);
  const canReview = app.status === 'manager_processing';

  const scheduleColumns = [
    { title: '期数', dataIndex: 'period', key: 'period', width: 80 },
    {
      title: '到期日期',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (text) => formatDateTime(text)
    },
    {
      title: '本金',
      dataIndex: 'principal_amount',
      key: 'principal_amount',
      render: (val) => formatCurrency(val)
    },
    {
      title: '利息',
      dataIndex: 'interest_amount',
      key: 'interest_amount',
      render: (val) => formatCurrency(val)
    },
    {
      title: '应还金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (val) => formatCurrency(val)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const info = getRepaymentStatusInfo(status);
        return <Tag color={info.color}>{info.label}</Tag>;
      }
    }
  ];

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        返回
      </Button>

      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>申请详情 - {app.application_no}</span>
        <Space>
          {canReview && (
            <Button type="primary" onClick={() => setReviewModalVisible(true)}>
              审核处理
            </Button>
          )}
          <Tag color={statusInfo.color} style={{ fontSize: 14, padding: '4px 12px' }}>
            {statusInfo.label}
          </Tag>
        </Space>
      </div>

      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="申请编号">{app.application_no}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="借款人">{app.borrower_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="经办人">{app.manager_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="贷款金额">{formatCurrency(app.loan_amount)}</Descriptions.Item>
          <Descriptions.Item label="贷款期限">{app.loan_term}个月</Descriptions.Item>
          <Descriptions.Item label="月利率">{(app.interest_rate * 100).toFixed(2)}%</Descriptions.Item>
          <Descriptions.Item label="贷款用途">{app.purpose || '-'}</Descriptions.Item>
          <Descriptions.Item label="信用评分">{app.credit_score || '-'}</Descriptions.Item>
          <Descriptions.Item label="欺诈风险">
            <Tag color={getFraudRiskInfo(app.fraud_risk_level).color}>
              {getFraudRiskInfo(app.fraud_risk_level).label}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间" span={2}>{formatDateTime(app.created_at)}</Descriptions.Item>
        </Descriptions>
      </Card>

      {detail.riskHits?.length > 0 && (
        <Card title="风控命中记录" style={{ marginBottom: 16 }}>
          <Table
            dataSource={detail.riskHits}
            rowKey="id"
            pagination={false}
            columns={[
              { title: '规则名称', dataIndex: 'rule_name', key: 'rule_name' },
              { title: '风险类型', dataIndex: 'risk_type', key: 'risk_type' },
              {
                title: '风险等级',
                dataIndex: 'risk_level',
                key: 'risk_level',
                render: (level) => {
                  const info = getFraudRiskInfo(level);
                  return <Tag color={info.color}>{info.label}</Tag>;
                }
              },
              { title: '建议', dataIndex: 'suggestion', key: 'suggestion' }
            ]}
          />
        </Card>
      )}

      {detail.schedules?.length > 0 && (
        <Card title="还款计划" style={{ marginBottom: 16 }}>
          <Table
            columns={scheduleColumns}
            dataSource={detail.schedules}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {detail.comments?.length > 0 && (
        <Card title="审批意见" style={{ marginBottom: 16 }}>
          {detail.comments.map((comment, index) => (
            <div key={index} className="comment-item">
              <div className="comment-header">
                <span>{comment.user_name} ({comment.role === 'manager' ? '客户经理' : comment.role === 'risk_expert' ? '风控专家' : '审批总监'})</span>
                <span>{formatDateTime(comment.created_at)}</span>
              </div>
              <div className="comment-content">
                <Tag color={comment.decision === 'approve' ? 'green' : comment.decision === 'reject' ? 'red' : 'orange'}>
                  {comment.decision === 'approve' ? '通过' : comment.decision === 'reject' ? '拒绝' : '退回'}
                </Tag>
                {comment.comment && <span style={{ marginLeft: 8 }}>{comment.comment}</span>}
              </div>
            </div>
          ))}
        </Card>
      )}

      <Modal
        title="贷款审核"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={reviewForm}
          layout="vertical"
          onFinish={handleReview}
        >
          <Form.Item
            name="action"
            label="审核结果"
            rules={[{ required: true, message: '请选择审核结果' }]}
          >
            <Select placeholder="请选择审核结果">
              <Option value="approve">通过</Option>
              <Option value="reject">拒绝</Option>
              <Option value="return">退回修改</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="comment"
            label="审核意见"
          >
            <TextArea rows={4} placeholder="请输入审核意见（可选）" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setReviewModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={actionLoading}>
              确认
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ManagerApplicationDetail;
