import React, { useEffect, useState, useRef } from "react";
import {
  Card,
  Input,
  Button,
  Avatar,
  List,
  Typography,
  Badge,
  Tag,
  Space,
  Upload,
  message,
  Tooltip,
  Modal,
  Form,
  Select,
  Empty,
  Row,
  Col,
} from "antd";
import {
  SendOutlined,
  PaperClipOutlined,
  UserOutlined,
  LockOutlined,
  CheckCircleOutlined,
  SafetyOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import { io, Socket } from "socket.io-client";
import dayjs from "dayjs";
import { imAPI, analyticsAPI } from "../../api";
import { AUDIT_STATUS_MAP, ENCRYPTION_TYPE_MAP } from "../../constants";
import type { IMMessage, User, MessageAttachment } from "../../types";

const { Title, Text } = Typography;
const { Option } = Select;

const IMChat: React.FC = () => {
  const [conversations, setConversations] = useState<
    Array<{ userId: number; user: User; lastMessage: IMMessage; unreadCount: number }>
  >([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [messages, setMessages] = useState<IMMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatForm] = Form.useForm();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadConversations();
    loadUsers();
    initSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const response = await imAPI.getConversations();
      setConversations(response?.data || []);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await analyticsAPI.getUsers();
      setUsers(response?.data || []);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const loadMessages = async (userId: number) => {
    setMessagesLoading(true);
    try {
      const response = await imAPI.getMessages(userId);
      setMessages(response?.data || []);
      await imAPI.markAsRead(userId);
      loadConversations();
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const initSocket = () => {
    const token = localStorage.getItem("token");
    const socket = io(window.location.origin, {
      transports: ["websocket"],
      auth: { token: `Bearer ${token}` },
    });

    socket.on("connect", () => {
      console.log("IM Socket connected");
    });

    socket.on("message", (data) => {
      const newMessage = data.message;
      if (selectedUser === newMessage.senderId) {
        setMessages((prev) => [...prev, newMessage]);
        imAPI.markAsRead(newMessage.senderId);
      }
      loadConversations();
    });

    socket.on("message-read", (data) => {
      console.log("Message read:", data);
    });

    socketRef.current = socket;
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !inputValue.trim()) return;
    try {
      const newMessage = await imAPI.sendMessage(selectedUser, "text", inputValue);
      setMessages((prev) => [...prev, newMessage]);
      setInputValue("");

      if (socketRef.current) {
        socketRef.current.emit("message", {
          receiverId: selectedUser,
          message: newMessage,
        });
      }

      loadConversations();
    } catch (error: any) {
      message.error(error?.message || "发送失败");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (file: File) => {
    if (!selectedUser) return;
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error("文件必须小于 10MB!");
      return Upload.LIST_IGNORE;
    }
    const type = file.type.startsWith("image/") ? "image" : "file";
    imAPI.sendMessage(selectedUser, type, "", file).then((newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      if (socketRef.current) {
        socketRef.current.emit("message", {
          receiverId: selectedUser,
          message: newMessage,
        });
      }
      loadConversations();
      message.success("文件发送成功");
    }).catch((error: any) => {
      message.error(error?.message || "发送失败");
    });
    return false;
  };

  const handleSelectUser = async (userId: number) => {
    setSelectedUser(userId);
  };

  const handleNewChat = async (values: { userId: number }) => {
    try {
      setSelectedUser(values.userId);
      setShowNewChatModal(false);
      newChatForm.resetFields();
    } catch (error: any) {
      message.error(error?.message || "创建失败");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getCurrentUserId = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user?.id;
    }
    return null;
  };

  const currentUserId = getCurrentUserId();
  const selectedUserData = conversations.find((c) => c.userId === selectedUser)?.user;

  const getAuditStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "#52c41a";
      case "pending":
        return "#faad14";
      case "warning":
        return "#fa8c16";
      case "violation":
        return "#ff4d4f";
      default:
        return "#bfbfbf";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  const renderAttachment = (attachment: MessageAttachment) => {
    const FileIcon = attachment.type.startsWith("image/") ? FileImageOutlined : FileTextOutlined;
    return (
      <div
        key={attachment.id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: "rgba(0, 0, 0, 0.04)",
          borderRadius: 4,
          marginBottom: 4,
        }}
      >
        <FileIcon />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Text ellipsis style={{ maxWidth: 180 }}>
              {attachment.name}
            </Text>
            {attachment.isEncrypted && (
              <Tooltip title={ENCRYPTION_TYPE_MAP["AES-256"] || "端到端AES加密"}>
                <LockOutlined style={{ fontSize: 12, color: "#1890ff" }} />
              </Tooltip>
            )}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatFileSize(attachment.size)}
          </Text>
        </div>
      </div>
    );
  };

  const renderMessageContent = (message: IMMessage) => {
    const isSelf = message.senderId === currentUserId;
    const content = isSelf ? message.content : message.decryptedContent || message.content;

    return (
      <div>
        {content && <div style={{ marginBottom: message.attachments?.length ? 8 : 0 }}>{content}</div>}
        {message.type === "file" || message.type === "image" ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              background: "rgba(0, 0, 0, 0.04)",
              borderRadius: 4,
            }}
          >
            {message.type === "image" ? <FileImageOutlined /> : <FileTextOutlined />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>{message.fileInfo?.name || "文件"}</span>
                {message.isEncrypted && (
                  <Tooltip title={message.encryptionType ? ENCRYPTION_TYPE_MAP[message.encryptionType] || message.encryptionType : "端到端AES加密"}>
                    <LockOutlined style={{ fontSize: 12, color: "#1890ff" }} />
                  </Tooltip>
                )}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatFileSize(message.fileInfo?.size || 0)}
              </Text>
            </div>
          </div>
        ) : null}
        {message.attachments?.map((att) => renderAttachment(att))}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <Row justify="space-between" align="middle">
          <Col>
            <div className="page-title">
              IM沟通
              <Tag color="green" style={{ marginLeft: 12 }}>
                <LockOutlined /> 端到端加密
              </Tag>
            </div>
            <div className="page-subtitle">安全加密的内部沟通，支持文件传输和合规审计</div>
          </Col>
          <Col>
            <Button type="primary" onClick={() => setShowNewChatModal(true)}>
              新对话
            </Button>
          </Col>
        </Row>
      </div>

      <Card bordered={false} bodyStyle={{ padding: 0 }}>
        <div className="chat-container">
          <div className="chat-sidebar">
            {loading ? (
              <div className="skeleton-loading">加载中...</div>
            ) : conversations.length === 0 ? (
              <Empty description="暂无对话" style={{ padding: 48 }} />
            ) : (
              conversations.map((conv) => {
                const lastMsg = conv.lastMessage;
                const isLastMsgSelf = lastMsg?.senderId === currentUserId;
                const lastMsgPreview = lastMsg?.type === "text"
                  ? lastMsg.decryptedContent || lastMsg.content
                  : lastMsg?.type === "image"
                  ? "[图片]"
                  : lastMsg?.type === "file"
                  ? "[文件]"
                  : "";

                return (
                  <div
                    key={conv.userId}
                    className={`chat-conversation-item ${selectedUser === conv.userId ? "active" : ""}`}
                    onClick={() => handleSelectUser(conv.userId)}
                  >
                    <Badge count={conv.unreadCount > 0 ? conv.unreadCount : 0} size="small" offset={[2, 2]}>
                      <Avatar size={40} icon={<UserOutlined />} src={conv.user?.avatar} />
                    </Badge>
                    <div style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Text strong ellipsis style={{ maxWidth: 140 }}>
                          {conv.user?.name}
                        </Text>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {lastMsg && (
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {dayjs(lastMsg.createdAt).format("HH:mm")}
                            </Text>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                        {isLastMsgSelf && lastMsg && (
                          <CheckCircleOutlined
                            style={{
                              fontSize: 11,
                              color: lastMsg.isRead ? "#1890ff" : "#bfbfbf",
                            }}
                          />
                        )}
                        <Text type="secondary" ellipsis style={{ fontSize: 12, flex: 1 }}>
                          {lastMsgPreview}
                        </Text>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="chat-main">
            {!selectedUser ? (
              <div className="empty-state" style={{ height: "100%" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                <Text type="secondary">选择一个对话开始聊天</Text>
              </div>
            ) : (
              <>
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #e8e8e8",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#fff",
                  }}
                >
                  <Space>
                    <Avatar size={36} icon={<UserOutlined />} src={selectedUserData?.avatar} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{selectedUserData?.name}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {selectedUserData?.role === "admin"
                          ? "系统管理员"
                          : selectedUserData?.role === "hr"
                          ? "HR"
                          : selectedUserData?.role === "hiring_manager"
                          ? "用人经理"
                          : "面试官"}
                      </Text>
                    </div>
                  </Space>
                  <Space>
                    <Tooltip title="消息已加密">
                      <SafetyOutlined style={{ color: "#52c41a" }} />
                    </Tooltip>
                  </Space>
                </div>

                <div className="chat-messages">
                  {messagesLoading ? (
                    <div className="skeleton-loading">加载中...</div>
                  ) : messages.length === 0 ? (
                    <Empty description="暂无消息，开始聊天吧" style={{ padding: 48 }} />
                  ) : (
                    messages.map((msg) => {
                      const isSelf = msg.senderId === currentUserId;
                      const auditStatusText = AUDIT_STATUS_MAP[msg.auditStatus] || msg.auditStatus;
                      const auditStatusColor = getAuditStatusColor(msg.auditStatus);
                      const auditTooltip = msg.auditResult
                        ? `风险等级: ${msg.auditResult.riskLevel}\n敏感词: ${msg.auditResult.matchedKeywords.join(", ")}${msg.auditResult.notes ? `\n备注: ${msg.auditResult.notes}` : ""}`
                        : auditStatusText;
                      const encryptionTooltip = msg.encryptionType
                        ? ENCRYPTION_TYPE_MAP[msg.encryptionType] || msg.encryptionType
                        : "端到端AES加密";

                      return (
                        <div key={msg.id} className={`chat-message ${isSelf ? "self" : ""}`}>
                          <Avatar size={32} icon={<UserOutlined />} src={isSelf ? undefined : selectedUserData?.avatar} />
                          <div style={{ flex: 1 }}>
                            <div className="chat-message-content">{renderMessageContent(msg)}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {dayjs(msg.createdAt).format("HH:mm")}
                              </Text>
                              {msg.isEncrypted && (
                                <Tooltip title={encryptionTooltip}>
                                  <LockOutlined style={{ fontSize: 12, color: "#1890ff" }} />
                                </Tooltip>
                              )}
                              <Tooltip title={auditTooltip}>
                                <SafetyOutlined style={{ fontSize: 12, color: auditStatusColor }} />
                              </Tooltip>
                              {isSelf && (
                                <Tooltip title={msg.isRead ? `已读${msg.readAt ? ` · ${dayjs(msg.readAt).format("HH:mm")}` : ""}` : "未读"}>
                                  <CheckCircleOutlined
                                    style={{ fontSize: 12, color: msg.isRead ? "#1890ff" : "#bfbfbf" }}
                                  />
                                </Tooltip>
                              )}
                              {msg.complianceCheck?.hasViolation && (
                                <Tooltip title={msg.complianceCheck.description}>
                                  <ExclamationCircleOutlined style={{ color: "#faad14" }} />
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-container">
                  <Row gutter={8} align="middle">
                    <Col flex="none">
                      <Upload showUploadList={false} beforeUpload={handleFileUpload}>
                        <Button icon={<PaperClipOutlined />} type="text" />
                      </Upload>
                    </Col>
                    <Col flex="auto">
                      <Input.TextArea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="输入消息，按 Enter 发送..."
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        style={{ resize: "none" }}
                      />
                    </Col>
                    <Col flex="none">
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim()}
                      >
                        发送
                      </Button>
                    </Col>
                  </Row>
                  <div style={{ marginTop: 8 }}>
                    <Space size="large">
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <LockOutlined style={{ marginRight: 4 }} />
                        消息已端到端加密
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <SafetyOutlined style={{ marginRight: 4 }} />
                        内容受合规审计
                      </Text>
                    </Space>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      <Modal
        title="发起新对话"
        open={showNewChatModal}
        onCancel={() => setShowNewChatModal(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={newChatForm} layout="vertical" onFinish={handleNewChat}>
          <Form.Item
            name="userId"
            label="选择用户"
            rules={[{ required: true, message: "请选择用户" }]}
          >
            <Select placeholder="请选择用户" showSearch style={{ width: "100%" }}>
              {users
                .filter((u) => u.id !== currentUserId)
                .map((u) => (
                  <Option key={u.id} value={u.id}>
                    {u.name} ({u.role === "admin" ? "管理员" : u.role === "hr" ? "HR" : u.role === "hiring_manager" ? "用人经理" : "面试官"})
                  </Option>
                ))}
            </Select>
          </Form.Item>
          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={() => setShowNewChatModal(false)}>取消</Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit">开始对话</Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default IMChat;
