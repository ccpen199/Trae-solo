import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Select, Input, Modal, Form, message, Spin, Space } from 'antd'
import { SearchOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons'
import { getAdminParcels, updateParcelStatus } from '../../api/admin'
import dayjs from 'dayjs'

const { Option } = Select

function AdminParcels() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [editModal, setEditModal] = useState(false)
  const [selectedParcel, setSelectedParcel] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchParcels()
  }, [statusFilter])

  const fetchParcels = async () => {
    setLoading(true)
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {}
      const result = await getAdminParcels(params)
      setData(Array.isArray(result) ? result : result?.list || [])
    } catch (error) {
      message.error('获取包裹列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (record) => {
    setSelectedParcel(record)
    form.setFieldsValue({
      status: record.status,
      location: record.current_location,
      remark: '',
    })
    setEditModal(true)
  }

  const handleUpdateStatus = async (values) => {
    if (!selectedParcel) return
    
    try {
      await updateParcelStatus(selectedParcel.tracking_no, values)
      message.success('状态更新成功')
      setEditModal(false)
      fetchParcels()
    } catch (error) {
      message.error('更新失败')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'orange',
      'picked': 'cyan',
      'transit': 'blue',
      'arrived': 'geekblue',
      'out_for_delivery': 'purple',
      'delivered': 'green',
      'anomaly': 'red',
      'pickup': 'purple'
    }
    return colors[status] || 'default'
  }

  const getStatusText = (status) => {
    const texts = {
      'pending': '待揽收',
      'picked': '已揽收',
      'transit': '运输中',
      'arrived': '已到达',
      'out_for_delivery': '派送中',
      'delivered': '已签收',
      'anomaly': '异常',
      'pickup': '待取件'
    }
    return texts[status] || status
  }

  const mockData = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    tracking_no: `SF${100000 + i}`,
    sender_name: `寄件人${i + 1}`,
    receiver_name: `收件人${i + 1}`,
    destination: ['北京', '上海', '广州', '深圳', '杭州'][i % 5],
    status: ['pending', 'picked', 'transit', 'delivered', 'anomaly'][i % 5],
    weight: (Math.random() * 10 + 0.5).toFixed(2),
    current_location: ['北京转运中心', '上海虹桥站', '广州白云区', '深圳南山区', '杭州西湖区'][i % 5],
    created_at: dayjs().subtract(i, 'day').toISOString(),
    updated_at: dayjs().subtract(i, 'day').add(2, 'hour').toISOString(),
  }))

  const displayData = data.length > 0 ? data : mockData

  const filteredData = displayData.filter(item => 
    item.tracking_no?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.receiver_name?.includes(searchText) ||
    item.sender_name?.includes(searchText)
  )

  const columns = [
    {
      title: '运单号',
      dataIndex: 'tracking_no',
      key: 'tracking_no',
      fixed: 'left',
      width: 120,
    },
    {
      title: '寄件人',
      dataIndex: 'sender_name',
      key: 'sender_name',
    },
    {
      title: '收件人',
      dataIndex: 'receiver_name',
      key: 'receiver_name',
    },
    {
      title: '目的地',
      dataIndex: 'destination',
      key: 'destination',
    },
    {
      title: '重量 (kg)',
      dataIndex: 'weight',
      key: 'weight',
      width: 100,
    },
    {
      title: '当前位置',
      dataIndex: 'current_location',
      key: 'current_location',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 160,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          更新状态
        </Button>
      ),
    },
  ]

  return (
    <div className="page-container">
      <h2 className="page-title">包裹管理</h2>

      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Select
            defaultValue="all"
            style={{ width: 150 }}
            onChange={setStatusFilter}
          >
            <Option value="all">全部状态</Option>
            <Option value="pending">待揽收</Option>
            <Option value="picked">已揽收</Option>
            <Option value="transit">运输中</Option>
            <Option value="arrived">已到达</Option>
            <Option value="out_for_delivery">派送中</Option>
            <Option value="delivered">已签收</Option>
            <Option value="anomaly">异常</Option>
          </Select>
          <Input.Search
            placeholder="搜索运单号/收件人/寄件人"
            allowClear
            style={{ width: 280 }}
            onSearch={(value) => setSearchText(value)}
            onChange={(e) => setSearchText(e.target.value)}
            enterButton={<SearchOutlined />}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchParcels}
          >
            刷新
          </Button>
        </Space>
      </Card>

      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="tracking_no"
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        </Spin>
      </Card>

      <Modal
        title="更新包裹状态"
        open={editModal}
        onCancel={() => setEditModal(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateStatus}>
          <Form.Item
            label="运单号"
          >
            <Input value={selectedParcel?.tracking_no} disabled />
          </Form.Item>

          <Form.Item
            name="status"
            label="新状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择新状态">
              <Option value="pending">待揽收</Option>
              <Option value="picked">已揽收</Option>
              <Option value="transit">运输中</Option>
              <Option value="arrived">已到达</Option>
              <Option value="out_for_delivery">派送中</Option>
              <Option value="delivered">已签收</Option>
              <Option value="anomaly">异常</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="location"
            label="当前位置"
            rules={[{ required: true, message: '请输入当前位置' }]}
          >
            <Input placeholder="请输入当前位置" />
          </Form.Item>

          <Form.Item
            name="remark"
            label="备注说明"
          >
            <Input.TextArea rows={3} placeholder="请输入备注信息（可选）" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认更新
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AdminParcels
