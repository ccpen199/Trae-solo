import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  InputNumber,
  Button,
  Table,
  Tag,
  message,
  Typography,
  Alert,
  Divider,
  List,
  Descriptions,
  Space
} from 'antd';
import {
  ArrowLeftOutlined,
  RiseOutlined,
  WarningOutlined,
  SafetyOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { bidApi, projectApi, registrationApi } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const statusColors = {
  locked: 'blue',
  activated: 'green',
  pending: 'orange',
  refunded: 'default',
  deducted: 'red'
};

const statusLabels = {
  locked: '已锁定',
  activated: '已激活',
  pending: '待锁定',
  refunded: '已退回',
  deducted: '已扣除'
};

const BiddingHall = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [bids, setBids] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [bidAmount, setBidAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [projRes, regRes, bidsRes] = await Promise.all([
        projectApi.getProject(projectId),
        registrationApi.getMyRegistration(projectId).catch(() => ({ data: { success: false } })),
        bidApi.getBids(projectId)
      ]);

      if (projRes.data.success) {
        setProject(projRes.data.data);
        const startBid = Number(projRes.data.data.budget) * 0.8;
        setBidAmount(Math.ceil(startBid));
      }
      
      if (regRes.data.success) {
        setRegistration(regRes.data.data);
      }
      
      if (bidsRes.data.success) {
        setBids(bidsRes.data.data || []);
      }

      fetchRanking();
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchRanking = async () => {
    try {
      const res = await bidApi.getRanking(projectId);
      if (res.data.success) {
        setRanking(res.data.data || []);
      }
    } catch (error) {
      console.error('获取排名失败:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchRanking();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (project?.status === 'bidding' && project?.biddingEndDate) {
      const timer = setInterval(() => {
        const now = dayjs();
        const end = dayjs(project.biddingEndDate);
        const diff = end.diff(now);
        if (diff <= 0) {
          setCountdown('00:00:00');
          clearInterval(timer);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdown(
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
          );
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [project]);

  const handleSubmitBid = async () => {
    if (!bidAmount || bidAmount <= 0) {
      message.error('请输入有效的竞价金额');
      return;
    }
    
    if (registration?.depositStatus !== 'activated') {
      message.error('竞价权限未激活，请确保保证金已锁定');
      return;
    }

    try {
      setSubmitLoading(true);
      const response = await bidApi.submitBid({
        projectId,
        amount: bidAmount
      });
      
      if (response.data.success) {
        message.success('竞价成功！');
        const newBid = response.data.data;
        setBids(prev => [newBid, ...prev]);
        setBidAmount(prev => prev + 100);
        fetchRanking();
      } else {
        message.error(response.data.message || '竞价失败');
      }
    } catch (error) {
      message.error('竞价失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitLoading(false);
    }
  };

  const bidColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (_, __, index) => {
        if (index === 0) return <Tag color="gold">第1名</Tag>;
        if (index === 1) return <Tag color="silver">第2名</Tag>;
        if (index === 2) return <Tag color="bronze">第3名</Tag>;
        return `第${index + 1}名`;
      }
    },
    {
      title: '竞买人',
      dataIndex: ['Bidder', 'realName'],
      key: 'bidder',
      render: (name, record) => {
        if (record.Bidder?.id === user?.id) {
          return <Text strong style={{ color: '#1890ff' }}>{name || '我'}</Text>;
        }
        return name || '竞买人';
      }
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => `¥${Number(val).toLocaleString()}`
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('HH:mm:ss')
    },
    {
      title: '状态',
      dataIndex: 'isAbnormal',
      key: 'isAbnormal',
      render: (abnormal) => abnormal ? (
        <Tag color="red" icon={<WarningOutlined />}>异常</Tag>
      ) : (
        <Tag color="green">正常</Tag>
      )
    }
  ];

  const historyColumns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'time',
      render: (date) => dayjs(date).format('MM-DD HH:mm:ss')
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => `¥${Number(val).toLocaleString()}`
    },
    {
      title: '签名',
      dataIndex: 'signature',
      key: 'signature',
      render: (sig) => sig ? (
        <Text type="secondary" copyable={{ text: sig }}>
          {sig.substring(0, 16)}...
        </Text>
      ) : '-'
    },
    {
      title: '状态',
      dataIndex: 'isAbnormal',
      key: 'status',
      render: (abnormal) => abnormal ? (
        <Tag color="red" icon={<WarningOutlined />}>异常</Tag>
      ) : (
        <Tag color="green">正常</Tag>
      )
    }
  ];

  const currentBid = ranking.length > 0 ? ranking[0] : null;
  const myBids = bids.filter(b => b.Bidder?.id === user?.id);
  const myCurrentBid = myBids[0];

  const canBid = registration?.depositStatus === 'activated' && 
                  project?.status === 'bidding';

  return (
    <div>
      <Card 
        title={
          <Title level={4} style={{ margin: 0 }}>
            <Space>
              <Button 
                type="link" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/projects')}
              >
                返回
              </Button>
              <RiseOutlined style={{ color: '#1890ff' }} />
              电子竞价大厅
            </Space>
          </Title>
        }
        extra={
          countdown && (
            <Tag color={countdown === '00:00:00' ? 'red' : 'orange'}>
              剩余时间: {countdown}
            </Tag>
          )
        }
      >
        {project && (
          <>
            <Alert
              message={
                <Space>
                  <SafetyOutlined />
                  <Text strong>项目: {project.name}</Text>
                  <Tag>编号: {project.projectNumber}</Tag>
                  <Tag color={project.status === 'bidding' ? 'orange' : 'default'}>
                    {project.status === 'bidding' ? '竞价进行中' : '竞价已结束'}
                  </Tag>
                </Space>
              }
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            {registration && (
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic 
                      title="我的保证金状态" 
                      value={statusLabels[registration.depositStatus]}
                      prefix={<SafetyOutlined />}
                      valueStyle={{ 
                        color: registration.depositStatus === 'activated' ? '#52c41a' : '#fa8c16' 
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic 
                      title="当前最高出价" 
                      value={currentBid?.amount || project.budget}
                      prefix={<RiseOutlined />}
                      suffix="元"
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic 
                      title="我的当前出价" 
                      value={myCurrentBid?.amount || 0}
                      prefix={<HistoryOutlined />}
                      suffix="元"
                      valueStyle={{ color: myCurrentBid ? '#52c41a' : '#999' }}
                    />
                  </Card>
                </Col>
              </Row>
            )}

            {!canBid && project?.status === 'bidding' && (
              <Alert
                message={
                  registration?.depositStatus === 'locked' 
                    ? '保证金已锁定，请等待激活竞价权限'
                    : registration?.depositStatus === 'pending'
                    ? '请等待银行锁定保证金后再进行竞价'
                    : '您未报名或竞价权限未激活'
                }
                type="warning"
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}

            {canBid && (
              <Card title="提交竞价" style={{ marginBottom: 24 }}>
                <Space size="middle" wrap>
                  <Text strong>出价金额:</Text>
                  <InputNumber
                    size="large"
                    min={bidAmount}
                    step={100}
                    value={bidAmount}
                    onChange={setBidAmount}
                    formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/¥\s?|(,*)/g, '')}
                    style={{ width: 200 }}
                  />
                  <Button.Group>
                    <Button 
                      onClick={() => setBidAmount(prev => prev + 100)}
                    >
                      +100
                    </Button>
                    <Button 
                      onClick={() => setBidAmount(prev => prev + 500)}
                    >
                      +500
                    </Button>
                    <Button 
                      onClick={() => setBidAmount(prev => prev + 1000)}
                    >
                      +1000
                    </Button>
                  </Button.Group>
                  <Button
                    type="primary"
                    size="large"
                    icon={<RiseOutlined />}
                    loading={submitLoading}
                    onClick={handleSubmitBid}
                    disabled={!canBid}
                  >
                    提交竞价
                  </Button>
                </Space>
                <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                  提示：每次竞价将自动记录操作签名，具备防篡改能力。异常价格波动将被自动标记并推送到监管端。
                </Text>
              </Card>
            )}

            <Row gutter={[24, 0]}>
              <Col xs={24} lg={14}>
                <Card title="实时排名">
                  <Table
                    columns={bidColumns}
                    dataSource={ranking}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
              <Col xs={24} lg={10}>
                <Card title="我的竞价历史">
                  {myBids.length > 0 ? (
                    <Table
                      columns={historyColumns}
                      dataSource={myBids}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      scroll={{ y: 300 }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                      暂无竞价记录
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            <Card title="竞价统计" style={{ marginTop: 24 }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={6}>
                  <Statistic title="总竞价次数" value={bids.length} />
                </Col>
                <Col xs={24} sm={6}>
                  <Statistic title="参与人数" value={new Set(bids.map(b => b.Bidder?.id)).size} />
                </Col>
                <Col xs={24} sm={6}>
                  <Statistic title="异常出价" value={bids.filter(b => b.isAbnormal).length} suffix="次" />
                </Col>
                <Col xs={24} sm={6}>
                  <Statistic title="我的出价" value={myBids.length} suffix="次" />
                </Col>
              </Row>
            </Card>
          </>
        )}
      </Card>
    </div>
  );
};

export default BiddingHall;
