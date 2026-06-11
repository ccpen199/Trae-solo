import React, { useState } from 'react';
import {
  Card,
  Steps,
  Form,
  Input,
  Button,
  Select,
  Slider,
  Upload,
  List,
  Tag,
  Space,
  Modal,
  Result,
  Divider,
  InputNumber,
  DatePicker,
  message,
  Spin,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined,
  AntDesignOutlined,
  CodeOutlined,
  EditOutlined,
  RiseOutlined,
  VideoCameraOutlined,
  BulbOutlined,
  CopyOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { TaskCategory, TaskPublishResult, Milestone } from '@/types';
import { taskApi } from '@/api';
import dayjs from 'dayjs';

const { Step } = Steps;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const formatCurrency = (value: number) => {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const categories = [
  { id: '政务办事', name: '政务办事', nameEn: 'Gov Affairs', icon: <AntDesignOutlined />, description: '行政审批、证件办理、政策咨询等', taskCount: 12580, color: 'magenta' },
  { id: '民生服务', name: '民生服务', nameEn: 'Livelihood', icon: <CodeOutlined />, description: '社保医保、住房保障、就业创业等', taskCount: 18920, color: 'blue' },
  { id: '社区治理', name: '社区治理', nameEn: 'Community', icon: <EditOutlined />, description: '物业管理、邻里纠纷、社区活动等', taskCount: 9650, color: 'green' },
  { id: '市场监管', name: '市场监管', nameEn: 'Market Reg', icon: <RiseOutlined />, description: '消费维权、企业登记、质量监督等', taskCount: 7820, color: 'orange' },
  { id: '公共安全', name: '公共安全', nameEn: 'Public Safety', icon: <VideoCameraOutlined />, description: '治安管理、应急管理、消防检查等', taskCount: 8450, color: 'red' },
  { id: '数据分析', name: '数据分析', nameEn: 'Data Analysis', icon: <BulbOutlined />, description: '数据采集、统计分析、决策支持等', taskCount: 5680, color: 'purple' }
];

const skillsMap: Record<string, string[]> = {
  '政务办事': ['行政审批', '证件办理', '政策解读', '法律咨询', '税务办理', '社保转移', '公积金', '户籍管理', '出入境', '婚姻登记'],
  '民生服务': ['社保医保', '住房保障', '就业创业', '养老服务', '助残服务', '教育服务', '医疗健康', '文化体育', '公共交通', '环保服务'],
  '社区治理': ['物业管理', '邻里纠纷', '社区活动', '志愿服务', '垃圾分类', '停车管理', '安全巡查', '便民服务', '居民自治', '信息公开'],
  '市场监管': ['消费维权', '企业登记', '质量监督', '价格监管', '食品安全', '药品监管', '知识产权', '广告监管', '电商监管', '信用评价'],
  '公共安全': ['治安管理', '应急管理', '消防检查', '交通管理', '网络安全', '反诈宣传', '疫情防控', '防灾减灾', '安全生产', '危险品管理'],
  '数据分析': ['数据采集', '统计分析', '决策支持', '趋势预测', '报告编制', '可视化', '指标体系', '数据治理', '信息共享', '智慧城市']
};

const PlatformTaskPublish: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [publishResult, setPublishResult] = useState<TaskPublishResult | null>(null);
  const [form] = Form.useForm();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [deliveryStandards, setDeliveryStandards] = useState<string[]>([]);
  const [standardInput, setStandardInput] = useState('');

  const handleNext = async () => {
    try {
      const fieldsToValidate = currentStep === 0
        ? ['category']
        : currentStep === 1
        ? ['title', 'description', 'skills']
        : ['budgetMin', 'budgetMax', 'deadline', 'deliveryDays'];

      await form.validateFields(fieldsToValidate);

      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCategorySelect = (category: TaskCategory) => {
    form.setFieldsValue({ category });
  };

  const handleAddMilestone = () => {
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      name: '',
      description: '',
      amount: 0,
      deadline: dayjs().add(7, 'day').format('YYYY-MM-DD'),
      status: 'pending'
    };
    setMilestones([...milestones, newMilestone]);
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const handleMilestoneChange = (id: string, field: keyof Milestone, value: any) => {
    setMilestones(milestones.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const handleAddStandard = () => {
    if (standardInput.trim()) {
      setDeliveryStandards([...deliveryStandards, standardInput.trim()]);
      setStandardInput('');
    }
  };

  const handleRemoveStandard = (index: number) => {
    setDeliveryStandards(deliveryStandards.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      const allFields = await form.validateFields();
      setSubmitting(true);

      const selectedCat = categories.find(c => c.id === allFields.category);
      const taskData = {
        category: selectedCat?.name || allFields.category,
        title: allFields.title,
        description: allFields.description,
        skillsRequired: allFields.skills || [],
        budgetMin: allFields.budgetMin || 0,
        budgetMax: allFields.budgetMax || 0,
        deadline: allFields.deadline ? dayjs(allFields.deadline).format('YYYY-MM-DD') : dayjs().add(30, 'day').format('YYYY-MM-DD'),
        deliveryDays: allFields.deliveryDays || 30,
        attachments: []
      };

      const result = await taskApi.create(taskData) as any;
      setPublishResult({
        taskId: result.id || result.taskId,
        taskNo: result.requestNo || result.taskNo || '',
        submittedAt: result.createdAt || new Date().toISOString(),
        auditStatus: 'pending',
        estimatedAuditTime: '1-3个工作日',
        trackingUrl: `/platform/tasks/${result.id || result.taskId}`
      });
      message.success('办件提交成功，受理单已生成');
      setCurrentStep(4);
    } catch (error: any) {
      const errMsg = error?.message || '提交办理失败';
      if (errMsg.includes('Network Error') || errMsg.includes('网络')) {
        message.error('网络连接失败，请检查网络后重试');
      } else {
        message.error(errMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="py-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">选择办件类型</h3>
            <p className="text-gray-500 text-center mb-8">请选择您需要的服务类型</p>
            <Row gutter={[16, 16]}>
              {categories.map(cat => (
                <Col xs={24} sm={12} lg={8} key={cat.id}>
                  <Card
                    hoverable
                    className={`card-hover h-full ${form.getFieldValue('category') === cat.id ? 'ring-2 ring-primary-500' : ''}`}
                    onClick={() => handleCategorySelect(cat.id as TaskCategory)}
                  >
                    <div className="flex flex-col items-center text-center p-4">
                      <div className={`text-4xl text-${cat.color}-500 mb-3`}>
                        {cat.icon}
                      </div>
                      <h4 className="text-lg font-bold text-gray-800 mb-1">{cat.name}</h4>
                      <p className="text-xs text-gray-400 mb-2">{cat.nameEn}</p>
                      <p className="text-sm text-gray-500 mb-3">{cat.description}</p>
                      <Tag color="blue">{cat.taskCount}+ 办件</Tag>
                      {form.getFieldValue('category') === cat.id && (
                        <div className="mt-3">
                          <Tag color="green" icon={<CheckOutlined />}>已选择</Tag>
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        );

      case 1:
        const selectedCategory = form.getFieldValue('category');
        return (
          <div className="py-6 max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">填写办件需求</h3>
            <p className="text-gray-500 text-center mb-6">请详细描述您的需求，以便服务商更好地理解</p>

            <Form form={form} layout="vertical">
              <Form.Item
                name="category"
                hidden
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="title"
                label="办件标题"
                rules={[{ required: true, message: '请输入办件标题' }]}
              >
                <Input
                  placeholder="请输入简洁明了的办件标题，例如：社保转移办理"

                  maxLength={100}
                  showCount
                />
              </Form.Item>

              <Form.Item
                name="description"
                label="办件描述"
                rules={[{ required: true, message: '请输入办件描述' }]}
              >
                <TextArea
                  placeholder="请详细描述您的需求，包括背景、目标、要求等..."
                  rows={6}
                  maxLength={2000}
                  showCount
                />
              </Form.Item>

              <Form.Item
                name="skills"
                label="专长要求"
                rules={[{ required: true, message: '请选择专长要求' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="选择需要的专长"

                  options={skillsMap[selectedCategory]?.map(skill => ({ label: skill, value: skill })) || []}
                  maxTagCount={5}
                />
              </Form.Item>

              <Form.Item
                label="参考资料"
                name="attachments"
              >
                <Upload
                  multiple
                  beforeUpload={() => false}
                  maxCount={10}
                >
                  <Button icon={<UploadOutlined />}>上传文件</Button>
                </Upload>
              </Form.Item>
            </Form>
          </div>
        );

      case 2:
        return (
          <div className="py-6 max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">设置预算和周期</h3>
            <p className="text-gray-500 text-center mb-6">设置合理的预算和交付周期，吸引优质服务商</p>

            <Form form={form} layout="vertical">
              <Card title="预算设置" className="mb-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">预算范围</span>
                    <span className="text-xl font-bold text-primary-700">
                      ¥{formatCurrency(form.getFieldValue('budgetMin') || 0)} - ¥{formatCurrency(form.getFieldValue('budgetMax') || 10000)}
                    </span>
                  </div>
                  <Form.Item name={['budgetMin', 'budgetMax']} noStyle>
                    <Slider
                      range
                      min={500}
                      max={200000}
                      step={500}
                      defaultValue={[2000, 10000]}
                      tooltip={{ formatter: (value) => `¥${value?.toLocaleString()}` }}
                      marks={{
                        500: '¥500',
                        10000: '¥10,000',
                        50000: '¥50,000',
                        100000: '¥100,000',
                        200000: '¥200,000'
                      }}
                    />
                  </Form.Item>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Form.Item
                    name="budgetMin"
                    label="最低预算"
                    rules={[{ required: true, message: '请输入最低预算' }]}
                  >
                    <InputNumber
                      min={500}
                      max={200000}
                      step={500}
                      prefix="¥"

                      className="w-full"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                  </Form.Item>
                  <Form.Item
                    name="budgetMax"
                    label="最高预算"
                    rules={[{ required: true, message: '请输入最高预算' }]}
                  >
                    <InputNumber
                      min={500}
                      max={200000}
                      step={500}
                      prefix="¥"

                      className="w-full"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                  </Form.Item>
                </div>
              </Card>

              <Card title="时间设置" className="mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <Form.Item
                    name="deadline"
                    label="投标截止日期"
                    rules={[{ required: true, message: '请选择投标截止日期' }]}
                  >
                    <DatePicker

                      className="w-full"
                      disabledDate={(current) => current && current < dayjs().startOf('day')}
                    />
                  </Form.Item>
                  <Form.Item
                    name="deliveryDays"
                    label="预计交付天数"
                    rules={[{ required: true, message: '请输入预计交付天数' }]}
                  >
                    <InputNumber
                      min={1}
                      max={365}

                      className="w-full"
                      addonAfter="天"
                    />
                  </Form.Item>
                </div>
              </Card>

              <Card
                title="里程碑配置（可选）"
                extra={
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={handleAddMilestone}

                  >
                    添加里程碑
                  </Button>
                }
              >
                {milestones.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">暂无里程碑，点击上方按钮添加</p>
                ) : (
                  <div className="space-y-4">
                    {milestones.map((milestone, index) => (
                      <div key={milestone.id} className="p-4 bg-gray-50 rounded-lg relative">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}

                          className="absolute top-2 right-2"
                          onClick={() => handleRemoveMilestone(milestone.id)}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">里程碑名称</label>
                            <Input
                              value={milestone.name}
                              onChange={(e) => handleMilestoneChange(milestone.id, 'name', e.target.value)}
                              placeholder={`例如：第 ${index + 1} 阶段交付`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">金额</label>
                            <InputNumber
                              value={milestone.amount}
                              onChange={(value) => handleMilestoneChange(milestone.id, 'amount', value || 0)}
                              min={0}
                              prefix="¥"
                              className="w-full"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-sm text-gray-600 mb-1">描述</label>
                            <Input
                              value={milestone.description}
                              onChange={(e) => handleMilestoneChange(milestone.id, 'description', e.target.value)}
                              placeholder="描述此阶段需要完成的内容"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Form>
          </div>
        );

      case 3:
        const formData = form.getFieldsValue();
        return (
          <div className="py-6 max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">确认发布信息</h3>
            <p className="text-gray-500 text-center mb-6">请确认以下信息无误后提交发布</p>

            <Card className="mb-6">
              <div className="space-y-4">
                <div>
                  <span className="text-gray-500">办件类型：</span>
                  <span className="text-gray-800 font-medium">
                    {categories.find(c => c.id === formData.category)?.name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">办件标题：</span>
                  <span className="text-gray-800 font-medium">{formData.title}</span>
                </div>
                <div>
                  <span className="text-gray-500">办件描述：</span>
                  <p className="text-gray-600 mt-1 whitespace-pre-wrap">{formData.description}</p>
                </div>
                <div>
                  <span className="text-gray-500">技能要求：</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.skills?.map((skill: string, index: number) => (
                      <Tag key={index}>{skill}</Tag>
                    ))}
                  </div>
                </div>
                <Divider className="my-4" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">费用标准：</span>
                    <span className="text-gray-800 font-medium">
                      ¥{formatCurrency(formData.budgetMin)} - ¥{formatCurrency(formData.budgetMax)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">申请截止：</span>
                    <span className="text-gray-800 font-medium">
                      {dayjs(formData.deadline).format('YYYY-MM-DD')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">预计交付：</span>
                    <span className="text-gray-800 font-medium">{formData.deliveryDays} 天</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card
              title="交付标准定义"
              className="mb-6"
              extra={
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={handleAddStandard}

                >
                  添加标准
                </Button>
              }
            >
              <div className="flex gap-2 mb-4">
                <Input
                  value={standardInput}
                  onChange={(e) => setStandardInput(e.target.value)}
                  placeholder="例如：审批文件、办理回执、结果通知等"
                  onPressEnter={handleAddStandard}
                />
                <Button type="primary" onClick={handleAddStandard}>添加</Button>
              </div>
              {deliveryStandards.length > 0 && (
                <List
                  dataSource={deliveryStandards}
                  renderItem={(item, index) => (
                    <List.Item
                      actions={[
                        <Button
                          type="text"
                          danger

                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveStandard(index)}
                        />
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<CheckOutlined className="text-green-500" />}
                        title={item}
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </div>
        );

      case 4:
        return publishResult ? (
          <div className="py-12 max-w-xl mx-auto text-center">
            <Result
              status="success"
              title="办件发布成功！"
              subTitle="您的办件已成功提交，等待平台审核后将自动发布"
              extra={[
                <Button type="primary" key="view" onClick={() => navigate(`/platform/tasks/${publishResult.taskId}`)}>
                  查看办件详情
                </Button>,
                <Button key="list" onClick={() => navigate('/platform/tasks')}>
                  返回办件列表
                </Button>
              ]}
            />
            <Card className="mt-6 text-left">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileTextOutlined className="text-primary-600" />
                受理结果
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">办件编号：</span>
                  <span className="font-mono font-medium text-primary-700 flex items-center gap-1">
                    {publishResult.taskNo}
                    <Button type="text" icon={<CopyOutlined />} />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">提交时间：</span>
                  <span className="text-gray-800">
                    {dayjs(publishResult.submittedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">审核状态：</span>
                  <Tag color={publishResult.auditStatus === 'pending' ? 'warning' : publishResult.auditStatus === 'approved' ? 'success' : 'error'}>
                    {publishResult.auditStatus === 'pending' ? '待审核' : publishResult.auditStatus === 'approved' ? '已通过' : '已拒绝'}
                  </Tag>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">预计审核时间：</span>
                  <span className="text-gray-800 flex items-center gap-1">
                    <ClockCircleOutlined />
                    {publishResult.estimatedAuditTime}
                  </span>
                </div>
                <Divider className="my-3" />
                <Button
                  type="link"
                  block
                  onClick={() => navigate(`/platform/tasks/${publishResult.taskId}`)}
                  className="flex items-center justify-center gap-1"
                >
                  进入进度追踪
                  <ArrowRightOutlined />
                </Button>
              </div>
            </Card>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spin />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/platform/tasks')}
        >
          返回
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">发布新办件</h2>
          <p className="text-gray-500 mt-1">填写办件信息，寻找优质服务商</p>
        </div>
      </div>

      <Card className="card-hover">
        {currentStep < 4 && (
          <Steps current={currentStep} className="mb-8 max-w-2xl mx-auto">
            <Step title="选择类型" />
            <Step title="填写需求" />
            <Step title="设置预算" />
            <Step title="确认发布" />
          </Steps>
        )}

        <Form form={form} layout="vertical">
          {renderStepContent()}
        </Form>

        {currentStep < 4 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {currentStep > 0 ? (
              <Button
                onClick={handlePrev}
                icon={<ArrowLeftOutlined />}

              >
                上一步
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <Button
                type="primary"
                onClick={handleNext}
                icon={<ArrowRightOutlined />}

              >
                下一步
              </Button>
            ) : currentStep === 3 ? (
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={submitting}

              >
                确认发布
              </Button>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PlatformTaskPublish;
