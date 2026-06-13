import React, { useState } from 'react';
import { Card, Input, Button, List, Tag, App, Empty, Typography, Space } from 'antd';
import {
  AudioOutlined, SendOutlined, BulbOutlined,
  ThunderboltOutlined, RobotOutlined,
} from '@ant-design/icons';
import { voiceAPI } from '../../services/api';

const { Text } = Typography;
const { TextArea } = Input;

const VoiceControlPage: React.FC = () => {
  const { message } = App.useApp();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);

  const exampleCommands = [
    '打开客厅的灯',
    '把卧室温度调到26度',
    '关闭所有电器',
    '进入回家模式',
    '查看门锁状态',
    '设置早上7点的闹钟',
  ];

  const sendCommand = async (cmdText: string) => {
    if (!cmdText.trim()) return;
    const userMsg = { role: 'user', text: cmdText, time: new Date() };
    setHistory((h) => [...h, userMsg]);
    setText('');
    try {
      setLoading(true);
      const result: any = await voiceAPI.sendCommand({ text: cmdText, asrSource: 'manual' });
      const aiMsg = {
        role: 'ai',
        text: result.responseText || '指令已执行',
        parsed: result.parsed,
        devices: result.devices,
        time: new Date(),
      };
      setHistory((h) => [...h, aiMsg]);
    } catch (err: any) {
      const errMsg = { role: 'ai', text: err.message || '指令执行失败，请重试', error: true, time: new Date() };
      setHistory((h) => [...h, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendCommand(text);
    }
  };

  const simulateVoiceInput = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      const randomCmd = exampleCommands[Math.floor(Math.random() * exampleCommands.length)];
      setText(randomCmd);
      message.info('语音识别完成');
    }, 1500);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card title="语音控制" style={{ borderRadius: 8 }}>
        <div style={{
          textAlign: 'center',
          padding: '24px 0 32px',
          background: 'linear-gradient(135deg, #e6f4ff 0%, #f0f5ff 100%)',
          borderRadius: 8,
          marginBottom: 16,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: isListening ? '#ff4d4f' : '#1677ff',
            margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 36,
            cursor: 'pointer',
            transition: 'all 0.3s',
            transform: isListening ? 'scale(1.1)' : 'scale(1)',
            boxShadow: isListening ? '0 0 30px rgba(255, 77, 79, 0.5)' : '0 4px 12px rgba(22, 119, 255, 0.3)',
          }}
            onClick={simulateVoiceInput}
          >
            <AudioOutlined spin={isListening} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>
            {isListening ? '正在聆听...' : '点击开始语音控制'}
          </div>
          <Text type="secondary">支持天猫精灵、小爱同学等语音助手接入</Text>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>快捷指令</Text>
          <div style={{ marginTop: 8 }}>
            {exampleCommands.map((cmd, i) => (
              <Tag
                key={i}
                color="blue"
                style={{ cursor: 'pointer', padding: '4px 12px', marginBottom: 8 }}
                onClick={() => sendCommand(cmd)}
              >
                {cmd}
              </Tag>
            ))}
          </div>
        </div>

        <Card size="small" title="对话历史" styles={{ body: { padding: 0, maxHeight: 400, overflowY: 'auto' } }}>
          {history.length === 0 ? (
            <Empty description="还没有对话，试试说点什么吧" image={null} style={{ padding: '40px 0' }} />
          ) : (
            <List
              dataSource={history}
              renderItem={(item) => (
                <List.Item style={{
                  padding: '12px 16px',
                  background: item.role === 'user' ? '#fafafa' : '#fff',
                  borderBottom: '1px solid #f0f0f0',
                  justifyContent: item.role === 'user' ? 'flex-end' : 'flex-start',
                }}
                >
                  <div style={{ maxWidth: '75%' }}>
                    <Space align="start">
                      {item.role === 'ai' && (
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: '#1677ff', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <RobotOutlined />
                        </div>
                      )}
                      <div>
                        <div style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          background: item.role === 'user' ? '#e6f4ff' : '#f5f5f5',
                          color: item.error ? '#ff4d4f' : undefined,
                        }}>
                          {item.text}
                        </div>
                        {item.parsed && (
                          <div style={{ marginTop: 8, fontSize: 12 }}>
                            <Tag color="green">意图: {item.parsed.intent}</Tag>
                            {item.parsed.devices?.map((d: any, i: number) => (
                              <Tag key={i} color="blue">{d}</Tag>
                            ))}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: '#bfbfbf', marginTop: 4 }}>
                          {new Date(item.time).toLocaleTimeString()}
                        </div>
                      </div>
                      {item.role === 'user' && (
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: '#13c2c2', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          我
                        </div>
                      )}
                    </Space>
                  </div>
                </List.Item>
              )}
            />
          )}
        </Card>

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="输入指令，如：打开客厅灯"
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={loading}
            onClick={() => sendCommand(text)}
            style={{ height: 'auto', minHeight: 32 }}
          >
            发送
          </Button>
        </div>

        <Card size="small" title="支持的语音平台" style={{ marginTop: 16 }}>
          <Space wrap>
            <Tag color="purple" icon={<AudioOutlined />}>天猫精灵</Tag>
            <Tag color="orange" icon={<AudioOutlined />}>小爱同学</Tag>
            <Tag color="green" icon={<AudioOutlined />}>小度</Tag>
            <Tag color="blue" icon={<AudioOutlined />}>Siri</Tag>
            <Tag color="default" icon={<AudioOutlined />}>Google Home</Tag>
            <Tag color="red" icon={<AudioOutlined />}>Amazon Alexa</Tag>
          </Space>
        </Card>
      </Card>
    </div>
  );
};

export default VoiceControlPage;
