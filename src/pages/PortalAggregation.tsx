import { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Tabs,
  Row,
  Col,
  Statistic,
  Badge,
  Rate,
  List,
  Avatar,
  message,
  Tooltip,
  Switch,
  Progress,
} from 'antd'
import {
  GlobalOutlined,
  PlusOutlined,
  SettingOutlined,
  StarOutlined,
  FireOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useAppStore } from '../store/appStore'

const { Title, Text } = Typography

interface PortalEntry {
  key: string
  name: string
  url: string
  serviceCount: number
  status: '已接入' | '待接入' | '维护中'
  health: number
  description: string
  contact: string
  lastSync: string
}

interface RecommendRule {
  key: string
  name: string
  condition: string
  recommendService: string
  priority: '高' | '中' | '低'
  enabled: boolean
}

interface AccessRecord {
  key: string
  rank: number
  serviceName: string
  province: string
  visits: number
  goodRate: number
}

const portalData: PortalEntry[] = [
  { key: '1', name: '北京市', url: 'https://zwfw.beijing.gov.cn', serviceCount: 1842, status: '已接入', health: 98, description: '北京市政务服务门户网站，提供市级及区级政务服务', contact: '张建国', lastSync: '2026-06-09 08:30:00' },
  { key: '2', name: '上海市', url: 'https://zwfw.shanghai.gov.cn', serviceCount: 1653, status: '已接入', health: 97, description: '上海市一网通办平台，涵盖全市政务服务事项', contact: '李明辉', lastSync: '2026-06-09 08:25:00' },
  { key: '3', name: '广东省', url: 'https://zwfw.gd.gov.cn', serviceCount: 2103, status: '已接入', health: 95, description: '广东省政务服务网，覆盖省本级及21个地市', contact: '王志强', lastSync: '2026-06-09 08:20:00' },
  { key: '4', name: '浙江省', url: 'https://zwfw.zj.gov.cn', serviceCount: 1928, status: '已接入', health: 99, description: '浙江省政务服务网，最多跑一次改革标杆', contact: '陈伟', lastSync: '2026-06-09 08:15:00' },
  { key: '5', name: '江苏省', url: 'https://zwfw.jiangsu.gov.cn', serviceCount: 1567, status: '已接入', health: 94, description: '江苏省政务服务门户，省市县三级联动', contact: '刘芳', lastSync: '2026-06-09 08:10:00' },
  { key: '6', name: '山东省', url: 'https://zwfw.shandong.gov.cn', serviceCount: 1432, status: '已接入', health: 91, description: '山东省政务服务门户，提供全省统一服务入口', contact: '赵磊', lastSync: '2026-06-09 07:55:00' },
  { key: '7', name: '四川省', url: 'https://zwfw.sc.gov.cn', serviceCount: 1289, status: '已接入', health: 88, description: '四川省政务服务网，天府通办平台', contact: '周敏', lastSync: '2026-06-09 07:50:00' },
  { key: '8', name: '湖北省', url: 'https://zwfw.hubei.gov.cn', serviceCount: 1156, status: '待接入', health: 0, description: '湖北省政务服务门户，部分功能对接中', contact: '吴刚', lastSync: '2026-06-08 22:00:00' },
  { key: '9', name: '河南省', url: 'https://zwfw.henan.gov.cn', serviceCount: 1098, status: '已接入', health: 86, description: '河南省政务服务门户，豫事办平台', contact: '孙丽', lastSync: '2026-06-09 07:30:00' },
  { key: '10', name: '福建省', url: 'https://zwfw.fujian.gov.cn', serviceCount: 987, status: '维护中', health: 72, description: '福建省政务服务门户，系统升级维护中', contact: '郑华', lastSync: '2026-06-08 18:00:00' },
  { key: '11', name: '陕西省', url: 'https://zwfw.shaanxi.gov.cn', serviceCount: 876, status: '已接入', health: 93, description: '陕西省政务服务门户，陕西政务服务网', contact: '马超', lastSync: '2026-06-09 07:20:00' },
  { key: '12', name: '湖南省', url: 'https://zwfw.hunan.gov.cn', serviceCount: 1025, status: '已接入', health: 90, description: '湖南省政务服务门户，一件事一次办', contact: '黄蓉', lastSync: '2026-06-09 07:15:00' },
]

const initialRecommendRules: RecommendRule[] = [
  { key: '1', name: '新开办企业推荐', condition: '新注册企业用户登录', recommendService: '企业开办一网通办、税务登记、社保开户', priority: '高', enabled: true },
  { key: '2', name: '退休人员服务推荐', condition: '用户年龄≥55岁且未退休', recommendService: '退休申请、养老金测算、医保转移', priority: '高', enabled: true },
  { key: '3', name: '高校毕业生推荐', condition: '年龄22-30岁且学历≥本科', recommendService: '就业登记、档案托管、租房补贴', priority: '中', enabled: true },
  { key: '4', name: '新生儿家庭推荐', condition: '近期有出生登记记录', recommendService: '出生医学证明、户口登记、医保参保', priority: '高', enabled: true },
  { key: '5', name: '购房业主推荐', condition: '近期有不动产登记记录', recommendService: '契税缴纳、水电气过户、居住证办理', priority: '中', enabled: false },
  { key: '6', name: '创业者推荐', condition: '持有营业执照且成立<1年', recommendService: '创业补贴、贷款申请、税务优惠', priority: '低', enabled: true },
]

const accessData: AccessRecord[] = [
  { key: '1', rank: 1, serviceName: '社保查询', province: '广东省', visits: 892341, goodRate: 4.8 },
  { key: '2', rank: 2, serviceName: '公积金提取', province: '浙江省', visits: 756128, goodRate: 4.7 },
  { key: '3', rank: 3, serviceName: '居住证办理', province: '北京市', visits: 623456, goodRate: 4.5 },
  { key: '4', rank: 4, serviceName: '不动产登记查询', province: '上海市', visits: 534219, goodRate: 4.6 },
  { key: '5', rank: 5, serviceName: '营业执照办理', province: '江苏省', visits: 487653, goodRate: 4.4 },
  { key: '6', rank: 6, serviceName: '医保报销', province: '四川省', visits: 412876, goodRate: 4.3 },
  { key: '7', rank: 7, serviceName: '户口迁移', province: '山东省', visits: 356912, goodRate: 4.2 },
  { key: '8', rank: 8, serviceName: '婚姻登记预约', province: '湖南省', visits: 298345, goodRate: 4.5 },
]

const statusColorMap: Record<string, string> = {
  '已接入': 'green',
  '待接入': 'orange',
  '维护中': 'red',
}

const priorityColorMap: Record<string, string> = {
  '高': 'red',
  '中': 'orange',
  '低': 'blue',
}

export default function PortalAggregation() {
  const addAuditEntry = useAppStore((s) => s.addAuditEntry)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentPortal, setCurrentPortal] = useState<PortalEntry | null>(null)
  const [recommendRules, setRecommendRules] = useState<RecommendRule[]>(initialRecommendRules)
  const [addRuleVisible, setAddRuleVisible] = useState(false)
  const [addRuleForm] = Form.useForm()

  const handlePortalClick = (portal: PortalEntry) => {
    setCurrentPortal(portal)
    setDetailVisible(true)
    addAuditEntry({
      operator: '管理员',
      module: '门户聚合引擎',
      action: '查看门户详情',
      detail: `查看${portal.name}政务服务门户详情`,
      result: 'success',
      ip: '10.0.1.100',
    })
  }

  const handleToggleRule = (rule: RecommendRule) => {
    const newEnabled = !rule.enabled
    setRecommendRules((prev) =>
      prev.map((r) => (r.key === rule.key ? { ...r, enabled: newEnabled } : r))
    )
    addAuditEntry({
      operator: '管理员',
      module: '门户聚合引擎',
      action: newEnabled ? '启用推荐规则' : '停用推荐规则',
      detail: `${newEnabled ? '启用' : '停用'}推荐规则：${rule.name}`,
      result: 'success',
      ip: '10.0.1.100',
    })
    message.success(`规则"${rule.name}"已${newEnabled ? '启用' : '停用'}`)
  }

  const handleAddRule = () => {
    addRuleForm.validateFields().then((values: Record<string, string>) => {
      const newRule: RecommendRule = {
        key: String(recommendRules.length + 1),
        name: values.name,
        condition: values.condition,
        recommendService: values.recommendService,
        priority: values.priority as '高' | '中' | '低',
        enabled: true,
      }
      setRecommendRules((prev) => [...prev, newRule])
      addAuditEntry({
        operator: '管理员',
        module: '门户聚合引擎',
        action: '新增推荐规则',
        detail: `新增推荐规则：${values.name}，优先级：${values.priority}`,
        result: 'success',
        ip: '10.0.1.100',
      })
      message.success('推荐规则添加成功')
      setAddRuleVisible(false)
      addRuleForm.resetFields()
    })
  }

  const handleAccessDetail = (record: AccessRecord) => {
    addAuditEntry({
      operator: '管理员',
      module: '门户聚合引擎',
      action: '查看访问详情',
      detail: `查看服务访问详情：${record.serviceName}（${record.province}）`,
      result: 'success',
      ip: '10.0.1.100',
    })
    message.info(`${record.serviceName}：日均访问${record.visits.toLocaleString()}次，好评率${record.goodRate}分`)
  }

  const renderPortalTab = () => (
    <Row gutter={[16, 16]}>
      {portalData.map((portal) => (
        <Col span={8} key={portal.key}>
          <Card
            hoverable
            size="small"
            onClick={() => handlePortalClick(portal)}
            extra={
              <Tag color={statusColorMap[portal.status]}>{portal.status}</Tag>
            }
          >
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space>
                <GlobalOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                <Text strong style={{ fontSize: 16 }}>{portal.name}政务服务网</Text>
              </Space>
              <Space size={4}>
                <LinkOutlined style={{ color: '#999' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>{portal.url}</Text>
              </Space>
              <Space size={16}>
                <Space size={4}>
                  <StarOutlined style={{ color: '#faad14' }} />
                  <Text>{portal.serviceCount} 项服务</Text>
                </Space>
              </Space>
              {portal.status !== '待接入' && (
                <div>
                  <Space size={4} style={{ marginBottom: 4 }}>
                    <CheckCircleOutlined style={{ color: portal.health >= 90 ? '#52c41a' : portal.health >= 80 ? '#faad14' : '#ff4d4f' }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>健康度 {portal.health}%</Text>
                  </Space>
                  <Progress
                    percent={portal.health}
                    size="small"
                    status={portal.health >= 90 ? 'success' : portal.health >= 80 ? 'normal' : 'exception'}
                  />
                </div>
              )}
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  )

  const recommendColumns = [
    { title: '规则名称', dataIndex: 'name', key: 'name', width: 160 },
    { title: '触发条件', dataIndex: 'condition', key: 'condition', width: 200 },
    { title: '推荐服务', dataIndex: 'recommendService', key: 'recommendService', width: 260 },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => <Tag color={priorityColorMap[priority]}>{priority}</Tag>,
    },
    {
      title: '启用状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean, record: RecommendRule) => (
        <Switch checked={enabled} size="small" onChange={() => handleToggleRule(record)} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: RecommendRule) => (
        <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => {
          addAuditEntry({
            operator: '管理员',
            module: '门户聚合引擎',
            action: '编辑推荐规则',
            detail: `编辑推荐规则：${record.name}`,
            result: 'success',
            ip: '10.0.1.100',
          })
          message.info(`编辑规则：${record.name}`)
        }}>
          配置
        </Button>
      ),
    },
  ]

  const renderRecommendTab = () => (
    <Card
      size="small"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddRuleVisible(true)}>
          新增推荐规则
        </Button>
      }
    >
      <Table
        size="small"
        dataSource={recommendRules}
        columns={recommendColumns}
        pagination={{ pageSize: 6 }}
      />
    </Card>
  )

  const accessColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 70,
      render: (rank: number) => {
        if (rank <= 3) {
          return <Badge count={rank} style={{ backgroundColor: rank === 1 ? '#f5222d' : rank === 2 ? '#fa8c16' : '#faad14' }} />
        }
        return <Text>{rank}</Text>
      },
    },
    { title: '服务名称', dataIndex: 'serviceName', key: 'serviceName', width: 160 },
    { title: '所属省市', dataIndex: 'province', key: 'province', width: 120 },
    {
      title: '访问量',
      dataIndex: 'visits',
      key: 'visits',
      width: 120,
      render: (v: number) => <Text strong>{v.toLocaleString()}</Text>,
    },
    {
      title: '好评率',
      dataIndex: 'goodRate',
      key: 'goodRate',
      width: 140,
      render: (rate: number) => <Rate disabled defaultValue={rate} allowHalf style={{ fontSize: 14 }} />,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: AccessRecord) => (
        <Button type="link" size="small" icon={<SearchOutlined />} onClick={() => handleAccessDetail(record)}>
          详情
        </Button>
      ),
    },
  ]

  const renderAccessTab = () => (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small" title="热门服务 TOP3">
            <List
              size="small"
              dataSource={accessData.slice(0, 3)}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: item.rank === 1 ? '#f5222d' : item.rank === 2 ? '#fa8c16' : '#faad14' }}>{item.rank}</Avatar>}
                    title={item.serviceName}
                    description={`${item.province} · ${item.visits.toLocaleString()}次访问`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={16}>
          <Card size="small" title="区域访问分布">
            <Row gutter={[16, 16]}>
              {[
                { region: '华东地区', count: 1243567, percent: 43 },
                { region: '华南地区', count: 876234, percent: 31 },
                { region: '华北地区', count: 432198, percent: 15 },
                { region: '西南地区', count: 198456, percent: 7 },
                { region: '华中地区', count: 98234, percent: 3 },
                { region: '其他地区', count: 8703, percent: 1 },
              ].map((item) => (
                <Col span={12} key={item.region}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Space>
                      <FireOutlined style={{ color: '#f5222d' }} />
                      <Text strong>{item.region}</Text>
                      <Text type="secondary">{item.count.toLocaleString()}次</Text>
                    </Space>
                    <Progress percent={item.percent} size="small" />
                  </Space>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
      <Card size="small" title="服务访问排行">
        <Table
          size="small"
          dataSource={accessData}
          columns={accessColumns}
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  )

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginTop: 0, marginBottom: 0 }}>
          <GlobalOutlined style={{ marginRight: 8 }} />
          政务服务门户聚合引擎
        </Title>
        <Text type="secondary">
          统一汇聚全国省市政务服务入口，实现服务智能推荐与个性化精准推送
        </Text>
      </Space>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已接入省市"
              value={31}
              prefix={<GlobalOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="服务入口总数"
              value={12856}
              prefix={<LinkOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="日均访问量"
              value={2847392}
              prefix={<FireOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="个性化推荐命中"
              value={89.3}
              suffix="%"
              prefix={<StarOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="portal"
        items={[
          {
            key: 'portal',
            label: '服务入口管理',
            children: renderPortalTab(),
          },
          {
            key: 'recommend',
            label: '个性化推荐配置',
            children: renderRecommendTab(),
          },
          {
            key: 'access',
            label: '访问统计',
            children: renderAccessTab(),
          },
        ]}
      />

      <Modal
        title={`${currentPortal?.name}政务服务网 - 详细信息`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={640}
      >
        {currentPortal && (
          <div>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Space size={8}>
                <GlobalOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                <Text strong style={{ fontSize: 18 }}>{currentPortal.name}政务服务网</Text>
                <Tag color={statusColorMap[currentPortal.status]}>{currentPortal.status}</Tag>
              </Space>
              <Space size={4}>
                <LinkOutlined />
                <Text type="secondary">{currentPortal.url}</Text>
              </Space>
              <Text>{currentPortal.description}</Text>
              {currentPortal.status !== '待接入' && (
                <div>
                  <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>系统健康度</Text>
                  <Progress
                    percent={currentPortal.health}
                    status={currentPortal.health >= 90 ? 'success' : currentPortal.health >= 80 ? 'normal' : 'exception'}
                  />
                </div>
              )}
              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small">
                    <Statistic title="服务事项数" value={currentPortal.serviceCount} suffix="项" />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <Statistic
                      title="健康度"
                      value={currentPortal.health}
                      suffix="%"
                      valueStyle={{ color: currentPortal.health >= 90 ? '#52c41a' : currentPortal.health >= 80 ? '#faad14' : '#ff4d4f' }}
                    />
                  </Card>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">联系人：{currentPortal.contact}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">最近同步：{currentPortal.lastSync}</Text>
                </Col>
              </Row>
              <Space>
                <Button
                  type="primary"
                  icon={<SettingOutlined />}
                  onClick={() => {
                    addAuditEntry({
                      operator: '管理员',
                      module: '门户聚合引擎',
                      action: '配置门户入口',
                      detail: `配置${currentPortal.name}政务服务门户入口`,
                      result: 'success',
                      ip: '10.0.1.100',
                    })
                    message.info(`配置${currentPortal.name}门户入口`)
                  }}
                >
                  入口配置
                </Button>
                <Tooltip title="在浏览器中打开门户">
                  <Button icon={<LinkOutlined />} onClick={() => {
                    addAuditEntry({
                      operator: '管理员',
                      module: '门户聚合引擎',
                      action: '访问门户',
                      detail: `访问${currentPortal.name}政务服务网`,
                      result: 'success',
                      ip: '10.0.1.100',
                    })
                    message.info(`即将打开${currentPortal.name}政务服务网`)
                  }}>
                    访问门户
                  </Button>
                </Tooltip>
              </Space>
            </Space>
          </div>
        )}
      </Modal>

      <Modal
        title="新增推荐规则"
        open={addRuleVisible}
        onOk={handleAddRule}
        onCancel={() => {
          setAddRuleVisible(false)
          addRuleForm.resetFields()
        }}
        width={560}
      >
        <Form form={addRuleForm} layout="vertical">
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Form.Item name="condition" label="触发条件" rules={[{ required: true, message: '请输入触发条件' }]}>
            <Input placeholder="请输入触发条件" />
          </Form.Item>
          <Form.Item name="recommendService" label="推荐服务" rules={[{ required: true, message: '请输入推荐服务' }]}>
            <Input placeholder="请输入推荐服务，多个服务用顿号分隔" />
          </Form.Item>
          <Form.Item name="priority" label="优先级" rules={[{ required: true, message: '请选择优先级' }]}>
            <Select
              placeholder="请选择优先级"
              options={[
                { label: '高', value: '高' },
                { label: '中', value: '中' },
                { label: '低', value: '低' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
