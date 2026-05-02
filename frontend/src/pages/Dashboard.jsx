import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Spin, Alert } from 'antd';
import {
  ShoppingCartOutlined,
  MedicineBoxOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { inventoryAPI, purchaseAPI, prescriptionAPI, saleAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingPurchases: 0,
    pendingPrescriptions: 0,
    expiringAlerts: 0,
    todaySales: 0
  });
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [purchasesRes, prescriptionsRes, alertsRes, salesRes] = await Promise.all([
        purchaseAPI.getList({ pageSize: 10 }).catch(() => ({ data: { data: [] } })),
        prescriptionAPI.getList({ status: 'PENDING_REVIEW', pageSize: 10 }).catch(() => ({ data: { data: [] } })),
        inventoryAPI.getAlerts({ isRead: false, pageSize: 10 }).catch(() => ({ data: { data: [] } })),
        saleAPI.getList({ pageSize: 10 }).catch(() => ({ data: { data: [] } }))
      ]);

      const purchaseData = purchasesRes.data?.data || [];
      const prescData = prescriptionsRes.data?.data || [];
      const alertsData = alertsRes.data?.data || [];
      const salesData = salesRes.data?.data || [];

      setStats({
        pendingPurchases: purchaseData.filter(p => 
          ['DRAFT', 'PURCHASING', 'INSPECTING'].includes(p.status)
        ).length,
        pendingPrescriptions: prescData.length,
        expiringAlerts: alertsData.length,
        todaySales: salesData.length
      });

      setRecentPurchases(purchaseData.slice(0, 5));
      setRecentSales(salesData.slice(0, 5));
      setAlerts(alertsData.slice(0, 5));
    } catch (error) {
      console.error('Load dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    DRAFT: 'default',
    PURCHASING: 'processing',
    INSPECTING: 'warning',
    COMPLETED: 'success',
    REJECTED: 'error',
    IN_STOCK: 'success',
    EXPIRING_SOON: 'warning',
    EXPIRED: 'error',
    LOCKED: 'default',
    UPLOADED: 'default',
    PROCESSING: 'processing',
    PENDING_REVIEW: 'warning',
    APPROVED: 'success',
    USED: 'default',
    DRAFT_SALE: 'default',
    REFUNDED: 'error',
    CANCELLED: 'default',
    SUBMITTED: 'processing',
    RECEIVED: 'processing',
    DAMAGED: 'warning',
    LOW_STOCK: 'warning',
    PENDING_PRESCRIPTION: 'warning'
  };

  const statusLabels = {
    DRAFT: '草稿',
    PURCHASING: '采购中',
    INSPECTING: '入库待检',
    COMPLETED: '已完成',
    REJECTED: '已拒绝',
    IN_STOCK: '正常',
    EXPIRING_SOON: '临期',
    EXPIRED: '过期',
    LOCKED: '已锁定',
    UPLOADED: '已上传',
    PROCESSING: '识别中',
    PENDING_REVIEW: '待审核',
    APPROVED: '已通过',
    USED: '已使用',
    DRAFT_SALE: '草稿',
    REFUNDED: '已退货',
    CANCELLED: '已取消',
    SUBMITTED: '已提交',
    RECEIVED: '已收货',
    DAMAGED: '已损坏',
    LOW_STOCK: '低库存',
    PENDING_PRESCRIPTION: '待处方'
  };

  const purchaseColumns = [
    {
      title: '采购单号',
      dataIndex: 'purchaseNo',
      key: 'purchaseNo',
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '供应商',
      dataIndex: ['supplier', 'name'],
      key: 'supplier',
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `¥${amount?.toFixed(2) || '0.00'}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusLabels[status] || status}
        </Tag>
      )
    }
  ];

  const saleColumns = [
    {
      title: '销售单号',
      dataIndex: 'saleNo',
      key: 'saleNo',
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '患者',
      dataIndex: 'patientName',
      key: 'patientName',
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `¥${amount?.toFixed(2) || '0.00'}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusLabels[status] || status}
        </Tag>
      )
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>工作台</h2>
        <p>欢迎回来，{user?.name} | 角色: {
          {
            ADMIN: '系统管理员',
            PURCHASER: '采购员',
            WAREHOUSE_KEEPER: '库管',
            PHARMACIST: '执业药师',
            CASHIER: '收银员'
          }[user?.role] || user?.role
        }</p>
      </div>

      {alerts.length > 0 && (
        <Alert
          message={`您有 ${alerts.length} 条效期预警需要处理`}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card">
            <Statistic
              title="待处理采购"
              value={stats.pendingPurchases}
              prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card">
            <Statistic
              title="待审核处方"
              value={stats.pendingPrescriptions}
              prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card">
            <Statistic
              title="效期预警"
              value={stats.expiringAlerts}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card">
            <Statistic
              title="今日销售"
              value={stats.todaySales}
              prefix={<CheckCircleOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </div>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <div className="table-container">
            <h3 style={{ marginBottom: 16 }}>最近采购单</h3>
            <Table
              columns={purchaseColumns}
              dataSource={recentPurchases}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: '暂无采购单' }}
            />
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <div className="table-container">
            <h3 style={{ marginBottom: 16 }}>最近销售记录</h3>
            <Table
              columns={saleColumns}
              dataSource={recentSales}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: '暂无销售记录' }}
            />
          </div>
        </Col>
      </Row>

      {alerts.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="table-container">
            <h3 style={{ marginBottom: 16 }}>效期预警列表</h3>
            <Table
              columns={[
                {
                  title: '预警级别',
                  dataIndex: 'alertLevel',
                  key: 'alertLevel',
                  render: (level) => {
                    const colors = {
                      1: 'blue',
                      2: 'cyan',
                      3: 'gold',
                      4: 'orange',
                      5: 'red'
                    };
                    return <Tag color={colors[level] || 'default'}>Level {level}</Tag>;
                  }
                },
                {
                  title: '药品',
                  dataIndex: ['inventoryBatch', 'drug', 'name'],
                  key: 'drug',
                },
                {
                  title: '批次号',
                  dataIndex: ['inventoryBatch', 'batchNo'],
                  key: 'batchNo',
                },
                {
                  title: '预警内容',
                  dataIndex: 'message',
                  key: 'message',
                },
                {
                  title: '触发时间',
                  dataIndex: 'triggeredAt',
                  key: 'triggeredAt',
                  render: (date) => new Date(date).toLocaleString()
                }
              ]}
              dataSource={alerts}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
