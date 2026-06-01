import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Space, Button, Divider, Timeline, Modal, Form, Input, message, Row, Col } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { getClaim, approveClaim, rejectClaim, payClaim } from '../../utils/api.js';

const disasterLabels = { DROUGHT: '旱灾', FLOOD: '洪涝', HAIL: '冰雹', TYPHOON: '台风', FREEZE: '冻害', PEST: '病虫害', FIRE: '火灾', OTHER: '其他' };
const cropLabels = { RICE: '水稻', WHEAT: '小麦', CORN: '玉米', SOYBEAN: '大豆', COTTON: '棉花', VEGETABLE: '蔬菜', FRUIT: '果树', OTHER: '其他' };
const statusColors = { pending: 'orange', reviewing: 'orange', approved: 'green', rejected: 'red', paid: 'purple' };
const statusLabels = { pending: '待审核', reviewing: '审核中', approved: '已通过', rejected: '已拒赔', paid: '已赔付' };
const roleLabels = { insurer: '保险公司', township: '乡镇', regulator: '监管方' };

function ClaimDetail({ currentUser }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);

  useEffect(() => {
    loadClaim();
  }, [id]);

  const loadClaim = async () => {
    try {
      setLoading(true);
      const res = await getClaim(id);
      setClaim(res.data);
    } catch (e) {
      console.error('Load claim detail failed:', e);
      message.error('加载理赔详情失败');
    } finally {
      setLoading(false);
    }
  };

  const getNextApprovalRole = () => {
    if (!claim?.approvals) return null;
    const next = claim.approvals.find(a => a.approval_status === 'pending');
    return next ? next.approver_role : null;
  };

  const handleApprove = async () => {
    try {
      const values = await form.validateFields();
      setActionLoading(true);
      const nextRole = getNextApprovalRole();
      if (!nextRole) {
        message.error('无待审批事项');
        return;
      }
      await approveClaim(id, {
        approver_role: nextRole,
        approval_opinion: values.comment,
        approver_id: 1
      });
      message.success(`${roleLabels[nextRole]}审批通过成功`);
      setApproveModalVisible(false);
      form.resetFields();
      loadClaim();
    } catch (e) {
      if (e.errorFields) return;
      message.error('审批通过失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      const values = await form.validateFields();
      setActionLoading(true);
      const nextRole = getNextApprovalRole();
      if (!nextRole) {
        message.error('无待审批事项');
        return;
      }
      await rejectClaim(id, {
        approver_role: nextRole,
        rejection_reason: values.comment,
        approval_opinion: values.comment,
        approver_id: 1
      });
      message.success('拒赔成功');
      setRejectModalVisible(false);
      form.resetFields();
      loadClaim();
    } catch (e) {
      if (e.errorFields) return;
      message.error('拒赔失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async () => {
    try {
      setActionLoading(true);
      await payClaim(id);
      message.success('支付成功');
      loadClaim();
    } catch (e) {
      message.error('支付失败');
    } finally {
      setActionLoading(false);
    }
  };

  const getValidationIcon = (valid) => valid ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#f5222d' }} />;

  const getApprovalTimeline = () => {
    const items = [];
    items.push({
      color: 'blue',
      children: (
        <Space direction="vertical" size={0}>
          <div><b>提交理赔申请</b></div>
          <div style={{ fontSize: 12, color: '#999' }}>{claim?.created_at ? dayjs(claim.created_at).format('YYYY-MM-DD HH:mm') : '-'}</div>
        </Space>
      )
    });

    if (claim?.approvals) {
      claim.approvals.forEach((approval) => {
        items.push({
          color: approval.approval_status === 'approved' ? 'green' : 'red',
          children: (
            <Space direction="vertical" size={0}>
              <div>
                <b>{roleLabels[approval.approver_role] || approval.approver_role}审批</b>
                <Tag color={approval.approval_status === 'approved' ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                  {approval.approval_status === 'approved' ? '通过' : '拒绝'}
                </Tag>
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>{approval.approver_name}</div>
              <div style={{ fontSize: 12, color: '#999' }}>{approval.approval_time ? dayjs(approval.approval_time).format('YYYY-MM-DD HH:mm') : '-'}</div>
              {approval.approval_opinion && (
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>意见：{approval.approval_opinion}</div>
              )}
            </Space>
          )
        });
      });
    }

    if (claim?.status === 'paid') {
      items.push({
        color: 'purple',
        children: (
          <Space direction="vertical" size={0}>
            <div><b>已完成支付</b></div>
            <div style={{ fontSize: 12, color: '#999' }}>{claim?.payment_time ? dayjs(claim.payment_time).format('YYYY-MM-DD HH:mm') : '-'}</div>
          </Space>
        )
      });
    }

    if (claim?.status === 'reviewing') {
      items.push({
        color: 'gray',
        children: <div><b>等待审批</b></div>
      });
    }

    return items;
  };

  const canApprove = claim?.status === 'reviewing';
  const canPay = claim?.status === 'approved';

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/claims')}>返回列表</Button>
        <span style={{ fontSize: 20, fontWeight: 600 }}>理赔详情</span>
      </Space>

      <Card loading={loading}>
        {claim && (
          <>
            <Descriptions title="理赔基本信息" bordered column={2} style={{ marginBottom: 24 }}
              extra={<Tag color={statusColors[claim.status]}>{statusLabels[claim.status]}</Tag>}>
              <Descriptions.Item label="理赔号">{claim.claim_no}</Descriptions.Item>
              <Descriptions.Item label="报案号"><a onClick={() => navigate(`/reports/${claim.report_id}`)}>{claim.report_no}</a></Descriptions.Item>
              <Descriptions.Item label="灾害类型">{disasterLabels[claim.disaster_type] || claim.disaster_type}</Descriptions.Item>
              <Descriptions.Item label="申请人">{claim.farmer_name}</Descriptions.Item>
              <Descriptions.Item label="申请时间">{claim.created_at ? dayjs(claim.created_at).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
              <Descriptions.Item label="受损面积">{claim.damaged_area} 亩</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Card title="校验结果" size="small" style={{ marginBottom: 24 }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Space>{getValidationIcon(!!claim.policy_valid)}<span>保单有效</span></Space>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Space>{getValidationIcon(!!claim.deductible_applied)}<span>免赔额计算（¥{claim.deductible_applied?.toLocaleString() || 0}）</span></Space>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Space>{getValidationIcon(!claim.duplicate_report)}<span>无重复报案</span></Space>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Space>{getValidationIcon(!!claim.materials_complete)}<span>材料完整</span></Space>
                </Col>
              </Row>
            </Card>

            <Divider />

            <Descriptions title="赔付金额" bordered column={3} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="定损金额">¥{claim.estimated_loss?.toLocaleString() || 0}</Descriptions.Item>
              <Descriptions.Item label="免赔金额">¥{claim.deductible_applied?.toLocaleString() || 0}</Descriptions.Item>
              <Descriptions.Item label="赔付金额"><span style={{ fontSize: 20, fontWeight: 'bold', color: '#f5222d' }}>¥{claim.compensation_amount?.toLocaleString() || 0}</span></Descriptions.Item>
            </Descriptions>

            {claim.deductible_clause && (
              <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
                <Descriptions.Item label="免赔条款">{claim.deductible_clause}</Descriptions.Item>
              </Descriptions>
            )}

            {claim.rejection_reason && (
              <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
                <Descriptions.Item label="拒赔原因"><span style={{ color: '#f5222d' }}>{claim.rejection_reason}</span></Descriptions.Item>
              </Descriptions>
            )}

            {claim.review_opinion && (
              <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
                <Descriptions.Item label="审核意见">{claim.review_opinion}</Descriptions.Item>
              </Descriptions>
            )}

            <Divider />

            <Card title="审批轨迹" style={{ marginBottom: 24 }}>
              <Timeline mode="left" items={getApprovalTimeline()} />
            </Card>

            <Divider />

            <Descriptions title="关联查勘信息" bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="损失比例">{claim.loss_ratio ? `${(claim.loss_ratio * 100).toFixed(1)}%` : '-'}</Descriptions.Item>
              <Descriptions.Item label="预估损失">¥{claim.estimated_loss?.toLocaleString() || 0}</Descriptions.Item>
              <Descriptions.Item label="查勘员">{claim.surveyor_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="查勘意见">{claim.survey_opinion || '-'}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="关联保单信息" bordered column={2}>
              <Descriptions.Item label="保单号"><a onClick={() => navigate(`/policies/${claim.policy_id}`)}>{claim.policy_no}</a></Descriptions.Item>
              <Descriptions.Item label="作物类型">{cropLabels[claim.crop_type] || claim.crop_type}</Descriptions.Item>
              <Descriptions.Item label="投保面积">{claim.policy_area} 亩</Descriptions.Item>
              <Descriptions.Item label="保险金额">¥{claim.insurance_amount?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="免赔率">{(claim.deductible_ratio * 100).toFixed(0)}%</Descriptions.Item>
              <Descriptions.Item label="农户">{claim.farmer_name}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Space wrap>
              {canApprove && (
                <>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setApproveModalVisible(true)} loading={actionLoading}>通过</Button>
                  <Button danger icon={<CloseCircleOutlined />} onClick={() => setRejectModalVisible(true)} loading={actionLoading}>拒赔</Button>
                </>
              )}
              {canPay && (
                <Button type="primary" icon={<DollarOutlined />} onClick={handlePay} loading={actionLoading}>支付</Button>
              )}
            </Space>
          </>
        )}
      </Card>

      <Modal title="审批通过" open={approveModalVisible} onOk={handleApprove} onCancel={() => setApproveModalVisible(false)} confirmLoading={actionLoading} okText="确认通过" cancelText="取消">
        <Form form={form}>
          <Form.Item name="comment" label="审批意见" rules={[{ required: true, message: '请输入审批意见' }]}>
            <Input.TextArea rows={4} placeholder="请输入审批意见" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="拒赔" open={rejectModalVisible} onOk={handleReject} onCancel={() => setRejectModalVisible(false)} confirmLoading={actionLoading} okText="确认拒赔" okButtonProps={{ danger: true }} cancelText="取消">
        <Form form={form}>
          <Form.Item name="comment" label="拒赔理由" rules={[{ required: true, message: '请输入拒赔理由' }]}>
            <Input.TextArea rows={4} placeholder="请输入拒赔理由" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ClaimDetail;
