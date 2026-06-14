import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Tabs,
  Row,
  Col,
  Select,
  InputNumber,
  Checkbox,
  Space,
  Alert,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { jobs } from '../../api/endpoints';
import { findSensitiveWords, highlightSensitiveWords } from '../../utils/sensitive.tsx';
import type { Job, SkillCategory } from '../../types';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface JobFormData {
  title: string;
  department?: string;
  salaryMin?: number;
  salaryMax?: number;
  workLocation?: string;
  jobType?: string;
  processRequirements?: {
    printingMethod?: string;
    colorGroupRequirement?: string;
    precisionRequirement?: string;
    printingSpeed?: string;
  };
  equipmentModels?: {
    heidelberg?: string[];
    komori?: string[];
    roland?: string[];
    gaobao?: string[];
    mitsubishi?: string[];
    other?: string[];
  };
  materialStandards?: {
    paperType?: string;
    inkStandard?: string;
    laminationRequirement?: string;
    gildingProcess?: string;
  };
  requiredSkills?: string[];
  experienceYears?: string;
  education?: string;
  description?: string;
  status: string;
}

const printingMethods = ['胶印', '凹印', '柔印', '丝网印刷', '数码印刷', '移印'];
const colorGroupOptions = ['单色', '双色', '四色', '五色', '六色', '七色及以上'];
const precisionOptions = ['±0.05mm', '±0.1mm', '±0.15mm', '±0.2mm', '±0.3mm'];
const speedOptions = ['5000张/小时以下', '5000-10000张/小时', '10000-15000张/小时', '15000张/小时以上'];

const equipmentOptions = {
  heidelberg: ['海德堡 Speedmaster XL 106', '海德堡 Speedmaster CD 102', '海德堡 Speedmaster SM 74', '海德堡 XL 75', '海德堡 GTO 52'],
  komori: ['小森 Lithrone G40', '小森 Lithrone S40', '小森 Enthrone 29', '小森 Spica 29', '小森 LS 440'],
  roland: ['罗兰 700', '罗兰 900', '罗兰 500', '罗兰 R 700', '罗兰 R 900'],
  gaobao: ['高宝 Rapida 106', '高宝 Rapida 105', '高宝 Rapida 75', '高宝 Rapida 145', '高宝 Rapida 164'],
  mitsubishi: ['三菱 Diamond 3000', '三菱 Diamond 1000', '三菱 V3000', '三菱 D3000', '三菱 H-UV'],
  other: ['其他国产设备', '其他进口设备'],
};

const paperOptions = ['铜版纸', '胶版纸', '白卡纸', '牛皮纸', '特种纸', '瓦楞纸', '金银卡纸'];
const inkOptions = ['水性油墨', '溶剂油墨', 'UV油墨', 'EB油墨', '大豆油墨'];
const laminationOptions = ['光膜', '哑膜', '触感膜', '防刮膜', '镭射膜'];
const gildingOptions = ['普通烫金', '全息烫金', '击凸烫金', '冷烫', '烫银', '镭射烫金'];

const skillCategories: { category: SkillCategory; label: string; skills: string[] }[] = [
  {
    category: 'prepress',
    label: '印前技能',
    skills: ['PS排版', 'AI设计', 'CDR绘图', 'InDesign排版', '色彩管理', 'CTP制版', '数码打样', '拼版'],
  },
  {
    category: 'printing',
    label: '印中技能',
    skills: ['海德堡操作', '小森操作', '罗兰操作', '高宝操作', '三菱操作', '凹印机操作', '柔印机操作', '丝网印刷'],
  },
  {
    category: 'postpress',
    label: '印后技能',
    skills: ['模切', '烫金', '覆膜', 'UV上光', '裱糊', '装订', '糊盒', '品检'],
  },
  {
    category: 'management',
    label: '管理技能',
    skills: ['生产管理', '质量管理', 'ISO体系', '设备维护', '团队管理', '成本控制', '工艺改进', '安全管理'],
  },
];

const experienceOptions = ['不限', '1-3年', '3-5年', '5-10年', '10年以上'];
const educationOptions = ['不限', '高中及以下', '中专', '大专', '本科', '硕士及以上'];
const jobTypeOptions = ['全职', '兼职', '实习', '临时'];

const JobForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm<JobFormData>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sensitiveWarnings, setSensitiveWarnings] = useState<Array<{ field: string; word: string; riskLevel: string }>>([]);

  const isEdit = !!id && id !== 'new';

  useEffect(() => {
    if (isEdit) {
      fetchJobDetail();
    }
  }, [id]);

  const fetchJobDetail = async () => {
    if (!id || id === 'new') return;
    setLoading(true);
    try {
      const job = await jobs.getDetail(parseInt(id));
      form.setFieldsValue({
        title: job.title,
        department: job.department,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        workLocation: job.workLocation,
        jobType: job.jobType,
        processRequirements: job.processRequirements,
        equipmentModels: job.equipmentModels,
        materialStandards: job.materialStandards,
        requiredSkills: job.requiredSkills,
        experienceYears: job.experienceYears,
        education: job.education,
        description: job.description,
        status: job.status,
      });
      checkSensitiveWords(job);
    } catch (error) {
      console.error('Failed to fetch job detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSensitiveWords = (data: Partial<JobFormData>) => {
    const warnings: Array<{ field: string; word: string; riskLevel: string }> = [];
    const fieldsToCheck: Array<{ key: keyof JobFormData | string; label: string; value: any }> = [
      { key: 'title', label: '岗位名称', value: data.title },
      { key: 'description', label: '岗位描述', value: data.description },
    ];

    fieldsToCheck.forEach(({ label, value }) => {
      if (typeof value === 'string') {
        const found = findSensitiveWords(value);
        found.forEach((item) => {
          warnings.push({
            field: label,
            word: item.word,
            riskLevel: item.riskLevel,
          });
        });
      }
    });

    setSensitiveWarnings(warnings);
  };

  const handleValuesChange = (_: any, allValues: JobFormData) => {
    checkSensitiveWords(allValues);
  };

  const handleSubmit = async (values: JobFormData) => {
    setSubmitting(true);
    try {
      if (isEdit && id) {
        await jobs.update(parseInt(id), values);
        message.success('岗位更新成功');
      } else {
        await jobs.create(values);
        message.success('岗位创建成功');
      }
      navigate('/enterprise/jobs');
    } catch (error) {
      console.error('Failed to save job:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields();
      values.status = 'draft';
      await handleSubmit(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handlePublish = async () => {
    try {
      const values = await form.validateFields();
      values.status = 'active';
      await handleSubmit(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <div>
      <Space align="center" style={{ marginBottom: '24px' }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/enterprise/jobs')}
        >
          返回
        </Button>
        <Title level={3} style={{ margin: 0 }}>
          {isEdit ? '编辑岗位' : '新增岗位'}
        </Title>
      </Space>

      {sensitiveWarnings.length > 0 && (
        <Alert
          message="敏感词提醒"
          description={
            <div>
              {sensitiveWarnings.map((w, idx) => (
                <div key={idx}>
                  <WarningOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                  <span style={{ marginRight: '8px' }}>[{w.field}]</span>
                  {highlightSensitiveWords(w.word)}
                  <span style={{ marginLeft: '8px', color: '#8c8c8c' }}>
                    (风险等级: {w.riskLevel === 'high' ? '高' : w.riskLevel === 'medium' ? '中' : '低'})
                  </span>
                </div>
              ))}
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={handleValuesChange}
        initialValues={{ status: 'draft' }}
        loading={loading}
      >
        <Card>
          <Tabs defaultActiveKey="basic">
            <TabPane tab="基本信息" key="basic">
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="title"
                    label="岗位名称"
                    rules={[{ required: true, message: '请输入岗位名称' }]}
                  >
                    <Input placeholder="如：海德堡印刷机机长" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="department" label="所属部门">
                    <Input placeholder="如：印刷部" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="salaryMin" label="最低薪资 (K)">
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="如：15" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="salaryMax" label="最高薪资 (K)">
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="如：25" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="jobType" label="招聘类型">
                    <Select placeholder="请选择">
                      {jobTypeOptions.map((opt) => (
                        <Option key={opt} value={opt}>
                          {opt}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="workLocation" label="工作地点">
                    <Input placeholder="如：上海市浦东新区" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="status" label="状态">
                    <Select>
                      <Option value="draft">草稿</Option>
                      <Option value="active">招聘中</Option>
                      <Option value="paused">已暂停</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>

            <TabPane tab="工艺要求" key="process">
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item name={['processRequirements', 'printingMethod']} label="印刷方式">
                    <Select placeholder="请选择" mode="multiple">
                      {printingMethods.map((opt) => (
                        <Option key={opt} value={opt}>
                          {opt}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={['processRequirements', 'colorGroupRequirement']} label="色组要求">
                    <Select placeholder="请选择">
                      {colorGroupOptions.map((opt) => (
                        <Option key={opt} value={opt}>
                          {opt}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={['processRequirements', 'precisionRequirement']} label="精度要求">
                    <Select placeholder="请选择">
                      {precisionOptions.map((opt) => (
                        <Option key={opt} value={opt}>
                          {opt}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={['processRequirements', 'printingSpeed']} label="印刷速度要求">
                    <Select placeholder="请选择">
                      {speedOptions.map((opt) => (
                        <Option key={opt} value={opt}>
                          {opt}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>

            <TabPane tab="设备型号" key="equipment">
              <Row gutter={24}>
                <Col span={24}>
                  <Typography.Text strong>请选择需要的设备操作经验：</Typography.Text>
                </Col>
                <Col span={12}>
                  <Form.Item name={['equipmentModels', 'heidelberg']} label="海德堡">
                    <Checkbox.Group options={equipmentOptions.heidelberg} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={['equipmentModels', 'komori']} label="小森">
                    <Checkbox.Group options={equipmentOptions.komori} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={['equipmentModels', 'roland']} label="罗兰">
                    <Checkbox.Group options={equipmentOptions.roland} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={['equipmentModels', 'gaobao']} label="高宝">
                    <Checkbox.Group options={equipmentOptions.gaobao} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={['equipmentModels', 'mitsubishi']} label="三菱">
                    <Checkbox.Group options={equipmentOptions.mitsubishi} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={['equipmentModels', 'other']} label="其他">
                    <Checkbox.Group options={equipmentOptions.other} />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>

            <TabPane tab="材料标准" key="material">
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item name={['materialStandards', 'paperType']} label="纸张类型">
                    <Select placeholder="请选择" mode="multiple">
                      {paperOptions.map((opt) => (
                        <Option key={opt} value={opt}>
                          {opt}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={['materialStandards', 'inkStandard']} label="油墨标准">
                    <Select placeholder="请选择" mode="multiple">
                      {inkOptions.map((opt) => (
                        <Option key={opt} value={opt}>
                          {opt}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={['materialStandards', 'laminationRequirement']} label="覆膜要求">
                    <Select placeholder="请选择" mode="multiple">
                      {laminationOptions.map((opt) => (
                        <Option key={opt} value={opt}>
                          {opt}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={['materialStandards', 'gildingProcess']} label="烫金工艺">
                    <Select placeholder="请选择" mode="multiple">
                      {gildingOptions.map((opt) => (
                        <Option key={opt} value={opt}>
                          {opt}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>

            <TabPane tab="技能要求" key="skills">
              <Row gutter={24}>
                {skillCategories.map((cat) => (
                  <Col span={12} key={cat.category}>
                    <Form.Item name="requiredSkills" label={cat.label}>
                      <Checkbox.Group options={cat.skills} />
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </TabPane>

            <TabPane tab="任职要求" key="requirements">
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item name="experienceYears" label="经验年限">
                    <Select placeholder="请选择">
                      {experienceOptions.map((opt) => (
                        <Option key={opt} value={opt}>
                          {opt}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="education" label="学历要求">
                    <Select placeholder="请选择">
                      {educationOptions.map((opt) => (
                        <Option key={opt} value={opt}>
                          {opt}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="description"
                    label="岗位描述"
                    rules={[{ required: true, message: '请输入岗位描述' }]}
                  >
                    <TextArea
                      rows={6}
                      placeholder="请详细描述岗位职责、任职要求、福利待遇等信息"
                      showCount
                      maxLength={2000}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        </Card>

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <Space>
            <Button onClick={() => navigate('/enterprise/jobs')}>取消</Button>
            <Button icon={<SaveOutlined />} onClick={handleSaveDraft} loading={submitting}>
              保存草稿
            </Button>
            <Button type="primary" htmlType="submit" onClick={handlePublish} loading={submitting}>
              发布岗位
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default JobForm;
