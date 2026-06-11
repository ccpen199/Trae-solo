import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  InputNumber,
  message,
  Row,
  Col,
  Typography,
  Tooltip,
  Popconfirm,
  Timeline,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  VideoCameraOutlined,
  EyeOutlined,
  EditOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  StarOutlined,
  BulbOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { interviewAPI, positionAPI, candidateAPI, analyticsAPI } from "../../api";
import { INTERVIEW_ROUND_MAP, INTERVIEW_STATUS_MAP, BEHAVIOR_MARKERS, INTERVIEW_RECOMMENDATION_MAP } from "../../constants";
import type { Interview, Position, Candidate, User } from "../../types";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const InterviewList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const candidateIdFromUrl = searchParams.get("candidateId");

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [dateRange, setDateRange] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [form] = Form.useForm();
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviewers, setInterviewers] = useState<User[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [transcriptModalVisible, setTranscriptModalVisible] = useState(false);
  const [transcriptInterview, setTranscriptInterview] = useState<Interview | null>(null);

  useEffect(() => {
    loadPositions();
    loadInterviewers();
    loadCandidates();
  }, []);

  useEffect(() => {
    loadInterviews();
    if (candidateIdFromUrl) {
      form.setFieldsValue({
        candidateId: parseInt(candidateIdFromUrl),
      });
      setModalVisible(true);
    }
  }, [page, pageSize, statusFilter, searchKeyword, dateRange]);

  const loadPositions = async () => {
    try {
      const res = await positionAPI.getList({ status: "published", pageSize: 100 });
      setPositions(res?.data || []);
    } catch (error) {
      console.error("Failed to load positions:", error);
    }
  };

  const loadCandidates = async () => {
    try {
      const res = await candidateAPI.getList({ pageSize: 100 });
      setCandidates(res?.data || []);
    } catch (error) {
      console.error("Failed to load candidates:", error);
    }
  };

  const loadInterviewers = async () => {
    try {
      const res = await analyticsAPI.getUsers("interviewer");
      setInterviewers(res?.data || []);
    } catch (error) {
      console.error("Failed to load interviewers:", error);
    }
  };

  const loadInterviews = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (statusFilter) params.status = statusFilter;
      if (searchKeyword) params.keyword = searchKeyword;
      if (dateRange?.length === 2) {
        params.startDate = dateRange[0].format("YYYY-MM-DD");
        params.endDate = dateRange[1].format("YYYY-MM-DD");
      }
      const response = await interviewAPI.getList(params);
      setInterviews(response?.data || []);
      setTotal(response?.total || 0);
    } catch (error) {
      console.error("Failed to load interviews:", error);
      message.error("加载面试列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingInterview(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (interview: Interview) => {
    setEditingInterview(interview);
    form.setFieldsValue({
      ...interview,
      scheduledAt: dayjs(interview.scheduledAt),
    });
    setModalVisible(true);
  };

  const handleCancel = async (id: number, reason: string) => {
    try {
      await interviewAPI.cancel(id, reason);
      message.success("面试已取消");
      loadInterviews();
    } catch (error: any) {
      message.error(error?.message || "取消失败");
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        scheduledAt: values.scheduledAt.toISOString(),
      };
      if (editingInterview) {
        await interviewAPI.update(editingInterview.id, data);
        message.success("面试更新成功");
      } else {
        await interviewAPI.create(data);
        message.success("面试创建成功");
      }
      setModalVisible(false);
      form.resetFields();
      loadInterviews();
    } catch (error: any) {
      message.error(error?.message || "保存失败");
    }
  };

  const handleViewDetail = (interview: Interview) => {
    setSelectedInterview(interview);
    setDetailModalVisible(true);
  };

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getVideoStatus = (interview: Interview) => {
    if (interview.type !== "video") return null;
    const now = dayjs();
    const scheduled = dayjs(interview.scheduledAt);
    const endTime = scheduled.add(interview.duration, "minute");

    if (interview.status === "completed") {
      return { status: "ended", text: "已结束", icon: <CheckCircleOutlined />, color: "success" };
    }
    if (interview.status === "in_progress") {
      return { status: "ongoing", text: "进行中", icon: <PlayCircleOutlined />, color: "processing" };
    }
    if (now.isBefore(scheduled)) {
      return { status: "not_started", text: "未开始", icon: <PauseCircleOutlined />, color: "default" };
    }
    if (now.isAfter(endTime)) {
      return { status: "ended", text: "已结束", icon: <CheckCircleOutlined />, color: "success" };
    }
    return { status: "ongoing", text: "进行中", icon: <PlayCircleOutlined />, color: "processing" };
  };

  const getMarkerColor = (marker: string): string => {
    const colorMap: Record<string, string> = {
      "自信": "green",
      "专业": "green",
      "团队协作": "blue",
      "领导力": "purple",
      "紧张": "orange",
      "回答模糊": "orange",
      "夸大经历": "red",
      "诚实": "green",
    };
    return colorMap[marker] || "default";
  };

  const getRecommendationText = (recommendation: string): string => {
    return INTERVIEW_RECOMMENDATION_MAP[recommendation] || recommendation;
  };

  const renderBehaviorMarkers = (markers: Interview["behaviorMarkers"]) => {
    if (!markers || markers.length === 0) {
      return <Tag color="default" icon={<ExclamationCircleOutlined />}>无</Tag>;
    }
    const markerTypes = [...new Set(markers.map((m) => m.marker))];
    const summary = markerTypes.slice(0, 3).join("、");
    const more = markerTypes.length > 3 ? ` 等${markerTypes.length}种` : "";
    return (
      <Tooltip title={`共 ${markers.length} 个打点：${markerTypes.join("、")}`}>
        <Tag color="red" icon={<ExclamationCircleOutlined />}>
          {markers.length} 个
        </Tag>
        <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
          {summary}{more}
        </div>
      </Tooltip>
    );
  };

  const handleViewTranscript = (interview: Interview) => {
    setTranscriptInterview(interview);
    setTranscriptModalVisible(true);
  };

  const renderTranscriptModal = () => {
    if (!transcriptInterview || !transcriptInterview.transcriptData) return null;
    return (
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>转文字记录详情</span>
            <Tag color="green">{transcriptInterview.transcriptData.length} 条</Tag>
          </Space>
        }
        open={transcriptModalVisible}
        onCancel={() => setTranscriptModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setTranscriptModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
        destroyOnClose
      >
        <div
          style={{
            maxHeight: 500,
            overflowY: "auto",
            padding: "12px 16px",
            background: "#fafafa",
            borderRadius: 8,
          }}
        >
          <Timeline>
            {transcriptInterview.transcriptData.map((item, index) => (
              <Timeline.Item
                key={index}
                color={item.speaker === "面试官" ? "blue" : "green"}
              >
                <Space>
                  <Tag color="default" style={{ fontSize: 12 }}>
                    {formatTimestamp(item.timestamp)}
                  </Tag>
                  <Text strong style={{ minWidth: 60 }}>
                    {item.speaker}
                  </Text>
                  <Text>{item.text}</Text>
                  {!item.isFinal && (
                    <Tag color="orange" style={{ fontSize: 10 }}>
                      转写中
                    </Tag>
                  )}
                </Space>
              </Timeline.Item>
            ))}
          </Timeline>
        </div>
      </Modal>
    );
  };

  const statusMap = INTERVIEW_STATUS_MAP;

  const typeMap: Record<string, string> = {
    phone: "电话面试",
    video: "视频面试",
    onsite: "现场面试",
  };

  const roundMap = INTERVIEW_ROUND_MAP;

  const columns = [
    {
      title: "候选人",
      dataIndex: "candidate",
      key: "candidate",
      render: (candidate: Candidate) => (
        <Space>
          <UserOutlined />
          {candidate?.name || "-"}
        </Space>
      ),
    },
    {
      title: "面试职位",
      dataIndex: "position",
      key: "position",
      render: (position: Position) => position?.title || "-",
    },
    {
      title: "面试官",
      dataIndex: "interviewer",
      key: "interviewer",
      render: (interviewer: User) => interviewer?.name || "-",
    },
    {
      title: "轮次",
      dataIndex: "round",
      key: "round",
      render: (round: string) => roundMap[round] || round,
    },
    {
      title: "面试类型",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        const typeIcons: Record<string, React.ReactNode> = {
          video: <VideoCameraOutlined />,
          onsite: <UserOutlined />,
          phone: <ClockCircleOutlined />,
        };
        return (
          <Tag color={type === "video" ? "blue" : type === "onsite" ? "green" : "orange"}>
            <Space size={4}>
              {typeIcons[type]}
              {typeMap[type] || type}
            </Space>
          </Tag>
        );
      },
    },
    {
      title: "视频面试状态",
      key: "videoStatus",
      render: (_: any, record: Interview) => {
        const videoStatus = getVideoStatus(record);
        if (!videoStatus) return <Text type="secondary">-</Text>;
        return (
          <Space direction="vertical" size={4}>
            <Tag icon={videoStatus.icon} color={videoStatus.color as any}>
              {videoStatus.text}
            </Tag>
            {record.roomId && (
              <div style={{ fontSize: 11, color: "#999" }}>
                会议室: {record.roomId}
              </div>
            )}
            {record.meetingUrl && (
              <Tooltip title="点击进入会议室">
                <Button
                  type="link"
                  size="small"
                  icon={<VideoCameraOutlined />}
                  onClick={() => window.open(record.meetingUrl, "_blank")}
                  style={{ padding: 0, height: "auto" }}
                >
                  视频会议链接
                </Button>
              </Tooltip>
            )}
            {!record.meetingUrl && !record.roomId && videoStatus.status === "not_started" && (
              <Tag color="orange">待生成链接</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "面试时间",
      dataIndex: "scheduledAt",
      key: "scheduledAt",
      render: (date: string, record: Interview) => (
        <div>
          <div>{dayjs(date).format("YYYY-MM-DD HH:mm")}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.duration}分钟
          </Text>
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const info = statusMap[status] || { color: "default", text: status };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: "转文字记录",
      key: "transcript",
      render: (_: any, record: Interview) => {
        const count = record.transcriptData?.length || 0;
        return count > 0 ? (
          <Tooltip title="点击查看详情">
            <Tag
              color="green"
              icon={<FileTextOutlined />}
              style={{ cursor: "pointer" }}
              onClick={() => handleViewTranscript(record)}
            >
              {count} 条记录
            </Tag>
          </Tooltip>
        ) : (
          <Tag color="default" icon={<FileTextOutlined />}>
            无记录
          </Tag>
        );
      },
    },
    {
      title: "关键行为打点",
      key: "behaviorMarkers",
      render: (_: any, record: Interview) => renderBehaviorMarkers(record.behaviorMarkers),
    },
    {
      title: "面试评分",
      key: "evaluation",
      render: (_: any, record: Interview) => {
        const evalData = record.evaluation;
        if (!evalData) return <Text type="secondary">-</Text>;
        const recColor =
          evalData.recommendation === "strong_hire"
            ? "green"
            : evalData.recommendation === "hire"
            ? "blue"
            : evalData.recommendation === "no_hire"
            ? "red"
            : "default";
        return (
          <Space direction="vertical" size={2}>
            <Space>
              <StarOutlined style={{ color: "#faad14" }} />
              <Text strong style={{ color: "#faad14" }}>
                {evalData.overallScore}分
              </Text>
            </Space>
            <Tag color={recColor} style={{ margin: 0 }}>
              {getRecommendationText(evalData.recommendation)}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right" as const,
      width: 150,
      render: (_: any, record: Interview) => (
        <Space size="small">
          {record.status === "scheduled" && (
            <Tooltip title="进入面试">
              <Button
                type="link"
                size="small"
                icon={<VideoCameraOutlined />}
                onClick={() => navigate(`/interviews/room/${record.roomId}`)}
              >
                进入
              </Button>
            </Tooltip>
          )}
          {record.status === "scheduled" && (
            <Tooltip title="编辑">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
            </Tooltip>
          )}
          <Tooltip title="查看详情">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            >
              详情
            </Button>
          </Tooltip>
          {record.status === "scheduled" && (
            <Popconfirm
              title="确定取消该面试吗？"
              description="请输入取消原因："
              onConfirm={(e) => handleCancel(record.id, e?.toString() || "取消")}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<CloseOutlined />}>
                取消
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Row justify="space-between" align="middle">
          <Col>
            <div className="page-title">面试管理</div>
            <div className="page-subtitle">安排和管理面试，支持视频面试和面试记录</div>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              安排面试
            </Button>
          </Col>
        </Row>
      </div>

      <Card bordered={false}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="搜索候选人、职位、面试官"
              prefix={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="按状态筛选"
              allowClear
              style={{ width: "100%" }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              {Object.entries(statusMap).map(([key, value]) => (
                <Option key={key} value={key}>
                  {value.text}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={10}>
            <RangePicker
              style={{ width: "100%" }}
              placeholder={["开始日期", "结束日期"]}
              value={dateRange}
              onChange={setDateRange}
            />
          </Col>
        </Row>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={interviews}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </Card>

      <Modal
        title={editingInterview ? "编辑面试" : "安排面试"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: "video",
            round: "first",
            duration: 60,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="candidateId"
                label="候选人"
                rules={[{ required: true, message: "请选择候选人" }]}
              >
                <Select placeholder="请选择" showSearch style={{ width: "100%" }}>
                  {candidates.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name} - {c.position?.title}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="positionId"
                label="面试职位"
                rules={[{ required: true, message: "请选择职位" }]}
              >
                <Select placeholder="请选择" showSearch style={{ width: "100%" }}>
                  {positions.map((p) => (
                    <Option key={p.id} value={p.id}>
                      {p.title}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="interviewerId"
                label="面试官"
                rules={[{ required: true, message: "请选择面试官" }]}
              >
                <Select placeholder="请选择" showSearch style={{ width: "100%" }}>
                  {interviewers.map((u) => (
                    <Option key={u.id} value={u.id}>
                      {u.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="round"
                label="面试轮次"
                rules={[{ required: true, message: "请选择轮次" }]}
              >
                <Select placeholder="请选择" style={{ width: "100%" }}>
                  <Option value="first">初试</Option>
                  <Option value="second">复试</Option>
                  <Option value="third">三试</Option>
                  <Option value="final">终试</Option>
                  <Option value="hr">HR面</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="面试类型"
                rules={[{ required: true, message: "请选择类型" }]}
              >
                <Select placeholder="请选择" style={{ width: "100%" }}>
                  <Option value="video">视频面试</Option>
                  <Option value="phone">电话面试</Option>
                  <Option value="onsite">现场面试</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="duration"
                label="时长(分钟)"
                rules={[{ required: true, message: "请输入时长" }]}
              >
                <InputNumber min={15} step={15} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="scheduledAt"
                label="面试时间"
                rules={[{ required: true, message: "请选择时间" }]}
              >
                <DatePicker
                  showTime
                  style={{ width: "100%" }}
                  placeholder="选择面试时间"
                  disabledDate={(current) => current && current < dayjs().startOf("day")}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="interviewQuestions" label="面试题目">
                <TextArea rows={4} placeholder="准备的面试问题，可换行分隔" />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit">
                {editingInterview ? "保存" : "安排"}
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <EyeOutlined />
            <span>面试详情</span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={900}
        destroyOnClose
      >
        {selectedInterview && (
          <div className="interview-detail">
            <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
              基本信息
            </Title>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <UserOutlined style={{ color: "#1890ff" }} />
                  <Text type="secondary">候选人：</Text>
                  <Text strong>{selectedInterview.candidate?.name || "-"}</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <BulbOutlined style={{ color: "#1890ff" }} />
                  <Text type="secondary">面试职位：</Text>
                  <Text strong>{selectedInterview.position?.title || "-"}</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <UserOutlined style={{ color: "#52c41a" }} />
                  <Text type="secondary">面试官：</Text>
                  <Text strong>{selectedInterview.interviewer?.name || "-"}</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ClockCircleOutlined style={{ color: "#fa8c16" }} />
                  <Text type="secondary">轮次：</Text>
                  <Text strong>{roundMap[selectedInterview.round] || selectedInterview.round}</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <VideoCameraOutlined style={{ color: "#722ed1" }} />
                  <Text type="secondary">类型：</Text>
                  <Tag color={selectedInterview.type === "video" ? "blue" : selectedInterview.type === "onsite" ? "green" : "orange"}>
                    {typeMap[selectedInterview.type] || selectedInterview.type}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CalendarOutlined style={{ color: "#13c2c2" }} />
                  <Text type="secondary">时间：</Text>
                  <Text strong>
                    {dayjs(selectedInterview.scheduledAt).format("YYYY-MM-DD HH:mm")}
                  </Text>
                  <Text type="secondary">（{selectedInterview.duration}分钟）</Text>
                </div>
              </Col>
            </Row>

            {selectedInterview.type === "video" && (
              <>
                <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
                  <Space>
                    <VideoCameraOutlined />
                    视频面试信息
                  </Space>
                </Title>
                <Card size="small" style={{ marginBottom: 24 }}>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Text type="secondary">会议室ID：</Text>
                      <Text strong>{selectedInterview.roomId || "-"}</Text>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">会议链接：</Text>
                      {selectedInterview.meetingUrl ? (
                        <a href={selectedInterview.meetingUrl} target="_blank" rel="noopener noreferrer">
                          进入会议室
                        </a>
                      ) : (
                        <Text type="secondary">待生成</Text>
                      )}
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">状态：</Text>
                      {(() => {
                        const vs = getVideoStatus(selectedInterview);
                        return vs ? (
                          <Tag icon={vs.icon} color={vs.color as any}>
                            {vs.text}
                          </Tag>
                        ) : (
                          "-"
                        );
                      })()}
                    </Col>
                    <Col span={12}>
                      <Text type="secondary">实际开始时间：</Text>
                      <Text strong>
                        {selectedInterview.startedAt
                          ? dayjs(selectedInterview.startedAt).format("YYYY-MM-DD HH:mm")
                          : "-"}
                      </Text>
                    </Col>
                  </Row>
                </Card>
              </>
            )}

            {selectedInterview.transcriptData && selectedInterview.transcriptData.length > 0 && (
              <>
                <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
                  <Space>
                    <FileTextOutlined />
                    转文字记录
                    <Tag color="green">{selectedInterview.transcriptData.length} 条</Tag>
                  </Space>
                </Title>
                <div
                  style={{
                    maxHeight: 300,
                    overflowY: "auto",
                    marginBottom: 24,
                    padding: "12px 16px",
                    background: "#fafafa",
                    borderRadius: 8,
                  }}
                >
                  <Timeline>
                    {selectedInterview.transcriptData.map((item, index) => (
                      <Timeline.Item
                        key={index}
                        color={item.speaker === "面试官" ? "blue" : "green"}
                      >
                        <Space>
                          <Tag color="default" style={{ fontSize: 12 }}>
                            {formatTimestamp(item.timestamp)}
                          </Tag>
                          <Text strong style={{ minWidth: 60 }}>
                            {item.speaker}
                          </Text>
                          <Text>{item.text}</Text>
                        </Space>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </div>
              </>
            )}

            {selectedInterview.behaviorMarkers && selectedInterview.behaviorMarkers.length > 0 && (
              <>
                <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
                  <Space>
                    <ExclamationCircleOutlined />
                    关键行为打点
                    <Tag color="red">{selectedInterview.behaviorMarkers.length} 个</Tag>
                  </Space>
                </Title>
                <Table
                  size="small"
                  dataSource={selectedInterview.behaviorMarkers}
                  rowKey={(_, index) => index?.toString() || ""}
                  pagination={false}
                  style={{ marginBottom: 24 }}
                  columns={[
                    {
                      title: "时间点",
                      dataIndex: "timestamp",
                      key: "timestamp",
                      width: 100,
                      render: (ts: number) => (
                        <Tag color="blue">{formatTimestamp(ts)}</Tag>
                      ),
                    },
                    {
                      title: "打点标记",
                      dataIndex: "marker",
                      key: "marker",
                      render: (marker: string) => (
                        <Tag color={getMarkerColor(marker)}>
                          <Text strong>{marker}</Text>
                        </Tag>
                      ),
                    },
                    {
                      title: "严重程度",
                      dataIndex: "severity",
                      key: "severity",
                      width: 120,
                      render: (severity: string) => {
                        const colorMap: Record<string, string> = {
                          high: "red",
                          medium: "orange",
                          low: "blue",
                        };
                        const textMap: Record<string, string> = {
                          high: "高",
                          medium: "中",
                          low: "低",
                        };
                        return (
                          <Tag color={colorMap[severity] || "default"}>
                            {textMap[severity] || severity}
                          </Tag>
                        );
                      },
                    },
                    {
                      title: "备注",
                      dataIndex: "notes",
                      key: "notes",
                      render: (notes: string) => notes || "-",
                    },
                  ]}
                />
              </>
            )}

            {selectedInterview.evaluation && (
              <>
                <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
                  <Space>
                    <StarOutlined />
                    面试评分详情
                  </Space>
                </Title>
                <Card size="small">
                  <Row gutter={[16, 24]}>
                    <Col span={24}>
                      <div
                        style={{
                          textAlign: "center",
                          padding: "20px 0",
                          background: "#fff7e6",
                          borderRadius: 8,
                          marginBottom: 16,
                        }}
                      >
                        <div style={{ fontSize: 48, fontWeight: "bold", color: "#fa8c16" }}>
                          {selectedInterview.evaluation.overallScore}
                        </div>
                        <Text type="secondary">综合评分</Text>
                        <div style={{ marginTop: 8 }}>
                          <Tag
                            color={
                              selectedInterview.evaluation.recommendation === "strong_hire"
                                ? "green"
                                : selectedInterview.evaluation.recommendation === "hire"
                                ? "blue"
                                : selectedInterview.evaluation.recommendation === "no_hire"
                                ? "red"
                                : "default"
                            }
                          >
                            {getRecommendationText(selectedInterview.evaluation.recommendation)}
                          </Tag>
                        </div>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 24, fontWeight: "bold", color: "#1890ff" }}>
                          {selectedInterview.evaluation.technicalScore}
                        </div>
                        <Text type="secondary">技术能力</Text>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 24, fontWeight: "bold", color: "#52c41a" }}>
                          {selectedInterview.evaluation.communicationScore}
                        </div>
                        <Text type="secondary">沟通能力</Text>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 24, fontWeight: "bold", color: "#722ed1" }}>
                          {selectedInterview.evaluation.problemSolvingScore}
                        </div>
                        <Text type="secondary">问题解决</Text>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 24, fontWeight: "bold", color: "#fa8c16" }}>
                          {selectedInterview.evaluation.culturalFitScore}
                        </div>
                        <Text type="secondary">文化适配</Text>
                      </div>
                    </Col>
                    <Col span={12}>
                      <Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
                        优势
                      </Title>
                      <Space wrap>
                        {selectedInterview.evaluation.strengths.map((s, i) => (
                          <Tag key={i} color="green">
                            {s}
                          </Tag>
                        ))}
                      </Space>
                    </Col>
                    <Col span={12}>
                      <Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
                        待改进
                      </Title>
                      <Space wrap>
                        {selectedInterview.evaluation.weaknesses.map((w, i) => (
                          <Tag key={i} color="orange">
                            {w}
                          </Tag>
                        ))}
                      </Space>
                    </Col>
                    <Col span={24}>
                      <Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
                        综合评价
                      </Title>
                      <Text>{selectedInterview.evaluation.notes}</Text>
                    </Col>
                    <Col span={24}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        评价时间：{dayjs(selectedInterview.evaluation.evaluatedAt).format("YYYY-MM-DD HH:mm")}
                      </Text>
                    </Col>
                  </Row>
                </Card>
              </>
            )}

            {!selectedInterview.transcriptData &&
              !selectedInterview.behaviorMarkers &&
              !selectedInterview.evaluation && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
                  <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                  <div>暂无详细记录</div>
                </div>
              )}
          </div>
        )}
      </Modal>

      {renderTranscriptModal()}
    </div>
  );
};

export default InterviewList;
