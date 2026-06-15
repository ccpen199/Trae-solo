import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Select,
  Modal,
  Form,
  Input,
  message,
  Card,
  Statistic,
  Row,
  Col,
  Typography,
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/auth';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface SupervisionRecord {
  id: string;
  contract_id: string;
  camera_id: string;
  detection_time: string;
  risk_type: string;
  risk_level: 'low' | 'medium' | 'high';
  description: string;
  screenshot_url?: string;
  status: 'detected' | 'processing' | 'resolved';
  handled_by?: string;
  handled_at?: string;
  created_at: string;
  contract_no: string;
  owner_name: string;
  store_name: string;
  handler_name?: string;
}

interface Stats {
  total: number;
  detected: number;
  processing: number;
  resolved: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
}

const riskLevelColors: Record<string, string> = {
  high: 'red',
  medium: 'orange',
  low: 'green',
};

const riskLevelTexts: Record<string, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险',
};

const statusColors: Record<string, string> = {
  detected: 'red',
  processing: 'orange',
  resolved: 'green',
};

const statusTexts: Record<string, string> = {
  detected: '待处理',
  processing: '处理中',
  resolved: '已解决',
};

const SupervisionList: React.FC = () => {
  const [records, setRecords] = useState<SupervisionRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>();
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>();
  const [handleModalVisible, setHandleModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<SupervisionRecord | null>(null);
  const [form] = Form.useForm();
  const user = useAuthStore((state) => state.user);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (riskLevelFilter) params.risk_level = riskLevelFilter;

      const [recordsRes, statsRes] = await Promise.all([
        apiClient.get('/supervision', { params }),
        apiClient.get('/supervision/stats'),
      ]);

      setRecords(recordsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [statusFilter, riskLevelFilter]);

  const handleGenerate = async () => {
    if (records.length === 0) {
      message.warning('暂无可用合同，请先创建合同');
      return;
    }

    const randomContract = records[Math.floor(Math.random() * records.length)].contract_id;
    setLoading(true);
    try {
      await apiClient.get(`/supervision/generate/${randomContract}`);
      message.success('AI检测记录生成成功');
      fetchRecords();
    } catch (error) {
      message.error('生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (record: SupervisionRecord) => {
    setCurrentRecord(record);
    setHandleModalVisible(true);
    form.resetFields();
  };

  const handleSubmit = async (values: { action: string; remark: string }) => {
    if (!currentRecord) return;

    try {
      await apiClient.post(`/supervision/${currentRecord.id}/handle`, values);
      message.success('处理成功');
      setHandleModalVisible(false);
      fetchRecords();
    } catch (error) {
      message.error('处理失败');
    }
  };

  const canHandle = user?.role === 'supervisor' || user?.role === 'store_manager';

  const columns: ColumnsType<SupervisionRecord> = [
    {
      title: '检测时间',
      dataIndex: 'detection_time',
      key: 'detection_time',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => dayjs(a.detection_time).valueOf() - dayjs(b.detection_time).valueOf(),
    },
    {
      title: '项目名称',
      dataIndex: 'contract_no',
      key: 'contract_no',
      width: 150,
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.owner_name}
          </Text>
        </div>
      ),
    },
    {
      title: '风险类型',
      dataIndex: 'risk_type',
      key: 'risk_type',
      width: 120,
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 100,
      render: (level: 'low' | 'medium' | 'high') => (
        <Tag color={riskLevelColors[level]}>
          {riskLevelTexts[level]}
        </Tag>
      ),
    },
    {
      title: '处理状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: 'detected' | 'processing' | 'resolved') => (
        <Tag color={statusColors[status]}>
          {statusTexts[status]}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '处理人',
      dataIndex: 'handler_name',
      key: 'handler_name',
      width: 100,
      render: (name) => name || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => message.info('截图预览功能开发中')}
          >
            截图
          </Button>
          {canHandle && record.status !== 'resolved' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleOpenModal(record)}
            >
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          AI监理记录
        </Title>
        {canHandle && (
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleGenerate}
            loading={loading}
          >
            生成AI检测记录
          </Button>
        )}
      </div>

      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总记录数"
                value={stats.total}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="待处理"
                value={stats.detected}
                valueStyle={{ color: '#cf1322' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="处理中"
                value={stats.processing}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已解决"
                value={stats.resolved}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card style={{ marginBottom: 16 }}>
        <Space size="middle">
          <span>状态筛选：</span>
          <Select
            placeholder="全部状态"
            style={{ width: 120 }}
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="detected">待处理</Option>
            <Option value="processing">处理中</Option>
            <Option value="resolved">已解决</Option>
          </Select>
          <span>风险等级：</span>
          <Select
            placeholder="全部等级"
            style={{ width: 120 }}
            allowClear
            value={riskLevelFilter}
            onChange={setRiskLevelFilter}
          >
            <Option value="high">高风险</Option>
            <Option value="medium">中风险</Option>
            <Option value="low">低风险</Option>
          </Select>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title="处理风险记录"
        open={handleModalVisible}
        onCancel={() => setHandleModalVisible(false)}
        footer={null}
      >
        {currentRecord && (
          <div style={{ marginBottom: 16 }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">风险类型：</Text>
                <Text strong>{currentRecord.risk_type}</Text>
              </div>
              <div>
                <Text type="secondary">风险等级：</Text>
                <Tag color={riskLevelColors[currentRecord.risk_level]}>
                  {riskLevelTexts[currentRecord.risk_level]}
                </Tag>
              </div>
              <div>
                <Text type="secondary">描述：</Text>
                <Text>{currentRecord.description}</Text>
              </div>
            </Space>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="action"
            label="处理动作"
            rules={[{ required: true, message: '请选择处理动作' }]}
          >
            <Select placeholder="请选择处理动作">
              <Option value="process">标记为处理中</Option>
              <Option value="resolve">标记为已解决</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="remark"
            label="处理备注"
            rules={[{ required: true, message: '请输入处理备注' }]}
          >
            <TextArea rows={4} placeholder="请输入处理备注" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
              <Button onClick={() => setHandleModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupervisionList;
