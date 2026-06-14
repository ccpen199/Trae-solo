import { useState, useRef, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  List,
  Avatar,
  Empty,
  Typography,
  message,
  Modal,
  Rate,
  Tooltip,
  Tag,
  Space,
  Divider,
} from 'antd';
import {
  SendOutlined,
  AudioOutlined,
  UserOutlined,
  RobotOutlined,
  CustomerServiceOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined,
  LikeOutlined,
  DislikeOutlined,
} from '@ant-design/icons';
import useRequest from '../../hooks/useRequest';
import {
  submitConsultation,
  getConsultationHistory,
  submitConsultationSatisfaction,
} from '../../api/policy';

const { Title, Text } = Typography;

const quickQuestions = [
  '养老保险如何转移接续？',
  '失业金怎么申请？',
  '社保缴费基数怎么算？',
  '退休年龄是多少？',
  '医保报销比例是多少？',
  '技能提升补贴怎么领？',
];

const mockHistory = [
  {
    id: 1,
    question: '养老保险缴费年限不够怎么办？',
    preview: '您可以选择一次性补缴或继续缴费至满15年...',
    time: '2024-01-15 14:30',
  },
  {
    id: 2,
    question: '失业保险金领取条件是什么？',
    preview: '失业前用人单位和本人已经缴纳失业保险费满一年...',
    time: '2024-01-14 10:20',
  },
  {
    id: 3,
    question: '工伤认定需要哪些材料？',
    preview: '工伤认定申请表、与用人单位存在劳动关系的证明材料...',
    time: '2024-01-12 16:45',
  },
];

const mockAIResponse = (question) => {
  const responses = {
    '养老保险如何转移接续？': `您好！养老保险转移接续的流程如下：

1. **申请**：参保人员在新就业地按规定建立基本养老保险关系和缴费后，由用人单位或参保人员向新参保地社保经办机构提出基本养老保险关系转移接续的书面申请。

2. **审核**：新参保地社保经办机构在15个工作日内，审核转移接续申请，对符合本办法规定条件的，向参保人员原基本养老保险关系所在地的社保经办机构发出同意接收函，并提供相关信息；对不符合转移接续条件的，向申请单位或参保人员作出书面说明。

3. **转移**：原基本养老保险关系所在地社保经办机构在接到同意接收函的15个工作日内，办理好转移接续的各项手续。

4. **接续**：新参保地经办机构在收到参保人员原基本养老保险关系所在地社保经办机构转移的基本养老保险关系和资金后，应在15个工作日内办结有关手续，并将确认情况及时通知用人单位或参保人员。

如需更多帮助，您可以拨打12333人社服务热线咨询。`,
    '失业金怎么申请？': `您好！失业保险金申领流程如下：

**申领条件：**
1. 失业前用人单位和本人已经缴纳失业保险费满一年的
2. 非因本人意愿中断就业的
3. 已经进行失业登记，并有求职要求的

**申领材料：**
1. 本人身份证明
2. 所在单位出具的终止或者解除劳动合同的证明
3. 失业登记
4. 省级劳动保障行政部门规定的其他材料

**申领渠道：**
1. 线上：国家社会保险公共服务平台、掌上12333APP
2. 线下：当地社保经办机构服务窗口

失业保险金的标准，由省、自治区、直辖市人民政府确定，不得低于城市居民最低生活保障标准。`,
    '社保缴费基数怎么算？': `您好！社保缴费基数的计算方式如下：

**缴费基数确定：**
1. 职工个人缴费基数原则上以上一年度本人月平均工资为基础
2. 工资总额包括：计时工资、计件工资、奖金、津贴和补贴、加班加点工资、特殊情况下支付的工资
3. 缴费基数上限：全省全口径城镇单位就业人员平均工资的300%
4. 缴费基数下限：全省全口径城镇单位就业人员平均工资的60%

**缴费比例（以2024年为例）：**
- 养老保险：单位16%，个人8%
- 医疗保险：单位8%，个人2%
- 失业保险：单位1%，个人0.5%
- 工伤保险：单位0.2%-1.9%（按行业风险分类），个人不缴费
- 生育保险：单位0.8%，个人不缴费

每年的缴费基数会根据上年度社会平均工资进行调整，请关注当地社保部门的通知。`,
    'default': `您好！感谢您的咨询。关于您提出的"${question}"问题，我正在为您查询相关政策信息。

根据您的问题，建议您参考以下方面：
1. 查阅相关政策法规文件
2. 关注当地人社部门发布的最新通知
3. 拨打12333人社服务热线进行详细咨询

如果您需要更具体的解答，请提供更多详细信息，我会尽力为您服务。

您也可以点击右侧的"转人工客服"按钮，与专业客服人员进行一对一沟通。`,
  };
  return responses[question] || responses['default'];
};

const Consultation = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'ai',
      content: '您好！我是智能政策顾问，很高兴为您服务。请问有什么可以帮助您的？',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [satisfactionModalVisible, setSatisfactionModalVisible] = useState(false);
  const [currentAnswerId, setCurrentAnswerId] = useState(null);
  const [satisfaction, setSatisfaction] = useState(5);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { loading: historyLoading, data: historyData } = useRequest(getConsultationHistory, {
    onError: () => {
      message.error('获取咨询历史失败');
    },
  });

  const { run: sendMessage } = useRequest(submitConsultation, {
    manual: true,
    onError: () => {
      message.error('发送消息失败');
    },
  });

  const { run: submitSatisfaction } = useRequest(submitConsultationSatisfaction, {
    manual: true,
    onError: () => {
      message.error('提交评价失败');
    },
  });

  const displayHistory = historyData?.list || mockHistory;

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) {
      message.warning('请输入您的问题');
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      await sendMessage({ question: inputValue });

      setTimeout(() => {
        const aiResponse = {
          id: Date.now() + 1,
          role: 'ai',
          content: mockAIResponse(inputValue),
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiResponse]);
        setIsTyping(false);
        setCurrentAnswerId(aiResponse.id);

        setTimeout(() => {
          setSatisfactionModalVisible(true);
        }, 1000);
      }, 1500);
    } catch (error) {
      setIsTyping(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setInputValue(question);
    inputRef.current?.focus();
  };

  const handleHistoryClick = (item) => {
    setSelectedHistoryId(item.id);
    setMessages([
      {
        id: Date.now(),
        role: 'user',
        content: item.question,
        time: item.time,
      },
      {
        id: Date.now() + 1,
        role: 'ai',
        content: item.preview,
        time: item.time,
      },
    ]);
  };

  const handleNewChat = () => {
    setSelectedHistoryId(null);
    setMessages([
      {
        id: Date.now(),
        role: 'ai',
        content: '您好！我是智能政策顾问，很高兴为您服务。请问有什么可以帮助您的？',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleTransferHuman = () => {
    message.info('正在为您转接人工客服，请稍候...');
  };

  const handleSubmitSatisfaction = async () => {
    if (currentAnswerId) {
      await submitSatisfaction(currentAnswerId, { satisfaction });
    }
    message.success('感谢您的评价！');
    setSatisfactionModalVisible(false);
    setSatisfaction(5);
    setCurrentAnswerId(null);
  };

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      message.info('正在录音，请说话...');
      setTimeout(() => {
        setIsRecording(false);
        setInputValue('养老保险缴费年限不够怎么办？');
        message.success('语音识别完成');
      }, 2000);
    } else {
      message.info('录音已结束');
    }
  };

  const handleMessageFeedback = (messageId, isLike) => {
    message.success(isLike ? '感谢您的好评！' : '感谢您的反馈，我们会持续改进。');
  };

  return (
    <div style={{ padding: 24, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>智能问答</Title>
        <Space>
          <Button icon={<QuestionCircleOutlined />} onClick={() => message.info('帮助功能开发中...')}>
            帮助
          </Button>
          <Button
            type="primary"
            icon={<CustomerServiceOutlined />}
            onClick={handleTransferHuman}
            style={{ background: '#1E6FDB' }}
          >
            转人工客服
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ flex: 1, minHeight: 0 }}>
        <Col xs={24} sm={24} md={6} style={{ height: '100%' }}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#1E6FDB' }} />
                咨询历史
              </Space>
            }
            extra={
              <Button type="link" size="small" onClick={handleNewChat}>
                新对话
              </Button>
            }
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, overflow: 'auto', padding: '12px 0' }}
          >
            {historyLoading ? (
              <Empty description="加载中..." />
            ) : displayHistory.length === 0 ? (
              <Empty description="暂无咨询历史" />
            ) : (
              <List
                dataSource={displayHistory}
                renderItem={(item) => (
                  <List.Item
                    style={{
                      cursor: 'pointer',
                      padding: '12px 16px',
                      background: selectedHistoryId === item.id ? '#E6F4FF' : 'transparent',
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'background 0.2s',
                    }}
                    onClick={() => handleHistoryClick(item)}
                    onMouseEnter={(e) => {
                      if (selectedHistoryId !== item.id) {
                        e.currentTarget.style.background = '#f9f9f9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedHistoryId !== item.id) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<ClockCircleOutlined />} style={{ background: '#1E6FDB' }} />}
                      title={
                        <Text
                          ellipsis
                          style={{
                            color: selectedHistoryId === item.id ? '#1E6FDB' : '#333',
                            fontWeight: 500,
                          }}
                        >
                          {item.question}
                        </Text>
                      }
                      description={
                        <div>
                          <Text
                            ellipsis
                            type="secondary"
                            style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
                          >
                            {item.preview}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {item.time}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} sm={24} md={18} style={{ height: '100%' }}>
          <Card
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
            bodyStyle={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
            }}
          >
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                background: '#F9FAFB',
              }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    marginBottom: 20,
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {msg.role === 'ai' && (
                    <Avatar
                      icon={<RobotOutlined />}
                      style={{
                        background: 'linear-gradient(135deg, #1E6FDB 0%, #0958D9 100%)',
                        marginRight: 12,
                        flexShrink: 0,
                      }}
                      size={40}
                    />
                  )}
                  <div
                    style={{
                      maxWidth: '70%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: msg.role === 'user' ? '#1E6FDB' : '#fff',
                        color: msg.role === 'user' ? '#fff' : '#333',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        lineHeight: 1.6,
                      }}
                    >
                      {msg.content.split('\n').map((line, i) => (
                        <span key={i}>
                          {line}
                          {i < msg.content.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                    <Space style={{ marginTop: 6 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {msg.time}
                      </Text>
                      {msg.role === 'ai' && (
                        <>
                          <Tooltip title="有帮助">
                            <Button
                              type="text"
                              size="small"
                              icon={<LikeOutlined />}
                              onClick={() => handleMessageFeedback(msg.id, true)}
                              style={{ padding: '0 4px', height: 'auto' }}
                            />
                          </Tooltip>
                          <Tooltip title="无帮助">
                            <Button
                              type="text"
                              size="small"
                              icon={<DislikeOutlined />}
                              onClick={() => handleMessageFeedback(msg.id, false)}
                              style={{ padding: '0 4px', height: 'auto' }}
                            />
                          </Tooltip>
                        </>
                      )}
                    </Space>
                  </div>
                  {msg.role === 'user' && (
                    <Avatar
                      icon={<UserOutlined />}
                      style={{
                        background: '#52C41A',
                        marginLeft: 12,
                        flexShrink: 0,
                      }}
                      size={40}
                    />
                  )}
                </div>
              ))}

              {isTyping && (
                <div style={{ display: 'flex', marginBottom: 20 }}>
                  <Avatar
                    icon={<RobotOutlined />}
                    style={{
                      background: 'linear-gradient(135deg, #1E6FDB 0%, #0958D9 100%)',
                      marginRight: 12,
                    }}
                    size={40}
                  />
                  <div
                    style={{
                      padding: '16px 20px',
                      borderRadius: '16px 16px 16px 4px',
                      background: '#fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 4 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#1E6FDB',
                          animation: 'bounce 1.4s infinite ease-in-out both',
                        }}
                      />
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#1E6FDB',
                          animation: 'bounce 1.4s infinite ease-in-out both',
                          animationDelay: '0.16s',
                        }}
                      />
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#1E6FDB',
                          animation: 'bounce 1.4s infinite ease-in-out both',
                          animationDelay: '0.32s',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <Divider style={{ margin: 0 }} />

            <div style={{ padding: '12px 16px', background: '#fff' }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                快捷提问：
              </Text>
              <Space wrap style={{ marginBottom: 12 }}>
                {quickQuestions.map((q, index) => (
                  <Tag
                    key={index}
                    color="blue"
                    style={{
                      cursor: 'pointer',
                      padding: '4px 12px',
                      borderRadius: 16,
                      background: '#E6F4FF',
                      color: '#1E6FDB',
                      border: '1px solid #91CAFF',
                    }}
                    onClick={() => handleQuickQuestion(q)}
                  >
                    {q}
                  </Tag>
                ))}
              </Space>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  ref={inputRef}
                  placeholder="请输入您的问题..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  size="large"
                  style={{ borderRadius: '8px 0 0 8px' }}
                />
                <Tooltip title={isRecording ? '停止录音' : '语音输入'}>
                  <Button
                    size="large"
                    icon={<AudioOutlined style={{ color: isRecording ? '#F5222D' : '#1E6FDB' }} />}
                    onClick={handleVoiceInput}
                    style={{
                      background: isRecording ? '#FFF1F0' : '#fff',
                      borderColor: isRecording ? '#FFCCC7' : '#d9d9d9',
                    }}
                  />
                </Tooltip>
                <Button
                  type="primary"
                  size="large"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  loading={isTyping}
                  style={{
                    background: '#1E6FDB',
                    borderColor: '#1E6FDB',
                    borderRadius: '0 8px 8px 0',
                    padding: '0 24px',
                  }}
                >
                  发送
                </Button>
              </Space.Compact>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="服务评价"
        open={satisfactionModalVisible}
        onCancel={() => {
          setSatisfactionModalVisible(false);
          setSatisfaction(5);
        }}
        onOk={handleSubmitSatisfaction}
        okText="提交评价"
        cancelText="稍后再说"
        okButtonProps={{ style: { background: '#1E6FDB' } }}
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 15 }}>
            请问本次回答对您有帮助吗？
          </Text>
          <Rate
            value={satisfaction}
            onChange={setSatisfaction}
            style={{ fontSize: 32 }}
            character={<span style={{ fontSize: 32 }}>⭐</span>}
          />
          <div style={{ marginTop: 8, color: '#999', fontSize: 13 }}>
            {satisfaction === 5 && '非常满意'}
            {satisfaction === 4 && '满意'}
            {satisfaction === 3 && '一般'}
            {satisfaction === 2 && '不满意'}
            {satisfaction === 1 && '非常不满意'}
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default Consultation;
