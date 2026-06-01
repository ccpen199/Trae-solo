import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Progress } from 'antd'
import { UserOutlined, CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons'
import { applicationAPI } from '../services/api'

const Dashboard = () => {
  const [stats, setStats] = useState({})
  const [applications, setApplications] = useState([])

  const getUser = () => {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : { id: null, name: '', role: '' }
    } catch (e) {
      console.error('解析用户信息失败:', e)
      return { id: null, name: '', role: '' }
    }
  }
  
  const user = getUser()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, appsRes] = await Promise.all([
        applicationAPI.getStats(),
        applicationAPI.getAll()
      ])
      setStats(statsRes.data)
      setApplications(appsRes.data.slice(0, 10))
    } catch (error) {
      console.error('加载数据失败', error)
    }
  }

  const columns = [
    {
      title: '学校',
      dataIndex: 'school_name',
      key: 'school_name',
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
    },
    {
      title: '申请状态',
      dataIndex: 'admission_result',
      key: 'admission_result',
      render: (result) => {
        const colorMap = {
          pending: 'orange',
          admitted: 'green',
          rejected: 'red',
          waitlisted: 'blue'
        }
        const labelMap = {
          pending: '待处理',
          admitted: '已录取',
          rejected: '已拒绝',
          waitlisted: '候补'
        }
        return <Tag color={colorMap[result]}>{labelMap[result]}</Tag>
      }
    }
  ]

  if (user.role !== 'student') {
    columns.unshift({
      title: '学生',
      dataIndex: 'student_name',
      key: 'student_name',
    })
  }

  const admissionRate = stats.total ? Math.round((stats.admitted || 0) / stats.total * 100) : 0

  return (
    <div>
      <div className="page-header">
        <h2>申请概览</h2>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总申请数"
              value={stats.total || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已录取"
              value={stats.admitted || 0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理"
              value={stats.pending || 0}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="录取率"
              value={admissionRate}
              suffix="%"
              prefix={<UserOutlined />}
            />
            <Progress percent={admissionRate} size="small" />
          </Card>
        </Col>
      </Row>

      <Card title="最近申请">
        <Table
          columns={columns}
          dataSource={applications}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  )
}

export default Dashboard