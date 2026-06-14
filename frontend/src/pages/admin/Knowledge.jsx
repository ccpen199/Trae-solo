import React, { useState, useEffect } from 'react'
import { 
  Table, Typography, Modal, Form, Input, Button, Space, message, Tag, Card, Row, Col,
  Descriptions, List, Avatar, Alert, Tabs, Select, Checkbox, Divider, Empty, Steps
} from 'antd'
import { 
  PlusOutlined, BulbOutlined, AlertOutlined, ToolOutlined, SafetyOutlined,
  FileTextOutlined, ShoppingOutlined, UserOutlined, EyeOutlined, BookOutlined
} from '@ant-design/icons'
import { adminApi } from '../../utils/api'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select

const serviceStandards = [
  { id: 'ac_recharge', name: '空调加氟SOP', duration: '30分钟', risk_level: 'low' },
  { id: 'ac_install', name: '空调安装规范', duration: '120分钟', risk_level: 'high' },
  { id: 'plumbing_repair', name: '水管维修标准', duration: '60分钟', risk_level: 'medium' },
  { id: 'circuit_diagnosis', name: '电路检测流程', duration: '45分钟', risk_level: 'high' },
  { id: 'appliance_install', name: '家电安装通用', duration: '90分钟', risk_level: 'medium' },
  { id: 'high_altitude_work', name: '高空作业安全规范', duration: '60分钟', risk_level: 'high' }
]

const commonParts = [
  { id: 'r32', name: 'R32环保冷媒', price: 80, unit: 'kg', category: '空调' },
  { id: 'r410a', name: 'R410A冷媒', price: 60, unit: 'kg', category: '空调' },
  { id: 'copper_pipe', name: '空调铜管', price: 120, unit: '米', category: '空调' },
  { id: 'pvc_pipe', name: 'PVC水管', price: 25, unit: '米', category: '水电' },
  { id: 'elbow', name: '90度弯头', price: 5, unit: '个', category: '水电' },
  { id: 'wire_2_5', name: '2.5平方铜线', price: 3, unit: '米', category: '电路' },
  { id: 'socket_16a', name: '16A大功率插座', price: 25, unit: '个', category: '电路' },
  { id: 'seal_ring', name: '防水密封圈', price: 2, unit: '个', category: '水电' }
]

const highRiskQualifications = [
  { id: 'electrician', name: '低压电工证', description: '电路维修、电器安装必须' },
  { id: 'welder', name: '焊工证', description: '金属焊接、切割作业必须' },
  { id: 'high_altitude', name: '高空作业证', description: '2米以上高空作业必须' },
  { id: 'hvac', name: '制冷维修证', description: '制冷剂操作必须' },
  { id: 'gas', name: '燃气安装维修证', description: '燃气设备维修必须' }
]

const Knowledge = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [activeTab, setActiveTab] = useState('basic')
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await adminApi.getKnowledgeGraph()
      setData(result.map(item => ({
        ...item,
        related_standards: item.related_standards || ['ac_recharge'],
        recommended_parts: item.recommended_parts || ['r32', 'copper_pipe'],
        required_qualifications: item.required_qualifications || [],
        owner_guidance: item.owner_guidance || {
          pre_check: [
            '请提前描述清楚空调品牌、型号和购买时间',
            '说明最近一次清洗或维修时间',
            '拍摄空调铭牌和故障现象照片'
          ],
          price_guide: '空调加氟市场参考价：R32冷媒 80-120元/kg，通常1.5匹空调需要1-1.5kg',
          avoid_risks: [
            '请勿自行操作制冷剂，高压危险',
            '高空作业请确认师傅有安全绳索',
            '加氟前要求师傅检测漏点'
          ]
        }
      })))
    } catch (error) {
      console.error('加载数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values) => {
    try {
      await adminApi.addKnowledge({
        ...values,
        possible_causes: values.possible_causes?.split('\n').filter(Boolean) || [],
        solutions: values.solutions?.split('\n').filter(Boolean) || [],
        related_standards: values.related_standards || [],
        recommended_parts: values.recommended_parts || [],
        required_qualifications: values.required_qualifications || []
      })
      message.success('添加成功')
      setModalVisible(false)
      form.resetFields()
      loadData()
    } catch (error) {
      message.error(error.message || '添加失败')
    }
  }

  const viewDetail = (record) => {
    setSelectedRecord(record)
    setDetailModal(true)
    setActiveTab('basic')
  }

  const getRiskLevelTag = (level) => {
    const map = {
      low: { text: '低危', color: 'green' },
      medium: { text: '中危', color: 'orange' },
      high: { text: '高危', color: 'red' }
    }
    const config = map[level] || map.low
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const columns = [
    {
      title: '故障类型',
      dataIndex: 'fault_type',
      key: 'fault_type',
      width: 150,
      render: (text) => (
        <Space>
          <BulbOutlined style={{ color: '#fa8c16' }} />
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: '症状',
      dataIndex: 'symptoms',
      key: 'symptoms',
      width: 180
    },
    {
      title: '关联标准',
      dataIndex: 'related_standards',
      key: 'related_standards',
      width: 150,
      render: (val) => val && val.length > 0 ? (
        <Space wrap>
          {val.map((id, i) => {
            const std = serviceStandards.find(s => s.id === id)
            return <Tag key={i} color="purple">{std?.name || id}</Tag>
          })}
        </Space>
      ) : <Text type="secondary">-</Text>
    },
    {
      title: '资质要求',
      dataIndex: 'required_qualifications',
      key: 'required_qualifications',
      width: 120,
      render: (val) => {
        if (!val || val.length === 0) return <Tag color="green">无需资质</Tag>
        return (
          <Space>
            <SafetyOutlined style={{ color: '#ff4d4f' }} />
            <span>{val.length}项</span>
          </Space>
        )
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => viewDetail(record)}>
          详情
        </Button>
      )
    }
  ]

  const detailTabs = selectedRecord ? [
    {
      key: 'basic',
      label: '基础信息',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            message="知识卡片已关联服务标准库"
            description="该故障类型已绑定《空调加氟SOP》等服务标准，师傅接单时自动推送操作规范"
            type="success"
            showIcon
          />
          <Descriptions title="故障详情" bordered column={1} size="small">
            <Descriptions.Item label="故障类型">{selectedRecord.fault_type}</Descriptions.Item>
            <Descriptions.Item label="症状描述">{selectedRecord.symptoms || '-'}</Descriptions.Item>
            <Descriptions.Item label="可能原因">
              <Space wrap>
                {(() => {
                  try {
                    const causes = JSON.parse(selectedRecord.possible_causes || '[]')
                    return causes.map((c, i) => <Tag key={i} color="blue">{c}</Tag>)
                  } catch { return <Text type="secondary">-</Text> }
                })()}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="解决方案">
              <Space wrap>
                {(() => {
                  try {
                    const solutions = JSON.parse(selectedRecord.solutions || '[]')
                    return solutions.map((s, i) => <Tag key={i} color="green">{s}</Tag>)
                  } catch { return <Text type="secondary">-</Text> }
                })()}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Space>
      )
    },
    {
      key: 'standards',
      label: '服务标准库',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            message="关联服务标准"
            description="师傅接单后，系统自动推送以下标准操作流程（SOP），确保服务质量一致"
            type="info"
            showIcon
          />
          <List
            dataSource={selectedRecord.related_standards?.map(id => serviceStandards.find(s => s.id === id)).filter(Boolean) || []}
            renderItem={(item) => (
              <List.Item key={item.id}>
                <Card size="small" style={{ width: '100%' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <FileTextOutlined style={{ color: '#722ed1' }} />
                      <Text strong>{item.name}</Text>
                      {getRiskLevelTag(item.risk_level)}
                    </Space>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Text type="secondary">预计工时：</Text>
                        <Text>{item.duration}</Text>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">关联知识条目：</Text>
                        <Text>{data.filter(k => k.related_standards?.includes(item.id)).length}条</Text>
                      </Col>
                    </Row>
                  </Space>
                </Card>
              </List.Item>
            )}
          />
          {(!selectedRecord.related_standards || selectedRecord.related_standards.length === 0) && (
            <Empty description="暂无关联服务标准" />
          )}
        </Space>
      )
    },
    {
      key: 'parts',
      label: '配件适配推荐',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            message="智能配件推荐"
            description="基于故障类型和历史维修数据，为师傅自动推荐可能需要的配件，减少往返"
            type="info"
            showIcon
          />
          <Row gutter={[16, 16]}>
            {(selectedRecord.recommended_parts?.map(id => commonParts.find(p => p.id === id)).filter(Boolean) || []).map(part => (
              <Col xs={12} sm={8} key={part.id}>
                <Card size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <ShoppingOutlined style={{ color: '#1890ff' }} />
                      <Text strong>{part.name}</Text>
                    </Space>
                    <Row gutter={8}>
                      <Col span={12}>
                        <Text type="secondary">单价：</Text>
                        <Text strong style={{ color: '#f5222d' }}>¥{part.price}</Text>
                        <Text type="secondary">/{part.unit}</Text>
                      </Col>
                      <Col span={12}>
                        <Tag color="blue">{part.category}</Tag>
                      </Col>
                    </Row>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
          {(!selectedRecord.recommended_parts || selectedRecord.recommended_parts.length === 0) && (
            <Col span={24}>
              <Empty description="暂无推荐配件" />
            </Col>
          )}
        </Space>
      )
    },
    {
      key: 'qualifications',
      label: '高危作业资质',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            message="资质报备要求"
            description={selectedRecord.required_qualifications?.length > 0 
              ? "该故障类型涉及高危作业，系统将自动校验师傅是否具备以下资质，无资质师傅无法接单"
              : "该故障类型无需特殊资质，所有已认证师傅均可接单"
            }
            type={selectedRecord.required_qualifications?.length > 0 ? "error" : "success"}
            showIcon
          />
          <List
            dataSource={selectedRecord.required_qualifications?.map(id => highRiskQualifications.find(q => q.id === id)).filter(Boolean) || []}
            renderItem={(item) => (
              <List.Item key={item.id}>
                <Card size="small" style={{ width: '100%' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <SafetyOutlined style={{ color: '#ff4d4f' }} />
                      <Text strong>{item.name}</Text>
                      <Tag color="red">强制</Tag>
                    </Space>
                    <Text type="secondary">{item.description}</Text>
                  </Space>
                </Card>
              </List.Item>
            )}
          />
          {(!selectedRecord.required_qualifications || selectedRecord.required_qualifications.length === 0) && (
            <Empty description="无需特殊资质" />
          )}
        </Space>
      )
    },
    {
      key: 'guidance',
      label: '业主填单引导',
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            message="知识反哺业主填单"
            description="业主选择此故障类型时，系统自动弹出以下引导，帮助业主提供完整信息，减少沟通成本"
            type="success"
            showIcon
          />
          <Card title="前置检查清单" size="small">
            <List
              size="small"
              dataSource={selectedRecord.owner_guidance?.pre_check || []}
              renderItem={(item, index) => (
                <List.Item>
                  <Space>
                    <Tag color="blue">{index + 1}</Tag>
                    <Text>{item}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
          <Card title="价格参考引导" size="small">
            <Paragraph style={{ margin: 0 }}>
              <BookOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
              {selectedRecord.owner_guidance?.price_guide || '暂无价格参考'}
            </Paragraph>
          </Card>
          <Card title="避坑提醒" size="small">
            <List
              size="small"
              dataSource={selectedRecord.owner_guidance?.avoid_risks || []}
              renderItem={(item, index) => (
                <List.Item>
                  <Space>
                    <AlertOutlined style={{ color: '#ff4d4f' }} />
                    <Text type="danger">{item}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Space>
      )
    }
  ] : []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>故障知识图谱</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          添加知识条目
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <BulbOutlined style={{ fontSize: 32, color: '#fa8c16', marginBottom: 8 }} />
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{data.length}</div>
              <div style={{ color: '#999' }}>知识条目</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <FileTextOutlined style={{ fontSize: 32, color: '#722ed1', marginBottom: 8 }} />
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                {new Set(data.flatMap(k => k.related_standards || [])).size}
              </div>
              <div style={{ color: '#999' }}>服务标准</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <SafetyOutlined style={{ fontSize: 32, color: '#ff4d4f', marginBottom: 8 }} />
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                {data.filter(k => k.required_qualifications?.length > 0).length}
              </div>
              <div style={{ color: '#999' }}>高危作业</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <ShoppingOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                {new Set(data.flatMap(k => k.recommended_parts || [])).size}
              </div>
              <div style={{ color: '#999' }}>适配配件</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="添加知识条目"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fault_type" label="故障类型" rules={[{ required: true }]}>
                <Input placeholder="如：空调不制冷、水管漏水" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="symptoms" label="故障症状">
                <Input placeholder="简要描述故障现象" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="possible_causes" label="可能原因（每行一个）">
            <TextArea rows={3} placeholder="原因1&#10;原因2&#10;原因3" />
          </Form.Item>
          <Form.Item name="solutions" label="解决方案（每行一个）">
            <TextArea rows={3} placeholder="方案1&#10;方案2&#10;方案3" />
          </Form.Item>
          
          <Divider orientation="left">高级关联</Divider>
          
          <Form.Item name="related_standards" label="关联服务标准">
            <Select mode="multiple" placeholder="选择关联的SOP服务标准">
              {serviceStandards.map(std => (
                <Option key={std.id} value={std.id}>
                  {std.name} {getRiskLevelTag(std.risk_level)}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="recommended_parts" label="配件适配推荐">
            <Select mode="multiple" placeholder="选择推荐的配件">
              {commonParts.map(part => (
                <Option key={part.id} value={part.id}>
                  {part.name} (¥{part.price}/{part.unit})
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="required_qualifications" label="高危作业资质要求">
            <Checkbox.Group options={highRiskQualifications.map(q => ({ label: q.name, value: q.id }))} />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="知识详情 - 完整关联图谱"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>关闭</Button>
        ]}
        width={900}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={detailTabs} />
      </Modal>
    </div>
  )
}

export default Knowledge
