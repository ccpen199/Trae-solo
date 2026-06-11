import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Tag,
  Typography,
  Space,
  Dropdown,
  MenuProps,
  Popconfirm,
  Upload,
} from "antd";
import {
  PlusOutlined,
  FilterOutlined,
  RobotOutlined,
  UserAddOutlined,
  MoreOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { candidateAPI, positionAPI } from "../../api";
import { ALL_STAGES, STAGE_MAP, getStageInfo, INTERVIEW_ROUND_MAP } from "../../constants";
import type { Candidate, Position } from "../../types";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const stageMap: Record<string, { name: string; color: string }> = STAGE_MAP;
const allStages = ALL_STAGES;

const CandidateKanban: React.FC = () => {
  const navigate = useNavigate();
  const [kanbanData, setKanbanData] = useState<
    Array<{ stage: string; stageName: string; candidates: Candidate[]; count: number }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [positionFilter, setPositionFilter] = useState<number | undefined>();
  const [positions, setPositions] = useState<Position[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [aiScreeningLoading, setAiScreeningLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadPositions();
  }, []);

  useEffect(() => {
    loadKanban();
  }, [positionFilter]);

  const loadPositions = async () => {
    try {
      const res = await positionAPI.getList({ status: "published", pageSize: 100 });
      setPositions(res?.data || []);
    } catch (error) {
      console.error("Failed to load positions:", error);
    }
  };

  const loadKanban = async () => {
    setLoading(true);
    try {
      const response = await candidateAPI.getKanban(positionFilter);
      const data = response?.data || [];
      const fullData = allStages.map((stage) => {
        const found = data.find((d) => d.stage === stage);
        return (
          found || {
            stage,
            stageName: stageMap[stage]?.name || stage,
            candidates: [],
            count: 0,
          }
        );
      });
      setKanbanData(fullData);
    } catch (error) {
      console.error("Failed to load kanban:", error);
      message.error("加载候选人看板失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCandidate = async (values: any) => {
    try {
      await candidateAPI.create(values);
      message.success("候选人创建成功");
      setModalVisible(false);
      form.resetFields();
      loadKanban();
    } catch (error: any) {
      message.error(error?.message || "创建失败");
    }
  };

  const handleAIScreening = async (candidateId: number) => {
    setAiScreeningLoading((prev) => ({ ...prev, [candidateId]: true }));
    try {
      await candidateAPI.aiScreening(candidateId);
      message.success("AI初筛完成");
      loadKanban();
    } catch (error: any) {
      message.error(error?.message || "AI初筛失败");
    } finally {
      setAiScreeningLoading((prev) => ({ ...prev, [candidateId]: false }));
    }
  };

  const handleBatchAIScreening = async () => {
    const screeningCandidates = kanbanData
      .find((s) => s.stage === "screening")
      ?.candidates.filter((c) => !c.aiScreeningResult);
    if (!screeningCandidates?.length) {
      message.info("没有需要初筛的候选人");
      return;
    }
    try {
      await candidateAPI.batchAIScreening(screeningCandidates.map((c) => c.id));
      message.success(`已对 ${screeningCandidates.length} 位候选人进行AI初筛`);
      loadKanban();
    } catch (error: any) {
      message.error(error?.message || "批量初筛失败");
    }
  };

  const handleStageChange = async (candidateId: number, newStage: string) => {
    try {
      await candidateAPI.updateStage(candidateId, newStage);
      message.success("状态已更新");
      loadKanban();
    } catch (error: any) {
      message.error(error?.message || "更新失败");
    }
  };

  const getActionMenu = (candidate: Candidate): MenuProps["items"] => {
    const currentIndex = allStages.indexOf(candidate.stage as any);
    const nextStages = allStages.slice(currentIndex + 1).filter((s) => s !== "rejected");
    return [
      {
        key: "view",
        label: "查看详情",
        onClick: () => navigate(`/candidates/${candidate.id}`),
      },
      { type: "divider" },
      {
        key: "screening",
        label: "AI初筛",
        disabled: !!candidate.aiScreeningResult,
        onClick: () => handleAIScreening(candidate.id),
      },
      {
        key: "schedule",
        label: "安排面试",
        onClick: () => navigate(`/interviews?candidateId=${candidate.id}`),
      },
      { type: "divider" },
      {
        key: "move",
        label: "移动到",
        children: nextStages.map((s) => ({
          key: s,
          label: stageMap[s]?.name || s,
          onClick: () => handleStageChange(candidate.id, s),
        })),
      },
      {
        key: "reject",
        label: "淘汰",
        danger: true,
        onClick: () => handleStageChange(candidate.id, "rejected"),
      },
    ];
  };

  const getScoreClass = (score: number) => {
    if (score >= 80) return "score-high";
    if (score >= 60) return "score-medium";
    return "score-low";
  };

  const getRiskClass = (risk: string) => `risk-${risk}`;

  const beforeUpload = (file: File, candidateId: number) => {
    const isPdfOrDoc =
      file.type === "application/pdf" ||
      file.type === "application/msword" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (!isPdfOrDoc) {
      message.error("只支持 PDF 或 Word 格式!");
      return Upload.LIST_IGNORE;
    }
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error("文件必须小于 10MB!");
      return Upload.LIST_IGNORE;
    }
    candidateAPI.uploadResume(candidateId, file).then(() => {
      message.success("简历上传成功");
      loadKanban();
    });
    return false;
  };

  return (
    <div>
      <div className="page-header">
        <Row justify="space-between" align="middle">
          <Col>
            <div className="page-title">候选人看板</div>
            <div className="page-subtitle">追踪候选人在各阶段的状态，AI智能筛选</div>
          </Col>
          <Col>
            <Space>
              <Select
                placeholder="按职位筛选"
                allowClear
                style={{ width: 200 }}
                value={positionFilter}
                onChange={setPositionFilter}
                showSearch
                optionFilterProp="children"
              >
                {positions.map((p) => (
                  <Option key={p.id} value={p.id}>
                    {p.title}
                  </Option>
                ))}
              </Select>
              <Button icon={<RobotOutlined />} onClick={handleBatchAIScreening}>
                批量AI初筛
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                添加候选人
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Row gutter={[12, 12]} style={{ overflowX: "auto", paddingBottom: 16 }}>
        {kanbanData.map((column) => (
          <Col xs={24} sm={12} md={8} lg={6} xl={4.8} key={column.stage}>
            <div
              className="kanban-column"
              style={{
                borderTop: `3px solid ${stageMap[column.stage]?.color || "#d9d9d9"}`,
              }}
            >
              <div className="kanban-column-header">
                <span>{column.stageName}</span>
                <span className="kanban-column-count">{column.count}</span>
              </div>
              {column.candidates.length === 0 ? (
                <div className="empty-state" style={{ padding: "24px 0" }}>
                  暂无候选人
                </div>
              ) : (
                column.candidates.map((candidate) => (
                  <div key={candidate.id} className="kanban-card">
                    <div
                      className="kanban-card-name"
                      onClick={() => navigate(`/candidates/${candidate.id}`)}
                    >
                      {candidate.name}
                      <div style={{ float: "right" }}>
                        <Dropdown
                          menu={{ items: getActionMenu(candidate) }}
                          trigger={["click"]}
                          placement="bottomRight"
                        >
                          <Button
                            type="text"
                            icon={<MoreOutlined />}
                            size="small"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Dropdown>
                      </div>
                    </div>
                    <div className="kanban-card-position">
                      {candidate.position?.title || "-"}
                    </div>
                    {candidate.aiScreeningResult && (
                      <div style={{ marginTop: 8, marginBottom: 4 }}>
                        <Space size="small">
                          <span className={getScoreClass(candidate.aiScreeningResult.overallScore)}>
                            AI评分: {candidate.aiScreeningResult.overallScore}分
                          </span>
                          <span className={getRiskClass(candidate.aiScreeningResult.riskLevel)}>
                            {candidate.aiScreeningResult.riskLevel === "low"
                              ? "低风险"
                              : candidate.aiScreeningResult.riskLevel === "medium"
                              ? "中风险"
                              : "高风险"}
                          </span>
                        </Space>
                      </div>
                    )}
                    {candidate.yearsOfExperience && (
                      <div className="kanban-card-meta">
                        <span>{candidate.yearsOfExperience}年经验</span>
                        <span>{dayjs(candidate.createdAt).format("MM-DD")}</span>
                      </div>
                    )}
                    {!candidate.aiScreeningResult && candidate.stage === "screening" && (
                      <Button
                        type="link"
                        size="small"
                        icon={<RobotOutlined />}
                        loading={aiScreeningLoading[candidate.id]}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAIScreening(candidate.id);
                        }}
                        style={{ padding: 0, marginTop: 4 }}
                      >
                        开始AI初筛
                      </Button>
                    )}
                    {candidate.stage === "resume_received" && !candidate.resumes?.length && (
                      <Upload
                        showUploadList={false}
                        beforeUpload={(file) => beforeUpload(file, candidate.id)}
                      >
                        <Button
                          type="link"
                          size="small"
                          icon={<UploadOutlined />}
                          style={{ padding: 0, marginTop: 4 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          上传简历
                        </Button>
                      </Upload>
                    )}
                  </div>
                ))
              )}
            </div>
          </Col>
        ))}
      </Row>

      <Modal
        title="添加候选人"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateCandidate}
          initialValues={{
            stage: "resume_received",
            source: "manual",
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: "请输入姓名" }]}
              >
                <Input placeholder="候选人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[{ required: true, message: "请输入手机号" }]}
              >
                <Input placeholder="11位手机号" maxLength={11} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="邮箱地址" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="positionId"
                label="应聘职位"
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
            <Col span={8}>
              <Form.Item name="yearsOfExperience" label="工作年限">
                <InputNumber min={0} style={{ width: "100%" }} placeholder="年" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="education" label="最高学历">
                <Select placeholder="请选择" style={{ width: "100%" }}>
                  <Option value="大专">大专</Option>
                  <Option value="本科">本科</Option>
                  <Option value="硕士">硕士</Option>
                  <Option value="博士">博士</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="expectedSalaryMin" label="期望薪资(K)">
                <InputNumber min={0} style={{ width: "100%" }} placeholder="最低" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currentCompany" label="当前公司">
                <Input placeholder="现任公司" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currentPosition" label="当前职位">
                <Input placeholder="现任职位" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="skillTags" label="技能标签(逗号分隔)">
                <Input placeholder="如：React, TypeScript, 项目管理" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="notes" label="备注">
                <TextArea rows={3} placeholder="备注信息..." />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end" gutter={8}>
            <Col>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default CandidateKanban;
