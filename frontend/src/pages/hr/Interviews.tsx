import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, DatePicker, message, Space, Progress, Descriptions, Rate, Alert, Checkbox } from 'antd';
import { PlusOutlined, VideoCameraOutlined, RobotOutlined, CheckCircleOutlined, CloseCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from '../../utils/axios';

const { Option } = Select;
const { TextArea } = Input;

export default function HRInterviews() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [aiReportModalVisible, setAiReportModalVisible] = useState(false);
  const [currentInterview, setCurrentInterview] = useState<any>(null);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [aiScreeningLoading, setAiScreeningLoading] = useState<number | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();
  const [feedbackForm] = Form.useForm();

  useEffect(() => {
    loadInterviews();
    loadApplications();
  }, []);

  const loadInterviews = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/hr/interviews');
      setInterviews(data || []);
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const { data } = await axios.get('/hr/applications');
      setApplications((data || []).filter((a: any) => a.status === 'interview' || a.status === 'pending'));
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const app = applications.find((a: any) => a.id === values.application_id);
      await axios.post('/hr/interview', {
        ...values,
        scheduled_at: values.scheduled_at.format('YYYY-MM-DD HH:mm:ss'),
        job_id: app?.job_id,
        jobseeker_id: app?.jobseeker_id
      });
      message.success('创建成功');
      setModalVisible(false);
      loadInterviews();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleFeedback = (record: any) => {
    setCurrentInterview(record);
    feedbackForm.setFieldsValue({
      feedback: record.feedback,
      rating: record.rating,
      status: record.status
    });
    setFeedbackModalVisible(true);
  };

  const handleSaveFeedback = async (values: any) => {
    try {
      await axios.put(`/hr/interview/${currentInterview.id}/feedback`, values);
      message.success('保存成功');
      setFeedbackModalVisible(false);
      loadInterviews();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleAiScreening = async (record: any) => {
    setAiScreeningLoading(record.id);
    try {
      const { data } = await axios.post(`/hr/interview/${record.id}/ai-screening`);
      const report = data;
      setCurrentReport(report);
      setAiReportModalVisible(true);
      loadInterviews();
    } catch (error) {
      message.error('AI初筛失败');
    } finally {
      setAiScreeningLoading(null);
    }
  };

  const handleViewAiReport = (record: any) => {
    try {
      const report = typeof record.ai_screening_report === 'string'
        ? JSON.parse(record.ai_screening_report)
        : record.ai_screening_report;
      setCurrentReport(report);
      setAiReportModalVisible(true);
    } catch {
      message.error('报告数据解析失败');
    }
  };

  const handleBatchAiScreening = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择需要生成初筛报告的面试');
      return;
    }
    setBatchLoading(true);
    try {
      const selectedIds = selectedRowKeys as number[];
      await Promise.all(
        selectedIds.map(id =>
          axios.post(`/hr/interview/${id}/ai-screening`).catch(() => null)
        )
      );
      message.success(`已为 ${selectedRowKeys.length} 个面试生成初筛报告`);
      setSelectedRowKeys([]);
      loadInterviews();
    } catch (error) {
      message.error('批量生成失败');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleRescheduleAccept = async (id: number) => {
    try {
      await axios.post(`/hr/interview/${id}/reschedule/accept`);
      message.success('已接受改期请求');
      loadInterviews();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleRescheduleReject = async (id: number) => {
    try {
      await axios.post(`/hr/interview/${id}/reschedule/reject`);
      message.success('已拒绝改期请求');
      loadInterviews();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const pendingAiScreeningCount = interviews.filter(
    (i: any) => !i.ai_screening_report && (i.status === 'scheduled' || i.status === 'confirmed')
  ).length;

  const statusColors: Record<string, string> = {
    scheduled: 'default',
    confirmed: 'processing',
    completed: 'success',
    cancelled: 'error',
    no_show: 'warning',
    reschedule_requested: 'orange'
  };

  const statusLabels: Record<string, string> = {
    scheduled: '待确认',
    confirmed: '已确认',
    completed: '已完成',
    cancelled: '已取消',
    no_show: '未出席',
    reschedule_requested: '已申请改期'
  };

  const typeLabels: Record<string, string> = {
    onsite: '现场面试',
    video: '视频面试',
    phone: '电话面试'
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getAiScreeningStatus = (record: any) => {
    if (record.ai_screening_report) {
      const report = typeof record.ai_screening_report === 'string'
        ? JSON.parse(record.ai_screening_report)
        : record.ai_screening_report;
      return {
        status: 'done',
        score: report.overall_score,
        label: '已完成'
      };
    }
    if (record.status === 'scheduled' || record.status === 'confirmed') {
      return {
        status: 'pending',
        score: null,
        label: '待初筛'
      };
    }
    return {
      status: 'none',
      score: null,
      label: '-'
    };
  };

  const columns = [
    {
      title: '职位',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '求职者',
      dataIndex: 'jobseeker_name',
      key: 'jobseeker_name'
    },
    {
      title: '面试时间',
      dataIndex: 'scheduled_at',
      key: 'scheduled_at',
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '申请改期至',
      dataIndex: 'proposed_time',
      key: 'proposed_time',
      render: (val: string, record: any) => val ? (
        <Space direction="vertical" size={4}>
          <Tag color="orange">{dayjs(val).format('YYYY-MM-DD HH:mm')}</Tag>
          <Space size={4}>
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              style={{ color: '#52c41a', padding: 0 }}
              onClick={() => handleRescheduleAccept(record.id)}
            >
              接受
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              style={{ padding: 0 }}
              onClick={() => handleRescheduleReject(record.id)}
            >
              拒绝
            </Button>
          </Space>
        </Space>
      ) : '-'
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      render: (min: number) => `${min}分钟`
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => typeLabels[type]
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      )
    },
    {
      title: 'AI初筛状态',
      key: 'ai_status',
      render: (_: any, record: any) => {
        const aiStatus = getAiScreeningStatus(record);
        if (aiStatus.status === 'done') {
          return (
            <Space direction="vertical" size={0}>
              <Tag color="success" icon={<RobotOutlined />}>
                {aiStatus.label}
              </Tag>
              <Progress
                percent={aiStatus.score || 0}
                size="small"
                strokeColor={getScoreColor(aiStatus.score || 0)}
                showInfo={false}
                style={{ width: 80 }}
              />
            </Space>
          );
        }
        if (aiStatus.status === 'pending') {
          return (
            <Tag color="warning" icon={<ThunderboltOutlined />}>
              {aiStatus.label}
            </Tag>
          );
        }
        return <span style={{ color: '#999' }}>-</span>;
      }
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => rating ? <Rate disabled value={rating} style={{ fontSize: 14 }} /> : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      render: (_: any, record: any) => (
        <Space wrap size={4}>
          {record.type === 'video' && record.status === 'confirmed' && (
            <Button
              size="small"
              icon={<VideoCameraOutlined />}
              href={record.video_url}
              target="_blank"
            >
              视频链接
            </Button>
          )}
          <Button
            size="small"
            icon={<RobotOutlined />}
            loading={aiScreeningLoading === record.id}
            onClick={() => record.ai_screening_report ? handleViewAiReport(record) : handleAiScreening(record)}
            type={record.ai_screening_report ? 'default' : 'primary'}
          >
            {record.ai_screening_report ? '查看初筛' : 'AI初筛'}
          </Button>
          <Button
            size="small"
            onClick={() => handleFeedback(record)}
          >
            填写反馈
          </Button>
        </Space>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record: any) => ({
      disabled: !!record.ai_screening_report,
      name: record.id
    })
  };

  return (
    <div>
      {pendingAiScreeningCount > 0 && (
        <Alert
          message={<span><RobotOutlined style={{ marginRight: 8 }} />您有 {pendingAiScreeningCount} 个面试等待AI初筛</span>}
          description="建议尽快完成AI初筛，提高面试效率"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" type="primary" onClick={() => setSelectedRowKeys(
              interviews
                .filter((i: any) => !i.ai_screening_report && (i.status === 'scheduled' || i.status === 'confirmed'))
                .map((i: any) => i.id)
            )}>
              一键选择全部
            </Button>
          }
        />
      )}

      <Card
        title="面试管理"
        extra={
          <Space>
            {selectedRowKeys.length > 0 && (
              <Button
                icon={<ThunderboltOutlined />}
                loading={batchLoading}
                onClick={handleBatchAiScreening}
                type="primary"
              >
                批量生成初筛报告 ({selectedRowKeys.length})
              </Button>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              安排面试
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={interviews}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowSelection={rowSelection}
        />

        <Modal
          title="安排面试"
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="application_id" label="选择简历" rules={[{ required: true }]}>
              <Select placeholder="请选择">
                {applications.map((app: any) => (
                  <Option key={app.id} value={app.id}>
                    {app.jobseeker_name} - {app.title}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="scheduled_at" label="面试时间" rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="duration" label="时长(分钟)" initialValue={60}>
              <Select>
                <Option value={30}>30分钟</Option>
                <Option value={60}>60分钟</Option>
                <Option value={90}>90分钟</Option>
                <Option value={120}>120分钟</Option>
              </Select>
            </Form.Item>

            <Form.Item name="type" label="面试类型" initialValue="onsite">
              <Select>
                <Option value="onsite">现场面试</Option>
                <Option value="video">视频面试</Option>
                <Option value="phone">电话面试</Option>
              </Select>
            </Form.Item>

            <Form.Item name="video_url" label="视频链接(视频面试时填写)">
              <Input placeholder="请输入视频会议链接" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">创建</Button>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="面试反馈"
          open={feedbackModalVisible}
          onCancel={() => setFeedbackModalVisible(false)}
          footer={null}
        >
          <Form form={feedbackForm} layout="vertical" onFinish={handleSaveFeedback}>
            <Form.Item name="status" label="面试结果">
              <Select>
                <Option value="completed">通过</Option>
                <Option value="cancelled">未通过</Option>
                <Option value="no_show">缺席</Option>
              </Select>
            </Form.Item>

            <Form.Item name="rating" label="综合评分">
              <Rate />
            </Form.Item>

            <Form.Item name="feedback" label="面试评价">
              <TextArea rows={4} placeholder="请输入面试评价..." />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">保存</Button>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={<span><RobotOutlined style={{ marginRight: 8 }} />AI初筛报告</span>}
          open={aiReportModalVisible}
          onCancel={() => setAiReportModalVisible(false)}
          footer={null}
          width={600}
        >
          {currentReport && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Progress
                  type="circle"
                  percent={currentReport.overall_score}
                  format={(percent) => `${percent}分`}
                  strokeColor={getScoreColor(currentReport.overall_score)}
                  size={120}
                />
                <div style={{ marginTop: 8, fontSize: 16, fontWeight: 'bold' }}>综合评分</div>
              </div>
              <Descriptions column={3} bordered size="small">
                <Descriptions.Item label="技能匹配度">
                  <span style={{ color: getScoreColor(currentReport.skill_match_score), fontWeight: 'bold' }}>
                    {currentReport.skill_match_score}分
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="经验评分">
                  <span style={{ color: getScoreColor(currentReport.experience_score), fontWeight: 'bold' }}>
                    {currentReport.experience_score}分
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="学历匹配">
                  <span style={{ color: getScoreColor(currentReport.education_match), fontWeight: 'bold' }}>
                    {currentReport.education_match}分
                  </span>
                </Descriptions.Item>
              </Descriptions>
              <div style={{ marginTop: 16 }}>
                <strong>总结：</strong>
                <p style={{ marginTop: 4, color: '#666' }}>{currentReport.summary}</p>
              </div>
              <div style={{ marginTop: 12 }}>
                <strong>建议：</strong>
                <ul style={{ marginTop: 4, paddingLeft: 20, color: '#666' }}>
                  {currentReport.recommendations?.map((r: string, i: number) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Modal>
      </Card>
    </div>
  );
}
