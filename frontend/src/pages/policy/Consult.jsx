import { useState, useRef, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Space,
  Typography,
  message,
  Empty,
  Skeleton,
  Avatar,
  Tag,
  Divider,
  Alert,
  List,
} from 'antd';
import {
  SendOutlined,
  AudioOutlined,
  RobotOutlined,
  UserOutlined,
  CustomerServiceOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import useRequest from '../../hooks/useRequest';
import { submitConsultation, getConsultationHistory } from '../../api/policy';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const mockQuickQuestions = [
  { id: 1, text: '养老保险怎么交？' },
  { id: 2, text: '退休年龄是多少？' },
  { id: 3, text: '失业保险金怎么领？' },
  { id: 4, text: '创业补贴申请条件' },
  { id: 5, text: '社保转移如何办理？' },
  { id: 6, text: '公积金提取流程' },
];

const mockHistory = [
  {
    id: 1,
    question: '养老保险缴费比例是多少？',
    answer: '根据现行政策，企业职工基本养老保险缴费比例为：单位缴纳16%，个人缴纳8%。灵活就业人员缴费比例为20%，其中8%计入个人账户。',
    confidence: 0.92,
    timestamp: '2024-01-15 10:30:25',
  },
  {
    id: 2,
    question: '退休后养老金怎么计算？',
    answer: '养老金计算公式：养老金 = 基础养老金 + 个人账户养老金。\n\n基础养老金 = （退休时上年度全省在岗职工月平均工资 + 本人指数化月平均缴费工资）÷ 2 × 累计缴费年限 × 1%\n\n个人账户养老金 = 个人账户储存额 ÷ 计发月数',
    confidence: 0.88,
    timestamp: '2024-01-15 10:32:18',
  },
];

const mockResponses = {
  '养老保险怎么交？': {
    answer: '养老保险缴费方式如下：\n\n一、单位职工\n由用人单位按月从职工工资中代扣代缴，缴费比例为单位16%，个人8%。\n\n二、灵活就业人员\n1. 线上缴费：通过微信、支付宝的"社保缴费"功能，或当地社保APP、电子税务局缴费\n2. 线下缴费：携带身份证到当地社保经办机构或银行网点缴费\n3. 缴费基数：可在当地全口径城镇单位就业人员平均工资的60%-300%之间自主选择\n4. 缴费比例：20%，其中8%计入个人账户\n\n三、城乡居民养老保险\n按年缴费，缴费标准从100元到2000元不等，政府给予相应补贴。',
    confidence: 0.95,
  },
  '退休年龄是多少？': {
    answer: '我国现行法定退休年龄为：\n\n一、企业职工\n1. 男性：60周岁\n2. 女干部：55周岁\n3. 女工人：50周岁\n\n二、灵活就业人员\n1. 男性：60周岁\n2. 女性：55周岁（部分地区50周岁）\n\n三、特殊工种\n1. 从事井下、高空、高温、特别繁重体力劳动或其他有害身体健康工作的，退休年龄为男年满55周岁、女年满45周岁\n2. 因病或非因工致残，由医院证明并经劳动鉴定委员会确认完全丧失劳动能力的，退休年龄为男年满50周岁、女年满45周岁\n\n注：渐进式延迟退休政策正在制定中，具体实施时间以国家正式文件为准。',
    confidence: 0.91,
  },
  '失业保险金怎么领？': {
    answer: '失业保险金领取条件和流程：\n\n一、领取条件\n1. 失业前用人单位和本人已经缴纳失业保险费满一年\n2. 非因本人意愿中断就业\n3. 已进行失业登记，并有求职要求\n\n二、领取标准\n按当地最低工资标准的80%-90%发放，具体标准由各省确定。\n\n三、领取期限\n1. 累计缴费满1年不足5年的，领取期限最长为12个月\n2. 累计缴费满5年不足10年的，领取期限最长为18个月\n3. 累计缴费10年以上的，领取期限最长为24个月\n\n四、办理流程\n1. 线上办理：通过"掌上12333"APP、当地人社APP或电子社保卡申请\n2. 线下办理：携带身份证、解除劳动合同证明到当地失业保险经办机构办理',
    confidence: 0.89,
  },
  '创业补贴申请条件': {
    answer: '创业带动就业补贴申请条件：\n\n一、补贴对象\n1. 初创企业（注册登记3年内）\n2. 招用人员并按规定缴纳6个月以上社会保险费\n\n二、补贴标准\n1. 招用3人及以下的，按每人2000元给予补贴\n2. 招用4人及以上的，每增加1人给予3000元补贴\n3. 补贴总额不超过3万元\n\n三、申请材料\n1. 营业执照\n2. 法人代表身份证\n3. 劳动合同\n4. 社会保险缴费证明\n5. 工资发放凭证\n\n四、办理流程\n1. 向注册地人力资源社会保障部门提出申请\n2. 人社部门审核\n3. 公示（不少于5个工作日）\n4. 拨付补贴资金',
    confidence: 0.55,
  },
  default: {
    answer: '感谢您的咨询。根据您的问题，我为您查询到以下信息：\n\n您咨询的问题涉及人力资源和社会保障相关政策。由于问题较为具体，建议您：\n\n1. 提供更多详细信息（如您所在地区、具体情况等），我可以为您提供更精准的解答\n2. 拨打当地人力资源和社会保障服务热线12333咨询\n3. 前往就近的社保经办机构现场咨询\n\n如需其他帮助，请继续提问。',
    confidence: 0.5,
  },
};

const Consult = () => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showLowConfidence, setShowLowConfidence] = useState(false);
  const messagesEndRef = useRef(null);

  const { loading: historyLoading } = useRequest(getConsultationHistory, {
    onSuccess: () => {
      setMessages(mockHistory.map(h => ({
        id: h.id,
        role: 'user',
        content: h.question,
        timestamp: h.timestamp,
      })).concat(mockHistory.map(h => ({
        id: h.id + 1000,
        role: 'ai',
        content: h.answer,
        confidence: h.confidence,
        timestamp: h.timestamp,
      }))).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
    },
    onError: () => {
      message.error('获取对话历史失败');
    },
  });

  const { loading: submitLoading, run: runSubmit } = useRequest(submitConsultation, {
    manual: true,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim()) {
      message.warning('请输入您的问题');
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toLocaleString('zh-CN'),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setShowLowConfidence(false);

    try {
      await runSubmit({ question: inputText.trim() });

      setTimeout(() => {
        const response = mockResponses[inputText.trim()] || mockResponses.default;
        
        const aiMessage = {
          id: Date.now() + 1,
          role: 'ai',
          content: response.answer,
          confidence: response.confidence,
          timestamp: new Date().toLocaleString('zh-CN'),
        };

        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);

        if (response.confidence < 0.6) {
          setShowLowConfidence(true);
        }
      }, 1500);
    } catch (err) {
      setIsTyping(false);
      message.error('发送失败，请重试');
    }
  };

  const handleQuickQuestion = (question) => {
    setInputText(question);
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  const handleTransferHuman = () => {
    message.success('正在为您转接人工客服，请稍候...');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceInput = () => {
    message.info('语音输入功能开发中，敬请期待');
  };

  const getConfidenceTag = (confidence) => {
    if (confidence >= 0.8) {
      return <Tag color="success">置信度 {(confidence * 100).toFixed(0)}%</Tag>;
    } else if (confidence >= 0.6) {
      return <Tag color="warning">置信度 {(confidence * 100).toFixed(0)}%</Tag>;
    } else {
      return <Tag color="error">置信度 {(confidence * 100).toFixed(0)}%</Tag>;
    }
  };

  const loading = historyLoading || submitLoading;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>
          <Space>
            <RobotOutlined style={{ color: '#1E6FDB' }} />
            智能问答
          </Space>
        </Title>
        <Button
          icon={<CustomerServiceOutlined />}
          type="primary"
          style={{ backgroundColor: '#1E6FDB' }}
          onClick={handleTransferHuman}
        >
          转人工客服
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={18}>
          <Card
            style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
          >
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                backgroundColor: '#fafafa',
              }}
            >
              {loading ? (
                <Skeleton active paragraph={{ rows: 10 }} />
              ) : messages.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Avatar size={64} style={{ backgroundColor: '#1E6FDB', marginBottom: 16 }}>
                    <RobotOutlined style={{ fontSize: 32 }} />
                  </Avatar>
                  <Title level={4} style={{ marginBottom: 8 }}>您好，我是人社智能助手</Title>
                  <Text type="secondary">有什么人社政策问题可以问我哦~</Text>
                  <Divider plain>快捷问题</Divider>
                  <Space wrap style={{ justifyContent: 'center', maxWidth: 500 }}>
                    {mockQuickQuestions.slice(0, 4).map(q => (
                      <Button
                        key={q.id}
                        type="default"
                        onClick={() => handleQuickQuestion(q.text)}
                      >
                        {q.text}
                      </Button>
                    ))}
                  </Space>
                </div>
              ) : (
                <div>
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
                          size={40}
                          style={{ backgroundColor: '#1E6FDB', marginRight: 12 }}
                          icon={<RobotOutlined />}
                        />
                      )}
                      <div
                        style={{
                          maxWidth: '70%',
                        }}
                      >
                        <div
                          style={{
                            padding: '12px 16px',
                            borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            backgroundColor: msg.role === 'user' ? '#1E6FDB' : '#fff',
                            color: msg.role === 'user' ? '#fff' : '#262626',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            wordBreak: 'break-word',
                          }}
                        >
                          <Paragraph style={{ margin: 0, whiteSpace: 'pre-line', color: 'inherit' }}>
                            {msg.content}
                          </Paragraph>
                        </div>
                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            {msg.timestamp}
                          </Text>
                          {msg.role === 'ai' && msg.confidence !== undefined && (
                            getConfidenceTag(msg.confidence)
                          )}
                        </div>
                      </div>
                      {msg.role === 'user' && (
                        <Avatar
                          size={40}
                          style={{ backgroundColor: '#52C41A', marginLeft: 12 }}
                          icon={<UserOutlined />}
                        />
                      )}
                    </div>
                  ))}
                  {isTyping && (
                    <div style={{ display: 'flex', marginBottom: 20 }}>
                      <Avatar
                        size={40}
                        style={{ backgroundColor: '#1E6FDB', marginRight: 12 }}
                        icon={<RobotOutlined />}
                      />
                      <div
                        style={{
                          padding: '12px 16px',
                          borderRadius: '16px 16px 16px 4px',
                          backgroundColor: '#fff',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ animation: 'blink 1.4s infinite both', display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1E6FDB' }} />
                          <span style={{ animation: 'blink 1.4s infinite 0.2s both', display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1E6FDB' }} />
                          <span style={{ animation: 'blink 1.4s infinite 0.4s both', display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1E6FDB' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  {showLowConfidence && (
                    <Alert
                      message="回答置信度较低"
                      description="智能助手对该问题的回答可能不够准确，建议您转接人工客服或拨打12333热线咨询。"
                      type="warning"
                      showIcon
                      icon={<ExclamationCircleOutlined />}
                      action={
                        <Button size="small" type="primary" onClick={handleTransferHuman}>
                          转人工
                        </Button>
                      }
                      style={{ marginTop: 16 }}
                    />
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0' }}>
              <Space.Compact style={{ width: '100%' }}>
                <TextArea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="请输入您的问题，按Enter发送，Shift+Enter换行"
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  style={{ borderRadius: '4px 0 0 4px' }}
                  disabled={isTyping}
                />
                <Button
                  icon={<AudioOutlined />}
                  onClick={handleVoiceInput}
                  disabled={isTyping}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  loading={isTyping}
                  style={{ backgroundColor: '#1E6FDB', borderRadius: '0 4px 4px 0' }}
                >
                  发送
                </Button>
              </Space.Compact>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card
            title={
              <Space>
                <ThunderboltOutlined style={{ color: '#FAAD14' }} />
                快捷问题
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <List
              dataSource={mockQuickQuestions}
              renderItem={(item) => (
                <List.Item
                  style={{ cursor: 'pointer', padding: '12px 0' }}
                  onClick={() => handleQuickQuestion(item.text)}
                >
                  <BulbOutlined style={{ color: '#FAAD14', marginRight: 8 }} />
                  <Text>{item.text}</Text>
                </List.Item>
              )}
            />
          </Card>

          <Card
            title={
              <Space>
                <CustomerServiceOutlined style={{ color: '#1E6FDB' }} />
                联系方式
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>服务热线：</Text>
                <Text type="primary" style={{ fontSize: 18, fontWeight: 'bold' }}>12333</Text>
              </div>
              <div>
                <Text strong>服务时间：</Text>
                <Text>周一至周五 9:00-17:00</Text>
              </div>
              <div>
                <Text strong>在线客服：</Text>
                <Text>工作日实时响应</Text>
              </div>
              <Button
                type="primary"
                icon={<CustomerServiceOutlined />}
                onClick={handleTransferHuman}
                style={{ width: '100%', marginTop: 8, backgroundColor: '#1E6FDB' }}
              >
                立即转接人工
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <style>{`
        @keyframes blink {
          0%, 80%, 100% {
            opacity: 0.3;
          }
          40% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Consult;
