import React, { useState, useEffect } from 'react'
import {
  Table, Button, Space, Tag, Modal, Form, Input, Select, message, Radio, Drawer, Descriptions, Row, Col, Alert, Spin, Divider, Statistic,
  Timeline, Card, Tooltip, Badge,
} from 'antd'
import { 
  RollbackOutlined, ReloadOutlined, CheckCircleOutlined, WarningOutlined, 
  ArrowLeftOutlined, ExclamationCircleOutlined, SafetyOutlined, 
  HistoryOutlined, FileTextOutlined, UserOutlined, ClockCircleOutlined,
  CloseCircleOutlined, PlayCircleOutlined, EyeOutlined,
} from '@ant-design/icons'
import { rollbacksApi, strategiesApi, versionsApi, releasesApi, metricsApi } from '../api.js'
import dayjs from 'dayjs'

const ROLLBACK_TYPES = [
  { value: 'previous', label: '回到上一版本', icon: <ArrowLeftOutlined /> },
  { value: 'specified', label: '回到指定版本' },
  { value: 'close_gray', label: '关闭灰度', icon: <ExclamationCircleOutlined /> },
]

const ROLLBACK_REASONS = [
  { value: '指标异常', label: '核心指标异常' },
  { value: '功能Bug', label: '发现功能Bug' },
  { value: '性能问题', label: '性能问题' },
  { value: '兼容性问题', label: '兼容性问题' },
  { value: '业务需求变更', label: '业务需求变更' },
  { value: '其他', label: '其他原因' },
]

export default function RollbackPage() {
  const [data, setData] = useState([])
  const [strategies, setStrategies] = useState([])
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [compareData, setCompareData] = useState(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [verificationResult, setVerificationResult] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [detailTimeline, setDetailTimeline] = useState([])
  const [auditTrail, setAuditTrail] = useState([])
  const [form] = Form.useForm()
  const rollbackType = Form.useWatch('rollback_type', form)
  const selectedStrategyId = Form.useWatch('strategy_id', form)
  const selectedReason = Form.useWatch('reason_category', form)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [res, strats, vers] = await Promise.all([rollbacksApi.list(), strategiesApi.list(), versionsApi.list()])
      setData(res)
      setStrategies(strats)
      setVersions(vers)
    } catch (e) {
      message.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (selectedStrategyId && (rollbackType === 'previous' || rollbackType === 'specified')) {
      fetchCompareData(selectedStrategyId)
    } else {
      setCompareData(null)
    }
  }, [selectedStrategyId, rollbackType])

  const fetchCompareData = async (strategyId) => {
    setCompareLoading(true)
    try {
      const res = await rollbacksApi.compare(strategyId)
      setCompareData(res)
    } catch (e) {
      message.error(e.message)
    } finally {
      setCompareLoading(false)
    }
  }

  const openCreate = () => {
    form.resetFields()
    setCompareData(null)
    setVerificationResult(null)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      const payload = {
        ...values,
        reason: values.reason_category 
          ? `${ROLLBACK_REASONS.find(r => r.value === values.reason_category)?.label}: ${values.reason_detail || ''}` 
          : values.reason,
      }
      delete payload.reason_category
      delete payload.reason_detail
      
      const res = await rollbacksApi.create(payload)
      
      setVerificationResult(res.verification)
      
      if (res.verification) {
        const auditRecords = await buildAuditTrail(res, payload)
        setAuditTrail(auditRecords)
      }
      
      message.success('回滚执行成功')
      fetchData()
    } catch (e) {
      message.error(e.message)
    }
  }

  const buildAuditTrail = async (rollbackRes, payload) => {
    const records = []
    
    records.push({
      type: 'trigger',
      color: 'red',
      dot: <RollbackOutlined />,
      children: (
        <div>
          <div><strong>回滚触发</strong></div>
          <div style={{ fontSize: 12, color: '#666' }}>
            <UserOutlined /> {payload.operator} | {dayjs().format('YYYY-MM-DD HH:mm:ss')}
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            回滚类型: {ROLLBACK_TYPES.find(t => t.value === payload.rollback_type)?.label}
          </div>
          {payload.reason && (
            <div style={{ fontSize: 12, color: '#faad14', marginTop: 2 }}>
              <ExclamationCircleOutlined /> 原因: {payload.reason}
            </div>
          )}
        </div>
      )
    })
    
    if (payload.rollback_type !== 'close_gray') {
      records.push({
        type: 'version_switch',
        color: 'orange',
        dot: <HistoryOutlined />,
        children: (
          <div>
            <div><strong>版本切换</strong></div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {rollbackRes.original_version} → {rollbackRes.target_version}
            </div>
          </div>
        )
      })
    }
    
    if (rollbackRes.verification) {
      const v = rollbackRes.verification
      records.push({
        type: 'verification',
        color: v.verification_passed ? 'green' : 'orange',
        dot: v.verification_passed ? <CheckCircleOutlined /> : <WarningOutlined />,
        children: (
          <div>
            <div><strong>自动验证</strong></div>
            <div style={{ fontSize: 12 }}>
              <Badge status={v.verification_passed ? 'success' : 'warning'} text={v.message} />
            </div>
            {v.latest_metrics && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                JS错误: {v.latest_metrics.js_errors} | 接口错误: {v.latest_metrics.api_errors} | 
                白屏率: {(v.latest_metrics.white_screen_rate * 100).toFixed(2)}%
              </div>
            )}
          </div>
        )
      })
    }
    
    records.push({
      type: 'complete',
      color: 'blue',
      dot: <FileTextOutlined />,
      children: (
        <div>
          <div><strong>回滚完成</strong></div>
          <div style={{ fontSize: 12, color: '#666' }}>
            策略状态: {rollbackRes.strategy_status}
          </div>
        </div>
      )
    })
    
    return records
  }

  const showDetail = async (record) => {
    setDetail(record)
    setDetailOpen(true)
    
    try {
      const timeline = buildDetailTimeline(record)
      setDetailTimeline(timeline)
    } catch (e) {
      console.error(e)
      setDetailTimeline([])
    }
  }

  const buildDetailTimeline = (record) => {
    const items = []
    
    items.push({
      color: 'red',
      dot: <RollbackOutlined />,
      children: (
        <div>
          <div><strong>回滚创建</strong></div>
          <div style={{ fontSize: 12, color: '#666' }}>
            <UserOutlined /> {record.operator} | {dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss')}
          </div>
        </div>
      )
    })
    
    if (record.target_build_number) {
      items.push({
        color: 'orange',
        dot: <HistoryOutlined />,
        children: (
          <div>
            <div><strong>目标版本</strong></div>
            <div style={{ fontSize: 12 }}>{record.target_build_number}</div>
          </div>
        )
      })
    }
    
    if (record.verification_result) {
      const parsed = parseVerification(record.verification_result)
      if (parsed) {
        items.push({
          color: parsed.verification_passed ? 'green' : 'orange',
          dot: parsed.verification_passed ? <CheckCircleOutlined /> : <WarningOutlined />,
          children: (
            <div>
              <div><strong>验证结果</strong></div>
              <div style={{ fontSize: 12 }}>
                <Badge status={parsed.verification_passed ? 'success' : 'warning'} text={parsed.message} />
              </div>
              {parsed.latest_metrics && (
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  JS错误: {parsed.latest_metrics.js_errors} | 
                  API错误: {parsed.latest_metrics.api_errors} | 
                  白屏率: {(parsed.latest_metrics.white_screen_rate * 100).toFixed(2)}%
                </div>
              )}
            </div>
          )
        })
      }
    }
    
    if (record.completed_at) {
      items.push({
        color: 'blue',
        dot: <CheckCircleOutlined />,
        children: (
          <div>
            <div><strong>回滚完成</strong></div>
            <div style={{ fontSize: 12, color: '#666' }}>
              <ClockCircleOutlined /> {dayjs(record.completed_at).format('YYYY-MM-DD HH:mm:ss')}
            </div>
          </div>
        )
      })
    }
    
    return items
  }

  const parseVerification = (verificationStr) => {
    try {
      return JSON.parse(verificationStr)
    } catch {
      return null
    }
  }

  const columns = [
    { 
      title: '回滚类型', 
      dataIndex: 'rollback_type', 
      key: 'rollback_type', 
      width: 130, 
      render: (v) => {
        const t = ROLLBACK_TYPES.find(x => x.value === v)
        return (
          <Tag color={v === 'close_gray' ? 'red' : v === 'specified' ? 'orange' : 'blue'}>
            {t?.icon} {t?.label || v}
          </Tag>
        )
      }
    },
    { 
      title: '策略名称', 
      dataIndex: 'strategy_name', 
      key: 'strategy_name', 
      width: 150,
      ellipsis: true,
    },
    { 
      title: '目标版本', 
      dataIndex: 'target_build_number', 
      key: 'target_build_number', 
      width: 120, 
      render: (v) => v ? <Tag color="green">{v}</Tag> : <Tag color="default">-</Tag>
    },
    { 
      title: '回滚原因', 
      dataIndex: 'reason', 
      key: 'reason', 
      width: 200, 
      ellipsis: true,
      render: (v) => <Tooltip title={v}>{v}</Tooltip>
    },
    {
      title: '验证结果',
      dataIndex: 'verification_result',
      key: 'verification_result',
      width: 110,
      render: (v) => {
        if (!v) return <Tag color="default">未验证</Tag>
        const parsed = parseVerification(v)
        if (parsed) {
          return parsed.verification_passed
            ? <Tag color="green" icon={<CheckCircleOutlined />}>验证通过</Tag>
            : <Tag color="orange" icon={<WarningOutlined />}>需观察</Tag>
        }
        return <Tag color="default">-</Tag>
      }
    },
    { title: '操作者', dataIndex: 'operator', key: 'operator', width: 100 },
    { 
      title: '时间', 
      dataIndex: 'created_at', 
      key: 'created_at', 
      width: 140, 
      render: (v) => dayjs(v).format('MM-DD HH:mm:ss') 
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 80, 
      render: (v) => <Tag color={v === 'completed' ? 'green' : 'blue'}>{v}</Tag> 
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, r) => (
        <Button 
          type="primary" 
          size="small" 
          onClick={() => showDetail(r)}
          style={{ fontWeight: 600 }}
        >
          <EyeOutlined /> 详情
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Alert
        type="info"
        showIcon
        icon={<SafetyOutlined />}
        message="回滚操作规范"
        description="执行回滚时必须留存回滚原因、目标版本、验证结果，形成完整的回滚审计链路。系统将自动验证指标恢复情况。"
        style={{ marginBottom: 16 }}
      />
      
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<RollbackOutlined />} onClick={openCreate}>执行回滚</Button>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
      </Space>
      
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic 
              title="本月回滚次数" 
              value={data.filter(d => dayjs(d.created_at).isSame(dayjs(), 'month')).length}
              valueStyle={{ color: '#faad14' }}
              prefix={<RollbackOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic 
              title="验证通过" 
              value={data.filter(d => {
                const v = parseVerification(d.verification_result)
                return v?.verification_passed
              }).length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic 
              title="需观察" 
              value={data.filter(d => {
                const v = parseVerification(d.verification_result)
                return v && !v.verification_passed
              }).length}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      <Table rowKey="id" loading={loading} dataSource={data} columns={columns} pagination={{ pageSize: 10 }} />
      
      <Modal
        title="执行回滚"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={800}
        confirmLoading={loading}
        destroyOnHidden
        okText="确认执行回滚"
        okButtonProps={{ danger: true }}
      >
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message="回滚操作将改变流量分发"
          description="请确认回滚原因和目标版本，系统将在执行后自动验证指标恢复情况。"
          style={{ marginBottom: 16 }}
        />
        
        <Form form={form} layout="vertical" className="rollback-form">
          <Form.Item name="strategy_id" label="选择灰度策略" rules={[{ required: true, message: '请选择灰度策略' }]}>
            <Select
              options={strategies.map(s => ({ value: s.id, label: `${s.name} (${s.build_number || '未关联版本'})` }))}
              showSearch
              optionFilterProp="label"
              placeholder="请选择要回滚的灰度策略"
            />
          </Form.Item>
          
          <Form.Item name="rollback_type" label="回滚方式" rules={[{ required: true, message: '请选择回滚方式' }]} initialValue="previous">
            <Radio.Group>
              {ROLLBACK_TYPES.map(t => (
                <Radio key={t.value} value={t.value}>
                  {t.icon} {t.label}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          
          {rollbackType === 'specified' && (
            <Form.Item name="target_version_id" label="指定目标版本" rules={[{ required: true, message: '请选择目标版本' }]}>
              <Select
                options={versions.map(v => ({ value: v.id, label: `${v.build_number} (${v.environment})` }))}
                showSearch
                optionFilterProp="label"
                placeholder="请选择要回滚到的目标版本"
              />
            </Form.Item>
          )}
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="reason_category" label="回滚原因分类" rules={[{ required: true, message: '请选择原因分类' }]}>
                <Select
                  options={ROLLBACK_REASONS.map(r => ({ value: r.value, label: r.label }))}
                  placeholder="请选择回滚原因分类"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="operator" label="操作者" rules={[{ required: true, message: '请输入操作者' }]}>
                <Input placeholder="工号或姓名" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item 
            name="reason_detail" 
            label="详细说明" 
            rules={[
              { required: true, message: '请详细说明回滚原因' },
              { min: 10, message: '详细说明至少10个字符' }
            ]}
          >
            <Input.TextArea 
              rows={3} 
              placeholder="请详细说明回滚原因，例如：核心指标异常持续超过5分钟，JS错误率超过阈值等"
              showCount
              maxLength={500}
            />
          </Form.Item>
          
          {compareData && (
            <>
              <Divider orientation="left">版本对比</Divider>
              <Spin spinning={compareLoading}>
                {compareData.hasPrevious ? (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Alert
                        message="当前版本（将被回滚）"
                        description={
                          <div>
                            <p><strong>构建号:</strong> {compareData.currentVersion.build_number}</p>
                            <p><strong>Git提交:</strong> {compareData.currentVersion.git_commit}</p>
                            <p><strong>环境:</strong> {compareData.currentVersion.environment}</p>
                            {compareData.currentVersion.release_notes && (
                              <p><strong>说明:</strong> {compareData.currentVersion.release_notes}</p>
                            )}
                          </div>
                        }
                        type="error"
                        showIcon
                      />
                    </Col>
                    <Col span={12}>
                      <Alert
                        message={rollbackType === 'specified' ? '目标版本' : '目标版本（上一版本）'}
                        description={
                          <div>
                            <p><strong>构建号:</strong> {compareData.previousVersion.build_number}</p>
                            <p><strong>Git提交:</strong> {compareData.previousVersion.git_commit}</p>
                            <p><strong>环境:</strong> {compareData.previousVersion.environment}</p>
                            {compareData.previousVersion.release_notes && (
                              <p><strong>说明:</strong> {compareData.previousVersion.release_notes}</p>
                            )}
                          </div>
                        }
                        type="success"
                        showIcon
                      />
                    </Col>
                  </Row>
                ) : (
                  <Alert
                    message="没有找到上一版本"
                    description="当前版本是最早的版本，无法回到上一版本，请选择其他回滚方式"
                    type="warning"
                    showIcon
                  />
                )}
              </Spin>
            </>
          )}
        </Form>
        
        {verificationResult && (
          <>
            <Divider orientation="left">回滚执行结果</Divider>
            <Alert
              type={verificationResult.verification_passed ? 'success' : 'warning'}
              showIcon
              icon={verificationResult.verification_passed ? <CheckCircleOutlined /> : <WarningOutlined />}
              message={verificationResult.verification_passed ? '回滚验证通过' : '回滚需进一步观察'}
              description={
                <div>
                  <p>{verificationResult.message}</p>
                  <Row gutter={16} style={{ marginTop: 12 }}>
                    <Col span={8}>
                      <Statistic title="策略状态" value={verificationResult.strategy_status} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="原版本" value={verificationResult.original_version || '-'} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="目标版本" value={verificationResult.target_version || '-'} />
                    </Col>
                  </Row>
                  {verificationResult.latest_metrics && (
                    <div style={{ marginTop: 12 }}>
                      <p><strong>最新监控指标:</strong></p>
                      <Row gutter={16}>
                        <Col span={6}>
                          <Statistic 
                            title="JS错误" 
                            value={verificationResult.latest_metrics.js_errors} 
                            valueStyle={{ color: verificationResult.latest_metrics.js_errors > 10 ? '#ff4d4f' : '#52c41a' }}
                          />
                        </Col>
                        <Col span={6}>
                          <Statistic 
                            title="接口错误" 
                            value={verificationResult.latest_metrics.api_errors} 
                            valueStyle={{ color: verificationResult.latest_metrics.api_errors > 5 ? '#ff4d4f' : '#52c41a' }}
                          />
                        </Col>
                        <Col span={6}>
                          <Statistic 
                            title="白屏率" 
                            value={(verificationResult.latest_metrics.white_screen_rate * 100).toFixed(2)} 
                            suffix="%" 
                            precision={2}
                            valueStyle={{ color: verificationResult.latest_metrics.white_screen_rate > 0.01 ? '#ff4d4f' : '#52c41a' }}
                          />
                        </Col>
                        <Col span={6}>
                          <Statistic 
                            title="核心转化" 
                            value={(verificationResult.latest_metrics.core_conversion * 100).toFixed(2)} 
                            suffix="%" 
                            precision={2}
                          />
                        </Col>
                      </Row>
                    </div>
                  )}
                  <p style={{ marginTop: 12, color: '#999' }}>
                    验证时间: {dayjs(verificationResult.verification_time).format('YYYY-MM-DD HH:mm:ss')}
                  </p>
                </div>
              }
            />
            {auditTrail.length > 0 && (
              <>
                <Divider orientation="left">审计链路</Divider>
                <Timeline items={auditTrail} />
              </>
            )}
          </>
        )}
      </Modal>
      
      <Drawer title="回滚详情" open={detailOpen} onClose={() => setDetailOpen(false)} width={700}>
        {detail && (
          <>
            <Alert
              type="info"
              showIcon
              icon={<SafetyOutlined />}
              message="回滚审计信息"
              description="以下为完整的回滚执行记录和验证结果，用于发布复盘和审计。"
              style={{ marginBottom: 16 }}
            />
            
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="回滚类型">
                <Tag color={detail.rollback_type === 'close_gray' ? 'red' : 'blue'}>
                  {ROLLBACK_TYPES.find(t => t.value === detail.rollback_type)?.icon}
                  {ROLLBACK_TYPES.find(t => t.value === detail.rollback_type)?.label || detail.rollback_type}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="策略名称">{detail.strategy_name}</Descriptions.Item>
              <Descriptions.Item label="目标版本">
                {detail.target_build_number ? <Tag color="green">{detail.target_build_number}</Tag> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="回滚原因">
                <Alert type="warning" message={detail.reason} showIcon={false} style={{ margin: 0 }} />
              </Descriptions.Item>
              <Descriptions.Item label="操作者">{detail.operator}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={detail.status === 'completed' ? 'green' : 'blue'}>{detail.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {detail.completed_at ? dayjs(detail.completed_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
            </Descriptions>
            
            {detail.verification_result && (() => {
              const parsed = parseVerification(detail.verification_result)
              if (parsed) {
                return (
                  <>
                    <Divider orientation="left">验证结果</Divider>
                    <Alert
                      type={parsed.verification_passed ? 'success' : 'warning'}
                      showIcon
                      icon={parsed.verification_passed ? <CheckCircleOutlined /> : <WarningOutlined />}
                      message={parsed.verification_passed ? '验证通过' : '需观察'}
                      description={
                        <div>
                          <p>{parsed.message}</p>
                          <p>策略状态: {parsed.strategy_status}</p>
                          <p>原版本: {parsed.original_version || '-'} → 目标版本: {parsed.target_version || '-'}</p>
                          {parsed.latest_metrics && (
                            <Row gutter={16} style={{ marginTop: 8 }}>
                              <Col span={6}>
                                <Statistic 
                                  title="JS错误" 
                                  value={parsed.latest_metrics.js_errors} 
                                  valueStyle={{ color: parsed.latest_metrics.js_errors > 10 ? '#ff4d4f' : '#52c41a' }}
                                />
                              </Col>
                              <Col span={6}>
                                <Statistic 
                                  title="API错误" 
                                  value={parsed.latest_metrics.api_errors} 
                                  valueStyle={{ color: parsed.latest_metrics.api_errors > 5 ? '#ff4d4f' : '#52c41a' }}
                                />
                              </Col>
                              <Col span={6}>
                                <Statistic 
                                  title="白屏率" 
                                  value={(parsed.latest_metrics.white_screen_rate * 100).toFixed(2)} 
                                  suffix="%" 
                                  precision={2}
                                  valueStyle={{ color: parsed.latest_metrics.white_screen_rate > 0.01 ? '#ff4d4f' : '#52c41a' }}
                                />
                              </Col>
                              <Col span={6}>
                                <Statistic 
                                  title="核心转化" 
                                  value={(parsed.latest_metrics.core_conversion * 100).toFixed(2)} 
                                  suffix="%" 
                                  precision={2}
                                />
                              </Col>
                            </Row>
                          )}
                          <p style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                            验证时间: {dayjs(parsed.verification_time).format('YYYY-MM-DD HH:mm:ss')}
                          </p>
                        </div>
                      }
                      style={{ marginBottom: 16 }}
                    />
                  </>
                )
              }
              return null
            })()}
            
            {detailTimeline.length > 0 && (
              <>
                <Divider orientation="left">执行时间线</Divider>
                <Timeline items={detailTimeline} />
              </>
            )}
            
            <Divider orientation="left">审计信息</Divider>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="记录ID">#{detail.id}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>
    </div>
  )
}
