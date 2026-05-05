import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Button, message, Space } from 'antd'
import { ReloadOutlined, ExportOutlined, RiseOutlined, FallOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { inventoryApi } from '../../services/api'

const InventoryStatistics = () => {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    total_products: 0,
    total_quantity: 0,
    total_in: 0,
    total_out: 0,
    low_stock_count: 0,
    over_stock_count: 0
  })
  const [topProducts, setTopProducts] = useState([])
  const [typeStats, setTypeStats] = useState([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await inventoryApi.getInventoryStatistics()
      if (result.success) {
        setStats({
          total_products: result.data?.summary?.total_products || 0,
          total_quantity: result.data?.summary?.total_quantity || 0,
          total_in: result.data?.summary?.total_in_quantity || 0,
          total_out: result.data?.summary?.total_out_quantity || 0,
          low_stock_count: result.data?.summary?.low_stock_count || 0,
          over_stock_count: result.data?.summary?.out_of_stock_count || 0
        })
        setTopProducts(result.data?.warning_items || [])
        setTypeStats(result.data?.by_category || [])
      }
    } catch (error) {
      console.error('Fetch stats failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleExport = () => {
    inventoryApi.exportStatistics()
    message.success('导出任务已开始')
  }

  const topProductsColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 80,
      render: (_, __, index) => index + 1
    },
    {
      title: '商品名称',
      dataIndex: 'product_name',
      key: 'product_name'
    },
    {
      title: '当前库存',
      dataIndex: 'quantity',
      key: 'quantity'
    },
    {
      title: '累计入库',
      dataIndex: 'total_in',
      key: 'total_in'
    },
    {
      title: '累计出库',
      dataIndex: 'total_out',
      key: 'total_out'
    }
  ]

  const typeColumns = [
    {
      title: '商品类型',
      dataIndex: 'type_name',
      key: 'type_name'
    },
    {
      title: '商品数量',
      dataIndex: 'product_count',
      key: 'product_count'
    },
    {
      title: '库存总量',
      dataIndex: 'total_quantity',
      key: 'total_quantity'
    }
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">库存统计</div>
        <div className="page-description">库存数据统计分析</div>
      </div>

      <div className="table-toolbar">
        <div></div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            刷新
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出统计
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="商品种类"
              value={stats.total_products}
              suffix="种"
              prefix={<InfoCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="库存总数"
              value={stats.total_quantity}
              suffix="件"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="累计入库"
              value={stats.total_in}
              suffix="件"
              valueStyle={{ color: '#52c41a' }}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="累计出库"
              value={stats.total_out}
              suffix="件"
              valueStyle={{ color: '#1890ff' }}
              prefix={<FallOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="库存不足"
              value={stats.low_stock_count}
              suffix="种"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="库存过高"
              value={stats.over_stock_count}
              suffix="种"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="库存最多商品 TOP 10" size="small">
            <Table
              dataSource={topProducts}
              columns={topProductsColumns}
              rowKey="product_id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="按类型统计" size="small">
            <Table
              dataSource={typeStats}
              columns={typeColumns}
              rowKey="type_id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default InventoryStatistics