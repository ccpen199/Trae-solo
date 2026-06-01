import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Progress, Tag, Select } from 'antd'
import { TeamOutlined, FileTextOutlined, ExclamationCircleOutlined, InboxOutlined, TrophyOutlined } from '@ant-design/icons'
import api from '../services/api'

const { Option } = Select

function Dashboard() {
  const [overview, setOverview] = useState({})
  const [rankings, setRankings] = useState([])
  const [dimensionStats, setDimensionStats] = useState([])
  const [classStats, setClassStats] = useState([])
  const [semester, setSemester] = useState('2024-2025-1')

  useEffect(() => {
    loadData()
  }, [semester])

  const loadData = async () => {
    try {
      const [overviewRes, rankingsRes, dimensionRes, classRes] = await Promise.all([
        api.get('/stats/overview', { params: { semester } }),
        api.get('/stats/class-ranking', { params: { semester } }),
        api.get('/stats/dimension-stats', { params: { semester } }),
        api.get('/stats/class-stats', { params: { semester } }),
      ])
      
      setOverview(overviewRes.data)
      setRankings(rankingsRes.data)
      setDimensionStats(dimensionRes.data)
      setClassStats(classRes.data)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const rankingColumns = [
    {
      title: '排名',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_, __, index) => {
        if (index === 0) return <Tag color="gold">🥇 1</Tag>
        if (index === 1) return <Tag color="silver">🥈 2</Tag>
        if (index === 2) return <Tag color="bronze">🥉 3</Tag>
        return index + 1
      }
    },
    { title: '学号', dataIndex: 'student_no', key: 'student_no' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '班级', dataIndex: 'class_name', key: 'class_name' },
    { 
      title: '总分', 
      dataIndex: 'overall_score', 
      key: 'overall_score',
      render: (score) => <strong style={{ color: score >= 0 ? '#52c41a' : '#ff4d4f' }}>{score}</strong>
    },
    { title: '记录数', dataIndex: 'record_count', key: 'record_count' },
  ]

  const dimensionColumns = [
    { title: '维度名称', dataIndex: 'name', key: 'name' },
    { title: '记录总数', dataIndex: 'record_count', key: 'record_count' },
    { title: '加分次数', dataIndex: 'bonus_count', key: 'bonus_count', render: (v) => <Tag color="green">{v}</Tag> },
    { title: '扣分次数', dataIndex: 'penalty_count', key: 'penalty_count', render: (v) => <Tag color="red">{v}</Tag> },
    {
      title: '平均分值',
      key: 'avg',
      render: (_, record) => {
        const avg = (record.avg_bonus_score || 0) - (record.avg_penalty_score || 0)
        return <span style={{ color: avg >= 0 ? '#52c41a' : '#ff4d4f' }}>{avg.toFixed(2)}</span>
      }
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>数据概览</h2>
        <Select value={semester} onChange={setSemester} style={{ width: 150 }}>
          <Option value="2024-2025-1">2024-2025学年上学期</Option>
          <Option value="2024-2025-2">2024-2025学年下学期</Option>
        </Select>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="学生总数"
              value={overview.student_count || 0}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="评价记录"
              value={overview.record_count || 0}
              prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理申诉"
              value={overview.pending_appeal_count || 0}
              prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已归档档案"
              value={overview.archive_count || 0}
              prefix={<InboxOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={14}>
          <Card title="学生综合素质排名" extra={<TrophyOutlined style={{ fontSize: 20 }} />}>
            <Table
              dataSource={rankings}
              columns={rankingColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="各维度评价统计">
            <Table
              dataSource={dimensionStats}
              columns={dimensionColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="班级评价概况">
            <Row gutter={16}>
              {classStats.map((cls, index) => (
                <Col key={index} span={6}>
                  <Card size="small" title={`初${cls.grade}年级 ${cls.class_name}`}>
                    <p>学生数: {cls.student_count}</p>
                    <p>记录数: {cls.record_count}</p>
                    <p>平均分: {cls.avg_score?.toFixed(2) || 0}</p>
                    <Progress 
                      percent={Math.min(Math.max((cls.avg_score || 0) * 10, 0), 100)} 
                      size="small"
                      strokeColor={cls.avg_score >= 0 ? '#52c41a' : '#ff4d4f'}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
