import React, { useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Typography,
  Space,
  List,
  Tooltip,
  Statistic,
  Table,
  Descriptions,
  Switch,
  Alert,
  Badge,
  Divider,
} from "antd";
import {
  FundOutlined,
  ClockCircleOutlined,
  FireOutlined,
  TagsOutlined,
  DownloadOutlined,
  ReloadOutlined,
  ApiOutlined,
  LinkOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SettingOutlined,
  RiseOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

interface FunnelStage {
  stage: string;
  stageName: string;
  count: number;
  conversionRate: number;
  avgDurationDays: number;
}

interface DurationData {
  stage: string;
  stageName: string;
  days: number;
}

interface HeatmapDataItem {
  month: string;
  position: string;
  value: number;
}

interface TagItem {
  id: number;
  name: string;
  category: "skill" | "project" | "resign_reason" | "performance";
  count: number;
}

interface ATSApi {
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  status: "active" | "planned" | "deprecated";
}

interface SyncStatus {
  system: string;
  status: "synced" | "syncing" | "failed" | "pending";
  lastSync?: string;
  recordCount?: number;
}

const funnelStages = [
  "resume_submitted",
  "ai_screening",
  "interview_invited",
  "first_interview",
  "second_interview",
  "offer",
  "hired",
];

const funnelStageNames: Record<string, string> = {
  resume_submitted: "简历投递",
  ai_screening: "AI初筛",
  interview_invited: "面试邀约",
  first_interview: "初试",
  second_interview: "复试",
  offer: "Offer",
  hired: "已入职",
};

const stageColors: Record<string, string> = {
  resume_submitted: "#1890ff",
  ai_screening: "#13c2c2",
  interview_invited: "#722ed1",
  first_interview: "#fa8c16",
  second_interview: "#faad14",
  offer: "#52c41a",
  hired: "#237804",
};

const positions = ["前端开发工程师", "后端开发工程师", "产品经理", "UI设计师", "测试工程师"];

const generateMockFunnelData = (): FunnelStage[] => {
  const baseCounts = [1000, 750, 500, 350, 200, 120, 85];
  return funnelStages.map((stage, index) => {
    const count = baseCounts[index] + Math.floor(Math.random() * 100) - 50;
    const prevCount = index === 0 ? count : baseCounts[index - 1];
    return {
      stage,
      stageName: funnelStageNames[stage],
      count,
      conversionRate: index === 0 ? 100 : (count / prevCount) * 100,
      avgDurationDays: [0, 2, 3, 5, 7, 10, 14][index] + Math.random() * 2,
    };
  });
};

const generateMockDurationData = (): DurationData[] => {
  return funnelStages.slice(1).map((stage, index) => ({
    stage,
    stageName: funnelStageNames[stage],
    days: [3, 4, 6, 8, 12, 15][index] + Math.random() * 3,
  }));
};

const generateMockHeatmapData = (): HeatmapDataItem[] => {
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    months.push(dayjs().subtract(i, "month").format("YYYY-MM"));
  }

  const data: HeatmapDataItem[] = [];
  positions.forEach((position, posIdx) => {
    months.forEach((month, monthIdx) => {
      const baseValue = (6 - posIdx) * (6 - Math.abs(monthIdx - 2.5)) * 8;
      data.push({
        month,
        position,
        value: Math.floor(baseValue + Math.random() * 40),
      });
    });
  });
  return data;
};

const generateMockTagData = (): TagItem[] => {
  const skillTags = ["React", "TypeScript", "Node.js", "Python", "Java", "Vue", "Go", "MySQL", "Redis", "Docker", "K8s", "微服务"];
  const projectTags = ["电商系统", "金融科技", "SaaS平台", "AI应用", "大数据", "移动端", "企业级", "高并发"];
  const resignTags = ["薪资涨幅", "职业发展", "团队氛围", "工作地点", "加班强度", "技术方向", "组织结构"];
  const performanceTags = ["优秀", "良好", "一般", "待改进", "高潜力", "核心骨干", "快速成长", "需要关注"];

  const tags: TagItem[] = [];
  let id = 1;

  skillTags.forEach((name) => {
    tags.push({ id: id++, name, category: "skill", count: Math.floor(Math.random() * 200) + 50 });
  });
  projectTags.forEach((name) => {
    tags.push({ id: id++, name, category: "project", count: Math.floor(Math.random() * 150) + 30 });
  });
  resignTags.forEach((name) => {
    tags.push({ id: id++, name, category: "resign_reason", count: Math.floor(Math.random() * 100) + 20 });
  });
  performanceTags.forEach((name) => {
    tags.push({ id: id++, name, category: "performance", count: Math.floor(Math.random() * 80) + 10 });
  });

  return tags;
};

const atsApis: ATSApi[] = [
  { id: "1", name: "获取候选人列表", method: "GET", path: "/api/ats/candidates", description: "分页获取候选人数据", status: "active" },
  { id: "2", name: "创建候选人", method: "POST", path: "/api/ats/candidates", description: "同步新增候选人", status: "active" },
  { id: "3", name: "更新候选人状态", method: "PUT", path: "/api/ats/candidates/:id/status", description: "更新候选人招聘阶段", status: "active" },
  { id: "4", name: "获取职位列表", method: "GET", path: "/api/ats/positions", description: "获取开放职位信息", status: "active" },
  { id: "5", name: "推送面试安排", method: "POST", path: "/api/ats/interviews", description: "同步面试安排数据", status: "planned" },
  { id: "6", name: "获取简历附件", method: "GET", path: "/api/ats/resumes/:id", description: "下载简历文件", status: "planned" },
];

const syncStatuses: SyncStatus[] = [
  { system: "北森 ATS", status: "synced", lastSync: "2026-06-07 10:30:00", recordCount: 2856 },
  { system: "Moka ATS", status: "syncing", lastSync: "2026-06-07 09:15:00", recordCount: 1523 },
  { system: "大易 ATS", status: "pending", lastSync: "2026-06-06 18:00:00", recordCount: 892 },
  { system: "自定义对接", status: "failed", lastSync: "2026-06-07 08:00:00", recordCount: 0 },
];

const categoryNames: Record<string, string> = {
  skill: "技能标签",
  project: "项目标签",
  resign_reason: "离职原因标签",
  performance: "绩效标签",
};

const categoryColors: Record<string, string> = {
  skill: "blue",
  project: "purple",
  resign_reason: "orange",
  performance: "green",
};

const Analytics: React.FC = () => {
  const [activeTagCategory, setActiveTagCategory] = useState<string | undefined>();
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [webhookEnabled, setWebhookEnabled] = useState(true);

  const funnelData = useMemo(() => generateMockFunnelData(), []);
  const durationData = useMemo(() => generateMockDurationData(), []);
  const heatmapData = useMemo(() => generateMockHeatmapData(), []);
  const tagData = useMemo(() => generateMockTagData(), []);

  const months = useMemo(() => {
    const result: string[] = [];
    for (let i = 5; i >= 0; i--) {
      result.push(dayjs().subtract(i, "month").format("YYYY-MM"));
    }
    return result;
  }, []);

  const overallConversionRate = useMemo(() => {
    if (funnelData.length === 0) return 0;
    const first = funnelData[0].count;
    const last = funnelData[funnelData.length - 1].count;
    return first > 0 ? (last / first) * 100 : 0;
  }, [funnelData]);

  const avgCycleTime = useMemo(() => {
    return durationData.reduce((sum, d) => sum + d.days, 0);
  }, [durationData]);

  const pendingOffers = 18;
  const completionRate = 76.5;

  const getFunnelChartOption = () => {
    return {
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          const data = funnelData.find((d) => d.stageName === params.name);
          if (!data) return "";
          return `${params.name}<br/>人数: ${params.value}<br/>转化率: ${data.conversionRate.toFixed(1)}%`;
        },
      },
      legend: {
        data: funnelData.map((d) => d.stageName),
        bottom: 0,
      },
      series: [
        {
          name: "招聘漏斗",
          type: "funnel",
          left: "10%",
          top: 30,
          bottom: 60,
          width: "80%",
          minSize: "10%",
          maxSize: "100%",
          sort: "descending",
          gap: 3,
          label: {
            show: true,
            position: "inside",
            formatter: (params: any) => {
              const data = funnelData.find((d) => d.stageName === params.name);
              return `${params.name}\n${params.value}人`;
            },
            color: "#fff",
            fontSize: 12,
          },
          labelLine: {
            length: 10,
            lineStyle: {
              width: 1,
              type: "solid",
            },
          },
          itemStyle: {
            borderColor: "#fff",
            borderWidth: 1,
          },
          emphasis: {
            label: {
              fontSize: 14,
            },
          },
          data: funnelData.map((item) => ({
            value: item.count,
            name: item.stageName,
            itemStyle: {
              color: stageColors[item.stage] || "#1890ff",
            },
          })),
        },
      ],
    };
  };

  const getDurationChartOption = () => {
    return {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>平均停留: ${data.value.toFixed(1)}天`;
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: durationData.map((d) => d.stageName),
        axisLabel: {
          interval: 0,
          rotate: 30,
        },
      },
      yAxis: {
        type: "value",
        name: "天数",
        axisLabel: {
          formatter: "{value}天",
        },
      },
      series: [
        {
          type: "bar",
          data: durationData.map((d, index) => ({
            value: d.days,
            itemStyle: {
              color: [
                "#13c2c2",
                "#722ed1",
                "#fa8c16",
                "#faad14",
                "#52c41a",
                "#237804",
              ][index],
              borderRadius: [4, 4, 0, 0],
            },
          })),
          barWidth: "50%",
          label: {
            show: true,
            position: "top",
            formatter: "{c}天",
          },
        },
      ],
    };
  };

  const getHeatmapChartOption = () => {
    const maxValue = Math.max(...heatmapData.map((d) => d.value));
    const heatmapMatrix = positions.map((pos) =>
      months.map((month) => {
        const item = heatmapData.find((d) => d.position === pos && d.month === month);
        return item ? item.value : 0;
      })
    );

    return {
      tooltip: {
        position: "top",
        formatter: (params: any) => {
          return `${params.value[1]}<br/>${params.value[0]}<br/>投递数量: ${params.value[2]}`;
        },
      },
      grid: {
        left: "15%",
        right: "10%",
        top: 30,
        bottom: 80,
      },
      xAxis: {
        type: "category",
        data: months,
        splitArea: {
          show: true,
        },
        axisLabel: {
          rotate: 30,
        },
      },
      yAxis: {
        type: "category",
        data: positions,
        splitArea: {
          show: true,
        },
      },
      visualMap: {
        min: 0,
        max: maxValue,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: 5,
        inRange: {
          color: ["#f0f9eb", "#e1f3d8", "#67c23a", "#52c41a", "#237804"],
        },
      },
      series: [
        {
          type: "heatmap",
          data: heatmapData.map((d) => [d.month, d.position, d.value]),
          label: {
            show: true,
            formatter: (params: any) => params.value[2],
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.3)",
            },
          },
        },
      ],
    };
  };

  const getTagCloudOption = () => {
    const filteredTags = activeTagCategory
      ? tagData.filter((t) => t.category === activeTagCategory)
      : tagData;

    const maxCount = Math.max(...filteredTags.map((t) => t.count));
    const minCount = Math.min(...filteredTags.map((t) => t.count));

    return {
      tooltip: {
        formatter: (params: any) => {
          return `${params.name}<br/>使用数量: ${params.value}人`;
        },
      },
      series: [
        {
          type: "wordCloud",
          gridSize: 10,
          sizeRange: [14, 60],
          rotationRange: [-45, 45],
          shape: "circle",
          drawOutOfBound: false,
          textStyle: {
            fontWeight: "bold",
            color: () => {
              const colors = [
                "#1890ff",
                "#52c41a",
                "#722ed1",
                "#fa8c16",
                "#eb2f96",
                "#13c2c2",
                "#faad14",
                "#2f54eb",
              ];
              return colors[Math.floor(Math.random() * colors.length)];
            },
          },
          emphasis: {
            textStyle: {
              textShadowBlur: 10,
              textShadowColor: "rgba(0, 0, 0, 0.25)",
            },
          },
          data: filteredTags.map((item) => ({
            name: item.name,
            value: item.count,
          })),
        },
      ],
    };
  };

  const filteredTagData = activeTagCategory
    ? tagData.filter((t) => t.category === activeTagCategory)
    : tagData;

  const atsApiColumns: ColumnsType<ATSApi> = [
    {
      title: "接口名称",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <Tag color={record.method === "GET" ? "green" : record.method === "POST" ? "blue" : record.method === "PUT" ? "orange" : "red"}>
            {record.method}
          </Tag>
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: "接口路径",
      dataIndex: "path",
      key: "path",
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          active: { color: "success", text: "已上线" },
          planned: { color: "processing", text: "规划中" },
          deprecated: { color: "default", text: "已废弃" },
        };
        return <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>;
      },
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { status: any; text: string; icon: any }> = {
      synced: { status: "success", text: "已同步", icon: <CheckCircleOutlined /> },
      syncing: { status: "processing", text: "同步中", icon: <SyncOutlined spin /> },
      failed: { status: "error", text: "同步失败", icon: <WarningOutlined /> },
      pending: { status: "warning", text: "等待同步", icon: <ClockCircleOutlined /> },
    };
    return statusMap[status];
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div>
      <div className="page-header">
        <Row justify="space-between" align="middle">
          <Col>
            <div className="page-title">数据分析</div>
            <div className="page-subtitle">招聘漏斗分析、招聘周期、岗位热度、人才标签、ATS对接</div>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                刷新
              </Button>
              <Button icon={<DownloadOutlined />}>导出报告</Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* 顶部统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="本月转化率"
              value={overallConversionRate}
              precision={1}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                简历投递 → 已入职
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="待确认Offer"
              value={pendingOffers}
              suffix="人"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                等待候选人确认
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="平均招聘周期"
              value={avgCycleTime}
              precision={1}
              suffix="天"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                从投递到入职
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="招聘完成率"
              value={completionRate}
              precision={1}
              suffix="%"
              prefix={<FundOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                已入职 / 计划招聘
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 第一行：招聘漏斗分析 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24}>
          <Card
            title={
              <Space>
                <FundOutlined style={{ color: "#1890ff" }} />
                <span>招聘漏斗分析</span>
                <Tag color="green">整体转化率: {overallConversionRate.toFixed(1)}%</Tag>
              </Space>
            }
            bordered={false}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
                <ReactECharts
                  option={getFunnelChartOption()}
                  style={{ height: 450 }}
                  notMerge={true}
                  lazyUpdate={true}
                />
              </Col>
              <Col xs={24} lg={8}>
                <List
                  dataSource={funnelData}
                  renderItem={(item, index) => (
                    <List.Item key={item.stage}>
                      <List.Item.Meta
                        title={
                          <Space>
                            <div
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                background: stageColors[item.stage] || "#1890ff",
                              }}
                            />
                            <span>{item.stageName}</span>
                            <Tag color="blue">{item.count}人</Tag>
                          </Space>
                        }
                        description={
                          <div>
                            <Row justify="space-between" style={{ marginBottom: 4 }}>
                              <Col>
                                <Text type="secondary">转换率</Text>
                                <Text strong style={{ marginLeft: 8, color: stageColors[item.stage] }}>
                                  {item.conversionRate.toFixed(1)}%
                                </Text>
                              </Col>
                              {index > 0 && (
                                <Col>
                                  <Text type="secondary">环比上一阶段</Text>
                                  <Text strong style={{ marginLeft: 8, color: "#52c41a" }}>
                                    {((item.count / funnelData[index - 1].count) * 100).toFixed(1)}%
                                  </Text>
                                </Col>
                              )}
                            </Row>
                            {index > 0 && (
                              <div
                                style={{
                                  height: 6,
                                  background: "#f0f0f0",
                                  borderRadius: 3,
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${(item.count / funnelData[index - 1].count) * 100}%`,
                                    height: "100%",
                                    background: stageColors[item.stage],
                                    borderRadius: 3,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 第二行：招聘周期分析 + 岗位热度热力图 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined style={{ color: "#722ed1" }} />
                <span>招聘周期分析</span>
              </Space>
            }
            bordered={false}
          >
            <ReactECharts
              option={getDurationChartOption()}
              style={{ height: 350 }}
              notMerge={true}
              lazyUpdate={true}
            />
            <Alert
              message="提示"
              description="平均招聘周期是各阶段停留时长的总和，从简历投递到最终入职"
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FireOutlined style={{ color: "#fa8c16" }} />
                <span>岗位热度热力图</span>
              </Space>
            }
            bordered={false}
          >
            <ReactECharts
              option={getHeatmapChartOption()}
              style={{ height: 350 }}
              notMerge={true}
              lazyUpdate={true}
            />
          </Card>
        </Col>
      </Row>

      {/* 第三行：人才库标签云 + ATS对接面板 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <TagsOutlined style={{ color: "#52c41a" }} />
                <span>人才库标签云</span>
              </Space>
            }
            bordered={false}
            extra={
              <Space wrap>
                <Button
                  type={activeTagCategory === undefined ? "primary" : "default"}
                  size="small"
                  onClick={() => {
                    setActiveTagCategory(undefined);
                    setSelectedTag(null);
                  }}
                >
                  全部
                </Button>
                {Object.entries(categoryNames).map(([key, name]) => (
                  <Button
                    key={key}
                    type={activeTagCategory === key ? "primary" : "default"}
                    size="small"
                    onClick={() => {
                      setActiveTagCategory(key);
                      setSelectedTag(null);
                    }}
                  >
                    {name}
                  </Button>
                ))}
              </Space>
            }
          >
            <ReactECharts
              option={getTagCloudOption()}
              style={{ height: 300 }}
              notMerge={true}
              lazyUpdate={true}
            />
            <Divider style={{ margin: "16px 0" }} />
            <div>
              <Title level={5} style={{ marginBottom: 12 }}>
                {activeTagCategory ? categoryNames[activeTagCategory] : "热门标签"} TOP 10
              </Title>
              <Row gutter={[8, 8]}>
                {[...filteredTagData]
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 10)
                  .map((tag) => (
                    <Col key={tag.id}>
                      <Tooltip title={`使用数量: ${tag.count}人`}>
                        <Tag
                          color={selectedTag === tag.id ? "geekblue" : categoryColors[tag.category]}
                          style={{
                            cursor: "pointer",
                            padding: "4px 12px",
                            borderRadius: 4,
                            fontSize: 13,
                            fontWeight: selectedTag === tag.id ? 600 : 400,
                          }}
                          onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                        >
                          {tag.name}
                          <span style={{ marginLeft: 4, opacity: 0.8 }}>({tag.count})</span>
                        </Tag>
                      </Tooltip>
                    </Col>
                  ))}
              </Row>
              {selectedTag && (
                <Alert
                  message={`已筛选标签: ${tagData.find((t) => t.id === selectedTag)?.name}`}
                  type="success"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ApiOutlined style={{ color: "#eb2f96" }} />
                <span>ATS对接预留能力</span>
              </Space>
            }
            bordered={false}
          >
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              <div>
                <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
                  <Col>
                    <Title level={5} style={{ margin: 0 }}>
                      数据同步状态
                    </Title>
                  </Col>
                  <Col>
                    <Space>
                      <Text type="secondary">Webhook推送</Text>
                      <Switch checked={webhookEnabled} onChange={setWebhookEnabled} />
                    </Space>
                  </Col>
                </Row>
                <Row gutter={[8, 8]}>
                  {syncStatuses.map((sync) => {
                    const statusInfo = getStatusBadge(sync.status);
                    return (
                      <Col xs={24} sm={12} key={sync.system}>
                        <Card size="small" hoverable>
                          <Space direction="vertical" style={{ width: "100%" }} size="small">
                            <Space>
                              {statusInfo?.icon}
                              <Text strong>{sync.system}</Text>
                              <Badge status={statusInfo?.status} text={statusInfo?.text} />
                            </Space>
                            <Descriptions size="small" column={1}>
                              <Descriptions.Item label="同步记录">
                                {sync.recordCount?.toLocaleString()} 条
                              </Descriptions.Item>
                              <Descriptions.Item label="最近同步">
                                {sync.lastSync}
                              </Descriptions.Item>
                            </Descriptions>
                            <Button type="link" size="small" style={{ padding: 0 }}>
                              <SyncOutlined /> 立即同步
                            </Button>
                          </Space>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </div>

              <div>
                <Title level={5} style={{ marginBottom: 12 }}>
                  API接口列表
                </Title>
                <Table
                  columns={atsApiColumns}
                  dataSource={atsApis}
                  pagination={false}
                  size="small"
                  rowKey="id"
                />
              </div>

              <div>
                <Title level={5} style={{ marginBottom: 12 }}>
                  快捷入口
                </Title>
                <Space wrap>
                  <Button icon={<LinkOutlined />}>查看接口文档</Button>
                  <Button icon={<SettingOutlined />}>配置Webhook</Button>
                  <Button icon={<ApiOutlined />}>API测试工具</Button>
                </Space>
              </div>

              <Alert
                message="ATS对接说明"
                description="本系统预留了与主流ATS系统（北森、Moka、大易等）的对接能力，支持候选人数据双向同步、面试安排推送、简历附件获取等功能。如需对接请联系技术团队。"
                type="info"
                showIcon
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;
