import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Tag, Button, Form, Input,
  Select, Radio, Switch, Space, Row, Col, Divider,
  DatePicker, message, Steps,
} from 'antd';
import {
  ArrowLeftOutlined, CheckCircleOutlined, EnvironmentOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import PageContainer from '@/components/common/PageContainer';
import UploadPro from '@/components/common/UploadPro';
import TaskLifecycle from './components/TaskLifecycle';
import {
  getInspectionDetail, executeInspection, acceptInspection, reviewInspection,
  type InspectionTask, type InspectionItem, type InspectionPriority,
} from '@/services/api/inspection';

const priorityColorMap: Record<InspectionPriority, string> = {
  high: 'red', medium: 'orange', low: 'blue',
};

const resultOptions = [
  { label: '合格', value: 'pass' },
  { label: '不合格', value: 'fail' },
  { label: '不适用', value: 'na' },
];

const getStepIndex = (status: string): number => {
  const map: Record<string, number> = {
    pending: 0, dispatched: 1, accepted: 2, in_progress: 3, submitted: 4, reviewing: 5, completed: 6, rejected: 3,
  };
  return map[status] ?? 0;
};

const InspectionDetail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id') || '';
  const [acceptForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [checkResults, setCheckResults] = useState<Record<string, { result: string; remark: string; images: string[] }>>({});
  const [overallResult, setOverallResult] = useState<string>('');
  const [needRectification, setNeedRectification] = useState(false);

  const { data, loading, refresh } = useRequest(() => getInspectionDetail(id), {
    ready: !!id,
    onSuccess: (res) => {
      const initResults: Record<string, { result: string; remark: string; images: string[] }> = {};
      if (res.data?.checkItems) {
        res.data.checkItems.forEach((item: InspectionItem) => {
          initResults[item.id] = {
            result: item.status || 'na',
            remark: item.remark || '',
            images: item.images || [],
          };
        });
      }
      setCheckResults(initResults);
    },
  });

  const task = data?.data as InspectionTask | undefined;

  const { run: runExecute, loading: executing } = useRequest(executeInspection, {
    manual: true,
    onSuccess: () => { message.success('巡检结果提交成功'); refresh(); },
  });

  const { run: runAccept, loading: accepting } = useRequest(acceptInspection, {
    manual: true,
    onSuccess: () => { message.success('接收成功'); refresh(); },
  });

  const { run: runReview, loading: reviewing } = useRequest(reviewInspection, {
    manual: true,
    onSuccess: () => { message.success('审核完成'); refresh(); },
  });

  if (!task) return null;

  const stepIndex = getStepIndex(task.status);

  const handleSubmit = () => {
    if (!task) return;
    const updatedItems = task.checkItems.map((item) => ({
      ...item,
      status: (checkResults[item.id]?.result || 'na') as 'pass' | 'fail' | 'na',
      remark: checkResults[item.id]?.remark || '',
      images: checkResults[item.id]?.images || [],
    }));
    const failCount = updatedItems.filter((i) => i.status === 'fail').length;
    const passCount = updatedItems.filter((i) => i.status === 'pass').length;
    const total = updatedItems.length;
    const score = total > 0 ? Math.round((passCount / total) * 100) : 0;
    runExecute({
      id: task.id,
      checkItems: updatedItems,
      result: overallResult || (failCount > 0 ? '不合格' : '合格'),
      score,
      remark: '',
    });
  };

  const handleCheckResultChange = (itemId: string, field: string, value: string) => {
    setCheckResults((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  return (
    <PageContainer
      title="巡检任务详情"
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inspection/list')}>
          返回列表
        </Button>
      }
    >
      <Card title="基本信息" className="shadow-none border border-neutral-100 dark:border-neutral-700 mb-4" bodyStyle={{ padding: '16px' }}>
        <Descriptions column={3} size="small" bordered>
          <Descriptions.Item label="任务编号">{task.taskNo}</Descriptions.Item>
          <Descriptions.Item label="任务标题">{task.title}</Descriptions.Item>
          <Descriptions.Item label="任务类型">{task.typeName}</Descriptions.Item>
          <Descriptions.Item label="优先级">
            {task.priority && <Tag color={priorityColorMap[task.priority]}>{task.priorityName}</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="场所名称">{task.placeName}</Descriptions.Item>
          <Descriptions.Item label="巡检员">{task.inspector}</Descriptions.Item>
          <Descriptions.Item label="截止时间">{task.deadline}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{task.createdAt}</Descriptions.Item>
          <Descriptions.Item label="派发时间">{task.dispatchTime || '-'}</Descriptions.Item>
          <Descriptions.Item label="接收时间">{task.acceptTime || '-'}</Descriptions.Item>
          <Descriptions.Item label="提交时间">{task.submitTime || '-'}</Descriptions.Item>
          <Descriptions.Item label="任务描述" span={3}>{task.description || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="处置流程" className="shadow-none border border-neutral-100 dark:border-neutral-700 mb-4" bodyStyle={{ padding: '16px' }}>
        <Steps
          current={stepIndex}
          items={[
            { title: '创建任务', description: task.createdAt },
            { title: '派发任务', description: task.dispatchTime ? `派发给${task.inspector}` : '等待派发' },
            { title: '接收任务', description: task.acceptTime ? `${task.inspector}已接收` : '等待接收' },
            { title: '执行巡检', description: task.status === 'in_progress' ? '执行中' : (task.status === 'rejected' ? '退回重新执行' : '等待执行') },
            { title: '提交结果', description: task.submitTime ? '已提交' : '等待提交' },
            { title: '复查审核', description: task.reviewTime ? (task.reviewResult === 'pass' ? '审核通过' : '退回') : '等待审核' },
            { title: '关闭任务', description: task.status === 'completed' ? '已关闭' : '待关闭' },
          ]}
        />
      </Card>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card title="检查项列表" className="shadow-none border border-neutral-100 dark:border-neutral-700 mb-4" bodyStyle={{ padding: '16px' }}>
            {task.checkItems?.map((item, idx) => {
              const result = checkResults[item.id]?.result || 'na';
              const remark = checkResults[item.id]?.remark || '';
              const isEditable = task.status === 'in_progress' || task.status === 'accepted';
              return (
                <Card
                  key={item.id}
                  size="small"
                  className="shadow-none border border-neutral-100 dark:border-neutral-700 mb-3"
                  bodyStyle={{ padding: '12px 16px' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-neutral-400 text-xs">#{idx + 1}</span>
                        <span className="font-medium">{item.name}</span>
                        <Tag className="!text-xs">{item.category}</Tag>
                      </div>
                      {isEditable ? (
                        <div className="space-y-2">
                          <Radio.Group
                            value={result}
                            onChange={(e) => handleCheckResultChange(item.id, 'result', e.target.value)}
                            optionType="button"
                            buttonStyle="solid"
                            size="small"
                          >
                            {resultOptions.map((opt) => (
                              <Radio.Button
                                key={opt.value}
                                value={opt.value}
                                className={
                                  opt.value === 'pass' ? '!text-green-600' : opt.value === 'fail' ? '!text-red-500' : ''
                                }
                              >
                                {opt.label}
                              </Radio.Button>
                            ))}
                          </Radio.Group>
                          <Input
                            value={remark}
                            onChange={(e) => handleCheckResultChange(item.id, 'remark', e.target.value)}
                            placeholder="备注说明"
                            size="small"
                            style={{ width: 300 }}
                          />
                          <div className="mt-2">
                            <UploadPro uploadType="image" maxCount={3} listType="picture-card" buttonText="现场照片" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Tag color={item.status === 'pass' ? 'green' : item.status === 'fail' ? 'red' : 'default'}>
                            {item.status === 'pass' ? '合格' : item.status === 'fail' ? '不合格' : '不适用'}
                          </Tag>
                          {item.remark && <span className="text-neutral-500 text-sm">{item.remark}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </Card>

          {(task.status === 'in_progress' || task.status === 'accepted') && (
            <Card title="巡检结果" className="shadow-none border border-neutral-100 dark:border-neutral-700 mb-4" bodyStyle={{ padding: '16px' }}>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-neutral-500 mb-2">总体评价</div>
                  <Select
                    value={overallResult || undefined}
                    onChange={setOverallResult}
                    placeholder="请选择总体评价"
                    style={{ width: '100%' }}
                    options={[
                      { label: '合格', value: '合格' },
                      { label: '不合格', value: '不合格' },
                      { label: '部分合格', value: '部分合格' },
                    ]}
                  />
                </div>
                <div>
                  <div className="text-sm text-neutral-500 mb-2">问题描述</div>
                  <Input.TextArea rows={3} placeholder="请输入问题描述" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">是否需要整改</span>
                  <Switch checked={needRectification} onChange={setNeedRectification} />
                </div>
                {needRectification && (
                  <div>
                    <div className="text-sm text-neutral-500 mb-2">整改期限</div>
                    <DatePicker style={{ width: '100%' }} placeholder="请选择整改期限" />
                  </div>
                )}
                <Divider className="!my-2" />
                <div className="flex items-center gap-2 text-neutral-500 text-sm mb-3">
                  <EnvironmentOutlined />
                  <span>位置打卡：山东省济南市历下区</span>
                </div>
                <Space className="w-full justify-end">
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleSubmit} loading={executing}>
                    提交巡检结果
                  </Button>
                </Space>
              </div>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card title="任务生命周期" className="shadow-none border border-neutral-100 dark:border-neutral-700 mb-4" bodyStyle={{ padding: '16px' }}>
            <TaskLifecycle lifecycle={task.lifecycle || []} />
          </Card>

          {(task.status === 'dispatched' || task.status === 'pending') && (
            <Card title="接收确认" className="shadow-none border border-blue-100 dark:border-blue-800 mb-4" bodyStyle={{ padding: '16px' }}>
              <Form form={acceptForm} layout="vertical">
                <Form.Item name="acceptRemark" label="接收备注">
                  <Input.TextArea rows={2} placeholder="请填写接收备注" />
                </Form.Item>
                <Button type="primary" icon={<CheckCircleOutlined />} block loading={accepting} onClick={async () => {
                  const values = await acceptForm.validateFields();
                  runAccept({ id: task.id, acceptRemark: values.acceptRemark });
                }}>
                  确认接收任务
                </Button>
              </Form>
            </Card>
          )}

          {task.status === 'submitted' && (
            <Card title="复查审核" className="shadow-none border border-orange-100 dark:border-orange-800 mb-4" bodyStyle={{ padding: '16px' }}>
              <Form form={reviewForm} layout="vertical">
                <Form.Item name="reviewRemark" label="审核意见" rules={[{ required: true, message: '请填写审核意见' }]}>
                  <Input.TextArea rows={3} placeholder="请填写审核意见" />
                </Form.Item>
                <Space direction="vertical" className="w-full">
                  <Button type="primary" icon={<CheckCircleOutlined />} block loading={reviewing} onClick={async () => {
                    const values = await reviewForm.validateFields();
                    runReview({ id: task.id, reviewResult: 'pass', reviewRemark: values.reviewRemark });
                  }}>
                    审核通过，关闭任务
                  </Button>
                  <Button danger icon={<CloseCircleOutlined />} block loading={reviewing} onClick={async () => {
                    const values = await reviewForm.validateFields();
                    runReview({ id: task.id, reviewResult: 'reject', reviewRemark: values.reviewRemark });
                  }}>
                    审核不通过，退回重新巡检
                  </Button>
                </Space>
              </Form>
            </Card>
          )}

          {task.status === 'completed' && (
            <Card title="任务完成" className="shadow-none border border-green-200 dark:border-green-800 mb-4" bodyStyle={{ padding: '16px', background: '#f6ffed' }}>
              <div className="flex items-center gap-3">
                <CheckCircleOutlined className="text-green-500 text-2xl" />
                <div>
                  <div className="font-medium text-green-700">任务已关闭</div>
                  <div className="text-sm text-neutral-500">审核通过，巡检到位</div>
                </div>
              </div>
            </Card>
          )}

          {task.status === 'rejected' && (
            <Card title="退回重检" className="shadow-none border border-red-200 dark:border-red-800 mb-4" bodyStyle={{ padding: '16px', background: '#fff2f0' }}>
              <div className="mb-3">
                <div className="font-medium text-red-700 mb-1">任务已被退回</div>
                <div className="text-sm text-neutral-500">整改意见：{task.reviewRemark || '请按要求重新执行巡检'}</div>
              </div>
              <Button type="primary" block onClick={refresh}>
                重新开始巡检
              </Button>
            </Card>
          )}
        </Col>
      </Row>
    </PageContainer>
  );
};

export default InspectionDetail;
