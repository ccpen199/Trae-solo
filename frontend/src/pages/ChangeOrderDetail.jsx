import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Button, Space, Row, Col, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import dayjs from 'dayjs';

function ChangeOrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/change-orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  const statusColor = {
    draft: 'default',
    pending_approval: 'orange',
    approved: 'blue',
    rejected: 'red',
    executed: 'green',
    cancelled: 'default'
  };

  const statusNames = {
    draft: '草稿',
    pending_approval: '待审批',
    approved: '已批准',
    rejected: '已拒绝',
    executed: '已执行',
    cancelled: '已取消'
  };

  const handleApprove = async () => {
    try {
      await api.post(`/change-orders/${id}/approve`, { approved: true });
      message.success('审批通过');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleReject = async () => {
    try {
      await api.post(`/change-orders/${id}/approve`, { approved: false });
      message.success('已拒绝');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleExecute = async () => {
    try {
      await api.post(`/change-orders/${id}/execute`);
      message.success('执行成功');
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/change-orders')}>
            返回
          </Button>
          <h1 className="page-title" style={{ margin: 0 }}>变更单详情 - {order.change_no}</h1>
          <Tag color={statusColor[order.status]}>{statusNames[order.status]}</Tag>
        </div>
        <Space>
          {order.status === 'pending_approval' && (
            <>
              <Button type="primary" onClick={handleApprove}>审批通过</Button>
              <Button danger onClick={handleReject}>审批拒绝</Button>
            </>
          )}
          {order.status === 'approved' && (
            <Button type="primary" onClick={handleExecute}>执行变更</Button>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="基本信息" className="detail-card">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="变更编号">{order.change_no}</Descriptions.Item>
              <Descriptions.Item label="标题">{order.title}</Descriptions.Item>
              <Descriptions.Item label="变更类型">
                {{ config_change: '配置变更', strategy_change: '策略变更', access_change: '权限变更', emergency: '紧急变更' }[order.change_type]}
              </Descriptions.Item>
              <Descriptions.Item label="风险等级">
                <Tag color={{ low: 'green', medium: 'orange', high: 'red', critical: 'red' }[order.risk_level]}>
                  {{ low: '低', medium: '中', high: '高', critical: '致命' }[order.risk_level]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="应用">{order.app_name}</Descriptions.Item>
              <Descriptions.Item label="环境">{order.env_name}</Descriptions.Item>
              <Descriptions.Item label="策略">{order.strategy_name}</Descriptions.Item>
              <Descriptions.Item label="申请人">{order.applicant_name}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(order.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              {order.executed_at && (
                <Descriptions.Item label="执行时间">{dayjs(order.executed_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="变更描述" className="detail-card">
            <p style={{ whiteSpace: 'pre-wrap' }}>{order.description}</p>
          </Card>
        </Col>
      </Row>

      {order.original_config && (
        <Card title="原始配置" style={{ marginTop: 16 }}>
          <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, overflow: 'auto', maxHeight: 200 }}>
            {JSON.stringify(JSON.parse(order.original_config), null, 2)}
          </pre>
        </Card>
      )}

      {order.new_config && (
        <Card title="新配置" style={{ marginTop: 16 }}>
          <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, overflow: 'auto', maxHeight: 200 }}>
            {JSON.stringify(JSON.parse(order.new_config), null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}

export default ChangeOrderDetail;
