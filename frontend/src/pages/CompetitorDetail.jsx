import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Tabs, Table, Button, Form, Input, InputNumber, Select, Modal,
  message, Tag, Space, Divider, Row, Col, Progress, Spin, Alert,
  Steps, Tooltip
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, CloudDownloadOutlined,
  RobotOutlined, BarChartOutlined, ThunderboltOutlined,
  CheckCircleOutlined, LoadingOutlined
} from '@ant-design/icons';
import {
  competitors, priceHistory, crawlTasks, reviews, features, reports
} from '../api.js';

const { Step } = Steps;

const CompetitorDetail = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [prices, setPrices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [reviewList, setReviewList] = useState([]);
  const [featureList, setFeatureList] = useState([]);
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [autoCrawling, setAutoCrawling] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState(0);
  const [crawlStep, setCrawlStep] = useState(0);
  const [crawlLog, setCrawlLog] = useState([]);
  const crawlTimerRef = useRef(null);
  const [priceForm] = Form.useForm();
  const [taskForm] = Form.useForm();

  useEffect(() => {
    loadData();
    return () => {
      if (crawlTimerRef.current) {
        clearInterval(crawlTimerRef.current);
      }
    };
  }, [id]);

  const loadData = async () => {
    try {
      const data = await competitors.get(id);
      setDetail(data);
      setPrices(data.prices || []);
      const taskData = await crawlTasks.getAll({ competitor_id: id });
      setTasks(taskData);
      const reviewData = await reviews.getAll({ competitor_id: id, is_noise: 0 });
      setReviewList(reviewData);
      const featureData = await features.getCompetitorFeatures(id);
      setFeatureList(featureData);
    } catch (error) {
      message.error('加载数据失败');
    }
  };

  const addLog = (message, type = 'info') => {
    setCrawlLog(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
  };

  const startAutoCrawl = async () => {
    if (!detail?.official_website) {
      message.warning('请先填写官网地址');
      return;
    }

    setAutoCrawling(true);
    setCrawlProgress(0);
    setCrawlStep(0);
    setCrawlLog([]);

    const steps = [
      { name: '抓取网站信息', type: 'website', delay: 2000 },
      { name: '抓取价格信息', type: 'price', delay: 2500 },
      { name: '抓取用户评论', type: 'review', delay: 3000 },
      { name: '提取功能特征', type: 'feature', delay: 3500 }
    ];

    let completedSteps = 0;

    const executeStep = async (index) => {
      if (index >= steps.length) {
        setAutoCrawling(false);
        setCrawlProgress(100);
        addLog('✅ 自动化抓取完成！', 'success');
        message.success('自动化抓取完成！');
        loadData();
        return;
      }

      const step = steps[index];
      setCrawlStep(index);
      addLog(`🚀 开始执行: ${step.name}...`);

      try {
        const taskResult = await crawlTasks.create({
          competitor_id: parseInt(id),
          task_type: step.type,
          target_url: detail.official_website,
          created_by: currentUser?.username || 'system'
        });

        addLog(`📋 创建任务成功，任务ID: ${taskResult.id}`);

        await crawlTasks.execute(taskResult.id);

        const progress = ((index + 1) / steps.length) * 100;
        setCrawlProgress(progress);

        await new Promise(resolve => setTimeout(resolve, step.delay));

        addLog(`✅ ${step.name}完成！`, 'success');
        completedSteps++;
        executeStep(index + 1);

      } catch (error) {
        addLog(`❌ ${step.name}失败: ${error.message}`, 'error');
        setAutoCrawling(false);
        message.error('抓取过程中出现错误');
      }
    };

    executeStep(0);
  };

  const handleGenerateReport = async () => {
    try {
      message.loading('正在生成对比报告...', 0);
      const result = await reports.generateComparison({
        competitor_ids: [parseInt(id)],
        generated_by: currentUser?.username
      });
      message.destroy();
      message.success('报告生成成功！');
      navigate(`/reports`);
    } catch (error) {
      message.destroy();
      message.error('报告生成失败');
    }
  };

  const handleAddPrice = async () => {
    try {
      const values = await priceForm.validateFields();
      await priceHistory.create({ ...values, competitor_id: parseInt(id) });
      message.success('添加成功');
      setPriceModalVisible(false);
      priceForm.resetFields();
      loadData();
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleAddTask = async () => {
    try {
      const values = await taskForm.validateFields();
      await crawlTasks.create({ ...values, competitor_id: parseInt(id), created_by: currentUser?.username || 'system' });
      message.success('任务创建成功');
      setTaskModalVisible(false);
      taskForm.resetFields();
      loadData();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleExecuteTask = async (taskId) => {
    try {
      await crawlTasks.execute(taskId);
      message.success('任务已开始执行');
      setTimeout(loadData, 3000);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleMarkNoise = async (reviewId, isNoise) => {
    try {
      await reviews.markNoise(reviewId, { is_noise: isNoise, operator: currentUser?.username });
      message.success('标记成功');
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleToggleFeature = async (featureId, hasFeature) => {
    try {
      await features.updateCompetitorFeature({
        competitor_id: parseInt(id),
        feature_id: featureId,
        has_feature: hasFeature
      });
      message.success('更新成功');
      loadData();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const priceColumns = [
    { title: '套餐名称', dataIndex: 'plan_name', key: 'plan_name' },
    { title: '价格', dataIndex: 'price', key: 'price', render: (p, r) => `${r.currency} ${p}/${r.price_unit}` },
    { title: '变动类型', dataIndex: 'change_type', key: 'change_type', render: (t) => (
      <Tag color={t === 'increase' ? 'red' : t === 'decrease' ? 'green' : 'blue'}>
        {t === 'increase' ? '上涨' : t === 'decrease' ? '下降' : t === 'new' ? '新增' : '持平'}
      </Tag>
    )},
    { title: '上次价格', dataIndex: 'previous_price', key: 'previous_price', render: (p) => p || '-' },
    { title: '记录时间', dataIndex: 'recorded_at', key: 'recorded_at' }
  ];

  const taskColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '类型', dataIndex: 'task_type', key: 'task_type', render: (t) => {
      const labels = { website: '官网', app_store: '应用商店', price: '价格', review: '评论', feature: '功能' };
      return <Tag color="blue">{labels[t] || t}</Tag>;
    }},
    { title: '目标URL', dataIndex: 'target_url', key: 'target_url', ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => (
      <Tag color={s === 'completed' ? 'green' : s === 'running' ? 'processing' : s === 'failed' ? 'red' : 'default'}>
        {s === 'completed' ? '已完成' : s === 'running' ? '执行中' : s === 'failed' ? '失败' : s}
      </Tag>
    )},
    { title: '结果', dataIndex: 'result', key: 'result', ellipsis: true },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    { title: '操作', key: 'action', render: (_, r) => (
      <Space>
        <Button size="small" onClick={() => navigate(`/tasks/${r.id}`)}>详情</Button>
        {r.status === 'pending' && (
          <Button size="small" type="primary" onClick={() => handleExecuteTask(r.id)}>执行</Button>
        )}
      </Space>
    )}
  ];

  const reviewColumns = [
    { title: '来源', dataIndex: 'source', key: 'source', width: 100 },
    { title: '评分', dataIndex: 'rating', key: 'rating', width: 80, render: (r) => '⭐'.repeat(Math.round(r)) },
    { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
    { title: '评论人', dataIndex: 'reviewer', key: 'reviewer', width: 100 },
    { title: '情感', dataIndex: 'sentiment', key: 'sentiment', width: 80, render: (s) => (
      <Tag color={s === 'positive' ? 'green' : s === 'negative' ? 'red' : 'default'}>
        {s === 'positive' ? '正面' : s === 'negative' ? '负面' : '中性'}
      </Tag>
    )},
    { title: '操作', key: 'action', render: (_, r) => (
      <Button size="small" danger onClick={() => handleMarkNoise(r.id, true)}>标记噪声</Button>
    )}
  ];

  const tabItems = [
    {
      key: 'prices',
      label: '价格历史',
      children: (
        <div>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setPriceModalVisible(true)}>
              记录价格
            </Button>
          </div>
          <Table columns={priceColumns} dataSource={prices} rowKey="id" size="small" />
        </div>
      )
    },
    {
      key: 'tasks',
      label: '抓取任务',
      children: (
        <div>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setTaskModalVisible(true)}>
              创建任务
            </Button>
          </div>
          <Table columns={taskColumns} dataSource={tasks} rowKey="id" size="small" />
        </div>
      )
    },
    {
      key: 'reviews',
      label: '用户评论',
      children: (
        <Table columns={reviewColumns} dataSource={reviewList} rowKey="id" size="small" />
      )
    },
    {
      key: 'features',
      label: '功能对比',
      children: (
        <div>
          <Space direction="vertical" style={{ width: '100%' }}>
            {featureList.map(f => (
              <div key={f.id} style={{ padding: 12, background: '#fafafa', borderRadius: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{f.feature_name}</strong>
                    {f.category && <Tag style={{ marginLeft: 8 }}>{f.category}</Tag>}
                  </div>
                  <Select
                    value={f.has_feature ? 'yes' : 'no'}
                    onChange={(v) => handleToggleFeature(f.id, v === 'yes')}
                    style={{ width: 100 }}
                  >
                    <Select.Option value="yes">✓ 支持</Select.Option>
                    <Select.Option value="no">✗ 不支持</Select.Option>
                  </Select>
                </div>
                {f.notes && <div style={{ marginTop: 8, color: '#666' }}>{f.notes}</div>}
              </div>
            ))}
          </Space>
        </div>
      )
    }
  ];

  if (!detail) return <div style={{ padding: 50, textAlign: 'center' }}><Spin size="large" /></div>;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/competitors')}>
          返回列表
        </Button>
      </div>

      <Card title={`${detail.name} - 竞品详情`} style={{ marginBottom: 16 }}>
        <Row gutter={24}>
          <Col span={16}>
            <p><strong>分类:</strong> <Tag color="blue">{detail.category}</Tag></p>
            <p><strong>状态:</strong> <Tag color={detail.status === 'active' ? 'green' : 'orange'}>{detail.status}</Tag></p>
            <p><strong>创建人:</strong> {detail.created_by}</p>
            <p><strong>官网:</strong> {detail.official_website ? <a href={detail.official_website} target="_blank" rel="noreferrer">访问</a> : '-'}</p>
            <p><strong>应用商店:</strong> {detail.app_store_url ? <a href={detail.app_store_url} target="_blank" rel="noreferrer">访问</a> : '-'}</p>
            <p><strong>创建时间:</strong> {detail.created_at}</p>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Tooltip title="一键执行所有抓取任务">
                <Button
                  type="primary"
                  size="large"
                  icon={<RobotOutlined />}
                  onClick={startAutoCrawl}
                  loading={autoCrawling}
                  disabled={!detail.official_website}
                  style={{ width: '100%' }}
                >
                  🤖 AI 智能抓取
                </Button>
              </Tooltip>
              <Button
                icon={<BarChartOutlined />}
                onClick={handleGenerateReport}
                style={{ width: '100%' }}
              >
                📊 生成分析报告
              </Button>
            </Space>
          </Col>
        </Row>

        {autoCrawling && (
          <div style={{ marginTop: 24, padding: 20, background: '#f0f9ff', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <LoadingOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 12 }} />
              <span style={{ fontSize: 16, fontWeight: 'bold' }}>AI 正在自动抓取分析中...</span>
            </div>
            
            <Steps current={crawlStep} size="small" style={{ marginBottom: 16 }}>
              <Step title="网站信息" icon={<CloudDownloadOutlined />} />
              <Step title="价格信息" icon={<BarChartOutlined />} />
              <Step title="用户评论" icon={<span>💬</span>} />
              <Step title="功能特征" icon={<ThunderboltOutlined />} />
            </Steps>
            
            <Progress percent={Math.round(crawlProgress)} status="active" style={{ marginBottom: 16 }} />
            
            <div style={{ maxHeight: 200, overflowY: 'auto', background: 'white', padding: 12, borderRadius: 4 }}>
              {crawlLog.map((log, i) => (
                <div key={i} style={{ 
                  color: log.type === 'success' ? '#52c41a' : log.type === 'error' ? '#f5222d' : '#1890ff',
                  marginBottom: 4
                }}>
                  [{log.time}] {log.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <Tabs items={tabItems} />
      </Card>

      <Modal title="记录价格" open={priceModalVisible} onOk={handleAddPrice} onCancel={() => setPriceModalVisible(false)}>
        <Form form={priceForm} layout="vertical">
          <Form.Item name="plan_name" label="套餐名称" rules={[{ required: true }]}>
            <Input placeholder="如：基础版、专业版" />
          </Form.Item>
          <Form.Item name="price" label="价格" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入价格" />
          </Form.Item>
          <Form.Item name="currency" label="货币" initialValue="CNY">
            <Select>
              <Select.Option value="CNY">人民币 (CNY)</Select.Option>
              <Select.Option value="USD">美元 (USD)</Select.Option>
              <Select.Option value="EUR">欧元 (EUR)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="price_unit" label="计价单位">
            <Input placeholder="如：月、年、次" />
          </Form.Item>
          <Form.Item name="source_url" label="来源URL">
            <Input placeholder="价格页面地址" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="创建抓取任务" open={taskModalVisible} onOk={handleAddTask} onCancel={() => setTaskModalVisible(false)}>
        <Form form={taskForm} layout="vertical">
          <Form.Item name="task_type" label="任务类型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="website">官网抓取</Select.Option>
              <Select.Option value="app_store">应用商店</Select.Option>
              <Select.Option value="price">价格监控</Select.Option>
              <Select.Option value="review">评论抓取</Select.Option>
              <Select.Option value="feature">功能分析</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="target_url" label="目标URL" rules={[{ required: true }]} initialValue={detail?.official_website}>
            <Input placeholder="请输入要抓取的页面地址" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CompetitorDetail;
