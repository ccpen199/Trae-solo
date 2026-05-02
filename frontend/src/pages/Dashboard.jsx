import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  message,
  Space,
  Button,
} from 'antd';
import {
  ControlOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { ruleApi, decisionApi, actionApi } from '../services/api';

function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalRules: 0,
    activeRules: 0,
    totalDecisions: 0,
    blockedItems: { ips: 0, accounts: 0, devices: 0 },
  });
  const [recentDecisions, setRecentDecisions] = useState([]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [rulesRes, decisionsRes, blockedRes] = await Promise.all([
        ruleApi.getAll(),
        decisionApi.getLogs({ limit: 10 }),
        actionApi.getBlocked(),
      ]);

      const rules = rulesRes.data.data || [];
      const activeRules = rules.filter((r) => r.status === 'active');

      setStats({
        totalRules: rules.length,
        activeRules: activeRules.length,
        totalDecisions: decisionsRes.data.data?.length || 0,
        blockedItems: {
          ips: blockedRes.data.data?.ips?.length || 0,
          accounts: blockedRes.data.data?.accounts?.length || 0,
          devices: blockedRes.data.data?.devices?.length || 0,
        },
      });

      setRecentDecisions(decisionsRes.data.data || []);
    } catch (error) {
      message.error('加载仪表盘数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const decisionColumns = [
    {
      title: '请求ID',
      dataIndex: 'request_id',
      key: 'request_id',
      ellipsis: true,
      width: 200,
    },
    {
      title: '规则名称',
      dataIndex: 'rule_name',
      key: 'rule_name',
    },
    {
      title: '决策结果',
      dataIndex: 'decision_result',
      key: 'decision_result',
      render: (result) => {
        let color = 'green';
        let text = '通过';
        if (result === 'reject') {
          color = 'red';
          text = '拒绝';
        } else if (result === 'manual') {
          color = 'orange';
          text = '人工审核';
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '风险分数',
      dataIndex: 'decision_score',
      key: 'decision_score',
      render: (score) => (
        <span style={{ fontWeight: 600, color: score > 50 ? '#ff4d4f' : '#52c41a' }}>
          {score}
        </span>
      ),
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>系统仪表盘</h2>
        <Button icon={<ReloadOutlined />} onClick={loadDashboard} loading={loading}>
          刷新
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="规则总数"
              value={stats.totalRules}
              prefix={<ControlOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="激活规则"
              value={stats.activeRules}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="决策次数"
              value={stats.totalDecisions}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="已拦截"
              value={stats.blockedItems.ips + stats.blockedItems.accounts}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="最近决策记录">
            <Table
              columns={decisionColumns}
              dataSource={recentDecisions}
              rowKey="id"
              size="small"
              loading={loading}
              pagination={{ pageSize: 5, showSizeChanger: false }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="引擎状态">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Tag color="green">Rule-Tree 规则引擎</Tag>
                <span style={{ marginLeft: 8 }}>正常运行</span>
              </div>
              <div>
                <Tag color="green">Variable-Factory 特征引擎</Tag>
                <span style={{ marginLeft: 8 }}>正常运行</span>
              </div>
              <div>
                <Tag color="green">Action-Handler 处置引擎</Tag>
                <span style={{ marginLeft: 8 }}>正常运行</span>
              </div>
              <div>
                <Tag color="green">Backtest-Simulator 回测引擎</Tag>
                <span style={{ marginLeft: 8 }}>正常运行</span>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="快速操作">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" block href="#/rules">
                创建新规则
              </Button>
              <Button block href="#/decision">
                测试决策引擎
              </Button>
              <Button block href="#/reviews">
                处理人工审核
              </Button>
              <Button block href="#/backtest">
                执行回测分析
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
