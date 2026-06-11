import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, Result, Spin, message } from 'antd';
import {
  FormOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { publicApi } from '@/api';

const { TextArea } = Input;
const { Option } = Select;

const feedbackTypes = [
  { value: 'service', label: '服务投诉' },
  { value: 'suggestion', label: '意见建议' },
  { value: 'bug', label: '故障报告' },
  { value: 'praise', label: '服务表扬' },
  { value: 'other', label: '其他' },
];

const CitizenFeedback: React.FC = () => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      const result = await publicApi.submitFeedback({
        name: values.name,
        phone: values.phone,
        type: values.type,
        title: values.title,
        description: values.description,
        contact: values.contact || values.phone,
      });
      setSubmitResult(result);
      setSubmitted(true);
      message.success('反馈提交成功，感谢您的参与');
    } catch (error: any) {
      const errMsg = error?.message || '提交失败';
      if (errMsg.includes('Network') || errMsg.includes('网络')) {
        message.error('网络连接失败，请稍后重试');
      } else {
        message.error(errMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setSubmitResult(null);
    form.resetFields();
  };

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Result
          status="success"
          title="反馈提交成功"
          subTitle={`您的反馈已收到，我们会尽快处理。反馈编号：${submitResult?.id || Date.now()}`}
          extra={[
            <Button type="primary" key="again" onClick={handleReset}>继续反馈</Button>,
          ]}
        >
          <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">反馈类型：</span>{feedbackTypes.find(t => t.value === form.getFieldValue('type'))?.label}</div>
              <div><span className="text-gray-500">反馈标题：</span>{form.getFieldValue('title')}</div>
              <div><span className="text-gray-500">处理时限：</span>3个工作日内回复</div>
              <div><span className="text-gray-500">查询方式：</span>登录工作台查看处理进度</div>
            </div>
          </div>
        </Result>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
      <div className="bg-gradient-to-r from-orange-600 to-amber-500 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">市民反馈</h1>
        <p className="text-orange-100">服务投诉 · 意见建议 · 故障报告 · 服务表扬</p>
      </div>

      <Card className="card-hover">
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ type: 'suggestion' }}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input prefix={<UserOutlined />} placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
            <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" maxLength={11} />
          </Form.Item>
          <Form.Item name="type" label="反馈类型" rules={[{ required: true, message: '请选择反馈类型' }]}>
            <Select>
              {feedbackTypes.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="反馈标题" rules={[{ required: true, message: '请输入反馈标题' }]}>
            <Input placeholder="简要描述您的问题或建议" maxLength={100} showCount />
          </Form.Item>
          <Form.Item name="description" label="详细描述" rules={[{ required: true, message: '请详细描述' }]}>
            <TextArea rows={6} placeholder="请详细描述您遇到的问题、建议或表扬内容..." maxLength={2000} showCount />
          </Form.Item>
          <Form.Item name="contact" label="其他联系方式（选填）">
            <Input placeholder="如：邮箱、微信等" />
          </Form.Item>
          <div className="flex gap-3">
            <Button type="primary" htmlType="submit" loading={submitting} icon={<FormOutlined />} size="large">
              提交反馈
            </Button>
            <Button onClick={() => form.resetFields()} size="large">重置</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CitizenFeedback;
