import React, { useState } from 'react'
import { Form, Input, Button, Card, Row, Col, Timeline, Tag, Spin, message, Empty, Divider } from 'antd'
import { SearchOutlined, EnvironmentOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { trackParcels } from '../../api/parcels'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

function ParcelTrack() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const navigate = useNavigate()

  const handleTrack = async (values) => {
    if (!values.trackingNos?.trim()) {
      message.warning('请输入运单号')
      return
    }
    
    const trackingNos = values.trackingNos.split(/[,，\s]+/).filter(n => n.trim())
    
    if (trackingNos.length === 0) {
      message.warning('请输入有效的运单号')
      return
    }

    setLoading(true)
    try {
      const data = await trackParcels(trackingNos)
      setResults(Array.isArray(data) ? data : data?.parcels || [])
      if (results.length === 0) {
        message.info('未查询到相关包裹信息')
      }
    } catch (error) {
      message.error('查询失败，请稍后重试')
      console.error('Track error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'orange',
      'transit': 'blue',
      'delivered': 'green',
      'anomaly': 'red',
      'pickup': 'purple'
    }
    return colors[status] || 'default'
  }

  const getStatusText = (status) => {
    const texts = {
      'pending': '待揽收',
      'transit': '运输中',
      'delivered': '已签收',
      'anomaly': '异常',
      'pickup': '待取件'
    }
    return texts[status] || status
  }

  const getTimelineColor = (status) => {
    const colors = {
      'delivered': 'green',
      'transit': 'blue',
      'pending': 'orange',
      'pickup': 'purple',
      'anomaly': 'red'
    }
    return colors[status] || 'gray'
  }

  return (
    <div className="page-container">
      <h2 className="page-title">包裹查询</h2>
      
      <Card style={{ marginBottom: 24 }}>
        <Form layout="inline" onFinish={handleTrack}>
          <Form.Item
            name="trackingNos"
            style={{ flex: 1, minWidth: 300 }}
          >
            <Input.TextArea
              placeholder="请输入运单号，多个单号用逗号或空格分隔"
              rows={2}
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SearchOutlined />}
              size="large"
            >
              查询
            </Button>
          </Form.Item>
        </Form>
        <p style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, marginTop: 8 }}>
          支持批量查询，最多可同时查询10个运单号
        </p>
      </Card>

      <Spin spinning={loading}>
        {results.length > 0 ? (
          <Row gutter={[16, 16]}>
            {results.map((parcel, index) => (
              <Col xs={24} lg={12} key={parcel.tracking_no || index}>
                <Card
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{parcel.tracking_no}</span>
                      <Tag color={getStatusColor(parcel.status)}>
                        {getStatusText(parcel.status)}
                      </Tag>
                    </div>
                  }
                  extra={
                    <Button
                      type="link"
                      onClick={() => navigate(`/trace/${parcel.tracking_no}`)}
                    >
                      查看溯源链
                    </Button>
                  }
                >
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ marginBottom: 4 }}>
                      <strong>收件人：</strong>{parcel.receiver_name || '---'}
                    </p>
                    <p style={{ marginBottom: 4 }}>
                      <strong>目的地：</strong>{parcel.destination || '---'}
                    </p>
                    <p style={{ marginBottom: 4 }}>
                      <strong>预计送达：</strong>
                      {parcel.estimated_delivery 
                        ? dayjs(parcel.estimated_delivery).format('YYYY-MM-DD') 
                        : '---'}
                    </p>
                  </div>

                  <Divider style={{ margin: '12px 0' }} />
                  
                  <div className="tracking-timeline">
                    <Timeline
                      mode="left"
                      items={(parcel.tracking_history || []).slice(0, 5).map((event, idx) => ({
                        color: idx === 0 ? getTimelineColor(parcel.status) : 'gray',
                        dot: idx === 0 ? (
                          parcel.status === 'delivered' 
                            ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                            : <ClockCircleOutlined style={{ color: '#1890ff', fontSize: 16 }} />
                        ) : undefined,
                        children: (
                          <div>
                            <p style={{ marginBottom: 4, fontWeight: idx === 0 ? 600 : 400 }}>
                              {event.status}
                            </p>
                            <p style={{ marginBottom: 4, color: 'rgba(0,0,0,0.65)' }}>
                              <EnvironmentOutlined style={{ marginRight: 4 }} />
                              {event.location || '---'}
                            </p>
                            <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                              {dayjs(event.timestamp).format('YYYY-MM-DD HH:mm')}
                            </p>
                          </div>
                        ),
                      }))}
                    />
                    {(parcel.tracking_history || []).length > 5 && (
                      <Button type="link" block>
                        查看全部 {parcel.tracking_history.length} 条轨迹
                      </Button>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          !loading && (
            <Empty
              description={
                <span>
                  输入运单号查询包裹物流信息<br />
                  <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                    支持多个单号批量查询
                  </span>
                </span>
              }
            />
          )
        )}
      </Spin>
    </div>
  )
}

export default ParcelTrack
