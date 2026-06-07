import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Steps,
  Timeline,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Spin,
  message,
  Divider,
  Rate,
} from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import useAuthStore from '../stores/auth';
import { cases as casesApi, evaluations as evalApi } from '../api';

const { TextArea } = Input;

const statusMap = {
  submitted: { text: '已提交', color: 'blue' },
  accepted: { text: '已受理', color: 'cyan' },
  reviewing: { text: '审核中', color: 'orange' },
  supplementing: { text: '补正中', color: 'gold' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已退回', color: 'red' },
  completed: { text: '已办结', color: 'green' },
  archived: { text: '已归档', color: 'default' },
  withdrawn: { text: '已撤回', color: 'default' },
};

const statusStepIndex = {
  submitted: 0,
  accepted: 1,
  reviewing: 2,
  supplementing: 2,
  approved: 3,
  rejected: 3,
  completed: 4,
  archived: 5,
  withdrawn: -1,
};

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [actionModal, setActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionForm] = Form.useForm();
  const [actionLoading, setActionLoading] = useState(false);
  const [evalModal, setEvalModal] = useState(false);
  const [evalForm] = Form.useForm();
  const [evalLoading, setEvalLoading] = useState(false);
  const [existingEval, setExistingEval] = useState(null);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'staff';

  useEffect(() => {
    fetchCase();
  }, [id]);

  const fetchCase = async () => {
    setLoading(true);
    try {
      const res = await casesApi.getCase(id);
      const d = res.data?.data || res.data || {};
      setCaseData(d);
      if (d.evaluation) setExistingEval(d.evaluation);
    } catch {
      message.error('获取办件详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    try {
      const values = await actionForm.validateFields();
      setActionLoading(true);
      switch (actionType) {
        case 'accept':
          await casesApi.acceptCase(id);
          break;
        case 'approve':
          await casesApi.reviewCase(id, { result: 'approved', opinion: values.opinion });
          break;
        case 'reject':
          await casesApi.reviewCase(id, { result: 'rejected', opinion: values.opinion });
          break;
        case 'complete':
          await casesApi.completeCase(id, { opinion: values.opinion });
          break;
        case 'withdraw':
          await casesApi.withdrawCase(id);
          break;
        case 'supplement':
          await casesApi.supplementCase(id);
          break;
        default:
          break;
      }
      message.success('操作成功');
      setActionModal(false);
      actionForm.resetFields();
      fetchCase();
    } catch (err) {
      if (err.response) {
        message.error(err.response?.data?.message || '操作失败');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const openAction = (type) => {
    setActionType(type);
    setActionModal(true);
  };

  const handleEvalSubmit = async () => {
    try {
      const values = await evalForm.validateFields();
      setEvalLoading(true);
      await evalApi.createEvaluation({
        case_id: id,
        ...values,
      });
      message.success('评价成功');
      setEvalModal(false);
      evalForm.resetFields();
      fetchCase();
    } catch (err) {
      if (err.response) {
        message.error(err.response?.data?.message || '评价失败');
      }
    } finally {
      setEvalLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div style={{ textAlign: 'center', padding: 100, color: '#999' }}>
        未找到该办件
      </div>
    );
  }

  const currentStep = statusStepIndex[caseData.status] ?? 0;

  const processSteps = [
    { title: '提交', description: '申请人提交' },
    { title: '受理', description: '窗口受理' },
    { title: '审核', description: '审核审批' },
    { title: '决定', description: '作出决定' },
    { title: '办结', description: '办结送达' },
    { title: '归档', description: '归档保存' },
  ];

  const materialColumns = [
    { title: '材料名称', dataIndex: 'name', key: 'name' },
    {
      title: '审核状态',
      dataIndex: 'check_status',
      key: 'check_status',
      width: 120,
      render: (v) => {
        if (v === 'passed') return <Tag color="green" icon={<CheckCircleOutlined />}>通过</Tag>;
        if (v === 'failed') return <Tag color="red" icon={<CloseCircleOutlined />}>不通过</Tag>;
        return <Tag color="processing">待审核</Tag>;
      },
    },
  ];

  const actionButtons = [];
  if (isAdmin) {
    if (caseData.status === 'submitted') {
      actionButtons.push(
        <Button type="primary" key="accept" onClick={() => openAction('accept')}>
          受理
        </Button>
      );
    }
    if (caseData.status === 'reviewing') {
      actionButtons.push(
        <Button type="primary" key="approve" onClick={() => openAction('approve')}>
          审核通过
        </Button>,
        <Button danger key="reject" onClick={() => openAction('reject')}>
          退回
        </Button>
      );
    }
    if (caseData.status === 'approved' || caseData.status === 'reviewing') {
      actionButtons.push(
        <Button type="primary" key="complete" onClick={() => openAction('complete')}>
          办结
        </Button>
      );
    }
  } else {
    if (caseData.status === 'submitted') {
      actionButtons.push(
        <Button key="withdraw" onClick={() => openAction('withdraw')}>
          撤回
        </Button>
      );
    }
    if (caseData.status === 'supplementing') {
      actionButtons.push(
        <Button type="primary" key="supplement" onClick={() => openAction('supplement')}>
          补正提交
        </Button>
      );
    }
  }

  const actionTitleMap = {
    accept: '受理确认',
    approve: '审核通过',
    reject: '退回办件',
    complete: '办结确认',
    withdraw: '撤回确认',
    supplement: '补正提交',
  };

  return (
    <div>
      <Card
        title={`办件详情 - ${caseData.case_no || ''}`}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cases')}>
            返回
          </Button>
        }
      >
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="办件编号">{caseData.case_no}</Descriptions.Item>
          <Descriptions.Item label="申请人">{caseData.applicant_name}</Descriptions.Item>
          <Descriptions.Item label="事项名称">{caseData.item_name}</Descriptions.Item>
          <Descriptions.Item label="当前状态">
            <Tag color={(statusMap[caseData.status] || {}).color || 'default'}>
              {(statusMap[caseData.status] || {}).text || caseData.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="提交时间">
            {caseData.created_at ? dayjs(caseData.created_at).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="法定时限">
            {caseData.deadline ? dayjs(caseData.deadline).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">办理流程</Divider>
        <Steps
          current={Math.max(currentStep, 0)}
          items={processSteps.map((s, i) => ({
            ...s,
            status: currentStep === i ? 'process' : currentStep > i ? 'finish' : 'wait',
          }))}
          style={{ marginBottom: 24 }}
        />

        <Divider orientation="left">申请材料</Divider>
        <Table
          columns={materialColumns}
          dataSource={caseData.materials || []}
          rowKey={(r, i) => i}
          pagination={false}
          size="small"
          style={{ marginBottom: 24 }}
        />

        <Divider orientation="left">办理记录</Divider>
        <Timeline
          items={(caseData.history || caseData.timeline || []).map((h, i) => ({
            color: h.status === 'rejected' ? 'red' : h.status === 'completed' ? 'green' : 'blue',
            children: (
              <div>
                <div style={{ fontWeight: 500 }}>
                  {(statusMap[h.status] || {}).text || h.status}
                  <span style={{ color: '#999', fontWeight: 'normal', marginLeft: 8, fontSize: 12 }}>
                    {h.created_at ? dayjs(h.created_at).format('YYYY-MM-DD HH:mm') : ''}
                  </span>
                </div>
                {h.opinion && <div style={{ color: '#666', marginTop: 4 }}>{h.opinion}</div>}
                {h.operator_name && <div style={{ color: '#999', fontSize: 12 }}>经办人：{h.operator_name}</div>}
              </div>
            ),
          }))}
          style={{ marginBottom: 24 }}
        />

        {actionButtons.length > 0 && (
          <>
            <Divider orientation="left">操作</Divider>
            <Space>{actionButtons}</Space>
          </>
        )}

        {caseData.status === 'completed' && !existingEval && !isAdmin && (
          <>
            <Divider orientation="left">评价</Divider>
            <Button type="primary" onClick={() => setEvalModal(true)}>
              评价此办件
            </Button>
          </>
        )}

        {existingEval && (
          <>
            <Divider orientation="left">评价信息</Divider>
            <Descriptions bordered column={{ xs: 1, sm: 2, md: 4 }}>
              <Descriptions.Item label="总体评分"><Rate disabled value={existingEval.overall_rating} /></Descriptions.Item>
              <Descriptions.Item label="速度评分"><Rate disabled value={existingEval.speed_rating} /></Descriptions.Item>
              <Descriptions.Item label="态度评分"><Rate disabled value={existingEval.attitude_rating} /></Descriptions.Item>
              <Descriptions.Item label="质量评分"><Rate disabled value={existingEval.quality_rating} /></Descriptions.Item>
              <Descriptions.Item label="评价内容" span={4}>{existingEval.content || '-'}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Card>

      <Modal
        title={actionTitleMap[actionType]}
        open={actionModal}
        onOk={handleAction}
        onCancel={() => { setActionModal(false); actionForm.resetFields(); }}
        confirmLoading={actionLoading}
        okText="确认"
        cancelText="取消"
      >
        <Form form={actionForm} layout="vertical">
          {(actionType === 'approve' || actionType === 'reject' || actionType === 'complete') && (
            <Form.Item name="opinion" label="处理意见" rules={[{ required: true, message: '请输入处理意见' }]}>
              <TextArea rows={4} placeholder="请输入处理意见" />
            </Form.Item>
          )}
          {(actionType === 'accept' || actionType === 'withdraw' || actionType === 'supplement') && (
            <p>确认执行此操作？</p>
          )}
        </Form>
      </Modal>

      <Modal
        title="评价办件"
        open={evalModal}
        onOk={handleEvalSubmit}
        onCancel={() => { setEvalModal(false); evalForm.resetFields(); }}
        confirmLoading={evalLoading}
        okText="提交评价"
        cancelText="取消"
      >
        <Form form={evalForm} layout="vertical">
          <Form.Item name="overall_rating" label="总体评分" rules={[{ required: true, message: '请评分' }]}>
            <Rate />
          </Form.Item>
          <Form.Item name="speed_rating" label="速度评分" rules={[{ required: true, message: '请评分' }]}>
            <Rate />
          </Form.Item>
          <Form.Item name="attitude_rating" label="态度评分" rules={[{ required: true, message: '请评分' }]}>
            <Rate />
          </Form.Item>
          <Form.Item name="quality_rating" label="质量评分" rules={[{ required: true, message: '请评分' }]}>
            <Rate />
          </Form.Item>
          <Form.Item name="content" label="评价内容">
            <TextArea rows={3} placeholder="请输入评价内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
