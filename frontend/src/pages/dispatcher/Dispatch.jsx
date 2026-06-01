import React, { useState, useEffect } from 'react'
import { Card, Button, Tag, Table, Descriptions, message, Radio, Rate } from 'antd'
import { ArrowLeftOutlined, ThunderboltOutlined, UserOutlined, StarOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import request from '../../utils/request'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../utils/constants'

const Dispatch = () => {
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState(null)
  const [nurses, setNurses] = useState([])
  const [selectedNurse, setSelectedNurse] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    fetchOrderDetail()
    fetchRecommendedNurses()
  }, [id])

  const fetchOrderDetail = async () => {
    setLoading(true)
    try {
      const data = await request.get(`/dispatch/orders/${id}`)
      setOrder(data)
    } catch (error) {
      message.error('获取订单详情失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecommendedNurses = async () => {
    try {
      const data = await request.get(`/dispatch/orders/${id}/recommended-nurses`)
      setNurses(data.list || data || [])
      if (data.list && data.list.length > 0) {
        setSelectedNurse(data.list[0].id)
      }
    } catch (error) {
      message.error('获取推荐护士失败')
    }
  }

  const handleDispatch = async () => {
    if (!selectedNurse) {
      message.warning('请选择护士')
      return
    }
    setSubmitLoading(true)
    try {
      await request.post(`/dispatch/orders/${id}/assign`, { nurse_id: selectedNurse })
      message.success('派单成功')
      navigate('/dispatch/pool')
    } catch (error) {
      message.error('派单失败')
    } finally {
      setSubmitLoading(false)
    }
  }

  const nurseColumns = [
    {
      title: '匹配度',
      dataIndex: 'match_score',
      key: 'match_score',
      width: 100,
      render: (score) => (
        <Tag color={score >= 90 ? 'green' : score >= 70 ? 'blue' : 'orange'}>
          {score}%
        </Tag>
      )
    },
    {
      title: '护士姓名',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '资质',
      dataIndex: 'qualification',
      key: 'qualification'
    },
    {
      title: '经验年数',
      dataIndex: 'experience_years',
      key: 'experience_years',
      render: (years) => `${years}年`
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => <Rate disabled value={rating} allowHalf />
    },
    {
      title: '距离',
      dataIndex: 'distance',
      key: 'distance',
      render: (distance) => distance ? `${distance}km` : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'available' ? 'green' : 'default'}>
          {status === 'available' ? '空闲' : '忙碌'}
        </Tag>
      )
    }
  ]

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 48 }}>加载中...</div>
  }

  return (
    <div>
      <div className="page-header">
        <h2>派单管理</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            loading={submitLoading}
            onClick={handleDispatch}
            disabled={!selectedNurse}
          >
            确认派单
          </Button>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
        </div>
      </div>

      {order && (
        <>
          <Card className="detail-card" title="订单信息">
            <Descriptions column={3}>
              <Descriptions.Item label="订单号">{order.order_no}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={ORDER_STATUS_COLORS[order.status]}>
                  {ORDER_STATUS_LABELS[order.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="服务项目">{order.service_name}</Descriptions.Item>
              <Descriptions.Item label="患者姓名">{order.patient_name}</Descriptions.Item>
              <Descriptions.Item label="年龄">{order.patient_age}岁</Descriptions.Item>
              <Descriptions.Item label="预约时间">{order.scheduled_at}</Descriptions.Item>
              <Descriptions.Item label="服务地址" span={3}>{order.address}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card className="detail-card" title="推荐护士列表">
            <Radio.Group value={selectedNurse} onChange={(e) => setSelectedNurse(e.target.value)}>
              <Table
                columns={nurseColumns}
                dataSource={nurses}
                rowKey="id"
                pagination={false}
                rowSelection={{
                  type: 'radio',
                  selectedRowKeys: selectedNurse ? [selectedNurse] : [],
                  onChange: (keys) => setSelectedNurse(keys[0])
                }}
              />
            </Radio.Group>
          </Card>
        </>
      )}
    </div>
  )
}

export default Dispatch
