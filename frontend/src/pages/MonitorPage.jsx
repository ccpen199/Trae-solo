import React, { useState, useEffect } from 'react'
import {
  Row, Col, Card, Table, Button, Space, Tag, Select, DatePicker, Statistic, Alert, Modal, Form, InputNumber, message,
  Progress, Divider, Descriptions, Drawer, Tooltip, Badge,
} from 'antd'
import { 
  LineChartOutlined, WarningOutlined, CheckCircleOutlined, PlusOutlined, ReloadOutlined,
  SafetyOutlined, EyeOutlined, StopOutlined, ThunderboltOutlined,
} from '@ant-design/icons'
import { metricsApi, strategiesApi, releasesApi } from '../api.js'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const THRESHOLDS = {
  js_errors: { warning: 10, critical: 50, label: 'JS错误' },
  api_errors: { warning: 5, critical: 20, label: '接口错误' },
  white_screen_rate: { warning: 0.01, critical: 0.05, label: '白屏率' },
}

export default function MonitorPage() {
  const [data, setData] = useState([])
  const [strategies, setStrategies] = useState([])
  const [selectedStrategy, setSelectedStrategy] = useState(null)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [alertStatus, setAlertStatus] = useState(null)
  const [anomalyDetail, setAnomalyDetail] = useState(null)
  const [strategyDetail, setStrategyDetail] = useState(null)
  const [summary, setSummary] = useState({ 
    pv: 0, uv: 0, js_errors: 0, api_errors: 0, 
    white_screen_rate: 0, core_conversion: 0, user_feedback_score: 0 
  })
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [res, strats] = await Promise.all([
        selectedStrategy ? metricsApi.list({ strategy_id: selectedStrategy }) : metricsApi.list(),
        strategiesApi.list(),
      ])
      setData(res)
      setStrategies(strats)
      
      if (selectedStrategy) {
        const strat = strats.find(s => s.id === selectedStrategy)
        setStrategyDetail(strat)
      }
      
      if (res.length > 0) {
        const latest = res[0]
        setSummary({
          pv: latest.pv,
          uv: latest.uv,
          js_errors: latest.js_errors,
          api_errors: latest.api_errors,
          white_screen_rate: latest.white_screen_rate,
          core_conversion: latest.core_conversion,
          user_feedback_score: latest.user_feedback_score,
        })
        
        if (selectedStrategy) {
          const alertRes = await metricsApi.alertCheck({ strategy_id: selectedStrategy })
          setAlertStatus(alertRes)
          
          if (alertRes.has_anomaly) {
            analyzeAnomalies(alertRes, strat)
          } else {
            setAnomalyDetail(null)
          }
        }
      }
    } catch (e) {
      message.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const analyzeAnomalies = (alertRes, strategy) => {
    const anomalies = []
    const { avg } = alertRes
    
    if (avg.js_errors > THRESHOLDS.js_errors.critical) {
      anomalies.push({
        type: 'critical',
        metric: 'JS错误',
        value: avg.js_errors.toFixed(1),
        threshold: THRESHOLDS.js_errors.critical,
        action: '建议立即暂停放量或回滚',
      })
    } else if (avg.js_errors > THRESHOLDS.js_errors.warning) {
      anomalies.push({
        type: 'warning',
        metric: 'JS错误',
        value: avg.js_errors.toFixed(1),
        threshold: THRESHOLDS.js_errors.warning,
        action: '建议观察，如持续异常需暂停',
      })
    }
    
    if (avg.api_errors > THRESHOLDS.api_errors.critical) {
      anomalies.push({
        type: 'critical',
        metric: '接口错误',
        value: avg.api_errors.toFixed(1),
        threshold: THRESHOLDS.api_errors.critical,
        action: '建议立即暂停放量或回滚',
      })
    } else if (avg.api_errors > THRESHOLDS.api_errors.warning) {
      anomalies.push({
        type: 'warning',
        metric: '接口错误',
        value: avg.api_errors.toFixed(1),
        threshold: THRESHOLDS.api_errors.warning,
        action: '建议观察，如持续异常需暂停',
      })
    }
    
    if (avg.white_screen_rate > THRESHOLDS.white_screen_rate.critical) {
      anomalies.push({
        type: 'critical',
        metric: '白屏率',
        value: (avg.white_screen_rate * 100).toFixed(2) + '%',
        threshold: (THRESHOLDS.white_screen_rate.critical * 100).toFixed(2) + '%',
        action: '建议立即暂停放量或回滚',
      })
    } else if (avg.white_screen_rate > THRESHOLDS.white_screen_rate.warning) {
      anomalies.push({
        type: 'warning',
        metric: '白屏率',
        value: (avg.white_screen_rate * 100).toFixed(2) + '%',
        threshold: (THRESHOLDS.white_screen_rate.warning * 100).toFixed(2) + '%',
        action: '建议观察，如持续异常需暂停',
      })
    }
    
    setAnomalyDetail({
      anomalies,
      hasCritical: anomalies.some(a => a.type === 'critical'),
      strategy,
      timestamp: new Date().toISOString(),
    })
  }

  const handleAutoPause = async () => {
    if (!selectedStrategy) return
    try {
      await strategiesApi.pause(selectedStrategy, { 
        operator: 'system-monitor',
        reason: '监控指标异常自动暂停',
      })
      
      await releasesApi.create({
        strategy_id: selectedStrategy,
        phase: '监控暂停',
        operator: 'system-monitor',
        status: 'paused',
        pause_reason: '监控指标异常自动触发暂停',
        check_result: '指标异常-暂停',
        start_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        end_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        metric_threshold: `js_errors<${THRESHOLDS.js_errors.warning}, api_errors<${THRESHOLDS.api_errors.warning}`,
      })
      
      message.success('已自动暂停放量并记录发布日志')
      fetchData()
    } catch (e) {
      message.error(e.message)
    }
  }

  useEffect(() => { fetchData() }, [selectedStrategy])

  const openCreate = () => {
    form.resetFields()
    form.setFieldsValue({ strategy_id: selectedStrategy })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await metricsApi.create(values)
      message.success('指标上报成功')
      setModalOpen(false)
      fetchData()
    } catch (e) {
      message.error(e.message)
    }
  }

  const getMetricColor = (value, thresholds) => {
    if (value > thresholds.critical) return '#ff4d4f'
    if (value > thresholds.warning) return '#faad14'
    return '#52c41a'
  }

  const getProgressStatus = (value, thresholds) => {
    if (value > thresholds.critical) return 'exception'
    if (value > thresholds.warning) return 'active'
    return 'success'
  }

  const columns = [
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 140, render: (v) => dayjs(v).format('MM-DD HH:mm:ss') },
    { title: 'PV', dataIndex: 'pv', key: 'pv', width: 70 },
    { title: 'UV', dataIndex: 'uv', key: 'uv', width: 70 },
    { 
      title: 'JS错误', 
      dataIndex: 'js_errors', 
      key: 'js_errors', 
      width: 90, 
      render: (v) => (
        <Tag color={getMetricColor(v, THRESHOLDS.js_errors)}>
          {v}
        </Tag>
      ) 
    },
    { 
      title: '接口错误', 
      dataIndex: 'api_errors', 
      key: 'api_errors', 
      width: 90, 
      render: (v) => (
        <Tag color={getMetricColor(v, THRESHOLDS.api_errors)}>
          {v}
        </Tag>
      ) 
    },
    { 
      title: '白屏率(%)', 
      dataIndex: 'white_screen_rate', 
      key: 'white_screen_rate', 
      width: 100, 
      render: (v) => (
        <Tag color={getMetricColor(v, THRESHOLDS.white_screen_rate)}>
          {(v * 100).toFixed(2)}
        </Tag>
      ) 
    },
    { title: '核心转化(%)', dataIndex: 'core_conversion', key: 'core_conversion', width: 100, render: (v) => (v * 100).toFixed(2) },
    { title: '反馈评分', dataIndex: 'user_feedback_score', key: 'user_feedback_score', width: 90, render: (v) => v.toFixed(1) },
    { 
      title: '异常', 
      dataIndex: 'is_anomaly', 
      key: 'is_anomaly', 
      width: 70, 
      render: (v) => v ? <Tag color="red" icon={<WarningOutlined />}>异常</Tag> : <Tag color="green" icon={<CheckCircleOutlined />}>正常</Tag> 
    },
  ]

  return (
    <div>
      <Alert
        type="info"
        showIcon
        icon={<SafetyOutlined />}
        message="监控告警说明"
        description="JS错误>50或接口错误>20或白屏率>5%为严重异常，建议立即暂停；超过告警阈值为警告，建议持续观察。"
        style={{ marginBottom: 16 }}
      />
      
      {anomalyDetail && anomalyDetail.hasCritical && (
        <Alert
          type="error"
          showIcon
          icon={<ThunderboltOutlined />}
          message="检测到严重异常！已自动触发暂停放量"
          description={
            <div>
              <p><strong>异常指标：</strong></p>
              <ul>
                {anomalyDetail.anomalies.filter(a => a.type === 'critical').map((a, i) => (
                  <li key={i}>
                    {a.metric}: {a.value} (阈值: {a.threshold}) - {a.action}
                  </li>
                ))}
              </ul>
              <Space style={{ marginTop: 8 }}>
                <Button type="primary" danger onClick={handleAutoPause}>
                  <StopOutlined /> 立即暂停放量
                </Button>
                <Button onClick={() => message.info('已通知运维人员，继续观察中')}>
                  继续观察
                </Button>
              </Space>
            </div>
          }
          style={{ marginBottom: 16 }}
        />
      )}
      
      {alertStatus && alertStatus.has_anomaly && !anomalyDetail?.hasCritical && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message="检测到指标异常，已触发告警"
          description={
            <div>
              <Space>
                <span>JS错误均值: <strong style={{ color: '#faad14' }}>{alertStatus.avg.js_errors.toFixed(1)}</strong></span>
                <span>接口错误均值: <strong style={{ color: '#faad14' }}>{alertStatus.avg.api_errors.toFixed(1)}</strong></span>
                <span>白屏率均值: <strong style={{ color: '#faad14' }}>{(alertStatus.avg.white_screen_rate * 100).toFixed(2)}%</strong></span>
              </Space>
              {anomalyDetail?.anomalies?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {anomalyDetail.anomalies.map((a, i) => (
                    <Tag key={i} color={a.type === 'critical' ? 'red' : 'orange'} style={{ marginRight: 8 }}>
                      {a.metric}: {a.value} - {a.action}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          }
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card className="stat-card" size="small">
            <Statistic 
              title="访问量(PV)" 
              value={summary.pv}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="stat-card" size="small">
            <Statistic title="用户数(UV)" value={summary.uv} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="stat-card" size="small">
            <Statistic 
              title="JS错误" 
              value={summary.js_errors} 
              valueStyle={{ color: getMetricColor(summary.js_errors, THRESHOLDS.js_errors) }}
            />
            <Progress 
              percent={Math.min((summary.js_errors / THRESHOLDS.js_errors.critical) * 100, 100)} 
              size="small"
              status={getProgressStatus(summary.js_errors, THRESHOLDS.js_errors)}
              showInfo={false}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="stat-card" size="small">
            <Statistic 
              title="接口错误" 
              value={summary.api_errors} 
              valueStyle={{ color: getMetricColor(summary.api_errors, THRESHOLDS.api_errors) }}
            />
            <Progress 
              percent={Math.min((summary.api_errors / THRESHOLDS.api_errors.critical) * 100, 100)} 
              size="small"
              status={getProgressStatus(summary.api_errors, THRESHOLDS.api_errors)}
              showInfo={false}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="stat-card" size="small">
            <Statistic 
              title="白屏率(%)" 
              value={(summary.white_screen_rate * 100).toFixed(2)} 
              valueStyle={{ color: getMetricColor(summary.white_screen_rate, THRESHOLDS.white_screen_rate) }}
            />
            <Progress 
              percent={Math.min((summary.white_screen_rate / THRESHOLDS.white_screen_rate.critical) * 100, 100)} 
              size="small"
              status={getProgressStatus(summary.white_screen_rate, THRESHOLDS.white_screen_rate)}
              showInfo={false}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="stat-card" size="small">
            <Statistic 
              title="核心转化(%)" 
              value={(summary.core_conversion * 100).toFixed(2)} 
              valueStyle={{ color: summary.core_conversion < 0.05 ? '#ff4d4f' : undefined }}
            />
          </Card>
        </Col>
      </Row>
      
      {strategyDetail && (
        <Alert
          type="info"
          showIcon
          message={`当前监控策略: ${strategyDetail.name}`}
          description={
            <Space>
              <span>流量比例: <strong>{strategyDetail.traffic_percentage}%</strong></span>
              <span>状态: <Badge status={strategyDetail.status === 'active' ? 'processing' : 'default'} text={strategyDetail.status} /></span>
              {strategyDetail.build_number && <span>版本: {strategyDetail.build_number}</span>}
            </Space>
          }
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="选择灰度策略"
          style={{ width: 220 }}
          value={selectedStrategy}
          onChange={setSelectedStrategy}
          allowClear
          options={strategies.map(s => ({ value: s.id, label: `${s.name} (${s.build_number || '未关联版本'})` }))}
        />
        <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新数据</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={!selectedStrategy}>
          上报指标
        </Button>
        {alertStatus?.has_anomaly && (
          <Tooltip title="基于最新10条指标数据计算">
            <Tag color="blue" icon={<LineChartOutlined />}>
              分析样本: {alertStatus.sample_count}条
            </Tag>
          </Tooltip>
        )}
      </Space>
      
      <Table rowKey="id" loading={loading} dataSource={data} columns={columns} pagination={{ pageSize: 10 }} />
      
      <Modal
        title="上报监控指标"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
        destroyOnHidden
      >
        <Alert
          type="info"
          showIcon
          message="上报说明"
          description="请准确填写监控指标，异常指标会触发告警并可能影响放量策略。"
          style={{ marginBottom: 16 }}
        />
        <Form form={form} layout="vertical">
          <Form.Item name="strategy_id" label="灰度策略" rules={[{ required: true }]}>
            <Select
              options={strategies.map(s => ({ value: s.id, label: `${s.name} (${s.build_number || '未关联版本'})` }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="pv" label="访问量(PV)" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="uv" label="用户数(UV)" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="js_errors" label="JS错误数" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="api_errors" label="接口错误数" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="white_screen_rate" label="白屏率(0-1)" initialValue={0}>
                <InputNumber min={0} max={1} step={0.001} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="core_conversion" label="核心转化(0-1)" initialValue={0}>
                <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="user_feedback_score" label="反馈评分(0-5)" initialValue={5}>
                <InputNumber min={0} max={5} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="is_anomaly" label="是否异常" initialValue={0}>
            <Select options={[{ value: 0, label: '正常' }, { value: 1, label: '异常' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
