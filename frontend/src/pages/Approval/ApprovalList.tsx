import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  Modal,
  Form,
  message,
  Row,
  Col,
  Typography,
  Statistic,
  Tabs,
  Empty,
  Descriptions,
  Divider,
  Badge,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { approvalAPI, candidateAPI, positionAPI } from "../../api";
import type { Approval, Candidate, Position } from "../../types";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const typeMap: Record<string, { name: string; color: string }> = {
  position_publish: { name: "职位发布", color: "blue" },
  candidate_hire: { name: "录用审批", color: "green" },
  offer_approval: { name: "Offer审批", color: "cyan" },
  budget_approval: { name: "预算审批", color: "gold" },
  interview_schedule: { name: "面试安排", color: "purple" },
};

const statusMap: Record<string, { color: string; name: string; icon: any }> = {
  pending: { color: "processing", name: "待审批", icon: <ClockCircleOutlined /> },
  approved: { color: "success", name: "已通过", icon: <CheckCircleOutlined /> },
  rejected: { color: "error", name: "已驳回", icon: <CloseCircleOutlined /> },
  cancelled: { color: "default", name: "已取消", icon: <WarningOutlined /> },
};

const ApprovalList: React.FC = () => {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>("pending");
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeTab, setActiveTab] = useState("myPending");
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentApproval, setCurrentApproval] = useState<Approval | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    myPending: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadApprovals();
  }, [page, pageSize, statusFilter, typeFilter, searchKeyword, activeTab]);

  const loadStats = async () => {
    try {
      const response = await approvalAPI.getStats();
      setStats(response || stats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (searchKeyword) params.keyword = searchKeyword;
      if (activeTab === "myPending") params.myPending = true;
      const response = await approvalAPI.getList(params);
      setApprovals(response?.data || []);
      setTotal(response?.total || 0);
    } catch (error) {
      console.error("Failed to load approvals:", error);
      message.error("加载审批列表失败");
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (approval: Approval) => {
    setCurrentApproval(approval);
    try {
      if (approval.candidateId) {
        const candRes = await candidateAPI.getById(approval.candidateId);
        setCandidate(candRes);
      }
      if (approval.positionId) {
        const posRes = await positionAPI.getById(approval.positionId);
        setPosition(posRes);
      }
    } catch (error) {
      console.error("Failed to load detail:", error);
    }
    setDetailModalVisible(true);
  };

  const handleApprove = async (values: { comments?: string }) => {
    if (!currentApproval) return;
    try {
      await approvalAPI.approve(currentApproval.id, values.comments);
      message.success("审批通过");
      setDetailModalVisible(false);
      loadApprovals();
      loadStats();
    } catch (error: any) {
      message.error(error?.message || "审批失败");
    }
  };

  const handleReject = async (values: { comments: string }) => {
    if (!currentApproval) return;
    try {
      await approvalAPI.reject(currentApproval.id, values.comments);
      message.success("已驳回");
      setDetailModalVisible(false);
      loadApprovals();
      loadStats();
    } catch (error: any) {
      message.error(error?.message || "操作失败");
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await approvalAPI.cancel(id);
      message.success("已取消");
      loadApprovals();
      loadStats();
    } catch (error: any) {
      message.error(error?.message || "取消失败");
    }
  };

  const columns = [
    {
      title: "审批类型",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        const info = typeMap[type] || { color: "default", name: type };
        return <Tag color={info.color}>{info.name}</Tag>;
      },
    },
    {
      title: "关联候选人",
      dataIndex: "candidate",
      key: "candidate",
      render: (cand: Candidate) =>
        cand ? (
          <a onClick={() => navigate(`/candidates/${cand.id}`)}>{cand.name}</a>
        ) : (
          "-"
        ),
    },
    {
      title: "关联职位",
      dataIndex: "position",
      key: "position",
      render: (pos: Position) =>
        pos ? (
          <a onClick={() => navigate(`/positions/${pos.id}`)}>{pos.title}</a>
        ) : (
          "-"
        ),
    },
    {
      title: "申请人",
      dataIndex: "applicant",
      key: "applicant",
      render: (user: any) => user?.name || "-",
    },
    {
      title: "审批人",
      dataIndex: "approver",
      key: "approver",
      render: (user: any) => user?.name || "-",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const info = statusMap[status] || {
          color: "default",
          name: status,
          icon: null,
        };
        return (
          <Tag color={info.color}>
            {info.icon} {info.name}
          </Tag>
        );
      },
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("MM-DD HH:mm"),
    },
    {
      title: "操作",
      key: "actions",
      render: (_: any, record: Approval) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => loadDetail(record)}
          >
            详情
          </Button>
          {record.status === "pending" && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => {
                  setCurrentApproval(record);
                  form.setFieldsValue({});
                  Modal.confirm({
                    title: "确认通过？",
                    icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
                    content: (
                      <Form form={form} layout="vertical">
                        <Form.Item name="comments" label="审批意见">
                          <TextArea rows={3} placeholder="可选" />
                        </Form.Item>
                      </Form>
                    ),
                    okText: "通过",
                    okButtonProps: { style: { background: "#52c41a" } },
                    cancelText: "取消",
                    onOk: () => {
                      form.validateFields().then((values) => handleApprove(values));
                    },
                  });
                }}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  setCurrentApproval(record);
                  form.setFieldsValue({});
                  Modal.confirm({
                    title: "确认驳回？",
                    icon: <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
                    content: (
                      <Form form={form} layout="vertical">
                        <Form.Item
                          name="comments"
                          label="驳回原因"
                          rules={[{ required: true, message: "请输入驳回原因" }]}
                        >
                          <TextArea rows={3} placeholder="请输入驳回原因" />
                        </Form.Item>
                      </Form>
                    ),
                    okText: "驳回",
                    okButtonProps: { danger: true },
                    cancelText: "取消",
                    onOk: () => {
                      form.validateFields().then((values) => handleReject(values));
                    },
                  });
                }}
              >
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: "myPending",
      label: (
        <span>
          待我审批 <Badge count={stats.myPending} size="small" />
        </span>
      ),
    },
    {
      key: "all",
      label: "全部审批",
    },
  ];

  const statCards = [
    {
      title: "待审批",
      value: stats.pending,
      color: "#faad14",
      icon: <ClockCircleOutlined />,
    },
    {
      title: "已通过",
      value: stats.approved,
      color: "#52c41a",
      icon: <CheckCircleOutlined />,
    },
    {
      title: "已驳回",
      value: stats.rejected,
      color: "#ff4d4f",
      icon: <CloseCircleOutlined />,
    },
    {
      title: "我待办",
      value: stats.myPending,
      color: "#1890ff",
      icon: <WarningOutlined />,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">审批中心</div>
        <div className="page-subtitle">处理职位发布、Offer发放等审批事项</div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={12} sm={6} key={index}>
            <Card hoverable bodyStyle={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `${card.color}15`,
                    color: card.color,
                    fontSize: 24,
                  }}
                >
                  {card.icon}
                </div>
                <div>
                  <Statistic
                    title={<Text type="secondary" style={{ fontSize: 12 }}>{card.title}</Text>}
                    value={card.value}
                    valueStyle={{ color: card.color, fontSize: 20 }}
                  />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card bordered={false}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ marginBottom: 16 }}
        />

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="搜索审批类型、候选人、职位"
              prefix={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="按类型筛选"
              allowClear
              style={{ width: "100%" }}
              value={typeFilter}
              onChange={setTypeFilter}
            >
              {Object.entries(typeMap).map(([key, value]) => (
                <Option key={key} value={key}>
                  {value.name}
                </Option>
              ))}
            </Select>
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
                  {value.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={approvals}
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
          locale={{
            emptyText: <Empty description={activeTab === "myPending" ? "暂无待办审批" : "暂无审批"} />,
          }}
        />
      </Card>

      <Modal
        title="审批详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        {currentApproval && (
          <div>
            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="审批类型">
                {typeMap[currentApproval.type]?.name || currentApproval.type}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[currentApproval.status]?.color}>
                  {statusMap[currentApproval.status]?.name}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="申请人">
                {currentApproval.applicant?.name || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="审批人">
                {currentApproval.approver?.name || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">
                {dayjs(currentApproval.createdAt).format("YYYY-MM-DD HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="审批顺序">
                第 {currentApproval.approvalOrder} 级
              </Descriptions.Item>
            </Descriptions>

            {currentApproval.reason && (
              <Card type="inner" title="申请原因" size="small" style={{ marginBottom: 16 }}>
                <Text>{currentApproval.reason}</Text>
              </Card>
            )}

            {candidate && (
              <Card type="inner" title="候选人信息" size="small" style={{ marginBottom: 16 }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="姓名">
                    <a onClick={() => navigate(`/candidates/${candidate.id}`)}>
                      {candidate.name}
                    </a>
                  </Descriptions.Item>
                  <Descriptions.Item label="手机">{candidate.phone}</Descriptions.Item>
                  <Descriptions.Item label="应聘职位">
                    {candidate.position?.title}
                  </Descriptions.Item>
                  <Descriptions.Item label="工作年限">
                    {candidate.yearsOfExperience ? `${candidate.yearsOfExperience}年` : "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="当前公司">
                    {candidate.currentCompany || "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="期望薪资">
                    {candidate.expectedSalaryMin && candidate.expectedSalaryMax
                      ? `¥${candidate.expectedSalaryMin}k - ¥${candidate.expectedSalaryMax}k`
                      : "-"}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {position && (
              <Card type="inner" title="职位信息" size="small" style={{ marginBottom: 16 }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="职位名称">
                    <a onClick={() => navigate(`/positions/${position.id}`)}>
                      {position.title}
                    </a>
                  </Descriptions.Item>
                  <Descriptions.Item label="部门">{position.department}</Descriptions.Item>
                  <Descriptions.Item label="招聘人数">
                    {position.hiredCount}/{position.headcount}
                  </Descriptions.Item>
                  <Descriptions.Item label="薪资范围">
                    {position.salaryMin && position.salaryMax
                      ? `¥${position.salaryMin}k - ¥${position.salaryMax}k`
                      : "-"}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {currentApproval.status === "pending" && (
              <>
                <Divider />
                <Row justify="end" gutter={8}>
                  <Col>
                    <Button onClick={() => setDetailModalVisible(false)}>取消</Button>
                  </Col>
                  <Col>
                    <Button
                      danger
                      onClick={() => {
                        Modal.confirm({
                          title: "确认驳回？",
                          icon: <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
                          content: (
                            <Form form={form} layout="vertical">
                              <Form.Item
                                name="comments"
                                label="驳回原因"
                                rules={[{ required: true, message: "请输入驳回原因" }]}
                              >
                                <TextArea rows={3} placeholder="请输入驳回原因" />
                              </Form.Item>
                            </Form>
                          ),
                          okText: "驳回",
                          okButtonProps: { danger: true },
                          cancelText: "取消",
                          onOk: () => {
                            form.validateFields().then((values) => handleReject(values));
                          },
                        });
                      }}
                    >
                      驳回
                    </Button>
                  </Col>
                  <Col>
                    <Button
                      type="primary"
                      onClick={() => {
                        Modal.confirm({
                          title: "确认通过？",
                          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
                          content: (
                            <Form form={form} layout="vertical">
                              <Form.Item name="comments" label="审批意见">
                                <TextArea rows={3} placeholder="可选" />
                              </Form.Item>
                            </Form>
                          ),
                          okText: "通过",
                          okButtonProps: { style: { background: "#52c41a" } },
                          cancelText: "取消",
                          onOk: () => {
                            form.validateFields().then((values) => handleApprove(values));
                          },
                        });
                      }}
                    >
                      通过
                    </Button>
                  </Col>
                </Row>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApprovalList;
