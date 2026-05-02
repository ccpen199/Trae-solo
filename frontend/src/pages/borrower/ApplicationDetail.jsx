import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Table, Button, Spin, Empty, Divider, Timeline, Modal, message, Space, Alert, Form, Input, InputNumber, Select } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, EditOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { applicationApi } from '../../services/api.js';
import { getStatusInfo, getFraudRiskInfo, getRepaymentStatusInfo, formatCurrency, formatDateTime } from '../../utils/status.js';

const { Option } = Select;
const { TextArea } = Input;

function BorrowerApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

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

  const handleConfirmContract = async () => {
    Modal.confirm({
      title: '确认借款合同',
      content: '请确认您已阅读并同意借款合同条款，确认后将立即放款。',
      okText: '确认并同意',
      cancelText: '取消',
      onOk: async () => {
        try {
          setConfirmLoading(true);
          await applicationApi.confirmContract(id);
          message.success('合同确认成功，贷款已发放');
          fetchDetail();
        } catch (error) {
          message.error(error.response?.data?.error || '确认失败');
        } finally {
          setConfirmLoading(false);
        }
      }
    });
  };

  const handleOpenEdit = () => {
    if (!detail?.application) return;
    const app = detail.application;
    editForm.setFieldsValue({
      loan_amount: app.loan_amount,
      loan_term: app.loan_term,
      purpose: app.purpose || ''
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async (values) => {
    try {
      setEditLoading(true);
      await applicationApi.updateApplication(id, values);
      message.success('申请信息已更新');
      setEditModalVisible(false);
      fetchDetail();
    } catch (error) {
      message.error(error.response?.data?.error || '更新失败');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSubmitApplication = async () => {
    Modal.confirm({
      title: '提交申请',
      content: '确认提交贷款申请？提交后将进行欺诈检测和审批流程。',
      okText: '确认提交',
      cancelText: '取消',
      onOk: async () => {
        try {
          setSubmitLoading(true);
          await applicationApi.submitApplication(id);
          message.success('申请已提交，正在进行审核');
          fetchDetail();
        } catch (error) {
          message.error(error.response?.data?.error || '提交失败');
        } finally {
          setSubmitLoading(false);
        }
      }
    });
  };

  const getStatusTimeline = () => {
    if (!detail?.application) return [];
    const app = detail.application;
    const items = [];

    items.push({
      dot: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      color: 'green',
      children: (
        <div>
          <div className="timeline-status">申请创建</div>
          <div className="timeline-time">{formatDateTime(app.created_at)}</div>
        </div>
      )
    });

    if (app.status !== 'draft') {
      items.push({
        dot: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        color: 'green',
        children: (
          <div>
            <div className="timeline-status">已提交 - 欺诈检测完成</div>
            <div className="timeline-time">风险等级: <Tag color={getFraudRiskInfo(app.fraud_risk_level).color}>
              {getFraudRiskInfo(app.fraud_risk_level).label}
            </Tag></div>
          </div>
        )
      });
    }

    if (['manager_processing', 'pending_risk_review', 'risk_reviewing', 'pending_approval', 'approved', 'awaiting_confirmation', 'active', 'repaid'].includes(app.status)) {
      items.push({
        dot: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        color: 'green',
        children: (
          <div>
            <div className="timeline-status">经理审核完成</div>
            {app.credit_score && (
              <div className="timeline-time">信用评分: {app.credit_score}分</div>
            )}
          </div>
        )
      });
    }

    if (['pending_approval', 'approved', 'awaiting_confirmation', 'active', 'repaid'].includes(app.status)) {
      items.push({
        dot: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        color: 'green',
        children: (
          <div>
            <div className="timeline-status">风控审核完成</div>
          </div>
        )
      });
    }

    if (['approved', 'awaiting_confirmation', 'active', 'repaid'].includes(app.status)) {
      items.push({
        dot: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        color: 'green',
        children: (
          <div>
            <div className="timeline-status">最终审批通过</div>
          </div>
        )
      });
    }

    if (app.status === 'awaiting_confirmation') {
      items.push({
        dot: <CheckCircleOutlined style={{ color: '#faad14' }} />,
        color: 'gold',
        children: (
          <div>
            <div className="timeline-status">待借款人确认合同</div>
          </div>
        )
      });
    }

    if (['active', 'repaid'].includes(app.status)) {
      items.push({
        dot: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        color: 'green',
        children: (
          <div>
            <div className="timeline-status">合同已确认，贷款已发放</div>
          </div>
        )
      });
    }

    if (app.status === 'repaid') {
      items.push({
        dot: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        color: 'green',
        children: (
          <div>
            <div className="timeline-status">贷款已结清</div>
          </div>
        )
      });
    }

    if (app.status === 'rejected') {
      items.push({
        dot: <CheckCircleOutlined style={{ color: '#ff4d4f' }} />,
        color: 'red',
        children: (
          <div>
            <div className="timeline-status">申请已拒绝</div>
          </div>
        )
      });
    }

    return items;
  };

  const scheduleColumns = [
    {
      title: '期数',
      dataIndex: 'period',
      key: 'period',
      width: 80
    },
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

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        返回
      </Button>

      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>申请详情 - {app.application_no}</span>
        <Tag color={statusInfo.color} style={{ fontSize: 14, padding: '4px 12px' }}>
          {statusInfo.label}
        </Tag>
      </div>

      {app.status === 'returned_for_edit' && (
        <Alert
          message="申请被退回，请修改后重新提交"
          description="您的贷款申请被审批人退回，请根据退回意见修改申请信息后重新提交。"
          type="warning"
          showIcon
          action={
            <Space>
              <Button type="primary" size="small" icon={<EditOutlined />} onClick={handleOpenEdit}>
                修改申请
              </Button>
              <Button size="small" icon={<CloudUploadOutlined />} onClick={handleSubmitApplication} loading={submitLoading}>
                重新提交
              </Button>
            </Space>
          }
          style={{ marginBottom: 24 }}
        />
      )}

      {app.status === 'draft' && (
        <Alert
          message="申请草稿"
          description="您可以修改申请信息，确认无误后提交审批。"
          type="info"
          showIcon
          action={
            <Space>
              <Button type="primary" size="small" icon={<EditOutlined />} onClick={handleOpenEdit}>
                编辑申请
              </Button>
              <Button size="small" icon={<CloudUploadOutlined />} onClick={handleSubmitApplication} loading={submitLoading}>
                提交申请
              </Button>
            </Space>
          }
          style={{ marginBottom: 24 }}
        />
      )}

      {app.status === 'awaiting_confirmation' && (
        <Alert
          message="待确认借款合同"
          description="请确认借款合同，确认后贷款将立即发放。"
          type="warning"
          showIcon
          action={
            <Button type="primary" size="small" onClick={handleConfirmContract} loading={confirmLoading}>
              确认合同
            </Button>
          }
          style={{ marginBottom: 24 }}
        />
      )}

      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="申请编号">{app.application_no}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="贷款金额">{formatCurrency(app.loan_amount)}</Descriptions.Item>
          <Descriptions.Item label="贷款期限">{app.loan_term}个月</Descriptions.Item>
          <Descriptions.Item label="月利率">{(app.interest_rate * 100).toFixed(2)}%</Descriptions.Item>
          <Descriptions.Item label="贷款用途">{app.purpose || '-'}</Descriptions.Item>
          <Descriptions.Item label="借款人">{app.borrower_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="经办人">{app.manager_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="信用评分">{app.credit_score || '-'}</Descriptions.Item>
          <Descriptions.Item label="欺诈风险">
            <Tag color={getFraudRiskInfo(app.fraud_risk_level).color}>
              {getFraudRiskInfo(app.fraud_risk_level).label}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间" span={2}>{formatDateTime(app.created_at)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="审批进度" style={{ marginBottom: 16 }}>
        <Timeline
          mode="left"
          items={getStatusTimeline()}
        />
      </Card>

      {detail.schedules?.length > 0 && (
        <Card title="还款计划" className="repayment-schedule" style={{ marginBottom: 16 }}>
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
        <Card title="审批意见" className="approval-comments" style={{ marginBottom: 16 }}>
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

      {detail.contract && (
        <Card title="电子借据" className="contract-section" style={{ marginBottom: 16 }}>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="合同编号">{detail.contract.contract_no}</Descriptions.Item>
            <Descriptions.Item label="借款人确认时间">
              {detail.contract.borrower_confirmed_at ? formatDateTime(detail.contract.borrower_confirmed_at) : '待确认'}
            </Descriptions.Item>
            <Descriptions.Item label="签订时间">
              {detail.contract.signed_at ? formatDateTime(detail.contract.signed_at) : '待签订'}
            </Descriptions.Item>
          </Descriptions>
          <Divider />
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.8 }}>
            {detail.contract.contract_content}
          </div>
        </Card>
      )}

      <Modal
        title="编辑贷款申请"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          <Form.Item
            name="loan_amount"
            label="贷款金额 (元)"
            rules={[{ required: true, message: '请输入贷款金额' }]}
          >
            <InputNumber
              min={1000}
              max={10000000}
              style={{ width: '100%' }}
              placeholder="请输入贷款金额"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="loan_term"
            label="贷款期限 (月)"
            rules={[{ required: true, message: '请选择贷款期限' }]}
          >
            <Select placeholder="请选择贷款期限">
              <Option value={3}>3个月</Option>
              <Option value={6}>6个月</Option>
              <Option value={12}>12个月</Option>
              <Option value={24}>24个月</Option>
              <Option value={36}>36个月</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="purpose"
            label="贷款用途"
            rules={[{ required: true, message: '请输入贷款用途' }]}
          >
            <TextArea rows={3} placeholder="请描述贷款用途" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setEditModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={editLoading}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default BorrowerApplicationDetail;
