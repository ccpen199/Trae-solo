import { useState } from 'react'
import { Table, Card, Button, Space, Input, Select, Tag, Modal, Form, message, Drawer, Avatar, Descriptions } from 'antd'
import { SearchOutlined, UserOutlined, TagOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { UserProfile } from '@/types'
import { formatDateTime, formatMoney, formatEnergy } from '@/utils'

const levelMap: Record<string, { color: string; text: string }> = {
  normal: { color: 'default', text: '普通会员' },
  silver: { color: 'blue', text: '银卡会员' },
  gold: { color: 'gold', text: '金卡会员' },
  platinum: { color: 'purple', text: '铂金会员' },
  diamond: { color: 'magenta', text: '钻石会员' }
}

const allTags = ['高频用户', '夜间充电', '快充偏好', '慢充偏好', '通勤用户', '周末用户', '高消费', '新用户', '活跃用户', '流失预警']

const mockData: UserProfile[] = [
  { id: '1', username: '张三', phone: '138****0001', level: 'gold', totalCharges: 156, totalEnergy: 2580.5, totalAmount: 3870.75, tags: ['高频用户', '快充偏好', '通勤用户'], registerTime: '2023-06-15 10:30:00' },
  { id: '2', username: '李四', phone: '139****0002', level: 'silver', totalCharges: 45, totalEnergy: 680.2, totalAmount: 1020.3, tags: ['新用户', '慢充偏好'], registerTime: '2024-03-20 14:15:00' },
  { id: '3', username: '王五', phone: '137****0003', level: 'platinum', totalCharges: 320, totalEnergy: 5240.8, totalAmount: 7861.2, tags: ['高频用户', '夜间充电', '高消费', '活跃用户'], registerTime: '2023-01-10 09:00:00' },
  { id: '4', username: '赵六', phone: '136****0004', level: 'normal', totalCharges: 12, totalEnergy: 156.3, totalAmount: 234.45, tags: ['新用户', '周末用户'], registerTime: '2024-05-01 16:45:00' },
  { id: '5', username: '钱七', phone: '135****0005', level: 'diamond', totalCharges: 580, totalEnergy: 9850.0, totalAmount: 14775.0, tags: ['高频用户', '快充偏好', '高消费', '活跃用户', '通勤用户'], registerTime: '2022-08-20 11:20:00' }
]

function User() {
  const [data, setData] = useState<UserProfile[]>(mockData)
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [tagModalVisible, setTagModalVisible] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [form] = Form.useForm()
  const [keyword, setKeyword] = useState('')
  const [level, setLevel] = useState<string | undefined>()
  const [tagFilter, setTagFilter] = useState<string | undefined>()

  const columns: ColumnsType<UserProfile> = [
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={record.avatar} />
          <span>{record.username}</span>
        </Space>
      )
    },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    {
      title: '会员等级',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => {
      const info = levelMap[level]
      return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    { title: '充电次数', dataIndex: 'totalCharges', key: 'totalCharges' },
    { title: '累计充电量', dataIndex: 'totalEnergy', key: 'totalEnergy', render: (e) => formatEnergy(e) },
    { title: '累计消费', dataIndex: 'totalAmount', key: 'totalAmount', render: (a) => formatMoney(a) },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <>
          {tags.slice(0, 3).map((tag) => (
            <Tag key={tag} color="blue">
            {tag}
            </Tag>
          ))}
          {tags.length > 3 && <Tag>+{tags.length - 3}</Tag>}
        </>
      )
    },
    { title: '注册时间', dataIndex: 'registerTime', key: 'registerTime', render: (t) => formatDateTime(t) },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<TagOutlined />} onClick={() => handleEditTags(record)}>
            标签
          </Button>
        </Space>
      )
    }
  ]

  const handleSearch = () => {
    setLoading(true)
    setTimeout(() => {
      let filtered = mockData
      if (keyword) {
        filtered = filtered.filter(
          (item) => item.username.includes(keyword) || item.phone.includes(keyword)
        )
      }
      if (level) {
        filtered = filtered.filter((item) => item.level === level)
      }
      if (tagFilter) {
        filtered = filtered.filter((item) => item.tags.includes(tagFilter))
      }
      setData(filtered)
      setLoading(false)
    }, 300)
  }

  const handleView = (record: UserProfile) => {
    setCurrentUser(record)
    setDetailVisible(true)
  }

  const handleEditTags = (record: UserProfile) => {
    setCurrentUser(record)
    setSelectedTags([...record.tags])
    setTagModalVisible(true)
  }

  const handleSaveTags = () => {
    if (currentUser) {
      setData(
        data.map((item) =>
          item.id === currentUser.id ? { ...item, tags: selectedTags } : item
        )
      )
      message.success('标签更新成功')
      setTagModalVisible(false)
    }
  }

  const statistics = {
    total: data.length,
    active: Math.floor(data.length * 0.6),
    newThisMonth: 128
  }

  return (
    <div>
      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索用户名/手机号"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="会员等级"
            style={{ width: 150 }}
            allowClear
            value={level}
            onChange={setLevel}
            options={[
              { value: 'normal', label: '普通会员' },
              { value: 'silver', label: '银卡会员' },
              { value: 'gold', label: '金卡会员' },
              { value: 'platinum', label: '铂金会员' },
              { value: 'diamond', label: '钻石会员' }
            ]}
          />
          <Select
            placeholder="用户标签"
            style={{ width: 150 }}
            allowClear
            value={tagFilter}
            onChange={setTagFilter}
            options={allTags.map((tag) => ({ value: tag, label: tag }))}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
        </Space>

        <Space style={{ marginBottom: 16 }}>
          <span>总用户数: <b>{statistics.total}</b></span>
          <span>活跃用户: <b style={{ color: '#52c41a' }}>{statistics.active}</b></span>
          <span>本月新增: <b style={{ color: '#1890ff' }}>{statistics.newThisMonth}</b></span>
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

      <Drawer
        title="用户详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentUser && (
          <div>
            <Space style={{ marginBottom: 24 }}>
              <Avatar size={64} icon={<UserOutlined />} src={currentUser.avatar} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 'bold' }}>{currentUser.username}</div>
                <Tag color={levelMap[currentUser.level].color}>{levelMap[currentUser.level].text}</Tag>
              </div>
            </Space>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="手机号">{currentUser.phone}</Descriptions.Item>
              <Descriptions.Item label="充电次数">{currentUser.totalCharges} 次</Descriptions.Item>
              <Descriptions.Item label="累计充电量">{formatEnergy(currentUser.totalEnergy)}</Descriptions.Item>
              <Descriptions.Item label="累计消费">{formatMoney(currentUser.totalAmount)}</Descriptions.Item>
              <Descriptions.Item label="注册时间">{formatDateTime(currentUser.registerTime)}</Descriptions.Item>
              <Descriptions.Item label="用户标签">
                {currentUser.tags.map((tag) => (
                  <Tag key={tag} color="blue">{tag}</Tag>
                ))}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>

      <Modal
        title="编辑用户标签"
        open={tagModalVisible}
        onOk={handleSaveTags}
        onCancel={() => setTagModalVisible(false)}
        width={500}
      >
        <div>
          <p style={{ marginBottom: 12 }}>选择用户标签:</p>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="请选择标签"
            value={selectedTags}
            onChange={setSelectedTags}
            options={allTags.map((tag) => ({ value: tag, label: tag }))}
          />
        </div>
      </Modal>
    </div>
  )
}

export default User
