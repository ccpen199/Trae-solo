import React, { useState, useEffect, useRef } from 'react'
import {
  AcademicCapIcon,
  PaperAirplaneIcon,
  PlayIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'
import { aiAPI } from '../api/client'

const positions = [
  { value: 'frontend', label: '前端开发' },
  { value: 'backend', label: '后端开发' },
  { value: 'product', label: '产品经理' },
  { value: 'design', label: 'UI设计' },
]

const AIInterview = () => {
  const [position, setPosition] = useState('frontend')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [score, setScore] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await aiAPI.getInterviewSessions()
        setSessions(res.data || [])
      } catch (err) {}
    }
    fetchSessions()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleStart = async () => {
    setLoading(true)
    setError('')
    setMessages([])
    setCompleted(false)
    setScore(null)
    setFeedback('')
    try {
      const res = await aiAPI.startInterview(position)
      setSessionId(res.data.sessionId || res.data.id)
      setMessages([
        { role: 'assistant', content: res.data.message || res.data.question || '面试开始，请自我介绍一下' },
      ])
    } catch (err) {
      setError(err.response?.data?.message || '启动面试失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setSending(true)
    try {
      const res = await aiAPI.sendInterviewMessage({
        sessionId,
        message: userMsg,
      })
      if (res.data.completed || res.data.finished) {
        setCompleted(true)
        setScore(res.data.score)
        setFeedback(res.data.feedback || '')
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.message || res.data.question || '' },
      ])
    } catch (err) {
      setError(err.response?.data?.message || '发送消息失败')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">AI面试</h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {!sessionId && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">选择面试岗位</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {positions.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPosition(p.value)}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      position === p.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <AcademicCapIcon className="w-6 h-6 mx-auto mb-1" />
                    <span className="text-sm font-medium">{p.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={handleStart}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
              >
                <PlayIcon className="w-5 h-5" />
                {loading ? '启动中...' : '开始面试'}
              </button>
            </div>
          )}

          {sessionId && (
            <div className="bg-white rounded-xl border border-gray-100 flex flex-col" style={{ height: '500px' }}>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-indigo-500" />
                  <span className="font-medium text-gray-700">面试对话</span>
                </div>
                {completed && (
                  <span className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded">已结束</span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-lg text-sm ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-400 px-4 py-2.5 rounded-lg text-sm">
                      正在输入...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {!completed && (
                <div className="p-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="输入你的回答..."
                      disabled={sending}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-gray-50"
                    />
                    <button
                      onClick={handleSend}
                      disabled={sending || !input.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
                    >
                      <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {completed && score !== null && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrophyIcon className="w-6 h-6 text-yellow-500" />
                面试结果
              </h3>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full border-4 border-indigo-500 flex items-center justify-center">
                    <span className="text-3xl font-bold text-indigo-600">{score}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">综合评分</p>
                </div>
                <div className="flex-1">
                  <p className="text-gray-600">{feedback}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">历史会话</h3>
          {sessions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">暂无历史记录</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id || s.sessionId} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {positions.find((p) => p.value === s.position)?.label || s.position}
                    </span>
                    {s.score !== undefined && (
                      <span className="text-sm text-indigo-600 font-medium">{s.score}分</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{s.createdAt}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIInterview
