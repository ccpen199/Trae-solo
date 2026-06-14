import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Table, Tag, Button, Typography, List, Avatar } from "antd";
import {
  TeamOutlined,
  AppstoreOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  PlusOutlined,
  MessageOutlined,
  FileSearchOutlined,
  BarChartOutlined,
  SendOutlined,
  FileTextOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { analyticsAPI, candidateAPI, interviewAPI } from "../api";
import { getStageInfo } from "../constants";
import type { DashboardStats, Candidate, Interview } from "../types";

const { Title, Text } = Typography;

const emptyStats: DashboardStats = {
  totalPositions: 0,
  activePositions: 0,
  totalCandidates: 0,
  pendingScreening: 0,
  interviewsToday: 0,
  offersPending: 0,
  hiredThisMonth: 0,
  avgTimeToHire: 0,
  conversionRate: 0,
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(false);
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [statsRes, candidatesRes, interviewsRes] = await Promise.allSettled([
      analyticsAPI.getDashboardStats(),
      candidateAPI.getList({ pageSize: 5, sortBy: "createdAt", sortOrder: "desc" }),
      interviewAPI.getList({ pageSize: 5, status: "scheduled" }),
    ]);

    if (statsRes.status === "fulfilled") {
      setStats(statsRes.value || emptyStats);
    } else {
      console.error("Failed to load dashboard stats:", statsRes.reason);
    }

    if (candidatesRes.status === "fulfilled") {
      setRecentCandidates(candidatesRes.value?.data || []);
    } else {
      console.error("Failed to load recent candidates:", candidatesRes.reason);
    }

    if (interviewsRes.status === "fulfilled") {
      setUpcomingInterviews(interviewsRes.value?.data || []);
    } else {
      console.error("Failed to load upcoming interviews:", interviewsRes.reason);
    }

    setLoading(false);
  };

  const statCards = [
        {
          title: "招聘中职位",
          value: stats.activePositions,
          suffix: "个",
          icon: <AppstoreOutlined style={{ color: "#1890ff", fontSize: 28 }} />,
          color: "#1890ff",
          action: () => navigate("/positions"),
        },
        {
          title: "候选人总数",
          value: stats.totalCandidates,
          suffix: "人",
          icon: <TeamOutlined style={{ color: "#52c41a", fontSize: 28 }} />,
          color: "#52c41a",
          action: () => navigate("/candidates"),
        },
        {
          title: "待初筛",
          value: stats.pendingScreening,
          suffix: "人",
          icon: <UserOutlined style={{ color: "#faad14", fontSize: 28 }} />,
          color: "#faad14",
          action: () => navigate("/candidates"),
        },
        {
          title: "今日面试",
          value: stats.interviewsToday,
          suffix: "场",
          icon: <VideoCameraOutlined style={{ color: "#722ed1", fontSize: 28 }} />,
          color: "#722ed1",
          action: () => navigate("/interviews"),
        },
        {
          title: "本月入职",
          value: stats.hiredThisMonth,
          suffix: "人",
          icon: <CheckCircleOutlined style={{ color: "#13c2c2", fontSize: 28 }} />,
          color: "#13c2c2",
          action: () => navigate("/candidates"),
        },
        {
          title: "平均招聘周期",
          value: stats.avgTimeToHire.toFixed(1),
          suffix: "天",
          icon: <ClockCircleOutlined style={{ color: "#eb2f96", fontSize: 28 }} />,
          color: "#eb2f96",
          action: () => navigate("/analytics"),
        },
      ];

  const candidateColumns = [
    {
      title: "候选人",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Candidate) => (
        <div style={{ cursor: "pointer" }} onClick={() => navigate(`/candidates/${record.id}`)}>
          <Avatar size={28} icon={<UserOutlined />} style={{ marginRight: 8 }} />
          {text}
        </div>
      ),
    },
    {
      title: "职位",
      dataIndex: "position",
      key: "position",
      render: (position: any) => position?.title || "-",
    },
    {
      title: "当前阶段",
      dataIndex: "stage",
      key: "stage",
      render: (stage: string) => {
        const info = getStageInfo(stage);
        return <Tag color={info.color}>{info.name}</Tag>;
      },
    },
    {
      title: "AI评分",
      dataIndex: "aiScreeningResult",
      key: "aiScore",
      render: (result: any) => {
        if (!result) return <Tag color="default">未评分</Tag>;
        const score = result.overallScore;
        const color = score >= 80 ? "success" : score >= 60 ? "gold" : "red";
        return <Tag color={color}>{score}分</Tag>;
      },
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("MM-DD HH:mm"),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">招聘仪表盘</div>
        <div className="page-subtitle">实时掌握招聘进度和关键指标</div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} md={8} xl={4} key={index}>
            <Card
              hoverable
              onClick={card.action}
              style={{ cursor: "pointer" }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `${card.color}15`,
                  }}
                >
                  {card.icon}
                </div>
                <div>
                  <Statistic
                    title={<Text type="secondary" style={{ fontSize: 13 }}>{card.title}</Text>}
                    value={card.value}
                    suffix={card.suffix}
                    valueStyle={{ color: card.color, fontSize: 24, fontWeight: 600 }}
                  />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 快捷操作入口 */}
      <Card title="快捷操作" bordered={false} style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              hoverable
              onClick={() => navigate("/positions/new")}
              style={{ cursor: "pointer", textAlign: "center" }}
              bodyStyle={{ padding: 20 }}
            >
              <PlusOutlined style={{ fontSize: 32, color: "#1890ff" }} />
              <div style={{ marginTop: 12, fontWeight: 500 }}>发布职位</div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>一键发布多渠道</div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              hoverable
              onClick={() => navigate("/candidates/new")}
              style={{ cursor: "pointer", textAlign: "center" }}
              bodyStyle={{ padding: 20 }}
            >
              <UserOutlined style={{ fontSize: 32, color: "#52c41a" }} />
              <div style={{ marginTop: 12, fontWeight: 500 }}>添加候选人</div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>录入简历信息</div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              hoverable
              onClick={() => navigate("/candidates?filter=screening")}
              style={{ cursor: "pointer", textAlign: "center" }}
              bodyStyle={{ padding: 20 }}
            >
              <ThunderboltOutlined style={{ fontSize: 32, color: "#faad14" }} />
              <div style={{ marginTop: 12, fontWeight: 500 }}>AI初筛</div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>批量智能筛选</div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              hoverable
              onClick={() => navigate("/interviews/schedule")}
              style={{ cursor: "pointer", textAlign: "center" }}
              bodyStyle={{ padding: 20 }}
            >
              <VideoCameraOutlined style={{ fontSize: 32, color: "#722ed1" }} />
              <div style={{ marginTop: 12, fontWeight: 500 }}>安排面试</div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>视频面试排期</div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              hoverable
              onClick={() => navigate("/im")}
              style={{ cursor: "pointer", textAlign: "center" }}
              bodyStyle={{ padding: 20 }}
            >
              <MessageOutlined style={{ fontSize: 32, color: "#13c2c2" }} />
              <div style={{ marginTop: 12, fontWeight: 500 }}>IM沟通</div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>加密消息传输</div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              hoverable
              onClick={() => navigate("/approvals")}
              style={{ cursor: "pointer", textAlign: "center" }}
              bodyStyle={{ padding: 20 }}
            >
              <FileSearchOutlined style={{ fontSize: 32, color: "#fa8c16" }} />
              <div style={{ marginTop: 12, fontWeight: 500 }}>审批中心</div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>协同审批处理</div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              hoverable
              onClick={() => navigate("/analytics")}
              style={{ cursor: "pointer", textAlign: "center" }}
              bodyStyle={{ padding: 20 }}
            >
              <BarChartOutlined style={{ fontSize: 32, color: "#eb2f96" }} />
              <div style={{ marginTop: 12, fontWeight: 500 }}>数据分析</div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>招聘漏斗洞察</div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card
              hoverable
              onClick={() => navigate("/talent-pool")}
              style={{ cursor: "pointer", textAlign: "center" }}
              bodyStyle={{ padding: 20 }}
            >
              <TeamOutlined style={{ fontSize: 32, color: "#2f54eb" }} />
              <div style={{ marginTop: 12, fontWeight: 500 }}>人才库</div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>标签化管理</div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>最新候选人</span>
                <Button type="link" onClick={() => navigate("/candidates")}>
                  查看全部
                </Button>
              </div>
            }
            bordered={false}
          >
            <Table
              rowKey="id"
              columns={candidateColumns}
              dataSource={recentCandidates}
              pagination={false}
              loading={loading}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>即将开始的面试</span>
                <Button type="link" onClick={() => navigate("/interviews")}>
                  全部面试
                </Button>
              </div>
            }
            bordered={false}
          >
            {loading ? (
              <div className="skeleton-loading">加载中...</div>
            ) : upcomingInterviews.length === 0 ? (
              <div className="empty-state">暂无面试安排</div>
            ) : (
              <List
                dataSource={upcomingInterviews}
                renderItem={(item) => (
                  <List.Item
                    style={{ padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}
                    onClick={() => navigate(`/interviews/room/${item.roomId}`)}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <div>
                          <Text strong>{item.candidate?.name}</Text>
                          <Tag color="blue" style={{ marginLeft: 8 }}>
                            {item.round === "first"
                              ? "初试"
                              : item.round === "second"
                              ? "复试"
                              : item.round === "final"
                              ? "终试"
                              : "HR面"}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 4 }}>{item.position?.title}</div>
                          <div style={{ color: "#faad14", fontSize: 12 }}>
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            {dayjs(item.scheduledAt).format("MM-DD HH:mm")} · {item.duration}分钟
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <RiseOutlined style={{ color: "#52c41a" }} />
                <span>本月转化率</span>
              </div>
            }
            bordered={false}
            style={{ marginTop: 16 }}
          >
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 48, fontWeight: 600, color: "#52c41a" }}>
                {stats.conversionRate}%
              </div>
              <Text type="secondary">简历到入职整体转化率</Text>
              <Row gutter={16} style={{ marginTop: 24 }}>
                <Col span={12}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: "#1890ff" }}>
                    {stats.offersPending}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    待确认Offer
                  </Text>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: "#722ed1" }}>
                    {stats.totalPositions}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    职位总数
                  </Text>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
