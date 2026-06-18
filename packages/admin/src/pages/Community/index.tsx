import { useState } from 'react'
import { Table, Card, Button, Space, Input, Select, Tag, Modal, message, Tabs, Avatar, Descriptions } from 'antd'
import { SearchOutlined, CheckOutlined, CloseOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime } from '@/utils'

interface ContentItem {
  id: string
  title: string
  author: string
  type: 'post' | 'comment'
  status: 'pending' | 'approved' | 'rejected'
  createTime: string
  content?: string
}

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待审核' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已拒绝' }
}

const typeMap: Record<string, { color: string; text: string }> = {
  post: { color: 'blue', text: '帖子' },
  comment: { color: 'purple', text: '评论' }
}

const mockContentData: ContentItem[] = [
  { id: '1', title: '分享一下浦东充电站体验', author: '张三', type: 'post', status: 'pending', createTime: '2024-06-18 10:30:00', content: '今天去了浦东充电站，充电速度很快，环境也不错，推荐给大家。' },
  { id: '2', title: '求推荐性价比高的充电站', author: '李四', type: 'post', status: 'approved', createTime: '2024-06-18 09:15:00', content: '大家有没有性价比高的充电站推荐一下，最好在徐汇附近的。' },
  { id: '3', title: '关于充电费用疑问', author: '王五', type: 'comment', status: 'pending', createTime: '2024-06-18 08:45:00', content: '请问现在充电费用是怎么算的？' },
  { id: '4', title: '充电桩故障问题', author: '赵六', type: 'post', status: 'rejected', createTime: '2024-06-17 16:20:00', content: '虹桥充电站的充电桩经常故障，希望能修一下。' },
  { id: '5', title: '回复：分享一下浦东充电站体验', author: '钱七', type: 'comment', status: 'approved', createTime: '2024-06-17 14:10:00', content: '我也去过，确实不错' }
]

function Community() {
  const [data, setData] = useState<ContentItem[]>(mockContentData)
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentContent, setCurrentContent] = useState<ContentItem | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<string | undefined>()
  const [type, setType] = useState<string | undefined>()
  const [rejectVisible, setRejectVisible] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectId, setRejectId] = useState<string | null>(null)

  const columns: ColumnsType<ContentItem> = [
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '作者', dataIndex: 'author', key: 'author' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const info = typeMap[type]
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status]
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    { title: '发布时间', dataIndex: 'createTime', key: 'createTime', render: (t) => formatDateTime(t) },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          {record.status === 'pending' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>
                通过
              </Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => handleReject(record)}>
                拒绝
              </Button>
            </>
          )}
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      )
    }
  ]

  const handleSearch = () => {
    setLoading(true)
    setTimeout(() => {
      let filtered = mockContentData
      if (activeTab !== 'all') {
        filtered = filtered.filter((item) => item.status === activeTab)
      }
      if (keyword) {
        filtered = filtered.filter(
          (item) => item.title.includes(keyword) || item.author.includes(keyword)
        )
      }
      if (status) {
        filtered = filtered.filter((item) => item.status === status)
      }
      if (type) {
        filtered = filtered.filter((item) => item.type === type)
      }
      setData(filtered)
      setLoading(false)
    }, 300)
  }

  const handleView = (record: ContentItem) => {
    setCurrentContent(record)
    setDetailVisible(true)
  }

  const handleApprove = (record: ContentItem) => {
    Modal.confirm({
      title: '确认通过',
      content: `确定通过"${record.title}"的审核吗？`,
      onOk: () => {
        setData(data.map((item) => (item.id === record.id ? { ...item, status: 'approved' } : item)))
        message.success('审核通过')
      }
    })
  }

  const handleReject = (record: ContentItem) => {
    setRejectId(record.id)
    setRejectReason('')
    setRejectVisible(true)
  }

  const handleRejectSubmit = () => {
    if (rejectId) {
      setData(data.map((item) => (item.id === rejectId ? { ...item, status: 'rejected' } : item)))
      message.success('已拒绝')
      setRejectVisible(false)
    }
  }

  const handleDelete = (record: ContentItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除"${record.title}"吗？`,
      onOk: () => {
        setData(data.filter((item) => item.id !== record.id))
        message.success('删除成功')
      }
    })
  }

  const statistics = {
    total: mockContentData.length,
    pending: mockContentData.filter((item) => item.status === 'pending').length,
    approved: mockContentData.filter((item) => item.status === 'approved').length,
    rejected: mockContentData.filter((item) => item.status === 'rejected').length
  }

  const tabItems = [
    { key: 'all', label: `全部 (${statistics.total})` },
    { key: 'pending', label: `待审核 (${statistics.pending})` },
    { key: 'approved', label: `已通过 (${statistics.approved})` },
    { key: 'rejected', label: `已拒绝 (${statistics.rejected})` }
  ]

  return (
    <div>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key)
            setStatus(key === 'all' ? undefined : key)
          }}
          items={tabItems}
        />

        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索标题/作者"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="内容类型"
            style={{ width: 150 }}
            allowClear
            value={type}
            onChange={setType}
            options={[
              { value: 'post', label: '帖子' },
              { value: 'comment', label: '评论' }
            ]}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            total: data.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`
          }}
        />
      </Card>

      <Modal
        title="内容详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {currentContent && (
          <div>
            <h3>{currentContent.title}</h3>
            <Space style={{ marginBottom: 16 }}>
              <Avatar style={{ backgroundColor: '#1890ff' }}>{currentContent.author.charAt(0)}</Avatar>
              <Tag color={typeMap[currentContent.type].color}>{typeMap[currentContent.type].text}</Tag>
              <Tag color={statusMap[currentContent.status].color}>{statusMap[currentContent.status].text}</Tag>
              <span>{formatDateTime(currentContent.createTime)}</span>
            </Space>
            <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
              {currentContent.content}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="拒绝原因"
        open={rejectVisible}
        onOk={handleRejectSubmit}
        onCancel={() => setRejectVisible(false)}
      >
        <Input.TextArea
          rows={4}
          placeholder="请输入拒绝原因"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  )
}

export default Community
