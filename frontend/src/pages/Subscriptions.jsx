import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Card, message, Spin, Modal, Descriptions, Empty, Space } from 'antd';
import { ExclamationCircleOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { subscriptionApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const { confirm } = Modal;

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const { isAdmin, isOperator } = useAuth();
  const canManage = isAdmin() || isOperator();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await subscriptionApi.getAll();
      setSubscriptions(response.data.data.subscriptions || []);
    } catch (error) {
      message.error('获取订阅列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      active: { text: '活跃', color: 'success', className: 'subscription-status-active' },
      pending: { text: '待激活', color: 'processing', className: 'subscription-status-pending' },
      past_due: { text: '待补款', color: 'warning', className: 'subscription-status-past-due' },
      cancelled: { text: '已取消', color: 'error', className: 'subscription-status-cancelled' },
      expired: { text: '已过期', color: 'default', className: '' },
    };
    return statusMap[status] || { text: status, color: 'default', className: '' };
  };

  const handleCancelSubscription = (record) => {
    confirm({
      title: '确认取消订阅',
      icon: <ExclamationCircleOutlined />,
      content: `您确定要取消 "${record.plan_name}" 订阅吗？`,
      onOk: async () => {
        try {
          await subscriptionApi.cancel(record.id, '用户主动取消');
          message.success('订阅已取消');
          fetchSubscriptions();
        } catch (error) {
          message.error(error.response?.data?.error || '取消订阅失败');
        }
      },
    });
  };

  const handleViewDetails = (record) => {
    setSelectedSubscription(record);
    setDetailModalVisible(true);
  };

  const handlePay = async (record) => {
    try {
      await subscriptionApi.pay(record.id);
      message.success('支付成功，订阅已激活！');
      fetchSubscriptions();
    } catch (error) {
      message.error(error.response?.data?.error || '支付失败');
    }
  };

  const columns = [
    {
      title: '套餐名称',
      dataIndex: 'plan_name',
      key: 'plan_name',
    },
    ...(canManage ? [
      {
        title: '用户',
        dataIndex: 'user_display_name',
        key: 'user_display_name',
        render: (text, record) => text || record.user_username,
      },
    ] : []),
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const info = getStatusInfo(status);
        return <Tag color={info.color} className={info.className}>{info.text}</Tag>;
      },
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price, record) => (
        <span>¥{price?.toFixed(2)}/{getBillingCycleText(record.billing_cycle)}</span>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'current_period_start',
      key: 'current_period_start',
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '到期时间',
      dataIndex: 'current_period_end',
      key: 'current_period_end',
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <Button 
              type="primary" 
              size="small" 
              icon={<CheckOutlined />}
              onClick={() => handlePay(record)}
            >
              支付
            </Button>
          )}
          {record.status === 'active' && (
            <Button 
              type="link" 
              size="small" 
              danger
              icon={<CloseOutlined />}
              onClick={() => handleCancelSubscription(record)}
            >
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  function getBillingCycleText(cycle) {
    const names = {
      monthly: '月',
      quarterly: '季',
      yearly: '年',
      daily: '日',
      weekly: '周',
    };
    return names[cycle] || cycle;
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2 style={{ margin: 0 }}>我的订阅</h2>
      </div>

      <Card className="dashboard-card">
        {subscriptions.length === 0 ? (
          <Empty 
            description="暂无订阅" 
            style={{ padding: 40 }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={subscriptions}
            rowKey="id"
            pagination={false}
          />
        )}
      </Card>

      <Modal
        title="订阅详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {selectedSubscription && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="套餐名称" span={2}>
              {selectedSubscription.plan_name}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getStatusInfo(selectedSubscription.status).color}>
                {getStatusInfo(selectedSubscription.status).text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="价格">
              ¥{selectedSubscription.price?.toFixed(2)}/{getBillingCycleText(selectedSubscription.billing_cycle)}
            </Descriptions.Item>
            <Descriptions.Item label="开始时间">
              {selectedSubscription.current_period_start 
                ? dayjs(selectedSubscription.current_period_start).format('YYYY-MM-DD HH:mm') 
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="到期时间">
              {selectedSubscription.current_period_end 
                ? dayjs(selectedSubscription.current_period_end).format('YYYY-MM-DD HH:mm') 
                : '-'}
            </Descriptions.Item>
            {selectedSubscription.trial_start && (
              <>
                <Descriptions.Item label="试用开始">
                  {dayjs(selectedSubscription.trial_start).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="试用结束">
                  {dayjs(selectedSubscription.trial_end).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="下次扣款">
              {selectedSubscription.next_billing_at 
                ? dayjs(selectedSubscription.next_billing_at).format('YYYY-MM-DD HH:mm') 
                : '-'}
            </Descriptions.Item>
            {selectedSubscription.cancelled_at && (
              <>
                <Descriptions.Item label="取消时间">
                  {dayjs(selectedSubscription.cancelled_at).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="取消原因">
                  {selectedSubscription.cancel_reason || '-'}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Subscriptions;
