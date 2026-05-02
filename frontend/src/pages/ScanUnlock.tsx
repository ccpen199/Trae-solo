import React, { useState, useEffect } from 'react'
import { Card, Form, Select, Button, message, Descriptions, Tag, Space, Divider, Result } from 'antd'
import { QrcodeOutlined, PlayCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { dispatchApi, orderApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

const { Option } = Select

const ScanUnlock: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<any>(null)
  const [form] = Form.useForm()
  const { user } = useAuthStore()

  const fetchVehicles = async () => {
    try {
      const res = await dispatchApi.getVehicles({ status: 'available' })
      if (res.data.success) {
        setVehicles(res.data.data)
      }
    } catch (error) {
      message.error('获取车辆列表失败')
    }
  }

  const checkActiveOrder = async () => {
    try {
      const res = await orderApi.list({ limit: 5 })
      if (res.data.success) {
        const activeOrder = res.data.data.find(
          (o: any) => ['pending_scan', 'pending_ride', 'riding'].includes(o.status)
        )
        if (activeOrder) {
          const detailRes = await orderApi.get(activeOrder.id)
          if (detailRes.data.success) {
            setCurrentOrder(detailRes.data.data.order)
          }
        }
      }
    } catch (error) {}
  }

  useEffect(() => {
    fetchVehicles()
    checkActiveOrder()
  }, [])

  const handleScanUnlock = async (values: { vehicleId: string }) => {
    if (!values.vehicleId) {
      message.warning('请选择车辆')
      return
    }

    const vehicle = vehicles.find(v => v.id === values.vehicleId)
    if (!vehicle) {
      message.error('车辆信息不存在')
      return
    }

    setLoading(true)
    try {
      const res = await orderApi.create({
        vehicleId: values.vehicleId,
        lockId: vehicle.lock_id,
        lat: vehicle.location_lat,
        lng: vehicle.location_lng
      })
      
      if (res.data.success) {
        message.success('扫码开锁成功，订单已创建')
        checkActiveOrder()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '扫码开锁失败')
    } finally {
      setLoading(false)
    }
  }

  const handleStartRide = async () => {
    if (!currentOrder) return
    setLoading(true)
    try {
      const res = await orderApi.startRide(currentOrder.id)
      if (res.data.success) {
        message.success('开始骑行')
        checkActiveOrder()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleEndRide = async () => {
    if (!currentOrder) return
    setLoading(true)
    try {
      const res = await orderApi.endRide(currentOrder.id)
      if (res.data.success) {
        message.success('结束骑行，已生成计费')
        setCurrentOrder(null)
        checkActiveOrder()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending_scan: { color: 'blue', text: '待扫码开锁' },
      pending_ride: { color: 'cyan', text: '待开始骑行' },
      riding: { color: 'green', text: '骑行中' },
      pending_billing: { color: 'orange', text: '待计费确认' }
    }
    const info = statusMap[status] || { color: 'default', text: status }
    return <Tag color={info.color}>{info.text}</Tag>
  }

  if (currentOrder) {
    return (
      <div>
        <h2 style={{ marginBottom: 24 }}>当前订单</h2>
        <Result
          status="success"
          title={
            <Space>
              <QrcodeOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              <span>订单进行中</span>
            </Space>
          }
          subTitle={
            <Space>
              订单号: {currentOrder.order_no}
              {getStatusTag(currentOrder.status)}
            </Space>
          }
        />
        
        <Card style={{ marginTop: 24 }}>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="车辆编号">{currentOrder.bike_code}</Descriptions.Item>
            <Descriptions.Item label="锁编号">{currentOrder.lock_code}</Descriptions.Item>
            <Descriptions.Item label="当前状态">
              {getStatusTag(currentOrder.status)}
            </Descriptions.Item>
            <Descriptions.Item label="开始时间">
              {currentOrder.start_time || '未开始'}
            </Descriptions.Item>
            {currentOrder.duration_minutes > 0 && (
              <Descriptions.Item label="骑行时长">
                {currentOrder.duration_minutes} 分钟
              </Descriptions.Item>
            )}
            {currentOrder.distance_km > 0 && (
              <Descriptions.Item label="骑行距离">
                {currentOrder.distance_km.toFixed(2)} 公里
              </Descriptions.Item>
            )}
            {currentOrder.amount > 0 && (
              <Descriptions.Item label="费用" span={2}>
                <span style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                  ¥{currentOrder.amount}
                </span>
              </Descriptions.Item>
            )}
          </Descriptions>

          <Divider />

          <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
            {currentOrder.availableActions?.includes('start_ride') && (
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={handleStartRide}
                loading={loading}
              >
                开始骑行
              </Button>
            )}
            
            {currentOrder.availableActions?.includes('end_ride') && (
              <Button
                type="primary"
                size="large"
                danger
                onClick={handleEndRide}
                loading={loading}
              >
                结束骑行
              </Button>
            )}
            
            {currentOrder.availableActions?.includes('report_exception') && (
              <Button
                size="large"
                icon={<ExclamationCircleOutlined />}
                onClick={() => message.info('请在订单详情中上报异常')}
              >
                上报异常
              </Button>
            )}
          </Space>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>扫码开锁</h2>
      
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <QrcodeOutlined style={{ fontSize: 120, color: '#1890ff' }} />
          <p style={{ marginTop: 16, color: '#999' }}>扫描车辆二维码或选择下方车辆</p>
        </div>

        <Divider>或选择车辆</Divider>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleScanUnlock}
        >
          <Form.Item
            name="vehicleId"
            label="选择车辆"
            rules={[{ required: true, message: '请选择车辆' }]}
          >
            <Select
              placeholder="选择可用车辆"
              size="large"
              showSearch
              optionFilterProp="children"
            >
              {vehicles.map(vehicle => (
                <Option key={vehicle.id} value={vehicle.id}>
                  {vehicle.bike_code} - 电量 {vehicle.battery_level}% ({vehicle.location_lat}, {vehicle.location_lng})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              icon={<QrcodeOutlined />}
              loading={loading}
            >
              扫码开锁
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {vehicles.length > 0 && (
        <Card title="可用车辆列表" style={{ marginTop: 24 }}>
          {vehicles.map(vehicle => (
            <div key={vehicle.id} style={{ 
              padding: 12, 
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <Tag color="green">{vehicle.bike_code}</Tag>
                <span style={{ marginLeft: 8 }}>锁: {vehicle.lock_code}</span>
              </div>
              <Space>
                <Tag color={vehicle.battery_level > 50 ? 'green' : vehicle.battery_level > 20 ? 'orange' : 'red'}>
                  电量 {vehicle.battery_level}%
                </Tag>
                <Tag>位置: ({vehicle.location_lat?.toFixed(4)}, {vehicle.location_lng?.toFixed(4)})</Tag>
              </Space>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

export default ScanUnlock
