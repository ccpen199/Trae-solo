import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Descriptions,
  Button,
  Tag,
  Typography,
  Space,
  Table,
  Tabs,
  Progress,
  Statistic,
  message,
  Divider,
  Empty,
  Modal,
  Form,
  Input,
  Select,
  Timeline,
  List,
  Avatar,
  Alert,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  SendOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  EyeOutlined,
  BarChartOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { positionAPI, candidateAPI, approvalAPI } from "../../api";
import type { Position, Candidate, AuditLog } from "../../types";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const channelMap: Record<string, { name: string; color: string }> = {
  boss: { name: "BOSS直聘", color: "blue" },
  qiancheng: { name: "前程无忧", color: "gold" },
  zhilian: { name: "智联招聘", color: "green" },
  liepin: { name: "猎聘", color: "purple" },
  internal: { name: "内部发布", color: "cyan" },
};

const statusMap: Record<string, { color: string; name: string }> = {
  draft: { color: "default", name: "草稿" },
  pending_approval: { color: "processing", name: "审批中" },
  approved: { color: "success", name: "已审批" },
  published: { color: "success", name: "已发布" },
  closed: { color: "default", name: "已关闭" },
  cancelled: { color: "error", name: "已取消" },
};

const PositionDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [position, setPosition] = useState<Position | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [publishForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadPosition();
      loadCandidates();
      loadAuditLogs();
    }
  }, [id]);

  const loadPosition = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await positionAPI.getById(parseInt(id));
      setPosition(data);
      form.setFieldsValue(data);
    } catch (error: any) {
      message.error(error?.message || "加载职位详情失败");
    } finally {
      setLoading(false);
    }
  };

  const loadCandidates = async () => {
    if (!id) return;
    try {
      const response = await candidateAPI.getList({ positionId: parseInt(id), pageSize: 100 });
      setCandidates(response?.data || []);
    } catch (error) {
      console.error("Failed to load candidates:", error);
    }
  };

  const loadAuditLogs = async () => {
    // 占位，后续可扩展审计日志
  };

  const handleSave = async (values: any) => {
    if (!position) return;
    try {
      await positionAPI.update(position.id, values);
      message.success("职位已更新");
      setEditModalVisible(false);
      loadPosition();
    } catch (error: any) {
      message.error(error?.message || "保存失败");
    }
  };

  const handlePublish = async (values: { channels: string[]; reason?: string }) => {
    if (!position) return;
    try {
      await positionAPI.publish(position.id, {
        channels: values.channels,
        reason: values.reason,
      });
      message.success("发布请求已提交");
      setPublishModalVisible(false);
      loadPosition();
    } catch (error: any) {
      message.error(error?.message || "发布失败");
    }
  };

  const handleDelete = () => {
    if (!position) return;
    Modal.confirm({
      title: "确认删除该职位？",
      content: "删除后相关数据将无法恢复，请谨慎操作",
      okText: "确认删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        try {
          await positionAPI.delete(position.id);
          message.success("职位已删除");
          navigate("/positions");
        } catch (error: any) {
          message.error(error?.message || "删除失败");
        }
      },
    });
  };

  const handleClose = () => {
    if (!position) return;
    Modal.confirm({
      title: "确认关闭该职位？",
      content: "关闭后该职位将停止招聘，候选人仍可查看历史记录",
      okText: "确认关闭",
      cancelText: "取消",
      onOk: async () => {
        try {
          await positionAPI.close(position.id);
          message.success("职位已关闭");
          loadPosition();
        } catch (error: any) {
          message.error(error?.message || "操作失败");
        }
      },
    });
  };

  const getCandidateStageStats = () => {
    const stats: Record<string, number> = {};
    candidates.forEach((c) => {
      stats[c.status] = (stats[c.status] || 0) + 1;
    });
    return stats;
  };

  const candidateColumns = [
    {
      title: "候选人",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Candidate) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <a onClick={() => navigate(`/candidates/${record.id}`)}>{name}</a>
        </Space>
      ),
    },
    {
      title: "手机",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "工作年限",
      dataIndex: "yearsOfExperience",
      key: "yearsOfExperience",
      render: (years: number) => (years ? `${years}年` : "-"),
    },
    {
      title: "当前公司",
      dataIndex: "currentCompany",
      key: "currentCompany",
      render: (company: string) => company || "-",
    },
    {
      title: "AI评分",
      dataIndex: "aiScreeningResult",
      key: "aiScreeningResult",
      render: (result: any) =>
        result?.overallScore !== undefined ? (
          <Tag color={result.overallScore >= 70 ? "success" : result.overallScore >= 50 ? "warning" : "error"}>
            {result.overallScore}分
          </Tag>
        ) : (
          <Tag color="default">待初筛</Tag>
        ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusNameMap: Record<string, string> = {
          resume_received: "简历已收",
          screening: "初筛中",
          screened: "初筛通过",
          interview_invited: "已邀约",
          interview: "面试中",
          reference_check: "背调中",
          offer: "Offer中",
          onboarding: "待入职",
          hired: "已入职",
          rejected: "已拒绝",
        };
        return <Tag>{statusNameMap[status] || status}</Tag>;
      },
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("MM-DD"),
    },
  ];

  const operationTimeline = [
    {
      time: "创建职位",
      color: "#1890ff",
      icon: <EditOutlined />,
      date: position?.createdAt,
    },
    {
      time: "提交审批",
      color: "#faad14",
      icon: <SendOutlined />,
      date: position?.status === "pending_approval" ? new Date().toISOString() : null,
    },
    {
      time: "审批通过",
      color: "#52c41a",
      icon: <CheckCircleOutlined />,
      date: position?.status === "approved" || position?.status === "published" ? new Date().toISOString() : null,
    },
    {
      time: "发布到渠道",
      color: "#722ed1",
      icon: <PlayCircleOutlined />,
      date: position?.publishedAt,
    },
  ];

  if (!position && !loading) {
    return <Empty description="职位不存在或已删除" />;
  }

  const stageStats = getCandidateStageStats();
  const totalCandidates = candidates.length;
  const hiredCount = stageStats["hired"] || 0;

  return (
    <div>
      <div className="page-header">
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/positions")}>
                返回列表
              </Button>
              <div>
                <div className="page-title">
                  {position?.title}
                  <Tag
                    color={statusMap[position?.status || "draft"]?.color}
                    style={{ marginLeft: 12 }}
                  >
                    {statusMap[position?.status || "draft"]?.name}
                  </Tag>
                </div>
                <div className="page-subtitle">
                  {position?.department} · {position?.workLocation} · 招聘 {position?.headcount} 人
                </div>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              {position?.status === "draft" && (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => setPublishModalVisible(true)}
                >
                  发布职位
                </Button>
              )}
              {position?.status === "published" && (
                <Button danger onClick={handleClose}>
                  关闭招聘
                </Button>
              )}
              <Button icon={<EditOutlined />} onClick={() => setEditModalVisible(true)}>
                编辑
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                删除
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false}>
            <Statistic
              title="候选人总数"
              value={totalCandidates}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false}>
            <Statistic
              title="面试中"
              value={stageStats["interview"] || 0}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false}>
            <Statistic
              title="已入职"
              value={hiredCount}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false}>
            <Statistic
              title="招聘进度"
              value={position?.headcount ? Math.round((hiredCount / position.headcount) * 100) : 0}
              suffix="%"
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      <Card bordered={false}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "info",
              label: (
                <span>
                  <EyeOutlined /> 职位信息
                </span>
              ),
            },
            {
              key: "candidates",
              label: (
                <span>
                  <UserOutlined /> 候选人 ({totalCandidates})
                </span>
              ),
            },
            {
              key: "process",
              label: (
                <span>
                  <HistoryOutlined /> 招聘流程
                </span>
              ),
            },
            {
              key: "channels",
              label: (
                <span>
                  <LinkOutlined /> 发布渠道
                </span>
              ),
            },
          ]}
        />

        {activeTab === "info" && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="职位名称">{position?.title}</Descriptions.Item>
              <Descriptions.Item label="部门">{position?.department}</Descriptions.Item>
              <Descriptions.Item label="工作地点">{position?.workLocation}</Descriptions.Item>
              <Descriptions.Item label="招聘人数">
                {position?.hiredCount || 0} / {position?.headcount} 人
              </Descriptions.Item>
              <Descriptions.Item label="薪资范围">
                {position?.salaryMin && position?.salaryMax
                  ? `¥${position.salaryMin}k - ¥${position.salaryMax}k`
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="学历要求">{position?.education || "-"}</Descriptions.Item>
              <Descriptions.Item label="工作年限">
                {position?.experienceRequired ? `${position.experienceRequired}年以上` : "不限"}
              </Descriptions.Item>
              <Descriptions.Item label="职位类型">{position?.employmentType || "全职"}</Descriptions.Item>
              <Descriptions.Item label="HR负责人">
                {position?.hrOwner?.name || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="用人部门">
                {position?.hiringManager?.name || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {position?.createdAt ? dayjs(position.createdAt).format("YYYY-MM-DD HH:mm") : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="发布时间">
                {position?.publishedAt ? dayjs(position.publishedAt).format("YYYY-MM-DD HH:mm") : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="职位描述" span={2}>
                <Text style={{ whiteSpace: "pre-wrap" }}>{position?.description}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="任职要求" span={2}>
                <Text style={{ whiteSpace: "pre-wrap" }}>{position?.requirements}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="福利待遇" span={2}>
                <Text style={{ whiteSpace: "pre-wrap" }}>{position?.benefits || "五险一金、年终奖、带薪年假"}</Text>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}

        {activeTab === "candidates" && (
          <Table
            rowKey="id"
            columns={candidateColumns}
            dataSource={candidates}
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 位候选人` }}
            locale={{ emptyText: <Empty description="暂无候选人" /> }}
          />
        )}

        {activeTab === "process" && (
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="招聘流程进度" bordered={false}>
                <Timeline
                  items={operationTimeline
                    .filter((item) => item.date)
                    .map((item) => ({
                      color: item.color,
                      dot: item.icon,
                      children: (
                        <div>
                          <Text strong>{item.time}</Text>
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(item.date!).format("YYYY-MM-DD HH:mm")}
                            </Text>
                          </div>
                        </div>
                      ),
                    }))}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="各阶段候选人分布" bordered={false}>
                {candidates.length > 0 ? (
                  <List
                    dataSource={[
                      { stage: "简历已收", key: "resume_received" },
                      { stage: "初筛中", key: "screening" },
                      { stage: "初筛通过", key: "screened" },
                      { stage: "面试中", key: "interview" },
                      { stage: "背调中", key: "reference_check" },
                      { stage: "Offer中", key: "offer" },
                      { stage: "已入职", key: "hired" },
                    ]}
                    renderItem={(item) => {
                      const count = stageStats[item.key] || 0;
                      const percent = totalCandidates > 0 ? (count / totalCandidates) * 100 : 0;
                      return (
                        <List.Item key={item.key}>
                          <Row justify="space-between" align="middle" style={{ width: "100%" }}>
                            <Col>
                              <Text>{item.stage}</Text>
                            </Col>
                            <Col>
                              <Space>
                                <Text strong>{count}人</Text>
                                <Text type="secondary">{percent.toFixed(1)}%</Text>
                              </Space>
                            </Col>
                          </Row>
                          <Progress
                            percent={percent}
                            showInfo={false}
                            size="small"
                            strokeColor="#1890ff"
                            style={{ marginTop: 8 }}
                          />
                        </List.Item>
                      );
                    }}
                  />
                ) : (
                  <Empty description="暂无数据" />
                )}
              </Card>
            </Col>
          </Row>
        )}

        {activeTab === "channels" && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              {Object.entries(channelMap).map(([key, info]) => {
                const isPublished = position?.channels?.includes(key);
                return (
                  <Col xs={12} sm={8} md={6} key={key}>
                    <Card bordered={false} size="small" hoverable>
                      <Row align="middle" gutter={[8, 8]}>
                        <Col flex="auto">
                          <Tag color={info.color}>{info.name}</Tag>
                        </Col>
                        <Col>
                          {isPublished ? (
                            <CheckCircleOutlined style={{ color: "#52c41a" }} />
                          ) : (
                            <ClockCircleOutlined style={{ color: "#d9d9d9" }} />
                          )}
                        </Col>
                      </Row>
                      <Row style={{ marginTop: 8 }}>
                        <Col span={24}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {isPublished ? "已发布" : "未发布"}
                          </Text>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                );
              })}
            </Row>
            <Card bordered={false} size="small" title="ATS对接状态">
              <Row align="middle" gutter={[8, 8]}>
                <Col>
                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                </Col>
                <Col>
                  <Text>预留ATS系统对接标准API，支持第三方系统集成</Text>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Card>

      <Modal
        title="编辑职位"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={[16, 8]}>
            <Col xs={24} md={12}>
              <Form.Item name="title" label="职位名称" rules={[{ required: true }]}>
                <Input placeholder="请输入职位名称" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="department" label="所属部门" rules={[{ required: true }]}>
                <Input placeholder="请输入所属部门" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="workLocation" label="工作地点" rules={[{ required: true }]}>
                <Input placeholder="请输入工作地点" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="headcount" label="招聘人数" rules={[{ required: true }]}>
                <Input type="number" min={1} placeholder="请输入招聘人数" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="salaryMin" label="最低薪资(K)">
                <Input type="number" placeholder="最低月薪" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="salaryMax" label="最高薪资(K)">
                <Input type="number" placeholder="最高月薪" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="education" label="学历要求">
                <Select placeholder="请选择学历要求">
                  <Option value="不限">不限</Option>
                  <Option value="大专">大专</Option>
                  <Option value="本科">本科</Option>
                  <Option value="硕士">硕士</Option>
                  <Option value="博士">博士</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="experienceRequired" label="工作年限要求">
                <Input type="number" placeholder="年，留空为不限" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="employmentType" label="用工类型">
                <Select defaultValue="全职">
                  <Option value="全职">全职</Option>
                  <Option value="兼职">兼职</Option>
                  <Option value="实习">实习</Option>
                  <Option value="外包">外包</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="description" label="职位描述" rules={[{ required: true }]}>
                <TextArea rows={4} placeholder="请描述岗位职责" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="requirements" label="任职要求" rules={[{ required: true }]}>
                <TextArea rows={4} placeholder="请描述任职要求" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="benefits" label="福利待遇">
                <TextArea rows={3} placeholder="五险一金、年终奖、带薪年假..." />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={() => setEditModalVisible(false)}>取消</Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="发布职位"
        open={publishModalVisible}
        onCancel={() => setPublishModalVisible(false)}
        footer={null}
        width={520}
        destroyOnClose
      >
        <Form
          form={publishForm}
          layout="vertical"
          onFinish={handlePublish}
        >
          <Form.Item
            name="channels"
            label="发布渠道"
            rules={[{ required: true, message: "请选择发布渠道" }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择发布渠道"
              style={{ width: "100%" }}
            >
              {Object.entries(channelMap).map(([key, info]) => (
                <Option key={key} value={key}>
                  {info.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="reason" label="发布说明">
            <TextArea rows={3} placeholder="请输入发布说明（可选）" />
          </Form.Item>
          <Divider />
          <Alert
            message="提交后将自动发起审批流程，审批通过后自动发布到所选渠道"
            type="info"
            showIcon
          />
          <Row justify="end" gutter={8} style={{ marginTop: 16 }}>
            <Col>
              <Button onClick={() => setPublishModalVisible(false)}>取消</Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit">
                提交审批
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default PositionDetail;
