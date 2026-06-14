import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Tag, Image, Form, Select, Input,
  Button, Switch, Space, Row, Col, Divider, Steps, message, Progress,
} from 'antd';
import {
  ArrowLeftOutlined, EnvironmentOutlined, PhoneOutlined,
  CheckCircleOutlined, CloseCircleOutlined, SendOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import PageContainer from '@/components/common/PageContainer';
import UploadPro from '@/components/common/UploadPro';
import AlarmLifecycle from './components/AlarmLifecycle';
import {
  getAlarmDetail, confirmAlarm, receiveAlarm, processAlarm, reviewAlarm,
  type Alarm, type AlarmLevel,
} from '@/services/api/alarm';

const levelColorMap: Record<AlarmLevel, string> = {
  critical: 'red', high: 'orange', medium: 'gold', low: 'blue',
};
const levelTextMap: Record<AlarmLevel, string> = {
  critical: '严重', high: '高', medium: '中', low: '低',
};

const getStepIndex = (status: string): number => {
  const map: Record<string, number> = {
    pending: 0, confirmed: 1, dispatched: 1, received: 2, processing: 3, resolved: 4, reviewing: 5, closed: 6, ignored: 6,
  };
  return map[status] ?? 0;
};

const AlarmDetail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id') || '';
  const [confirmForm] = Form.useForm();
  const [receiveForm] = Form.useForm();
  const [processForm] = Form.useForm();
  const [reviewForm] = Form.useForm();

  const { data, loading, refresh } = useRequest(() => getAlarmDetail(id), {
    ready: !!id,
    refreshDeps: [id],
  });

  const alarm = data?.data as Alarm | undefined;

  const { run: runConfirm, loading: confirming } = useRequest(confirmAlarm, {
    manual: true, onSuccess: () => { message.success('操作成功'); refresh(); },
  });
  const { run: runReceive, loading: receiving } = useRequest(receiveAlarm, {
    manual: true, onSuccess: () => { message.success('接收成功'); refresh(); },
  });
  const { run: runProcess, loading: processing } = useRequest(processAlarm, {
    manual: true, onSuccess: () => { message.success('处置完成'); refresh(); },
  });
  const { run: runReview, loading: reviewing } = useRequest(reviewAlarm, {
    manual: true, onSuccess: () => { message.success('审核完成'); refresh(); },
  });

  if (!alarm) return null;

  const stepIndex = getStepIndex(alarm.status);

  return (
    <PageContainer
      title="告警详情"
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/alarm/list')}>
          返回列表
        </Button>
      }
    >
      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card title="抓拍图片" className="shadow-none border border-neutral-100 dark:border-neutral-700 mb-4" bodyStyle={{ padding: '16px' }}>
            {alarm.images?.length ? (
              <Image.PreviewGroup>
                <div className="grid grid-cols-2 gap-3">
                  {alarm.images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <Image src={img} alt={`抓拍图${idx + 1}`} className="w-full rounded object-cover" style={{ maxHeight: 300 }} />
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded">AI标注区域</div>
                    </div>
                  ))}
                </div>
              </Image.PreviewGroup>
            ) : (
              <div className="flex items-center justify-center h-48 bg-neutral-100 dark:bg-neutral-700 rounded text-neutral-400">暂无抓拍图片</div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="告警信息" className="shadow-none border border-neutral-100 dark:border-neutral-700 mb-4" bodyStyle={{ padding: '16px' }}>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="告警编号">{alarm.alarmNo}</Descriptions.Item>
              <Descriptions.Item label="告警类型">{alarm.typeName}</Descriptions.Item>
              <Descriptions.Item label="告警级别">
                {alarm.level && <Tag color={levelColorMap[alarm.level]}>{levelTextMap[alarm.level]}</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="AI置信度">
                <Progress percent={alarm.confidence || 0} size="small" style={{ width: 120 }} strokeColor={alarm.confidence && alarm.confidence >= 80 ? '#52c41a' : '#faad14'} />
              </Descriptions.Item>
              <Descriptions.Item label="抓拍时间" span={2}>{alarm.createdAt}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" className="!mt-4 !mb-3 !text-sm">
              <EnvironmentOutlined className="mr-1" />场所信息
            </Divider>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="场所名称">{alarm.placeName}</Descriptions.Item>
              <Descriptions.Item label="地址">{alarm.location || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系方式">
                <PhoneOutlined className="mr-1" />0531-88881234
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Card title="处置流程" className="shadow-none border border-neutral-100 dark:border-neutral-700 mb-4" bodyStyle={{ padding: '16px' }}>
        <Steps
          current={stepIndex}
          items={[
            { title: 'AI识别告警', description: alarm.status === 'pending' ? '当前' : alarm.startedAt },
            { title: '告警确认/派发', description: alarm.dispatchTime ? `派发给${alarm.handler}` : '等待确认' },
            { title: '处置接收', description: alarm.receiveTime ? alarm.handler : '等待接收' },
            { title: '现场处置', description: alarm.handleResult ? '已处置' : '等待处置' },
            { title: '结果回传', description: alarm.handledAt ? '已回传' : '等待回传' },
            { title: '复查审核', description: alarm.reviewTime ? (alarm.reviewResult === 'pass' ? '审核通过' : '退回') : '等待审核' },
            { title: '关闭归档', description: alarm.status === 'closed' ? '已关闭' : '待关闭' },
          ]}
        />
      </Card>

      <Card title="告警生命周期" className="shadow-none border border-neutral-100 dark:border-neutral-700 mb-4" bodyStyle={{ padding: '16px' }}>
        <AlarmLifecycle lifecycle={alarm.lifecycle || []} />
      </Card>

      {alarm.status === 'pending' && (
        <Card title="告警确认/派发" className="shadow-none border border-neutral-100 dark:border-neutral-700 mb-4" bodyStyle={{ padding: '16px' }}>
          <Form form={confirmForm} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item name="handler" label="处置人" rules={[{ required: true, message: '请选择处置人' }]}>
                  <Select
                    placeholder="请选择处置人"
                    options={[
                      { label: '张三（值班员）', value: '张三' },
                      { label: '李四（安全员）', value: '李四' },
                      { label: '王五（监管员）', value: '王五' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={16}>
                <Form.Item name="dispatchOpinion" label="派发意见">
                  <Input.TextArea rows={2} placeholder="请输入派发意见" />
                </Form.Item>
              </Col>
            </Row>
            <Space>
              <Button type="primary" icon={<SendOutlined />} loading={confirming} onClick={async () => {
                const values = await confirmForm.validateFields();
                runConfirm({ id: alarm.id, isConfirmed: true, handler: values.handler, dispatchOpinion: values.dispatchOpinion });
              }}>
                确认并派发
              </Button>
              <Button danger icon={<CloseCircleOutlined />} onClick={() => {
                runConfirm({ id: alarm.id, isConfirmed: false, handler: '' });
              }}>
                标记误报
              </Button>
            </Space>
          </Form>
        </Card>
      )}

      {(alarm.status === 'dispatched' || alarm.status === 'confirmed') && (
        <Card title="接收处置" className="shadow-none border border-neutral-100 dark:border-neutral-700 mb-4" bodyStyle={{ padding: '16px' }}>
          <Form form={receiveForm} layout="vertical">
            <Form.Item name="receiveRemark" label="初步判断" rules={[{ required: true, message: '请填写初步判断' }]}>
              <Input.TextArea rows={3} placeholder="请填写您的初步判断" />
            </Form.Item>
            <Button type="primary" icon={<CheckCircleOutlined />} loading={receiving} onClick={async () => {
              const values = await receiveForm.validateFields();
              runReceive({ id: alarm.id, receiveRemark: values.receiveRemark });
            }}>
              确认接收
            </Button>
          </Form>
        </Card>
      )}

      {(alarm.status === 'received' || alarm.status === 'processing') && (
        <Card title="现场处置" className="shadow-none border border-neutral-100 dark:border-neutral-700 mb-4" bodyStyle={{ padding: '16px' }}>
          <Form form={processForm} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} md={16}>
                <Form.Item name="handleResult" label="处置结果" rules={[{ required: true, message: '请输入处置结果' }]}>
                  <Input.TextArea rows={3} placeholder="请输入处置结果说明" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="rectifyMeasures" label="整改措施">
                  <Input.TextArea rows={3} placeholder="请输入整改措施" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="现场照片">
                  <UploadPro uploadType="image" maxCount={4} />
                </Form.Item>
              </Col>
            </Row>
            <Button type="primary" icon={<CheckCircleOutlined />} loading={processing} onClick={async () => {
              const values = await processForm.validateFields();
              runProcess({ id: alarm.id, handleResult: values.handleResult, rectifyMeasures: values.rectifyMeasures });
            }}>
              提交处置报告
            </Button>
          </Form>
        </Card>
      )}

      {alarm.status === 'resolved' && (
        <Card title="复查审核" className="shadow-none border border-neutral-100 dark:border-neutral-700 mb-4" bodyStyle={{ padding: '16px' }}>
          <Form form={reviewForm} layout="vertical">
            <Form.Item name="reviewRemark" label="审核意见" rules={[{ required: true, message: '请填写审核意见' }]}>
              <Input.TextArea rows={3} placeholder="请填写审核意见" />
            </Form.Item>
            <Space>
              <Button type="primary" icon={<CheckCircleOutlined />} loading={reviewing} onClick={async () => {
                const values = await reviewForm.validateFields();
                runReview({ id: alarm.id, reviewResult: 'pass', reviewRemark: values.reviewRemark });
              }}>
                审核通过，关闭告警
              </Button>
              <Button danger icon={<CloseCircleOutlined />} loading={reviewing} onClick={async () => {
                const values = await reviewForm.validateFields();
                runReview({ id: alarm.id, reviewResult: 'reject', reviewRemark: values.reviewRemark });
              }}>
                审核不通过，退回重新处置
              </Button>
            </Space>
          </Form>
        </Card>
      )}

      {alarm.status === 'closed' && (
        <Card title="处置完成" className="shadow-none border border-green-200 dark:border-green-800 mb-4" bodyStyle={{ padding: '16px', background: '#f6ffed' }}>
          <div className="flex items-center gap-3">
            <CheckCircleOutlined className="text-green-500 text-2xl" />
            <div>
              <div className="font-medium text-green-700">告警已关闭归档</div>
              <div className="text-sm text-neutral-500">审核通过，处置到位 | 关闭时间：{alarm.closeTime || '-'}</div>
            </div>
          </div>
        </Card>
      )}
    </PageContainer>
  );
};

export default AlarmDetail;
