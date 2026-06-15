import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Empty, Modal, Form, Input, InputNumber, message, Avatar } from 'antd';
import { SafetyOutlined, UserOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import type { InsuranceClaim } from '../types';
import { useAuth } from '../context/AuthContext';

function InsuranceClaims() {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [currentClaim, setCurrentClaim] = useState<InsuranceClaim | null>(null);
  const [form] = Form.useForm();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const data: any = await api.get('/insurance-claims', { params: { limit: 50 } });
      setClaims(data.claims);
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待处理', color: 'orange' },
      processing: { text: '处理中', color: 'blue' },
      approved: { text: '已赔付', color: 'green' },
      rejected: { text: '已拒绝', color: 'red' },
      auto_triggered: { text: '自动触发', color: 'purple' },
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  const handleViewDetail = (claim: InsuranceClaim) => {
    setCurrentClaim(claim);
    setDetailVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      await api.post('/insurance-claims', values);
      message.success('理赔申请提交成功');
      setCreateVisible(false);
      form.resetFields();
      fetchClaims();
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交失败');
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <Card 
        title={<span><SafetyOutlined /> 保险理赔</span>}
        extra={
          user?.role === 'employer' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>
              申请理赔
            </Button>
          )
        }
        style={{ marginBottom: 16 }}
      />

      <Card style={{ marginBottom: 16 }} size="small">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 32, color: '#1890ff' }}>🏛️</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>中国人保 (PICC)</div>
            <div style={{ color: '#8c8c8c', fontSize: 13 }}>平台合作保险公司，理赔快速响应</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ color: '#52c41a' }}>服务中</div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>24小时内响应</div>
          </div>
        </div>
      </Card>
      
      <List
        loading={loading}
        dataSource={claims}
        locale={{ emptyText: <Empty description="暂无理赔记录" /> }}
        renderItem={(item) => {
          const statusInfo = getStatusText(item.status);
          return (
            <List.Item
              style={{ background: 'white', marginBottom: 12, borderRadius: 8, padding: 16 }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar icon={<SafetyOutlined />} style={{ background: '#1890ff' }} />
                }
                title={
                  <span style={{ fontWeight: 500 }}>
                    {item.claim_reason}
                    <Tag color={statusInfo.color} style={{ marginLeft: 12 }}>{statusInfo.text}</Tag>
                  </span>
                }
                description={
                  <div>
                    <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>
                      保单号: {item.policy_no} | 申请金额: ¥{item.claim_amount}
                    </div>
                    {item.payout_amount !== undefined && item.payout_amount > 0 && (
                      <div style={{ color: '#52c41a' }}>已赔付: ¥{item.payout_amount}</div>
                    )}
                    <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
                      {item.created_at}
                    </div>
                  </div>
                }
              />
              <Button size="small" onClick={() => handleViewDetail(item)}>查看详情</Button>
            </List.Item>
          );
        }}
      />

      <Modal
        title="理赔详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {currentClaim && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#8c8c8c', marginBottom: 4 }}>理赔原因</div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{currentClaim.claim_reason}</div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#8c8c8c', marginBottom: 4 }}>详细描述</div>
              <div>{currentClaim.description || '暂无描述'}</div>
            </div>

            <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
              <div>
                <div style={{ color: '#8c8c8c', marginBottom: 4 }}>申请金额</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#fa8c16' }}>¥{currentClaim.claim_amount}</div>
              </div>
              <div>
                <div style={{ color: '#8c8c8c', marginBottom: 4 }}>赔付金额</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>
                  ¥{currentClaim.payout_amount || 0}
                </div>
              </div>
              <div>
                <div style={{ color: '#8c8c8c', marginBottom: 4 }}>状态</div>
                <Tag color={getStatusText(currentClaim.status).color}>
                  {getStatusText(currentClaim.status).text}
                </Tag>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#8c8c8c', marginBottom: 4 }}>保单号</div>
              <div>{currentClaim.policy_no}</div>
            </div>

            <div>
              <div style={{ color: '#8c8c8c', marginBottom: 4 }}>保险公司</div>
              <div>{currentClaim.insurance_company}</div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="申请理赔"
        open={createVisible}
        onCancel={() => setCreateVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item label="关联订单ID" name="order_id">
            <Input placeholder="请输入订单ID" />
          </Form.Item>
          <Form.Item label="订单类型" name="order_type">
            <Input placeholder="labor / delivery / moving" />
          </Form.Item>
          <Form.Item label="理赔金额 (元)" name="claim_amount" rules={[{ required: true, message: '请输入理赔金额' }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item label="理赔原因" name="claim_reason" rules={[{ required: true, message: '请输入理赔原因' }]}>
            <Input placeholder="请输入理赔原因" />
          </Form.Item>
          <Form.Item label="详细描述" name="description">
            <Input.TextArea rows={4} placeholder="请详细描述理赔情况" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">提交申请</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default InsuranceClaims;
