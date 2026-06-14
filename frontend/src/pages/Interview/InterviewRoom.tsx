import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Modal,
  Form,
  Rate,
  Input,
  Select,
  Tag,
  Space,
  message,
  Typography,
  Row,
  Col,
  List,
  InputNumber,
  Divider,
} from "antd";
import {
  AudioMutedOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  VideoCameraAddOutlined,
  PhoneOutlined,
  ArrowLeftOutlined,
  SafetyOutlined,
  FlagOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import dayjs from "dayjs";
import { interviewAPI } from "../../api";
import type { Interview } from "../../types";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const behaviorMarkers = [
  { key: "confident", label: "自信", color: "green" },
  { key: "nervous", label: "紧张", color: "gold" },
  { key: "honest", label: "诚实", color: "blue" },
  { key: "vague", label: "回答模糊", color: "orange" },
  { key: "exaggerate", label: "夸大经历", color: "red" },
  { key: "professional", label: "专业", color: "purple" },
  { key: "teamwork", label: "团队协作", color: "cyan" },
  { key: "leadership", label: "领导力", color: "magenta" },
];

const InterviewRoom: React.FC = () => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [inCall, setInCall] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [showMarkerPanel, setShowMarkerPanel] = useState(false);
  const [transcript, setTranscript] = useState<
    Array<{ id: number; speaker: string; timestamp: number; text: string; isKeyPoint: boolean }>
  >([]);
  const [markers, setMarkers] = useState<
    Array<{ id: number; timestamp: number; marker: string; description: string; severity: string }>
  >([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [form] = Form.useForm();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (roomId) {
      loadInterview(roomId);
    }
    return () => {
      cleanup();
    };
  }, [roomId]);

  const loadInterview = async (room: string) => {
    try {
      const response = await interviewAPI.getRoomInfo(room);
      setInterview(response as Interview);
    } catch (error) {
      console.error("Failed to load interview:", error);
      message.error("加载面试信息失败");
    } finally {
      setLoading(false);
    }
  };

  const initSocket = () => {
    const token = localStorage.getItem("token");
    const socket = io(window.location.origin, {
      transports: ["websocket"],
      auth: { token: `Bearer ${token}` },
    });

    socket.on("connect", () => {
      console.log("Socket connected");
      socket.emit("join-room", { roomId, interviewId: interview?.id });
    });

    socket.on("offer", async (data) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit("answer", { roomId, answer });
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    });

    socket.on("answer", async (data) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      } catch (error) {
        console.error("Error handling answer:", error);
      }
    });

    socket.on("ice-candidate", async (data) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    });

    socket.on("user-joined", (data) => {
      message.info(`${data.userName} 已加入`);
    });

    socket.on("user-left", (data) => {
      message.info(`${data.userName} 已离开`);
    });

    socket.on("behavior-marker", (data) => {
      setMarkers((prev) => [...prev, data.marker]);
    });

    socket.on("transcript-update", (data) => {
      setTranscript((prev) => [...prev, data.transcript]);
    });

    socketRef.current = socket;
  };

  const initPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          roomId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnectionRef.current = pc;
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      initSocket();
      initPeerConnection();

      if (interview?.id) {
        await interviewAPI.start(interview.id);
      }

      setInCall(true);
      setIsRecording(true);
      startTimer();
      startSpeechRecognition();

      setTimeout(async () => {
        if (peerConnectionRef.current && socketRef.current) {
          try {
            const offer = await peerConnectionRef.current.createOffer();
            await peerConnectionRef.current.setLocalDescription(offer);
            socketRef.current.emit("offer", { roomId, offer });
          } catch (error) {
            console.error("Error creating offer:", error);
          }
        }
      }, 1000);

      message.success("面试已开始");
    } catch (error: any) {
      console.error("Failed to start call:", error);
      message.error(error?.message || "无法访问摄像头或麦克风，请检查权限");
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setCurrentTime((prev) => prev + 1);
    }, 1000);
  };

  const startSpeechRecognition = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "zh-CN";

      recognition.onresult = async (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const text = event.results[i][0].transcript;
            const transcriptItem = {
              id: Date.now(),
              speaker: "候选人",
              timestamp: currentTime,
              text,
              isKeyPoint: false,
            };
            setTranscript((prev) => [...prev, transcriptItem]);

            if (interview?.id && transcriptItem.text.trim().length > 0) {
              try {
                await interviewAPI.saveTranscript(interview.id, [...transcript, transcriptItem]);
              } catch (error) {
                console.error("Failed to save transcript:", error);
              }
            }
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
      };

      recognition.start();
      recognitionRef.current = recognition;
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const addBehaviorMarker = async (marker: any) => {
    const newMarker = {
      id: Date.now(),
      timestamp: currentTime,
      marker: marker.key,
      description: marker.label,
      severity: marker.color,
    };
    setMarkers((prev) => [...prev, newMarker]);

    if (interview?.id) {
      try {
        await interviewAPI.addBehaviorMarker(interview.id, newMarker);
      } catch (error) {
        console.error("Failed to add marker:", error);
      }
    }

    if (socketRef.current) {
      socketRef.current.emit("behavior-marker", { roomId, marker: newMarker });
    }

    message.success(`已标记: ${marker.label}`);
  };

  const endCall = async () => {
    if (interview?.status !== "in_progress") {
      cleanup();
      navigate("/interviews");
      return;
    }

    Modal.confirm({
      title: "确认结束面试？",
      content: "结束后将进入面试评价环节",
      okText: "结束面试",
      cancelText: "取消",
      onOk: async () => {
        try {
          if (interview?.id) {
            await interviewAPI.end(interview.id);
          }
          cleanup();
          setInCall(false);
          setIsRecording(false);
          setShowEvaluation(true);
          message.success("面试已结束");
        } catch (error: any) {
          message.error(error?.message || "结束失败");
        }
      },
    });
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const handleEvaluationSubmit = async (values: any) => {
    if (!interview) return;
    try {
      const strengths = values.strengths ? values.strengths.split(",").map((s: string) => s.trim()) : [];
      const weaknesses = values.weaknesses ? values.weaknesses.split(",").map((s: string) => s.trim()) : [];
      const overallScore = Math.round(
        (values.technicalScore + values.communicationScore + values.problemSolvingScore + values.culturalFitScore) / 4
      );

      await interviewAPI.submitEvaluation(interview.id, {
        ...values,
        overallScore,
        strengths,
        weaknesses,
        evaluatedAt: new Date().toISOString(),
      });

      message.success("评价已提交");
      setShowEvaluation(false);
      navigate("/interviews");
    } catch (error: any) {
      message.error(error?.message || "提交失败");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return <div className="skeleton-loading">加载中...</div>;
  }

  if (!interview) {
    return (
      <Card>
        <div className="empty-state">面试不存在</div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/interviews")}>
          返回列表
        </Button>
      </Card>
    );
  }

  return (
    <div className="video-interview-container">
      {!inCall && interview.status !== "in_progress" && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            background: "#1a1a1a",
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 24 }}>🎥</div>
          <Title level={2} style={{ color: "#fff", marginBottom: 8 }}>
            {interview.candidate?.name} 的视频面试
          </Title>
          <Text type="secondary" style={{ color: "#999", marginBottom: 32 }}>
            {interview.position?.title} · {dayjs(interview.scheduledAt).format("YYYY-MM-DD HH:mm")} ·{" "}
            {interview.duration}分钟
          </Text>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/interviews")}>
              返回
            </Button>
            <Button type="primary" size="large" icon={<VideoCameraOutlined />} onClick={startCall}>
              开始面试
            </Button>
          </Space>
        </div>
      )}

      {(inCall || interview.status === "in_progress") && (
        <>
          <div
            style={{
              background: "#1a1a1a",
              padding: "8px 16px",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Space>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/interviews")}
                style={{ color: "#fff" }}
              />
              <span style={{ fontWeight: 600 }}>
                {interview.candidate?.name} - {interview.position?.title}
              </span>
              <Tag color="red">{interview.status === "in_progress" ? "面试中" : "进行中"}</Tag>
            </Space>
            <Space>
              <ClockCircleOutlined />
              <span style={{ fontFamily: "monospace", fontSize: 18 }}>{formatTime(currentTime)}</span>
              {isRecording && <span style={{ color: "#ff4d4f" }}>● 录制中</span>}
            </Space>
            <Space>
              <Button
                type="text"
                icon={<SafetyOutlined />}
                onClick={() => setShowMarkerPanel(!showMarkerPanel)}
                style={{ color: showMarkerPanel ? "#1890ff" : "#fff" }}
              >
                行为标记
              </Button>
            </Space>
          </div>

          <div className="video-grid two-participants">
            <div className="video-container">
              <video ref={remoteVideoRef} autoPlay playsInline />
              <div className="video-label">{interview.candidate?.name}</div>
            </div>
            <div className="video-container">
              <video ref={localVideoRef} autoPlay playsInline muted style={{ transform: "scaleX(-1)" }} />
              <div className="video-label">我</div>
            </div>
          </div>

          {showMarkerPanel && (
            <div className="behavior-marker-panel">
              <div style={{ fontWeight: 600, marginBottom: 12 }}>行为标记</div>
              <Row gutter={[8, 8]}>
                {behaviorMarkers.map((marker) => (
                  <Col span={12} key={marker.key}>
                    <Button
                      block
                      size="small"
                      onClick={() => addBehaviorMarker(marker)}
                      style={{
                        borderColor: marker.color === "green"
                          ? "#52c41a"
                          : marker.color === "red"
                          ? "#ff4d4f"
                          : marker.color === "gold"
                          ? "#faad14"
                          : "#1890ff",
                        color: marker.color === "green"
                          ? "#52c41a"
                          : marker.color === "red"
                          ? "#ff4d4f"
                          : marker.color === "gold"
                          ? "#faad14"
                          : "#1890ff",
                      }}
                    >
                      {marker.label}
                    </Button>
                  </Col>
                ))}
              </Row>
              <Divider />
              <div style={{ fontWeight: 600, marginBottom: 8 }}>已标记 ({markers.length})</div>
              <List
                size="small"
                dataSource={markers}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color={item.severity}>{item.description}</Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {formatTime(item.timestamp)}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          )}

          <div className="transcript-panel">
            <div style={{ fontWeight: 600, marginBottom: 8 }}>实时转写</div>
            {transcript.length === 0 ? (
              <Text type="secondary">等待语音输入...</Text>
            ) : (
              transcript.slice(-5).map((item) => (
                <div
                  key={item.id}
                  className={`transcript-item ${item.isKeyPoint ? "keypoint" : ""}`}
                >
                  <span className="transcript-speaker">{item.speaker}</span>
                  <span className="transcript-time">{formatTime(item.timestamp)}</span>
                  <span>{item.text}</span>
                </div>
              ))
            )}
          </div>

          <div className="video-controls">
            <button
              className={`video-control-btn audio`}
              onClick={toggleAudio}
              title={audioEnabled ? "静音" : "开启声音"}
            >
              {audioEnabled ? <AudioOutlined /> : <AudioMutedOutlined />}
            </button>
            <button
              className={`video-control-btn video`}
              onClick={toggleVideo}
              title={videoEnabled ? "关闭摄像头" : "开启摄像头"}
            >
              {videoEnabled ? <VideoCameraOutlined /> : <VideoCameraAddOutlined />}
            </button>
            <button className="video-control-btn end" onClick={endCall} title="结束面试">
              <PhoneOutlined style={{ transform: "rotate(135deg)" }} />
            </button>
          </div>
        </>
      )}

      <Modal
        title="面试评价"
        open={showEvaluation}
        onCancel={() => setShowEvaluation(false)}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleEvaluationSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="technicalScore"
                label="技术能力"
                rules={[{ required: true, message: "请评分" }]}
              >
                <Rate count={10} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="communicationScore"
                label="沟通表达"
                rules={[{ required: true, message: "请评分" }]}
              >
                <Rate count={10} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="problemSolvingScore"
                label="问题解决"
                rules={[{ required: true, message: "请评分" }]}
              >
                <Rate count={10} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="culturalFitScore"
                label="文化匹配"
                rules={[{ required: true, message: "请评分" }]}
              >
                <Rate count={10} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="recommendation"
                label="录用建议"
                rules={[{ required: true, message: "请选择" }]}
              >
                <Select placeholder="请选择" style={{ width: "100%" }}>
                  <Option value="strong_hire">强烈推荐录用</Option>
                  <Option value="hire">推荐录用</Option>
                  <Option value="pass">待定</Option>
                  <Option value="no_hire">不推荐</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="strengths" label="优点(逗号分隔)">
                <TextArea rows={2} placeholder="如：技术扎实,沟通能力强" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="weaknesses" label="不足(逗号分隔)">
                <TextArea rows={2} placeholder="如：经验稍欠,需提升" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="notes" label="评价备注">
                <TextArea rows={4} placeholder="详细评价..." />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={() => setShowEvaluation(false)}>跳过</Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit">
                提交评价
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default InterviewRoom;
