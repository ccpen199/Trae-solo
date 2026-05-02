import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Button, Tag, Typography, Modal, Form, Input, 
  Select, InputNumber, message, Descriptions, Space, Divider, Popconfirm,
  DatePicker, Timeline, Alert, Radio, Steps
} from 'antd';
import { 
  PlusOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined,
  UploadOutlined, RocketOutlined, ArrowUpOutlined, ClockCircleOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { claimApi, policyApi } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

const statusColors = {
  pending: 'orange',
  in_review: 'blue',
  validating: 'cyan',
  approved: 'green',
  completed: 'green',
  rejected: 'red',
  escalated: 'purple'
};

const statusNames = {
  pending: '待处理',
  in_review: '审核中',
  validating: '合规校验',
  approved: '已批准',
  completed: '已结案',
  rejected: '已拒赔',
  escalated: '已升级'
};

const Claims = () => {
  const { user } = useAuthStore();
  const [claims, setClaims] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [selectedClaimDetail, setSelectedClaimDetail] = useState(null);
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [processForm] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [claimsRes, policiesRes] = await Promise.all([
        claimApi.getAll(),
        policyApi.getAll()
      ]);
      
      setClaims(claimsRes.data.claims || []);
      setPolicies(policiesRes.data.policies || []);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClaim = async (values) => {
    try {
      await claimApi.create({
        policy_id: values.policy_id,
        incident_date: values.incident_date.format('YYYY-MM-DD'),
        incident_description: values.incident_description,
        claim_amount: values.claim_amount
      });
      
      message.success('理赔申请已提交');
      setCreateModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.error || '提交失败');
    }
  };

  const handleViewDetail = async (claim) => {
    try {
      const response = await claimApi.getById(claim.id);
      setSelectedClaimDetail(response.data);
      setSelectedClaim(claim);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('获取理赔详情失败');
    }
  };

  const handleStartProcess = (claim) => {
    setSelectedClaim(claim);
    processForm.resetFields();
    setProcessModalVisible(true);
  };

  const handleUploadSnapshots = async () => {
    try {
      const values = await processForm.validateFields(['snapshots']);
      const snapshots = values.snapshots.split('\n').filter(s => s.trim());
      
      await claimApi.uploadSnapshots(selectedClaim.id, snapshots);
      message.success('现场快照已上传');
      setProcessModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('上传快照失败');
    }
  };

  const handleEvaluate = async () => {
    try {
      const response = await claimApi.evaluate(selectedClaim.id);
      message.success(response.data.message);
      setProcessModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('理赔评估失败');
    }
  };

  const handleAssign = async () => {
    try {
      await claimApi.assign(selectedClaim.id);
      message.success('已分配处理');
      setProcessModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('分配失败');
    }
  };

  const handleEscalate = async () => {
    try {
      const values = await processForm.validateFields(['escalate_reason']);
      await claimApi.escalate(selectedClaim.id, values.escalate_reason);
      message.success('已升级处理');
      setProcessModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('升级失败');
    }
  };

  const handleApprove = async () => {
    try {
      const values = await processForm.getFieldsValue();
      await claimApi.approve(selectedClaim.id, values.approved_amount);
      message.success('理赔已批准');
      setProcessModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('批准失败');
    }
  };

  const handlePay = async () => {
    try {
      await claimApi.pay(selectedClaim.id);
      message.success('支付已完成');
      setProcessModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('支付失败');
    }
  };

  const handleReject = async () => {
    try {
      const values = await processForm.validateFields(['reject_reason']);
      await claimApi.reject(selectedClaim.id, values.reject_reason);
      message.success('理赔已拒绝');
      setProcessModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('拒绝失败');
    }
  };

  const renderClaimSteps = (claim) => {
    const steps = [
      { title: '报案', status: 'finish' },
      { title: '上传快照', status: claim.site_snapshots ? 'finish' : 'wait' },
      { title: '合规校验', status: claim.compliance_result ? 'finish' : 'wait' },
      { title: '引擎评估', status: claim.claim_engine_result ? 'finish' : 'wait' },
      { title: '审核', status: ['approved', 'completed', 'rejected'].includes(claim.status) ? 'finish' : 'wait' },
      { title: '支付结案', status: claim.status === 'completed' ? 'finish' : 'wait' }
    ];

    return <Steps current={steps.findIndex(s => s.status === 'wait')} items={steps} size="small" />;
  };

  const renderEngineResult = () => {
    if (!selectedClaimDetail?.claim?.claim_engine_result) return null;
    const result = selectedClaimDetail.claim.claim_engine_result;
    
    return (
      <Card size="small" title="理赔引擎评估结果" style={{ marginBottom: 16 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="评估时间">{result.evaluatedAt}</Descriptions.Item>
          <Descriptions.Item label="引擎版本">{result.engineVersion}</Descriptions.Item>
          <Descriptions.Item label="风险总分">
            <Tag color={result.totalRisk <= 20 ? 'green' : result.totalRisk <= 50 ? 'orange' : 'red'}>
              {result.totalRisk} 分
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="评估结论">
            <Tag color={
              result.decision === 'instant_payment' ? 'green' : 
              result.decision === 'approve' ? 'green' :
              result.decision === 'reject' ? 'red' : 'orange'
            }>
              {result.decision === 'instant_payment' ? '秒赔通过' : 
               result.decision === 'approve' ? '建议通过' :
               result.decision === 'reject' ? '建议拒赔' : '需人工审核'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="申请金额">¥{selectedClaimDetail.claim.claim_amount.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="建议赔付">
            <Text strong style={{ color: '#1890ff' }}>
              ¥{result.payout.approvedAmount.toLocaleString()}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="结论说明" span={2}>
            {result.decisionReason}
          </Descriptions.Item>
        </Descriptions>
        
        {result.rules && (
          <>
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
          </>
        )}
      </Card>
    );
  };

  const columns = [
    {
      title: '理赔号',
      dataIndex: 'claim_number',
      key: 'claim_number',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: '保单号',
      dataIndex: 'policy_number',
      key: 'policy_number',
    },
    {
      title: '产品名称',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: '申请人',
      dataIndex: 'claimant_name',
      key: 'claimant_name',
    },
    {
      title: '申请金额',
      dataIndex: 'claim_amount',
      key: 'claim_amount',
      render: (value) => `¥${value?.toLocaleString() || 0}`
    },
    {
      title: '赔付金额',
      dataIndex: 'approved_amount',
      key: 'approved_amount',
      render: (value) => value ? `¥${value.toLocaleString()}` : '-'
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
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm')
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
        
        if ((user.role === 'claim_adjuster' || user.role === 'admin')) {
          actions.push(
            <Button 
              key="process" 
              type="primary" 
              onClick={() => handleStartProcess(record)}
            >
              处理
            </Button>
          );
        }
        
        return <Space>{actions}</Space>;
      }
    }
  ];

  const activePolicies = policies.filter(p => p.status === 'active');

  return (
    <div>
      <Card 
        bordered={false}
        title={
          <Title level={4}>
            {user.role === 'policyholder' ? '我的理赔' : user.role === 'claim_adjuster' ? '理赔处理' : '理赔管理'}
          </Title>
        }
        extra={
          user.role === 'policyholder' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
              报案申请
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={claims}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="报案申请"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateClaim}
        >
          <Alert
            message="理赔说明"
            description="请选择有效保单，填写事故发生日期、描述和申请金额。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          <Form.Item
            name="policy_id"
            label="选择保单"
            rules={[{ required: true, message: '请选择保单' }]}
          >
            <Select placeholder="请选择有效保单">
              {activePolicies.map(policy => (
                <Option key={policy.id} value={policy.id}>
                  {policy.policy_number} - {policy.product_name} (保额: ¥{policy.sum_assured.toLocaleString()})
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="incident_date"
            label="事故发生日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} disabledDate={(current) => current && current > dayjs().endOf('day')} />
          </Form.Item>
          
          <Form.Item
            name="claim_amount"
            label="申请金额（元）"
            rules={[{ required: true, message: '请输入申请金额' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入申请金额" />
          </Form.Item>
          
          <Form.Item
            name="incident_description"
            label="事故描述"
            rules={[{ required: true, message: '请输入事故描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述事故发生经过" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交报案</Button>
              <Button onClick={() => setCreateModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="理赔详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={900}
      >
        {selectedClaimDetail && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="理赔号" span={2}>
                  <Text strong>{selectedClaimDetail.claim.claim_number}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="保单号">
                  {selectedClaimDetail.claim.policy_number}
                </Descriptions.Item>
                <Descriptions.Item label="产品名称">
                  {selectedClaimDetail.claim.product_name}
                </Descriptions.Item>
                <Descriptions.Item label="申请人">
                  {selectedClaimDetail.claim.claimant_name}
                </Descriptions.Item>
                <Descriptions.Item label="联系电话">
                  {selectedClaimDetail.claim.claimant_phone || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="申请金额">
                  ¥{selectedClaimDetail.claim.claim_amount.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="赔付金额">
                  {selectedClaimDetail.claim.approved_amount ? 
                    `¥${selectedClaimDetail.claim.approved_amount.toLocaleString()}` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="事故日期">
                  {dayjs(selectedClaimDetail.claim.incident_date).format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusColors[selectedClaimDetail.claim.status] || 'default'}>
                    {statusNames[selectedClaimDetail.claim.status] || selectedClaimDetail.claim.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="事故描述" span={2}>
                  {selectedClaimDetail.claim.incident_description || '无'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="处理进度" style={{ marginBottom: 16 }}>
              {renderClaimSteps(selectedClaimDetail.claim)}
            </Card>

            {renderEngineResult()}

            {selectedClaimDetail.auditLogs && selectedClaimDetail.auditLogs.length > 0 && (
              <Card size="small" title="操作日志">
                <Timeline>
                  {selectedClaimDetail.auditLogs.map((log, index) => (
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
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="理赔处理"
        open={processModalVisible}
        onCancel={() => setProcessModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedClaim && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="理赔号">{selectedClaim.claim_number}</Descriptions.Item>
                <Descriptions.Item label="保单号">{selectedClaim.policy_number}</Descriptions.Item>
                <Descriptions.Item label="申请金额">¥{selectedClaim.claim_amount.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  <Tag color={statusColors[selectedClaim.status] || 'default'}>
                    {statusNames[selectedClaim.status]}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Form form={processForm} layout="vertical">
              {selectedClaim.status === 'pending' && (
                <div>
                  <Alert message="请先分配或上传现场快照" type="info" showIcon style={{ marginBottom: 16 }} />
                  <Space>
                    <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={handleAssign}>
                      分配给自己
                    </Button>
                  </Space>
                </div>
              )}

              {(selectedClaim.status === 'in_review' || selectedClaim.status === 'pending') && (
                <div style={{ marginTop: 24 }}>
                  <Divider>上传现场快照</Divider>
                  <Form.Item
                    name="snapshots"
                    label="现场快照（每行一个描述，模拟上传）"
                    rules={[{ required: true, message: '请输入快照描述' }]}
                  >
                    <TextArea rows={4} placeholder="请输入现场快照描述，每行一个&#10;例如：&#10;事故现场照片1&#10;事故现场照片2&#10;身份证明" />
                  </Form.Item>
                  <Button type="primary" icon={<UploadOutlined />} onClick={handleUploadSnapshots}>
                    上传快照并进入合规校验
                  </Button>
                </div>
              )}

              {selectedClaim.status === 'validating' && (
                <div style={{ marginTop: 24 }}>
                  <Alert message="现场快照已上传，可执行理赔引擎评估" type="info" showIcon style={{ marginBottom: 16 }} />
                  <Button type="primary" icon={<RocketOutlined />} onClick={handleEvaluate}>
                    执行理赔引擎评估
                  </Button>
                </div>
              )}

              {selectedClaim.status === 'approved' && (
                <div style={{ marginTop: 24 }}>
                  <Alert message="理赔已批准，请执行支付" type="success" showIcon style={{ marginBottom: 16 }} />
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={handlePay}>
                    执行支付并结案
                  </Button>
                </div>
              )}

              {(selectedClaim.status === 'in_review' || selectedClaim.status === 'validating') && (
                <div style={{ marginTop: 24 }}>
                  <Divider>人工处理</Divider>
                  
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="approved_amount"
                        label="批准金额（元）"
                      >
                        <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入批准金额" defaultValue={selectedClaim.claim_amount} />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Space style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleApprove}>
                      批准理赔
                    </Button>
                    <Form.Item
                      name="reject_reason"
                      label="拒赔原因"
                      style={{ marginBottom: 0, display: 'inline-block', width: 300, marginLeft: 16 }}
                    >
                      <Input placeholder="请输入拒赔原因" />
                    </Form.Item>
                    <Button danger icon={<CloseCircleOutlined />} onClick={handleReject}>
                      拒赔
                    </Button>
                  </Space>
                  
                  <Divider>升级处理</Divider>
                  <Form.Item
                    name="escalate_reason"
                    label="升级原因"
                  >
                    <TextArea rows={2} placeholder="请输入升级原因" />
                  </Form.Item>
                  <Button icon={<ArrowUpOutlined />} onClick={handleEscalate}>
                    升级至管理员
                  </Button>
                </div>
              )}
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Claims;
