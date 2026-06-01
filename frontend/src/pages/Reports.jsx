import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Button, Space, DatePicker, message } from 'antd'
import { DownloadOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons'
import { reportAPI, exportAPI, feedbackAPI } from '../utils/api'
import ReactECharts from 'echarts-for-react'

const { RangePicker } = DatePicker

function Reports({ user }) {
  const [summary, setSummary] = useState(null)
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [summaryRes, feedbackRes] = await Promise.all([
        reportAPI.tasksSummary(),
        feedbackAPI.list({ limit: 20 })
      ])
      setSummary(summaryRes.data)
      setFeedbacks(feedbackRes.data)
    } catch (error) {
      message.error('加载报表数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await exportAPI.exportTasks()
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `tasks_export_${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  const statusChartOption = {
    title: { text: '任务状态分布', left: 'center' },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '50%',
      data: Object.entries(summary?.by_status || {}).map(([key, value]) => ({
        name: key,
        value: value
      }))
    }]
  }

  const typeChartOption = {
    title: { text: '任务类型分布', left: 'center' },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '50%',
      data: Object.entries(summary?.by_type || {}).map(([key, value]) => ({
        name: key,
        value: value
      }))
    }]
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>报表中心</h2>
        <Space>
          <RangePicker onChange={setDateRange} />
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
            导出Excel
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="任务总数"
              value={summary?.total || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={summary?.by_status?.completed || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="处理中"
              value={(summary?.by_status?.processing || 0) + (summary?.by_status?.reviewing || 0)}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均处理时长"
              value={summary?.avg_processing_seconds ? Math.round(summary.avg_processing_seconds / 60) : 0}
              suffix="分钟"
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card loading={loading}>
            <ReactECharts option={statusChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card loading={loading}>
            <ReactECharts option={typeChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="最近反馈" loading={loading}>
        <p>共 {feedbacks.length} 条反馈记录</p>
        {feedbacks.map((fb, idx) => (
          <div key={idx} style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}>
            <p>任务 #{fb.task_id}: {fb.comment || '无评论'}</p>
            <p style={{ fontSize: 12, color: '#999' }}>
              评分: {fb.rating || '-'} | 正确: {fb.is_correct ? '是' : '否'} | 已回收: {fb.collected ? '是' : '否'}
            </p>
          </div>
        ))}
      </Card>
    </div>
  )
}

export default Reports
