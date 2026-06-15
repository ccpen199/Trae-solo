import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Avatar,
  Input,
  Select,
  Button,
  Space,
  Tabs,
  List,
  Modal,
  Form,
  Switch,
  Slider,
  Drawer,
  Descriptions,
  Timeline
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  PlusOutlined,
  SettingOutlined,
  EyeOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'

const { Option } = Select

const UserProfileManagement: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [tagModalVisible, setTagModalVisible] = useState(false)
  const [ruleModalVisible, setRuleModalVisible] = useState(false)

  const userList = [
    {
      id: 1,
      name: '张三',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
      age: 32,
      gender: '男',
      tags: ['高活跃用户', '政务服务偏好', '社保关注', '有车一族', '已婚'],
      lastActive: '10分钟前',
      dataAssets: 28
    },
    {
      id: 2,
      name: '李四',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
      age: 28,
      gender: '女',
      tags: ['新用户', '教育关注', '医疗关注', '租房'],
      lastActive: '30分钟前',
      dataAssets: 15
    },
    {
      id: 3,
      name: '王五',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
      age: 45,
      gender: '男',
      tags: ['高价值用户', '企业主', '税务关注', '有房有车'],
      lastActive: '1小时前',
      dataAssets: 42
    },
    {
      id: 4,
      name: '赵六',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
      age: 58,
      gender: '男',
      tags: ['老年用户', '养老关注', '医保关注', '低活跃'],
      lastActive: '2小时前',
      dataAssets: 18
    },
    {
      id: 5,
      name: '钱七',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
      age: 25,
      gender: '女',
      tags: ['年轻用户', '教育关注', '交通出行', '高活跃'],
      lastActive: '5分钟前',
      dataAssets: 22
    },
    {
      id: 6,
      name: '孙八',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6',
      age: 38,
      gender: '女',
      tags: ['宝妈', '教育关注', '医疗关注', '住房关注'],
      lastActive: '3小时前',
      dataAssets: 35
    }
  ]

  const tagCategories = {
    basic: [
      { name: '性别男', count: 45680, color: 'blue' },
      { name: '性别女', count: 38920, color: 'pink' },
      { name: '18-25岁', count: 15680, color: 'green' },
      { name: '26-35岁', count: 28960, color: 'cyan' },
      { name: '36-45岁', count: 22340, color: 'geekblue' },
      { name: '46-55岁', count: 12580, color: 'purple' },
      { name: '55岁以上', count: 8920, color: 'magenta' },
      { name: '已婚', count: 52680, color: 'gold' },
      { name: '未婚', count: 31920, color: 'volcano' }
    ],
    behavior: [
      { name: '高活跃用户', count: 18920, color: 'red' },
      { name: '中活跃用户', count: 35680, color: 'orange' },
      { name: '低活跃用户', count: 28560, color: 'default' },
      { name: '新用户', count: 8920, color: 'green' },
      { name: '流失预警', count: 3260, color: 'red' },
      { name: '工作日活跃', count: 42360, color: 'blue' },
      { name: '周末活跃', count: 28920, color: 'purple' },
      { name: '夜间活跃', count: 15680, color: 'geekblue' }
    ],
    preference: [
      { name: '政务服务偏好', count: 28960, color: 'blue' },
      { name: '社保关注', count: 35680, color: 'green' },
      { name: '医保关注', count: 32180, color: 'red' },
      { name: '住房关注', count: 25680, color: 'orange' },
      { name: '教育关注', count: 22340, color: 'purple' },
      { name: '交通出行', count: 28920, color: 'cyan' },
      { name: '税务关注', count: 18560, color: 'gold' },
      { name: '企业服务', count: 12380, color: 'geekblue' }
    ]
  }

  const autoTagRules = [
    { id: 1, name: '高活跃用户标签', condition: '近30天登录天数>20天', tag: '高活跃用户', enabled: true },
    { id: 2, name: '新用户标签', condition: '注册时间<7天', tag: '新用户', enabled: true },
    { id: 3, name: '老年用户标签', condition: '年龄>55岁', tag: '老年用户', enabled: true },
    { id: 4, name: '社保关注标签', condition: '近90天访问社保服务>3次', tag: '社保关注', enabled: true },
    { id: 5, name: '流失预警标签', condition: '连续15天未登录', tag: '流失预警', enabled: true },
    { id: 6, name: '企业主标签', condition: '名下有企业且为法人', tag: '企业主', enabled: false }
  ]

  const userBehaviorTrail = [
    { time: '2024-06-15 14:30', action: '查询社保缴费记录', type: '查询' },
    { time: '2024-06-15 10:20', action: '办理公积金提取', type: '办理' },
    { time: '2024-06-14 16:45', action: '查看医保账户余额', type: '查询' },
    { time: '2024-06-14 09:15', action: '申请身份证补办', type: '办理' },
    { time: '2024-06-13 11:30', action: '查看驾驶证信息', type: '查询' },
    { time: '2024-06-12 15:00', action: '缴纳交通罚款', type: '办理' }
  ]

  const columns = [
    {
      title: '用户',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar src={record.avatar} icon={<UserOutlined />} style={{ marginRight: 12 }} />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#999' }}>
              {record.gender} · {record.age}岁
            </div>
          </div>
        </div>
      )
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <>
          {tags.slice(0, 3).map((tag) => (
            <Tag color="blue" key={tag} style={{ marginBottom: 4 }}>
              {tag}
            </Tag>
          ))}
          {tags.length > 3 && <Tag>+{tags.length - 3}</Tag>}
        </>
      )
    },
    {
      title: '数据资产数',
      dataIndex: 'dataAssets',
      key: 'dataAssets',
      sorter: (a: any, b: any) => a.dataAssets - b.dataAssets
    },
    {
      title: '最近活跃',
      dataIndex: 'lastActive',
      key: 'lastActive'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => viewUserDetail(record)}>
            查看画像
          </Button>
          <Button type="link" size="small" icon={<SettingOutlined />}>
            标签管理
          </Button>
        </Space>
      )
    }
  ]

  const viewUserDetail = (user: any) => {
    setSelectedUser(user)
    setDrawerVisible(true)
  }

  const tagCloudData = [
    { name: '高活跃用户', weight: 100, color: 'red' },
    { name: '政务服务偏好', weight: 90, color: 'blue' },
    { name: '社保关注', weight: 85, color: 'green' },
    { name: '公积金关注', weight: 80, color: 'orange' },
    { name: '工作日活跃', weight: 75, color: 'purple' },
    { name: '医疗关注', weight: 72, color: 'magenta' },
    { name: '有车一族', weight: 70, color: 'cyan' },
    { name: '已婚', weight: 65, color: 'gold' },
    { name: '36-45岁', weight: 60, color: 'geekblue' },
    { name: '男性', weight: 55, color: 'blue' },
    { name: '教育关注', weight: 58, color: 'purple' },
    { name: '税务关注', weight: 45, color: 'orange' }
  ]

  const tagDistributionOption = {
    title: {
      text: '标签数量分布',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['0-5个', '6-10个', '11-15个', '16-20个', '20个以上']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '用户数',
        type: 'bar',
        data: [12580, 28960, 32180, 18560, 8920],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#0958d9' },
              { offset: 1, color: '#69b1ff' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '50%'
      }
    ]
  }

  const tagTabItems = [
    {
      key: 'basic',
      label: '基础属性标签',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setTagModalVisible(true)}>
              新增标签
            </Button>
          </div>
          <Row gutter={[16, 16]}>
            {tagCategories.basic.map((tag, index) => (
              <Col xs={12} sm={8} md={6} key={index}>
                <Card size="small" hoverable>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag color={tag.color}>{tag.name}</Tag>
                    <span style={{ fontSize: 12, color: '#999' }}>{tag.count}人</span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )
    },
    {
      key: 'behavior',
      label: '行为标签',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setTagModalVisible(true)}>
              新增标签
            </Button>
          </div>
          <Row gutter={[16, 16]}>
            {tagCategories.behavior.map((tag, index) => (
              <Col xs={12} sm={8} md={6} key={index}>
                <Card size="small" hoverable>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag color={tag.color}>{tag.name}</Tag>
                    <span style={{ fontSize: 12, color: '#999' }}>{tag.count}人</span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )
    },
    {
      key: 'preference',
      label: '偏好标签',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setTagModalVisible(true)}>
              新增标签
            </Button>
          </div>
          <Row gutter={[16, 16]}>
            {tagCategories.preference.map((tag, index) => (
              <Col xs={12} sm={8} md={6} key={index}>
                <Card size="small" hoverable>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag color={tag.color}>{tag.name}</Tag>
                    <span style={{ fontSize: 12, color: '#999' }}>{tag.count}人</span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )
    }
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            title="用户列表"
            extra={
              <Space>
                <Input
                  placeholder="搜索用户"
                  prefix={<SearchOutlined />}
                  style={{ width: 200 }}
                />
                <Select placeholder="按标签筛选" style={{ width: 150 }} allowClear>
                  <Option value="high">高活跃用户</Option>
                  <Option value="new">新用户</Option>
                  <Option value="old">老年用户</Option>
                </Select>
                <Button icon={<FilterOutlined />}>筛选</Button>
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={userList}
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card>
            <ReactECharts option={tagDistributionOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="标签体系管理" style={{ marginBottom: 16 }}>
        <Tabs items={tagTabItems} />
      </Card>

      <Card
        title="自动打标签规则配置"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setRuleModalVisible(true)}>
            新增规则
          </Button>
        }
      >
        <List
          dataSource={autoTagRules}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              actions={[
                <Button type="link" size="small">编辑</Button>,
                <Button type="link" size="small" danger>删除</Button>
              ]}
            >
              <List.Item.Meta
                title={item.name}
                description={
                  <Space>
                    <span style={{ color: '#666' }}>条件：{item.condition}</span>
                    <Tag color="blue">{item.tag}</Tag>
                  </Space>
                }
              />
              <Switch checked={item.enabled} />
            </List.Item>
          )}
        />
      </Card>

      <Drawer
        title="用户画像详情"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedUser && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
              <Avatar size={64} src={selectedUser.avatar} icon={<UserOutlined />} />
              <div style={{ marginLeft: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 500 }}>{selectedUser.name}</div>
                <div style={{ color: '#666' }}>
                  {selectedUser.gender} · {selectedUser.age}岁 · 数据资产 {selectedUser.dataAssets} 项
                </div>
              </div>
            </div>

            <Card title="标签云" size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {tagCloudData.map((tag, index) => (
                  <Tag
                    key={index}
                    color={tag.color}
                    style={{
                      fontSize: 12 + (tag.weight / 100) * 10,
                      padding: '4px 12px'
                    }}
                  >
                    {tag.name}
                  </Tag>
                ))}
              </div>
            </Card>

            <Card title="属性详情" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="用户ID">{selectedUser.id}</Descriptions.Item>
                <Descriptions.Item label="注册时间">2023-06-15</Descriptions.Item>
                <Descriptions.Item label="年龄">{selectedUser.age}岁</Descriptions.Item>
                <Descriptions.Item label="性别">{selectedUser.gender}</Descriptions.Item>
                <Descriptions.Item label="婚姻状况">已婚</Descriptions.Item>
                <Descriptions.Item label="学历">本科</Descriptions.Item>
                <Descriptions.Item label="职业">企业员工</Descriptions.Item>
                <Descriptions.Item label="所在地区">银川市兴庆区</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="行为轨迹" size="small">
              <Timeline
                items={userBehaviorTrail.map((item) => ({
                  color: item.type === '办理' ? 'blue' : 'green',
                  children: (
                    <div>
                      <div>{item.action}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>{item.time}</div>
                    </div>
                  )
                }))}
              />
            </Card>
          </div>
        )}
      </Drawer>

      <Modal
        title="新增标签"
        open={tagModalVisible}
        onCancel={() => setTagModalVisible(false)}
        onOk={() => setTagModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="标签名称" required>
            <Input placeholder="请输入标签名称" />
          </Form.Item>
          <Form.Item label="标签分类" required>
            <Select placeholder="请选择标签分类">
              <Option value="basic">基础属性标签</Option>
              <Option value="behavior">行为标签</Option>
              <Option value="preference">偏好标签</Option>
            </Select>
          </Form.Item>
          <Form.Item label="标签颜色">
            <Select placeholder="请选择标签颜色">
              <Option value="blue">蓝色</Option>
              <Option value="green">绿色</Option>
              <Option value="red">红色</Option>
              <Option value="orange">橙色</Option>
              <Option value="purple">紫色</Option>
            </Select>
          </Form.Item>
          <Form.Item label="标签描述">
            <Input.TextArea rows={3} placeholder="请输入标签描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增自动打标签规则"
        open={ruleModalVisible}
        onCancel={() => setRuleModalVisible(false)}
        onOk={() => setRuleModalVisible(false)}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="规则名称" required>
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Form.Item label="目标标签" required>
            <Select placeholder="请选择目标标签">
              <Option value="high">高活跃用户</Option>
              <Option value="new">新用户</Option>
              <Option value="old">老年用户</Option>
            </Select>
          </Form.Item>
          <Form.Item label="规则条件" required>
            <Input.TextArea rows={4} placeholder="请输入规则条件，如：近30天登录天数>20天" />
          </Form.Item>
          <Form.Item label="规则权重">
            <Slider min={0} max={100} defaultValue={50} />
          </Form.Item>
          <Form.Item label="启用规则" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserProfileManagement
