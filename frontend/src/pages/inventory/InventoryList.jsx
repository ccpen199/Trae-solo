import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Card, Statistic, Row, Col, Tag, Input, message } from 'antd'
import { ReloadOutlined, SearchOutlined, ExportOutlined, WarningOutlined } from '@ant-design/icons'
import { inventoryApi, productApi } from '../../services/api'

const { Search } = Input

const InventoryList = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [searchKeyword, setSearchKeyword] = useState('')
  const [stats, setStats] = useState({
    total_products: 0,
    total_quantity: 0,
    total_in: 0,
    total_out: 0,
    low_stock_count: 0,
    over_stock_count: 0
  })

  const fetchData = async (page = 1, pageSize = 10, keyword = '') => {
    setLoading(true)
    try {
      const result = await inventoryApi.getInventoryList({ 
        page, 
        page_size: pageSize,
        keyword: keyword || undefined
      })
      if (result.success) {
        setData(result.data.list)
        setPagination({
          current: result.data.pagination.page,
          pageSize: result.data.pagination.page_size,
          total: result.data.pagination.total
        })
      }
    } catch (error) {
      console.error('Fetch inventory failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
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
      }
    } catch (error) {
      console.error('Fetch stats failed:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const result = await productApi.getProducts({ page: 1, page_size: 100 })
      if (result.success) {
        setProducts(result.data.list)
      }
    } catch (error) {
      console.error('Fetch products failed:', error)
    }
  }

  useEffect(() => {
    fetchData()
    fetchStats()
    fetchProducts()
  }, [])

  const handleSearch = () => {
    fetchData(1, pagination.pageSize, searchKeyword)
  }

  const handleExport = () => {
    inventoryApi.exportInventory({ keyword: searchKeyword })
    message.success('导出任务已开始')
  }

  const getProductInfo = (productId) => {
    const product = products.find(p => p.id === productId)
    return product || { product_name: '-', product_code: '-', min_stock: 0, max_stock: 10000 }
  }

  const getStockStatus = (quantity, minStock, maxStock) => {
    if (quantity <= minStock) {
      return { color: 'error', text: '库存不足' }
    }
    if (quantity >= maxStock) {
      return { color: 'warning', text: '库存过高' }
    }
    return { color: 'success', text: '正常' }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'product_id',
      key: 'product_id',
      width: 80
    },
    {
      title: '商品编码',
      dataIndex: 'product_id',
      key: 'product_code',
      render: (productId) => getProductInfo(productId).product_code
    },
    {
      title: '商品名称',
      dataIndex: 'product_id',
      key: 'product_name',
      render: (productId) => getProductInfo(productId).product_name
    },
    {
      title: '当前库存',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity, record) => {
        const product = getProductInfo(record.product_id)
        const status = getStockStatus(quantity, product.min_stock, product.max_stock)
        return (
          <Space>
            <span style={{ fontWeight: 'bold' }}>{quantity}</span>
            <Tag color={status.color}>{status.text}</Tag>
          </Space>
        )
      }
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
    },
    {
      title: '最低预警',
      dataIndex: 'product_id',
      key: 'min_stock',
      render: (productId) => getProductInfo(productId).min_stock
    },
    {
      title: '最高预警',
      dataIndex: 'product_id',
      key: 'max_stock',
      render: (productId) => getProductInfo(productId).max_stock
    },
    {
      title: '最后入库时间',
      dataIndex: 'last_in_time',
      key: 'last_in_time',
      render: (time) => time || '-'
    },
    {
      title: '最后出库时间',
      dataIndex: 'last_out_time',
      key: 'last_out_time',
      render: (time) => time || '-'
    }
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">库存查询</div>
        <div className="page-description">查询当前库存数量和状态</div>
      </div>

      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="商品种类"
              value={stats.total_products}
              prefix={<span>种</span>}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="库存总数"
              value={stats.total_quantity}
              prefix={<span>件</span>}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="累计入库"
              value={stats.total_in}
              prefix={<span>件</span>}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="累计出库"
              value={stats.total_out}
              prefix={<span>件</span>}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="库存不足"
              value={stats.low_stock_count}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="库存过高"
              value={stats.over_stock_count}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <div className="table-toolbar">
        <div className="search-form">
          <Search
            placeholder="搜索商品编码或名称"
            allowClear
            enterButton={<span><SearchOutlined /> 搜索</span>}
            style={{ width: 300 }}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={handleSearch}
          />
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchData(); fetchStats(); }}>
            刷新
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1400 }}
        pagination={{
          ...pagination,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, pageSize) => fetchData(page, pageSize, searchKeyword)
        }}
      />
    </div>
  )
}

export default InventoryList