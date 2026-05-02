import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  message,
  Space,
  Modal,
  Select,
  Input,
  InputNumber,
  Form,
  Row,
  Col,
  Statistic,
  Progress,
  List,
  Alert,
  Divider,
} from 'antd';
import {
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { backtestApi, ruleApi } from '../services/api';

const { Option } = Select;

function BacktestPage() {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [rules, setRules] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [form] = Form.useForm();

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await backtestApi.getAll({ limit: 20 });
      setTasks(res.data.data || []);
    } catch (error) {
      message.error('加载回测任务失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async () => {
    try {
      const res = await ruleApi.getAll();
      setRules(res.data.data || []);
    } catch (error) {
      console.error('加载规则失败', error);
    }
  };

  useEffect(() => {
    loadTasks();
    loadRules();
  }, []);

  const handleCreateTask = async (values) => {
    try {
      await backtestApi.create({
        ruleId: values.ruleId,
        name: values.name,
        testConfig: {
          sampleSize: values.sampleSize || 100,
        },
        createdBy: '数据分析员',
      });
      message.success('回测任务创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      loadTasks();
    } catch (error) {
      message.error('创建回测任务失败');
      console.error(error);
    }
  };

  const handleRunTask = async (taskId) => {
    try {
      message.loading({ content: '正在执行回测...', key: 'backtest' });
      const res = await backtestApi.run(taskId);
      message.success({ content: '回测完成', key: 'backtest' });
      setCurrentTask(res.data.data);
      setDetailModalVisible(true);
      loadTasks();
    } catch (error) {
      message.error({ content: '回测执行失败', key: 'backtest' });
      console.error(error);
    }
  };

  const handleViewDetail = (task) => {
    setCurrentTask(task);
    setDetailModalVisible(true);
  };

  const handleDeploy = async (task) => {
    try {
      if (!task.rule_id) {
        message.error('无法找到关联的规则');
        return;
      }
      
      await ruleApi.activate(task.rule_id, 'development');
      message.success('规则已激活到测试环境');
      loadTasks();
      setDetailModalVisible(false);
    } catch (error) {
      message.error('上线失败');
      console.error(error);
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'running':
        return 'blue';
      case 'failed':
        return 'red';
      default:
        return 'default';
    }
  };

  const statusText = (status) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'running':
        return '运行中';
      case 'failed':
        return '失败';
      default:
        return '待执行';
    }
  };

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '关联规则ID',
      dataIndex: 'rule_id',
      key: 'rule_id',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={statusColor(status)}>{statusText(status)}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    {
      title: '完成时间',
      dataIndex: 'completed_at',
      key: 'completed_at',
      width: 180,
      render: (time) => time || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <Button
              icon={<PlayCircleOutlined />}
              size="small"
              type="primary"
              onClick={() => handleRunTask(record.id)}
            >
              执行
            </Button>
          )}
          {record.status === 'completed' && (
            <Button icon={<EyeOutlined />} size="small" onClick={() => handleViewDetail(record)}>
              查看报告
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const renderReport = (report) => {
    if (!report) return null;
    const { summary, confusionMatrix } = report;

    return (
      <div>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总样本数"
                value={summary?.total || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="正确判定"
                value={summary?.correct || 0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="错误判定"
                value={summary?.incorrect || 0}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="准确率"
                value={summary?.accuracy || 0}
                suffix="%"
                valueStyle={{
                  color: (summary?.accuracy || 0) >= 80 ? '#52c41a' : '#faad14',
                }}
              />
            </Card>
          </Col>
        </Row>

        <Divider>详细指标</Divider>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card size="small" title="精确率 (Precision)">
              <Progress
                percent={summary?.precision || 0}
                format={(percent) => `${percent}%`}
                strokeColor={summary?.precision >= 80 ? '#52c41a' : '#faad14'}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="召回率 (Recall)">
              <Progress
                percent={summary?.recall || 0}
                format={(percent) => `${percent}%`}
                strokeColor={summary?.recall >= 80 ? '#52c41a' : '#faad14'}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="F1 分数">
              <Progress
                percent={summary?.f1Score || 0}
                format={(percent) => `${percent}%`}
                strokeColor={summary?.f1Score >= 80 ? '#52c41a' : '#faad14'}
              />
            </Card>
          </Col>
        </Row>

        <Divider>混淆矩阵</Divider>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card size="small" title="真阳性 (TP) - 正确识别风险">
              <Statistic value={confusionMatrix?.truePositives || 0} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="真阴性 (TN) - 正确识别正常">
              <Statistic value={confusionMatrix?.trueNegatives || 0} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="假阳性 (FP) - 误拦截">
              <Statistic value={confusionMatrix?.falsePositives || 0} valueStyle={{ color: '#faad14' }} />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="假阴性 (FN) - 漏判">
              <Statistic value={confusionMatrix?.falseNegatives || 0} valueStyle={{ color: '#ff4d4f' }} />
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderSuggestions = (suggestions) => {
    if (!suggestions) return null;

    const isDeployable = suggestions.deployable;

    return (
      <div>
        <Alert
          message={isDeployable ? '建议上线' : '建议优化'}
          description={
            isDeployable
              ? '当前规则准确率较高，建议上线到测试环境。'
              : '当前规则存在一些问题，建议优化后再上线。'
          }
          type={isDeployable ? 'success' : 'warning'}
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Divider>优化建议</Divider>

        {suggestions.suggestions && suggestions.suggestions.length > 0 ? (
          <List
            dataSource={suggestions.suggestions}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag
                        color={
                          item.priority === 'high'
                            ? 'red'
                            : item.priority === 'medium'
                            ? 'orange'
                            : 'green'
                        }
                      >
                        {item.priority === 'high' ? '高优先级' : item.priority === 'medium' ? '中优先级' : '低优先级'}
                      </Tag>
                      {item.title}
                    </Space>
                  }
                  description={
                    <div>
                      <p style={{ margin: '8px 0' }}>{item.description}</p>
                      {item.actions && item.actions.length > 0 && (
                        <div>
                          <span style={{ fontWeight: 600 }}>建议操作:</span>
                          <ul style={{ margin: '4px 0 0 20px' }}>
                            {item.actions.map((action, idx) => (
                              <li key={idx}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <p style={{ color: '#999' }}>暂无优化建议</p>
        )}
      </div>
    );
  };

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
        <h2 style={{ margin: 0 }}>回测分析</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadTasks} loading={loading}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            新建回测
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="新建回测任务"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => form.submit()}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTask}>
          <Form.Item
            name="ruleId"
            label="选择规则"
            rules={[{ required: true, message: '请选择要回测的规则' }]}
          >
            <Select placeholder="请选择规则">
              {rules.map((r) => (
                <Option key={r.id} value={r.id}>
                  {r.name} ({r.status === 'active' ? '已激活' : '草稿'})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input
              style={{ width: '100%' }}
              placeholder="例如: 规则回测 #1"
            />
          </Form.Item>

          <Form.Item name="sampleSize" label="测试样本量" initialValue={100}>
            <InputNumber min={10} max={10000} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="回测报告详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={1000}
        footer={
          <Space>
            <Button onClick={() => setDetailModalVisible(false)}>关闭</Button>
            {currentTask?.optimization_suggestions?.deployable && (
              <Button type="primary" icon={<RocketOutlined />} onClick={() => handleDeploy(currentTask)}>
                一键上线
              </Button>
            )}
          </Space>
        }
      >
        {currentTask && (
          <div>
            <Divider>回测报告</Divider>
            {renderReport(currentTask.result_report)}

            {currentTask.optimization_suggestions && (
              <>
                <Divider>优化建议</Divider>
                {renderSuggestions(currentTask.optimization_suggestions)}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default BacktestPage;
