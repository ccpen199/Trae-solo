import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  Input,
  Upload,
  Button,
  message,
  Space,
  Row,
  Col,
  Descriptions,
  Divider,
  Alert,
  Tag,
  Typography,
  Modal,
} from 'antd';
import {
  UploadOutlined,
  SendOutlined,
  PaperClipOutlined,
  FileOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { taskApi, submissionApi } from '@/api';
import type { Task, Submission } from '@/types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const OpsSubmission: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [fileList, setFileList] = useState<UploadProps['fileList']>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await taskApi.getProviderTasks({ status: 'in_progress' });
      setTasks(data.list || []);
    } catch (error) {
      message.error('加载办件列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskChange = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setSelectedTask(task || null);
    form.setFieldsValue({ taskId, version: '1.0' });

    if (taskId) {
      try {
        const submissions = await submissionApi.getSubmissions({ taskId });
        if (submissions.list && submissions.list.length > 0) {
          const last = submissions.list[0];
          setLastSubmission(last);
          const versionNum = parseFloat(last.version || '1.0') + 0.1;
          form.setFieldsValue({ version: versionNum.toFixed(1) });
        }
      } catch (error) {
        console.error('加载历史稿件失败');
      }
    }
  };

  const uploadProps: UploadProps = {
    fileList,
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    beforeUpload: () => false,
    multiple: true,
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const formData = new FormData();
      formData.append('taskId', values.taskId);
      formData.append('version', values.version);
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('changelog', values.changelog || '');

      fileList?.forEach((file, index) => {
        if (file.originFileObj) {
          formData.append(`files[${index}]`, file.originFileObj);
        }
      });

      await submissionApi.createSubmission(formData);
      setShowSuccess(true);
      form.resetFields();
      setFileList([]);
      setSelectedTask(null);
      setLastSubmission(null);
      message.success('稿件提交成功！');
    } catch (error) {
      message.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={3} style={{ margin: 0 }}>稿件提交</Title>
        <Text type="secondary">按时提交高质量的作品，获得客户好评</Text>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card title="提交稿件" loading={loading}>
            <Alert
              message="提交须知"
              description={
                <ul className="m-0 pl-4">
                  <li>请确保作品符合办件需求和交付标准</li>
                  <li>每个版本请填写清晰的版本说明和变更记录</li>
                  <li>支持多文件上传，单个文件不超过 500MB</li>
                  <li>提交后雇主将在 3 个工作日内完成评审</li>
                </ul>
              }
              type="info"
              showIcon
              className="mb-6"
            />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{ version: '1.0' }}
            >
              <Form.Item
                name="taskId"
                label="选择办件"
                rules={[{ required: true, message: '请选择要提交的办件' }]}
              >
                <Select
                  placeholder="请选择进行中的办件"
                  onChange={handleTaskChange}
                  showSearch
                  optionFilterProp="children"
                >
                  {tasks.map(task => (
                    <Option key={task.id} value={task.id}>
                      {task.title}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {selectedTask && (
                <Descriptions
                  bordered
                  column={2}
                  className="mb-6 bg-gray-50 p-4 rounded-lg"
                >
                  <Descriptions.Item label="办件编号">{selectedTask.taskNo}</Descriptions.Item>
                  <Descriptions.Item label="截止日期">
                    {dayjs(selectedTask.deadline).format('YYYY-MM-DD')}
                  </Descriptions.Item>
                  <Descriptions.Item label="办件预算" span={2}>
                    ¥{selectedTask.budgetMin.toLocaleString('zh-CN')} - ¥{selectedTask.budgetMax.toLocaleString('zh-CN')}
                  </Descriptions.Item>
                  <Descriptions.Item label="需求描述" span={2}>
                    <Text ellipsis={{ rows: 2 }}>{selectedTask.description}</Text>
                  </Descriptions.Item>
                </Descriptions>
              )}

              {lastSubmission && (
                <Alert
                  message={`上一版本：v${lastSubmission.version} - ${lastSubmission.title}`}
                  description={
                    <div>
                      <Paragraph className="m-0">提交时间：{dayjs(lastSubmission.createdAt).format('YYYY-MM-DD HH:mm')}</Paragraph>
                      <Paragraph className="m-0">
                        状态：
                        <Tag color={
                          lastSubmission.status === 'approved' ? 'success' :
                          lastSubmission.status === 'rejected' ? 'error' :
                          lastSubmission.status === 'revision_requested' ? 'warning' : 'processing'
                        }>
                          {
                            lastSubmission.status === 'approved' ? '已通过' :
                            lastSubmission.status === 'rejected' ? '已拒绝' :
                            lastSubmission.status === 'revision_requested' ? '需修改' :
                            lastSubmission.status === 'reviewing' ? '评审中' : '待评审'
                          }
                        </Tag>
                      </Paragraph>
                    </div>
                  }
                  type={lastSubmission.status === 'approved' ? 'success' : lastSubmission.status === 'rejected' ? 'error' : 'warning'}
                  showIcon
                  className="mb-6"
                />
              )}

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="version"
                    label="版本号"
                    rules={[{ required: true, message: '请输入版本号' }]}
                  >
                    <Input placeholder="例如：1.0" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="title"
                    label="版本标题"
                    rules={[{ required: true, message: '请输入版本标题' }]}
                  >
                    <Input placeholder="简要描述本版本内容" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="description"
                label="作品说明"
                rules={[{ required: true, message: '请输入作品说明' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="详细描述作品的设计思路、功能特点、使用说明等"
                  showCount
                  maxLength={2000}
                />
              </Form.Item>

              <Form.Item
                name="changelog"
                label="变更记录"
                help="如果是修订版本，请详细说明修改内容"
              >
                <TextArea
                  rows={3}
                  placeholder="例如：1. 修复了XX问题；2. 优化了XX功能；3. 添加了XX特性"
                  showCount
                  maxLength={1000}
                />
              </Form.Item>

              <Form.Item
                label="上传作品"
                name="files"
                rules={[{ required: true, message: '请上传作品文件' }]}
              >
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />}>选择文件</Button>
                </Upload>
                <Text type="secondary" className="block mt-2">
                  <PaperClipOutlined /> 支持 .zip, .rar, .psd, .ai, .sketch, .fig, .mp4, .mov, .doc, .pdf 等格式
                </Text>
              </Form.Item>

              {fileList && fileList.length > 0 && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <Text strong className="block mb-2">
                    已选择 {fileList.length} 个文件：
                  </Text>
                  {fileList.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 py-1">
                      <FileOutlined className="text-blue-600" />
                      <Text>{file.name}</Text>
                      <Text type="secondary" className="text-sm">
                        ({file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : '未知大小'})
                      </Text>
                    </div>
                  ))}
                </div>
              )}

              <Form.Item className="mb-0">
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SendOutlined />}
                    loading={submitting}
                  >
                    提交稿件
                  </Button>
                  <Button
                    onClick={() => {
                      form.resetFields();
                      setFileList([]);
                      setSelectedTask(null);
                      setLastSubmission(null);
                    }}
                  >
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="提交指南">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <Text strong>选择办件</Text>
                  <Text type="secondary" className="block">从进行中的办件列表选择要提交的办件</Text>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <Text strong>填写信息</Text>
                  <Text type="secondary" className="block">设置版本号、标题和详细的作品说明</Text>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <Text strong>上传作品</Text>
                  <Text type="secondary" className="block">上传完整的作品文件，确保质量达标</Text>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <Text strong>等待评审</Text>
                  <Text type="secondary" className="block">雇主将在3个工作日内完成评审并反馈</Text>
                </div>
              </div>
            </div>

            <Divider />

            <div className="text-center">
              <CheckCircleOutlined className="text-4xl text-green-500 mb-2" />
              <Text strong className="block">质量保障</Text>
              <Text type="secondary" className="block text-sm">
                每次提交都会自动进行知识产权存证，保障您的创作权益
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="提交成功"
        open={showSuccess}
        onCancel={handleCloseSuccess}
        footer={[
          <Button key="close" onClick={handleCloseSuccess}>
            关闭
          </Button>,
          <Button key="view" type="primary" onClick={handleCloseSuccess}>
            查看稿件状态
          </Button>,
        ]}
      >
        <div className="text-center py-4">
          <CheckCircleOutlined className="text-6xl text-green-500 mb-4" />
          <Title level={4}>稿件提交成功！</Title>
          <Text type="secondary" className="block">
            您的作品已成功提交，雇主将在 3 个工作日内完成评审
          </Text>
          <Divider />
          <div className="text-left">
            <Alert
              message="温馨提示"
              description={
                <ul className="m-0 pl-4">
                  <li>您可以在"办件管理"中查看稿件状态</li>
                  <li>如果需要修改，可在评审前重新提交新版本</li>
                  <li>作品已自动进行知识产权存证</li>
                </ul>
              }
              type="info"
              showIcon
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OpsSubmission;
