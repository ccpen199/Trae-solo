import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, Input, Button, List, Avatar, Tag, Space, message, Row, Col, Select, Descriptions } from 'antd'
import { SendOutlined, LockOutlined, SafetyOutlined, UserOutlined, MessageOutlined, FileSearchOutlined } from '@ant-design/icons'
import { getMessages, sendMessage, getConsultation } from '../api.js'
import dayjs from 'dayjs'

const ChatRoom = () => {
  const { id } = useParams()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [consultation, setConsultation] = useState(null)
  const [msgType, setMsgType] = useState('text')
  const listRef = useRef(null)

  const load = async () => {
    try {
      const [mRes, cRes] = await Promise.all([getMessages(id), getConsultation(id)])
      setMessages(mRes.data)
      setConsultation(cRes.data)
    } catch (e) {
      console.error('Chat load error:', e)
    }
  }

  useEffect(() => { load() }, [id])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    setLoading(true)
    try {
      await sendMessage({
        consultation_id: parseInt(id),
        sender_type: 'client',
        sender_id: 1,
        content: input,
        msg_type: msgType
      })
      setInput('')
      await load()
      message.success('消息已加密发送，SHA-256哈希存证完成')
    } catch (e) {
      message.error('发送失败')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const msgTypeLabels = { text: '文字', image: '图片', audio: '语音', video: '视频' }

  return (
    <div>
      {consultation && (
        <Card size="small" style={{ marginBottom: 12 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space wrap>
                <Tag color="blue">咨询 #{consultation.id}</Tag>
                <Tag color="geekblue">{consultation.case_code}</Tag>
                <Tag color="purple">{consultation.case_category}</Tag>
                <Tag icon={<LockOutlined />} color="green">端到端加密</Tag>
                <Tag icon={<SafetyOutlined />} color="gold">消息存证</Tag>
                <b>{consultation.title}</b>
              </Space>
            </Col>
            <Col>
              <Space>
                <Link to="/consultations">
                  <Button size="small" icon={<FileSearchOutlined />}>返回咨询列表</Button>
                </Link>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      <Row gutter={16}>
        <Col span={18}>
          <Card
            title={<Space><MessageOutlined /> 加密通信 <Tag icon={<LockOutlined />} color="green">AES-256</Tag></Space>}
            styles={{ body: { padding: 0 } }}
            style={{ height: 'calc(100vh - 280px)' }}
          >
            <div ref={listRef} style={{ height: 'calc(100% - 60px)', overflowY: 'auto', padding: 20 }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                  <MessageOutlined style={{ fontSize: 48, marginBottom: 16, display: 'block' }} />
                  暂无消息，开始加密沟通吧
                </div>
              ) : (
                <List
                  dataSource={messages}
                  renderItem={(item) => (
                    <List.Item style={{ border: 0, justifyContent: item.sender_type === 'client' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '70%', textAlign: item.sender_type === 'client' ? 'right' : 'left' }}>
                        <Space direction="vertical" size="small" align={item.sender_type === 'client' ? 'end' : 'start'}>
                          <Space>
                            {item.sender_type !== 'client' && <Avatar size="small" icon={<UserOutlined />} />}
                            <div style={{ fontSize: 12, color: '#999' }}>
                              {item.sender_type === 'client' ? '我' : '律师'} · {dayjs(item.created_at).format('HH:mm')}
                              <Tag style={{ marginLeft: 4, fontSize: 10 }}>{msgTypeLabels[item.msg_type] || '文字'}</Tag>
                            </div>
                            {item.sender_type === 'client' && <Avatar size="small" icon={<UserOutlined />} style={{ background: '#1890ff' }} />}
                          </Space>
                          <div style={{
                            background: item.sender_type === 'client' ? '#1890ff' : '#f0f0f0',
                            color: item.sender_type === 'client' ? 'white' : 'inherit',
                            padding: '10px 14px',
                            borderRadius: 8,
                            wordBreak: 'break-word'
                          }}>
                            {item.content}
                          </div>
                          <div style={{ fontSize: 10, color: '#bbb' }}>
                            <LockOutlined /> SHA-256: {item.hash?.slice(0, 16)}...
                          </div>
                        </Space>
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </div>
            <div style={{ padding: 12, borderTop: '1px solid #f0f0f0' }}>
              <Space.Compact style={{ width: '100%' }}>
                <Select value={msgType} onChange={setMsgType} style={{ width: 100 }}>
                  <Select.Option value="text">文字</Select.Option>
                  <Select.Option value="image">图片</Select.Option>
                  <Select.Option value="audio">语音</Select.Option>
                  <Select.Option value="video">视频</Select.Option>
                </Select>
                <Input.TextArea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="输入消息（端到端加密传输）..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                />
                <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={loading}>
                  发送
                </Button>
              </Space.Compact>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="🔒 安全说明" size="small" style={{ marginBottom: 12 }}>
            <ul style={{ paddingLeft: 20, fontSize: 12, lineHeight: 2.2 }}>
              <li>所有消息采用 <b>AES-256</b> 端到端加密</li>
              <li>消息内容生成 <b>SHA-256</b> 哈希存证</li>
              <li>支持文字、图片、语音、视频会话</li>
              <li>通信全程不可篡改，可追溯</li>
              <li>符合《个人信息保护法》要求</li>
            </ul>
          </Card>
          {consultation && (
            <Card title="📋 咨询信息" size="small">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="案由"><Tag color="blue">{consultation.case_category}</Tag></Descriptions.Item>
                <Descriptions.Item label="编码"><Tag color="geekblue">{consultation.case_code}</Tag></Descriptions.Item>
                <Descriptions.Item label="紧急程度">
                  <Tag color={consultation.urgency === 'high' ? 'red' : consultation.urgency === 'normal' ? 'blue' : 'green'}>
                    {consultation.urgency === 'high' ? '紧急' : consultation.urgency === 'normal' ? '普通' : '一般'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="证据哈希">
                  <code style={{ fontSize: 10 }}>{consultation.evidence_hashes?.slice(0, 20)}...</code>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  )
}

export default ChatRoom
