import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, message, Spin } from 'antd'
import {
  InboxOutlined,
  SendOutlined,
  WarningOutlined,
  ShoppingOutlined,
  ShopOutlined
} from '@ant-design/icons'
import { inventoryApi, productApi } from '../services/api'

const Dashboard = () => {
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState(null)
  const [warningProducts, setWarningProducts] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statResult, productResult] = await Promise.all([
        inventoryApi.getInventoryStatistics(),
        productApi.getProducts({ page_size: 5 })
      ])

      if (statResult.success) {
        setStatistics(statResult.data)
        setWarningProducts(statResult.data.warning_items || [])
      }
    } catch (error) {
      console.error('Fetch dashboard data failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStockStatusTag = (stock_status) => {
    const statusMap = {
      out_of_stock: { text: '缺货', color: 'error' },
      low_stock: { text: '库存不足', color: 'warning' },
      over_stock: { text: '库存过高', color: 'processing' },
      normal: { text: '正常', color: 'success' }
    }
    const status = statusMap[stock_status] || { text: '未知', color: 'default' }
    return <Tag color={status.color}>{status.text}</Tag>
  }

  const warningColumns = [
    {
      title: '商品编码',
      dataIndex: 'product_code',
      key: 'product_code',
    },
    {
      title: '商品名称',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: '当前库存',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (text, record) => {
        if (text === 0) {
          return <span style={{ color: '#ff4d4f' }}>{text}</span>
        }
        if (record.min_stock && text < record.min_stock) {
          return <span style={{ color: '#faad14' }}>{text}</span>
        }
        return text
      }
    },
    {
      title: '最低库存',
      dataIndex: 'min_stock',
      key: 'min_stock',
    }
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">首页</div>
        <div className="page-description">库存管理系统概览</div>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={12} md={6}>
            <Card className="card-statistic">
              <Statistic
                title="商品总数"
                value={statistics?.summary?.total_products || 0}
                prefix={<ShoppingOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card className="card-statistic">
              <Statistic
                title="库存总量"
                value={statistics?.summary?.total_quantity || 0}
                prefix={<InboxOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card className="card-statistic">
              <Statistic
                title="缺货商品"
                value={statistics?.summary?.out_of_stock_count || 0}
                prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card className="card-statistic">
              <Statistic
                title="库存不足"
                value={statistics?.summary?.low_stock_count || 0}
                prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card 
              title={
                <span>
                  <WarningOutlined style={{ marginRight: 8, color: '#faad14' }} />
                  库存预警商品
                </span>
              }
              extra={
                warningProducts.length > 0 ? (
                  <Tag color="warning">共 {warningProducts.length} 个商品</Tag>
                ) : null
              }
            >
              {warningProducts.length > 0 ? (
                <Table
                  dataSource={warningProducts}
                  columns={warningColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              ) : (
                <div className="empty-state">
                  <ShopOutlined />
                  <p>暂无库存预警商品</p>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card title="库存分布（按类型）">
              {statistics?.by_category?.length > 0 ? (
                <div>
                  {statistics.by_category.map((item, index) => (
                    <div key={item.id || index} style={{ marginBottom: 16 }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginBottom: 4
                      }}>
                        <span>{item.type_name || '未分类'}</span>
                        <span style={{ color: '#666' }}>
                          {item.product_count} 种商品 · {item.total_quantity} 件
                        </span>
                      </div>
                      <div style={{ 
                        height: 8, 
                        background: '#f0f0f0',
                        borderRadius: 4,
                        overflow: 'hidden'
                      }}>
                        <div 
                          style={{ 
                            height: '100%',
                            width: `${Math.min(100, (item.total_quantity / (statistics.summary.total_quantity || 1)) * 100)}%`,
                            background: ['#1890ff', '#52c41a', '#722ed1', '#faad14', '#eb2f96'][index % 5],
                            borderRadius: 4
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <InboxOutlined />
                  <p>暂无数据</p>
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="系统提示">
              <div style={{ lineHeight: 2 }}>
                <p>📌 系统默认管理员账号: admin / admin123</p>
                <p>📌 入库流程：创建入库单 → 完成入库 → 库存自动增加</p>
                <p>📌 出库流程：创建出库单 → 完成出库 → 库存自动减少</p>
                <p>📌 取消已完成的出入库单会自动回滚库存数量</p>
                <p>📌 所有操作都会记录到操作日志中</p>
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  )
}

export default Dashboard