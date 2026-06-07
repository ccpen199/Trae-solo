import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, List, Avatar, Tag, message } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { citizenAPI } from '../../services/api';

function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: '您好！我是"小浙"智能助手，很高兴为您服务。请问有什么可以帮您的？您可以咨询办事预约、政策查询、企业服务等问题。'
    }
  ]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await citizenAPI.chat({
        message: input,
        sessionId
      });

      if (!sessionId) {
        setSessionId(res.data.sessionId);
      }

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.data.response,
        intent: res.data.intent,
        suggestions: res.data.suggestions
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      message.error('发送失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (suggestion) => {
    setInput(suggestion.text);
  };

  const quickQuestions = [
    '怎么办营业执照？',
    '怎么预约办事？',
    '有什么补贴政策？',
    '社保怎么办理？'
  ];

  return (
    <div>
      <Card title="🤖 小浙智能导办">
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`chat-message ${msg.role}`}>
                <div className="bubble">
                  {msg.role === 'assistant' && (
                    <div style={{ marginBottom: 8 }}>
                      <Tag color="blue">小浙助手</Tag>
                      {msg.intent && <Tag color="green">意图：{msg.intent}</Tag>}
                    </div>
                  )}
                  {msg.content}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {msg.suggestions.map((s, i) => (
                        <Button 
                          key={i} 
                          size="small" 
                          type={s.action === 'human' ? 'default' : 'primary'}
                          ghost={s.action !== 'human'}
                          onClick={() => handleSuggestion(s)}
                        >
                          {s.text}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message assistant">
                <div className="bubble">正在思考...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ color: '#999', marginBottom: 8 }}>快速提问：</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {quickQuestions.map(q => (
                  <Button key={q} onClick={() => setInput(q)}>
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="chat-input">
            <Input.TextArea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="请输入您的问题..."
              onPressEnter={e => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              autoSize={{ minRows: 1, maxRows: 4 }}
            />
            <Button 
              type="primary" 
              icon={<SendOutlined />} 
              onClick={handleSend}
              loading={loading}
              size="large"
            >
              发送
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Chat;
