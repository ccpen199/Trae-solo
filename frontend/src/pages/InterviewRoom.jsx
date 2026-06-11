import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Tag,
  Button,
  Form,
  Input,
  Rate,
  Radio,
  message,
  Spin,
  Avatar,
  List,
  Badge,
  Row,
  Col,
  Space,
  Divider,
  Statistic,
  Modal,
} from 'antd';
import {
  VideoCameraOutlined,
  AudioOutlined,
  ShareAltOutlined,
  PhoneOutlined,
  SendOutlined,
  UserOutlined,
  ClockCircleOutlined,
  VideoCameraFilled,
  AudioFilled,
  VideoCameraAddOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { interviews } from '../api';
import { useAuth } from '../context/AuthContext';

const { TextArea } = Input;
const { Group } = Radio;

function InterviewRoom() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [roomData, setRoomData] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isEndModalVisible, setIsEndModalVisible] = useState(false);
  const [evaluationForm] = Form.useForm();
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [mediaState, setMediaState] = useState({
    camera: true,
    microphone: true,
    screenShare: false,
  });
  const [webrtcState, setWebrtcState] = useState({
    connected: false,
    localStream: null,
    remoteStream: null,
    peerConnection: null,
  });

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatContainerRef = useRef(null);

  const mockCandidate = {
    name: '李明',
    avatar: '',
    position: '高级前端工程师',
    interviewTime: dayjs().format('YYYY-MM-DD HH:mm'),
    phone: '138****8888',
    email: 'liming@example.com',
    experience: '5年',
    education: '本科',
    skills: ['React', 'Vue', 'TypeScript', 'Node.js', 'Webpack', 'Docker'],
  };

  const fetchRoomData = async () => {
    setLoading(true);
    try {
      const res = await interviews.getRoom(id);
      if (res.code === 0) {
        setRoomData(res.data);
        setCountdown(3600);
      } else {
        message.error(res.message || '获取面试房间信息失败');
      }
    } catch (err) {
      console.error('获取面试房间信息失败:', err);
      setRoomData({
        candidate: mockCandidate,
        jobTitle: mockCandidate.position,
        interviewTime: mockCandidate.interviewTime,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) {
      fetchRoomData();
    }
  }, [token, id]);

  useEffect(() => {
    let timer;
    if (isInterviewStarted && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isInterviewStarted, countdown]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const initWebRTC = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setWebrtcState((prev) => ({
        ...prev,
        localStream: stream,
        connected: true,
      }));

      setTimeout(() => {
        setWebrtcState((prev) => ({
          ...prev,
          remoteStream: stream,
        }));
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        message.success('已连接到候选人');
      }, 1500);

      setTimeout(() => {
        handleReceiveMessage('你好，面试官，我已经准备好了。');
      }, 2000);
    } catch (err) {
      console.error('初始化媒体设备失败:', err);
      message.error('无法访问摄像头或麦克风，请检查权限设置');
    }
  };

  const handleStartInterview = async () => {
    try {
      const res = await interviews.start(id);
      if (res.code === 0) {
        message.success('面试已开始');
        setIsInterviewStarted(true);
        initWebRTC();
      } else {
        message.error(res.message || '开始面试失败');
      }
    } catch (err) {
      console.error('开始面试失败:', err);
      setIsInterviewStarted(true);
      initWebRTC();
    }
  };

  const handleToggleCamera = () => {
    const newState = !mediaState.camera;
    setMediaState((prev) => ({ ...prev, camera: newState }));
    if (webrtcState.localStream) {
      webrtcState.localStream.getVideoTracks().forEach((track) => {
        track.enabled = newState;
      });
    }
  };

  const handleToggleMicrophone = () => {
    const newState = !mediaState.microphone;
    setMediaState((prev) => ({ ...prev, microphone: newState }));
    if (webrtcState.localStream) {
      webrtcState.localStream.getAudioTracks().forEach((track) => {
        track.enabled = newState;
      });
    }
  };

  const handleToggleScreenShare = async () => {
    if (!mediaState.screenShare) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setMediaState((prev) => ({ ...prev, screenShare: true }));
        message.success('已开始屏幕共享');

        screenStream.getVideoTracks()[0].onended = () => {
          if (webrtcState.localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = webrtcState.localStream;
          }
          setMediaState((prev) => ({ ...prev, screenShare: false }));
          message.info('已停止屏幕共享');
        };
      } catch (err) {
        console.error('屏幕共享失败:', err);
        message.error('屏幕共享失败，请检查权限设置');
      }
    } else {
      if (webrtcState.localStream && localVideoRef.current) {
        localVideoRef.current.srcObject = webrtcState.localStream;
      }
      setMediaState((prev) => ({ ...prev, screenShare: false }));
      message.info('已停止屏幕共享');
    }
  };

  const handleEndInterview = () => {
    setIsEndModalVisible(true);
  };

  const handleConfirmEnd = async () => {
    try {
      const values = await evaluationForm.validateFields();
      const res = await interviews.end(id, values);
      if (res.code === 0) {
        message.success('面试已结束，评价已提交');
        if (webrtcState.localStream) {
          webrtcState.localStream.getTracks().forEach((track) => track.stop());
        }
        setIsEndModalVisible(false);
        navigate('/interviews');
      } else {
        message.error(res.message || '结束面试失败');
      }
    } catch (err) {
      if (err.errorFields) {
        message.warning('请完成面试评价后再结束');
        return;
      }
      console.error('结束面试失败:', err);
      message.success('面试已结束');
      navigate('/interviews');
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    handleReceiveMessage(chatInput, true);
    setChatInput('');

    if (chatInput.includes('介绍')) {
      setTimeout(() => {
        handleReceiveMessage('我叫李明，有5年前端开发经验，擅长React和Vue技术栈。之前在字节跳动工作，负责过多个大型项目的前端架构设计。');
      }, 1500);
    } else if (chatInput.includes('项目')) {
      setTimeout(() => {
        handleReceiveMessage('我参与过的主要项目包括：1）电商平台重构，使用React+TypeScript技术栈，性能提升40%；2）企业级后台管理系统，负责组件库设计；3）数据可视化平台，使用ECharts实现复杂图表展示。');
      }, 2000);
    } else if (chatInput.includes('薪资') || chatInput.includes('期望')) {
      setTimeout(() => {
        handleReceiveMessage('我的期望薪资是25K-30K，具体可以根据公司的薪酬体系和福利来协商。');
      }, 1500);
    } else {
      setTimeout(() => {
        handleReceiveMessage('好的，我明白您的问题。让我详细说明一下...');
      }, 1500);
    }
  };

  const handleReceiveMessage = (content, isSelf = false) => {
    const newMessage = {
      id: Date.now(),
      content,
      isSelf,
      sender: isSelf ? '面试官' : (roomData?.candidate?.name || '候选人'),
      time: dayjs().format('HH:mm'),
    };
    setChatMessages((prev) => [...prev, newMessage]);
  };

  const formatCountdown = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const candidate = roomData?.candidate || mockCandidate;
  const jobTitle = roomData?.jobTitle || mockCandidate.position;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div style={{ background: '#1a1a2e', minHeight: 'calc(100vh - 112px)', margin: '-24px', padding: '24px' }}>
      <Card
        style={{
          marginBottom: '16px',
          background: '#16213e',
          border: 'none',
          borderRadius: '12px',
        }}
        styles={{ body: {  padding: '16px 24px' } }}
      >
        <Row align="middle" justify="space-between">
          <Col xs={24} md={12}>
            <Space size="large" wrap>
              <Space>
                <Avatar size={48} src={candidate.avatar} icon={<UserOutlined />} />
                <div>
                  <div style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>
                    {candidate.name}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                    {jobTitle}
                  </div>
                </div>
              </Space>
              <Space>
                <ClockCircleOutlined style={{ color: '#4da3ff' }} />
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {dayjs(candidate.interviewTime).format('YYYY-MM-DD HH:mm')}
                </span>
              </Space>
            </Space>
          </Col>
          <Col xs={24} md={12} style={{ textAlign: { xs: 'left', md: 'right' }, marginTop: { xs: '12px', md: '0' } }}>
            {isInterviewStarted ? (
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.6)' }}>面试剩余时间</span>}
                value={formatCountdown(countdown)}
                valueStyle={{ color: '#52c41a', fontSize: '24px', fontFamily: 'monospace' }}
              />
            ) : (
              <Button type="primary" size="large" onClick={handleStartInterview} icon={<VideoCameraOutlined />}>
                开始面试
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card
            style={{
              background: '#16213e',
              border: 'none',
              borderRadius: '12px',
              height: 'calc(100vh - 320px)',
              minHeight: '400px',
            }}
            styles={{ body: {  padding: 0, height: '100%' } }}
          >
            <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0f0f23', borderRadius: '12px', overflow: 'hidden' }}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  background: '#0f0f23',
                }}
              />

              {!webrtcState.connected && isInterviewStarted && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  color: '#fff',
                }}>
                  <Spin size="large" tip="正在连接候选人..." />
                </div>
              )}

              {!isInterviewStarted && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  color: '#fff',
                }}>
                  <VideoCameraAddOutlined style={{ fontSize: '64px', color: '#4da3ff', marginBottom: '16px' }} />
                  <div style={{ fontSize: '18px', marginBottom: '8px' }}>面试尚未开始</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                    点击上方"开始面试"按钮开始视频面试
                  </div>
                </div>
              )}

              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                padding: '8px 16px',
                background: 'rgba(0,0,0,0.6)',
                borderRadius: '20px',
                color: '#fff',
                fontSize: '14px',
              }}>
                <Badge status={webrtcState.connected ? 'success' : 'default'} />
                {candidate.name}
              </div>

              <div style={{
                position: 'absolute',
                bottom: '80px',
                right: '16px',
                width: '180px',
                height: '135px',
                background: '#000',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '2px solid #4da3ff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}>
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)',
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  left: '8px',
                  color: '#fff',
                  fontSize: '12px',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                }}>
                  您
                </div>
              </div>
            </div>
          </Card>

          <Card
            style={{
              marginTop: '16px',
              background: '#16213e',
              border: 'none',
              borderRadius: '12px',
            }}
            styles={{ body: {  padding: '16px' } }}
          >
            <Space size="large" style={{ width: '100%', justifyContent: 'center' }} wrap>
              <Button
                type={mediaState.camera ? 'primary' : 'default'}
                danger={!mediaState.camera}
                shape="circle"
                size="large"
                icon={mediaState.camera ? <VideoCameraFilled /> : <VideoCameraOutlined />}
                onClick={handleToggleCamera}
                disabled={!isInterviewStarted}
                style={{ width: '56px', height: '56px', fontSize: '20px' }}
              />
              <Button
                type={mediaState.microphone ? 'primary' : 'default'}
                danger={!mediaState.microphone}
                shape="circle"
                size="large"
                icon={mediaState.microphone ? <AudioFilled /> : <AudioOutlined />}
                onClick={handleToggleMicrophone}
                disabled={!isInterviewStarted}
                style={{ width: '56px', height: '56px', fontSize: '20px' }}
              />
              <Button
                type={mediaState.screenShare ? 'primary' : 'default'}
                shape="circle"
                size="large"
                icon={<ShareAltOutlined />}
                onClick={handleToggleScreenShare}
                disabled={!isInterviewStarted}
                style={{ width: '56px', height: '56px', fontSize: '20px' }}
              />
              <Button
                danger
                type="primary"
                shape="circle"
                size="large"
                icon={<PhoneOutlined />}
                onClick={handleEndInterview}
                disabled={!isInterviewStarted}
                style={{ width: '56px', height: '56px', fontSize: '20px', transform: 'rotate(135deg)' }}
              />
            </Space>
            <div style={{ textAlign: 'center', marginTop: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
              <Space size="large">
                <span>{mediaState.camera ? '摄像头已开启' : '摄像头已关闭'}</span>
                <span>{mediaState.microphone ? '麦克风已开启' : '麦克风已关闭'}</span>
                <span>{mediaState.screenShare ? '正在共享屏幕' : '屏幕共享未开启'}</span>
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            style={{
              background: '#16213e',
              border: 'none',
              borderRadius: '12px',
              marginBottom: '16px',
            }}
            title={<span style={{ color: '#fff' }}>候选人信息</span>}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar size={64} src={candidate.avatar} icon={<UserOutlined />} />
                <div>
                  <div style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>{candidate.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{candidate.phone}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{candidate.email}</div>
                </div>
              </div>
              <Space>
                <Tag color="blue">{candidate.experience}经验</Tag>
                <Tag color="green">{candidate.education}</Tag>
              </Space>
              <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.1)' }} />
              <div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '8px' }}>技能标签</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {candidate.skills.map((skill, index) => (
                    <Tag key={index} color="geekblue" style={{ margin: 0 }}>
                      {skill}
                    </Tag>
                  ))}
                </div>
              </div>
            </Space>
          </Card>

          <Card
            style={{
              background: '#16213e',
              border: 'none',
              borderRadius: '12px',
              marginBottom: '16px',
            }}
            title={<span style={{ color: '#fff' }}>面试评价</span>}
          >
            <Form form={evaluationForm} layout="vertical">
              <Form.Item
                name="professionalScore"
                label={<span style={{ color: 'rgba(255,255,255,0.8)' }}>专业能力</span>}
                rules={[{ required: true, message: '请对专业能力评分' }]}
              >
                <Rate style={{ color: '#faad14' }} />
              </Form.Item>
              <Form.Item
                name="communicationScore"
                label={<span style={{ color: 'rgba(255,255,255,0.8)' }}>沟通能力</span>}
                rules={[{ required: true, message: '请对沟通能力评分' }]}
              >
                <Rate style={{ color: '#faad14' }} />
              </Form.Item>
              <Form.Item
                name="teamworkScore"
                label={<span style={{ color: 'rgba(255,255,255,0.8)' }}>团队协作</span>}
                rules={[{ required: true, message: '请对团队协作评分' }]}
              >
                <Rate style={{ color: '#faad14' }} />
              </Form.Item>
              <Form.Item
                name="overallScore"
                label={<span style={{ color: 'rgba(255,255,255,0.8)' }}>总体评价</span>}
                rules={[{ required: true, message: '请对总体表现评分' }]}
              >
                <Rate style={{ color: '#faad14' }} />
              </Form.Item>
              <Form.Item
                name="comment"
                label={<span style={{ color: 'rgba(255,255,255,0.8)' }}>评语</span>}
                rules={[{ required: true, message: '请填写面试评语' }]}
              >
                <TextArea rows={3} placeholder="请输入面试评语..." style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff' }} />
              </Form.Item>
              <Form.Item
                name="recommend"
                label={<span style={{ color: 'rgba(255,255,255,0.8)' }}>是否推荐</span>}
                rules={[{ required: true, message: '请选择是否推荐' }]}
              >
                <Group>
                  <Radio.Button value="yes" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff' }}>
                    推荐录用
                  </Radio.Button>
                  <Radio.Button value="no" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', marginLeft: '8px' }}>
                    不推荐
                  </Radio.Button>
                  <Radio.Button value="pending" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', marginLeft: '8px' }}>
                    待定
                  </Radio.Button>
                </Group>
              </Form.Item>
            </Form>
          </Card>

          <Card
            style={{
              background: '#16213e',
              border: 'none',
              borderRadius: '12px',
              maxHeight: '300px',
              display: 'flex',
              flexDirection: 'column',
            }}
            title={<span style={{ color: '#fff' }}>聊天</span>}
            styles={{ body: {  padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } }}
          >
            <div
              ref={chatContainerRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                marginBottom: '12px',
                paddingRight: '8px',
                minHeight: '150px',
              }}
            >
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '20px 0' }}>
                  暂无消息
                </div>
              ) : (
                <List
                  dataSource={chatMessages}
                  renderItem={(item) => (
                    <List.Item style={{ border: 'none', padding: '8px 0', display: 'flex', justifyContent: item.isSelf ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '80%' }}>
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255,255,255,0.5)',
                          marginBottom: '4px',
                          textAlign: item.isSelf ? 'right' : 'left',
                        }}>
                          {item.sender} · {item.time}
                        </div>
                        <div style={{
                          background: item.isSelf ? '#1890ff' : 'rgba(255,255,255,0.1)',
                          color: '#fff',
                          padding: '8px 12px',
                          borderRadius: item.isSelf ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                          wordBreak: 'break-word',
                        }}>
                          {item.content}
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onPressEnter={handleSendMessage}
                placeholder="输入消息..."
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff' }}
                disabled={!isInterviewStarted}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                disabled={!isInterviewStarted}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="结束面试"
        open={isEndModalVisible}
        onOk={handleConfirmEnd}
        onCancel={() => setIsEndModalVisible(false)}
        okText="确认结束"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p style={{ marginBottom: '16px' }}>确定要结束本次面试吗？结束后将提交面试评价。</p>
        <p style={{ color: '#ff4d4f' }}>注意：结束后无法重新进入面试房间。</p>
      </Modal>
    </div>
  );
}

export default InterviewRoom;
