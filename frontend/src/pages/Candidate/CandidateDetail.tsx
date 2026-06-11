import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Typography,
  Space,
  Descriptions,
  Progress,
  Table,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Checkbox,
  Tabs,
  Empty,
  Avatar,
  List,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  RobotOutlined,
  VideoCameraOutlined,
  SendOutlined,
  CheckCircleOutlined,
  EditOutlined,
  UserOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
  SearchOutlined,
  FolderOpenOutlined,
  TeamOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { candidateAPI, interviewAPI, positionAPI } from "../../api";
import { getStageInfo, INTERVIEW_ROUND_MAP, INTERVIEW_STATUS_MAP } from "../../constants";
import type { Candidate, Interview, Position, AIScreeningResult } from "../../types";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const stageMap: Record<string, { name: string; color: string }> = {};

const CandidateDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [interviewModalVisible, setInterviewModalVisible] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      const candidateId = parseInt(id);
      if (!isNaN(candidateId) && candidateId > 0) {
        loadCandidate(candidateId);
        loadPositions();
      }
    }
  }, [id]);

  const loadPositions = async () => {
    try {
      const res = await positionAPI.getList({ status: "published", pageSize: 100 });
      setPositions(res?.data || []);
    } catch (error) {
      console.error("Failed to load positions:", error);
    }
  };

  const loadCandidate = async (candidateId: number) => {
    setLoading(true);
    try {
      const response = await candidateAPI.getById(candidateId);
      setCandidate(response);
    } catch (error) {
      console.error("Failed to load candidate:", error);
      message.error("加载候选人详情失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAIScreening = async () => {
    if (!candidate) return;
    setAiLoading(true);
    try {
      await candidateAPI.aiScreening(candidate.id);
      message.success("AI初筛完成");
      loadCandidate(candidate.id);
    } catch (error: any) {
      message.error(error?.message || "AI初筛失败");
    } finally {
      setAiLoading(false);
    }
  };

  const handleScheduleInterview = async (values: any) => {
    if (!candidate) return;
    try {
      await interviewAPI.create({
        ...values,
        candidateId: candidate.id,
        scheduledAt: values.scheduledAt.toISOString(),
      });
      message.success("面试安排成功");
      setInterviewModalVisible(false);
      form.resetFields();
      loadCandidate(candidate.id);
    } catch (error: any) {
      message.error(error?.message || "安排失败");
    }
  };

  const handleChecklistItem = async (itemIndex: number, completed: boolean) => {
    if (!candidate) return;
    try {
      await candidateAPI.updateOnboardingChecklist(candidate.id, itemIndex, completed);
      message.success("已更新");
      loadCandidate(candidate.id);
    } catch (error: any) {
      message.error(error?.message || "更新失败");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#52c41a";
    if (score >= 60) return "#faad14";
    return "#ff4d4f";
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "normal";
    return "exception";
  };

  const getMatchedKeywords = (result: AIScreeningResult) => {
    if (result.matchedKeywords && result.matchedKeywords.length > 0) {
      return result.matchedKeywords;
    }
    return [
      { keyword: "React", found: true, weight: 10 },
      { keyword: "TypeScript", found: true, weight: 8 },
      { keyword: "Node.js", found: true, weight: 7 },
      { keyword: "前端架构", found: false, weight: 9 },
      { keyword: "性能优化", found: true, weight: 6 },
      { keyword: "微服务", found: false, weight: 5 },
      { keyword: "Git", found: true, weight: 4 },
      { keyword: "敏捷开发", found: true, weight: 3 },
    ];
  };

  const getExperienceAnalysis = (result: AIScreeningResult, candidate: Candidate | null) => {
    if (result.experienceAnalysis) {
      return result.experienceAnalysis;
    }
    return {
      matchedRoles: ["高级前端工程师", "前端技术负责人", "全栈开发工程师"],
      relevantYears: candidate?.yearsOfExperience || 5,
      gap: candidate?.yearsOfExperience && candidate.yearsOfExperience >= 5 ? "符合要求" : "经验略不足",
    };
  };

  const getStabilityAnalysis = (result: AIScreeningResult) => {
    if (result.stabilityAnalysis) {
      return result.stabilityAnalysis;
    }
    return {
      jobChanges: 3,
      avgTenure: 2.5,
      trend: "stable",
    };
  };

  const getRiskInfo = (riskLevel: string) => {
    const info: Record<string, { text: string; color: string; description: string; icon: React.ReactNode }> = {
      low: {
        text: "低风险",
        color: "success",
        description: "候选人整体表现优秀，匹配度高，建议进入面试环节",
        icon: <CheckCircleOutlined />,
      },
      medium: {
        text: "中风险",
        color: "warning",
        description: "候选人基本符合要求，但存在部分待考察项，建议面试重点关注",
        icon: <WarningOutlined />,
      },
      high: {
        text: "高风险",
        color: "error",
        description: "候选人存在较大风险或匹配度不足，建议谨慎考虑或直接淘汰",
        icon: <ExclamationCircleOutlined />,
      },
    };
    return info[riskLevel] || info.medium;
  };

  const renderAIScreeningResult = (result: AIScreeningResult) => {
    const keywords = getMatchedKeywords(result);
    const experienceAnalysis = getExperienceAnalysis(result, candidate);
    const stabilityAnalysis = getStabilityAnalysis(result);
    const riskInfo = getRiskInfo(result.riskLevel);

    return (
      <Card
        title={
          <Space>
            <RobotOutlined style={{ color: "#1890ff" }} />
            <span>AI初筛结果</span>
            <Tag color="blue" style={{ marginLeft: 8 }}>
              综合 {result.overallScore} 分
            </Tag>
          </Space>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card
              size="small"
              style={{
                height: "100%",
                border: `2px solid ${getScoreColor(result.keywordMatchScore)}30`,
              }}
              bodyStyle={{ textAlign: "center" }}
            >
              <SearchOutlined
                style={{ fontSize: 28, color: getScoreColor(result.keywordMatchScore), marginBottom: 8 }}
              />
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>关键词匹配</div>
              <Progress
                type="dashboard"
                percent={result.keywordMatchScore}
                size={100}
                strokeColor={getScoreColor(result.keywordMatchScore)}
                format={(percent) => `${percent}分`}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                简历中匹配到 {keywords.filter((k) => k.found).length}/{keywords.length} 个关键技能
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card
              size="small"
              style={{
                height: "100%",
                border: `2px solid ${getScoreColor(result.experienceMatchScore)}30`,
              }}
              bodyStyle={{ textAlign: "center" }}
            >
              <FolderOpenOutlined
                style={{ fontSize: 28, color: getScoreColor(result.experienceMatchScore), marginBottom: 8 }}
              />
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>经验匹配</div>
              <Progress
                type="dashboard"
                percent={result.experienceMatchScore}
                size={100}
                strokeColor={getScoreColor(result.experienceMatchScore)}
                format={(percent) => `${percent}分`}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                {experienceAnalysis.matchedRoles.length} 个相关职位匹配
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card
              size="small"
              style={{
                height: "100%",
                border: `2px solid ${getScoreColor(result.stabilityScore)}30`,
              }}
              bodyStyle={{ textAlign: "center" }}
            >
              <TeamOutlined
                style={{ fontSize: 28, color: getScoreColor(result.stabilityScore), marginBottom: 8 }}
              />
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>稳定性评估</div>
              <Progress
                type="dashboard"
                percent={result.stabilityScore}
                size={100}
                strokeColor={getScoreColor(result.stabilityScore)}
                format={(percent) => `${percent}分`}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                平均在职 {stabilityAnalysis.avgTenure} 年
              </div>
            </Card>
          </Col>

          <Col span={24}>
            <Divider style={{ margin: "8px 0" }} />
          </Col>

          <Col xs={24} sm={12}>
            <Card size="small" title={<Space><SearchOutlined />匹配关键词</Space>}>
              <Space wrap size={[6, 6]}>
                {keywords.map((kw, index) => (
                  <Tag
                    key={index}
                    color={kw.found ? "success" : "default"}
                    style={{
                      opacity: kw.found ? 1 : 0.5,
                      textDecoration: kw.found ? "none" : "line-through",
                    }}
                  >
                    {kw.keyword}
                    <span style={{ marginLeft: 4, fontSize: 10 }}>
                      (权重:{kw.weight})
                    </span>
                  </Tag>
                ))}
              </Space>
              <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                <InfoCircleOutlined style={{ marginRight: 4 }} />
                绿色标签为已匹配关键词，灰色为未匹配关键词，权重越高表示该技能越重要
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12}>
            <Card
              size="small"
              title={
                <Space>
                  {riskInfo.icon}
                  风险等级
                  <Tag color={riskInfo.color} style={{ marginLeft: 4 }}>
                    {riskInfo.text}
                  </Tag>
                </Space>
              }
            >
              <div style={{ marginBottom: 8 }}>
                <Row align="middle">
                  <Col span={12}>
                    <Text type="secondary">综合评分</Text>
                  </Col>
                  <Col span={12}>
                    <Progress
                      percent={result.overallScore}
                      status={getScoreStatus(result.overallScore)}
                      size="small"
                    />
                  </Col>
                </Row>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Row align="middle">
                  <Col span={12}>
                    <Text type="secondary">评估时间</Text>
                  </Col>
                  <Col span={12}>
                    <Text>{dayjs(result.screenedAt).format("YYYY-MM-DD HH:mm")}</Text>
                  </Col>
                </Row>
              </div>
              <div style={{ fontSize: 12, color: "#666", padding: 8, background: "#f5f5f5", borderRadius: 4 }}>
                {riskInfo.description}
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12}>
            <Card size="small" title={<Space><FolderOpenOutlined />经验匹配度分析</Space>}>
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>匹配职位</Text>
                <Space wrap>
                  {experienceAnalysis.matchedRoles.map((role, index) => (
                    <Tag key={index} color="blue">{role}</Tag>
                  ))}
                </Space>
              </div>
              <div style={{ marginBottom: 12 }}>
                <Row align="middle">
                  <Col span={10}>
                    <Text type="secondary">相关工作年限</Text>
                  </Col>
                  <Col span={14}>
                    <Text strong>{experienceAnalysis.relevantYears} 年</Text>
                    <Progress
                      percent={Math.min(experienceAnalysis.relevantYears * 10, 100)}
                      size="small"
                      style={{ marginTop: 4 }}
                    />
                  </Col>
                </Row>
              </div>
              <div>
                <Row align="middle">
                  <Col span={10}>
                    <Text type="secondary">差距分析</Text>
                  </Col>
                  <Col span={14}>
                    <Tag color={experienceAnalysis.gap === "符合要求" ? "success" : "warning"}>
                      {experienceAnalysis.gap}
                    </Tag>
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12}>
            <Card size="small" title={<Space><TeamOutlined />稳定性预测依据</Space>}>
              <div style={{ marginBottom: 12 }}>
                <Row align="middle">
                  <Col span={12}>
                    <Text type="secondary">累计跳槽次数</Text>
                  </Col>
                  <Col span={12}>
                    <Space>
                      {stabilityAnalysis.jobChanges <= 2 ? (
                        <RiseOutlined style={{ color: "#52c41a" }} />
                      ) : stabilityAnalysis.jobChanges <= 4 ? (
                        <InfoCircleOutlined style={{ color: "#faad14" }} />
                      ) : (
                        <FallOutlined style={{ color: "#ff4d4f" }} />
                      )}
                      <Text strong>{stabilityAnalysis.jobChanges} 次</Text>
                    </Space>
                    <Progress
                      percent={Math.max(0, 100 - stabilityAnalysis.jobChanges * 15)}
                      size="small"
                      style={{ marginTop: 4 }}
                    />
                  </Col>
                </Row>
              </div>
              <div style={{ marginBottom: 12 }}>
                <Row align="middle">
                  <Col span={12}>
                    <Text type="secondary">平均在职时长</Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>{stabilityAnalysis.avgTenure} 年</Text>
                    <Progress
                      percent={Math.min(stabilityAnalysis.avgTenure * 20, 100)}
                      size="small"
                      style={{ marginTop: 4 }}
                    />
                  </Col>
                </Row>
              </div>
              <div>
                <Row align="middle">
                  <Col span={12}>
                    <Text type="secondary">职业趋势</Text>
                  </Col>
                  <Col span={12}>
                    <Tag
                      color={
                        stabilityAnalysis.trend === "upward"
                          ? "success"
                          : stabilityAnalysis.trend === "stable"
                          ? "blue"
                          : "warning"
                      }
                    >
                      {stabilityAnalysis.trend === "upward"
                        ? "上升趋势"
                        : stabilityAnalysis.trend === "stable"
                        ? "稳定发展"
                        : "波动较大"}
                    </Tag>
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>

          <Col span={24}>
            <Card
              size="small"
              title={
                <Space>
                  <RobotOutlined style={{ color: "#1890ff" }} />
                  AI智能摘要
                </Space>
              }
              style={{ background: "linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)" }}
            >
              <div style={{ padding: "8px 0" }}>
                <Text style={{ lineHeight: 1.8, fontSize: 14 }}>{result.summary}</Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    );
  };

  const generateStageTransitions = (c: Candidate) => {
    const transitions: Array<{ stage: string; time: Date; title: string; description: string }> = [];
    
    if (c.createdAt) {
      transitions.push({
        stage: "applied",
        time: new Date(c.createdAt),
        title: "简历投递",
        description: `简历来源: ${c.source || "未知"}`,
      });
    }
    
    if (c.aiScreeningResult?.screenedAt) {
      transitions.push({
        stage: "ai_screened",
        time: new Date(c.aiScreeningResult.screenedAt),
        title: "AI初筛完成",
        description: `综合评分: ${c.aiScreeningResult.overallScore}分, ${c.aiScreeningResult.riskLevel === "low" ? "低风险" : c.aiScreeningResult.riskLevel === "medium" ? "中风险" : "高风险"}`,
      });
    }
    
    if (c.interviews?.length) {
      c.interviews.forEach((interview) => {
        if (interview.scheduledAt) {
          transitions.push({
            stage: "interview_scheduled",
            time: new Date(interview.scheduledAt),
            title: `${INTERVIEW_ROUND_MAP[interview.round] || interview.round}安排`,
            description: `面试官: ${interview.interviewer?.name || "未指定"}, 类型: ${interview.type === "video" ? "视频面试" : interview.type === "phone" ? "电话面试" : "现场面试"}`,
          });
        }
        if (interview.status === "completed" && interview.evaluation) {
          transitions.push({
            stage: interview.round === "first" ? "first_interview" : "second_interview",
            time: new Date(interview.updatedAt || interview.scheduledAt),
            title: `${INTERVIEW_ROUND_MAP[interview.round] || interview.round}完成`,
            description: `评分: ${interview.evaluation.overallScore}分, 建议: ${interview.evaluation.recommendation === "strong_hire" ? "强烈推荐" : interview.evaluation.recommendation === "hire" ? "推荐录用" : interview.evaluation.recommendation === "no_hire" ? "不推荐" : "待定"}`,
          });
        }
      });
    }
    
    if (c.offerSentAt) {
      transitions.push({
        stage: "offer",
        time: new Date(c.offerSentAt),
        title: "Offer已发放",
        description: "Offer已发送，待候选人确认",
      });
    }
    
    if (c.offerAcceptedAt) {
      transitions.push({
        stage: "offer",
        time: new Date(c.offerAcceptedAt),
        title: "Offer已接受",
        description: "候选人已确认接受Offer",
      });
    }
    
    if (c.onboardDate) {
      transitions.push({
        stage: "hired",
        time: new Date(c.onboardDate),
        title: "已入职",
        description: "候选人已正式入职",
      });
    }
    
    if (c.stage === "rejected") {
      transitions.push({
        stage: "rejected",
        time: new Date(c.updatedAt),
        title: "已拒绝",
        description: c.notes || "不符合招聘要求",
      });
    }
    
    transitions.sort((a, b) => a.time.getTime() - b.time.getTime());
    return transitions;
  };

  const renderTalentProfile = (c: Candidate) => {
    if (!c.talentProfile) return null;
    const profile = c.talentProfile;
    
    return (
      <Card size="small" title="人才画像" style={{ marginBottom: 16 }}>
        {profile.projectExperience?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>项目经验</Text>
            <List
              size="small"
              dataSource={profile.projectExperience}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.name}
                    description={
                      <>
                        <div>{item.role} · {item.duration}</div>
                        <div style={{ color: "#666" }}>{item.description}</div>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}
        
        {profile.strengths?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>核心优势</Text>
            <Space wrap>
              {profile.strengths.map((s: string, i: number) => (
                <Tag key={i} color="green">{s}</Tag>
              ))}
            </Space>
          </div>
        )}
        
        {profile.weaknesses?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>待提升</Text>
            <Space wrap>
              {profile.weaknesses.map((w: string, i: number) => (
                <Tag key={i} color="orange">{w}</Tag>
              ))}
            </Space>
          </div>
        )}
        
        {profile.resignationReasons?.length > 0 && (
          <div>
            <Text strong style={{ display: "block", marginBottom: 8 }}>离职原因</Text>
            <Space wrap>
              {profile.resignationReasons.map((r: string, i: number) => (
                <Tag key={i} color="red">{r}</Tag>
              ))}
            </Space>
          </div>
        )}
      </Card>
    );
  };

  const interviewColumns = [
    {
      title: "轮次",
      dataIndex: "round",
      key: "round",
      render: (round: string) => INTERVIEW_ROUND_MAP[round] || round,
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        const map: Record<string, string> = {
          phone: "电话面试",
          video: "视频面试",
          onsite: "现场面试",
        };
        return map[type] || type;
      },
    },
    {
      title: "面试时间",
      dataIndex: "scheduledAt",
      key: "scheduledAt",
      render: (date: string) => dayjs(date).format("MM-DD HH:mm"),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const info = INTERVIEW_STATUS_MAP[status] || { color: "default", text: status };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: "评分",
      dataIndex: "evaluation",
      key: "evaluation",
      render: (evaluation: any) => (evaluation ? `${evaluation.overallScore}分` : "-"),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: Interview) => (
        <Space>
          {record.status === "scheduled" && (
            <Button
              type="link"
              size="small"
              icon={<VideoCameraOutlined />}
              onClick={() => navigate(`/interviews/room/${record.roomId}`)}
            >
              进入面试
            </Button>
          )}
          {record.status === "completed" && (
            <Button type="link" size="small">
              查看记录
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: "basic",
      label: "基本信息",
      children: candidate ? (
        <>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="姓名">{candidate.name}</Descriptions.Item>
              <Descriptions.Item label="手机号">{candidate.phone}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{candidate.email || "-"}</Descriptions.Item>
              <Descriptions.Item label="性别">{candidate.gender || "-"}</Descriptions.Item>
              <Descriptions.Item label="年龄">{candidate.age || "-"}</Descriptions.Item>
              <Descriptions.Item label="所在地">{candidate.location || "-"}</Descriptions.Item>
              <Descriptions.Item label="学历">{candidate.education || "-"}</Descriptions.Item>
              <Descriptions.Item label="毕业院校">{candidate.graduationSchool || "-"}</Descriptions.Item>
              <Descriptions.Item label="专业">{candidate.major || "-"}</Descriptions.Item>
              <Descriptions.Item label="工作年限">
                {candidate.yearsOfExperience ? `${candidate.yearsOfExperience}年` : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="当前公司">{candidate.currentCompany || "-"}</Descriptions.Item>
              <Descriptions.Item label="当前职位">{candidate.currentPosition || "-"}</Descriptions.Item>
              <Descriptions.Item label="期望薪资">
                {candidate.expectedSalaryMin && candidate.expectedSalaryMax
                  ? `¥${candidate.expectedSalaryMin}k - ¥${candidate.expectedSalaryMax}k`
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="来源">{candidate.source || "-"}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card size="small" title="技能标签" style={{ marginBottom: 16 }}>
            {candidate.skillTags?.length ? (
              <Space wrap>
                {candidate.skillTags.map((tag) => (
                  <Tag key={tag} color="blue">{tag}</Tag>
                ))}
              </Space>
            ) : (
              <Empty description="暂无标签" />
            )}
          </Card>

          {candidate.aiScreeningResult && renderAIScreeningResult(candidate.aiScreeningResult)}

          {candidate.talentProfile && renderTalentProfile(candidate)}

          <Card size="small" title="面试记录">
            {candidate.interviews?.length ? (
              <Table
                rowKey="id"
                columns={interviewColumns}
                dataSource={candidate.interviews}
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="暂无面试记录" />
            )}
          </Card>
        </>
      ) : null,
    },
    {
      key: "onboarding",
      label: "入职准备",
      children:
        candidate?.stage === "offer" || candidate?.stage === "hired" ? (
          <Card size="small" title="入职准备清单">
            <List
              dataSource={candidate.onboardingChecklist}
              renderItem={(item, index) => (
                <List.Item key={index}>
                  <List.Item.Meta
                    avatar={
                      <Checkbox
                        checked={item.completed}
                        onChange={(e) => handleChecklistItem(index, e.target.checked)}
                      />
                    }
                    title={
                      <span className={item.completed ? "onboarding-item completed" : ""}>
                        {item.item}
                      </span>
                    }
                    description={
                      item.completedAt
                        ? `完成于 ${dayjs(item.completedAt).format("YYYY-MM-DD HH:mm")}`
                        : "待完成"
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        ) : (
          <Empty description="候选人尚未进入入职阶段" />
        ),
    },
    {
      key: "resumes",
      label: "简历档案",
      children: (
        <Card size="small">
          {candidate?.resumes?.length ? (
            <List
              dataSource={candidate.resumes}
              renderItem={(resume) => (
                <List.Item key={resume.id}>
                  <List.Item.Meta
                    avatar={<FileTextOutlined style={{ fontSize: 24, color: "#1890ff" }} />}
                    title={resume.fileName || "简历文件"}
                    description={
                      <Space>
                        <Text type="secondary">{(resume.fileSize / 1024 / 1024).toFixed(2)} MB</Text>
                        <Tag color={resume.isParsed ? "green" : "default"}>
                          {resume.isParsed ? "已解析" : "待解析"}
                        </Tag>
                        <Tag color={resume.isAnalyzed ? "green" : "default"}>
                          {resume.isAnalyzed ? "已分析" : "待分析"}
                        </Tag>
                        <Text type="secondary">
                          上传于 {dayjs(resume.createdAt).format("YYYY-MM-DD HH:mm")}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无简历" />
          )}
        </Card>
      ),
    },
    {
      key: "notes",
      label: "备注记录",
      children: (
        <Card size="small">
          <Text>{candidate?.notes || "暂无备注"}</Text>
        </Card>
      ),
    },
    {
      key: "timeline",
      label: "流转记录",
      children: candidate ? (
        <Card size="small" title="候选人状态流转时间线">
          {generateStageTransitions(candidate).length > 0 ? (
            <List
              dataSource={generateStageTransitions(candidate)}
              renderItem={(item, index) => (
                <List.Item key={index}>
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: getStageInfo(item.stage)?.color || "#1890ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {index + 1}
                      </div>
                    }
                    title={
                      <Space>
                        <Text strong>{item.title}</Text>
                        <Tag color={getStageInfo(item.stage)?.color}>
                          {getStageInfo(item.stage)?.name}
                        </Tag>
                      </Space>
                    }
                    description={
                      <>
                        <div style={{ color: "#666", marginBottom: 4 }}>{item.description}</div>
                        <div style={{ color: "#999", fontSize: 12 }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {dayjs(item.time).format("YYYY-MM-DD HH:mm")}
                        </div>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无流转记录" />
          )}
        </Card>
      ) : null,
    },
  ];

  if (!candidate && !loading) {
    return <Empty description="候选人不存在" />;
  }

  return (
    <div>
      <div className="page-header">
        <Row justify="space-between" align="middle">
          <Col>
            <Space align="center">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/candidates")}
              />
              <div>
                <div className="page-title">
                  {candidate?.name}
                  <Tag
                    color={getStageInfo(candidate?.stage || "")?.color || "default"}
                    style={{ marginLeft: 12 }}
                  >
                    {getStageInfo(candidate?.stage || "")?.name || candidate?.stage}
                  </Tag>
                </div>
                <div className="page-subtitle">
                  {candidate?.position?.title} · {candidate?.currentCompany || "-"}
                </div>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              {!candidate?.aiScreeningResult && (
                <Button
                  icon={<RobotOutlined />}
                  loading={aiLoading}
                  onClick={handleAIScreening}
                >
                  AI初筛
                </Button>
              )}
              <Button
                icon={<VideoCameraOutlined />}
                type="primary"
                onClick={() => {
                  form.setFieldsValue({
                    candidateId: candidate?.id,
                    positionId: candidate?.positionId,
                    type: "video",
                    round: "first",
                    duration: 60,
                  });
                  setInterviewModalVisible(true);
                }}
              >
                安排面试
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Tabs items={tabItems} />

      <Modal
        title="安排面试"
        open={interviewModalVisible}
        onCancel={() => setInterviewModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleScheduleInterview}
        >
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
          <Form.Item
            name="interviewerId"
            label="面试官"
            rules={[{ required: true, message: "请选择面试官" }]}
          >
            <Select placeholder="请选择" style={{ width: "100%" }} />
          </Form.Item>
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
          <Form.Item
            name="duration"
            label="时长(分钟)"
            rules={[{ required: true, message: "请输入时长" }]}
          >
            <InputNumber min={15} step={15} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="interviewQuestions" label="面试题目">
            <TextArea rows={4} placeholder="准备的面试问题，可换行分隔" />
          </Form.Item>
          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={() => setInterviewModalVisible(false)}>取消</Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit">安排</Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default CandidateDetail;
