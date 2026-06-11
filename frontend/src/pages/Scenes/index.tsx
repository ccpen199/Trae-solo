import { useState, useEffect } from 'react'
import { Card, Row, Col, Tag, Space, Button, Empty, Spin } from 'antd'
import { BulbOutlined, ArrowRightOutlined, AppstoreOutlined, FileTextOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import SceneFlow from '@/components/SceneFlow'
import { SceneTemplate } from '@/types'
import dayjs from 'dayjs'

const mockScenes: SceneTemplate[] = [
  {
    id: '1',
    name: '我要开餐馆',
    description: '开办餐馆一站式服务，包含营业执照、食品经营许可证、消防验收等多个事项，一次提交、并联审批。',
    icon: '餐',
    category: '企业开办',
    services: [
      { serviceId: 's1', serviceName: '营业执照办理', order: 1 },
      { serviceId: 's2', serviceName: '食品经营许可证', order: 2 },
      { serviceId: 's3', serviceName: '消防验收', order: 3 }
    ],
    materials: [
      { step: 1, name: '身份证', required: true, description: '经营者身份证原件' },
      { step: 1, name: '经营场所证明', required: true, description: '房产证或租赁合同' },
      { step: 2, name: '健康证', required: true, description: '从业人员健康证明' },
      { step: 3, name: '消防设计图', required: true, description: '经营场所消防设计图纸' }
    ],
    steps: [
      { order: 1, title: '工商注册', description: '办理营业执照', services: ['营业执照办理'] },
      { order: 2, title: '资质办理', description: '办理食品经营许可证', services: ['食品经营许可证'] },
      { order: 3, title: '开业检查', description: '消防和卫生验收', services: ['消防验收'] }
    ],
    createdAt: dayjs().subtract(30, 'day').toISOString()
  },
  {
    id: '2',
    name: '新生儿入户',
    description: '新生儿出生登记、户口申报、医保参保一站式办理，让新手爸妈少跑腿。',
    icon: '新',
    category: '户籍证件',
    services: [
      { serviceId: 's4', serviceName: '出生医学证明', order: 1 },
      { serviceId: 's5', serviceName: '户口申报', order: 2 },
      { serviceId: 's6', serviceName: '医保参保', order: 3 }
    ],
    materials: [
      { step: 1, name: '父母身份证', required: true, description: '父母双方身份证' },
      { step: 1, name: '结婚证', required: true, description: '父母结婚证' },
      { step: 2, name: '出生医学证明', required: true, description: '医院出具的出生证明' }
    ],
    steps: [
      { order: 1, title: '办理出生证明', description: '医院出具出生医学证明', services: ['出生医学证明'] },
      { order: 2, title: '户口登记', description: '派出所办理户口申报', services: ['户口申报'] },
      { order: 3, title: '医保参保', description: '办理居民医疗保险', services: ['医保参保'] }
    ],
    createdAt: dayjs().subtract(30, 'day').toISOString()
  },
  {
    id: '3',
    name: '我要买房',
    description: '购房全流程服务，包含不动产登记、公积金贷款、水电燃气过户等事项。',
    icon: '房',
    category: '住房服务',
    services: [
      { serviceId: 's7', serviceName: '不动产登记', order: 1 },
      { serviceId: 's8', serviceName: '公积金贷款', order: 2 },
      { serviceId: 's9', serviceName: '水电过户', order: 3 }
    ],
    materials: [
      { step: 1, name: '购房合同', required: true, description: '房屋买卖合同' },
      { step: 1, name: '身份证', required: true, description: '买卖双方身份证' },
      { step: 2, name: '收入证明', required: true, description: '个人收入证明' }
    ],
    steps: [
      { order: 1, title: '网签备案', description: '办理购房合同网签备案', services: ['不动产登记'] },
      { order: 2, title: '贷款办理', description: '申请公积金或商业贷款', services: ['公积金贷款'] },
      { order: 3, title: '过户交割', description: '办理不动产过户和水电过户', services: ['水电过户'] }
    ],
    createdAt: dayjs().subtract(30, 'day').toISOString()
  },
  {
    id: '4',
    name: '我要退休',
    description: '退休手续一站式办理，包含养老金申领、医保退休、公积金提取等。',
    icon: '休',
    category: '社会保障',
    services: [
      { serviceId: 's10', serviceName: '养老金申领', order: 1 },
      { serviceId: 's11', serviceName: '医保退休', order: 2 },
      { serviceId: 's12', serviceName: '公积金提取', order: 3 }
    ],
    materials: [
      { step: 1, name: '身份证', required: true, description: '本人身份证' },
      { step: 1, name: '社保卡', required: true, description: '社会保障卡' },
      { step: 2, name: '退休证明', required: true, description: '单位出具的退休证明' }
    ],
    steps: [
      { order: 1, title: '退休申请', description: '提交退休申请材料', services: ['养老金申领'] },
      { order: 2, title: '社保结算', description: '办理社保退休手续', services: ['医保退休'] },
      { order: 3, title: '待遇发放', description: '核定养老待遇并发放', services: ['公积金提取'] }
    ],
    createdAt: dayjs().subtract(30, 'day').toISOString()
  }
]

const Scenes = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [scenes, setScenes] = useState<SceneTemplate[]>([])
  const [selectedScene, setSelectedScene] = useState<SceneTemplate | null>(null)

  useEffect(() => {
    loadScenes()
  }, [])

  const loadScenes = () => {
    setLoading(true)
    setTimeout(() => {
      setScenes(mockScenes)
      setLoading(false)
    }, 500)
  }

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>
              <BulbOutlined style={{ color: '#1890ff', marginRight: 12 }} />
              一件事专区
            </h1>
            <p style={{ color: '#8c8c8c', marginTop: 8, marginBottom: 0 }}>
              集成多个关联事项，一次提交、并联审批、全程跟踪，让您"最多跑一次"
            </p>
          </div>
          <Button icon={<ReloadOutlined />} onClick={loadScenes}>
            刷新
          </Button>
        </div>

        {!selectedScene ? (
          <>
            {scenes.length > 0 ? (
              <Row gutter={[16, 16]}>
                {scenes.map((scene) => (
                  <Col span={12} key={scene.id}>
                    <Card
                      className="hover-card card-shadow"
                      onClick={() => setSelectedScene(scene)}
                      hoverable
                      bodyStyle={{ padding: 24 }}
                    >
                      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #1890ff, #722ed1)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 28,
                            fontWeight: 600,
                            flexShrink: 0
                          }}
                        >
                          {scene.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{scene.name}</h3>
                            <Tag color="blue">{scene.category}</Tag>
                          </div>
                          <p style={{ color: '#595959', marginBottom: 12, lineHeight: 1.6 }}>
                            {scene.description}
                          </p>
                          <Space wrap style={{ marginBottom: 16 }}>
                            <Tag color="green" icon={<AppstoreOutlined />}>
                              {scene.services.length} 个事项
                            </Tag>
                            <Tag color="orange" icon={<FileTextOutlined />}>
                              {scene.materials.length} 份材料
                            </Tag>
                            <Tag color="blue">{scene.steps.length} 个步骤</Tag>
                          </Space>
                          <Button
                            type="primary"
                            icon={<ArrowRightOutlined />}
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/scenes/${scene.id}`)
                            }}
                          >
                            立即办理
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty description="暂无场景服务" />
            )}
          </>
        ) : (
          <>
            <Button
              icon={<ArrowRightOutlined rotate={180} />}
              onClick={() => setSelectedScene(null)}
              style={{ marginBottom: 16 }}
            >
              返回列表
            </Button>
            <SceneFlow template={selectedScene} />
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={() => navigate(`/scenes/${selectedScene.id}`)}
              >
                立即办理此场景
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Scenes
