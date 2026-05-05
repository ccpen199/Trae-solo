import React, { useState, useEffect } from 'react'
import { 
  Card, Form, Input, Select, DatePicker, Button, Table, Space, Tag, 
  message, Descriptions, Statistic, Row, Col, Progress
} from 'antd'
import { SearchOutlined, ReloadOutlined, BarChartOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { ticketApi, trainApi } from '../services/api'

const InventoryView = () => {
  const [searchForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [inventory, setInventory] = useState([])
  const [trains, setTrains] = useState([])

  const stations = ['北京', '上海', '广州', '深圳', '武汉', '成都', '西安', '郑州', '南京', '杭州']

  const handleSearch = async (values) => {
    setLoading(true)
    try {
      const params = {}
      if (values.fromStation) {
        params.fromStation = values.fromStation
      }
      if (values.toStation) {
        params.toStation = values.toStation
      }
      if (values.travelDate) {
        params.travelDate = values.travelDate.format('YYYY-MM-DD')
      }

      const result = await ticketApi.getInventorySummary(params)
      
      if (result.success) {
        setInventory(result.data)
        message.success('查询到 ' + result.data.length + ' 条库存记录')
      } else {
        message.error('查询失败')
      }
    } catch (error) {
      message.error('查询失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrains()
  }, [])

  const loadTrains = async () => {
    try {
      const result = await trainApi.list({})
      if (result.success) {
        setTrains(result.data)
      }
    } catch (error) {
      console.error('Failed to load trains:', error)
    }
  }

  const totalAvailable = inventory.reduce((sum, item) => sum + (item.available_count || 0), 0)
  const totalSold = inventory.reduce((sum, item) => sum + (item.sold_count || 0), 0)
  const totalLocked = inventory.reduce((sum, item) => sum + (item.locked_count || 0), 0)
  const totalTotal = inventory.reduce((sum, item) => sum + (item.total_count || 0), 0)

  const columns = [
    {
      title: '车次',
      dataIndex: 'train_number',
      key: 'train_number',
      width: 120,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <strong style={{ color: '#1890ff' }}>{text}</strong>
          <Tag style={{ margin: 0, fontSize: 10 }}>{record.train_type}</Tag>
        </Space>
      ),
    },
    {
      title: '出发站',
      dataIndex: 'from_station',
      key: 'from_station',
      width: 100,
    },
    {
      title: '到达站',
      dataIndex: 'to_station',
      key: 'to_station',
      width: 100,
    },
    {
      title: '席别',
      dataIndex: 'seat_type',
      key: 'seat_type',
      width: 80,
      render: (text) => (
        <Tag color={
          text.includes('硬') ? 'default' :
          text.includes('软') ? 'orange' :
          text.includes('一等') ? 'purple' :
          text.includes('二等') ? 'blue' : 'default'
        }>
          {text}
        </Tag>
      ),
    },
    {
      title: '出发日期',
      dataIndex: 'travel_date',
      key: 'travel_date',
      width: 120,
      render: (date) => String(date || ''),
    },
    {
      title: '总票数',
      dataIndex: 'total_count',
      key: 'total_count',
      width: 80,
      align: 'center',
      render: (count) => (
        <span style={{ fontWeight: 'bold' }}>{count}</span>
      ),
    },
    {
      title: '可用',
      dataIndex: 'available_count',
      key: 'available_count',
      width: 100,
      align: 'center',
      render: (count, record) => {
        const percent = record.total_count > 0 ? Math.round((count / record.total_count) * 100) : 0
        const color = percent > 50 ? '#52c41a' : percent > 20 ? '#faad14' : '#ff4d4f'
        return (
          <div>
            <Progress 
              percent={percent} 
              size="small"
              strokeColor={color}
              format={() => <span style={{ color }}>{count + '张'}</span>}
            />
          </div>
        )
      },
    },
    {
      title: '已售',
      dataIndex: 'sold_count',
      key: 'sold_count',
      width: 80,
      align: 'center',
      render: (count) => (
        <span style={{ color: count > 0 ? '#1890ff' : '#999' }}>{count}</span>
      ),
    },
    {
      title: '锁定',
      dataIndex: 'locked_count',
      key: 'locked_count',
      width: 80,
      align: 'center',
      render: (count) => (
        <span style={{ color: count > 0 ? '#faad14' : '#999' }}>{count}</span>
      ),
    },
    {
      title: '发车',
      dataIndex: 'departure_time',
      key: 'departure_time',
      width: 80,
      render: (time) => String(time || '').substring(0, 5),
    },
    {
      title: '到达',
      dataIndex: 'arrival_time',
      key: 'arrival_time',
      width: 80,
      render: (time) => String(time || '').substring(0, 5),
    },
  ]

  const formatSoldPercent = (percent) => {
    return percent + '% (已售' + totalSold + '/总' + totalTotal + ')'
  }

  const formatAvailablePercent = (percent) => {
    return percent + '% (可用' + totalAvailable + '/总' + totalTotal + ')'
  }

  const getRowKey = (record) => {
    return record.train_id + '-' + record.from_station + '-' + record.to_station + '-' + record.seat_type + '-' + record.travel_date
  }

  return (
    <div>
      <Card title="库存监控" style={{ marginBottom: 24 }}>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          initialValues={{ travelDate: dayjs() }}
        >
          <Form.Item name="fromStation" label="出发站">
            <Select placeholder="选择出发站" style={{ width: 120 }} allowClear>
              {stations.map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="toStation" label="到达站">
            <Select placeholder="选择到达站" style={{ width: 120 }} allowClear>
              {stations.map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="travelDate" label="出发日期">
            <DatePicker style={{ width: 150 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>
                查询
              </Button>
              <Button onClick={() => {
                searchForm.resetFields()
                setInventory([])
              }} icon={<ReloadOutlined />}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {inventory.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic 
                title="总票数" 
                value={totalTotal} 
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="可用票数" 
                value={totalAvailable} 
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="已售票数" 
                value={totalSold} 
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="锁定票数" 
                value={totalLocked} 
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>售票率</div>
              <Progress 
                percent={totalTotal > 0 ? Math.round((totalSold / totalTotal) * 100) : 0} 
                strokeColor="#722ed1"
                format={formatSoldPercent}
              />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 8, fontWeight: 'bold' }}>可用率</div>
              <Progress 
                percent={totalTotal > 0 ? Math.round((totalAvailable / totalTotal) * 100) : 0} 
                strokeColor="#52c41a"
                format={formatAvailablePercent}
              />
            </Col>
          </Row>
        </Card>
      )}

      <Card title={'库存详情 (共 ' + inventory.length + ' 条)'}>
        <Table
          columns={columns}
          dataSource={inventory}
          rowKey={getRowKey}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => '共 ' + total + ' 条',
          }}
          scroll={{ x: 1400 }}
        />
      </Card>
    </div>
  )
}

export default InventoryView
