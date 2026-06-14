import { useState, useEffect } from 'react'
import {
  Card,
  Steps,
  Form,
  Input,
  Button,
  Row,
  Col,
  Alert,
  Descriptions,
  Tag,
  Space,
  Result,
  message,
  Spin,
  Upload,
  Modal,
  App
} from 'antd'
import {
  ArrowLeftOutlined,
  UploadOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  LinkOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'
import SceneFlow from '@/components/SceneFlow'
import { SceneTemplate, SceneInstance, Certificate } from '@/types'
import dayjs from 'dayjs'

const { TextArea } = Input

const mockTemplate: SceneTemplate = {
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
}

const mockUserCerts: Certificate[] = [
  {
    id: 'cert1',
    userId: 'user1',
    name: '居民身份证',
    type: '身份证件',
    code: '320402********1234',
    issuer: '常州市公安局',
    issueDate: '2020-01-01',
    expireDate: '2040-01-01',
    status: 'valid',
    createdAt: dayjs().subtract(30, 'day').toISOString()
  },
  {
    id: 'cert2',
    userId: 'user1',
    name: '健康证',
    type: '健康证明',
    code: 'JK2023120001',
    issuer: '常州市疾控中心',
    issueDate: '2023-06-01',
    expireDate: '2024-06-01',
    status: 'valid',
    createdAt: dayjs().subtract(30, 'day').toISOString()
  }
]

const SceneDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notification } = App.useApp()
  const { isLoggedIn, userInfo, addApplication, setCertificates, certificates } = useUserStore()
  const [loading, setLoading] = useState(true)
  const [template, setTemplate] = useState<SceneTemplate | null>(null)
  const [instance, setInstance] = useState<SceneInstance | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form] = Form.useForm()
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, boolean[]>>({})

  useEffect(() => {
    loadData()
    if (isLoggedIn && certificates.length === 0) {
      setCertificates(mockUserCerts)
    }
  }, [id])

  const loadData = () => {
    setLoading(true)
    setTimeout(() => {
      setTemplate({ ...mockTemplate, id: id || '1' })
      setLoading(false)
    }, 500)
  }

  const startScene = () => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }

    const newInstance: SceneInstance = {
      id: `scene${Date.now()}`,
      templateId: template!.id,
      templateName: template!.name,
      userId: userInfo!.id,
      status: 'in_progress',
      currentStep: 1,
      totalSteps: template!.steps.length,
      flowStatus: template!.steps.map((step) => ({
        step: step.order,
        title: step.title,
        status: step.order === 1 ? 'processing' : 'pending',
        time: step.order === 1 ? dayjs().toISOString() : undefined,
        services: step.services.map((s) => ({
          serviceId: s,
          serviceName: s,
          status: step.order === 1 ? '办理中' : '待办理'
        }))
      })),
      formData: {},
      materials: template!.materials.map((m) => ({
        name: m.name,
        uploaded: false
      })),
      createdAt: dayjs().toISOString()
    }

    setInstance(newInstance)
    setCurrentStep(0)

    notification.success({
      message: '场景已启动',
      description: `已成功启动"${template!.name}"场景，请按步骤完成办理`,
      placement: 'topRight'
    })
  }

  const handleNext = async () => {
    try {
      const values = await form.validateFields()

      if (!instance) return

      const updatedMaterials = [...instance.materials]
      template?.materials
        .filter((m) => m.step === currentStep + 1)
        .forEach((m, idx) => {
          const materialIdx = instance.materials.findIndex((mat) => mat.name === m.name)
          if (materialIdx !== -1) {
            updatedMaterials[materialIdx] = {
              ...updatedMaterials[materialIdx],
              uploaded: uploadedFiles[currentStep]?.[idx] || false
            }
          }
        })

      const updatedFlowStatus = instance.flowStatus.map((flow, idx) => {
        if (idx === currentStep) {
          return {
            ...flow,
            status: 'completed' as const,
            time: dayjs().toISOString(),
            services: flow.services.map((s) => ({ ...s, status: '已完成' }))
          }
        }
        if (idx === currentStep + 1) {
          return {
            ...flow,
            status: 'processing' as const,
            time: dayjs().toISOString(),
            services: flow.services.map((s) => ({ ...s, status: '办理中' }))
          }
        }
        return flow
      })

      const updatedInstance: SceneInstance = {
        ...instance,
        currentStep: currentStep + 2,
        formData: { ...instance.formData, ...values },
        materials: updatedMaterials,
        flowStatus: updatedFlowStatus
      }

      setInstance(updatedInstance)

      if (currentStep + 1 >= template!.steps.length) {
        updatedInstance.status = 'completed'
        updatedInstance.completedAt = dayjs().toISOString()
        updatedInstance.flowStatus = updatedFlowStatus.map((f) => ({
          ...f,
          status: 'completed' as const,
          services: f.services.map((s) => ({ ...s, status: '已完成' }))
        }))
        setInstance(updatedInstance)
        setShowResult(true)

        template?.services.forEach((s) => {
          addApplication({
            id: `app${Date.now()}${Math.random()}`,
            serviceId: s.serviceId,
            serviceName: s.serviceName,
            userId: userInfo!.id,
            userName: userInfo!.name,
            applicationNo: `CZ${dayjs().format('YYYYMMDDHHmmss')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            status: 'completed',
            statusText: '已完成',
            formData: values,
            materials: [],
            certificates: [],
            progress: [
              { status: '已完成', time: dayjs().toISOString(), description: '场景式办件已完成', completed: true }
            ],
            submitTime: dayjs().toISOString(),
            estimatedTime: dayjs().toISOString(),
            completedTime: dayjs().toISOString()
          })
        })

        notification.success({
          message: '场景办理完成',
          description: `恭喜！"${template!.name}"已全部办理完成`,
          placement: 'topRight'
        })
      } else {
        setCurrentStep(currentStep + 1)
        form.resetFields()
        setUploadedFiles({})
      }
    } catch (error) {
      console.error('验证失败:', error)
    }
  }

  const handleFileUpload = (stepIndex: number, fileIndex: number, uploaded: boolean) => {
    setUploadedFiles((prev) => {
      const stepFiles = prev[stepIndex] || []
      stepFiles[fileIndex] = uploaded
      return { ...prev, [stepIndex]: stepFiles }
    })
  }

  const getStepForm = () => {
    if (!template) return null

    const step = template.steps[currentStep]
    const stepMaterials = template.materials.filter((m) => m.step === currentStep + 1)
    const autoLinkableCerts = certificates.filter((cert) =>
      stepMaterials.some((m) => m.name.includes(cert.name) || cert.name.includes(m.name.split('证')[0]))
    )

    return (
      <Form form={form} layout="vertical">
        {currentStep === 0 && (
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="经营者姓名"
                rules={[{ required: true, message: '请输入经营者姓名' }]}
                initialValue={userInfo?.name}
              >
                <Input placeholder="请输入经营者姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="idCard"
                label="身份证号"
                rules={[
                  { required: true, message: '请输入身份证号' },
                  { pattern: /^\d{17}[\dXx]$/, message: '请输入正确的身份证号' }
                ]}
                initialValue={userInfo?.idCard}
              >
                <Input placeholder="请输入18位身份证号" maxLength={18} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="联系电话"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                ]}
                initialValue={userInfo?.phone}
              >
                <Input placeholder="请输入11位手机号" maxLength={11} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="shopName"
                label="店铺名称"
                rules={[{ required: true, message: '请输入店铺名称' }]}
              >
                <Input placeholder="请输入店铺名称" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="address"
                label="经营地址"
                rules={[{ required: true, message: '请输入经营地址' }]}
              >
                <Input placeholder="请输入详细经营地址" />
              </Form.Item>
            </Col>
          </Row>
        )}

        {currentStep === 1 && (
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="businessType"
                label="经营类型"
                rules={[{ required: true, message: '请选择经营类型' }]}
              >
                <Input placeholder="如：中餐、西餐、小吃等" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="area"
                label="经营面积"
                rules={[{ required: true, message: '请输入经营面积' }]}
              >
                <Input placeholder="请输入经营面积（平方米）" suffix="㎡" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="description"
                label="经营范围描述"
                rules={[{ required: true, message: '请输入经营范围描述' }]}
              >
                <TextArea rows={3} placeholder="请详细描述经营范围" />
              </Form.Item>
            </Col>
          </Row>
        )}

        {currentStep === 2 && (
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="fireSystem"
                label="消防系统类型"
                rules={[{ required: true, message: '请选择消防系统类型' }]}
              >
                <Input placeholder="如：自动喷淋、烟感报警等" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="exitCount"
                label="安全出口数量"
                rules={[{ required: true, message: '请输入安全出口数量' }]}
              >
                <Input placeholder="请输入安全出口数量" type="number" min="1" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="其他说明">
                <TextArea rows={3} placeholder="其他需要说明的情况（选填）" />
              </Form.Item>
            </Col>
          </Row>
        )}

        {autoLinkableCerts.length > 0 && (
          <Alert
            message="电子证照自动关联"
            description={
              <div>
                <p style={{ marginBottom: 8 }}>系统检测到您已持有以下电子证照，可自动关联：</p>
                <Space wrap>
                  {autoLinkableCerts.map((cert) => (
                    <Tag key={cert.id} color="green" icon={<SafetyCertificateOutlined />}>
                      {cert.name} - 已自动关联
                    </Tag>
                  ))}
                </Space>
              </div>
            }
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {stepMaterials.length > 0 && (
          <Card size="small" title="本步骤需要上传的材料" style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {stepMaterials.map((material, idx) => {
                const autoCert = certificates.find((c) => c.name === material.name)
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: '#fafafa',
                      borderRadius: 8
                    }}
                  >
                    <Space>
                      <span style={{ fontWeight: 500 }}>{material.name}</span>
                      {material.required && <Tag color="red">必填</Tag>}
                      {autoCert && (
                        <Tag color="green" icon={<SafetyCertificateOutlined />}>
                          已有电子证照
                        </Tag>
                      )}
                      <span style={{ color: '#8c8c8c', fontSize: 12 }}>{material.description}</span>
                    </Space>
                    {autoCert ? (
                      <Tag color="green">已自动关联</Tag>
                    ) : (
                      <Upload
                        multiple={false}
                        beforeUpload={() => false}
                        onChange={({ file }) => {
                          if (file.status === 'done' || file.status === 'uploading') {
                            handleFileUpload(currentStep, idx, true)
                            message.success(`${material.name}上传成功`)
                          }
                        }}
                      >
                        <Button
                          icon={<UploadOutlined />}
                          type={uploadedFiles[currentStep]?.[idx] ? 'default' : 'primary'}
                        >
                          {uploadedFiles[currentStep]?.[idx] ? '重新上传' : '上传'}
                        </Button>
                      </Upload>
                    )}
                  </div>
                )
              })}
            </Space>
          </Card>
        )}
      </Form>
    )
  }

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <Card className="card-shadow">
            <p>场景不存在</p>
            <Button onClick={() => navigate('/scenes')}>返回列表</Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/scenes')}
          style={{ marginBottom: 16 }}
        >
          返回场景列表
        </Button>

        {showResult && instance ? (
          <Card className="card-shadow">
            <Result
              status="success"
              title="场景办理完成"
              subTitle={`恭喜！"${template.name}"已全部办理完成，相关证照正在制发中。`}
              extra={[
                <Button type="primary" key="track" onClick={() => navigate('/user/applications')}>
                  <LinkOutlined /> 查看办件记录
                </Button>,
                <Button key="home" onClick={() => navigate('/')}>
                  返回首页
                </Button>
              ]}
            />
            <SceneFlow instance={instance} />
          </Card>
        ) : instance ? (
          <>
            <Card className="card-shadow" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0 }}>{template.name}</h2>
                  <p style={{ color: '#8c8c8c', margin: '8px 0 0' }}>{template.description}</p>
                </div>
                <Space>
                  <Tag color="blue">第 {instance.currentStep} / {instance.totalSteps} 步</Tag>
                  <Tag color="orange">进行中</Tag>
                  <Button icon={<ReloadOutlined />} onClick={loadData}>
                    刷新
                  </Button>
                </Space>
              </div>

              <Steps
                current={currentStep}
                items={instance.flowStatus.map((flow) => ({
                  title: flow.title,
                  description: flow.status === 'completed' ? '已完成' : flow.status === 'processing' ? '进行中' : '待办理',
                  status: flow.status === 'completed' ? 'finish' : flow.status === 'processing' ? 'process' : 'wait'
                }))}
                style={{ marginBottom: 24 }}
              />

              <Card title={`步骤 ${currentStep + 1}：${template.steps[currentStep]?.title}`}>
                <p style={{ color: '#595959', marginBottom: 24 }}>
                  {template.steps[currentStep]?.description}
                </p>
                {getStepForm()}
                <div style={{ marginTop: 32, textAlign: 'right' }}>
                  <Space>
                    <Button disabled={currentStep === 0} onClick={() => setCurrentStep(currentStep - 1)}>
                      上一步
                    </Button>
                    <Button type="primary" icon={<SendOutlined />} onClick={() => setShowConfirm(true)}>
                      {currentStep + 1 >= template.steps.length ? '提交完成' : '下一步'}
                    </Button>
                  </Space>
                </div>
              </Card>
            </Card>

            <Card className="card-shadow" title="实时流转状态">
              <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="场景名称">{instance.templateName}</Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {dayjs(instance.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="当前进度">
                  第 {instance.currentStep} / {instance.totalSteps} 步
                </Descriptions.Item>
                <Descriptions.Item label="整体状态">
                  <Tag color="blue">进行中</Tag>
                </Descriptions.Item>
              </Descriptions>
              <SceneFlow instance={instance} showMaterials={false} />
            </Card>
          </>
        ) : (
          <>
            <Card className="card-shadow" style={{ marginBottom: 16 }}>
              <Row gutter={24} align="middle">
                <Col span={4}>
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 16,
                      background: 'linear-gradient(135deg, #1890ff, #722ed1)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 40,
                      fontWeight: 600
                    }}
                  >
                    {template.icon}
                  </div>
                </Col>
                <Col span={16}>
                  <h1 style={{ fontSize: 28, margin: '0 0 8px' }}>{template.name}</h1>
                  <p style={{ color: '#595959', margin: '0 0 12px' }}>{template.description}</p>
                  <Space wrap>
                    <Tag color="blue">{template.category}</Tag>
                    <Tag color="green">{template.services.length} 个事项</Tag>
                    <Tag color="orange">{template.materials.length} 份材料</Tag>
                    <Tag color="purple">{template.steps.length} 个步骤</Tag>
                  </Space>
                </Col>
                <Col span={4} style={{ textAlign: 'right' }}>
                  <Button type="primary" size="large" icon={<SendOutlined />} onClick={startScene}>
                    开始办理
                  </Button>
                </Col>
              </Row>
            </Card>
            <SceneFlow template={template} />
          </>
        )}
      </div>

      <Modal
        title="确认提交"
        open={showConfirm}
        onOk={handleNext}
        onCancel={() => setShowConfirm(false)}
        okText={currentStep + 1 >= template.steps.length ? '确认完成' : '确认提交'}
        cancelText="取消"
      >
        <p>
          {currentStep + 1 >= template.steps.length
            ? `确认完成"${template.name}"所有步骤吗？完成后将生成相关办件记录。`
            : `确认提交当前步骤信息并进入下一步吗？`
          }
        </p>
      </Modal>
    </div>
  )
}

export default SceneDetail
