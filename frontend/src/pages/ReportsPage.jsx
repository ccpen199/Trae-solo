import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Table, Select, Space, Tabs, Tag, Statistic, message, Divider, Progress, Empty } from 'antd'
import api from '../api.js'

const channelMap = {
  in_app: '站内信',
  browser: '浏览器通知',
  popup: '运营弹窗'
}

export default function ReportsPage() {
  const [groupBy, setGroupBy] = useState('task')
  const [channelFilter, setChannelFilter] = useState('')
  const [overview, setOverview] = useState([])
  const [pageAnalysis, setPageAnalysis] = useState([])
  const [tasks, setTasks] = useState([])
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [versions, setVersions] = useState([])

  const fetchOverview = async () => {
    try {
      const params = {}
      if (channelFilter) params.channel = channelFilter
      if (selectedTaskId) params.taskId = selectedTaskId
      if (groupBy === 'channel') params.groupBy = 'channel'
      const res = await api.get('/reports/overview', { params })
      setOverview(res.list)
    } catch (e) {
      message.error(e.message)
    }
  }

  const fetchPageAnalysis = async () => {
    try {
      const res = await api.get('/reports/page-analysis')
      setPageAnalysis(res.list)
    } catch (e) {}
  }

  useEffect(() => {
    api.get('/tasks', { params: { pageSize: 999 } }).then(res => setTasks(res.list)).catch(() => {})
  }, [])

  useEffect(() => { fetchOverview() }, [groupBy, channelFilter, selectedTaskId])
  useEffect(() => { fetchPageAnalysis() }, [])

  const handleTaskChange = (val) => {
    setSelectedTaskId(val)
    if (val) {
      api.get(`/task-versions/${val}`).then(res => setVersions(res.list)).catch(() => {})
    } else {
      setVersions([])
    }
  }

  const overviewColumns = [
    {
      title: groupBy === 'channel' ? '渠道' : '任务',
      dataIndex: groupBy === 'channel' ? 'channel' : 'task_title',
      width: 180,
      render: (v, record) => groupBy === 'channel'
        ? <Tag color="blue">{channelMap[v] || v}</Tag>
        : <span>{v}</span>
    },
    { title: '总发送', dataIndex: 'total', width: 80, align: 'right' },
    { title: '送达', dataIndex: 'delivered', width: 80, align: 'right' },
    { title: '展示', dataIndex: 'displayed', width: 80, align: 'right' },
    { title: '点击', dataIndex: 'clicked', width: 80, align: 'right' },
    { title: '关闭', dataIndex: 'closed', width: 80, align: 'right' },
    { title: '失败', dataIndex: 'failed', width: 80, align: 'right' },
    {
      title: '点击率(CTR)',
      width: 120,
      render: (_, r) => {
        const ctr = r.displayed ? (r.clicked / r.displayed * 100).toFixed(1) : 0
        return <span style={{ color: ctr > 20 ? '#52c41a' : ctr > 10 ? '#1890ff' : '#999' }}>{ctr}%</span>
      }
    },
    {
      title: '转化率(CVR)',
      width: 120,
      render: (_, r) => {
        const cvr = r.delivered ? (r.clicked / r.delivered * 100).toFixed(1) : 0
        return <span style={{ color: cvr > 15 ? '#52c41a' : cvr > 5 ? '#1890ff' : '#999' }}>{cvr}%</span>
      }
    }
  ]

  const pageColumns = [
    { title: '跳转页面', dataIndex: 'jump_url', width: 200 },
    { title: '关联任务', dataIndex: 'title', width: 180, ellipsis: true },
    { title: '点击次数', dataIndex: 'clicks', width: 100, align: 'right' },
    {
      title: '占比',
      width: 200,
      render: (_, r, idx) => {
        const max = Math.max(...pageAnalysis.map(p => p.clicks))
        const pct = max > 0 ? (r.clicks / max * 100).toFixed(0) : 0
        return <Progress percent={parseInt(pct)} size="small" />
      }
    }
  ]

  const totalClicks = overview.reduce((s, r) => s + (r.clicked || 0), 0)
  const totalSent = overview.reduce((s, r) => s + (r.total || 0), 0)
  const totalDelivered = overview.reduce((s, r) => s + (r.delivered || 0), 0)
  const overallCTR = totalDelivered ? ((totalClicks / totalDelivered) * 100).toFixed(2) + '%' : '0%'

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="总发送量" value={totalSent} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="总送达" value={totalDelivered} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="总点击" value={totalClicks} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="整体CTR" value={overallCTR} /></Card></Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Select value={groupBy} onChange={setGroupBy} style={{ width: 140 }}
            options={[{ value: 'task', label: '按任务' }, { value: 'channel', label: '按渠道' }]} />
          <Select allowClear placeholder="筛选渠道" value={channelFilter} onChange={setChannelFilter} style={{ width: 140 }}
            options={Object.entries(channelMap).map(([k, v]) => ({ value: k, label: v }))} />
          <Select allowClear placeholder="筛选任务" value={selectedTaskId} onChange={handleTaskChange} style={{ width: 240 }}
            options={tasks.map(t => ({ value: String(t.id), label: t.title }))} />
        </Space>
      </Card>

      <Tabs defaultActiveKey="overview" items={[
        {
          key: 'overview',
          label: '转化效果分析',
          children: (
            <Card>
              {overview.length === 0 ? (
                <Empty description="暂无转化数据，任务发送后将自动生成效果分析报表" />
              ) : (
                <Table rowKey="id" columns={overviewColumns} dataSource={overview} size="small"
                  locale={{ emptyText: '暂无转化数据，任务发送后将自动生成效果分析报表' }}
                  pagination={false} />
              )}
            </Card>
          )
        },
        {
          key: 'page',
          label: '页面转化分析',
          children: (
            <Card>
              {pageAnalysis.length === 0 ? (
                <Empty description="暂无页面转化数据，配置跳转地址并发送后将生成页面分析" />
              ) : (
                <Table rowKey="jump_url" columns={pageColumns} dataSource={pageAnalysis} size="small"
                  locale={{ emptyText: '暂无页面转化数据，配置跳转地址并发送后将生成页面分析' }}
                  pagination={false} />
              )}
            </Card>
          )
        },
        {
          key: 'versions',
          label: '内容版本与运营备注',
          children: (
            <Card>
              {selectedTaskId ? (
                versions.length === 0 ? (
                  <Empty description="该任务暂无版本记录，编辑或添加运营备注后将自动记录版本" />
                ) : (
                  <div>
                    {versions.map((v, idx) => (
                      <div key={v.id} style={{
                        padding: 12, marginBottom: 8, border: '1px solid #f0f0f0',
                        borderRadius: 6, borderLeft: `4px solid ${idx === 0 ? '#1677ff' : '#d9d9d9'}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontWeight: 600 }}>
                            版本 v{v.version} {idx === 0 && <Tag color="blue">当前</Tag>}
                          </span>
                          <span style={{ color: '#999', fontSize: 12 }}>{v.created_at}</span>
                        </div>
                        <div style={{ marginBottom: 4 }}><strong>标题:</strong> {v.title}</div>
                        <div style={{ marginBottom: 4 }}><strong>正文:</strong> {v.content}</div>
                        {v.jump_url && <div style={{ marginBottom: 4 }}><strong>跳转:</strong> {v.jump_url}</div>}
                        {v.operator_note && (
                          <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                            <strong>运营备注:</strong> {v.operator_note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <Empty description="请在上方筛选器中选择一个任务，查看其内容版本和运营备注" />
              )}
            </Card>
          )
        }
      ]} />
    </div>
  )
}