import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, List, Tag, Avatar, message, Spin, Empty, Modal } from 'antd'
import {
  TrophyOutlined,
  DownloadOutlined,
  EyeOutlined,
  UserOutlined,
  BookOutlined
} from '@ant-design/icons'
import api from '../../services/api'
import dayjs from 'dayjs'

function Certificates() {
  const [loading, setLoading] = useState(true)
  const [certificates, setCertificates] = useState([])
  const [selectedCert, setSelectedCert] = useState(null)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    fetchCertificates()
  }, [])

  const fetchCertificates = async () => {
    setLoading(true)
    try {
      const res = await api.get('/certificates')
      setCertificates(res.data.certificates || [])
    } catch (error) {
      console.error('获取证书列表失败:', error)
      message.error('获取证书列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = async (item) => {
    try {
      const res = await api.get(`/certificates/${item._id}`)
      setSelectedCert(res.data.certificate)
      setShowDetail(true)
    } catch (error) {
      console.error('获取证书详情失败:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>我的证书</h2>
        <p style={{ color: '#666', marginTop: 8 }}>
          完成课程学习并通过考核后，您将获得课程结业证书
        </p>
      </div>

      {certificates.length > 0 ? (
        <Row gutter={[24, 24]}>
          {certificates.map(cert => (
            <Col xs={24} sm={12} lg={8} key={cert._id}>
              <Card
                hoverable
                className="card-hover"
                onClick={() => handleViewDetail(cert)}
                cover={
                  <div
                    style={{
                      height: 200,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      padding: 24
                    }}
                  >
                    <TrophyOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.9 }} />
                    <h3 style={{ color: '#fff', margin: 0, marginBottom: 8 }}>结业证书</h3>
                    <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: 12 }}>
                      {cert.courseTitle}
                    </p>
                  </div>
                }
                actions={[
                  <Button type="link" icon={<EyeOutlined />} onClick={(e) => {
                    e.stopPropagation()
                    handleViewDetail(cert)
                  }}>
                    查看
                  </Button>,
                  <Button type="link" icon={<DownloadOutlined />} onClick={(e) => {
                    e.stopPropagation()
                    message.info('证书下载功能开发中...')
                  }}>
                    下载
                  </Button>
                ]}
              >
                <Card.Meta
                  title={cert.courseTitle}
                  description={
                    <div>
                      <div style={{ marginBottom: 4 }}>
                        颁发日期：{dayjs(cert.issuedDate).format('YYYY年MM月DD日')}
                      </div>
                      {cert.finalScore !== null && cert.finalScore !== undefined && (
                        <div>
                          最终成绩：<span style={{ 
                            color: cert.finalScore >= 60 ? '#52c41a' : '#ff4d4f',
                            fontWeight: 'bold'
                          }}>
                            {cert.finalScore}分
                          </span>
                        </div>
                      )}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <TrophyOutlined style={{ fontSize: 64, color: '#999', marginBottom: 16 }} />
          <h3 style={{ color: '#666', marginBottom: 8 }}>暂无证书</h3>
          <p style={{ color: '#999', marginBottom: 24 }}>
            完成课程学习并通过考核后，即可获得结业证书
          </p>
        </div>
      )}

      <Modal
        title="证书详情"
        open={showDetail}
        onCancel={() => setShowDetail(false)}
        width={700}
        footer={[
          <Button key="download" icon={<DownloadOutlined />} onClick={() => {
            message.info('证书下载功能开发中...')
          }}>
            下载证书
          </Button>,
          <Button key="close" onClick={() => setShowDetail(false)}>
            关闭
          </Button>
        ]}
      >
        {selectedCert && (
          <div>
            <div className="certificate-card">
              <div className="certificate-title">结业证书</div>
              <div className="certificate-no">证书编号：{selectedCert.certificateNo}</div>
              
              <div className="certificate-content">
                <p style={{ marginBottom: 24 }}>
                  兹证明 <strong style={{ fontSize: 18 }}>{selectedCert.studentName}</strong> 已完成
                </p>
                <h2 style={{ marginBottom: 24, fontWeight: 'bold' }}>{selectedCert.courseTitle}</h2>
                <p style={{ marginBottom: 16 }}>
                  全部课程学习，成绩合格，特发此证。
                </p>
              </div>

              <div style={{ marginTop: 24, fontSize: 14, opacity: 0.9 }}>
                <div style={{ marginBottom: 8 }}>
                  颁发日期：{dayjs(selectedCert.issuedDate).format('YYYY年MM月DD日')}
                </div>
                {selectedCert.finalScore !== null && selectedCert.finalScore !== undefined && (
                  <div style={{ marginBottom: 8 }}>
                    最终成绩：{selectedCert.finalScore}分
                  </div>
                )}
                <div>
                  学习时长：{selectedCert.totalWatchTime ? 
                    Math.round(selectedCert.totalWatchTime / 60) + '分钟' : '未知'}
                </div>
              </div>
            </div>

            <Card style={{ marginTop: 24 }} size="small" title="证书信息">
              <List
                size="small"
                dataSource={[
                  { label: '证书编号', value: selectedCert.certificateNo },
                  { label: '学员姓名', value: selectedCert.studentName },
                  { label: '课程名称', value: selectedCert.courseTitle },
                  { 
                    label: '讲师', 
                    value: selectedCert.courseTeacher?.username || '未知' 
                  },
                  { 
                    label: '颁发日期', 
                    value: dayjs(selectedCert.issuedDate).format('YYYY年MM月DD日') 
                  },
                  { 
                    label: '结业日期', 
                    value: selectedCert.completionDate ? 
                      dayjs(selectedCert.completionDate).format('YYYY年MM月DD日') : '未知'
                  },
                  { 
                    label: '最终成绩', 
                    value: selectedCert.finalScore !== null && selectedCert.finalScore !== undefined ? 
                      `${selectedCert.finalScore}分` : '无'
                  },
                  { 
                    label: '学习进度', 
                    value: `${selectedCert.progress || 100}%` 
                  },
                  { 
                    label: '验证码', 
                    value: selectedCert.verificationCode 
                  }
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.label}
                      description={<span style={{ color: '#333' }}>{item.value}</span>}
                    />
                  </List.Item>
                )}
              />
            </Card>

            <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
              <h4 style={{ marginBottom: 8 }}>证书验证</h4>
              <p style={{ fontSize: 12, color: '#666', margin: 0 }}>
                您可以通过验证码 <strong>{selectedCert.verificationCode}</strong> 验证此证书的真实性。
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Certificates
