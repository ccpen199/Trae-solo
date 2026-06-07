import { useState } from 'react';
import {
  Card, Form, Input, Button, Select, Typography, message, Steps, Space,
  Tag, Modal, Descriptions, Rate, Alert, Row, Col,
} from 'antd';
import {
  RobotOutlined,
  MessageOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  ScheduleOutlined,
  WarningOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { consultationAPI, lawyerAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const LEVEL_STEPS = [
  { key: 1, title: 'AI问答', icon: <RobotOutlined /> },
  { key: 2, title: '图文咨询', icon: <MessageOutlined /> },
  { key: 3, title: '语音连线', icon: <PhoneOutlined /> },
  { key: 4, title: '视频面谈', icon: <VideoCameraOutlined /> },
  { key: 5, title: '线下委托', icon: <ScheduleOutlined /> },
];

const categories = [
  '合同纠纷', '劳动争议', '婚姻家庭', '房产纠纷',
  '交通事故', '债权债务', '知识产权', '刑事辩护', '其他',
];

function Consultation({ user, role: _role }) {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [lawyers, setLawyers] = useState([]);
  const [escalateModalVisible, setEscalateModalVisible] = useState(false);
  const [selectedLawyerId, setSelectedLawyerId] = useState(null);
  const [targetLevel, setTargetLevel] = useState(null);
  const [escalateLoading, setEscalateLoading] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [npsScore, setNpsScore] = useState(0);
  const [npsComment, setNpsComment] = useState('');
  const [npsLoading, setNpsLoading] = useState(false);
  const [npsSubmitted, setNpsSubmitted] = useState(false);

  const loadLawyers = async () => {
    try {
      const res = await lawyerAPI.getLawyers({ limit: 20 });
      if (res.data.success) {
        setLawyers(res.data.lawyers);
      }
    } catch {
      console.error('加载律师列表失败');
    }
  };

  const loadTicket = async (id) => {
    try {
      const res = await consultationAPI.detail(id);
      if (res.data.success) {
        setTicket(res.data.consultation || res.data);
      }
    } catch (err) {
      message.error('刷新工单失败');
    }
  };

  const loadAudit = async (id) => {
    try {
      const res = await consultationAPI.getAudit(id);
      if (res.data.success) {
        setAuditData(res.data.audit || res.data);
      }
    } catch {
      console.error('获取质检数据失败');
    }
  };

  const handleSubmit = async (values) => {
    if (!user) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    setSubmitLoading(true);
    try {
      const res = await consultationAPI.create(values);
      if (res.data.success) {
        const data = res.data.consultation || res.data;
        setTicket(data);
        message.success('咨询提交成功');
        if (data.id) {
          loadAudit(data.id);
        }
      }
    } catch (err) {
      message.error(err.response?.data?.error || '提交失败');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openEscalateModal = (level) => {
    setTargetLevel(level);
    setSelectedLawyerId(null);
    loadLawyers();
    setEscalateModalVisible(true);
  };

  const handleEscalate = async () => {
    if (!ticket?.id) return;
    if (targetLevel >= 2 && !selectedLawyerId) {
      message.warning('请选择律师');
      return;
    }
    setEscalateLoading(true);
    try {
      await consultationAPI.escalate(ticket.id, {
        target_level: targetLevel,
        lawyer_id: selectedLawyerId,
      });
      message.success('咨询已升级');
      setEscalateModalVisible(false);
      loadTicket(ticket.id);
      loadAudit(ticket.id);
    } catch (err) {
      message.error('升级失败');
    } finally {
      setEscalateLoading(false);
    }
  };

  const handleNPS = async () => {
    if (!ticket?.id) return;
    if (npsScore === 0) {
      message.warning('请先评分');
      return;
    }
    setNpsLoading(true);
    try {
      await consultationAPI.submitNPS(ticket.id, {
        score: npsScore,
        comment: npsComment,
      });
      message.success('NPS评分已提交');
      setNpsSubmitted(true);
    } catch (err) {
      message.error('提交NPS失败');
    } finally {
      setNpsLoading(false);
    }
  };

  const currentLevel = ticket?.level || ticket?.current_level || 1;

  return (
    <div style={{ maxWidth: 900, margin: '40px auto' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>智能法律咨询</Title>

      {!ticket ? (
        <Card>
          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item name="title" label="咨询标题" rules={[{ required: true, message: '请输入咨询标题' }]}>
              <Input placeholder="简要描述您的法律问题" size="large" />
            </Form.Item>
            <Form.Item name="category" label="问题分类" rules={[{ required: true, message: '请选择问题分类' }]}>
              <Select placeholder="选择问题分类" size="large">
                {categories.map((cat) => (
                  <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="description" label="问题描述" rules={[{ required: true, message: '请详细描述您的问题' }]}>
              <TextArea
                rows={6}
                placeholder="请详细描述您遇到的法律问题，包括时间、地点、人物、事件经过等信息。"
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" block loading={submitLoading}>
                提交咨询，获取AI解答
              </Button>
            </Form.Item>
            <Alert
              message="服务说明"
              description="我们提供5级分级法律服务：AI问答→图文咨询→语音连线→视频面谈→线下委托，根据问题复杂度逐级升级。"
              type="info"
              showIcon
            />
          </Form>
        </Card>
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card>
            <Descriptions title="咨询工单" bordered column={2}>
              <Descriptions.Item label="咨询标题">{ticket.title}</Descriptions.Item>
              <Descriptions.Item label="分类">
                <Tag color="blue">{ticket.category}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="工单状态">
                <Tag color={currentLevel >= 5 ? 'red' : currentLevel >= 3 ? 'orange' : 'green'}>
                  {LEVEL_STEPS[currentLevel - 1]?.title || '未知'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="AI回复">
                <Paragraph style={{ marginBottom: 0 }}>{ticket.ai_response || '等待AI回复...'}</Paragraph>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="咨询流转状态">
            <Steps current={currentLevel - 1} items={LEVEL_STEPS.map((step) => ({
              title: step.title,
              icon: step.icon,
            }))} />
            <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {LEVEL_STEPS.map((step) => {
                if (step.key <= currentLevel) return null;
                return (
                  <Button
                    key={step.key}
                    type="default"
                    onClick={() => openEscalateModal(step.key)}
                  >
                    升级至：{step.title}
                  </Button>
                );
              })}
            </div>
          </Card>

          <Row gutter={16}>
            <Col span={12}>
              <Card
                title={<span><WarningOutlined style={{ marginRight: 8, color: '#fa8c16' }} />敏感词拦截</span>}
                size="small"
              >
                {auditData ? (
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="风险等级">
                      <Tag color={auditData.risk_level === 'high' ? 'red' : auditData.risk_level === 'medium' ? 'orange' : 'green'}>
                        {auditData.risk_level === 'high' ? '高' : auditData.risk_level === 'medium' ? '中' : '低'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="敏感词">
                      {auditData.flagged_words?.length > 0
                        ? auditData.flagged_words.map((w, i) => <Tag key={i} color="red">{w}</Tag>)
                        : <Text type="secondary">无</Text>}
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Text type="secondary">暂无数据</Text>
                )}
              </Card>
            </Col>
            <Col span={12}>
              <Card
                title={<span><AuditOutlined style={{ marginRight: 8, color: '#1890ff' }} />质检记录</span>}
                size="small"
              >
                {auditData ? (
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="质检状态">
                      <Tag color={auditData.risk_level === 'high' ? 'red' : 'green'}>
                        {auditData.risk_level === 'high' ? '异常' : '正常'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="标记词数">{auditData.flagged_words?.length ?? 0}</Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Text type="secondary">暂无数据</Text>
                )}
              </Card>
            </Col>
          </Row>

          <Card title="NPS评分">
            {npsSubmitted ? (
              <Alert message="感谢您的评分！" type="success" showIcon />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text>请为本次咨询服务评分：</Text>
                  <Rate value={npsScore} onChange={setNpsScore} style={{ marginLeft: 12 }} />
                </div>
                <TextArea
                  rows={3}
                  placeholder="请输入您的评价（选填）"
                  value={npsComment}
                  onChange={(e) => setNpsComment(e.target.value)}
                />
                <Button type="primary" loading={npsLoading} onClick={handleNPS}>
                  提交评分
                </Button>
              </Space>
            )}
          </Card>
        </Space>
      )}

      <Modal
        title="升级咨询级别"
        open={escalateModalVisible}
        onCancel={() => setEscalateModalVisible(false)}
        onOk={handleEscalate}
        confirmLoading={escalateLoading}
        okText="确认升级"
        cancelText="取消"
      >
        <Paragraph>
          您将升级至「{LEVEL_STEPS.find((s) => s.key === targetLevel)?.title}」级别，请选择律师：
        </Paragraph>
        <Select
          placeholder="选择律师"
          style={{ width: '100%' }}
          value={selectedLawyerId}
          onChange={setSelectedLawyerId}
          size="large"
        >
          {lawyers.map((l) => (
            <Select.Option key={l.id} value={l.id}>
              {l.name} - {l.practice_area} · {l.years_experience}年经验
            </Select.Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
}

export default Consultation;
