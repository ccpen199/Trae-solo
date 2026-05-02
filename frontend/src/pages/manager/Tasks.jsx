import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Card, Spin, Empty, Modal, Form, Select, message, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import { applicationApi } from '../../services/api.js';
import { getStatusInfo, formatCurrency, formatDateTime } from '../../utils/status.js';

const { Option } = Select;
const { TextArea } = Input;

function ManagerTasks() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewForm] = Form.useForm();
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await applicationApi.getApplications();
      setApplications(res.data.applications || []);
    } catch (error) {
      console.error('Fetch applications error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (record) => {
    try {
      await applicationApi.assignApplication(record.id, {});
      message.success('已分配给自己处理');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || '分配失败');
    }
  };

  const handleOpenReview = (record) => {
    setSelectedApp(record);
    setReviewModalVisible(true);
    reviewForm.resetFields();
  };

  const handleReview = async (values) => {
    if (!selectedApp) return;
    try {
      setActionLoading(true);
      await applicationApi.managerReview(selectedApp.id, {
        action: values.action,
        comment: values.comment
      });
      message.success('审核操作成功');
      setReviewModalVisible(false);
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: '申请编号',
      dataIndex: 'application_no',
      key: 'application_no',
      render: (text, record) => (
        <Button type="link" onClick={() => navigate(`/manager/application/${record.id}`)}>
          {text}
        </Button>
      )
    },
    {
      title: '借款人',
      dataIndex: 'borrower_name',
      key: 'borrower_name',
      render: (val) => val || '-'
    },
    {
      title: '贷款金额',
      dataIndex: 'loan_amount',
      key: 'loan_amount',
      render: (val) => formatCurrency(val)
    },
    {
      title: '贷款期限',
      dataIndex: 'loan_term',
      key: 'loan_term',
      render: (val) => `${val}个月`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const info = getStatusInfo(status);
        return <Tag color={info.color}>{info.label}</Tag>;
      }
    },
    {
      title: '欺诈风险',
      dataIndex: 'fraud_risk_level',
      key: 'fraud_risk_level',
      render: (level) => {
        const map = {
          'low': { label: '低风险', color: 'success' },
          'medium': { label: '中风险', color: 'warning' },
          'high': { label: '高风险', color: 'orange' },
          'critical': { label: '极高风险', color: 'error' }
        };
        const info = map[level] || { label: level, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      }
    },
    {
      title: '信用评分',
      dataIndex: 'credit_score',
      key: 'credit_score',
      render: (val) => val || '-'
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => formatDateTime(text)
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => {
        const canAssign = ['pending_initial_review', 'submitted'].includes(record.status);
        const canReview = record.status === 'manager_processing';
        
        return (
          <div style={{ display: 'flex', gap: 8 }}>
            {canAssign && (
              <Button type="primary" size="small" onClick={() => handleAssign(record)}>
                认领
              </Button>
            )}
            {canReview && (
              <Button type="primary" size="small" onClick={() => handleOpenReview(record)}>
                审核
              </Button>
            )}
            <Button type="link" size="small" onClick={() => navigate(`/manager/application/${record.id}`)}>
              详情
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div>
      <div className="page-title">任务列表</div>

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin tip="加载中..." />
          </div>
        ) : applications.length > 0 ? (
          <Table
            columns={columns}
            dataSource={applications}
            rowKey="id"
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        ) : (
          <Empty description="暂无任务" />
        )}
      </Card>

      <Modal
        title="贷款审核"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedApp && (
          <Form
            form={reviewForm}
            layout="vertical"
            onFinish={handleReview}
          >
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
              <div><strong>申请编号:</strong> {selectedApp.application_no}</div>
              <div><strong>金额:</strong> {formatCurrency(selectedApp.loan_amount)}</div>
              <div><strong>期限:</strong> {selectedApp.loan_term}个月</div>
            </div>

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
        )}
      </Modal>
    </div>
  );
}

export default ManagerTasks;
