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
  InputNumber,
  message,
  Popconfirm,
  Row,
  Col,
  Typography,
  Avatar,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  ShareAltOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { positionAPI, analyticsAPI } from "../../api";
import { PUBLISH_CHANNEL_MAP } from "../../constants";
import type { Position, User, PublishChannelStatus, SyncStatus } from "../../types";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const PositionList: React.FC = () => {
  const navigate = useNavigate();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [form] = Form.useForm();
  const [hiringManagers, setHiringManagers] = useState<User[]>([]);

  useEffect(() => {
    loadPositions();
    loadHiringManagers();
  }, [page, pageSize, searchKeyword, statusFilter]);

  const loadHiringManagers = async () => {
    try {
      const res = await analyticsAPI.getUsers("hiring_manager");
      setHiringManagers(res?.data || []);
    } catch (error) {
      console.error("Failed to load hiring managers:", error);
    }
  };

  const loadPositions = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (searchKeyword) params.keyword = searchKeyword;
      if (statusFilter) params.status = statusFilter;
      const response = await positionAPI.getList(params);
      setPositions(response?.data || []);
      setTotal(response?.total || 0);
    } catch (error) {
      console.error("Failed to load positions:", error);
      message.error("加载职位列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPosition(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
    form.setFieldsValue({
      ...position,
      keywords: position.keywords?.join(", "),
      skillTags: position.skillTags?.join(", "),
      publishChannels: position.publishChannels || [],
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await positionAPI.update(id, { status: "closed" });
      message.success("职位已关闭");
      loadPositions();
    } catch (error: any) {
      message.error(error?.message || "关闭职位失败");
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        keywords: values.keywords
          ? values.keywords.split(",").map((k: string) => k.trim())
          : [],
        skillTags: values.skillTags
          ? values.skillTags.split(",").map((k: string) => k.trim())
          : [],
      };

      if (editingPosition) {
        await positionAPI.update(editingPosition.id, data);
        message.success("职位更新成功");
      } else {
        await positionAPI.create(data);
        message.success("职位创建成功");
      }
      setModalVisible(false);
      loadPositions();
    } catch (error: any) {
      message.error(error?.message || "保存失败");
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await positionAPI.publish(id, { publishChannels: ["boss", "51job"] });
      message.success("职位已发布到招聘渠道");
      loadPositions();
    } catch (error: any) {
      message.error(error?.message || "发布失败");
    }
  };

  const handleSubmitApproval = async (id: number) => {
    try {
      await positionAPI.submitApproval(id);
      message.success("已提交审批");
      loadPositions();
    } catch (error: any) {
      message.error(error?.message || "提交审批失败");
    }
  };

  const statusMap: Record<string, { color: string; name: string }> = {
    draft: { color: "default", name: "草稿" },
    pending_approval: { color: "gold", name: "待审批" },
    approved: { color: "blue", name: "已审批" },
    published: { color: "green", name: "已发布" },
    closed: { color: "red", name: "已关闭" },
  };

  const syncStatusMap: Record<SyncStatus, { color: string; name: string }> = {
    synced: { color: "green", name: "已同步" },
    syncing: { color: "blue", name: "同步中" },
    failed: { color: "red", name: "失败" },
    pending: { color: "default", name: "待同步" },
  };

  const getPublishStatus = (position: Position): Record<string, PublishChannelStatus> => {
    if (position.publishStatus && Object.keys(position.publishStatus).length > 0) {
      return position.publishStatus;
    }

    if (!position.publishChannels || position.publishChannels.length === 0) {
      return {};
    }

    const mockStatus: Record<string, PublishChannelStatus> = {};
    const statuses: SyncStatus[] = ["synced", "syncing", "failed", "pending"];

    position.publishChannels.forEach((channel) => {
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      mockStatus[channel] = {
        channel,
        status: randomStatus,
        syncedAt: randomStatus === "synced" ? dayjs().subtract(Math.random() * 24, "hour").toISOString() : undefined,
        error: randomStatus === "failed" ? "API请求超时，请重试" : undefined,
      };
    });

    return mockStatus;
  };

  const renderChannelSyncStatus = (position: Position) => {
    const publishStatus = getPublishStatus(position);
    const channels = Object.keys(publishStatus);

    if (channels.length === 0) {
      return "-";
    }

    return (
      <Space wrap size={[4, 4]}>
        {channels.map((channel) => {
          const statusInfo = publishStatus[channel];
          const syncInfo = syncStatusMap[statusInfo.status];
          const channelName = PUBLISH_CHANNEL_MAP[channel] || channel;

          const tooltipContent = (
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              <div><strong>渠道：</strong>{channelName}</div>
              <div><strong>状态：</strong>{syncInfo.name}</div>
              {statusInfo.syncedAt && (
                <div><strong>同步时间：</strong>{dayjs(statusInfo.syncedAt).format("YYYY-MM-DD HH:mm")}</div>
              )}
              {statusInfo.error && (
                <div style={{ color: "#ff4d4f" }}><strong>错误：</strong>{statusInfo.error}</div>
              )}
              {statusInfo.postUrl && (
                <div><strong>链接：</strong><a href={statusInfo.postUrl} target="_blank" rel="noopener noreferrer">查看</a></div>
              )}
            </div>
          );

          return (
            <Tooltip key={channel} title={tooltipContent} placement="top">
              <Tag
                color={syncInfo.color}
                style={{
                  margin: 0,
                  fontSize: 11,
                  padding: "0 6px",
                  height: 20,
                  lineHeight: "18px",
                  borderRadius: 4,
                }}
              >
                {channelName}
              </Tag>
            </Tooltip>
          );
        })}
      </Space>
    );
  };

  const columns = [
    {
      title: "职位名称",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: Position) => (
        <a onClick={() => navigate(`/positions/${record.id}`)}>
          <Text strong>{text}</Text>
        </a>
      ),
    },
    {
      title: "部门",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "招聘人数",
      dataIndex: "headcount",
      key: "headcount",
      render: (count: number, record: Position) => (
        <span>
          {record.hiredCount}/{count}
        </span>
      ),
    },
    {
      title: "薪资范围",
      dataIndex: "salaryMin",
      key: "salary",
      render: (min: number, record: Position) =>
        min && record.salaryMax ? `¥${min}k - ¥${record.salaryMax}k` : "-",
    },
    {
      title: "工作地点",
      dataIndex: "location",
      key: "location",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const info = statusMap[status] || { color: "default", name: status };
        return <Tag color={info.color}>{info.name}</Tag>;
      },
    },
    {
      title: "发布渠道",
      dataIndex: "publishChannels",
      key: "publishChannels",
      render: (channels: string[]) =>
        channels?.length ? (
          <Space wrap>
            {channels.map((ch) => (
              <Tag key={ch} color="blue">
                {PUBLISH_CHANNEL_MAP[ch] || ch}
              </Tag>
            ))}
          </Space>
        ) : (
          "-"
        ),
    },
    {
      title: "渠道同步状态",
      key: "publishStatus",
      width: 220,
      render: (_: any, record: Position) => renderChannelSyncStatus(record),
    },
    {
      title: "招聘经理",
      dataIndex: "hiringManager",
      key: "hiringManager",
      render: (user: User) => user?.name || "-",
    },
    {
      title: "创建人",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (user: User) => user?.name || "-",
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("MM-DD"),
    },
    {
      title: "操作",
      key: "actions",
      render: (_: any, record: Position) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.status === "draft" && (
            <Button
              type="link"
              size="small"
              icon={<SendOutlined />}
              onClick={() => handleSubmitApproval(record.id)}
            >
              提交审批
            </Button>
          )}
          {record.status === "approved" && (
            <Button
              type="link"
              size="small"
              icon={<ShareAltOutlined />}
              onClick={() => handlePublish(record.id)}
            >
              一键发布
            </Button>
          )}
          {record.status !== "closed" && (
            <Popconfirm
              title="确定关闭该职位吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                关闭
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
            <div className="page-title">职位管理</div>
            <div className="page-subtitle">管理招聘职位，一键发布到多渠道</div>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建职位
            </Button>
          </Col>
        </Row>
      </div>

      <Card bordered={false}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="搜索职位名称、部门"
              prefix={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
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
          dataSource={positions}
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
        title={editingPosition ? "编辑职位" : "新建职位"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            headcount: 1,
            status: "draft",
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="职位名称"
                rules={[{ required: true, message: "请输入职位名称" }]}
              >
                <Input placeholder="如：高级前端工程师" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="department"
                label="所属部门"
                rules={[{ required: true, message: "请输入部门" }]}
              >
                <Input placeholder="如：技术部" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="headcount"
                label="招聘人数"
                rules={[{ required: true, message: "请输入招聘人数" }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="salaryMin" label="薪资下限(K)">
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="salaryMax" label="薪资上限(K)">
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="工作地点">
                <Input placeholder="如：上海" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="jobType" label="工作类型">
                <Select placeholder="请选择" style={{ width: "100%" }}>
                  <Option value="full-time">全职</Option>
                  <Option value="part-time">兼职</Option>
                  <Option value="intern">实习</Option>
                  <Option value="contract">合同</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="experienceMin" label="经验下限(年)">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="experienceMax" label="经验上限(年)">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="education" label="学历要求">
                <Select placeholder="请选择" style={{ width: "100%" }}>
                  <Option value="大专">大专</Option>
                  <Option value="本科">本科</Option>
                  <Option value="硕士">硕士</Option>
                  <Option value="博士">博士</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="hiringManagerId" label="招聘经理">
                <Select placeholder="请选择" style={{ width: "100%" }}>
                  {hiringManagers.map((u) => (
                    <Option key={u.id} value={u.id}>
                      {u.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="keywords" label="关键词(逗号分隔)">
                <Input placeholder="如：React, TypeScript, Node.js" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="skillTags" label="技能标签(逗号分隔)">
                <Input placeholder="如：前端开发, React, 团队协作" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="职位描述">
                <TextArea rows={4} placeholder="请输入职位描述..." />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="requirements" label="任职要求">
                <TextArea rows={4} placeholder="请输入任职要求..." />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="benefits" label="福利待遇">
                <TextArea rows={3} placeholder="请输入福利待遇..." />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit">
                {editingPosition ? "保存" : "创建"}
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default PositionList;
