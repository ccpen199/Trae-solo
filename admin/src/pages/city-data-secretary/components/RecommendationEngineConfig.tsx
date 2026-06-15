import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Form,
  Slider,
  Switch,
  Select,
  InputNumber,
  Input,
  Button,
  List,
  Tag,
  Modal,
  Tabs,
  Space,
  Divider,
  message
} from 'antd'
import {
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HomeOutlined,
  FileTextOutlined,
  BellOutlined,
  NotificationOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'

const { Option } = Select

const RecommendationEngineConfig: React.FC = () => {
  const [form] = Form.useForm()
  const [sceneModalVisible, setSceneModalVisible] = useState(false)
  const [ruleModalVisible, setRuleModalVisible] = useState(false)
  const [editingScene, setEditingScene] = useState<any>(null)
  const [editingRule, setEditingRule] = useState<any>(null)

  const algorithmConfig = {
    tagWeight: 60,
    behaviorWeight: 30,
    collaborativeWeight: 10,
    coldStartStrategy: 'popular',
    recommendationCount: 10,
    diversity: 50,
    novelty: 40,
    serendipity: 30
  }

  const recommendationScenes = [
    {
      id: 1,
      name: '首页推荐',
      icon: <HomeOutlined style={{ fontSize: 24, color: '#0958d9' }} />,
      description: '用户首页个性化服务推荐',
      algorithm: '混合推荐',
      status: true,
      dailyExposure: '128,560次',
      clickRate: '12.5%'
    },
    {
      id: 2,
      name: '事项推荐',
      icon: <FileTextOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      description: '办事相关事项智能推荐',
      algorithm: '基于行为',
      status: true,
      dailyExposure: '86,320次',
      clickRate: '18.2%'
    },
    {
      id: 3,
      name: '证照提醒',
      icon: <BellOutlined style={{ fontSize: 24, color: '#faad14' }} />,
      description: '证照到期、换证智能提醒',
      algorithm: '基于规则',
      status: true,
      dailyExposure: '32,180次',
      clickRate: '25.6%'
    },
    {
      id: 4,
      name: '政策推送',
      icon: <NotificationOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      description: '匹配用户画像的政策推送',
      algorithm: '基于标签',
      status: false,
      dailyExposure: '0次',
      clickRate: '0%'
    }
  ]

  const recommendationRules = [
    {
      id: 1,
      name: '基于标签推荐',
      type: 'tag',
      description: '根据用户画像标签匹配相关服务',
      weight: 60,
      status: true
    },
    {
      id: 2,
      name: '基于行为推荐',
      type: 'behavior',
      description: '根据用户历史行为记录推荐相似服务',
      weight: 30,
      status: true
    },
    {
      id: 3,
      name: '基于协同过滤推荐',
      type: 'collaborative',
      description: '根据相似用户的行为进行推荐',
      weight: 10,
      status: true
    }
  ]

  const weightDistributionOption = {
    title: {
      text: '推荐算法权重分布',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500 }
    },
    tooltip: {
      trigger: 'item'
    },
    series: [
      {
        name: '权重',
        type: 'pie',
        radius: ['40%', '60%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%'
        },
        labelLine: {
          show: true
        },
        data: [
          { value: 60, name: '标签推荐' },
          { value: 30, name: '行为推荐' },
          { value: 10, name: '协同过滤' }
        ],
        color: ['#0958d9', '#52c41a', '#faad14']
      }
    ]
  }

  const handleSceneEdit = (scene: any) => {
    setEditingScene(scene)
    setSceneModalVisible(true)
  }

  const handleSceneAdd = () => {
    setEditingScene(null)
    setSceneModalVisible(true)
  }

  const handleRuleEdit = (rule: any) => {
    setEditingRule(rule)
    setRuleModalVisible(true)
  }

  const handleRuleAdd = () => {
    setEditingRule(null)
    setRuleModalVisible(true)
  }

  const handleSaveConfig = () => {
    message.success('配置保存成功')
  }

  const sceneTabItems = [
    {
      key: 'list',
      label: '场景列表',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleSceneAdd}>
              新增场景
            </Button>
          </div>
          <Row gutter={[16, 16]}>
            {recommendationScenes.map((scene) => (
              <Col xs={24} md={12} key={scene.id}>
                <Card
                  hoverable
                  actions={[
                    <EditOutlined key="edit" onClick={() => handleSceneEdit(scene)} />,
                    <DeleteOutlined key="delete" style={{ color: '#ff4d4f' }} />
                  ]}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        background: '#f0f5ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 16
                      }}
                    >
                      {scene.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 16, fontWeight: 500 }}>{scene.name}</span>
                        <Tag color={scene.status ? 'green' : 'default'}>
                          {scene.status ? '已启用' : '已禁用'}
                        </Tag>
                      </div>
                      <p style={{ fontSize: 12, color: '#666', margin: '8px 0' }}>{scene.description}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: '#999' }}>算法：{scene.algorithm}</span>
                        <span style={{ color: '#999' }}>点击率：{scene.clickRate}</span>
                      </div>
                    </div>
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
            title="推荐算法参数配置"
            extra={
              <Button type="primary" icon={<SettingOutlined />} onClick={handleSaveConfig}>
                保存配置
              </Button>
            }
          >
            <Form form={form} layout="vertical" initialValues={algorithmConfig}>
              <Row gutter={24}>
                <Col xs={24} md={12}>
                  <Form.Item label="标签推荐权重" name="tagWeight">
                    <Slider min={0} max={100} marks={{ 0: '0%', 100: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="行为推荐权重" name="behaviorWeight">
                    <Slider min={0} max={100} marks={{ 0: '0%', 100: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="协同过滤权重" name="collaborativeWeight">
                    <Slider min={0} max={100} marks={{ 0: '0%', 100: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="冷启动策略" name="coldStartStrategy">
                    <Select>
                      <Option value="popular">热门推荐</Option>
                      <Option value="random">随机推荐</Option>
                      <Option value="demographic">人口统计学推荐</Option>
                      <Option value="content">内容推荐</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="推荐数量" name="recommendationCount">
                    <InputNumber min={1} max={50} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="多样性" name="diversity">
                    <Slider min={0} max={100} marks={{ 0: '低', 100: '高' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="新颖性" name="novelty">
                    <Slider min={0} max={100} marks={{ 0: '低', 100: '高' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="意外性" name="serendipity">
                    <Slider min={0} max={100} marks={{ 0: '低', 100: '高' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="权重分布图">
            <ReactECharts option={weightDistributionOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="推荐场景管理" style={{ marginBottom: 16 }}>
        <Tabs items={sceneTabItems} />
      </Card>

      <Card
        title="推荐规则配置"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleRuleAdd}>
            新增规则
          </Button>
        }
      >
        <List
          dataSource={recommendationRules}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              actions={[
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleRuleEdit(item)}>
                  编辑
                </Button>,
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <span style={{ fontWeight: 500 }}>{item.name}</span>
                    <Tag color={item.type === 'tag' ? 'blue' : item.type === 'behavior' ? 'green' : 'orange'}>
                      {item.type === 'tag' ? '基于标签' : item.type === 'behavior' ? '基于行为' : '协同过滤'}
                    </Tag>
                  </Space>
                }
                description={item.description}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ width: 150 }}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>权重：{item.weight}%</div>
                </div>
                <Switch
                  checked={item.status}
                  onChange={(checked) => {
                    message.info(`${item.name}已${checked ? '启用' : '禁用'}`)
                  }}
                />
              </div>
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title={editingScene ? '编辑推荐场景' : '新增推荐场景'}
        open={sceneModalVisible}
        onCancel={() => setSceneModalVisible(false)}
        onOk={() => setSceneModalVisible(false)}
        width={600}
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="场景名称" required>
                <Input placeholder="请输入场景名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="推荐算法" required>
                <Select placeholder="请选择推荐算法">
                  <Option value="tag">基于标签</Option>
                  <Option value="behavior">基于行为</Option>
                  <Option value="collaborative">协同过滤</Option>
                  <Option value="hybrid">混合推荐</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="场景描述">
            <Input.TextArea rows={3} placeholder="请输入场景描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="推荐数量">
                <InputNumber min={1} max={50} style={{ width: '100%' }} defaultValue={10} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="启用状态" valuePropName="checked">
                <Switch defaultChecked />
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left">展示设置</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="展示位置">
                <Select placeholder="请选择展示位置">
                  <Option value="home">首页</Option>
                  <Option value="service">服务页</Option>
                  <Option value="mine">我的页</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="刷新频率">
                <Select placeholder="请选择刷新频率">
                  <Option value="realtime">实时</Option>
                  <Option value="hourly">每小时</Option>
                  <Option value="daily">每天</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={editingRule ? '编辑推荐规则' : '新增推荐规则'}
        open={ruleModalVisible}
        onCancel={() => setRuleModalVisible(false)}
        onOk={() => setRuleModalVisible(false)}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="规则名称" required>
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Form.Item label="规则类型" required>
            <Select placeholder="请选择规则类型">
              <Option value="tag">基于标签</Option>
              <Option value="behavior">基于行为</Option>
              <Option value="collaborative">协同过滤</Option>
            </Select>
          </Form.Item>
          <Form.Item label="规则描述">
            <Input.TextArea rows={3} placeholder="请输入规则描述" />
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

export default RecommendationEngineConfig
