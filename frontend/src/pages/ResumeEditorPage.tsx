import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Input,
  Form,
  List,
  Space,
  Tabs,
  Upload,
  message,
  Modal,
  Select,
  Tag,
  Row,
  Col,
  Divider,
  InputNumber,
  App
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  SaveOutlined,
  ExportOutlined,
  EyeOutlined,
  QrcodeOutlined,
  BarChartOutlined,
  FileTextOutlined,
  ArrowUpOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store';
import { resumeApi, importApi, exportApi, deliveryApi, qualityApi, templateApi } from '../api';
import {
  ResumeContent,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  SkillItem,
  QualityReport
} from '../types';

const { TextArea } = Input;
const { Option } = Select;

const INDUSTRY_OPTIONS = [
  { value: 'tech', label: '互联网/技术' },
  { value: 'product', label: '产品' },
  { value: 'design', label: '设计' },
  { value: 'data', label: '数据' },
  { value: 'marketing', label: '市场营销' },
  { value: 'hr', label: '人力资源' },
  { value: 'finance', label: '金融财务' },
  { value: 'operation', label: '运营' }
];

const ResumeEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message: msg } = App.useApp();
  const { currentResume, setCurrentResume, setQualityReport } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deliveryModal, setDeliveryModal] = useState(false);
  const [qualityModal, setQualityModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [importType, setImportType] = useState<'file' | 'text'>('file');
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [deliveryForm] = Form.useForm();
  const [qualityReport, setLocalQualityReport] = useState<QualityReport | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (id) {
      loadResume(parseInt(id));
    }
    loadTemplates();
  }, [id]);

  const loadTemplates = async () => {
    try {
      const res: any = await templateApi.list();
      setTemplates(res.templates);
    } catch (err: any) {
      msg.error(err.error || '加载模板失败');
    }
  };

  const loadResume = async (resumeId: number) => {
    setLoading(true);
    try {
      const res: any = await resumeApi.get(resumeId);
      setCurrentResume(res.resume);
    } catch (err: any) {
      msg.error(err.error || '加载失败');
      navigate('/resumes');
    } finally {
      setLoading(false);
    }
  };

  const saveResume = useCallback(async () => {
    if (!currentResume) return;
    setSaving(true);
    try {
      await resumeApi.update(currentResume.id, {
        title: currentResume.title,
        template_id: currentResume.template_id,
        content: currentResume.content
      });
      msg.success('保存成功');
    } catch (err: any) {
      msg.error(err.error || '保存失败');
    } finally {
      setSaving(false);
    }
  }, [currentResume, msg]);

  const updateContent = (updates: Partial<ResumeContent>) => {
    if (!currentResume) return;
    setCurrentResume({
      ...currentResume,
      content: { ...currentResume.content, ...updates }
    });
  };

  const updateBasicInfo = (field: string, value: any) => {
    if (!currentResume) return;
    updateContent({
      basicInfo: { ...currentResume.content.basicInfo, [field]: value }
    });
  };

  const addItem = <T extends { id: string }>(field: 'education' | 'experience' | 'projects' | 'skills', defaultItem: Omit<T, 'id'>) => {
    if (!currentResume) return;
    const items = currentResume.content[field] as unknown as T[];
    const newItem = { ...defaultItem, id: `${field}-${Date.now()}` } as T;
    updateContent({ [field]: [...items, newItem] } as any);
  };

  const updateItem = <T extends { id: string }>(
    field: 'education' | 'experience' | 'projects' | 'skills',
    itemId: string,
    updates: Partial<T>
  ) => {
    if (!currentResume) return;
    const items = currentResume.content[field] as unknown as T[];
    updateContent({
      [field]: items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    } as any);
  };

  const removeItem = (field: 'education' | 'experience' | 'projects' | 'skills', itemId: string) => {
    if (!currentResume) return;
    const items = currentResume.content[field] as any[];
    updateContent({ [field]: items.filter(item => item.id !== itemId) } as any);
  };

  const handleImportFile = async (options: any) => {
    const { file } = options;
    setImporting(true);
    try {
      const res: any = await importApi.uploadFile(file);
      applyImportedData(res.data);
      setImportModal(false);
      msg.success('导入成功，请检查并完善信息');
    } catch (err: any) {
      msg.error(err.error || '导入失败');
    } finally {
      setImporting(false);
    }
  };

  const handleImportText = async () => {
    if (!importText || importText.length < 50) {
      msg.error('请输入足够的简历内容（至少50字）');
      return;
    }
    setImporting(true);
    try {
      const res: any = await importApi.parseText(importText);
      applyImportedData(res.data);
      setImportModal(false);
      setImportText('');
      msg.success('解析成功，请检查并完善信息');
    } catch (err: any) {
      msg.error(err.error || '解析失败');
    } finally {
      setImporting(false);
    }
  };

  const applyImportedData = (data: Partial<ResumeContent>) => {
    if (!currentResume) return;
    const merged: ResumeContent = {
      basicInfo: { ...currentResume.content.basicInfo, ...data.basicInfo },
      education: data.education?.length ? data.education : currentResume.content.education,
      experience: data.experience?.length ? data.experience : currentResume.content.experience,
      projects: data.projects?.length ? data.projects : currentResume.content.projects,
      skills: data.skills?.length ? data.skills : currentResume.content.skills,
      summary: data.summary || currentResume.content.summary
    };
    updateContent(merged);
  };

  const handleQualityAnalyze = async (industry: string = 'tech') => {
    if (!currentResume) return;
    setAnalyzing(true);
    try {
      const res: any = await qualityApi.analyze(currentResume.content, industry);
      setLocalQualityReport(res.report);
      setQualityReport(res.report);
    } catch (err: any) {
      msg.error(err.error || '分析失败');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelivery = async (values: any) => {
    if (!currentResume) return;
    try {
      const res: any = await deliveryApi.create({
        resume_id: currentResume.id,
        company: values.company,
        position: values.position
      });
      setDeliveryModal(false);
      deliveryForm.resetFields();
      
      Modal.success({
        title: '投递码已生成',
        content: (
          <div style={{ textAlign: 'center' }}>
            <img src={res.qr_code} alt="投递二维码" style={{ width: 200, height: 200 }} />
            <p style={{ marginTop: 16 }}>追踪码：{res.tracking_code}</p>
            <p>微信扫码即可查看简历</p>
          </div>
        ),
        onOk: () => navigate('/delivery')
      });
    } catch (err: any) {
      msg.error(err.error || '生成失败');
    }
  };

  if (loading || !currentResume) {
    return <div style={{ textAlign: 'center', padding: 100 }}>加载中...</div>;
  }

  const content = currentResume.content;

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Card title="基本信息">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="姓名" required>
                <Input
                  value={content.basicInfo.name}
                  onChange={(e) => updateBasicInfo('name', e.target.value)}
                  placeholder="请输入姓名"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="电话" required>
                <Input
                  value={content.basicInfo.phone}
                  onChange={(e) => updateBasicInfo('phone', e.target.value)}
                  placeholder="请输入手机号"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="邮箱" required>
                <Input
                  value={content.basicInfo.email}
                  onChange={(e) => updateBasicInfo('email', e.target.value)}
                  placeholder="请输入邮箱"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="所在地">
                <Input
                  value={content.basicInfo.location}
                  onChange={(e) => updateBasicInfo('location', e.target.value)}
                  placeholder="例如：北京"
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="个人主页/GitHub">
                <Input
                  value={content.basicInfo.website}
                  onChange={(e) => updateBasicInfo('website', e.target.value)}
                  placeholder="请输入个人主页链接"
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="个人简介">
                <TextArea
                  rows={4}
                  value={content.summary}
                  onChange={(e) => updateContent({ summary: e.target.value })}
                  placeholder="用2-3句话突出你的核心优势，让HR一眼记住你"
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      )
    },
    {
      key: 'experience',
      label: '工作/实习经历',
      children: (
        <Card
          title="工作/实习经历"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => addItem<ExperienceItem>('experience', {
                company: '',
                position: '',
                startDate: '',
                endDate: '',
                description: ''
              })}
            >
              添加经历
            </Button>
          }
        >
          {content.experience.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              还没有添加工作/实习经历
            </div>
          ) : (
            <List
              dataSource={content.experience}
              renderItem={(item, index) => (
                <List.Item key={item.id} style={{ display: 'block', border: '1px solid #e8e8e8', borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <strong>经历 {index + 1}</strong>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeItem('experience', item.id)}
                    >
                      删除
                    </Button>
                  </div>
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item label="公司名称" required>
                        <Input
                          value={item.company}
                          onChange={(e) => updateItem<ExperienceItem>('experience', item.id, { company: e.target.value })}
                          placeholder="请输入公司名称"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label="职位" required>
                        <Input
                          value={item.position}
                          onChange={(e) => updateItem<ExperienceItem>('experience', item.id, { position: e.target.value })}
                          placeholder="请输入职位名称"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Form.Item label="开始时间">
                        <Input
                          value={item.startDate}
                          onChange={(e) => updateItem<ExperienceItem>('experience', item.id, { startDate: e.target.value })}
                          placeholder="如：2023.06"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Form.Item label="结束时间">
                        <Input
                          value={item.endDate}
                          onChange={(e) => updateItem<ExperienceItem>('experience', item.id, { endDate: e.target.value })}
                          placeholder="如：至今"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item label="工作描述">
                        <TextArea
                          rows={4}
                          value={item.description}
                          onChange={(e) => updateItem<ExperienceItem>('experience', item.id, { description: e.target.value })}
                          placeholder="描述你的工作内容和成果，建议使用数字量化，如：提升了30%的用户活跃度"
                          showCount
                          maxLength={1000}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </List.Item>
              )}
            />
          )}
        </Card>
      )
    },
    {
      key: 'projects',
      label: '项目经历',
      children: (
        <Card
          title="项目经历"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => addItem<ProjectItem>('projects', {
                name: '',
                role: '',
                startDate: '',
                endDate: '',
                description: '',
                technologies: []
              })}
            >
              添加项目
            </Button>
          }
        >
          {content.projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              还没有添加项目经历
            </div>
          ) : (
            <List
              dataSource={content.projects}
              renderItem={(item, index) => (
                <List.Item key={item.id} style={{ display: 'block', border: '1px solid #e8e8e8', borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <strong>项目 {index + 1}</strong>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeItem('projects', item.id)}
                    >
                      删除
                    </Button>
                  </div>
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item label="项目名称" required>
                        <Input
                          value={item.name}
                          onChange={(e) => updateItem<ProjectItem>('projects', item.id, { name: e.target.value })}
                          placeholder="请输入项目名称"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label="担任角色">
                        <Input
                          value={item.role}
                          onChange={(e) => updateItem<ProjectItem>('projects', item.id, { role: e.target.value })}
                          placeholder="如：前端负责人"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Form.Item label="开始时间">
                        <Input
                          value={item.startDate}
                          onChange={(e) => updateItem<ProjectItem>('projects', item.id, { startDate: e.target.value })}
                          placeholder="如：2023.06"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Form.Item label="结束时间">
                        <Input
                          value={item.endDate}
                          onChange={(e) => updateItem<ProjectItem>('projects', item.id, { endDate: e.target.value })}
                          placeholder="如：至今"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item label="技术栈">
                        <Select
                          mode="tags"
                          style={{ width: '100%' }}
                          value={item.technologies}
                          onChange={(value) => updateItem<ProjectItem>('projects', item.id, { technologies: value })}
                          placeholder="输入技术栈后按回车添加"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item label="项目描述">
                        <TextArea
                          rows={4}
                          value={item.description}
                          onChange={(e) => updateItem<ProjectItem>('projects', item.id, { description: e.target.value })}
                          placeholder="描述项目背景、你的职责和主要成果，建议量化数据"
                          showCount
                          maxLength={1000}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </List.Item>
              )}
            />
          )}
        </Card>
      )
    },
    {
      key: 'education',
      label: '教育背景',
      children: (
        <Card
          title="教育背景"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => addItem<EducationItem>('education', {
                school: '',
                degree: '',
                major: '',
                startDate: '',
                endDate: '',
                gpa: '',
                description: ''
              })}
            >
              添加教育经历
            </Button>
          }
        >
          {content.education.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              还没有添加教育背景
            </div>
          ) : (
            <List
              dataSource={content.education}
              renderItem={(item, index) => (
                <List.Item key={item.id} style={{ display: 'block', border: '1px solid #e8e8e8', borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <strong>教育经历 {index + 1}</strong>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeItem('education', item.id)}
                    >
                      删除
                    </Button>
                  </div>
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item label="学校名称" required>
                        <Input
                          value={item.school}
                          onChange={(e) => updateItem<EducationItem>('education', item.id, { school: e.target.value })}
                          placeholder="请输入学校名称"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label="学历">
                        <Select
                          value={item.degree}
                          onChange={(value) => updateItem<EducationItem>('education', item.id, { degree: value })}
                          style={{ width: '100%' }}
                        >
                          <Option value="博士">博士</Option>
                          <Option value="硕士">硕士</Option>
                          <Option value="本科">本科</Option>
                          <Option value="大专">大专</Option>
                          <Option value="高中">高中</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item label="专业">
                        <Input
                          value={item.major}
                          onChange={(e) => updateItem<EducationItem>('education', item.id, { major: e.target.value })}
                          placeholder="请输入专业名称"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Form.Item label="GPA">
                        <Input
                          value={item.gpa}
                          onChange={(e) => updateItem<EducationItem>('education', item.id, { gpa: e.target.value })}
                          placeholder="如：3.8/4.0"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Form.Item label="开始时间">
                        <Input
                          value={item.startDate}
                          onChange={(e) => updateItem<EducationItem>('education', item.id, { startDate: e.target.value })}
                          placeholder="如：2019.09"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Form.Item label="结束时间">
                        <Input
                          value={item.endDate}
                          onChange={(e) => updateItem<EducationItem>('education', item.id, { endDate: e.target.value })}
                          placeholder="如：2023.06"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item label="描述（获奖、社团等）">
                        <TextArea
                          rows={3}
                          value={item.description}
                          onChange={(e) => updateItem<EducationItem>('education', item.id, { description: e.target.value })}
                          placeholder="奖学金、学生干部、竞赛获奖等"
                          showCount
                          maxLength={500}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </List.Item>
              )}
            />
          )}
        </Card>
      )
    },
    {
      key: 'skills',
      label: '专业技能',
      children: (
        <Card
          title="专业技能"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => addItem<SkillItem>('skills', {
                category: '',
                items: []
              })}
            >
              添加技能分类
            </Button>
          }
        >
          {content.skills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              还没有添加专业技能
            </div>
          ) : (
            <List
              dataSource={content.skills}
              renderItem={(item) => (
                <List.Item key={item.id} style={{ display: 'block', border: '1px solid #e8e8e8', borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Input
                      value={item.category}
                      onChange={(e) => updateItem<SkillItem>('skills', item.id, { category: e.target.value })}
                      placeholder="技能分类，如：前端开发"
                      style={{ width: 200, marginRight: 12 }}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeItem('skills', item.id)}
                    >
                      删除
                    </Button>
                  </div>
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    value={item.items}
                    onChange={(value) => updateItem<SkillItem>('skills', item.id, { items: value })}
                    placeholder="输入技能后按回车添加，如：React、TypeScript"
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      )
    }
  ];

  return (
    <div>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: 16, background: 'white', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Input
            value={currentResume.title}
            onChange={(e) => setCurrentResume({ ...currentResume, title: e.target.value })}
            style={{ width: 250 }}
            placeholder="简历标题"
          />
          <Select
            value={currentResume.template_id}
            onChange={(value) => setCurrentResume({ ...currentResume, template_id: value })}
            style={{ width: 180 }}
          >
            {templates.map(t => (
              <Option key={t.id} value={t.id}>{t.name}</Option>
            ))}
          </Select>
        </div>
        <Space wrap>
          <Button icon={<UploadOutlined />} onClick={() => setImportModal(true)}>
            导入简历
          </Button>
          <Button icon={<EyeOutlined />} onClick={() => exportApi.preview(currentResume.id)}>
            预览
          </Button>
          <Button icon={<BarChartOutlined />} onClick={() => {
            setQualityModal(true);
            handleQualityAnalyze('tech');
          }}>
            质量诊断
          </Button>
          <Button icon={<QrcodeOutlined />} onClick={() => setDeliveryModal(true)}>
            生成投递码
          </Button>
          <Button icon={<ExportOutlined />} onClick={() => exportApi.downloadHTML(currentResume.id)}>
            导出
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={saveResume} loading={saving}>
            保存
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <div className="no-print">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              type="card"
            />
          </div>
        </Col>
        
        <Col xs={24} lg={10}>
          <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>实时预览</span>
            <Space>
              <Button size="small" onClick={() => exportApi.downloadDOC(currentResume.id)}>下载Word</Button>
              <Button size="small" onClick={() => exportApi.downloadATS(currentResume.id)}>下载ATS文本</Button>
            </Space>
          </div>
          <div className="resume-preview" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            <div style={{ textAlign: 'center', paddingBottom: 20, borderBottom: '1px solid #e2e8f0' }}>
              <h1 style={{ margin: '0 0 12px 0', fontSize: 28, fontWeight: 700, color: '#1a365d' }}>
                {content.basicInfo.name || '你的姓名'}
              </h1>
              <div style={{ color: '#718096', fontSize: 15 }}>
                {content.basicInfo.phone && content.basicInfo.phone + ' · '}
                {content.basicInfo.email || 'your@email.com'}
                {content.basicInfo.location && ' · ' + content.basicInfo.location}
              </div>
            </div>

            {content.summary && (
              <div style={{ marginTop: 24 }}>
                <div className="section-title">个人简介</div>
                <p style={{ lineHeight: 1.8, color: '#4a5568', whiteSpace: 'pre-wrap' }}>{content.summary}</p>
              </div>
            )}

            {content.experience.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div className="section-title">工作/实习经历</div>
                {content.experience.map(exp => (
                  <div key={exp.id} style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, color: '#2d3748' }}>
                        {exp.company || '公司名称'} · {exp.position || '职位'}
                      </div>
                      <div style={{ color: '#718096', fontSize: 14 }}>
                        {exp.startDate} - {exp.endDate || '至今'}
                      </div>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#4a5568' }}>
                      {exp.description || '描述你的工作内容和成果...'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {content.projects.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div className="section-title">项目经历</div>
                {content.projects.map(proj => (
                  <div key={proj.id} style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, color: '#2d3748' }}>
                        {proj.name || '项目名称'}{proj.role ? ' · ' + proj.role : ''}
                      </div>
                      <div style={{ color: '#718096', fontSize: 14 }}>
                        {proj.startDate} - {proj.endDate || '至今'}
                      </div>
                    </div>
                    {proj.technologies.length > 0 && (
                      <div style={{ color: '#4299e1', marginBottom: 6, fontSize: 14 }}>
                        技术栈：{proj.technologies.join('、')}
                      </div>
                    )}
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#4a5568' }}>
                      {proj.description || '描述项目背景、你的职责和主要成果...'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {content.education.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div className="section-title">教育背景</div>
                {content.education.map(edu => (
                  <div key={edu.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, color: '#2d3748' }}>
                        {edu.school || '学校名称'}
                      </div>
                      <div style={{ color: '#718096', fontSize: 14 }}>
                        {edu.startDate} - {edu.endDate || '至今'}
                      </div>
                    </div>
                    <div style={{ color: '#4a5568' }}>
                      {edu.degree || ''}{edu.major ? ' · ' + edu.major : ''}{edu.gpa ? ' · GPA: ' + edu.gpa : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {content.skills.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div className="section-title">专业技能</div>
                {content.skills.map(skill => (
                  <div key={skill.id} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: '#1a365d' }}>
                      {skill.category || '技能分类'}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {skill.items.map((item, idx) => (
                        <span key={idx} style={{ background: '#e2e8f0', padding: '3px 10px', borderRadius: 4, fontSize: 13 }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Col>
      </Row>

      <Modal
        title="导入简历"
        open={importModal}
        onCancel={() => setImportModal(false)}
        footer={null}
        width={600}
      >
        <Tabs
          activeKey={importType}
          onChange={(key) => setImportType(key as 'file' | 'text')}
          items={[
            {
              key: 'file',
              label: '文件导入',
              children: (
                <div>
                  <p style={{ color: '#718096', marginBottom: 16 }}>
                    支持 Word (.docx)、PDF、纯文本格式，系统将自动提取教育背景、工作经历、项目描述等字段
                  </p>
                  <Upload
                    customRequest={handleImportFile}
                    showUploadList={false}
                    accept=".pdf,.docx,.txt"
                  >
                    <Button icon={<UploadOutlined />} loading={importing} size="large">
                      选择文件上传
                    </Button>
                  </Upload>
                </div>
              )
            },
            {
              key: 'text',
              label: '文本粘贴',
              children: (
                <div>
                  <p style={{ color: '#718096', marginBottom: 16 }}>
                    粘贴你的简历内容，系统将自动解析并填充到对应字段
                  </p>
                  <TextArea
                    rows={8}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="粘贴简历内容到这里..."
                    showCount
                    maxLength={10000}
                    style={{ marginBottom: 16 }}
                  />
                  <Button
                    type="primary"
                    onClick={handleImportText}
                    loading={importing}
                    disabled={importText.length < 50}
                  >
                    开始解析
                  </Button>
                </div>
              )
            }
          ]}
        />
      </Modal>

      <Modal
        title="简历质量诊断"
        open={qualityModal}
        onCancel={() => setQualityModal(false)}
        footer={null}
        width={700}
      >
        {qualityReport && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div className={`score-circle ${qualityReport.overallScore >= 80 ? 'score-good' : qualityReport.overallScore >= 60 ? 'score-medium' : 'score-poor'}`}>
                {qualityReport.overallScore}
              </div>
              <p style={{ marginTop: 12, fontSize: 16, fontWeight: 600 }}>综合评分</p>
            </div>

            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1677ff' }}>{qualityReport.keywordScore}</div>
                <div style={{ color: '#718096' }}>关键词匹配</div>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>{qualityReport.verbScore}</div>
                <div style={{ color: '#718096' }}>动词强度</div>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#faad14' }}>{qualityReport.readabilityScore}</div>
                <div style={{ color: '#718096' }}>可读性</div>
              </Col>
            </Row>

            <Select
              defaultValue="tech"
              onChange={handleQualityAnalyze}
              style={{ width: 200, marginBottom: 16 }}
              loading={analyzing}
            >
              {INDUSTRY_OPTIONS.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>

            {qualityReport.suggestions.length > 0 && (
              <div>
                <div className="section-title">优化建议</div>
                <List
                  dataSource={qualityReport.suggestions}
                  renderItem={(suggestion, index) => (
                    <List.Item>
                      <Space>
                        <ArrowUpOutlined style={{ color: '#52c41a' }} />
                        <span>{suggestion}</span>
                      </Space>
                    </List.Item>
                  )}
                />
              </div>
            )}

            {qualityReport.missingKeywords.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="section-title">建议补充关键词</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {qualityReport.missingKeywords.map((kw, idx) => (
                    <Tag key={idx} color="orange">{kw}</Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="生成投递码"
        open={deliveryModal}
        onCancel={() => setDeliveryModal(false)}
        footer={null}
      >
        <Form form={deliveryForm} onFinish={handleDelivery} layout="vertical">
          <Form.Item
            label="投递公司"
            name="company"
            rules={[{ required: true, message: '请输入公司名称' }]}
          >
            <Input placeholder="例如：字节跳动" />
          </Form.Item>
          <Form.Item
            label="投递职位"
            name="position"
            rules={[{ required: true, message: '请输入职位名称' }]}
          >
            <Input placeholder="例如：前端开发工程师" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              生成微信投递码
            </Button>
          </Form.Item>
        </Form>
        <p style={{ color: '#718096', fontSize: 13, margin: 0 }}>
          💡 生成后可使用微信扫码查看简历，系统会自动追踪简历查看记录
        </p>
      </Modal>
    </div>
  );
};

export default ResumeEditorPage;
