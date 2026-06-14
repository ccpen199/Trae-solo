import { useState } from 'react';
import { Button, Modal, Form, Input, InputNumber, DatePicker, Tag, Space, message, Descriptions } from 'antd';
import { PlusOutlined, EyeOutlined, SendOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { PageContainer, TablePro, StatusTag } from '@/components/common';
import {
  getReportList,
  getReportDetail,
  createReport,
  submitReport,
  reviewReport,
  type ReportListItem,
  type ReportListParams,
} from '@/services/api/analytics';
import { formatDateTime, formatDuration, formatNumber } from '@/utils/format';

const statusMap: Record<string, { status: 'default' | 'info' | 'success' | 'warning' | 'danger'; text: string }> = {
  draft: { status: 'default', text: '草稿' },
  submitted: { status: 'info', text: '已提交' },
  approved: { status: 'success', text: '已审核' },
  rejected: { status: 'danger', text: '已驳回' },
};

const ReportsPage = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<ReportListItem | null>(null);
  const [searchParams] = useState<Record<string, string>>({});

  const [createForm] = Form.useForm();
  const [reviewForm] = Form.useForm();

  const { run: doCreate, loading: creating } = useRequest(createReport, {
    manual: true,
    onSuccess: () => {
      message.success('上报表单创建成功');
      setCreateOpen(false);
      createForm.resetFields();
    },
  });

  const { run: doSubmit } = useRequest(submitReport, {
    manual: true,
    onSuccess: () => {
      message.success('上报提交成功');
    },
  });

  const { run: doReview, loading: reviewing } = useRequest(reviewReport, {
    manual: true,
    onSuccess: () => {
      message.success('审核操作成功');
      setReviewOpen(false);
      reviewForm.resetFields();
      setCurrentReport(null);
    },
  });

  const { data: detailData, run: fetchDetail } = useRequest(getReportDetail, {
    manual: true,
  });

  const handleView = (record: ReportListItem) => {
    fetchDetail(record.id);
    setDetailOpen(true);
  };

  const handleSubmit = (record: ReportListItem) => {
    Modal.confirm({
      title: '确认提交',
      content: `确认提交 ${record.placeName} ${record.date} 的上报表单？`,
      onOk: () => doSubmit(record.id),
    });
  };

  const handleReview = (record: ReportListItem) => {
    setCurrentReport(record);
    setReviewOpen(true);
  };

  const handleReviewOk = async () => {
    try {
      const values = await reviewForm.validateFields();
      doReview(currentReport!.id, { status: values.status, comment: values.comment });
    } catch { /* validation failed */ }
  };

  const columns = [
    { title: '场所名称', dataIndex: 'placeName', key: 'placeName', width: 180, ellipsis: true },
    { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    {
      title: '总人次',
      dataIndex: 'totalVisitors',
      key: 'totalVisitors',
      width: 100,
      render: (v: number) => formatNumber(v),
    },
    {
      title: '总时长',
      dataIndex: 'totalDuration',
      key: 'totalDuration',
      width: 120,
      render: (v: number) => formatDuration(v),
    },
    {
      title: '上报状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const cfg = statusMap[status] || { status: 'default' as const, text: status };
        return <StatusTag status={cfg.status} text={cfg.text} />;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: unknown, record: ReportListItem) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          {record.status === 'draft' && (
            <Button type="link" size="small" icon={<SendOutlined />} onClick={() => handleSubmit(record)}>
              提交
            </Button>
          )}
          {record.status === 'submitted' && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleReview(record)}>
              审核
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="数据上报"
      subTitle="文旅场所经营数据上报管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          新增上报
        </Button>
      }
    >
      <TablePro<ReportListItem>
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await getReportList(params as ReportListParams);
          return {
            list: res.data?.list || [],
            total: res.data?.total || 0,
          };
        }}
        params={searchParams}
        showExport
      />

      <Modal
        title="新增上报表单"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={creating}
        width={520}
      >
        <Form
          form={createForm}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 16 }}
          onFinish={(values) => {
            doCreate({
              ...values,
              date: values.date?.format('YYYY-MM-DD'),
            });
          }}
        >
          <Form.Item name="placeId" label="场所" rules={[{ required: true, message: '请选择场所' }]}>
            <Input placeholder="请输入场所ID" />
          </Form.Item>
          <Form.Item name="date" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item name="totalVisitors" label="总人次" rules={[{ required: true, message: '请输入总人次' }]}>
            <InputNumber className="w-full" min={0} placeholder="请输入总人次" />
          </Form.Item>
          <Form.Item name="totalDuration" label="总时长(秒)" rules={[{ required: true, message: '请输入总时长' }]}>
            <InputNumber className="w-full" min={0} placeholder="请输入总时长（秒）" />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="上报详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={600}
      >
        {detailData?.data && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="场所名称">{detailData.data.placeName}</Descriptions.Item>
            <Descriptions.Item label="日期">{detailData.data.date}</Descriptions.Item>
            <Descriptions.Item label="总人次">{formatNumber(detailData.data.totalVisitors)}</Descriptions.Item>
            <Descriptions.Item label="总时长">{formatDuration(detailData.data.totalDuration)}</Descriptions.Item>
            <Descriptions.Item label="上报状态">
              {(() => {
                const cfg = statusMap[detailData.data.status];
                return <StatusTag status={cfg?.status || 'default'} text={cfg?.text || detailData.data.status} />;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDateTime(detailData.data.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="提交时间">{detailData.data.submittedAt ? formatDateTime(detailData.data.submittedAt) : '-'}</Descriptions.Item>
            <Descriptions.Item label="审核时间">{detailData.data.reviewedAt ? formatDateTime(detailData.data.reviewedAt) : '-'}</Descriptions.Item>
            {detailData.data.reviewComment && (
              <Descriptions.Item label="审核意见" span={2}>{detailData.data.reviewComment}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="审核上报表单"
        open={reviewOpen}
        onCancel={() => { setReviewOpen(false); setCurrentReport(null); }}
        onOk={handleReviewOk}
        confirmLoading={reviewing}
        width={480}
      >
        <Form form={reviewForm} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} initialValues={{ status: 'approved' }}>
          <Form.Item name="status" label="审核结果" rules={[{ required: true }]}>
            <Input.Group>
              <Space>
                <Tag
                  color="green"
                  style={{ cursor: 'pointer', padding: '4px 16px' }}
                  onClick={() => reviewForm.setFieldValue('status', 'approved')}
                >
                  <CheckOutlined /> 通过
                </Tag>
                <Tag
                  color="red"
                  style={{ cursor: 'pointer', padding: '4px 16px' }}
                  onClick={() => reviewForm.setFieldValue('status', 'rejected')}
                >
                  <CloseOutlined /> 驳回
                </Tag>
              </Space>
            </Input.Group>
          </Form.Item>
          <Form.Item name="comment" label="审核意见">
            <Input.TextArea rows={3} placeholder="请输入审核意见" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ReportsPage;
