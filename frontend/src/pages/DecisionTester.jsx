import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  message,
  Row,
  Col,
  Tag,
  Table,
  Divider,
  Space,
  Alert,
} from 'antd';
import { ThunderboltOutlined, ReloadOutlined } from '@ant-design/icons';
import { decisionApi, variableApi } from '../services/api';

function DecisionTester() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [decisionResult, setDecisionResult] = useState(null);
  const [decisionHistory, setDecisionHistory] = useState([]);
  const [variables, setVariables] = useState([]);

  const loadVariables = async () => {
    try {
      const res = await variableApi.getAll();
      setVariables(res.data.data || []);
    } catch (error) {
      console.error('加载变量失败', error);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await decisionApi.getLogs({ limit: 20 });
      setDecisionHistory(res.data.data || []);
    } catch (error) {
      message.error('加载历史记录失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadVariables();
    loadHistory();
  }, []);

  const handleExecute = async (values) => {
    setLoading(true);
    try {
      const requestData = {
        ip_address: values.ip_address,
        user_id: values.user_id,
        session_id: values.session_id || `sess-${Date.now()}`,
        ip_risk_level: values.ip_risk_level,
        login_frequency: values.login_frequency,
        device_fingerprint_similarity: values.device_fingerprint_similarity,
        account_balance: values.account_balance,
        chargeback_count: values.chargeback_count,
      };

      const res = await decisionApi.execute(requestData, {
        environment: 'development',
      });

      setDecisionResult(res.data.data);
      message.success('决策执行完成');
      loadHistory();
    } catch (error) {
      message.error('执行决策失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFillTestData = () => {
    const isRisky = Math.random() > 0.5;
    form.setFieldsValue({
      ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      user_id: `user-${1000 + Math.floor(Math.random() * 100)}`,
      session_id: `sess-${Date.now()}`,
      ip_risk_level: isRisky ? 8 + Math.floor(Math.random() * 2) : Math.floor(Math.random() * 5),
      login_frequency: isRisky ? 15 + Math.floor(Math.random() * 20) : Math.floor(Math.random() * 5),
      device_fingerprint_similarity: isRisky ? Math.random() * 0.5 : 0.7 + Math.random() * 0.3,
      account_balance: Math.floor(Math.random() * 50000),
      chargeback_count: isRisky ? Math.floor(Math.random() * 3) : 0,
    });
  };

  const resultColor = (result) => {
    switch (result) {
      case 'reject':
        return 'red';
      case 'manual':
        return 'orange';
      default:
        return 'green';
    }
  };

  const resultText = (result) => {
    switch (result) {
      case 'reject':
        return '拒绝';
      case 'manual':
        return '人工审核';
      default:
        return '通过';
    }
  };

  const historyColumns = [
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
      render: (result) => (
        <Tag color={resultColor(result)}>{resultText(result)}</Tag>
      ),
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
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ margin: 0 }}>决策测试</h2>
        <Button icon={<ReloadOutlined />} onClick={loadHistory} loading={historyLoading}>
          刷新历史
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="输入请求参数">
            <Alert
              message="模拟业务请求"
              description="输入模拟的业务请求参数，决策引擎将根据激活的规则进行判定。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form
              form={form}
              layout="vertical"
              onFinish={handleExecute}
              initialValues={{
                ip_risk_level: 5,
                login_frequency: 5,
                device_fingerprint_similarity: 0.9,
                account_balance: 10000,
                chargeback_count: 0,
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="ip_address" label="IP 地址">
                    <Input placeholder="例如: 192.168.1.100" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="user_id" label="用户ID">
                    <Input placeholder="例如: user-1001" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="session_id" label="会话ID">
                <Input placeholder="例如: sess-abc123" />
              </Form.Item>

              <Divider>风险特征变量</Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="ip_risk_level" label="IP风险等级 (0-10)">
                    <InputNumber min={0} max={10} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="login_frequency" label="登录频率 (次/小时)">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="device_fingerprint_similarity" label="设备指纹相似度 (0-1)">
                    <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="chargeback_count" label="历史拒付次数">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="account_balance" label="账户余额">
                <InputNumber min={0} style={{ width: '100%' }} prefix="¥" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" icon={<ThunderboltOutlined />} htmlType="submit" loading={loading}>
                    执行决策
                  </Button>
                  <Button onClick={handleFillTestData}>填充测试数据</Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="决策结果">
            {decisionResult ? (
              <div>
                <div
                  style={{
                    textAlign: 'center',
                    padding: 24,
                    background: '#fafafa',
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 8 }}>
                    <Tag
                      color={resultColor(decisionResult.result)}
                      style={{ fontSize: 24, padding: '8px 24px', borderRadius: 24 }}
                    >
                      {resultText(decisionResult.result)}
                    </Tag>
                  </div>
                  <div style={{ fontSize: 18, color: '#666' }}>
                    风险分数:
                    <span
                      style={{
                        marginLeft: 8,
                        fontWeight: 600,
                        color: decisionResult.score > 50 ? '#ff4d4f' : '#52c41a',
                      }}
                    >
                      {decisionResult.score}
                    </span>
                  </div>
                </div>

                <Divider>详细信息</Divider>

                <div style={{ marginBottom: 16 }}>
                  <h4>请求ID: {decisionResult.requestId}</h4>
                  <h4>决策记录ID: {decisionResult.decisionLogId}</h4>
                </div>

                {decisionResult.matchedRules && decisionResult.matchedRules.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h4>匹配的规则:</h4>
                    {decisionResult.matchedRules.map((rule, index) => (
                      <div
                        key={index}
                        style={{
                          padding: 8,
                          marginBottom: 4,
                          background: '#fafafa',
                          borderRadius: 4,
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{rule.ruleName}</span>
                        <Tag style={{ marginLeft: 8 }} color={resultColor(rule.result)}>
                          {resultText(rule.result)}
                        </Tag>
                        <span style={{ marginLeft: 8, color: '#999' }}>分数: {rule.score}</span>
                      </div>
                    ))}
                  </div>
                )}

                {decisionResult.actions && decisionResult.actions.length > 0 && (
                  <div>
                    <h4>执行的处置动作:</h4>
                    {decisionResult.actions.map((action, index) => (
                      <div
                        key={index}
                        style={{
                          padding: 8,
                          marginBottom: 4,
                          background: '#fff2f0',
                          borderRadius: 4,
                          borderLeft: '3px solid #ff4d4f',
                        }}
                      >
                        <Tag color="red">{action.actionType}</Tag>
                        <span style={{ marginLeft: 8 }}>目标: {action.target}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                请输入参数并执行决策
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="决策历史记录">
            <Table
              columns={historyColumns}
              dataSource={decisionHistory}
              rowKey="id"
              size="small"
              loading={historyLoading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default DecisionTester;
