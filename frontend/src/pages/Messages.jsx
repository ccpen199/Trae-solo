import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  List,
  Tag,
  Button,
  Select,
  Space,
  message,
  Empty,
  Badge,
} from 'antd'
import { EyeOutlined, BellOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { commonApi } from '../services/api'
import { formatDate, getNodeName, getRoleName } from '../utils/constants'
import { useAppStore } from '../store'

const MESSAGE_TYPES = {
  WORKFLOW_TRANSITION: '流程流转',
  TODO_ASSIGNED: '待办分配',
  KYC_ALERT: 'KYC提醒',
  EXCEPTION: '异常通知',
  SETTLEMENT: '结算通知',
  SYSTEM: '系统通知',
}

const MESSAGE_TYPE_COLORS = {
  WORKFLOW_TRANSITION: 'blue',
  TODO_ASSIGNED: 'orange',
  KYC_ALERT: 'purple',
  EXCEPTION: 'red',
  SETTLEMENT: 'green',
  SYSTEM: 'default',
}

function MessageList() {
  const navigate = useNavigate()
  const decrementUnread = useAppStore((state) => state.decrementUnread)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [filters, setFilters] = useState({
    type: undefined,
    is_read: undefined,
  })

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize, filters])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        ...filters,
      }

      const res = await commonApi.getMessages(params)
      if (res.data.success) {
        setData(res.data.data.messages || [])
        setPagination((prev) => ({
          ...prev,
          total: res.data.data.pagination?.total || 0,
        }))
      }
    } catch (err) {
      console.error('Load messages error:', err)
      message.error('加载消息列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (id) => {
    try {
      const res = await commonApi.markMessageRead(id)
      if (res.data.success) {
        message.success('已标记为已读')
        loadData()
        decrementUnread()
      }
    } catch (err) {
      console.error('Mark message read error:', err)
      message.error('操作失败')
    }
  }

  const typeOptions = Object.entries(MESSAGE_TYPES).map(([key, value]) => ({
    label: value,
    value: key,
  }))

  const readOptions = [
    { label: '全部', value: undefined },
    { label: '未读', value: false },
    { label: '已读', value: true },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">消息通知</div>
        <div className="page-desc">查看系统消息和通知</div>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space wrap size="middle">
          <Select
            placeholder="消息类型"
            style={{ width: 160 }}
            allowClear
            value={filters.type}
            onChange={(val) => {
              setFilters((prev) => ({ ...prev, type: val }))
              setPagination((prev) => ({ ...prev, current: 1 }))
            }}
            options={typeOptions}
          />
          <Select
            placeholder="已读状态"
            style={{ width: 160 }}
            allowClear
            value={filters.is_read !== undefined ? filters.is_read : undefined}
            onChange={(val) => {
              setFilters((prev) => ({ ...prev, is_read: val }))
              setPagination((prev) => ({ ...prev, current: 1 }))
            }}
            options={readOptions}
          />
        </Space>
      </Card>

      <Card>
        <List
          loading={loading}
          dataSource={data}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无消息"
              />
            ),
          }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, current: page, pageSize }))
            },
          }}
          renderItem={(item) => (
            <List.Item
              actions={[
                !item.is_read && (
                  <Button
                    type="link"
                    icon={<CheckCircleOutlined />}
                    size="small"
                    onClick={() => handleMarkRead(item.id)}
                  >
                    标为已读
                  </Button>
                ),
                item.transaction_id && (
                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    size="small"
                    onClick={() => navigate(`/transactions/${item.transaction_id}`)}
                  >
                    查看交易
                  </Button>
                ),
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Badge dot={!item.is_read} offset={[5, 5]}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: item.is_read ? '#f0f0f0' : '#e6f7ff',
                        color: item.is_read ? '#999' : '#1890ff',
                      }}
                    >
                      <BellOutlined style={{ fontSize: 20 }} />
                    </div>
                  </Badge>
                }
                title={
                  <Space>
                    <span style={{ fontWeight: item.is_read ? 400 : 600 }}>
                      {item.title}
                    </span>
                    <Tag color={MESSAGE_TYPE_COLORS[item.type] || 'default'}>
                      {MESSAGE_TYPES[item.type] || item.type}
                    </Tag>
                  </Space>
                }
                description={
                  <div style={{ color: '#666', fontSize: 13 }}>
                    <div style={{ marginBottom: 4 }}>{item.content}</div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      {item.transaction_order_no && (
                        <span>
                          关联交易:{' '}
                          <span style={{ color: '#1890ff', cursor: 'pointer' }}>
                            {item.transaction_order_no}
                          </span>
                        </span>
                      )}
                      {item.related_node && (
                        <span>关联节点: {getNodeName(item.related_node)}</span>
                      )}
                      {item.target_role && (
                        <span>目标角色: {getRoleName(item.target_role)}</span>
                      )}
                      <span>时间: {formatDate(item.created_at)}</span>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}

export default MessageList
