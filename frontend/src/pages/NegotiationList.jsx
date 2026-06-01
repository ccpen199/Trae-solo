import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Row,
  Col,
  Modal,
  message,
  Popconfirm
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  CloseOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import * as XLSX from 'xlsx'

const API_BASE = '/api'

const NegotiationList = () => {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
    category_id: '',
    supplier_id: ''
  })
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [closeModal, setCloseModal] = useState(false)
  const [closeId, setCloseId] = useState(null)
  const [closeReason, setCloseReason] = useState('')

  useEffect(() => {
    loadOptions()
    loadData()
  }, [])

  const loadOptions = async () => {
    try {
      const [catRes, supRes] = await Promise.all([
        axios.get(`${API_BASE}/categories`),
        axios.get(`${API_BASE}/suppliers`)
      ])
      setCategories(catRes.data.data || [])
      setSuppliers(supRes.data.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/negotiations`, { params: filters })
      setData(res.data.data || [])
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const statusMap = {
    draft: { text: '草稿', color: 'default' },
    submitted: { text: '已提交', color: 'blue' },
    executing: { text: '执行中', color: 'orange' },
    reviewing: { text: '审核中', color: 'purple' },
    returned: { text: '已退回', color: 'red' },
    completed: { text: '已完成', color: 'green' },
    closed: { text: '已关闭', color: 'default' }
  }

  const priorityMap = {
    high: { text: '高', color: 'red' },
    medium: { text: '中', color: 'orange' },
    low: { text: '低', color: 'green' }
  }

  const handleClose = async () => {
    if (!closeReason.trim()) {
      message.warning('请填写关闭原因')
      return
    }
    try {
      await axios.post(`${API_BASE}/negotiations/${closeId}/close`, {
        operator_id: 'user_004',
        operator_name: '张三',
        reason: closeReason
      })
      message.success('关闭成功')
      setCloseModal(false)
      setCloseReason('')
      loadData()
    } catch (e) {
      message.error('关闭失败')
    }
  }

  const handleExport = async () => {
    try {
      const res = await axios.get(`${API_BASE}/export/negotiations`)
      const data = res.data.data
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '谈判列表')
      XLSX.writeFile(wb, `谈判列表_${new Date().toISOString().slice(0, 10)}.xlsx`)
      message.success('导出成功')
    } catch (e) {
      message.error('导出失败')
    }
  }

  const columns = [
    { title: '编号', dataIndex: 'code', width: 140, fixed: 'left' },
    { title: '标题', dataIndex: 'title', ellipsis: true, width: 200 },
    { title: '品类', dataIndex: 'category_name', width: 120 },
    { title: '供应商', dataIndex: 'supplier_name', ellipsis: true, width: 160 },
    {
      title: '预算金额',
      dataIndex: 'expected_amount',
      width: 120,
      render: v => v ? `¥${v.toLocaleString()}` : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: s => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text}</Tag>
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      render: p => <Tag color={priorityMap[p]?.color}>{priorityMap[p]?.text}</Tag>
    },
    { title: '负责人', dataIndex: 'owner_name', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', width: 180 },
    {
      title: '操作',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/negotiation/${record.id}`)}
          >
            详情
          </Button>
          {record.status !== 'closed' && record.status !== 'completed' && (
            <Popconfirm
              title="确定关闭此谈判?"
              onConfirm={() => {
                setCloseId(record.id)
                setCloseModal(true)
              }}
            >
              <Button type="link" size="small" danger icon={<CloseOutlined />}>
                关闭
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">谈判管理</h1>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/negotiation/create')}>
            新建谈判
          </Button>
        </Space>
      </div>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Input
              placeholder="搜索标题/编号/供应商"
              prefix={<SearchOutlined />}
              allowClear
              value={filters.keyword}
              onChange={e => setFilters({ ...filters, keyword: e.target.value })}
              onPressEnter={loadData}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="状态"
              allowClear
              style={{ width: '100%' }}
              value={filters.status || undefined}
              onChange={v => setFilters({ ...filters, status: v })}
              onClear={() => setFilters({ ...filters, status: '' })}
              options={Object.entries(statusMap).map(([k, v]) => ({ value: k, label: v.text }))}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="采购品类"
              allowClear
              style={{ width: '100%' }}
              value={filters.category_id || undefined}
              onChange={v => setFilters({ ...filters, category_id: v })}
              onClear={() => setFilters({ ...filters, category_id: '' })}
              options={categories.map(c => ({ value: c.id, label: c.name }))}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="供应商"
              allowClear
              style={{ width: '100%' }}
              value={filters.supplier_id || undefined}
              onChange={v => setFilters({ ...filters, supplier_id: v })}
              onClear={() => setFilters({ ...filters, supplier_id: '' })}
              options={suppliers.map(s => ({ value: s.id, label: s.name }))}
            />
          </Col>
          <Col span={6}>
            <Space>
              <Button type="primary" onClick={loadData}>查询</Button>
              <Button onClick={() => {
                setFilters({ keyword: '', status: '', category_id: '', supplier_id: '' })
                setTimeout(loadData, 100)
              }}>重置</Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`
          }}
          onRow={record => ({
            onDoubleClick: () => navigate(`/negotiation/${record.id}`)
          })}
        />
      </Card>

      <Modal
        title="关闭谈判"
        open={closeModal}
        onOk={handleClose}
        onCancel={() => setCloseModal(false)}
      >
        <div style={{ marginBottom: 16 }}>请填写关闭原因：</div>
        <Input.TextArea
          rows={4}
          placeholder="关闭原因"
          value={closeReason}
          onChange={e => setCloseReason(e.target.value)}
        />
      </Modal>
    </div>
  )
}

export default NegotiationList
