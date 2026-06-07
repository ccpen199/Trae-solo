import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Card,
  Button,
  Descriptions,
  Image,
  Tag,
  Spin,
  Row,
  Col,
  Empty,
  message,
  Input,
  Modal,
  List,
  Avatar,
  Divider,
  Radio,
  Space,
  Steps,
  Checkbox
} from 'antd'
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SendOutlined,
  SafetyCertificateOutlined,
  DownloadOutlined,
  PrinterOutlined
} from '@ant-design/icons'
import type { RadioChangeEvent } from 'antd/es/radio'
import dayjs from 'dayjs'
import { getAccidentDetail } from '@/api/modules/accident'
import type { AccidentRecord } from '@/types'

const { Step } = Steps

const statusMap: Record<string, { text: string; color: string }> = {
  negotiating: { text: '协商中', color: 'blue' },
  determined: { text: '责任认定', color: 'orange' },
  completed: { text: '已完成', color: 'green' }
}

interface ChatMessage {
  id: number
  sender: 'me' | 'other' | 'officer'
  content: string
  timestamp: string
  name: string
}

export default function AccidentDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<AccidentRecord | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [liability, setLiability] = useState('')
  const [certificateModal, setCertificateModal] = useState(false)
  const [signatureModal, setSignatureModal] = useState(false)
  const [signed, setSigned] = useState(false)
  const [signing, setSigning] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const signatureRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const fetchDetail = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await getAccidentDetail(parseInt(id))
      setDetail(res)
    } catch (error: any) {
      message.error(error.message || '获取详情失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [id])

  useEffect(() => {
    setMessages([
      {
        id: 1,
        sender: 'me',
        content: '你好，关于本次事故我们协商一下处理方案',
        timestamp: dayjs().subtract(10, 'minute').format('YYYY-MM-DD HH:mm'),
        name: '我（甲方）'
      },
      {
        id: 2,
        sender: 'other',
        content: '好的，我这边也想了解一下具体情况',
        timestamp: dayjs().subtract(8, 'minute').format('YYYY-MM-DD HH:mm'),
        name: '对方（乙方）'
      },
      {
        id: 3,
        sender: 'me',
        content: '我认为是您的车变道时没有注意后方车辆',
        timestamp: dayjs().subtract(5, 'minute').format('YYYY-MM-DD HH:mm'),
        name: '我（甲方）'
      },
      {
        id: 4,
        sender: 'other',
        content: '我同意协商解决吧，我这边有保险，可以走保险处理',
        timestamp: dayjs().subtract(3, 'minute').format('YYYY-MM-DD HH:mm'),
        name: '对方（乙方）'
      }
    ])
  }, [])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const msg: ChatMessage = {
      id: messages.length + 1,
      sender: 'me',
      content: newMessage,
      timestamp: dayjs().format('YYYY-MM-DD HH:mm'),
      name: '我（甲方）'
    }

    setMessages([...messages, msg])
    setNewMessage('')

    setTimeout(() => {
      const reply: ChatMessage = {
        id: messages.length + 2,
        sender: 'other',
        content: '好的，我知道了',
        timestamp: dayjs().format('YYYY-MM-DD HH:mm'),
        name: '对方（乙方）'
      }
      setMessages(prev => [...prev, reply])
    }, 2000)
  }

  const handleLiabilityChange = (e: RadioChangeEvent) => {
    setLiability(e.target.value)
  }

  const handleDetermineLiability = async () => {
    if (!liability) {
      message.warning('请选择责任划分')
      return
    }
    setCertificateModal(true)
  }

  const handleGenerateCertificate = async () => {
    setCertificateModal(false)
    message.success('责任认定书已生成')
    setSignatureModal(true)
  }

  const initSignatureCanvas = () => {
    const canvas = signatureRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }

  useEffect(() => {
    if (signatureModal) {
      setTimeout(initSignatureCanvas, 100)
    }
  }, [signatureModal])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true
    const canvas = signatureRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    lastPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    const canvas = signatureRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(x, y)
    ctx.stroke()

    lastPos.current = { x, y }
  }

  const stopDrawing = () => {
    isDrawing.current = false
  }

  const clearSignature = () => {
    initSignatureCanvas()
  }

  const handleSign = async () => {
    const canvas = signatureRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const isEmpty = imageData.data.every((channel, i) => i % 4 === 3 || channel === 255)

    if (isEmpty) {
      message.warning('请先签名')
      return
    }

    if (!agreed) {
      message.warning('请确认协议内容')
      return
    }

    setSigning(true)
    setTimeout(() => {
      setSigning(false)
      setSigned(true)
      setSignatureModal(false)
      message.success('电子签章完成')
    }, 1500)
  }

  const handleComplete = async () => {
    if (!signed) {
      message.warning('请先完成电子签章')
      return
    }
    message.success('事故处理完成')
    navigate('/accident/list')
  }

  const handleDownloadCertificate = () => {
    message.success('认定书已开始下载')
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card className="shadow-sm">
          <div className="flex justify-center py-20">
            <Spin spinning={true} />
          </div>
        </Card>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="p-6">
        <Card className="shadow-sm">
          <Empty description="事故记录不存在" />
        </Card>
      </div>
    )
  }

  const statusInfo = statusMap[detail.status]

  return (
    <div className="p-6">
      <Card className="shadow-sm mb-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/accident/list')}
          >
            返回列表
          </Button>
          <h1 className="text-xl font-semibold text-gray-800">事故详情</h1>
          <Tag color={statusInfo.color} className="ml-auto">
            {statusInfo.text}
          </Tag>
        </div>

        <Descriptions column={2} bordered>
          <Descriptions.Item label="案件编号" span={1}>
            <Tag color="blue">{detail.caseNo}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="事故时间" span={1}>
            <Space>
              <ClockCircleOutlined className="text-gray-400" />
              <span>{dayjs(detail.accidentTime).format('YYYY-MM-DD HH:mm:ss')}</span>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="事故地点" span={2}>
            <Space>
              <EnvironmentOutlined className="text-gray-400" />
              <span>{detail.location || '未知位置'}</span>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="甲方" span={1}>
            <Space>
              <UserOutlined className="text-blue-500" />
              <span>张三 (我)</span>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="乙方" span={1}>
            <Space>
              <UserOutlined className="text-orange-500" />
              <span>李四</span>
            </Space>
          </Descriptions.Item>
          {detail.liability && (
            <Descriptions.Item label="责任划分" span={2}>
              {detail.liability}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Row gutter={24}>
        <Col xs={24} md={14}>
          <Card title="三方协商" className="shadow-sm mb-6">
            <div
              ref={chatRef}
              className="h-80 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg"
            >
              <List
                dataSource={messages}
                renderItem={(item) => (
                  <List.Item className="border-none px-0">
                    <div className={`flex ${item.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-2 max-w-xs ${item.sender === 'me' ? 'flex-row-reverse' : ''}`}>
                        <Avatar
                          style={{
                            backgroundColor:
                              item.sender === 'me'
                                ? '#1677ff'
                                : item.sender === 'other'
                                ? '#fa8c16'
                                : '#52c41a'
                          }}
                          icon={<UserOutlined />}
                        />
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            {item.name} {item.timestamp}
                          </div>
                          <div
                            className={`p-3 rounded-lg ${
                              item.sender === 'me' ? 'bg-blue-100' : 'bg-white border'
                            }`}
                          >
                            {item.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="输入消息..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onPressEnter={handleSendMessage}
              />
              <Button type="primary" icon={<SendOutlined />} onClick={handleSendMessage}>
                发送
              </Button>
            </div>
          </Card>

          <Card title="现场照片" className="shadow-sm">
            <Image.PreviewGroup>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="relative aspect-video rounded-lg overflow-hidden bg-gray-100"
                  >
                    <Image
                      src={`https://picsum.photos/400/300?random=${index}`}
                      alt={`现场照片 ${index}`}
                      className="w-full h-full object-cover cursor-pointer"
                      preview
                    />
                  </div>
                ))}
              </div>
            </Image.PreviewGroup>
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card title="责任认定" className="shadow-sm mb-6">
            <Steps
              direction="vertical"
              current={
                detail.status === 'completed'
                  ? 3
                  : detail.status === 'determined'
                  ? 2
                  : 1
              }
            >
              <Step title="报案" description="事故已报案" />
              <Step title="协商" description="双方协商中" />
              <Step title="认定" description="等待责任认定" />
              <Step title="完成" description="处理完成" />
            </Steps>
          </Card>

          {detail.status === 'negotiating' && (
            <Card title="责任划分选择" className="shadow-sm mb-6">
              <Radio.Group onChange={handleLiabilityChange} value={liability}>
                <Space direction="vertical">
                  <Radio value="甲方全责">甲方全责</Radio>
                  <Radio value="乙方全责">乙方全责</Radio>
                  <Radio value="同等责任">同等责任</Radio>
                  <Radio value="甲方主责，乙方次责">甲方主责，乙方次责</Radio>
                  <Radio value="乙方主责，甲方次责">乙方主责，甲方次责</Radio>
                </Space>
              </Radio.Group>
              <Divider />
              <Button type="primary" block onClick={handleDetermineLiability}>
                生成责任认定书
              </Button>
            </Card>
          )}

          {detail.status === 'determined' && (
            <Card title="电子签章" className="shadow-sm mb-6">
              <div className="text-center mb-4">
                <SafetyCertificateOutlined className="text-4xl text-blue-500 mb-2" />
                <p>责任认定书已生成，请完成电子签章</p>
              </div>
              <Space direction="vertical" className="w-full">
                <Button type="primary" block onClick={() => setSignatureModal(true)}>
                  进行电子签章
                </Button>
                <Button block icon={<DownloadOutlined />} onClick={handleDownloadCertificate}>
                  预览认定书
                </Button>
              </Space>
            </Card>
          )}

          {detail.status === 'completed' && (
            <Card title="处理完成" className="shadow-sm mb-6">
              <div className="text-center">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-green-600 font-semibold mb-4">事故处理已完成</p>
                <Space direction="vertical" className="w-full">
                  <Button
                    type="primary"
                    block
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadCertificate}
                  >
                    下载责任认定书
                  </Button>
                  <Button block icon={<PrinterOutlined />}>
                    打印认定书
                  </Button>
                </Space>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        title="责任认定书预览"
        open={certificateModal}
        onCancel={() => setCertificateModal(false)}
        onOk={handleGenerateCertificate}
        okText="确认生成"
        width={700}
      >
        <div className="p-6 bg-gray-50 rounded-lg">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">道路交通事故责任认定书</h2>
            <p className="text-gray-500">编号：{detail.caseNo}</p>
          </div>
          <Divider />
          <div className="space-y-4">
            <div>
              <p>
                <strong>事故时间：</strong>
                {dayjs(detail.accidentTime).format('YYYY年MM月DD日 HH时mm分')}
              </p>
              <p>
                <strong>事故地点：</strong>
                {detail.location}
              </p>
            </div>
            <Divider />
            <div>
              <p>
                <strong>当事人甲方：</strong>张三
              </p>
              <p>
                <strong>当事人乙方：</strong>李四
              </p>
            </div>
            <Divider />
            <div>
              <p>
                <strong>责任划分：</strong>
                {liability || '（待确认）'}
              </p>
            </div>
            <Divider />
            <div className="text-sm text-gray-600">
              <p>根据《中华人民共和国道路交通安全法》等相关法律法规规定，作出如上责任认定。</p>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title="电子签章"
        open={signatureModal}
        onCancel={() => setSignatureModal(false)}
        footer={[
          <Button key="clear" onClick={clearSignature}>
            清除签名
          </Button>,
          <Button key="sign" type="primary" loading={signing} onClick={handleSign}>
            确认签章
          </Button>
        ]}
        width={600}
      >
        <div className="space-y-4">
          <div className="text-center">
            <p className="mb-2">请在下方签名区域签名</p>
            <canvas
              ref={signatureRef}
              width={500}
              height={200}
              className="border-2 border-gray-300 rounded-lg cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
          <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)}>
            我已阅读并确认责任认定书内容，同意上述责任认定结果
          </Checkbox>
        </div>
      </Modal>
    </div>
  )
}
