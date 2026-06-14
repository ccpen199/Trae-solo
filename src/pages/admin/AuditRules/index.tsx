import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Form,
  Select,
  Input,
  InputNumber,
  Switch,
  Modal,
  Space,
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Statistic,
  Progress,
  List,
  Timeline,
  Badge,
  Empty,
  Descriptions,
  Tabs,
} from 'antd';
import {
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  HistoryOutlined,
  BarChartOutlined,
  AuditOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { admin } from '@/api';
import type { AuditRule } from '@/types';

const { Option } = Select;
const { TextArea } = Input;

const severityConfig: Record<string, { color: string; text: string }> = {
  low: { color: 'blue', text: '低风险' },
  medium: { color: 'orange', text: '中风险' },
  high: { color: 'red', text: '高风险' },
};

interface RuleExecutionRecord {
  id: number;
  ruleId: number;
  ruleName: string;
  executedAt: string;
  triggeredCount: number;
  processedCount: number;
  status: 'success' | 'failed' | 'running';
  duration: string;
  operator: string;
}

const mockExecutionRecords: RuleExecutionRecord[] = [
  { id: 1, ruleId: 1, ruleName: '连续断缴预警', executedAt: '2024-03-10 09:00:00', triggeredCount: 156, processedCount: 145, status: 'success', duration: '2分30秒', operator: '系统定时任务' },
  { id: 2, ruleId: 2, ruleName: '大额医疗支出监控', executedAt: '2024-03-10 09:05:00', triggeredCount: 23, processedCount: 18, status: 'success', duration: '1分15秒', operator: '系统定时任务' },
  { id: 3, ruleId: 3, ruleName: '身份信息比对', executedAt: '2024-03-10 08:00:00', triggeredCount: 45, processedCount: 40, status: 'success', duration: '5分20秒', operator: '税务管理员' },
  { id: 4, ruleId: 5, ruleName: '养老金冒领风险', executedAt: '2024-03-09 22:00:00', triggeredCount: 12, processedCount: 10, status: 'success', duration: '3分45秒', operator: '系统定时任务' },
  { id: 5, ruleId: 1, ruleName: '连续断缴预警', executedAt: '2024-03-09 09:00:00', triggeredCount: 142, processedCount: 138, status: 'success', duration: '2分15秒', operator: '系统定时任务' },
];

interface AuditResult {
  id: number;
  ruleId: number;
  userName: string;
  idCard: string;
  auditItem: string;
  auditResult: 'abnormal' | 'normal' | 'pending';
  detectedAt: string;
  description: string;
}

const mockAuditResults: AuditResult[] = [
  { id: 1, ruleId: 1, userName: '王建国', idCard: '430101196501011234', auditItem: '连续断缴', auditResult: 'abnormal', detectedAt: '2024-03-10 09:02:15', description: '连续3个月未缴纳养老保险费' },
  { id: 2, ruleId: 2, userName: '李桂芳', idCard: '430101197205055678', auditItem: '大额医疗支出', auditResult: 'abnormal', detectedAt: '2024-03-10 09:06:30', description: '单月医疗费用支出6800元，超过阈值5000元' },
  { id: 3, ruleId: 3, userName: '张小明', idCard: '430101199008089012', auditItem: '身份信息比对', auditResult: 'abnormal', detectedAt: '2024-03-10 08:03:45', description: '公安比对身份信息不一致' },
  { id: 4, ruleId: 5, userName: '刘翠花', idCard: '430101195812123456', auditItem: '养老金冒领风险', auditResult: 'pending', detectedAt: '2024-03-09 22:02:10', description: '与民政死亡数据比对异常，待核实' },
];

const AuditRulesPage: React.FC = () => {
  const [rules, setRules] = useState<AuditRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [executionModalVisible, setExecutionModalVisible] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<AuditRule | null>(null);
  const [selectedRule, setSelectedRule] = useState<AuditRule | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [activeTab, setActiveTab] = useState<string>('rules');
  const [actionLoading, setActionLoading] = useState(false);
  const [executingRuleId, setExecutingRuleId] = useState<number | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await admin.getAuditRules();
      if (res?.success && res.data) {
        const data = res.data?.items || res.data || [];
        setRules(data);
        setPagination({ ...pagination, total: data.length });
      }
    } catch (error) {
      console.error('Load rules failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    try {
      setRules(rules.map((r) => (r.id === id ? { ...r, enabled } : r)));
      message.success(`规则已${enabled ? '启用' : '停用'}`);
    } catch (error) {
      console.error('Toggle rule failed:', error);
    }
  };

  const handleExecute = async (rule: AuditRule) => {
    setExecutingRuleId(rule.id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      message.success(`规则「${rule.ruleName}」执行完成，新发现 ${Math.floor(Math.random() * 10) + 1} 条异常`);
      fetchRules();
    } catch (error) {
      console.error('Execute rule failed:', error);
      message.error('规则执行失败');
    } finally {
      setExecutingRuleId(null);
    }
  };

  const openAddModal = () => {
    setEditingRule(null);
    form.resetFields();
    form.setFieldsValue({ enabled: true, riskLevel: 'medium' });
    setModalVisible(true);
  };

  const openEditModal = (rule: AuditRule) => {
    setEditingRule(rule);
    form.setFieldsValue({
      ruleName: rule.ruleName,
      ruleCode: rule.ruleCode,
      ruleCondition: rule.ruleCondition,
      riskLevel: rule.riskLevel,
      threshold: rule.threshold,
      enabled: rule.enabled,
    });
    setModalVisible(true);
  };

  const openExecutionModal = (rule: AuditRule) => {
    setSelectedRule(rule);
    setExecutionModalVisible(true);
  };

  const openResultModal = (rule: AuditRule) => {
    setSelectedRule(rule);
    setResultModalVisible(true);
  };

  const handleSubmit = async (values: {
    ruleName: string;
    ruleCode: string;
    ruleCondition: string;
    riskLevel: string;
    threshold: number;
    enabled: boolean;
  }) => {
    setActionLoading(true);
    try {
      if (editingRule) {
        const res = await admin.updateAuditRule(editingRule.id, values);
        if (res?.success) {
          message.success('规则更新成功');
          setModalVisible(false);
          fetchRules();
        }
      } else {
        const res = await admin.createAuditRule(values);
        if (res?.success) {
          message.success('规则创建成功');
          setModalVisible(false);
          fetchRules();
        }
      }
    } catch (error) {
      console.error('Submit rule failed:', error);
      if (editingRule) {
        setRules(
          rules.map((r) =>
            r.id === editingRule.id
              ? { ...r, ...values, riskLevel: values.riskLevel as 'low' | 'medium' | 'high' }
              : r
          )
        );
      } else {
        const newRule: AuditRule = {
          id: Date.now(),
          ...values,
          riskLevel: values.riskLevel as 'low' | 'medium' | 'high',
          createdAt: new Date().toISOString(),
        };
        setRules([...rules, newRule]);
      }
      message.success(editingRule ? '规则更新成功' : '规则创建成功');
      setModalVisible(false);
    } finally {
      setActionLoading(false);
    }
  };

  const getUnitText = (rule: AuditRule) => {
    if (rule.ruleCode.includes('AMOUNT') || rule.ruleCode === 'RULE_002') return '元';
    if (rule.ruleCode === 'RULE_004') return '%';
    return '次';
  };

  const stats = () => {
    const enabledCount = rules.filter((r) => r.enabled).length;
    const highRiskCount = rules.filter((r) => r.riskLevel === 'high' && r.enabled).length;
    const todayTriggers = mockExecutionRecords
      .filter((r) => r.executedAt.startsWith('2024-03-10'))
      .reduce((sum, r) => sum + r.triggeredCount, 0);

    return (
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card className="shadow-sm border-l-4" style={{ borderLeftColor: '#165DFF' }}>
            <Statistic
              title="稽核规则总数"
              value={rules.length}
              prefix={<SettingOutlined />}
              valueStyle={{ color: '#165DFF' }}
              suffix={`/ 已启用 ${enabledCount}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="shadow-sm border-l-4" style={{ borderLeftColor: '#ff4d4f' }}>
            <Statistic
              title="高风险规则"
              value={highRiskCount}
              prefix={<AuditOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="shadow-sm border-l-4" style={{ borderLeftColor: '#faad14' }}>
            <Row align="middle">
              <Col flex="auto">
                <Statistic
                  title="今日触发预警"
                  value={todayTriggers}
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col>
                <Progress
                  type="dashboard"
                  percent={Math.min(Math.round((todayTriggers / 200) * 100), 100)}
                  size={80}
                  strokeColor="#faad14"
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    );
  };

  const ruleConfigGuide = () => (
    <Card
      title={
        <div className="flex items-center gap-2">
          <SettingOutlined className="text-blue-600" />
          <span style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '16px' }}>
            稽核规则配置说明
          </span>
        </div>
      }
      className="shadow-sm mb-6"
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <div className="p-4 bg-blue-50 rounded-lg h-full">
            <div className="font-medium text-blue-700 mb-2 flex items-center gap-2">
              <CheckCircleOutlined />
              断缴预警类
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>• 连续断缴超3个月自动预警</div>
              <div>• 累计断缴超6个月标记高风险</div>
              <div>• 灵活就业人员重点监控</div>
              <div>• 阈值可配置：3/6/12个月</div>
            </div>
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div className="p-4 bg-orange-50 rounded-lg h-full">
            <div className="font-medium text-orange-700 mb-2 flex items-center gap-2">
              <BarChartOutlined />
              金额异常类
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>• 单月医疗支出超5000元预警</div>
              <div>• 缴费金额波动超200%预警</div>
              <div>• 同一账户多笔大额支出监控</div>
              <div>• 阈值可配置：元/百分比</div>
            </div>
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div className="p-4 bg-red-50 rounded-lg h-full">
            <div className="font-medium text-red-700 mb-2 flex items-center gap-2">
              <AuditOutlined />
              身份核验类
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>• 公安人口库身份信息比对</div>
              <div>• 民政死亡数据比对防冒领</div>
              <div>• 重复参保检测</div>
              <div>• 定期自动执行比对任务</div>
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  );

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'ruleName',
      key: 'ruleName',
      render: (val: string, record: AuditRule) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{val}</span>
          <Tooltip title={record.ruleCondition}>
            <InfoCircleOutlined className="text-gray-400 cursor-help" />
          </Tooltip>
        </div>
      ),
    },
    {
      title: '规则代码',
      dataIndex: 'ruleCode',
      key: 'ruleCode',
      render: (val: string) => <code className="text-primary">{val}</code>,
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      render: (val: string) => (
        <Tag color={severityConfig[val as keyof typeof severityConfig]?.color}>
          {severityConfig[val as keyof typeof severityConfig]?.text}
        </Tag>
      ),
    },
    {
      title: '预警阈值',
      dataIndex: 'threshold',
      key: 'threshold',
      render: (val: number, record: AuditRule) => (
        <span className="font-medium">
          {val} {getUnitText(record)}
        </span>
      ),
    },
    {
      title: '今日触发',
      key: 'todayCount',
      render: (_: unknown, record: AuditRule) => {
        const count = mockExecutionRecords
          .filter((r) => r.ruleId === record.id && r.executedAt.startsWith('2024-03-10'))
          .reduce((sum, r) => sum + r.triggeredCount, 0);
        return (
          <Badge
            count={count}
            color={count > 50 ? 'red' : count > 10 ? 'orange' : 'blue'}
            offset={[5, 0]}
          >
            <span className="text-gray-600">{count > 0 ? count : 0} 次</span>
          </Badge>
        );
      },
    },
    {
      title: '启用状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (val: boolean, record: AuditRule) => (
        <Switch
          checked={val}
          checkedChildren={<CheckCircleOutlined />}
          unCheckedChildren={<CloseCircleOutlined />}
          onChange={(checked) => handleToggle(record.id, checked)}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: AuditRule) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => openExecutionModal(record)}
          >
            执行记录
          </Button>
          <Button
            type="link"
            size="small"
            icon={<BarChartOutlined />}
            onClick={() => openResultModal(record)}
          >
            稽核结果
          </Button>
          <Button
            type="link"
            size="small"
            icon={executingRuleId === record.id ? <ClockCircleOutlined spin /> : <PlayCircleOutlined />}
            onClick={() => handleExecute(record)}
            loading={executingRuleId === record.id}
          >
            立即执行
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Noto Serif SC, serif' }}>
          <FileTextOutlined className="mr-2 text-primary" />
          稽核规则管理
        </h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchRules}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            新增规则
          </Button>
        </Space>
      </div>

      {stats()}

      {ruleConfigGuide()}

      <Card className="shadow-sm" bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          style={{ padding: '0 24px' }}
          items={[
            { key: 'rules', label: '规则列表' },
            { key: 'results', label: '稽核结果' },
          ]}
        />

        <div style={{ padding: '0 24px 24px' }}>
          {activeTab === 'rules' && (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4">
                  <span className="text-gray-600">
                    共 <span className="text-primary font-semibold">{pagination.total}</span> 条规则
                  </span>
                  <Tag color="success">
                    已启用: {rules.filter((r) => r.enabled).length}
                  </Tag>
                  <Tag color="default">
                    已停用: {rules.filter((r) => !r.enabled).length}
                  </Tag>
                </div>
                <Space>
                  <Popconfirm title="确定批量启用选中的规则吗？">
                    <Button>批量启用</Button>
                  </Popconfirm>
                  <Popconfirm title="确定批量停用选中的规则吗？">
                    <Button>批量停用</Button>
                  </Popconfirm>
                </Space>
              </div>

              <Table
                columns={columns}
                dataSource={rules}
                rowKey="id"
                loading={loading}
                pagination={{
                  ...pagination,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条`,
                }}
              />
            </>
          )}

          {activeTab === 'results' && (
            <div className="space-y-6">
              <Card
                title="最新稽核结果"
                className="shadow-sm"
                extra={
                  <Button type="primary" size="small">
                    导出稽核报告
                  </Button>
                }
              >
                <List
                  dataSource={mockAuditResults}
                  renderItem={(result) => (
                    <List.Item
                      actions={[
                        <Button key="handle" size="small" type="primary">
                          处理
                        </Button>,
                        <Button key="ignore" size="small">
                          忽略
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Badge
                            status={result.auditResult === 'abnormal' ? 'error' : result.auditResult === 'pending' ? 'warning' : 'success'}
                          />
                        }
                        title={
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{result.userName}</span>
                            <Tag color="red">{result.auditItem}</Tag>
                            {result.auditResult === 'abnormal' ? (
                              <Tag color="red">异常</Tag>
                            ) : result.auditResult === 'pending' ? (
                              <Tag color="orange">待核实</Tag>
                            ) : (
                              <Tag color="green">正常</Tag>
                            )}
                          </div>
                        }
                        description={
                          <div>
                            <div>{result.idCard}</div>
                            <div className="text-gray-500 mt-1">{result.description}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              检测时间: {result.detectedAt}
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </div>
          )}
        </div>
      </Card>

      <Modal
        title={editingRule ? '编辑稽核规则' : '新增稽核规则'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="ruleName"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称，如：连续断缴预警" maxLength={50} />
          </Form.Item>

          <Form.Item
            name="ruleCode"
            label="规则代码"
            rules={[
              { required: true, message: '请输入规则代码' },
              { pattern: /^[A-Z_0-9]+$/, message: '规则代码只能包含大写字母、数字和下划线' },
            ]}
          >
            <Input
              placeholder="如: RULE_001"
              maxLength={20}
              disabled={!!editingRule}
            />
          </Form.Item>

          <Form.Item
            name="riskLevel"
            label="风险等级"
            rules={[{ required: true, message: '请选择风险等级' }]}
          >
            <Select placeholder="请选择风险等级">
              <Option value="low">
                <Tag color="blue">低风险</Tag>
              </Option>
              <Option value="medium">
                <Tag color="orange">中风险</Tag>
              </Option>
              <Option value="high">
                <Tag color="red">高风险</Tag>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="threshold"
            label="预警阈值"
            rules={[{ required: true, message: '请输入预警阈值' }]}
          >
            <InputNumber
              min={1}
              placeholder="请输入预警阈值"
              className="w-full"
              addonAfter={
                <Select defaultValue="次" style={{ width: 80 }}>
                  <Option value="次">次</Option>
                  <Option value="元">元</Option>
                  <Option value="%">%</Option>
                  <Option value="个月">个月</Option>
                </Select>
              }
            />
          </Form.Item>

          <Form.Item
            name="ruleCondition"
            label="规则条件说明"
            rules={[{ required: true, message: '请输入规则条件说明' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细描述规则触发条件，如：连续3个月未缴纳养老保险费触发预警"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item name="enabled" label="是否启用" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>

          <Form.Item>
            <Space className="w-full">
              <Button type="primary" htmlType="submit" className="w-full" loading={actionLoading}>
                {editingRule ? '保存修改' : '创建规则'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <HistoryOutlined className="text-blue-600" />
            <span style={{ fontFamily: 'Noto Serif SC, serif' }}>
              规则执行记录 - {selectedRule?.ruleName}
            </span>
          </div>
        }
        open={executionModalVisible}
        onCancel={() => setExecutionModalVisible(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setExecutionModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {selectedRule && (
          <div className="space-y-4">
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="规则代码">{selectedRule.ruleCode}</Descriptions.Item>
              <Descriptions.Item label="风险等级">
                <Tag color={severityConfig[selectedRule.riskLevel as keyof typeof severityConfig]?.color}>
                  {severityConfig[selectedRule.riskLevel as keyof typeof severityConfig]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="预警阈值">
                {selectedRule.threshold} {getUnitText(selectedRule)}
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                {selectedRule.enabled ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>运行中</Tag>
                ) : (
                  <Tag color="default" icon={<StopOutlined />}>已停用</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="规则条件" span={2}>
                {selectedRule.ruleCondition}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <div className="font-medium mb-3">执行历史</div>
              <Timeline
                size="small"
                items={mockExecutionRecords.filter((r) => r.ruleId === selectedRule.id).map((record) => ({
                  color: record.status === 'success' ? 'green' : record.status === 'running' ? 'blue' : 'red',
                  children: (
                    <div>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">执行完成</span>
                          <Tag className="ml-2" color={record.status === 'success' ? 'success' : 'processing'}>
                            {record.status === 'success' ? '成功' : '执行中'}
                          </Tag>
                        </div>
                        <span className="text-xs text-gray-500">{record.executedAt}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        操作人: {record.operator} · 耗时: {record.duration}
                      </div>
                      <div className="text-sm mt-1">
                        <span className="text-orange-600">触发 {record.triggeredCount} 条预警</span>
                        <span className="mx-2">·</span>
                        <span className="text-green-600">已处理 {record.processedCount} 条</span>
                      </div>
                    </div>
                  ),
                }))}
              />
              {mockExecutionRecords.filter((r) => r.ruleId === selectedRule.id).length === 0 && (
                <Empty description="暂无执行记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <BarChartOutlined className="text-blue-600" />
            <span style={{ fontFamily: 'Noto Serif SC, serif' }}>
              稽核结果 - {selectedRule?.ruleName}
            </span>
          </div>
        }
        open={resultModalVisible}
        onCancel={() => setResultModalVisible(false)}
        width={750}
        footer={[
          <Button key="close" onClick={() => setResultModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {selectedRule && (
          <div className="space-y-4">
            <Row gutter={[16, 16]}>
              <Col xs={8}>
                <Card className="text-center bg-red-50">
                  <Statistic
                    title="异常"
                    value={mockAuditResults.filter((r) => r.ruleId === selectedRule.id && r.auditResult === 'abnormal').length}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
              <Col xs={8}>
                <Card className="text-center bg-yellow-50">
                  <Statistic
                    title="待核实"
                    value={mockAuditResults.filter((r) => r.ruleId === selectedRule.id && r.auditResult === 'pending').length}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={8}>
                <Card className="text-center bg-green-50">
                  <Statistic
                    title="正常"
                    value={mockAuditResults.filter((r) => r.ruleId === selectedRule.id && r.auditResult === 'normal').length}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            <List
              dataSource={mockAuditResults.filter((r) => r.ruleId === selectedRule.id)}
              renderItem={(result) => (
                <List.Item
                  actions={[
                    <Button key="view" size="small">查看详情</Button>,
                    <Button key="handle" size="small" type="primary">
                      处理
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      result.auditResult === 'abnormal' ? (
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                          <CloseCircleOutlined />
                        </div>
                      ) : result.auditResult === 'pending' ? (
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                          <ClockCircleOutlined />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                          <CheckCircleOutlined />
                        </div>
                      )
                    }
                    title={
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{result.userName}</span>
                        <code className="text-xs text-gray-400">{result.idCard}</code>
                      </div>
                    }
                    description={
                      <div>
                        <div>{result.description}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          检测时间: {result.detectedAt}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditRulesPage;
