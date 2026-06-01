import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  List,
  Table,
  message,
  Modal,
  Form,
  Input,
  Select,
  Tabs,
  Timeline,
  Typography,
  Row,
  Col
} from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { queryTasks, explanationReports } from '../api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const statusColors = {
  draft: 'default',
  submitted: 'blue',
  executed: 'cyan',
  reviewed: 'green',
  blocked: 'red',
  closed: 'gray'
};

const statusLabels = {
  draft: '草稿',
  submitted: '已提交',
  executed: '已执行',
  reviewed: '已复核',
  blocked: '已拦截',
  closed: '已关闭'
};

const actionLabels = {
  create: '创建',
  submit: '提交',
  execute: '执行',
  review: '审核通过',
  reject: '审核退回',
  close: '关闭'
};

function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [workflow, setWorkflow] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [reportForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [taskRes, workflowRes] = await Promise.all([
        queryTasks.get(id),
        queryTasks.getWorkflow(id)
      ]);
      setTask(taskRes.data);
      setWorkflow(workflowRes.data);

      if (taskRes.data.result_table_id) {
        const resultRes = await queryTasks.getResult(id);
        setResult(resultRes.data);
      }
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    try {
      const res = await queryTasks.execute(id);
      if (res.data.exception) {
        message.warning(`执行完成，发现异常: ${res.data.exception.detail}`);
      } else {
        message.success('执行成功');
      }
      loadData();
    } catch (error) {
      message.error('执行失败');
    }
  };

  const handleReview = async (values) => {
    try {
      await queryTasks.review(id, values);
      message.success('审核成功');
      setReviewModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('审核失败');
    }
  };

  const handleCreateReport = async (values) => {
    try {
      await explanationReports.create({
        task_id: id,
        ...values
      });
      message.success('创建报告成功');
      setReportModalVisible(false);
      reportForm.resetFields();
    } catch (error) {
      message.error('创建报告失败');
    }
  };

  const anomalyColumns = [
    { title: '异常类型', dataIndex: 'anomaly_type', key: 'anomaly_type' },
    { title: '字段名', dataIndex: 'field_name', key: 'field_name' },
    { title: '异常值', dataIndex: 'anomaly_value', key: 'anomaly_value' },
    { title: '期望值', dataIndex: 'expected_value', key: 'expected_value' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '严重程度', dataIndex: 'severity', key: 'severity', render: (s) => s === 'high' ? <Tag color="red">高</Tag> : s === 'low' ? <Tag color="green">低</Tag> : <Tag color="orange">中</Tag> }
  ];

  if (loading) return <div>加载中...</div>;
  if (!task) return <div>任务不存在</div>;

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tasks')}>
              返回
            </Button>
            <Title level={3} style={{ margin: 0 }}>任务详情</Title>
          </Space>
        </Col>
        <Col>
          <Space>
            {['submitted', 'reviewed'].includes(task.status) && (
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleExecute}>
                执行
              </Button>
            )}
            {['submitted', 'executed'].includes(task.status) && (
              <Button onClick={() => setReviewModalVisible(true)}>
                审核
              </Button>
            )}
            {task.status === 'executed' && (
              <Button type="primary" onClick={() => setReportModalVisible(true)}>
                生成解释报告
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'basic',
            label: '基本信息',
            children: (
              <Card>
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="任务ID">{task.id}</Descriptions.Item>
                  <Descriptions.Item label="任务名称">{task.task_name}</Descriptions.Item>
                  <Descriptions.Item label="数据源">{task.data_source_name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="状态"><Tag color={statusColors[task.status]}>{statusLabels[task.status]}</Tag></Descriptions.Item>
                  <Descriptions.Item label="优先级">{task.priority === 'high' ? <Tag color="red">高</Tag> : task.priority === 'low' ? <Tag color="green">低</Tag> : <Tag>中</Tag>}</Descriptions.Item>
                  <Descriptions.Item label="创建人">{task.created_by}</Descriptions.Item>
                  <Descriptions.Item label="创建时间">{task.created_at}</Descriptions.Item>
                  <Descriptions.Item label="更新时间">{task.updated_at}</Descriptions.Item>
                  <Descriptions.Item label="描述" span={2}>{task.description || '-'}</Descriptions.Item>
                  {task.query_sql && (
                    <Descriptions.Item label="SQL语句" span={2}>
                      <Text code>{task.query_sql}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )
          },
          {
            key: 'result',
            label: '执行结果',
            disabled: !result,
            children: result && (
              <Card>
                <Descriptions column={3} bordered style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="结果表名">{result.table_name}</Descriptions.Item>
                  <Descriptions.Item label="记录数">{result.record_count}</Descriptions.Item>
                  <Descriptions.Item label="异常数"><Tag color="red">{result.anomaly_count}</Tag></Descriptions.Item>
                  <Descriptions.Item label="执行时间">{result.execution_time}ms</Descriptions.Item>
                  <Descriptions.Item label="状态">{result.status}</Descriptions.Item>
                </Descriptions>
                <Title level={5}>异常记录</Title>
                <Table
                  columns={anomalyColumns}
                  dataSource={result.anomalies || []}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </Card>
            )
          },
          {
            key: 'workflow',
            label: '工作流',
            children: (
              <Card>
                <Timeline>
                  {workflow.map(log => (
                    <Timeline.Item key={log.id}>
                      <Space>
                        <Text strong>{actionLabels[log.action] || log.action}</Text>
                        <Text type="secondary">操作人: {log.actor}</Text>
                        <Text type="secondary">{log.created_at}</Text>
                      </Space>
                      {log.reason && <div style={{ marginTop: 4 }}>{log.reason}</div>}
                      {log.previous_status && (
                        <div style={{ marginTop: 4 }}>
                          <Tag>{statusLabels[log.previous_status]}</Tag>
                          <span> → </span>
                          <Tag color={statusColors[log.new_status]}>{statusLabels[log.new_status]}</Tag>
                        </div>
                      )}
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>
            )
          }
        ]}
      />

      <Modal
        title="审核任务"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleReview}>
          <Form.Item name="action" label="审核结果" rules={[{ required: true }]}>
            <Select>
              <Option value="approve">通过</Option>
              <Option value="reject">退回</Option>
            </Select>
          </Form.Item>
          <Form.Item name="comments" label="审核意见">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确认</Button>
              <Button onClick={() => setReviewModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="生成解释报告"
        open={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={reportForm} layout="vertical" onFinish={handleCreateReport}>
          <Form.Item name="title" label="报告标题" rules={[{ required: true }]}>
            <Input defaultValue={`${task.task_name} - 异常解释报告`} />
          </Form.Item>
          <Form.Item name="summary" label="摘要">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="root_cause" label="根本原因">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="impact_analysis" label="影响分析">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="recommendations" label="建议措施">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">生成报告</Button>
              <Button onClick={() => setReportModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default TaskDetail;
