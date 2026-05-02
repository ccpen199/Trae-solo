import React, { useState } from 'react'
import { Card, Table, Button, Tag, Modal, Descriptions, message, Avatar, Space, Statistic, Row, Col, Input } from 'antd'
import {
  EyeOutlined,
  DownloadOutlined,
  SearchOutlined,
  TrophyOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Search } = Input

function CertificateManagement() {
  const [selectedCert, setSelectedCert] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [searchText, setSearchText] = useState('')

  const mockCertificates = [
    {
      key: '1',
      _id: '1',
      certNo: 'CERT202404280001',
      user: { _id: 'u1', username: '王学员', avatar: '', email: 'student@learning.com' },
      course: { _id: 'c1', title: 'JavaScript 从入门到精通' },
      type: 'completion',
      status: 'valid',
      issueDate: '2024-04-28T10:30:00Z',
      expiryDate: '2027-04-28T10:30:00Z',
      score: 92,
      completionTime: 120,
      pdfUrl: '/certificates/1.pdf'
    },
    {
      key: '2',
      _id: '2',
      certNo: 'CERT202404270002',
      user: { _id: 'u2', username: '李学员', avatar: '', email: 'li@example.com' },
      course: { _id: 'c2', title: 'React 实战开发' },
      type: 'completion',
      status: 'valid',
      issueDate: '2024-04-27T14:20:00Z',
      expiryDate: '2027-04-27T14:20:00Z',
      score: 88,
      completionTime: 90,
      pdfUrl: '/certificates/2.pdf'
    },
    {
      key: '3',
      _id: '3',
      certNo: 'CERT202404250003',
      user: { _id: 'u3', username: '张学员', avatar: '', email: 'zhang@example.com' },
      course: { _id: 'c3', title: 'Python 数据分析实战' },
      type: 'completion',
      status: 'valid',
      issueDate: '2024-04-25T08:15:00Z',
      expiryDate: '2027-04-25T08:15:00Z',
      score: 95,
      completionTime: 150,
      pdfUrl: '/certificates/3.pdf'
    },
    {
      key: '4',
      _id: '4',
      certNo: 'CERT202304200004',
      user: { _id: 'u4', username: '赵学员', avatar: '', email: 'zhao@example.com' },
      course: { _id: 'c1', title: 'JavaScript 从入门到精通' },
      type: 'completion',
      status: 'expired',
      issueDate: '2023-04-20T16:00:00Z',
      expiryDate: '2024-04-20T16:00:00Z',
      score: 78,
      completionTime: 200,
      pdfUrl: '/certificates/4.pdf'
    }
  ]

  const filteredCerts = mockCertificates.filter(cert => {
    const searchLower = searchText.toLowerCase()
    return (
      cert.certNo.toLowerCase().includes(searchLower) ||
      cert.user?.username?.toLowerCase().includes(searchLower) ||
      cert.course?.title?.toLowerCase().includes(searchLower)
    )
  })

  const columns = [
    {
      title: '证书编号',
      dataIndex: 'certNo',
      key: 'certNo',
      render: (text) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{text}</span>
      )
    },
    {
      title: '学员',
      dataIndex: ['user', 'username'],
      key: 'user',
      render: (text, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size={24}>{text?.charAt(0)}</Avatar>
            <span>{text}</span>
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.user?.email}</div>
        </div>
      )
    },
    {
      title: '课程',
      dataIndex: ['course', 'title'],
      key: 'course',
      render: (text) => <span>{text}</span>
    },
    {
      title: '综合得分',
      dataIndex: 'score',
      key: 'score',
      render: (score) => (
        <span style={{ 
          fontWeight: 'bold',
          color: score >= 90 ? '#52c41a' : score >= 60 ? '#1890ff' : '#ff4d4f'
        }}>
          {score}分
        </span>
      )
    },
    {
      title: '学习时长',
      dataIndex: 'completionTime',
      key: 'completionTime',
      render: (time) => `${Math.floor(time / 60)} 小时 ${time % 60} 分钟`
    },
    {
      title: '颁发日期',
      dataIndex: 'issueDate',
      key: 'issueDate',
      render: (time) => dayjs(time).format('YYYY-MM-DD')
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          valid: { label: '有效', color: 'success' },
          expired: { label: '已过期', color: 'default' },
          revoked: { label: '已撤销', color: 'warning' }
        }
        const config = statusMap[status] || { label: status, color: 'default' }
        return <Tag color={config.color}>{config.label}</Tag>
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewCertificate(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => downloadCertificate(record)}
          >
            下载
          </Button>
        </Space>
      )
    }
  ]

  const viewCertificate = (cert) => {
    setSelectedCert(cert)
    setModalVisible(true)
  }

  const downloadCertificate = (cert) => {
    message.success(`证书 ${cert.certNo} 下载中...`)
  }

  const totalStats = {
    totalCerts: mockCertificates.length,
    validCerts: mockCertificates.filter(c => c.status === 'valid').length,
    avgScore: Math.round(
      mockCertificates.reduce((sum, c) => sum + c.score, 0) / mockCertificates.length
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>证书管理</h2>
          <p style={{ color: '#666', marginTop: 8, marginBottom: 0 }}>
            管理学员电子证书，支持查看、下载、验证
          </p>
        </div>
        <Search
          placeholder="搜索证书编号、学员、课程"
          allowClear
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8}>
          <Card className="stat-card purple">
            <Statistic
              title="总颁发证书"
              value={totalStats.totalCerts}
              prefix={<TrophyOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card className="stat-card green">
            <Statistic
              title="有效证书"
              value={totalStats.validCerts}
              suffix="本"
              prefix={<CalendarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card className="stat-card blue">
            <Statistic
              title="平均得分"
              value={totalStats.avgScore}
              suffix="分"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredCerts}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="证书详情"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={600}
        footer={[
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => {
            if (selectedCert) {
              downloadCertificate(selectedCert)
            }
          }}>
            下载证书
          </Button>
        ]}
      >
        {selectedCert && (
          <div>
            <Card
              style={{
                marginBottom: 24,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                textAlign: 'center',
                borderRadius: 8
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <TrophyOutlined style={{ fontSize: 48 }} />
              </div>
              <h3 style={{ color: '#fff', margin: '0 0 16px 0' }}>
                课程结业证书
              </h3>
              <div style={{ marginBottom: 8 }}>
                恭喜 <strong style={{ fontSize: 18 }}>{selectedCert.user?.username}</strong>
              </div>
              <div style={{ marginBottom: 16 }}>
                完成课程 <strong>{selectedCert.course?.title}</strong>
              </div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                证书编号：{selectedCert.certNo}
              </div>
            </Card>

            <Descriptions column={2}>
              <Descriptions.Item label="证书编号">
                <span style={{ fontFamily: 'monospace' }}>{selectedCert.certNo}</span>
              </Descriptions.Item>
              <Descriptions.Item label="证书类型">
                <Tag color="blue">结业证书</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="学员姓名">{selectedCert.user?.username}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{selectedCert.user?.email}</Descriptions.Item>
              <Descriptions.Item label="课程名称">{selectedCert.course?.title}</Descriptions.Item>
              <Descriptions.Item label="综合得分">
                <span style={{ 
                  fontWeight: 'bold',
                  color: selectedCert.score >= 90 ? '#52c41a' : selectedCert.score >= 60 ? '#1890ff' : '#ff4d4f'
                }}>
                  {selectedCert.score} 分
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="学习时长">
                {Math.floor(selectedCert.completionTime / 60)} 小时 {selectedCert.completionTime % 60} 分钟
              </Descriptions.Item>
              <Descriptions.Item label="证书状态">
                <Tag color={
                  selectedCert.status === 'valid' ? 'success' :
                  selectedCert.status === 'expired' ? 'default' : 'warning'
                }>
                  {selectedCert.status === 'valid' ? '有效' :
                   selectedCert.status === 'expired' ? '已过期' : '已撤销'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="颁发日期" span={2}>
                {dayjs(selectedCert.issueDate).format('YYYY年MM月DD日')}
              </Descriptions.Item>
              <Descriptions.Item label="有效期至" span={2}>
                {dayjs(selectedCert.expiryDate).format('YYYY年MM月DD日')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default CertificateManagement
