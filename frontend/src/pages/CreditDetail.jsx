import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Spin, Divider, List, Tag, Alert, InputNumber, Form, message, Modal, Select } from 'antd';
import { ArrowLeftOutlined, WalletOutlined, EditOutlined } from '@ant-design/icons';
import { creditAPI, loanAPI } from '../services/api';
import AppLayout from '../components/Layout';

const { Option } = Select;

const CreditDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [credit, setCredit] = useState(null);
  const [loans, setLoans] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [applyingLoan, setApplyingLoan] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const creditRes = await creditAPI.getDetail(id);
      setCredit(creditRes.data);
      
      const loanRes = await loanAPI.getByCredit(id);
      setLoans(loanRes.data || []);
    } catch (err) {
      console.error('Fetch detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'blue', text: '待提交' },
      reviewing: { color: 'orange', text: '审核中' },
      approved: { color: 'green', text: '已通过' },
      rejected: { color: 'red', text: '未通过' },
    };
    return configs[status] || { color: 'default', text: status };
  };

  const handleApplyLoan = async () => {
    try {
      const values = await form.validateFields();
      setApplyingLoan(true);
      const res = await loanAPI.create({
        creditId: parseInt(id),
        amount: values.amount,
        term: values.term,
      });
      message.success('借款申请成功');
      setIsModalVisible(false);
      fetchDetail();
    } catch (err) {
      console.error('Apply loan error:', err);
    } finally {
      setApplyingLoan(false);
    }
  };

  if (loading || !credit) {
    return (
      <AppLayout title="申请详情">
        <div className="loading-container">
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  const statusConfig = getStatusConfig(credit.status);
  const canApplyLoan = credit.status === 'approved' && credit.product_status === 'active';

  return (
    <AppLayout title="申请详情">
      <div className="page-container">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/credit')}
          style={{ marginBottom: 16 }}
        >
          返回列表
        </Button>

        {credit.status === 'approved' && credit.product_status !== 'active' && (
          <Alert
            message="产品暂停"
            description="该产品暂时无法申请借款，请稍后再试"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Card title="授信信息">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="产品名称">{credit.product_name}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
            </Descriptions.Item>
            {credit.status === 'approved' && (
              <>
                <Descriptions.Item label="授信额度">
                  <span style={{ color: '#1890ff', fontSize: 18, fontWeight: 'bold' }}>
                    {(credit.approved_amount / 10000).toFixed(2)} 万元
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="授信期限">{credit.approved_term} 个月</Descriptions.Item>
              </>
            )}
            {credit.status === 'rejected' && (
              <Descriptions.Item label="拒绝原因">{credit.reject_reason || '综合评分不足'}</Descriptions.Item>
            )}
            <Descriptions.Item label="申请时间">{new Date(credit.created_at).toLocaleString()}</Descriptions.Item>
          </Descriptions>

          {credit.status === 'pending' && (
            <>
              <Divider />
              <Button type="primary" block icon={<EditOutlined />} onClick={() => navigate(`/credit/apply/${id}`)}>
                继续申请
              </Button>
            </>
          )}

          {canApplyLoan && (
            <>
              <Divider />
              <Button type="primary" block icon={<WalletOutlined />} onClick={() => setIsModalVisible(true)}>
                申请借款
              </Button>
            </>
          )}
        </Card>

        {loans.length > 0 && (
          <>
            <Divider />
            <Card title="借款记录">
              <List
                dataSource={loans}
                renderItem={(loan) => (
                  <List.Item
                    key={loan.id}
                    onClick={() => navigate(`/loan/${loan.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <List.Item.Meta
                      avatar={<WalletOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                      title={`${loan.amount.toFixed(2)} 元`}
                      description={`${loan.term} 期 · ${new Date(loan.created_at).toLocaleDateString()}`}
                    />
                    <Tag color="green">已放款</Tag>
                  </List.Item>
                )}
              />
            </Card>
          </>
        )}

        <Modal
          title="申请借款"
          open={isModalVisible}
          onOk={handleApplyLoan}
          onCancel={() => setIsModalVisible(false)}
          confirmLoading={applyingLoan}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="amount"
              label="借款金额"
              rules={[{ required: true, message: '请输入借款金额' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1000}
                max={credit.approved_amount}
                placeholder={`1000 - ${credit.approved_amount.toFixed(0)} 元`}
                addonAfter="元"
              />
            </Form.Item>
            <Form.Item
              name="term"
              label="借款期限"
              rules={[{ required: true, message: '请选择借款期限' }]}
            >
              <Select placeholder="请选择期限">
                <Option value={3}>3 期</Option>
                <Option value={6}>6 期</Option>
                <Option value={12}>12 期</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default CreditDetail;
