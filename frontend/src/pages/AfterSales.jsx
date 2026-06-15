import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, Select, Modal, Form, Input, InputNumber, Radio, message, Space, Drawer, Descriptions, Card, Row, Col, Statistic, Alert } from 'antd'
import {
  CustomerServiceOutlined,
  EditOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CheckSquareOutlined,
  SyncOutlined,
  MessageOutlined,
  FileDoneOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { afterSalesApi, orderApi, compensationApi } from '../api'
import { useNavigate } from 'react-router-dom'

const { Option } = Select
const { TextArea } = Input

function AfterSales() {
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({ type: '', status: '' })
  const [createModal, setCreateModal] = useState(false)
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [form] = Form.useForm()
  const [replyForm] = Form.useForm()
  const [orderInfo, setOrderInfo] = useState(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [replyModal, setReplyModal] = useState(false)
  const [replyType, setReplyType] = useState('')

  useEffect(() => {
    loadStats()
    loadList()
  }, [pagination.current, pagination.pageSize])

  const loadStats = async () => {
    try {
      const res = await afterSalesApi.stats()
      if (res.success) setStats(res.data)
    } catch (e) { console.error(e) }
  }

  const loadList = async () => {
    setLoading(true)
    try {
      const res = await afterSalesApi.list({
        ...filters,
        page: pagination.current,
        pageSize: pagination.pageSize
      })
      if (res.success) {
        setList(res.data)
        setPagination(p => ({ ...p, total: res.total }))
      }
    } catch (e) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleBatchAccept = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要受理的售后单')
      return
    }
    Modal.confirm({
      title: '批量受理',
      content: `确定要受理选中的 ${selectedRowKeys.length} 条售后申请吗？`,
      onOk: async () => {
        try {
          for (const id of selectedRowKeys) {
            await afterSalesApi.updateStatus(id, 'accepted')
          }
          message.success('批量受理成功')
          setSelectedRowKeys([])
          loadList()
          loadStats()
        } catch (e) {
          message.error('操作失败')
        }
      }
    })
  }

  const handleBatchComplete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要完成的售后单')
      return
    }
    setReplyType('complete')
    replyForm.resetFields()
    setReplyModal(true)
  }

  const handleBatchReject = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要拒绝的售后单')
      return
    }
    setReplyType('reject')
    replyForm.resetFields()
    setReplyModal(true)
  }

  const submitReply = async (values) => {
    try {
      const status = replyType === 'complete' ? 'completed' : 'rejected'
      for (const id of selectedRowKeys) {
        await afterSalesApi.updateStatus(id, status, values.reply)
        if (status === 'completed' && replyType === 'complete' && values.compensation) {
          await compensationApi.manual({
            order_id: list.find(l => l.id === id)?.order_id,
            type: 'complaint',
            amount: values.compensation,
            reason: values.reply
          })
        }
      }
      message.success('操作成功')
      setReplyModal(false)
      setSelectedRowKeys([])
      loadList()
      loadStats()
    } catch (e) {
      message.error('操作失败')
    }
  }

  const handleViewDetail = async (item) => {
    setCurrentItem(item)
    try {
      const res = await orderApi.detail(item.order_id)
      if (res.success) {
        setOrderInfo(res.data)
      }
    } catch (e) {
      console.error(e)
    }
    setDetailDrawer(true)
  }

  const handleAccept = async (id) => {
    try {
      await afterSalesApi.updateStatus(id, 'accepted')
      message.success('已受理')
      loadList()
      loadStats()
    } catch (e) {
      message.error('操作失败')
    }
  }

  const handleComplete = (item) => {
    setCurrentItem(item)
    setSelectedRowKeys([item.id])
    setReplyType('complete')
    replyForm.resetFields()
    setReplyModal(true)
  }

  const handleReject = (item) => {
    setCurrentItem(item)
    setSelectedRowKeys([item.id])
    setReplyType('reject')
    replyForm.resetFields()
    setReplyModal(true)
  }

  const handleCreate = async (values) => {
    try {
      const res = await afterSalesApi.create(values)
      if (res.success) {
        message.success('申请已提交，平台正在处理')
        setCreateModal(false)
        form.resetFields()
        setOrderInfo(null)
        loadList()
      }
    } catch (e) {
      message.error('提交失败')
    }
  }

  const handleSearch = () => {
    setPagination(p => ({ ...p, current: 1 }))
    loadList()
  }

  const typeMap = {
    address_change: { color: 'blue', text: '改址', icon: <EditOutlined /> },
    cancel: { color: 'orange', text: '取消', icon: <CloseOutlined /> },
    complaint: { color: 'red', text: '投诉', icon: <ExclamationCircleOutlined /> },
    refund: { color: 'purple', text: '退款', icon: <CustomerServiceOutlined /> }
  }

  const statusMap = {
    processing: { color: 'processing', text: '处理中' },
    accepted: { color: 'success', text: '已受理' },
    completed: { color: 'success', text: '已完成' },
    rejected: { color: 'error', text: '已拒绝' }
  }

  const columns = [
    {
      title: '售后单号',
      dataIndex: 'id',
      width: 100,
      render: (id) => <span style={{ fontFamily: 'monospace' }}>AS{id.toString().padStart(6, '0')}</span>
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (type) => {
        const info = typeMap[type] || {}
        return <Tag color={info.color} icon={info.icon}>{info.text || type}</Tag>
      }
    },
    { title: '关联订单', dataIndex: 'order_no', width: 150, render: t => <span style={{ fontFamily: 'monospace' }}>{t}</span> },
    { title: '承运平台', dataIndex: 'platform_name', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        const info = statusMap[status] || {}
        return <Tag color={info.color}>{info.text || status}</Tag>
      }
    },
    {
      title: '平台响应',
      dataIndex: 'platform_ack',
      width: 100,
      render: (ack) => ack ? 
        <span style={{ color: '#52c41a' }}><CheckCircleOutlined /> 已响应</span> :
        <span style={{ color: '#faad14' }}><ClockCircleOutlined /> 待响应</span>
    },
    { title: '申请原因', dataIndex: 'reason', ellipsis: true },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      width: 160,
      render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'processing' && (
            <Button type="link" size="small" onClick={() => handleAccept(record.id)}>
              受理
            </Button>
          )}
          {record.status === 'accepted' && (
            <>
              <Button type="link" size="small" onClick={() => handleComplete(record)}>
                完成
              </Button>
              <Button type="link" size="small" danger onClick={() => handleReject(record)}>
                拒绝
              </Button>
            </>
          )}
        </Space>
      )
    }
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record) => ({
      disabled: record.status === 'completed' || record.status === 'rejected'
    })
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">售后协同中心</h2>
        <Space>
          <Button icon={<SyncOutlined />} onClick={loadList}>刷新</Button>
          <Button type="primary" icon={<CustomerServiceOutlined />} onClick={() => setCreateModal(true)}>
            发起售后
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="待处理售后"
              value={stats?.pending_count || 0}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="处理中"
              value={stats?.processing_count || 0}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="本月已完成"
              value={stats?.completed_count || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="投诉率"
              value={stats?.complaint_rate || 0}
              suffix="%"
              precision={2}
              prefix={<MessageOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {selectedRowKeys.length > 0 && (
        <Alert
          message={
            <Space>
              <span>已选择 <b>{selectedRowKeys.length}</b> 条售后单</span>
              <Button size="small" type="primary" icon={<CheckSquareOutlined />} onClick={handleBatchAccept}>
                批量受理
              </Button>
              <Button size="small" icon={<FileDoneOutlined />} onClick={handleBatchComplete}>
                批量完成
              </Button>
              <Button size="small" danger onClick={handleBatchReject}>
                批量拒绝
              </Button>
              <Button size="small" onClick={() => setSelectedRowKeys([])}>
                取消选择
              </Button>
            </Space>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div className="filter-bar">
        <Select
          placeholder="售后类型"
          style={{ width: 140 }}
          allowClear
          value={filters.type || undefined}
          onChange={v => setFilters(f => ({ ...f, type: v || '' }))}
        >
          <Option value="address_change">改址</Option>
          <Option value="cancel">取消</Option>
          <Option value="complaint">投诉</Option>
          <Option value="refund">退款</Option>
        </Select>
        <Select
          placeholder="处理状态"
          style={{ width: 140 }}
          allowClear
          value={filters.status || undefined}
          onChange={v => setFilters(f => ({ ...f, status: v || '' }))}
        >
          <Option value="processing">处理中</Option>
          <Option value="accepted">已受理</Option>
          <Option value="completed">已完成</Option>
          <Option value="rejected">已拒绝</Option>
        </Select>
        <Button type="primary" onClick={handleSearch}>查询</Button>
      </div>

      <Table
        dataSource={list}
        columns={columns}
        rowKey="id"
        rowSelection={rowSelection}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: total => `共 ${total} 条`
        }}
        onChange={(page, pageSize) => setPagination(p => ({ ...p, current: page, pageSize }))}
      />

      <Modal
        title="发起售后申请"
        open={createModal}
        onCancel={() => { setCreateModal(false); form.resetFields(); setOrderInfo(null) }}
        width={600}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="order_id" label="关联订单" rules={[{ required: true, message: '请输入订单号' }]}>
            <Input placeholder="请输入订单号" />
          </Form.Item>
          <Form.Item name="type" label="售后类型" rules={[{ required: true }]} initialValue="complaint">
            <Radio.Group>
              <Radio value="address_change">改址</Radio>
              <Radio value="cancel">取消</Radio>
              <Radio value="complaint">投诉</Radio>
              <Radio value="refund">退款</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
            {({ getFieldValue }) => {
              const type = getFieldValue('type')
              if (type === 'address_change') {
                return (
                  <Form.Item name="new_address" label="新地址" rules={[{ required: true, message: '请输入新地址' }]}>
                    <TextArea rows={3} placeholder="请输入新的配送地址" />
                  </Form.Item>
                )
              }
              return null
            }}
          </Form.Item>
          <Form.Item name="reason" label="原因说明" rules={[{ required: true, message: '请输入原因' }]}>
            <TextArea rows={4} placeholder="请详细说明原因" />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setCreateModal(false)} style={{ marginRight: 8 }}>取消</Button>
            <Button type="primary" htmlType="submit">提交申请</Button>
          </div>
        </Form>
      </Modal>

      <Drawer
        title="售后详情"
        placement="right"
        width={480}
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
      >
        {currentItem && (
          <div>
            <Descriptions title="售后信息" column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="售后单号">
                AS{currentItem.id?.toString().padStart(6, '0')}
              </Descriptions.Item>
              <Descriptions.Item label="关联订单">
                <span style={{ fontFamily: 'monospace' }}>{currentItem.order_no}</span>
              </Descriptions.Item>
              <Descriptions.Item label="售后类型">
                {typeMap[currentItem.type]?.text || currentItem.type}
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color={statusMap[currentItem.status]?.color}>
                  {statusMap[currentItem.status]?.text || currentItem.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="平台响应">
                {currentItem.platform_ack ? '已响应' : '待响应'}
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">
                {dayjs(currentItem.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="原因说明" column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="原因">{currentItem.reason || '-'}</Descriptions.Item>
              {currentItem.new_address && (
                <Descriptions.Item label="新地址">{currentItem.new_address}</Descriptions.Item>
              )}
            </Descriptions>

            {currentItem.result && (
              <Descriptions title="处理结果" column={1} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="结果">{currentItem.result}</Descriptions.Item>
              </Descriptions>
            )}

            {orderInfo && (
              <Descriptions title="订单信息" column={1} size="small">
                <Descriptions.Item label="承运平台">{currentItem.platform_name}</Descriptions.Item>
                <Descriptions.Item label="收件人">{orderInfo.receiver_name}</Descriptions.Item>
                <Descriptions.Item label="收件电话">{orderInfo.receiver_phone}</Descriptions.Item>
                <Descriptions.Item label="原地址">{orderInfo.receiver_address}</Descriptions.Item>
                <Descriptions.Item label="订单金额">¥{orderInfo.total_fee?.toFixed(2)}</Descriptions.Item>
              </Descriptions>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title={replyType === 'complete' ? '处理完成' : '拒绝申请'}
        open={replyModal}
        onCancel={() => setReplyModal(false)}
        footer={null}
        width={500}
        destroyOnHidden
      >
        <Form form={replyForm} layout="vertical" onFinish={submitReply}>
          <Form.Item name="reply" label={replyType === 'complete' ? '处理结果说明' : '拒绝原因'} rules={[{ required: true }]}>
            <TextArea rows={4} placeholder={replyType === 'complete' ? '请描述处理结果' : '请说明拒绝原因'} />
          </Form.Item>
          {replyType === 'complete' && (
            <Form.Item name="compensation" label="赔付金额(元)">
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="如需赔付，请输入赔付金额" />
            </Form.Item>
          )}
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setReplyModal(false)} style={{ marginRight: 8 }}>取消</Button>
            <Button type={replyType === 'complete' ? 'primary' : 'primary'} danger={replyType === 'reject'} htmlType="submit">
              {replyType === 'complete' ? '确认完成' : '确认拒绝'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default AfterSales
