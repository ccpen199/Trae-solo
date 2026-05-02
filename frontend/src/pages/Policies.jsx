import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Button, Tag, Typography, Modal, Descriptions, 
  Space, Popconfirm, message, Timeline, Radio, Divider, Result,
  Form, Input
} from 'antd';
import { 
  EyeOutlined, CheckCircleOutlined, CloseCircleOutlined,
  FileTextOutlined, ClockCircleOutlined, RightOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { policyApi } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const statusColors = {
  draft: 'default',
  pending_approval: 'orange',
  approved: 'green',
  active: 'green',
  expired: 'default',
  lapsed: 'red',
  rejected: 'red'
};

const statusNames = {
  draft: '草稿',
  pending_approval: '待核保',
  approved: '已通过',
  active: '保障中',
  expired: '已过期',
  lapsed: '已失效',
  rejected: '已拒绝'
};

const Policies = () => {
  const { user } = useAuthStore();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [underwriteModalVisible, setUnderwriteModalVisible] = useState(false);
  const [underwriteForm] = Form.useForm();

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      let response;
      if (user.role === 'underwriter') {
        response = await policyApi.getPendingUnderwriting();
      } else {
        response = await policyApi.getAll();
      }
      setPolicies(response.data.policies || []);
    } catch (error) {
      message.error('获取保单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (policy) => {
    try {
      const response = await policyApi.getById(policy.id);
      setSelectedPolicy(response.data);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('获取保单详情失败');
    }
  };

  const handleSubmitForUnderwriting = async (policyId) => {
    try {
      await policyApi.submit(policyId);
      message.success('保单已提交核保');
      fetchPolicies();
    } catch (error) {
      message.error(error.response?.data?.error || '提交失败');
    }
  };

  const handleUnderwrite = async (values) => {
    try {
      await policyApi.underwrite(selectedPolicy.id, values.decision, values.reason);
      message.success('核保处理完成');
      setUnderwriteModalVisible(false);
      underwriteForm.resetFields();
      fetchPolicies();
    } catch (error) {
      message.error('核保处理失败');
    }
  };

  const columns = [
    {
      title: '保单号',
      dataIndex: 'policy_number',
      key: 'policy_number',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: '产品名称',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: '投保人',
      dataIndex: 'policyholder_name',
      key: 'policyholder_name',
    },
    {
      title: '保额',
      dataIndex: 'sum_assured',
      key: 'sum_assured',
      render: (value) => `¥${value?.toLocaleString() || 0}`
    },
    {
      title: '保费',
      dataIndex: 'premium_amount',
      key: 'premium_amount',
      render: (value) => `¥${value?.toLocaleString() || 0}`
    },
    {
      title: '保障期限',
      key: 'term',
      render: (_, record) => (
        <div>
          <Text>{dayjs(record.start_date).format('YYYY-MM-DD')}</Text>
          <RightOutlined style={{ margin: '0 8px', fontSize: 12 }} />
          <Text>{dayjs(record.end_date).format('YYYY-MM-DD')}</Text>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusNames[status] || status}
        </Tag>
      )
    },
    {
      title: '风险评分',
      dataIndex: 'risk_score',
      key: 'risk_score',
      render: (score) => {
        if (score === null || score === undefined) return '-';
        const color = score <= 30 ? 'green' : score <= 60 ? 'orange' : 'red';
        return <Tag color={color}>{score} 分</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const actions = [];
        
        actions.push(
          <Button key="view" type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
        );
        
        if (record.status === 'draft') {
          actions.push(
            <Popconfirm
              key="submit"
              title="确认提交核保？"
              onConfirm={() => handleSubmitForUnderwriting(record.id)}
            >
              <Button type="primary" icon={<FileTextOutlined />}>提交核保</Button>
            </Popconfirm>
          );
        }
        
        if ((user.role === 'underwriter' || user.role === 'admin') && record.status === 'pending_approval') {
          actions.push(
            <Button 
              key="underwrite" 
              type="primary" 
              onClick={() => {
                setSelectedPolicy(record);
                setUnderwriteModalVisible(true);
              }}
            >
              核保处理
            </Button>
          );
        }
        
        return <Space>{actions}</Space>;
      }
    }
  ];

  const renderUnderwritingResult = () => {
    if (!selectedPolicy?.policy?.underwriting_result) return null;
    const result = selectedPolicy.policy.underwriting_result;
    
    return (
      <Card size="small" title="智能核保结果" style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="评估时间">{result.evaluatedAt}</Descriptions.Item>
          <Descriptions.Item label="引擎版本">{result.engineVersion}</Descriptions.Item>
          <Descriptions.Item label="风险总分">
            <Tag color={result.totalRisk <= 30 ? 'green' : result.totalRisk <= 60 ? 'orange' : 'red'}>
              {result.totalRisk} 分
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="核保结论">
            <Tag color={result.decision === 'approve' ? 'green' : result.decision === 'reject' ? 'red' : 'orange'}>
              {result.decision === 'approve' ? '自动通过' : result.decision === 'reject' ? '建议拒保' : '需人工核保'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="结论说明" span={2}>
            {result.decisionReason}
          </Descriptions.Item>
        </Descriptions>
        
        <Divider>规则详情</Divider>
        <Table
          dataSource={result.rules}
          rowKey="ruleId"
          pagination={false}
          size="small"
          columns={[
            { title: '规则名称', dataIndex: 'ruleName', key: 'ruleName' },
            { 
              title: '状态', 
              dataIndex: 'passed', 
              key: 'passed',
              render: (passed) => passed ? 
                <Tag color="green">通过</Tag> : 
                <Tag color="orange">不通过</Tag>
            },
            { title: '风险分', dataIndex: 'risk', key: 'risk' },
            { title: '说明', dataIndex: 'reason', key: 'reason' }
          ]}
        />
      </Card>
    );
  };

  const renderAuditTrail = () => {
    if (!selectedPolicy?.auditLogs || selectedPolicy.auditLogs.length === 0) return null;
    
    return (
      <Card size="small" title="操作日志" style={{ marginTop: 16 }}>
        <Timeline>
          {selectedPolicy.auditLogs.map((log, index) => (
            <Timeline.Item key={index} color={log.status === 'success' ? 'green' : 'red'}>
              <div>
                <Text strong>{log.action}</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}
                </Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                操作者ID: {log.actor_id}
              </Text>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    );
  };

  return (
    <div>
      <Card 
        bordered={false}
        title={
          <Title level={4}>
            {user.role === 'underwriter' ? '待核保保单' : '我的保单'}
          </Title>
        }
      >
        <Table
          columns={columns}
          dataSource={policies}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="保单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={900}
      >
        {selectedPolicy && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="保单号" span={2}>
                <Text strong>{selectedPolicy.policy?.policy_number}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="产品名称">
                {selectedPolicy.policy?.product_name}
              </Descriptions.Item>
              <Descriptions.Item label="产品代码">
                {selectedPolicy.policy?.code}
              </Descriptions.Item>
              <Descriptions.Item label="投保人">
                {selectedPolicy.policy?.policyholder_name}
              </Descriptions.Item>
              <Descriptions.Item label="代理人">
                {selectedPolicy.policy?.agent_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="保额">
                <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                  ¥{selectedPolicy.policy?.sum_assured?.toLocaleString() || 0}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="保费">
                ¥{selectedPolicy.policy?.premium_amount?.toLocaleString() || 0}
              </Descriptions.Item>
              <Descriptions.Item label="生效日期">
                {dayjs(selectedPolicy.policy?.start_date).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="到期日期">
                {dayjs(selectedPolicy.policy?.end_date).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColors[selectedPolicy.policy?.status] || 'default'}>
                  {statusNames[selectedPolicy.policy?.status] || selectedPolicy.policy?.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="核保员">
                {selectedPolicy.policy?.underwriter_name || '-'}
              </Descriptions.Item>
            </Descriptions>

            {renderUnderwritingResult()}
            {renderAuditTrail()}
          </div>
        )}
      </Modal>

      <Modal
        title="核保处理"
        open={underwriteModalVisible}
        onCancel={() => setUnderwriteModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedPolicy && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="保单号">
                  {selectedPolicy.policy_number}
                </Descriptions.Item>
                <Descriptions.Item label="投保人">
                  {selectedPolicy.policyholder_name}
                </Descriptions.Item>
                <Descriptions.Item label="保额">
                  ¥{selectedPolicy.sum_assured?.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="风险评分">
                  <Tag color={selectedPolicy.risk_score <= 30 ? 'green' : selectedPolicy.risk_score <= 60 ? 'orange' : 'red'}>
                    {selectedPolicy.risk_score} 分
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Form
              form={underwriteForm}
              layout="vertical"
              onFinish={handleUnderwrite}
            >
              <Form.Item
                name="decision"
                label="核保决定"
                rules={[{ required: true, message: '请选择核保决定' }]}
              >
                <Radio.Group>
                  <Radio.Button value="approve" style={{ color: '#52c41a' }}>
                    <CheckCircleOutlined /> 通过
                  </Radio.Button>
                  <Radio.Button value="reject" style={{ color: '#ff4d4f' }}>
                    <CloseCircleOutlined /> 拒保
                  </Radio.Button>
                  <Radio.Button value="manual" style={{ color: '#faad14' }}>
                    <ClockCircleOutlined /> 需人工核保
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="reason"
                label="核保说明"
              >
                <TextArea rows={4} placeholder="请输入核保说明" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">确认</Button>
                  <Button onClick={() => setUnderwriteModalVisible(false)}>取消</Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Policies;
