import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  message,
  Row,
  Col,
  Tag,
  Space,
  Divider,
  Modal,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  PlayCircleOutlined,
  CodeOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { ruleApi, variableApi } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

function RuleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rule, setRule] = useState(null);
  const [variables, setVariables] = useState([]);
  const [logicJson, setLogicJson] = useState('');
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [testVariables, setTestVariables] = useState({});
  const [testResult, setTestResult] = useState(null);

  const loadRule = async () => {
    setLoading(true);
    try {
      const [ruleRes, variablesRes] = await Promise.all([
        ruleApi.getById(id),
        variableApi.getAll(),
      ]);
      const ruleData = ruleRes.data.data;
      setRule(ruleData);
      setVariables(variablesRes.data.data || []);
      
      if (ruleData.logic_topology) {
        setLogicJson(JSON.stringify(ruleData.logic_topology, null, 2));
      }
    } catch (error) {
      message.error('加载规则失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRule();
  }, [id]);

  const handleSave = async () => {
    try {
      let logicTopology = null;
      if (logicJson) {
        logicTopology = JSON.parse(logicJson);
      }
      setSaving(true);
      await ruleApi.update(id, {
        name: rule.name,
        description: rule.description,
        logic_topology: logicTopology,
      });
      message.success('保存成功');
      loadRule();
    } catch (error) {
      message.error('保存失败：' + error.message);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    try {
      await ruleApi.activate(id, 'development');
      message.success('规则已激活到测试环境');
      loadRule();
    } catch (error) {
      message.error('激活失败');
      console.error(error);
    }
  };

  const handleTest = async () => {
    try {
      const res = await ruleApi.test(id, testVariables);
      setTestResult(res.data.data.result);
      message.success('测试完成');
    } catch (error) {
      message.error('测试失败');
      console.error(error);
    }
  };

  const renderNodeTree = (node, level = 0) => {
    if (!node) return null;

    const nodeStyle = {
      marginLeft: level * 20,
      marginBottom: 8,
    };

    if (node.type === 'condition') {
      return (
        <div key={`${level}-${node.variable}`} style={nodeStyle}>
          <Tag color="blue">条件</Tag>
          <span style={{ marginLeft: 8 }}>
            {node.variable} {node.operator} {node.value}
          </span>
          <div style={{ marginLeft: 16, marginTop: 8 }}>
            <Tag color="green">满足条件 →</Tag>
            {renderNodeTree(node.trueAction, level + 1)}
          </div>
          <div style={{ marginLeft: 16, marginTop: 8 }}>
            <Tag color="orange">不满足条件 →</Tag>
            {renderNodeTree(node.falseAction, level + 1)}
          </div>
        </div>
      );
    }

    if (node.type === 'decision') {
      const color = node.result === 'reject' ? 'red' : node.result === 'manual' ? 'orange' : 'green';
      const text = node.result === 'reject' ? '拒绝' : node.result === 'manual' ? '人工审核' : '通过';
      return (
        <div style={nodeStyle}>
          <Tag color={color}>决策: {text}</Tag>
          <span style={{ marginLeft: 8 }}>分数: {node.score}</span>
        </div>
      );
    }

    return null;
  };

  const statusColor = (status) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const statusText = (status) => {
    switch (status) {
      case 'active':
        return '已激活';
      case 'draft':
        return '草稿';
      default:
        return status;
    }
  };

  if (loading && !rule) {
    return <div>加载中...</div>;
  }

  if (!rule) {
    return <div>规则不存在</div>;
  }

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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/rules')} style={{ marginRight: 16 }}>
            返回列表
          </Button>
          <h2 style={{ margin: 0 }}>规则编辑器: {rule.name}</h2>
          <Tag color={statusColor(rule.status)} style={{ marginLeft: 16 }}>
            {statusText(rule.status)}
          </Tag>
        </div>
        <Space>
          <Button icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
            保存
          </Button>
          <Button icon={<CodeOutlined />} onClick={() => setTestModalVisible(true)}>
            测试规则
          </Button>
          {rule.status !== 'active' && (
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleActivate}>
              激活到测试环境
            </Button>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="基本信息">
            <Form layout="vertical">
              <Form.Item label="规则名称">
                <Input
                  value={rule.name}
                  onChange={(e) => setRule({ ...rule, name: e.target.value })}
                />
              </Form.Item>
              <Form.Item label="描述">
                <TextArea
                  rows={3}
                  value={rule.description}
                  onChange={(e) => setRule({ ...rule, description: e.target.value })}
                />
              </Form.Item>
              <Form.Item label="版本">
                <Input value={rule.version} disabled />
              </Form.Item>
              <Form.Item label="环境">
                <Tag color={rule.environment === 'development' ? 'blue' : 'purple'}>
                  {rule.environment === 'development' ? '开发/测试' : '生产'}
                </Tag>
              </Form.Item>
            </Form>
          </Card>

          <Card title="规则逻辑 (JSON 编辑)" style={{ marginTop: 16 }}>
            <Alert
              message="提示"
              description="直接编辑 JSON 定义规则逻辑拓扑。type 可以是 condition 或 decision。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <TextArea
              rows={15}
              value={logicJson}
              onChange={(e) => setLogicJson(e.target.value)}
              placeholder='{"type": "condition", "variable": "ip_risk_level", "operator": ">", "value": 7, ...}'
              font-family="monospace"
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            />
            <div style={{ marginTop: 16 }}>
              <Space>
                <Button size="small" onClick={() => {
                  const defaultLogic = {
                    type: 'condition',
                    variable: 'ip_risk_level',
                    operator: '>',
                    value: 7,
                    trueAction: { type: 'decision', result: 'reject', score: 100 },
                    falseAction: { type: 'decision', result: 'pass', score: 0 }
                  };
                  setLogicJson(JSON.stringify(defaultLogic, null, 2));
                }}>
                  生成模板
                </Button>
                <Button size="small" onClick={handleSave} loading={saving}>
                  保存逻辑
                </Button>
              </Space>
            </div>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="规则逻辑可视化">
            {rule.logic_topology ? (
              <div style={{ padding: 16, background: '#fafafa', borderRadius: 8 }}>
                {renderNodeTree(rule.logic_topology)}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                暂无规则逻辑，请先定义规则
              </div>
            )}
          </Card>

          <Card title="可用变量" style={{ marginTop: 16 }}>
            {variables.map((v) => (
              <div
                key={v.code}
                style={{
                  padding: 12,
                  marginBottom: 8,
                  background: '#fafafa',
                  borderRadius: 4,
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  {v.name} <Tag color="blue">{v.code}</Tag>
                </div>
                <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                  类型: {v.type} | 来源: {v.source} | 权重: {v.weight}
                </div>
                {v.description && (
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                    {v.description}
                  </div>
                )}
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      <Modal
        title="测试规则"
        open={testModalVisible}
        onCancel={() => {
          setTestModalVisible(false);
          setTestResult(null);
        }}
        onOk={handleTest}
        okText="执行测试"
        cancelText="取消"
        width={700}
      >
        <div>
          <h4>设置测试变量值:</h4>
          <Form layout="vertical">
            {variables.slice(0, 5).map((v) => (
              <Form.Item key={v.code} label={`${v.name} (${v.code})`}>
                <Input
                  type="number"
                  placeholder="输入测试值"
                  value={testVariables[v.code]}
                  onChange={(e) =>
                    setTestVariables({
                      ...testVariables,
                      [v.code]: Number(e.target.value),
                    })
                  }
                />
              </Form.Item>
            ))}
          </Form>

          {testResult && (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                background: '#f5f5f5',
                borderRadius: 8,
              }}
            >
              <h4>测试结果:</h4>
              <p>成功: {testResult.success ? '是' : '否'}</p>
              {testResult.success && (
                <>
                  <p>
                    决策结果:
                    <Tag color={testResult.result === 'reject' ? 'red' : testResult.result === 'manual' ? 'orange' : 'green'}>
                      {testResult.result === 'reject' ? '拒绝' : testResult.result === 'manual' ? '人工审核' : '通过'}
                    </Tag>
                  </p>
                  <p>风险分数: {testResult.score}</p>
                </>
              )}
              {testResult.error && <p style={{ color: 'red' }}>错误: {testResult.error}</p>}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default RuleEditor;
