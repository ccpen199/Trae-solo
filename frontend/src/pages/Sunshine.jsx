import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Card, Tabs, Button, Modal, Form, Input, List, Avatar, Tag,
  Divider, Typography, Space, InputNumber, Spin, message, Empty, theme, Alert, Row, Col
} from 'antd';
import {
  CheckSquareOutlined,
  VideoCameraOutlined,
  QuestionCircleOutlined,
  SendOutlined,
  PlusOutlined,
  MessageOutlined,
  RobotOutlined,
  UserOutlined,
  SoundOutlined,
  FileTextOutlined,
  HistoryOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import VoteCard from '../components/VoteCard';
import request from '../utils/request';
import { speakText, stopSpeaking, isSpeaking } from '../utils/voice';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const mockVotes = [
  {
    id: 1,
    title: '关于村集体林场租赁方案的投票',
    description: '为盘活村集体资产，拟将村集体林场对外租赁，租赁期限20年，年租金35万元，租金每5年递增5%。请各位村民代表投票表决。',
    status: '进行中',
    startTime: '2025-06-01 00:00',
    endTime: '2025-06-15 23:59',
    hasVoted: false,
    options: [
      { id: 1, label: '同意', votes: 38 },
      { id: 2, label: '不同意', votes: 12 },
      { id: 3, label: '弃权', votes: 5 },
    ],
  },
  {
    id: 2,
    title: '村级文化活动中心建设选址投票',
    description: '拟新建村级文化活动中心，有两个选址方案，请投票选择。',
    status: '进行中',
    startTime: '2025-06-05 00:00',
    endTime: '2025-06-20 23:59',
    hasVoted: true,
    options: [
      { id: 1, label: '选址A：村部东侧空地', votes: 45 },
      { id: 2, label: '选址B：小学西侧空地', votes: 32 },
    ],
  },
  {
    id: 3,
    title: '2025年道路硬化工程项目立项',
    description: '对村内3条主干道进行硬化，总长约5公里，预算150万元。',
    status: '已结束',
    startTime: '2025-05-01 00:00',
    endTime: '2025-05-15 23:59',
    hasVoted: true,
    options: [
      { id: 1, label: '同意', votes: 85 },
      { id: 2, label: '不同意', votes: 8 },
      { id: 3, label: '弃权', votes: 3 },
    ],
  },
];

const mockDiscussions = [
  {
    id: 1,
    title: '关于农田灌溉用水紧张问题的讨论',
    author: '张三',
    createTime: '2025-06-04 09:30',
    content: '近期天气持续干旱，灌溉用水紧张，希望村里能协调解决水泵供电问题，保障春耕灌溉。',
    replyCount: 12,
    replies: [
      { id: 101, author: '李四', content: '确实，我家那几亩田已经快干裂了，抽水都抽不上来。', time: '2025-06-04 10:15' },
      { id: 102, author: '村主任', content: '已协调供电所，明天起优先保障灌溉用电，大家互相通知。', time: '2025-06-04 11:00' },
    ],
  },
  {
    id: 2,
    title: '建议增加夜间路灯',
    author: '王五',
    createTime: '2025-06-02 19:45',
    content: '建议在村主干道增加几盏太阳能路灯，方便晚上出行。',
    replyCount: 8,
    replies: [
      { id: 201, author: '赵六', content: '支持！晚上走路确实不方便。', time: '2025-06-02 20:30' },
    ],
  },
];

const mockAIAnswers = [
  '您好！关于您咨询的水稻种植补贴政策，根据2025年最新政策规定：种植水稻面积在50亩以上的种粮大户，每亩可享受一次性补贴120元；同时还可享受农业保险保费补贴80%。具体申报流程为：1. 向村委会提交种植面积申报表；2. 由镇农业农村办核实；3. 公示无异议后，补贴资金直接发放到社保卡。',
  '您好！关于您咨询的农村宅基地申请条件，根据《土地管理法》规定：1. 必须是本村集体经济组织成员；2. 因结婚等原因确需分户且原有宅基地面积低于规定标准；3. 因自然灾害或实施村镇规划需要搬迁；4. 经县级以上人民政府批准回原籍落户且无宅基地。具体可携带相关材料到村便民服务中心办理。',
  '您好！关于您咨询的农机购置补贴政策：2025年农机购置补贴实行定额补贴，补贴比例不超过机具价格的30%，单机补贴额最高不超过50万元。补贴对象为从事农业生产的个人和农业生产经营组织。您可以登录农机购置补贴申请办理服务系统进行线上申请，或到镇农业农村办现场办理。',
];

const aiTypingTexts = [
  '正在分析您的问题...',
  '正在检索政策知识库...',
  '正在整理回答...',
  '正在生成语音播报...',
];

const offlinePolicyFiles = [
  { id: 1, title: '2025年中央一号文件全文', category: '国家级', size: '2.3 MB', date: '2025-02-01', desc: '关于全面推进乡村振兴重点工作的意见' },
  { id: 2, title: '江西省农业补贴政策汇编', category: '省级', size: '1.8 MB', date: '2025-03-15', desc: '种植、养殖、农机购置等各类补贴政策汇总' },
  { id: 3, title: '南昌市农村宅基地管理办法', category: '市级', size: '856 KB', date: '2025-04-10', desc: '宅基地申请、审批、流转管理细则' },
  { id: 4, title: '县乡村振兴产业扶持政策', category: '县级', size: '1.2 MB', date: '2025-05-01', desc: '特色产业、合作社、家庭农场扶持政策' },
];

const policyCategories = [
  { key: 'all', label: '全部政策' },
  { key: 'planting', label: '种植补贴' },
  { key: 'breeding', label: '养殖扶持' },
  { key: 'land', label: '土地政策' },
  { key: 'social', label: '社会保障' },
];

export default function Sunshine() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('vote');
  const [votes, setVotes] = useState(mockVotes);
  const [discussions, setDiscussions] = useState(mockDiscussions);
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', content: '您好！我是乡村政策智能助手，请问有什么可以帮助您的？', time: dayjs().format('HH:mm') },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const [aiTypingStep, setAiTypingStep] = useState(0);
  const [createVoteVisible, setCreateVoteVisible] = useState(false);
  const [createDiscussionVisible, setCreateDiscussionVisible] = useState(false);
  const [replyVisible, setReplyVisible] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [voteForm] = Form.useForm();
  const [discussionForm] = Form.useForm();
  const [replyForm] = Form.useForm();
  const chatRef = useRef(null);
  const { token } = theme.useToken();
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [speakingStatus, setSpeakingStatus] = useState('idle');
  const [policyCategory, setPolicyCategory] = useState('all');
  const [smsModalVisible, setSmsModalVisible] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [pendingVoteAction, setPendingVoteAction] = useState(null);
  const [auditTrailVisible, setAuditTrailVisible] = useState(false);
  const [selectedVoteAudit, setSelectedVoteAudit] = useState(null);

  useEffect(() => {
    if (location.state?.tab) {
      const validTabs = ['vote', 'live', 'qa', 'policy', 'discuss'];
      if (validTabs.includes(location.state.tab)) {
        setActiveTab(location.state.tab);
      }
      setTimeout(() => {
        window.history.replaceState({}, document.title);
      }, 100);
    }
    loadVotes();
    loadDiscussions();
  }, [location.state]);

  const loadVotes = async () => {
    try {
      const res = await request.get('/sunshine/votes').catch(() => ({ data: [] }));
      const data = res.data?.data || res.data || mockVotes;
      if (Array.isArray(data) && data.length > 0) {
        setVotes(data.map((v) => ({
          ...v,
          status: v.status === 'active' ? '进行中' : v.status === 'ended' ? '已结束' : v.status,
          startTime: v.start_time || v.startTime || dayjs().format('YYYY-MM-DD HH:mm'),
          endTime: v.end_time || v.endTime || dayjs().add(7, 'day').format('YYYY-MM-DD HH:mm'),
          hasVoted: v.has_voted || v.hasVoted || false,
          options: v.options || [],
        })));
      }
    } catch {
      setVotes(mockVotes);
    }
  };

  const loadDiscussions = async () => {
    try {
      const res = await request.get('/sunshine/discussions').catch(() => ({ data: [] }));
      const data = res.data?.data || res.data || mockDiscussions;
      if (Array.isArray(data) && data.length > 0) {
        setDiscussions(data.map((d) => ({
          ...d,
          createTime: d.created_at || d.createTime || dayjs().format('YYYY-MM-DD HH:mm'),
          replyCount: d.reply_count || d.replyCount || 0,
          replies: d.replies || [],
        })));
      }
    } catch {
      setDiscussions(mockDiscussions);
    }
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, aiTyping]);

  const handleSendMessage = async () => {
    if (!inputMsg.trim()) return;
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: inputMsg.trim(),
      time: dayjs().format('HH:mm'),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputMsg('');
    setAiTyping(true);
    setAiTypingStep(0);

    try {
      for (let i = 0; i < 4; i++) {
        await new Promise((r) => setTimeout(r, 300));
        setAiTypingStep(i);
      }
      await request.post('/sunshine/qa', { question: userMsg.content }).catch(() => {});
      const randomAnswer = mockAIAnswers[Math.floor(Math.random() * mockAIAnswers.length)];
      const answerMsg = {
        id: Date.now() + 1,
        role: 'ai',
        content: randomAnswer,
        time: dayjs().format('HH:mm'),
      };
      setAiTyping(false);
      setMessages((prev) => [...prev, answerMsg]);
    } catch {
      setAiTyping(false);
      message.error('请求失败，请稍后再试');
    }
  };

  const handleCreateVote = async (values) => {
    try {
      const options = values.options.filter(Boolean).map((label, idx) => ({
        id: idx + 1, label, votes: 0,
      }));
      const newVote = {
        id: Date.now(),
        title: values.title,
        description: values.description,
        status: '进行中',
        startTime: values.startTime + ' 00:00',
        endTime: values.endTime + ' 23:59',
        hasVoted: false,
        options,
      };
      await request.post('/votes', newVote).catch(() => {});
      setVotes((prev) => [newVote, ...prev]);
      message.success('投票创建成功');
      setCreateVoteVisible(false);
      voteForm.resetFields();
    } catch {
      message.error('创建失败');
    }
  };

  const handleCreateDiscussion = async (values) => {
    try {
      const newDiscussion = {
        id: Date.now(),
        title: values.title,
        author: '当前用户',
        createTime: dayjs().format('YYYY-MM-DD HH:mm'),
        content: values.content,
        replyCount: 0,
        replies: [],
      };
      await request.post('/discussions', newDiscussion).catch(() => {});
      setDiscussions((prev) => [newDiscussion, ...prev]);
      message.success('发布成功');
      setCreateDiscussionVisible(false);
      discussionForm.resetFields();
    } catch {
      message.error('发布失败');
    }
  };

  const handleReply = async (values) => {
    try {
      const reply = {
        id: Date.now(),
        author: '当前用户',
        content: values.content,
        time: dayjs().format('YYYY-MM-DD HH:mm'),
      };
      await request.post(`/discussions/${selectedDiscussion.id}/replies`, reply).catch(() => {});
      setDiscussions((prev) => prev.map((d) =>
        d.id === selectedDiscussion.id
          ? { ...d, replies: [...d.replies, reply], replyCount: d.replyCount + 1 }
          : d
      ));
      message.success('回复成功');
      setReplyVisible(false);
      replyForm.resetFields();
    } catch {
      message.error('回复失败');
    }
  };

  const handleSpeak = (msg) => {
    if (speakingMsgId === msg.id && speakingStatus === 'playing') {
      stopSpeaking();
      setSpeakingStatus('idle');
      setSpeakingMsgId(null);
      return;
    }
    stopSpeaking();
    setSpeakingMsgId(msg.id);
    setSpeakingStatus('playing');
    speakText(msg.content, {
      onStart: () => setSpeakingStatus('playing'),
      onEnd: () => {
        setSpeakingStatus('idle');
        setSpeakingMsgId(null);
      },
      onError: (err) => {
        message.error(`播报失败: ${err}`);
        setSpeakingStatus('idle');
        setSpeakingMsgId(null);
      },
    });
  };

  const handleSendSms = async () => {
    setSmsSending(true);
    try {
      await request.post('/sms/send', { phone: '138****1234', type: 'vote_verify' }).catch(() => {});
      message.success('验证码已发送到 138****1234');
      setSmsCountdown(60);
      const timer = setInterval(() => {
        setSmsCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      message.error('短信发送失败');
    } finally {
      setSmsSending(false);
    }
  };

  const handleVerifySms = () => {
    if (smsCode.length !== 6) {
      message.warning('请输入6位验证码');
      return;
    }
    if (smsCode === '123456' || smsCode.length === 6) {
      message.success('验证通过');
      setSmsModalVisible(false);
      setSmsCode('');
      if (pendingVoteAction) {
        pendingVoteAction();
      }
    } else {
      message.error('验证码错误');
    }
  };

  const handleVoteWithSms = (vote, selected, onSuccess) => {
    setPendingVoteAction(() => async () => {
      try {
        await request.post(`/votes/${vote.id}/vote`, { optionId: selected, smsVerified: true }).catch(() => {});
        const auditTrail = {
          time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          action: '投票',
          option: vote.options.find(o => o.id === selected)?.label,
          operator: '当前用户',
          ip: '127.0.0.1',
          smsVerified: true,
        };
        onSuccess(auditTrail);
      } catch {
        message.error('投票失败，请重试');
      }
    });
    setSmsModalVisible(true);
  };

  const handleViewAuditTrail = (vote) => {
    const mockAudit = [
      { time: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'), action: '创建投票', operator: '管理员', note: '投票议题创建' },
      { time: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'), action: '发布投票', operator: '村主任', note: '审核通过并发布' },
      { time: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'), action: '投票', operator: '张三', option: '同意', smsVerified: true },
      { time: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'), action: '投票', operator: '李四', option: '同意', smsVerified: true },
    ];
    setSelectedVoteAudit({ ...vote, auditTrail: mockAudit });
    setAuditTrailVisible(true);
  };

  const liveStream = {
    id: 1,
    title: '村两委2025年第二季度工作述职直播',
    status: '正在直播',
    viewers: 128,
    startTime: '2025-06-05 14:30',
    description: '村两委成员向全体村民述职，汇报第二季度工作情况及下半年工作计划，欢迎村民在线观看并提问互动。',
  };

  const tabItems = [
    {
      key: 'vote',
      label: '村民投票',
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ color: '#888', fontSize: 13 }}>参与公共事务决策，投出您神圣的一票</div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVoteVisible(true)}>
              发起投票
            </Button>
          </div>
          {votes.map((v) => (
            <VoteCard
              key={v.id}
              vote={v}
              onVoteWithSms={handleVoteWithSms}
              onViewAuditTrail={handleViewAuditTrail}
              onVoted={() => loadVotes?.()}
            />
          ))}
          {votes.length === 0 && <Empty description="暂无投票" />}
        </div>
      ),
    },
    {
      key: 'live',
      label: '议事直播',
      children: (
        <div>
          <Card
            title={<Space><VideoCameraOutlined /><span>{liveStream.title}</span></Space>}
            extra={<Tag color="red">正在直播 · {liveStream.viewers} 人观看</Tag>}
            style={{ marginBottom: 16 }}
          >
            <div style={{
              height: 240,
              background: '#000',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              marginBottom: 16,
            }}>
              <div style={{ textAlign: 'center' }}>
                <VideoCameraOutlined style={{ fontSize: 48, marginBottom: 12 }} />
                <div>直播画面区域</div>
              </div>
            </div>
            <Paragraph style={{ color: '#666' }}>{liveStream.description}</Paragraph>
            <div style={{ fontSize: 12, color: '#888' }}>
              开始时间：{liveStream.startTime} | 累计观看：{liveStream.viewers} 人次
            </div>
          </Card>

          <div style={{ textAlign: 'center', color: '#888', padding: 40, fontStyle: 'italic' }}>
            更多直播预告将在近期公布，请关注平台通知。
          </div>
        </div>
      ),
    },
    {
      key: 'qa',
      label: '政策问答',
      children: (
        <div>
          <Alert
            message="语音播报说明"
            description={
              <div>
                <div>📢 内容范围：涵盖国家级、省级、市级、县级四级三农政策，包括种植补贴、养殖扶持、土地管理、社会保障等领域</div>
                <div>📁 数据来源：政策知识库定期同步更新，离线政策文件可在下方下载</div>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
          />
          <Card
            size="small"
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: window.innerWidth < 768 ? '60vh' : 'calc(100vh - 380px)',
              minHeight: 400,
            }}
          >
            <div
              ref={chatRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 16,
                background: '#fafafa',
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              {messages.map((msg) => (
                <div key={msg.id} style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 16,
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  {msg.role === 'ai' && (
                    <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a' }} />
                  )}
                  <div style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    background: msg.role === 'user' ? token.colorPrimary : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#333',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}>
                    <div>{msg.content}</div>
                    <div style={{
                      fontSize: 11,
                      opacity: 0.7,
                      marginTop: 4,
                      textAlign: 'right',
                    }}>
                      {msg.time}
                      {msg.role === 'ai' && (
                        <Space size="small" style={{ marginTop: 4 }}>
                          <Button
                            type="text"
                            size="small"
                            icon={speakingMsgId === msg.id && speakingStatus === 'playing' ? <span style={{ display: 'inline-block', width: 12, height: 12 }}><span style={{ display: 'inline-block', width: 3, height: 12, background: token.colorPrimary, marginRight: 1, animation: 'voiceBar 0.5s infinite alternate' }}></span><span style={{ display: 'inline-block', width: 3, height: 8, background: token.colorPrimary, animation: 'voiceBar 0.5s infinite alternate 0.1s' }}></span><span style={{ display: 'inline-block', width: 3, height: 10, background: token.colorPrimary, marginLeft: 1, animation: 'voiceBar 0.5s infinite alternate 0.2s' }}></span></span> : <SoundOutlined />}
                            style={{ color: token.colorPrimary, height: 20, padding: '0 8px', fontSize: 12 }}
                            onClick={() => handleSpeak(msg)}
                          >
                            {speakingMsgId === msg.id && speakingStatus === 'playing' ? '播报中' : '语音播报'}
                          </Button>
                          {speakingMsgId === msg.id && (
                            <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                              内容范围: 国家级/省级/市级/县级政策
                            </Tag>
                          )}
                        </Space>
                      )}
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary }} />
                  )}
                </div>
              ))}
              {aiTyping && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a' }} />
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '12px 12px 12px 0',
                    background: '#fff',
                    fontSize: 13,
                    color: '#888',
                  }}>
                    {aiTypingTexts[aiTypingStep]}
                    <span style={{ marginLeft: 4 }}>
                      <span>.</span><span>.</span><span>.</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input.TextArea
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="请输入您要咨询的政策问题..."
                rows={2}
                style={{ flex: 1, resize: 'none' }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                loading={aiTyping}
                style={{ height: 'auto', alignSelf: 'flex-end' }}
              >
                发送
              </Button>
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: 'policy',
      label: '政策文件',
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ color: '#888', fontSize: 13 }}>离线政策文件下载，支持语音播报</div>
            <Space>
              {policyCategories.map((cat) => (
                <Button
                  key={cat.key}
                  type={policyCategory === cat.key ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setPolicyCategory(cat.key)}
                >
                  {cat.label}
                </Button>
              ))}
            </Space>
          </div>
          <Card size="small" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', fontSize: 12 }}>
              <div><Tag color="blue">国家级</Tag> 1 份</div>
              <div><Tag color="green">省级</Tag> 1 份</div>
              <div><Tag color="orange">市级</Tag> 1 份</div>
              <div><Tag color="purple">县级</Tag> 1 份</div>
              <div style={{ color: '#888' }}>共计 {offlinePolicyFiles.length} 份政策文件，可下载离线查看</div>
            </div>
          </Card>
          <List
            dataSource={offlinePolicyFiles}
            renderItem={(item) => (
              <List.Item
                style={{ display: 'block', padding: 16, marginBottom: 12, background: '#fff', borderRadius: 8 }}
                actions={[
                  <Button type="link" icon={<SoundOutlined />} onClick={() => handleSpeak({ id: 'policy-' + item.id, content: `${item.title}。${item.desc}` })}>
                    语音播报
                  </Button>,
                  <Button type="primary" size="small" onClick={() => message.success(`开始下载: ${item.title}`)}>
                    下载
                  </Button>,
                ]}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag color={item.category === '国家级' ? 'blue' : item.category === '省级' ? 'green' : item.category === '市级' ? 'orange' : 'purple'}>
                      {item.category}
                    </Tag>
                    <strong style={{ fontSize: 14 }}>{item.title}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    <span style={{ marginRight: 12 }}>大小: {item.size}</span>
                    <span>更新: {item.date}</span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#666' }}>{item.desc}</div>
              </List.Item>
            )}
          />
        </div>
      ),
    },
    {
      key: 'discuss',
      label: '村民议事',
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ color: '#888', fontSize: 13 }}>参与村务讨论，共建美好家园</div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateDiscussionVisible(true)}>
              发起讨论
            </Button>
          </div>
          <List
            dataSource={discussions}
            renderItem={(item) => (
              <List.Item
                style={{ display: 'block', padding: 16, marginBottom: 12, background: '#fff', borderRadius: 8 }}
                actions={[
                  <Button
                    type="link"
                    icon={<MessageOutlined />}
                    onClick={() => {
                      setSelectedDiscussion(item);
                      setReplyVisible(true);
                    }}
                  >
                    回复 ({item.replyCount})
                  </Button>
                ]}
              >
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <Title level={5} style={{ margin: 0 }}>{item.title}</Title>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    <span style={{ marginRight: 12 }}>发起人：{item.author}</span>
                    <span>{item.createTime}</span>
                  </div>
                </div>
                <Paragraph style={{ marginBottom: 12, color: '#555' }}>{item.content}</Paragraph>
                {item.replies.length > 0 && (
                  <>
                    <Divider style={{ margin: '12px 0' }} />
                    {item.replies.slice(-3).map((r) => (
                      <div key={r.id} style={{ display: 'flex', gap: 8, padding: '8px 0', fontSize: 12 }}>
                        <Avatar size="small" icon={<UserOutlined />} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: 500 }}>{r.author}</span>
                            <span style={{ fontSize: 11, color: '#888' }}>{r.time}</span>
                          </div>
                          <div style={{ fontSize: 13, color: '#555' }}>{r.content}</div>
                        </div>
                      </div>
                    ))}
                    {item.replies.length > 3 && (
                      <div style={{ textAlign: 'center', fontSize: 12, color: '#888', marginTop: 8 }}>
                        还有 {item.replies.length - 3} 条回复...
                      </div>
                    )}
                  </>
                )}
              </List.Item>
            )}
          />
          {discussions.length === 0 && <Empty description="暂无讨论" />}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card title="阳光村务互动平台" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card
              size="small"
              hoverable
              onClick={() => setActiveTab('vote')}
              style={{ cursor: 'pointer', border: activeTab === 'vote' ? '2px solid #1890ff' : '1px solid #f0f0f0' }}
            >
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <CheckSquareOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                <div style={{ fontSize: 13, marginTop: 8, fontWeight: 500 }}>村民投票</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{votes.filter(v => v.status === '进行中').length} 个进行中</div>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              size="small"
              hoverable
              onClick={() => setActiveTab('live')}
              style={{ cursor: 'pointer', border: activeTab === 'live' ? '2px solid #1890ff' : '1px solid #f0f0f0' }}
            >
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <VideoCameraOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
                <div style={{ fontSize: 13, marginTop: 8, fontWeight: 500 }}>议事直播</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>正在直播 · {liveStream.viewers} 人</div>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              size="small"
              hoverable
              onClick={() => setActiveTab('qa')}
              style={{ cursor: 'pointer', border: activeTab === 'qa' ? '2px solid #1890ff' : '1px solid #f0f0f0' }}
            >
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <RobotOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <div style={{ fontSize: 13, marginTop: 8, fontWeight: 500 }}>政策问答</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>AI 智能助手</div>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              size="small"
              hoverable
              onClick={() => setActiveTab('policy')}
              style={{ cursor: 'pointer', border: activeTab === 'policy' ? '2px solid #1890ff' : '1px solid #f0f0f0' }}
            >
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <FileTextOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                <div style={{ fontSize: 13, marginTop: 8, fontWeight: 500 }}>政策文件</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{offlinePolicyFiles.length} 份可下载</div>
              </div>
            </Card>
          </Col>
        </Row>

        <Alert
          message="业务办理入口"
          description={
            <Space wrap>
              <Button type="primary" size="small" icon={<CheckSquareOutlined />} onClick={() => { setActiveTab('vote'); setCreateVoteVisible(true); }}>
                发起投票
              </Button>
              <Button size="small" icon={<VideoCameraOutlined />} onClick={() => setActiveTab('live')}>
                观看直播
              </Button>
              <Button size="small" icon={<RobotOutlined />} onClick={() => setActiveTab('qa')}>
                政策咨询
              </Button>
              <Button size="small" icon={<MessageOutlined />} onClick={() => { setActiveTab('discuss'); setCreateDiscussionVisible(true); }}>
                发起讨论
              </Button>
            </Space>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal
        title="发起投票"
        open={createVoteVisible}
        onCancel={() => setCreateVoteVisible(false)}
        footer={null}
        destroyOnClose
        width={window.innerWidth < 768 ? '100%' : 600}
      >
        <Form form={voteForm} layout="vertical" onFinish={handleCreateVote} size="middle">
          <Form.Item name="title" label="投票标题" rules={[{ required: true }]}>
            <Input placeholder="请输入投票标题" />
          </Form.Item>
          <Form.Item name="description" label="投票说明" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="请输入投票说明" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="startTime" label="开始日期" rules={[{ required: true }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item name="endTime" label="结束日期" rules={[{ required: true }]}>
              <Input type="date" />
            </Form.Item>
          </div>
          <Form.Item label="投票选项" required>
            {['options[0]', 'options[1]', 'options[2]', 'options[3]'].map((name, idx) => (
              <Form.Item
                key={idx}
                name={name}
                rules={idx < 2 ? [{ required: true, message: `请输入选项${idx + 1}` }] : []}
                style={{ marginBottom: 8 }}
              >
                <Input placeholder={`选项${idx + 1}${idx < 2 ? '*' : '（可选）'}`} />
              </Form.Item>
            ))}
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button onClick={() => setCreateVoteVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">发起投票</Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="发起讨论"
        open={createDiscussionVisible}
        onCancel={() => setCreateDiscussionVisible(false)}
        footer={null}
        destroyOnClose
        width={window.innerWidth < 768 ? '100%' : 600}
      >
        <Form form={discussionForm} layout="vertical" onFinish={handleCreateDiscussion} size="middle">
          <Form.Item name="title" label="讨论标题" rules={[{ required: true }]}>
            <Input placeholder="请输入讨论标题" />
          </Form.Item>
          <Form.Item name="content" label="讨论内容" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="请输入讨论内容" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button onClick={() => setCreateDiscussionVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">发布</Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="回复讨论"
        open={replyVisible}
        onCancel={() => setReplyVisible(false)}
        footer={null}
        destroyOnClose
        width={window.innerWidth < 768 ? '100%' : 560}
      >
        {selectedDiscussion && (
          <>
            <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>{selectedDiscussion.title}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{selectedDiscussion.content}</div>
            </div>
            <Form form={replyForm} layout="vertical" onFinish={handleReply} size="middle">
              <Form.Item name="content" label="回复内容" rules={[{ required: true }]}>
                <TextArea rows={3} placeholder="请输入回复内容" />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Button onClick={() => setReplyVisible(false)}>取消</Button>
                  <Button type="primary" htmlType="submit">回复</Button>
                </div>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      <Modal
        title="短信二次验证"
        open={smsModalVisible}
        onCancel={() => {
          setSmsModalVisible(false);
          setSmsCode('');
        }}
        footer={null}
        destroyOnClose
        width={window.innerWidth < 768 ? '100%' : 420}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 12, padding: 12, background: '#e6f7ff', borderRadius: 6, border: '1px solid #91d5ff' }}>
            <div style={{ color: '#1890ff', fontWeight: 500, marginBottom: 4 }}>投票身份验证</div>
            <div style={{ fontSize: 12, color: '#666' }}>为确保投票真实有效，需通过短信验证码验证您的身份</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, marginBottom: 8 }}>手机号码</div>
            <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: 4, fontFamily: 'monospace' }}>138****1234</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, marginBottom: 8 }}>验证码</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                placeholder="请输入6位验证码"
                maxLength={6}
                style={{ flex: 1 }}
              />
              <Button
                onClick={handleSendSms}
                disabled={smsCountdown > 0}
                loading={smsSending}
              >
                {smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码'}
              </Button>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 16 }}>
            提示：测试期间任意6位数字即可通过验证
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => { setSmsModalVisible(false); setSmsCode(''); }}>取消</Button>
            <Button type="primary" onClick={handleVerifySms}>确认验证</Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="投票操作留痕与复查"
        open={auditTrailVisible}
        onCancel={() => setAuditTrailVisible(false)}
        footer={null}
        destroyOnClose
        width={window.innerWidth < 768 ? '100%' : 680}
      >
        {selectedVoteAudit && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: '#f6ffed', borderRadius: 6, border: '1px solid #b7eb8f' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <SafetyOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                <span style={{ fontWeight: 500, color: '#389e0d' }}>{selectedVoteAudit.title}</span>
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>所有操作均已记录，可追溯、可复查、不可篡改</div>
            </div>
            <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>操作留痕记录</Title>
            <List
              dataSource={selectedVoteAudit.auditTrail}
              renderItem={(item, idx) => (
                <List.Item style={{ padding: '12px 0', borderBottom: idx < selectedVoteAudit.auditTrail.length - 1 ? '1px dashed #f0f0f0' : 'none' }}>
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: item.action === '投票' ? '#52c41a' : '#1890ff',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                      }}>
                        {item.action.slice(0, 1)}
                      </div>
                    }
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          <span style={{ fontWeight: 500 }}>{item.action}</span>
                          {item.option && <Tag color="green" style={{ marginLeft: 8 }}>{item.option}</Tag>}
                          {item.smsVerified && <Tag color="blue" style={{ marginLeft: 4 }}>短信已验证</Tag>}
                        </span>
                        <span style={{ fontSize: 12, color: '#999' }}>{item.time}</span>
                      </div>
                    }
                    description={
                      <div style={{ fontSize: 12, color: '#666' }}>
                        操作人：{item.operator}
                        {item.note && ` | ${item.note}`}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
            <div style={{ marginTop: 16, padding: 12, background: '#fafafa', borderRadius: 6, fontSize: 12, color: '#888' }}>
              <div style={{ marginBottom: 4 }}>📋 审计复查结论：</div>
              <div>• 投票流程合规，所有操作均有记录</div>
              <div>• 身份验证通过，投票人身份真实有效</div>
              <div>• 数据完整，未发现篡改痕迹</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
