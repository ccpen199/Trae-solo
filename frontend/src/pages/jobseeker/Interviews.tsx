import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, message, Modal, Progress, Descriptions, DatePicker, Space } from 'antd';
import { VideoCameraOutlined, CheckCircleOutlined, RobotOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from '../../utils/axios';

export default function JobseekerInterviews() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [proposedTime, setProposedTime] = useState<dayjs.Dayjs | null>(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/jobseeker/interviews');
      setInterviews(data || []);
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = (id: number) => {
    Modal.confirm({
      title: '确认参加面试',
      content: '确定要参加这次面试吗？',
      onOk: async () => {
        try {
          await axios.post(`/jobseeker/interview/${id}/confirm`);
          message.success('已确认参加');
          loadInterviews();
        } catch (error) {
          message.error('操作失败');
        }
      }
    });
  };

  const handleViewReport = (record: any) => {
    try {
      const report = typeof record.ai_screening_report === 'string'
        ? JSON.parse(record.ai_screening_report)
        : record.ai_screening_report;
      setCurrentReport(report);
      setReportModalVisible(true);
    } catch {
      message.error('报告数据解析失败');
    }
  };

  const handleReschedule = (id: number) => {
    setRescheduleId(id);
    setProposedTime(null);
    setRescheduleModalVisible(true);
  };

  const submitReschedule = async () => {
    if (!proposedTime) {
      message.warning('请选择期望的面试时间');
      return;
    }
    setRescheduleLoading(true);
    try {
      await axios.post(`/jobseeker/interview/${rescheduleId}/reschedule`, {
        proposed_time: proposedTime.format('YYYY-MM-DD HH:mm:ss')
      });
      message.success('改期申请已提交');
      setRescheduleModalVisible(false);
      loadInterviews();
    } catch (error) {
      message.error('申请失败');
    } finally {
      setRescheduleLoading(false);
    }
  };

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

  const columns = [
    {
      title: '职位',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '公司',
      dataIndex: 'company_name',
      key: 'company_name'
    },
    {
      title: 'HR',
      dataIndex: 'hr_name',
      key: 'hr_name'
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
      render: (val: string) => val ? (
        <Tag color="orange">{dayjs(val).format('YYYY-MM-DD HH:mm')}</Tag>
      ) : '-'
    },
    {
      title: '面试类型',
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
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space wrap>
          {record.status === 'scheduled' && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleConfirm(record.id)}
            >
              确认参加
            </Button>
          )}
          {(record.status === 'scheduled' || record.status === 'confirmed') && (
            <Button
              size="small"
              icon={<CalendarOutlined />}
              onClick={() => handleReschedule(record.id)}
            >
              申请改期
            </Button>
          )}
          {record.ai_screening_report && (
            <Button
              size="small"
              icon={<RobotOutlined />}
              onClick={() => handleViewReport(record)}
            >
              AI初筛报告
            </Button>
          )}
          {record.type === 'video' && record.status === 'confirmed' && (
            <Button
              type="primary"
              size="small"
              icon={<VideoCameraOutlined />}
              href={record.video_url}
              target="_blank"
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              进入视频面试
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <Card title="面试安排">
      <Table
        columns={columns}
        dataSource={interviews}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={<span><RobotOutlined style={{ marginRight: 8 }} />AI初筛报告</span>}
        open={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
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

      <Modal
        title="申请改期"
        open={rescheduleModalVisible}
        onCancel={() => setRescheduleModalVisible(false)}
        onOk={submitReschedule}
        confirmLoading={rescheduleLoading}
        okButtonProps={{ disabled: !proposedTime }}
      >
        <p>请选择您期望的新面试时间：</p>
        <DatePicker
          showTime
          style={{ width: '100%' }}
          format="YYYY-MM-DD HH:mm"
          value={proposedTime}
          onChange={(val) => setProposedTime(val)}
          disabledDate={(current) => current && current < dayjs().startOf('day')}
        />
      </Modal>
    </Card>
  );
}
