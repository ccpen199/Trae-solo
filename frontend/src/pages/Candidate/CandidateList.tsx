import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Avatar,
  Dropdown,
  MenuProps,
  Modal,
  Tooltip,
  Progress,
  Badge,
  Empty,
} from "antd";
import {
  UserOutlined,
  SearchOutlined,
  PlusOutlined,
  FilterOutlined,
  EyeOutlined,
  VideoCameraOutlined,
  SendOutlined,
  FileSearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  SwitcherOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { candidateAPI, positionAPI } from "../../api";
import { getStageInfo, PUBLISH_CHANNEL_MAP } from "../../constants";
import type { Candidate, Position } from "../../types";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const CandidateList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [positions, setPositions] = useState<Position[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  const [searchText, setSearchText] = useState("");
  const [stageFilter, setStageFilter] = useState<string>();
  const [positionFilter, setPositionFilter] = useState<number>();

  const filterParam = searchParams.get("filter");

  useEffect(() => {
    if (filterParam === "screening") {
      setStageFilter("screening");
    }
  }, [filterParam]);

  useEffect(() => {
    loadPositions();
    loadCandidates();
  }, [page, pageSize, searchText, stageFilter, positionFilter]);

  const loadPositions = async () => {
    try {
      const res = await positionAPI.getList({ pageSize: 100 });
      setPositions(res?.data || []);
    } catch (error) {
      console.error("Failed to load positions:", error);
    }
  };

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (searchText) params.keyword = searchText;
      if (stageFilter) params.stage = stageFilter;
      if (positionFilter) params.positionId = positionFilter;

      const res = await candidateAPI.getList(params);
      setCandidates(res?.data || []);
      setTotal(res?.total || 0);
    } catch (error) {
      console.error("Failed to load candidates:", error);
    }
    setLoading(false);
  };

  const getActionMenu = (candidate: Candidate): MenuProps["items"] => [
    {
      key: "view",
      icon: <EyeOutlined />,
      label: "查看详情",
      onClick: () => navigate(`/candidates/${candidate.id}`),
    },
    {
      key: "invite",
      icon: <SendOutlined />,
      label: "发送面试邀约",
      disabled: candidate.stage === "rejected" || candidate.stage === "hired",
    },
    {
      key: "background",
      icon: <FileSearchOutlined />,
      label: "背景调查",
      disabled: !["second_interview", "background_check", "offer"].includes(candidate.stage),
    },
    {
      key: "offer",
      icon: <CheckCircleOutlined />,
      label: "发起Offer审批",
      disabled: !["second_interview", "background_check"].includes(candidate.stage),
    },
    {
      key: "onboarding",
      icon: <UnorderedListOutlined />,
      label: "入职准备清单",
      disabled: !["offer", "hired"].includes(candidate.stage),
    },
    {
      key: "im",
      icon: <MessageOutlined />,
      label: "IM沟通",
    },
    {
      type: "divider" as const,
    },
    {
      key: "screening",
      icon: <ThunderboltOutlined />,
      label: "AI初筛评分",
      disabled: !!candidate.aiScreeningResult,
    },
  ];

  const getLastActivity = (candidate: Candidate) => {
    const activities: Array<{ type: string; time: string; user: string }> = [];

    if (candidate.aiScreeningResult?.screenedAt) {
      activities.push({
        type: "AI初筛",
        time: candidate.aiScreeningResult.screenedAt,
        user: "系统",
      });
    }

    if (candidate.interviews?.length) {
      const lastInterview = candidate.interviews[candidate.interviews.length - 1];
      activities.push({
        type: `${lastInterview.round === "first" ? "初" : lastInterview.round === "second" ? "复" : "终"}试${lastInterview.status === "completed" ? "完成" : "安排"}`,
        time: lastInterview.updatedAt || lastInterview.scheduledAt,
        user: lastInterview.interviewer?.name || "HR",
      });
    }

    if (candidate.approvals?.length) {
      const lastApproval = candidate.approvals[candidate.approvals.length - 1];
      activities.push({
        type: `${lastApproval.status === "approved" ? "审批通过" : lastApproval.status === "rejected" ? "审批拒绝" : "待审批"}`,
        time: lastApproval.updatedAt || lastApproval.createdAt,
        user: lastApproval.approver?.name || "系统",
      });
    }

    if (activities.length === 0) return null;

    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return activities[0];
  };

  const columns = [
    {
      title: "候选人",
      dataIndex: "name",
      key: "name",
      fixed: "left" as const,
      width: 180,
      render: (text: string, record: Candidate) => (
        <div
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
          onClick={() => navigate(`/candidates/${record.id}`)}
        >
          <Avatar size={32} icon={<UserOutlined />} />
          <div>
            <Text strong>{text}</Text>
            <div style={{ fontSize: 12, color: "#999" }}>
              {record.currentPosition} · {record.currentCompany}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "应聘职位",
      dataIndex: "position",
      key: "position",
      width: 180,
      render: (position: any) => position?.title || "-",
    },
    {
      title: "当前阶段",
      dataIndex: "stage",
      key: "stage",
      width: 120,
      render: (stage: string) => {
        const info = getStageInfo(stage);
        return <Tag color={info.color}>{info.name}</Tag>;
      },
    },
    {
      title: "AI评分",
      dataIndex: "aiScreeningResult",
      key: "aiScore",
      width: 120,
      render: (result: any) => {
        if (!result) return <Tag color="default">未评分</Tag>;
        const score = result.overallScore;
        const color = score >= 80 ? "success" : score >= 60 ? "gold" : "red";
        return (
          <Tooltip title={`关键词:${result.keywordMatchScore} 经验:${result.experienceMatchScore} 稳定:${result.stabilityScore}`}>
            <Tag color={color}>{score}分</Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "邀约状态",
      key: "inviteStatus",
      width: 120,
      render: (_: any, record: Candidate) => {
        const interviews = record.interviews || [];
        if (interviews.length === 0) return <Tag color="default">未邀约</Tag>;

        const scheduled = interviews.filter((i) => i.status === "scheduled");
        const completed = interviews.filter((i) => i.status === "completed");

        if (scheduled.length > 0) return <Tag color="blue">已邀约</Tag>;
        if (completed.length > 0) return <Tag color="success">已面试</Tag>;
        return <Tag color="default">未邀约</Tag>;
      },
    },
    {
      title: "背调状态",
      key: "backgroundStatus",
      width: 120,
      render: (_: any, record: Candidate) => {
        if (record.stage === "background_check") {
          return <Badge status="processing" text="进行中" />;
        }
        if (record.stage === "offer" || record.stage === "hired") {
          return <Badge status="success" text="已完成" />;
        }
        if (["first_interview", "second_interview"].includes(record.stage)) {
          return <Tag color="warning">待发起</Tag>;
        }
        return <Tag color="default">未开始</Tag>;
      },
    },
    {
      title: "录用审批",
      key: "approvalStatus",
      width: 120,
      render: (_: any, record: Candidate) => {
        const approvals = record.approvals || [];
        if (approvals.length === 0) {
          if (["second_interview", "background_check"].includes(record.stage)) {
            return <Tag color="warning">待发起</Tag>;
          }
          return <Tag color="default">未开始</Tag>;
        }

        const lastApproval = approvals[approvals.length - 1];
        if (lastApproval.status === "approved") {
          return <Badge status="success" text="已通过" />;
        }
        if (lastApproval.status === "rejected") {
          return <Badge status="error" text="已拒绝" />;
        }
        return <Badge status="processing" text="审批中" />;
      },
    },
    {
      title: "入职准备",
      key: "onboardingStatus",
      width: 130,
      render: (_: any, record: Candidate) => {
        if (!record.onboardingChecklist || record.onboardingChecklist.length === 0) {
          if (record.stage === "offer" || record.stage === "hired") {
            return <Tag color="warning">待生成</Tag>;
          }
          return <Tag color="default">未开始</Tag>;
        }

        const completed = record.onboardingChecklist.filter((i) => i.completed).length;
        const total = record.onboardingChecklist.length;
        const percent = Math.round((completed / total) * 100);

        return (
          <Tooltip title={`${completed}/${total} 项已完成`}>
            <Progress percent={percent} size="small" width={60} />
          </Tooltip>
        );
      },
    },
    {
      title: "最近活动",
      key: "lastActivity",
      width: 200,
      render: (_: any, record: Candidate) => {
        const activity = getLastActivity(record);
        if (!activity) return <Text type="secondary">暂无活动</Text>;

        return (
          <div>
            <Space size={4}>
              <Tag color="blue">{activity.type}</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {activity.user}
              </Text>
            </Space>
            <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {dayjs(activity.time).format("MM-DD HH:mm")}
            </div>
          </div>
        );
      },
    },
    {
      title: "协同处理",
      key: "collaboration",
      width: 120,
      render: (_: any, record: Candidate) => {
        const interviews = record.interviews || [];
        const approvals = record.approvals || [];
        const participants = new Set<string>();

        interviews.forEach((i) => {
          if (i.interviewer?.name) participants.add(i.interviewer.name);
        });
        approvals.forEach((a) => {
          if (a.approver?.name) participants.add(a.approver.name);
        });

        if (participants.size === 0) {
          return <Text type="secondary">暂未协同</Text>;
        }

        return (
          <Tooltip title={`参与人: ${Array.from(participants).join(", ")}`}>
            <Avatar.Group maxCount={3}>
              {Array.from(participants).slice(0, 3).map((name, idx) => (
                <Avatar key={idx} size={24}>
                  {name.charAt(0)}
                </Avatar>
              ))}
            </Avatar.Group>
          </Tooltip>
        );
      },
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right" as const,
      width: 120,
      render: (_: any, record: Candidate) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/candidates/${record.id}`)}
          >
            详情
          </Button>
          <Dropdown menu={{ items: getActionMenu(record) }} placement="bottomRight">
            <Button type="link" size="small">
              更多
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Row align="middle" justify="space-between">
          <Col>
            <div className="page-title">候选人管理</div>
            <div className="page-subtitle">管理所有候选人信息和招聘流程</div>
          </Col>
          <Col>
            <Space>
              <Button.Group>
                <Button
                  type={viewMode === "table" ? "primary" : "default"}
                  icon={<UnorderedListOutlined />}
                  onClick={() => setViewMode("table")}
                >
                  列表视图
                </Button>
                <Button
                  type={viewMode === "kanban" ? "primary" : "default"}
                  icon={<SwitcherOutlined />}
                  onClick={() => navigate("/candidates/kanban")}
                >
                  看板视图
                </Button>
              </Button.Group>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/candidates/new")}>
                添加候选人
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Card bordered={false}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              placeholder="搜索候选人姓名、电话、邮箱"
              allowClear
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={loadCandidates}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              placeholder="筛选阶段"
              allowClear
              style={{ width: "100%" }}
              value={stageFilter}
              onChange={setStageFilter}
            >
              <Option value="applied">简历已收</Option>
              <Option value="screening">初筛中</Option>
              <Option value="ai_screened">AI初筛完成</Option>
              <Option value="interview_invited">已邀约</Option>
              <Option value="interview_scheduled">面试已排期</Option>
              <Option value="first_interview">初试中</Option>
              <Option value="second_interview">复试中</Option>
              <Option value="background_check">背调中</Option>
              <Option value="offer">Offer中</Option>
              <Option value="hired">已入职</Option>
              <Option value="rejected">已拒绝</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              placeholder="筛选职位"
              allowClear
              style={{ width: "100%" }}
              value={positionFilter}
              onChange={setPositionFilter}
            >
              {positions.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.title}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => {
                setSearchText("");
                setStageFilter(undefined);
                setPositionFilter(undefined);
              }}
            >
              重置筛选
            </Button>
          </Col>
        </Row>

        {viewMode === "table" && (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={candidates}
            loading={loading}
            scroll={{ x: 1600 }}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (t) => `共 ${t} 条记录`,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
            locale={{
              emptyText: <Empty description="暂无候选人数据" />,
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default CandidateList;
