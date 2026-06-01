import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Space, Modal, message, Spin, Alert, Descriptions } from 'antd'
import { WarningOutlined, ReloadOutlined, SearchOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { getAnomalyParcels, recheckAnomaly } from '../../api/parcels'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

function AnomalyAlert() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [detailModal, setDetailModal] = useState(false)
  const [selectedParcel, setSelectedParcel] = useState(null)
  const [recheckLoading, setRecheckLoading] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    fetchAnomalyParcels()
  }, [])

  const fetchAnomalyParcels = async () => {
    setLoading(true)
    try {
      const result = await getAnomalyParcels()
      setData(Array.isArray(result) ? result : result?.list || [])
    } catch (error) {
      message.error('获取异常件列表失败')
      console.error('Fetch anomaly parcels error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRecheck = async (trackingNo) => {
    setRecheckLoading(prev => ({ ...prev, [trackingNo]: true }))
    try {
      await recheckAnomaly(trackingNo)
      message.success('重新查询已触发，请稍后查看结果')
      setTimeout(fetchAnomalyParcels, 2000)
    } catch (error) {
      message.error('重新查询失败')
    } finally {
      setRecheckLoading(prev => ({ ...prev, [trackingNo]: false }))
    }
  }

  const showDetail = (record) => {
    setSelectedParcel(record)
    setDetailModal(true)
  }

  const getAnomalyType = (type) => {
    const types = {
      'stagnant': { text: '滞留超时', color: 'red' },
      'damaged': { text: '破损', color: 'orange' },
      'lost': { text: '丢失', color: 'red' },
      'address_error': { text: '地址错误', color: 'orange' },
      'recipient_unavailable': { text: '收件人无法联系', color: 'orange' },
    }
    return types[type] || { text: type || '异常', color: 'red' }
  }

  const getStagnantHours = (record) => {
    if (!record.last_update) return 0
    const hours = dayjs().diff(dayjs(record.last_update), 'hour')
    return hours
  }

  const columns = [
    {
      title: '运单号',
      dataIndex: 'tracking_no',
      key: 'tracking_no',
      render: (text) => (
        <Button 
          type="link" 
          onClick={() => navigate(`/trace/${text}`)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: '异常类型',
      dataIndex: 'anomaly_type',
      key: 'anomaly_type',
      render: (type) => {
        const anomaly = getAnomalyType(type)
        return <Tag color={anomaly.color}>{anomaly.text}</Tag>
      },
    },
    {
      title: '滞留时长',
      key: 'stagnant_hours',
      render: (_, record) => {
        const hours = getStagnantHours(record)
        return (
          <span style={{ color: hours > 72 ? '#ff4d4f' : '#faad14', fontWeight: 500 }}>
            {hours} 小时 {hours > 48 && '（超48h）'}
          </span>
        )
      },
    },
    {
      title: '最后位置',
      dataIndex: 'last_location',
      key: 'last_location',
      render: (text) => text || '---',
    },
    {
      title: '最近更新',
      dataIndex: 'last_update',
      key: 'last_update',
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '---',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<SearchOutlined />}
            size="small"
            onClick={() => showDetail(record)}
          >
            详情
          </Button>
          <Button
            icon={<ReloadOutlined />}
            size="small"
            loading={recheckLoading[record.tracking_no]}
            onClick={() => handleRecheck(record.tracking_no)}
          >
            重新查询
          </Button>
          <Button
            type="link"
            onClick={() => navigate(`/trace/${record.tracking_no}`)}
          >
            溯源
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <h2 className="page-title">异常件预警</h2>

      {data.length > 0 && (
        <Alert
          message={`您有 ${data.length} 个异常包裹需要处理`}
          description="滞留超过48小时的包裹已标记为异常，请及时处理或联系客服"
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" type="primary" onClick={fetchAnomalyParcels}>
              刷新
            </Button>
          }
        />
      )}

      <Card className="anomaly-card">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="tracking_no"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条异常记录`,
          }}
          locale={{
            emptyText: loading ? <Spin /> : (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                <p style={{ marginTop: 16, color: 'rgba(0,0,0,0.85)' }}>暂无异常包裹</p>
                <p style={{ color: 'rgba(0,0,0,0.45)' }}>您的所有包裹运输正常</p>
              </div>
            ),
          }}
        />
      </Card>

      <Modal
        title="异常件详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>
            关闭
          </Button>,
          <Button
            key="recheck"
            type="primary"
            loading={selectedParcel && recheckLoading[selectedParcel.tracking_no]}
            onClick={() => {
              if (selectedParcel) {
                handleRecheck(selectedParcel.tracking_no)
              }
            }}
          >
            重新查询
          </Button>,
        ]}
        width={700}
      >
        {selectedParcel && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="运单号" span={2}>
              {selectedParcel.tracking_no}
            </Descriptions.Item>
            <Descriptions.Item label="异常类型">
              <Tag color={getAnomalyType(selectedParcel.anomaly_type).color}>
                {getAnomalyType(selectedParcel.anomaly_type).text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="滞留时长">
              {getStagnantHours(selectedParcel)} 小时
            </Descriptions.Item>
            <Descriptions.Item label="最后位置" span={2}>
              {selectedParcel.last_location || '---'}
            </Descriptions.Item>
            <Descriptions.Item label="最近更新" span={2}>
              {selectedParcel.last_update 
                ? dayjs(selectedParcel.last_update).format('YYYY-MM-DD HH:mm') 
                : '---'}
            </Descriptions.Item>
            <Descriptions.Item label="异常描述" span={2}>
              {selectedParcel.anomaly_description || '包裹运输出现异常，请联系客服处理'}
            </Descriptions.Item>
            <Descriptions.Item label="建议处理" span={2}>
              {selectedParcel.suggestion || '建议联系客服核实包裹状态，或申请重新查询'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default AnomalyAlert
