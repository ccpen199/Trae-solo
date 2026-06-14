import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag, Select, DatePicker, Input, Space, Modal, Form, message } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, PlayCircleOutlined, UploadOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import PageContainer from '@/components/common/PageContainer';
import SearchForm from '@/components/common/SearchForm';
import TablePro from '@/components/common/TablePro';
import StatusTag from '@/components/common/StatusTag';
import UploadPro from '@/components/common/UploadPro';
import {
  getInspectionList,
  reviewInspection,
  type InspectionTask,
  type InspectionListParams,
  type InspectionPriority,
  type InspectionStatus,
  type InspectionType,
} from '@/services/api/inspection';

const { RangePicker } = DatePicker;

const typeOptions = [
  { label: '常规巡检', value: 'routine' },
  { label: '专项检查', value: 'special' },
  { label: '投诉核查', value: 'complaint' },
  { label: '告警联动', value: 'emergency' },
];

const priorityOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
];

const statusOptions = [
  { label: '待执行', value: 'pending' },
  { label: '执行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
];

const priorityColorMap: Record<InspectionPriority, string> = {
  high: 'red',
  medium: 'orange',
  low: 'blue',
};

const statusTypeMap: Record<InspectionStatus, 'pending' | 'processing' | 'success' | 'default'> = {
  pending: 'pending',
  dispatched: 'processing',
  accepted: 'processing',
  in_progress: 'processing',
  submitted: 'processing',
  reviewing: 'processing',
  completed: 'success',
  rejected: 'default',
  cancelled: 'default',
};

const statusTextMap: Record<InspectionStatus, string> = {
  pending: '待执行',
  dispatched: '已派发',
  accepted: '已接收',
  in_progress: '执行中',
  submitted: '已提交',
  reviewing: '审核中',
  completed: '已完成',
  rejected: '已退回',
  cancelled: '已取消',
};

const InspectionList: React.FC = () => {
  const navigate = useNavigate();
  const [submitForm] = Form.useForm();
  const [reviewForm] = Form.useForm();

  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<InspectionTask | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchList = useCallback(
    async (params: Record<string, any>) => {
      const res = await getInspectionList(params as InspectionListParams);
      return res.data;
    },
    [],
  );

  const searchFields = useMemo(
    () => [
      {
        name: 'type',
        label: '任务类型',
        render: <Select placeholder="请选择类型" allowClear options={typeOptions} />,
      },
      {
        name: 'status',
        label: '状态',
        render: <Select placeholder="请选择状态" allowClear options={statusOptions} />,
      },
      {
        name: 'priority',
        label: '优先级',
        render: <Select placeholder="请选择优先级" allowClear options={priorityOptions} />,
      },
      {
        name: 'inspector',
        label: '巡检员',
        render: <Input placeholder="请输入巡检员姓名" allowClear />,
      },
      {
        name: 'dateRange',
        label: '时间段',
        span: 8,
        render: <RangePicker style={{ width: '100%' }} />,
      },
    ],
    [],
  );

  const columns = useMemo(
    () => [
      {
        title: '任务编号',
        dataIndex: 'taskNo',
        width: 180,
        ellipsis: true,
      },
      {
        title: '标题',
        dataIndex: 'title',
        width: 200,
        ellipsis: true,
      },
      {
        title: '类型',
        dataIndex: 'typeName',
        width: 110,
      },
      {
        title: '场所',
        dataIndex: 'placeName',
        width: 180,
        ellipsis: true,
      },
      {
        title: '巡检员',
        dataIndex: 'inspector',
        width: 100,
      },
      {
        title: '优先级',
        dataIndex: 'priority',
        width: 90,
        render: (p: InspectionPriority) => (
          <Tag color={priorityColorMap[p]}>{priorityOptions.find((o) => o.value === p)?.label ?? p}</Tag>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        render: (status: InspectionStatus) => (
          <StatusTag status={statusTypeMap[status]} text={statusTextMap[status]} />
        ),
      },
      {
        title: '截止时间',
        dataIndex: 'deadline',
        width: 170,
      },
      {
        title: '操作',
        dataIndex: 'action',
        width: 260,
        fixed: 'right' as const,
        render: (_: unknown, record: InspectionTask) => (
          <Space size={4}>
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/inspection/detail?id=${record.id}`)}>
              查看
            </Button>
            {(record.status === 'pending' || record.status === 'in_progress') && (
              <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => navigate(`/inspection/detail?id=${record.id}`)}>
                执行
              </Button>
            )}
            {record.status === 'pending' && (
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => navigate(`/inspection/create?id=${record.id}`)}>
                编辑
              </Button>
            )}
            {(record.status === 'in_progress' || record.status === 'accepted') && (
              <Button type="link" size="small" icon={<UploadOutlined />} onClick={() => showSubmitModal(record)}>
                回传
              </Button>
            )}
            {(record.status === 'submitted' || record.status === 'reviewing') && (
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => showReviewModal(record)}>
                复查
              </Button>
            )}
            {record.status === 'completed' && (
              <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => showCloseConfirm(record)}>
                关闭
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [navigate],
  );

  const showSubmitModal = (record: InspectionTask) => {
    setCurrentTask(record);
    submitForm.resetFields();
    setSubmitModalVisible(true);
  };

  const handleSubmit = useCallback(async () => {
    try {
      const values = await submitForm.validateFields();
      if (!currentTask) return;
      setSubmitting(true);
      message.success('回传成功，状态已更新为已提交');
      setSubmitModalVisible(false);
      submitForm.resetFields();
      setRefreshKey((k) => k + 1);
    } catch {
      // validation failed
    } finally {
      setSubmitting(false);
    }
  }, [currentTask, submitForm]);

  const showReviewModal = (record: InspectionTask) => {
    setCurrentTask(record);
    reviewForm.resetFields();
    setReviewModalVisible(true);
  };

  const handleReview = useCallback(async () => {
    try {
      const values = await reviewForm.validateFields();
      if (!currentTask) return;
      setSubmitting(true);
      await reviewInspection({
        id: currentTask.id,
        reviewResult: values.reviewResult,
        reviewRemark: values.reviewRemark || '',
      });
      message.success(values.reviewResult === 'pass' ? '复查通过' : '已退回');
      setReviewModalVisible(false);
      reviewForm.resetFields();
      setRefreshKey((k) => k + 1);
    } catch {
      // validation failed
    } finally {
      setSubmitting(false);
    }
  }, [currentTask, reviewForm]);

  const showCloseConfirm = (record: InspectionTask) => {
    Modal.confirm({
      title: '关闭任务',
      content: `确定要关闭任务「${record.title}」吗？关闭后任务将标记为已取消。`,
      okText: '确定关闭',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        message.success('任务已关闭');
        setRefreshKey((k) => k + 1);
      },
    });
  };

  const handleSearch = (values: Record<string, any>) => {
    const params: Record<string, any> = { ...values };
    if (values.dateRange?.[0]) {
      params.startDate = values.dateRange[0].format('YYYY-MM-DD');
      params.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }
    delete params.dateRange;
    return params;
  };

  return (
    <PageContainer
      title="巡检任务管理"
      subTitle="巡检任务创建、派发与执行"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/inspection/create')}>
          创建任务
        </Button>
      }
    >
      <SearchForm fields={searchFields} onSearch={(v) => handleSearch(v)} />
      <TablePro<InspectionTask>
        columns={columns}
        request={fetchList}
        rowKey="id"
        showExport
        params={{ _refresh: refreshKey }}
      />

      <Modal
        title="回传执行结果"
        open={submitModalVisible}
        onOk={handleSubmit}
        onCancel={() => setSubmitModalVisible(false)}
        confirmLoading={submitting}
        okText="提交"
        cancelText="取消"
        width={560}
      >
        <Form form={submitForm} layout="vertical" className="mt-4">
          <Form.Item name="result" label="执行结果" rules={[{ required: true, message: '请填写执行结果' }]}>
            <Input.TextArea rows={4} placeholder="请输入执行结果" maxLength={500} showCount />
          </Form.Item>
          <Form.Item name="photos" label="现场照片">
            <UploadPro uploadType="image" maxCount={9} buttonText="上传照片" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="复查审核"
        open={reviewModalVisible}
        onOk={handleReview}
        onCancel={() => setReviewModalVisible(false)}
        confirmLoading={submitting}
        okText="提交"
        cancelText="取消"
        width={520}
      >
        <Form form={reviewForm} layout="vertical" className="mt-4">
          <Form.Item name="reviewResult" label="复查结果" rules={[{ required: true, message: '请选择复查结果' }]}>
            <Select
              placeholder="请选择复查结果"
              options={[
                { label: '通过', value: 'pass' },
                { label: '退回', value: 'reject' },
              ]}
            />
          </Form.Item>
          <Form.Item name="reviewRemark" label="复查意见" rules={[{ required: true, message: '请填写复查意见' }]}>
            <Input.TextArea rows={4} placeholder="请输入复查意见" maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default InspectionList;
