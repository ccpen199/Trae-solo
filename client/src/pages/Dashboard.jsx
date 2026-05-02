import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Tag, 
  Typography, 
  Spin,
  Button,
  Space,
  Progress
} from 'antd';
import { 
  FileTextOutlined, 
  SwapOutlined, 
  MoneyCollectOutlined, 
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { billsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [recentBills, setRecentBills] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSummary();
    fetchRecentBills();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await billsAPI.getSummary();
      if (response.data.success) {
        setSummary(response.data.data);
      }
    } catch (error) {
      console.error('获取汇总失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentBills = async () => {
    try {
      const response = await billsAPI.getList({ pageSize: 10 });
      if (response.data.success) {
        setRecentBills(response.data.data.bills || []);
      }
    } catch (error) {
      console.error('获取票据列表失败:', error);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending_input: { color: 'blue', text: '待票据录入' },
      pending_endorsement: { color: 'orange', text: '待背书流转' },
      pending_discount: { color: 'gold', text: '待贴现申请' },
      pending_maturity: { color: 'purple', text: '待到期提示' },
      archived: { color: 'green', text: '已归档' },
      difference: { color: 'red', text: '差异处理中' }
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getBillTypeLabel = (type) => {
    return type === 'bank_acceptance' ? '银行承兑' : '商业承兑';
  };

  const columns = [
    {
      title: '票据编号',
      dataIndex: 'bill_number',
      key: 'bill_number',
      render: (text, record) => (
        <a onClick={() => navigate(`/bills/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '票据类型',
      dataIndex: 'bill_type',
      key: 'bill_type',
      render: (text) => getBillTypeLabel(text)
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (text) => `¥${text?.toLocaleString() || 0}`
    },
    {
      title: '出票人',
      dataIndex: 'drawer',
      key: 'drawer'
    },
    {
      title: '到期日',
      dataIndex: 'maturity_date',
      key: 'maturity_date',
      render: (text) => text && dayjs(text).format('YYYY-MM-DD')
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => getStatusTag(text)
    }
  ];

  if (loading && !summary) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>仪表盘</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="票据总数"
              value={summary?.summary?.totalCount || 0}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress percent={100} size="small" strokeColor="#1890ff" showInfo={false} />
            </div>
          </Card>
        </Col>
        
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="待背书流转"
              value={summary?.summary?.pendingEndorsementCount || 0}
              prefix={<SwapOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress 
                percent={summary?.summary?.totalCount ? 
                  Math.round((summary?.summary?.pendingEndorsementCount || 0) / summary?.summary?.totalCount * 100) : 0
                } 
                size="small" 
                strokeColor="#fa8c16" 
                showInfo={false} 
              />
            </div>
          </Card>
        </Col>
        
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="待贴现申请"
              value={summary?.summary?.pendingDiscountCount || 0}
              prefix={<MoneyCollectOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress 
                percent={summary?.summary?.totalCount ? 
                  Math.round((summary?.summary?.pendingDiscountCount || 0) / summary?.summary?.totalCount * 100) : 0
                } 
                size="small" 
                strokeColor="#faad14" 
                showInfo={false} 
              />
            </div>
          </Card>
        </Col>
        
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="待到期提示"
              value={summary?.summary?.pendingMaturityCount || 0}
              prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress 
                percent={summary?.summary?.totalCount ? 
                  Math.round((summary?.summary?.pendingMaturityCount || 0) / summary?.summary?.totalCount * 100) : 0
                } 
                size="small" 
                strokeColor="#722ed1" 
                showInfo={false} 
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card 
            hoverable
            onClick={() => navigate('/differences')}
            style={{ 
              background: summary?.summary?.differenceCount > 0 ? '#fff2f0' : '#fff',
              borderColor: summary?.summary?.differenceCount > 0 ? '#ffccc7' : undefined
            }}
          >
            <Statistic
              title="差异处理中"
              value={summary?.summary?.differenceCount || 0}
              prefix={<WarningOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type={summary?.summary?.differenceCount > 0 ? 'danger' : 'secondary'}>
                {summary?.summary?.differenceCount > 0 ? '需要关注' : '无待处理差异'}
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={12} sm={12} md={6}>
          <Card hoverable onClick={() => navigate('/bills?status=archived')}>
            <Statistic
              title="已归档"
              value={summary?.summary?.archivedCount || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">已完成流程</Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="总金额"
              value={summary?.summary?.totalAmount || 0}
              precision={0}
              prefix="¥"
              valueStyle={{ color: '#13c2c2' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">平均金额: ¥{(summary?.summary?.avgAmount || 0).toLocaleString()}</Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={12} sm={12} md={6}>
          <Card hoverable onClick={() => navigate('/maturities')}>
            <Statistic
              title="待录入"
              value={summary?.summary?.pendingInputCount || 0}
              prefix={<FileTextOutlined style={{ color: '#eb2f96' }} />}
              valueStyle={{ color: '#eb2f96' }}
            />
            <div style={{ marginTop: 8 }}>
              <Button type="link" size="small" onClick={() => navigate('/bills')}>
                快速录入 <ArrowRightOutlined />
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Card 
        title="最新票据" 
        extra={
          <Button type="link" onClick={() => navigate('/bills')}>
            查看全部 <ArrowRightOutlined />
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={recentBills}
          rowKey="id"
          pagination={false}
          loading={loading}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default Dashboard;
