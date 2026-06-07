import { useState, useEffect, useRef } from 'react'
import { Input, Button, Card, Tag, Spin, Empty, Avatar } from 'antd'
import {
  SendOutlined,
  CarOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  FileTextOutlined,
  RobotOutlined,
  UserOutlined,
  DeleteOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import api from '../api'
import type { ChatMessage, DriverArchive, VehicleArchive, EbikeArchive } from '../types'

const quickQuestions = [
  { key: 'driver', label: '查驾照分', icon: <SafetyCertificateOutlined /> },
  { key: 'vehicle', label: '查机动车状态', icon: <CarOutlined /> },
  { key: 'ebike', label: '查电动车', icon: <ThunderboltOutlined /> },
  { key: 'appointment', label: '预约咨询', icon: <CalendarOutlined /> },
  { key: 'permit', label: '进京证咨询', icon: <FileTextOutlined /> }
]

interface ArchiveData {
  type: 'driver' | 'vehicle' | 'ebike'
  data: DriverArchive | VehicleArchive | EbikeArchive
}

export default function Chatbot() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [archiveData, setArchiveData] = useState<ArchiveData | null>(null)
  const [sessions, setSessions] = useState<Array<{ id: number; sessionId: string; createdAt: string }>>([])
  const [showHistory, setShowHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadSessions()
    startNewSession()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadSessions = async () => {
    try {
      const data = await api.chatbot.getSessionList()
      setSessions(data.map(s => ({ id: s.id, sessionId: s.sessionId, createdAt: s.createdAt })))
    } catch (error) {
      console.error('加载会话列表失败:', error)
    }
  }

  const startNewSession = () => {
    setSessionId('')
    setMessages([
      {
        role: 'assistant',
        content: '您好！我是智能交管助手，请问有什么可以帮您？您可以点击下方快捷按钮或直接输入问题进行咨询。',
        timestamp: new Date().toISOString()
      }
    ])
    setArchiveData(null)
  }

  const handleQuickQuestion = async (key: string) => {
    const question = quickQuestions.find(q => q.key === key)
    if (question) {
      await sendMessage(question.label)
    }
  }

  const handleSend = async () => {
    if (!message.trim()) return
    await sendMessage(message.trim())
    setMessage('')
  }

  const sendMessage = async (content: string) => {
    setLoading(true)
    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])
    setArchiveData(null)

    try {
      const response = await api.chatbot.sendMessage({
        message: content,
        sessionId: sessionId || undefined
      })
      
      if (!sessionId) {
        setSessionId(response.sessionId)
        loadSessions()
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, assistantMessage])

      if (content.includes('驾照') || content.includes('驾驶证') || content.includes('driver')) {
        setArchiveData({
          type: 'driver',
          data: {
            id: 1,
            idCardNo: '110101********1234',
            licenseNumber: '110101******1234',
            licenseType: 'C1',
            issueDate: '2018-05-20',
            score: 9,
            status: '正常'
          }
        })
      } else if (content.includes('机动车') || content.includes('车辆') || content.includes('vehicle')) {
        setArchiveData({
          type: 'vehicle',
          data: {
            id: 1,
            plateNumber: '京A12345',
            idCardNo: '110101********1234',
            vehicleType: '小型轿车',
            frameNumber: 'LSV******1234',
            registerDate: '2020-03-15',
            inspectionStatus: '已年检'
          }
        })
      } else if (content.includes('电动车') || content.includes('ebike')) {
        setArchiveData({
          type: 'ebike',
          data: {
            id: 1,
            plateNumber: '京A123456',
            idCardNo: '110101********1234',
            frameNumber: '1234567890',
            registerDate: '2023-01-10',
            status: '已登记'
          }
        })
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '抱歉，服务暂时不可用，请稍后再试。',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const loadSessionHistory = async (sid: string) => {
    try {
      const history = await api.chatbot.getSessionHistory(sid)
      setSessionId(sid)
      setMessages(history)
      setShowHistory(false)
    } catch (error) {
      console.error('加载历史记录失败:', error)
    }
  }

  const deleteSession = async (sid: string) => {
    try {
      await api.chatbot.deleteSession(sid)
      loadSessions()
      if (sessionId === sid) {
        startNewSession()
      }
    } catch (error) {
      console.error('删除会话失败:', error)
    }
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  const renderArchiveCard = () => {
    if (!archiveData) return null

    if (archiveData.type === 'driver') {
      const data = archiveData.data as DriverArchive
      return (
        <Card size="small" className="mt-2 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <SafetyCertificateOutlined className="text-blue-500" />
            <span className="font-medium text-blue-700">驾驶证信息</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">证号：</span>
              <span>{data.licenseNumber}</span>
            </div>
            <div>
              <span className="text-gray-500">类型：</span>
              <span>{data.licenseType}</span>
            </div>
            <div>
              <span className="text-gray-500">初领日期：</span>
              <span>{data.issueDate}</span>
            </div>
            <div>
              <span className="text-gray-500">状态：</span>
              <Tag color={data.status === '正常' ? 'green' : 'orange'}>{data.status}</Tag>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">当前记分：</span>
              <span className={`font-bold ${data.score >= 9 ? 'text-green-600' : data.score >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                {data.score} 分
              </span>
              {data.score < 6 && (
                <Tag color="red" className="ml-2">
                  ⚠️ 风险提示：请注意遵守交通规则，剩余记分不足
                </Tag>
              )}
            </div>
          </div>
        </Card>
      )
    }

    if (archiveData.type === 'vehicle') {
      const data = archiveData.data as VehicleArchive
      return (
        <Card size="small" className="mt-2 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CarOutlined className="text-green-500" />
            <span className="font-medium text-green-700">机动车信息</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">号牌：</span>
              <span className="font-medium">{data.plateNumber}</span>
            </div>
            <div>
              <span className="text-gray-500">类型：</span>
              <span>{data.vehicleType}</span>
            </div>
            <div>
              <span className="text-gray-500">车架号：</span>
              <span>{data.frameNumber}</span>
            </div>
            <div>
              <span className="text-gray-500">注册日期：</span>
              <span>{data.registerDate}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">年检状态：</span>
              <Tag color={data.inspectionStatus === '已年检' ? 'green' : 'red'}>{data.inspectionStatus}</Tag>
              {data.inspectionStatus !== '已年检' && (
                <Tag color="red" className="ml-2">
                  ⚠️ 风险提示：请及时办理年检手续
                </Tag>
              )}
            </div>
          </div>
        </Card>
      )
    }

    if (archiveData.type === 'ebike') {
      const data = archiveData.data as EbikeArchive
      return (
        <Card size="small" className="mt-2 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <ThunderboltOutlined className="text-yellow-600" />
            <span className="font-medium text-yellow-700">电动车信息</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">号牌：</span>
              <span className="font-medium">{data.plateNumber}</span>
            </div>
            <div>
              <span className="text-gray-500">车架号：</span>
              <span>{data.frameNumber}</span>
            </div>
            <div>
              <span className="text-gray-500">登记日期：</span>
              <span>{data.registerDate}</span>
            </div>
            <div>
              <span className="text-gray-500">状态：</span>
              <Tag color={data.status === '已登记' ? 'green' : 'orange'}>{data.status}</Tag>
            </div>
          </div>
        </Card>
      )
    }

    return null
  }

  return (
    <div className="flex h-[calc(100vh-80px)]">
      <div className={`transition-all duration-300 ${showHistory ? 'w-64' : 'w-0'} overflow-hidden bg-gray-50 border-r`}>
        <div className="p-4 border-b flex items-center justify-between">
          <span className="font-medium">历史对话</span>
          <Button type="text" size="small" icon={<DeleteOutlined />} onClick={startNewSession}>
            新建
          </Button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-60px)]">
          {sessions.length === 0 ? (
            <Empty description="暂无历史记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`p-3 cursor-pointer hover:bg-gray-100 border-b flex items-center justify-between ${sessionId === session.sessionId ? 'bg-blue-50' : ''}`}
                onClick={() => loadSessionHistory(session.sessionId)}
              >
                <div className="flex-1 overflow-hidden">
                  <div className="text-sm font-medium truncate">会话 {session.id}</div>
                  <div className="text-xs text-gray-500">{new Date(session.createdAt).toLocaleDateString()}</div>
                </div>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSession(session.sessionId)
                  }}
                />
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-3 border-b bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RobotOutlined className="text-2xl text-blue-500" />
            <div>
              <div className="font-medium">智能交管助手</div>
              <div className="text-xs text-gray-500">24小时在线服务</div>
            </div>
          </div>
          <Button
            type="text"
            icon={<HistoryOutlined />}
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? '隐藏' : '历史'}
          </Button>
        </div>

        <div className="p-3 border-b bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q) => (
              <Button
                key={q.key}
                size="small"
                icon={q.icon}
                onClick={() => handleQuickQuestion(q.key)}
                className="mb-1"
              >
                {q.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <Avatar icon={<RobotOutlined />} className="mr-2" style={{ backgroundColor: '#1677ff' }} />
              )}
              <div className={`max-w-[70%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                <div
                  className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white border rounded-bl-none'}`}
                >
                  {msg.content}
                </div>
                <div className={`text-xs text-gray-400 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {formatTime(msg.timestamp)}
                </div>
                {msg.role === 'assistant' && index === messages.length - 1 && renderArchiveCard()}
              </div>
              {msg.role === 'user' && (
                <Avatar icon={<UserOutlined />} className="ml-2" style={{ backgroundColor: '#52c41a' }} />
              )}
            </div>
          ))}
          {loading && (
            <div className="flex mb-4 justify-start">
              <Avatar icon={<RobotOutlined />} className="mr-2" style={{ backgroundColor: '#1677ff' }} />
              <div className="p-3 rounded-lg bg-white border rounded-bl-none">
                <Spin size="small" /> 正在思考...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t bg-white">
          <div className="flex gap-2">
            <Input.TextArea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="请输入您的问题..."
              autoSize={{ minRows: 1, maxRows: 3 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              className="flex-1"
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={loading}
              disabled={!message.trim()}
            >
              发送
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
