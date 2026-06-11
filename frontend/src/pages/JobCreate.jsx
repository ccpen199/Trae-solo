import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Steps,
  Form,
  Input,
  Select,
  Button,
  InputNumber,
  Checkbox,
  Tag,
  Spin,
  message,
  Row,
  Col,
  Space,
  Alert,
  Progress,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  SafetyOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jobs, analytics } from '../api';

const { Step } = Steps;
const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const defaultBenefits = [
  '五险一金', '年终奖', '带薪年假', '节日福利', '员工旅游',
  '定期体检', '免费午餐', '交通补贴', '住房补贴', '通讯补贴',
  '弹性工作', '远程办公', '股票期权', '培训机会', '晋升空间',
];

function detectFraud(job) {
  let score = 0;
  const factors = [];

  if (job.salary_min > 0 && job.salary_max > 0) {
    const ratio = job.salary_max / job.salary_min;
    if (ratio > 3) {
      score += 25;
      factors.push('薪资范围异常，最高薪资是最低薪资的3倍以上');
    }
  }

  if (job.title && job.title.length > 50) {
    score += 10;
    factors.push('职位名称过长，可能包含关键词堆砌');
  }

  if (job.jd_content && job.jd_content.length < 50) {
    score += 30;
    factors.push('职位描述过短，信息不完整');
  }

  const keywords = ['高薪', '日结', '兼职', '刷单', '在家办公', '无需经验'];
  keywords.forEach((kw) => {
    if ((job.title + job.jd_content).includes(kw)) {
      score += 15;
      factors.push(`包含高风险关键词：${kw}`);
    }
  });

  if (!job.work_address || job.work_address.length < 5) {
    score += 20;
    factors.push('工作地址不详细');
  }

  let riskLevel = 'low';
  if (score >= 50) riskLevel = 'medium';
  if (score >= 75) riskLevel = 'high';

  return { score, riskLevel, factors };
}

function JobCreate() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [tags, setTags] = useState([]);
  const [channels, setChannels] = useState([]);
  const [customBenefit, setCustomBenefit] = useState('');
  const [selectedBenefits, setSelectedBenefits] = useState([]);
  const [formValues, setFormValues] = useState({});

  const jobTypeOptions = [
    { value: 'full_time', label: '全职' },
    { value: 'part_time', label: '兼职' },
    { value: 'internship', label: '实习' },
    { value: 'contract', label: '合同' },
  ];

  const educationOptions = [
    { value: 'high_school', label: '高中及以下' },
    { value: 'college', label: '大专' },
    { value: 'bachelor', label: '本科' },
    { value: 'master', label: '硕士' },
    { value: 'doctor', label: '博士' },
  ];

  const experienceOptions = [
    { value: 'no_limit', label: '不限' },
    { value: 'fresh', label: '应届生' },
    { value: '1-3', label: '1-3年' },
    { value: '3-5', label: '3-5年' },
    { value: '5-10', label: '5-10年' },
    { value: '10+', label: '10年以上' },
  ];

  const cityOptions = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆'];
  const districtOptions = ['朝阳区', '海淀区', '浦东新区', '南山区', '天河区', '西湖区', '武侯区', '洪山区'];

  const fraudDetection = useMemo(() => {
    const values = form.getFieldsValue();
    const jobData = {
      title: values.title || '',
      jd_content: values.jd_content || '',
      salary_min: values.salary_min || 0,
      salary_max: values.salary_max || 0,
      work_address: values.work_address || '',
    };
    return detectFraud(jobData);
  }, [formValues]);

  useEffect(() => {
    if (token) {
      loadInitialData();
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const values = form.getFieldsValue();
      setFormValues(values);
    }, 300);
    return () => clearTimeout(timer);
  }, [form.getFieldsValue()]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [templatesRes, tagsRes, channelsRes] = await Promise.all([
        jobs.getTemplates(),
        jobs.getTags(),
        analytics.getChannels(),
      ]);

      if (templatesRes.code === 0) {
        const { systemTemplates = [], companyTemplates = [] } = templatesRes.data || {};
        setTemplates([...systemTemplates, ...companyTemplates]);
      }
      if (tagsRes.code === 0) {
        setTags(tagsRes.data || []);
      }
      if (channelsRes.code === 0) {
        setChannels(channelsRes.data || []);
      }

      if (editId) {
        const detailRes = await jobs.getDetail(editId);
        if (detailRes.code === 0) {
          const job = detailRes.data.job;
          form.setFieldsValue({
            title: job.title,
            department: job.department,
            job_type: job.job_type,
            work_city: job.work_city,
            work_district: job.work_district,
            work_address: job.work_address,
            longitude: job.longitude,
            latitude: job.latitude,
            jd_template_id: job.jd_template_id,
            jd_content: job.jd_content,
            competency_tags: job.competency_tags ? job.competency_tags.split(',') : [],
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            salary_negotiable: !!job.salary_negotiable,
            education: job.education,
            experience: job.experience,
            channel: job.channel,
          });
          setSelectedBenefits(job.benefits ? job.benefits.split(',') : []);
        }
      }
    } catch (err) {
      message.error('加载初始数据失败');
      console.error('加载初始数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find((t) => t.id === templateId);
    if (template && template.content) {
      form.setFieldsValue({
        jd_content: template.content,
      });
    }
  };

  const handleAddCustomBenefit = () => {
    if (customBenefit.trim() && !selectedBenefits.includes(customBenefit.trim())) {
      setSelectedBenefits([...selectedBenefits, customBenefit.trim()]);
      setCustomBenefit('');
    }
  };

  const handleBenefitChange = (benefit, checked) => {
    if (checked) {
      setSelectedBenefits([...selectedBenefits, benefit]);
    } else {
      setSelectedBenefits(selectedBenefits.filter((b) => b !== benefit));
    }
  };

  const next = async () => {
    try {
      const fieldsToValidate =
        current === 0
          ? ['title', 'department', 'job_type', 'work_city', 'work_address']
          : current === 1
          ? ['jd_content', 'competency_tags']
          : ['salary_min', 'salary_max', 'education', 'experience', 'channel'];
      await form.validateFields(fieldsToValidate);
      setCurrent(current + 1);
    } catch (err) {
      console.error('表单验证失败:', err);
    }
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      setSubmitting(true);

      const submitData = {
        ...values,
        benefits: selectedBenefits.join(','),
        salary_negotiable: values.salary_negotiable ? 1 : 0,
      };

      let res;
      if (editId) {
        res = await jobs.update(editId, submitData);
      } else {
        res = await jobs.create(submitData);
      }

      if (res.code === 0) {
        message.success(editId ? '更新成功' : '创建成功');
        navigate('/jobs');
      }
    } catch (err) {
      console.error('提交失败:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getRiskColor = (level) => {
    const colors = { low: '#52c41a', medium: '#faad14', high: '#f5222d' };
    return colors[level] || '#52c41a';
  };

  const getRiskIcon = (level) => {
    if (level === 'high') return <ExclamationCircleOutlined style={{ color: '#f5222d', fontSize: 20 }} />;
    if (level === 'medium') return <SafetyOutlined style={{ color: '#faad14', fontSize: 20 }} />;
    return <SafetyCertificateOutlined style={{ color: '#52c41a', fontSize: 20 }} />;
  };

  const getRiskText = (level) => {
    const texts = { low: '低风险', medium: '中等风险', high: '高风险' };
    return texts[level] || '低风险';
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <div>
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="title"
                  label="岗位标题"
                  rules={[{ required: true, message: '请输入岗位标题' }]}
                >
                  <Input placeholder="例如：高级前端开发工程师" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="department"
                  label="所属部门"
                  rules={[{ required: true, message: '请输入所属部门' }]}
                >
                  <Input placeholder="例如：技术部" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="job_type"
                  label="职位类型"
                  rules={[{ required: true, message: '请选择职位类型' }]}
                >
                  <Select placeholder="请选择职位类型" size="large">
                    {jobTypeOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="work_city"
                  label="工作城市"
                  rules={[{ required: true, message: '请选择工作城市' }]}
                >
                  <Select placeholder="请选择城市" size="large" showSearch>
                    {cityOptions.map((city) => (
                      <Option key={city} value={city}>
                        {city}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="work_district" label="区域">
                  <Select placeholder="请选择区域" size="large" showSearch allowClear>
                    {districtOptions.map((district) => (
                      <Option key={district} value={district}>
                        {district}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  name="work_address"
                  label="详细地址"
                  rules={[{ required: true, message: '请输入详细地址' }]}
                >
                  <Input placeholder="例如：北京市朝阳区建国路88号" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="longitude" label="经度">
                  <InputNumber placeholder="点击地图选点" style={{ width: '100%' }} size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="latitude" label="纬度">
                  <InputNumber placeholder="点击地图选点" style={{ width: '100%' }} size="large" />
                </Form.Item>
              </Col>
            </Row>
            <Card
              type="inner"
              title={
                <Space>
                  <EnvironmentOutlined />
                  <span>地图选点</span>
                </Space>
              }
            >
              <div
                style={{
                  height: 200,
                  background: '#f0f2f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  border: '2px dashed #d9d9d9',
                }}
              >
                <Text type="secondary">点击地图选择具体位置（地图组件待接入）</Text>
              </div>
            </Card>
          </div>
        );
      case 1:
        return (
          <div>
            <Form.Item name="jd_template_id" label="JD模板">
              <Select
                placeholder="选择模板快速填充"
                size="large"
                allowClear
                onSelect={handleTemplateSelect}
              >
                {templates.map((template) => (
                  <Option key={template.id} value={template.id}>
                    {template.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="jd_content"
              label="职位描述"
              rules={[{ required: true, message: '请输入职位描述' }]}
            >
              <TextArea
                rows={10}
                placeholder="请输入职位描述，包括岗位职责、任职要求等"
                showCount
                maxLength={5000}
              />
            </Form.Item>

            <Form.Item
              name="competency_tags"
              label="胜任力标签"
              rules={[{ required: true, message: '请选择胜任力标签' }]}
            >
              <Select
                mode="multiple"
                placeholder="请选择胜任力标签"
                size="large"
                style={{ width: '100%' }}
              >
                {tags.map((tag) => (
                  <Option key={tag.id} value={tag.name}>
                    {tag.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ marginBottom: 8, display: 'block' }}>
                福利待遇
              </Text>
              <Space wrap>
                {defaultBenefits.map((benefit) => (
                  <Checkbox
                    key={benefit}
                    checked={selectedBenefits.includes(benefit)}
                    onChange={(e) => handleBenefitChange(benefit, e.target.checked)}
                  >
                    {benefit}
                  </Checkbox>
                ))}
              </Space>
              {selectedBenefits
                .filter((b) => !defaultBenefits.includes(b))
                .map((benefit) => (
                  <Tag
                    key={benefit}
                    closable
                    onClose={() => handleBenefitChange(benefit, false)}
                    color="blue"
                    style={{ marginTop: 8 }}
                  >
                    {benefit}
                  </Tag>
                ))}
              <div style={{ marginTop: 12 }}>
                <Space.Compact>
                  <Input
                    placeholder="自定义福利"
                    value={customBenefit}
                    onChange={(e) => setCustomBenefit(e.target.value)}
                    onPressEnter={handleAddCustomBenefit}
                    style={{ width: 200 }}
                  />
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCustomBenefit}>
                    添加
                  </Button>
                </Space.Compact>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <Alert
              message={
                <Space>
                  {getRiskIcon(fraudDetection.riskLevel)}
                  <span>
                    虚假职位检测：<strong style={{ color: getRiskColor(fraudDetection.riskLevel) }}>
                      {getRiskText(fraudDetection.riskLevel)}
                    </strong>
                  </span>
                </Space>
              }
              description={
                <div>
                  <Progress
                    percent={fraudDetection.score}
                    strokeColor={getRiskColor(fraudDetection.riskLevel)}
                    showInfo={true}
                    format={(percent) => `风险评分: ${percent}`}
                  />
                  {fraudDetection.factors.length > 0 && (
                    <ul style={{ marginTop: 8, marginBottom: 0 }}>
                      {fraudDetection.factors.map((factor, idx) => (
                        <li key={idx} style={{ color: '#faad14' }}>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              }
              type={fraudDetection.riskLevel === 'high' ? 'error' : fraudDetection.riskLevel === 'medium' ? 'warning' : 'success'}
              showIcon={false}
              style={{ marginBottom: 24 }}
            />

            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Form.Item
                  name="salary_min"
                  label="最低薪资 (K)"
                  rules={[{ required: true, message: '请输入最低薪资' }]}
                >
                  <InputNumber min={0} placeholder="例如：15" style={{ width: '100%' }} size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="salary_max"
                  label="最高薪资 (K)"
                  rules={[{ required: true, message: '请输入最高薪资' }]}
                >
                  <InputNumber min={0} placeholder="例如：25" style={{ width: '100%' }} size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="salary_negotiable" label="薪资面议" valuePropName="checked">
                  <Checkbox size="large">面议</Checkbox>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="education"
                  label="学历要求"
                  rules={[{ required: true, message: '请选择学历要求' }]}
                >
                  <Select placeholder="请选择学历要求" size="large">
                    {educationOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="experience"
                  label="经验要求"
                  rules={[{ required: true, message: '请选择经验要求' }]}
                >
                  <Select placeholder="请选择经验要求" size="large">
                    {experienceOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  name="channel"
                  label="招聘渠道"
                  rules={[{ required: true, message: '请选择招聘渠道' }]}
                >
                  <Select placeholder="请选择招聘渠道" size="large">
                    {channels.map((channel) => (
                      <Option key={channel.code} value={channel.code}>
                        {channel.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/jobs')}>
              返回
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              {editId ? '编辑岗位' : '创建岗位'}
            </Title>
          </Space>
        </div>

        <Steps current={current} style={{ marginBottom: 32 }}>
          <Step title="基本信息" description="岗位基础信息" />
          <Step title="JD内容" description="职位描述与标签" />
          <Step title="薪资配置" description="薪资与要求" />
        </Steps>

        <Form
          form={form}
          layout="vertical"
          onValuesChange={() => {
            const values = form.getFieldsValue();
            setFormValues(values);
          }}
        >
          {renderStepContent(current)}

          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <Space>
              {current > 0 && (
                <Button size="large" onClick={prev}>
                  上一步
                </Button>
              )}
              {current < 2 ? (
                <Button type="primary" size="large" onClick={next}>
                  下一步
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={fraudDetection.riskLevel === 'high'}
                >
                  {editId ? '保存修改' : '创建岗位'}
                </Button>
              )}
            </Space>
            {current === 2 && fraudDetection.riskLevel === 'high' && (
              <div style={{ marginTop: 12 }}>
                <Text type="danger">职位风险过高，请修改后再提交</Text>
              </div>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default JobCreate;
