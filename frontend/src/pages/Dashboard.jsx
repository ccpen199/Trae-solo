import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Button } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  ProductOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { policyApi, claimApi, productApi } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const statusColors = {
  draft: 'default',
  pending_approval: 'orange',
  approved: 'green',
  active: 'green',
  expired: 'default',
  lapsed: 'red',
  pending: 'orange',
  in_review: 'blue',
  validating: 'cyan',
  completed: 'green',
  rejected: 'red',
  escalated: 'purple'
};

const statusNames = {
  draft: '草稿',
  pending_approval: '待审批',
  approved: '已通过',
  active: '保障中',
  expired: '已过期',
  lapsed: '已失效',
  pending: '待处理',
  in_review: '审核中',
  validating: '合规校验',
  completed: '已结案',
  rejected: '已拒赔',
  escalated: '已升级'
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [policyRes, claimRes, productRes] = await Promise.all([
          policyApi.getAll(),
          claimApi.getAll(),
          productApi.getAll()
        ]);
        
        setPolicies(policyRes.data.policies || []);
        setClaims(claimRes.data.claims || []);
        setProducts(productRes.data.products || []);
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const stats = {
    policyholder: [
      { 
        title: '有效保单', 
        value: policies.filter(p => p.status === 'active').length, 
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        color: '#52c41a'
      },
      { 
        title: '待核保', 
        value: policies.filter(p => p.status === 'pending_approval').length, 
        icon: <ClockCircleOutlined style={{ color: '#faad14' }} />,
        color: '#faad14'
      },
      { 
        title: '理赔申请', 
        value: claims.length, 
        icon: <SafetyCertificateOutlined style={{ color: '#1890ff' }} />,
        color: '#1890ff'
      },
      { 
        title: '已结案', 
        value: claims.filter(c => c.status === 'completed').length, 
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        color: '#52c41a'
      }
    ],
    agent: [
      { 
        title: '已上架险种', 
        value: products.filter(p => p.status === 'approved').length, 
        icon: <ProductOutlined style={{ color: '#52c41a' }} />,
        color: '#52c41a'
      },
      { 
        title: '待审批险种', 
        value: products.filter(p => p.status === 'pending_approval').length, 
        icon: <ClockCircleOutlined style={{ color: '#faad14' }} />,
        color: '#faad14'
      },
      { 
        title: '有效保单', 
        value: policies.filter(p => p.status === 'active').length, 
        icon: <FileTextOutlined style={{ color: '#1890ff' }} />,
        color: '#1890ff'
      },
      { 
        title: '待核保', 
        value: policies.filter(p => p.status === 'pending_approval').length, 
        icon: <WarningOutlined style={{ color: '#fa8c16' }} />,
        color: '#fa8c16'
      }
    ],
    underwriter: [
      { 
        title: '待核保保单', 
        value: policies.filter(p => p.status === 'pending_approval').length, 
        icon: <WarningOutlined style={{ color: '#faad14' }} />,
        color: '#faad14'
      },
      { 
        title: '待审批险种', 
        value: products.filter(p => p.status === 'pending_approval').length, 
        icon: <ClockCircleOutlined style={{ color: '#fa8c16' }} />,
        color: '#fa8c16'
      },
      { 
        title: '本月通过', 
        value: policies.filter(p => p.status === 'active').length, 
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        color: '#52c41a'
      },
      { 
        title: '累计保单', 
        value: policies.length, 
        icon: <FileTextOutlined style={{ color: '#1890ff' }} />,
        color: '#1890ff'
      }
    ],
    claim_adjuster: [
      { 
        title: '待处理理赔', 
        value: claims.filter(c => ['pending', 'in_review', 'validating'].includes(c.status)).length, 
        icon: <WarningOutlined style={{ color: '#faad14' }} />,
        color: '#faad14'
      },
      { 
        title: '已结案', 
        value: claims.filter(c => c.status === 'completed').length, 
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        color: '#52c41a'
      },
      { 
        title: '已拒赔', 
        value: claims.filter(c => c.status === 'rejected').length, 
        icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
        color: '#ff4d4f'
      },
      { 
        title: '已升级', 
        value: claims.filter(c => c.status === 'escalated').length, 
        icon: <ArrowRightOutlined style={{ color: '#722ed1' }} />,
        color: '#722ed1'
      }
    ],
    admin: [
      { 
        title: '总保单数', 
        value: policies.length, 
        icon: <FileTextOutlined style={{ color: '#1890ff' }} />,
        color: '#1890ff'
      },
      { 
        title: '有效保单', 
        value: policies.filter(p => p.status === 'active').length, 
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        color: '#52c41a'
      },
      { 
        title: '总理赔数', 
        value: claims.length, 
        icon: <SafetyCertificateOutlined style={{ color: '#722ed1' }} />,
        color: '#722ed1'
      },
      { 
        title: '总险种数', 
        value: products.length, 
        icon: <ProductOutlined style={{ color: '#fa8c16' }} />,
        color: '#fa8c16'
      }
    ]
  };

  const currentStats = stats[user?.role] || stats.policyholder;

  const policyColumns = [
    {
      title: '保单号',
      dataIndex: 'policy_number',
      key: 'policy_number',
    },
    {
      title: '产品名称',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: '投保人',
      dataIndex: 'policyholder_name',
      key: 'policyholder_name',
    },
    {
      title: '保额',
      dataIndex: 'sum_assured',
      key: 'sum_assured',
      render: (value) => `¥${value.toLocaleString()}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusNames[status] || status}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    }
  ];

  const claimColumns = [
    {
      title: '理赔号',
      dataIndex: 'claim_number',
      key: 'claim_number',
    },
    {
      title: '保单号',
      dataIndex: 'policy_number',
      key: 'policy_number',
    },
    {
      title: '申请金额',
      dataIndex: 'claim_amount',
      key: 'claim_amount',
      render: (value) => `¥${value.toLocaleString()}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusNames[status] || status}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>欢迎回来，{user?.name}</Title>
        <Text type="secondary">
          角色: {
            { policyholder: '投保人', agent: '代理人', underwriter: '核保员', claim_adjuster: '理赔员', admin: '管理员' }[user?.role]
          } | {dayjs().format('YYYY年MM月DD日')}
        </Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {currentStats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card bordered={false}>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="最近保单" 
            bordered={false}
            extra={
              <Button type="link" href="/policies">查看全部</Button>
            }
          >
            <Table
              columns={policyColumns}
              dataSource={policies.slice(0, 5)}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card 
            title="最近理赔" 
            bordered={false}
            extra={
              <Button type="link" href="/claims">查看全部</Button>
            }
          >
            <Table
              columns={claimColumns}
              dataSource={claims.slice(0, 5)}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
