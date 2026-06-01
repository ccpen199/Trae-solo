import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Tag, Space, Button, Modal, Form, Input, message, Row, Col, Statistic } from 'antd';
import { WarningOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { slaApi } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;

const METRIC_TYPES = {
  response: { name: '岗位响应', targetHours: 24, color: 'blue' },
  first_recommend: { name: '首批推荐', targetHours: 72, color: 'orange' },
  interview_arrange: { name: '面试安排', targetHours: 48, color: 'purple' },
  offer_follow: { name: 'Offer跟进', targetHours: 24, color: 'green' }
};

const SlaWarnings = () => {
  const [warnings, setWarnings] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [delayModalVisible, setDelayModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [warningsRes, recordsRes] = await Promise.all([
        slaApi.getWarnings(),
        slaApi.getRecords()
      ]);
      setWarnings(warningsRes.data);
      setRecords(recordsRes.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelayReason = (record) => {
    setSelectedRecord(record);
    form.setFieldsValue({ delay_reason: record.delay_reason });
    setDelayModalVisible(true);
  };

  const handleDelaySubmit = async () => {
    try {
      const values = await form.validateFields();
      await slaApi.updateDelayReason(selectedRecord.id, values.delay_reason);
      message.success('延期原因更新成功');
      setDelayModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getWarningLevel = (remainingHours, targetHours) => {
    if (remainingHours <= 0) return { level: 'critical', color: 'red', text: '严重超时' };
    if (remainingHours <= targetHours * 0.25) return { level: 'warning', color: 'orange', text: '即将超时' };
    return { level: 'normal', color: 'green', text: '正常' };
  };

  const warningColumns = [
    {
      title: 'SLA指标',
      dataIndex: 'metric_type',
      key: 'metric_type',
      render: (type) => {
        const metric = METRIC_TYPES[type] || { name: type, color: 'default' };
        return <Tag color={metric.color}>{metric.name}</Tag>;
      }
    },
    {
      title: '候选人',
      dataIndex: 'candidate_name',
      key: 'candidate_name'
    },
    {
      title: '岗位',
      dataIndex: 'position_title',
      key: 'position_title'
    },
    {
      title: '项目',
      dataIndex: 'project_name',
      key: 'project_name'
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '目标时长',
      dataIndex: 'target_hours',
      key: 'target_hours',
      render: (hours) => `${hours}小时`
    },
    {
      title: '已用时',
      dataIndex: 'elapsed_hours',
      key: 'elapsed_hours',
      render: (hours) => `${hours}小时`
    },
    {
      title: '剩余时间',
      dataIndex: 'remaining_hours',
      key: 'remaining_hours',
      render: (hours, record) => {
        const warning = getWarningLevel(hours, record.target_hours);
        return (
          <Tag color={warning.color}>
            {hours > 0 ? `${hours}小时` : `已超${Math.abs(hours)}小时`}
          </Tag>
        );
      }
    },
    {
      title: '预警级别',
      dataIndex: 'warning_level',
      key: 'warning_level',
      render: (level) => {
        const levelConfig = {
          critical: { color: 'red', text: '严重超时', icon: <ExclamationCircleOutlined /> },
          warning: { color: 'orange', text: '即将超时', icon: <WarningOutlined /> },
          normal: { color: 'green', text: '正常', icon: <CheckCircleOutlined /> }
        };
        const config = levelConfig[level] || levelConfig.normal;
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => handleDelayReason(record)}>
          记录延期原因
        </Button>
      )
    }
  ];

  const recordColumns = [
    {
      title: 'SLA指标',
      dataIndex: 'metric_type',
      key: 'metric_type',
      render: (type) => {
        const metric = METRIC_TYPES[type] || { name: type, color: 'default' };
        return <Tag color={metric.color}>{metric.name}</Tag>;
      }
    },
    {
      title: '候选人',
      dataIndex: 'candidate_name',
      key: 'candidate_name'
    },
    {
      title: '岗位',
      dataIndex: 'position_title',
      key: 'position_title'
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '完成时间',
      dataIndex: 'end_time',
      key: 'end_time',
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '目标时长',
      dataIndex: 'target_hours',
      key: 'target_hours',
      render: (hours) => `${hours}小时`
    },
    {
      title: '实际用时',
      dataIndex: 'actual_hours',
      key: 'actual_hours',
      render: (hours) => hours ? `${hours}小时` : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          met: { color: 'green', text: '按时完成' },
          overdue: { color: 'red', text: '超时完成' },
          pending: { color: 'orange', text: '进行中' }
        };
        const config = statusConfig[status] || statusConfig.pending;
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '延期原因',
      dataIndex: 'delay_reason',
      key: 'delay_reason',
      render: (reason) => reason || '-'
    }
  ];

  const stats = {
    total: warnings.length,
    critical: warnings.filter(w => w.warning_level === 'critical').length,
    warning: warnings.filter(w => w.warning_level === 'warning').length,
    normal: warnings.filter(w => w.warning_level === 'normal').length
  };

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>SLA 预警中心</Title>
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card className="card-shadow">
              <Statistic
                title="全部预警"
                value={stats.total}
                prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="card-shadow">
              <Statistic
                title="严重超时"
                value={stats.critical}
                prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="card-shadow">
              <Statistic
                title="即将超时"
                value={stats.warning}
                prefix={<WarningOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="card-shadow">
              <Statistic
                title="正常进行"
                value={stats.normal}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="当前预警" className="card-shadow" style={{ marginBottom: 24 }}>
          <Table
            dataSource={warnings}
            columns={warningColumns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        <Card title="SLA历史记录" className="card-shadow">
          <Table
            dataSource={records}
            columns={recordColumns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>

      <Modal
        title="记录延期原因"
        open={delayModalVisible}
        onOk={handleDelaySubmit}
        onCancel={() => setDelayModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="delay_reason" label="延期原因" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="请详细说明延期原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SlaWarnings;
