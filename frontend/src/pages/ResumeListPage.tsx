import React, { useEffect, useState } from 'react';
import { 
  Card, Button, Empty, Modal, Form, Input, message, Popconfirm, Tag, Space, Row, Col, 
  Upload, Progress, Tooltip, Divider, Statistic, Grid, Tabs
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, ExportOutlined, EyeOutlined,
  UploadOutlined, FileTextOutlined, ThunderboltOutlined, FileWordOutlined, 
  FilePdfOutlined, BarChartOutlined, SendOutlined, DownloadOutlined,
  BulbOutlined, RocketOutlined, SafetyOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { resumeApi, exportApi, importApi, qualityApi, deliveryApi } from '../api';
import { Resume } from '../types';
import dayjs from 'dayjs';

const { useBreakpoint } = Grid;

const SAMPLE_RESUME = {
  title: '【示例】Java开发工程师简历',
  template_id: 'tech-modern',
  content: {
    basicInfo: {
      name: '张三',
      phone: '13800138000',
      email: 'zhangsan@example.com',
      location: '北京市',
      website: 'https://github.com/zhangsan'
    },
    summary: '计算机科学与技术专业应届毕业生，3年Java后端开发经验，熟悉Spring Boot、MySQL、Redis等技术栈。参与过3个中型项目开发，具备良好的问题解决能力和团队协作精神。期望职位：Java后端开发工程师。',
    education: [
      {
        id: '1',
        school: '清华大学',
        degree: '硕士',
        major: '计算机科学与技术',
        startDate: '2020-09',
        endDate: '2023-06',
        gpa: '3.8/4.0',
        description: '专业排名前10%，获得国家奖学金、优秀毕业生称号。研究方向：分布式系统与微服务架构。'
      },
      {
        id: '2',
        school: '北京大学',
        degree: '本科',
        major: '软件工程',
        startDate: '2016-09',
        endDate: '2020-06',
        gpa: '3.6/4.0',
        description: '连续3年获得一等奖学金，担任计算机协会技术部部长。'
      }
    ],
    experience: [
      {
        id: '1',
        company: '字节跳动',
        position: '后端开发实习生',
        startDate: '2022-06',
        endDate: '2022-12',
        description: '负责用户系统模块的开发与维护，优化查询性能提升40%；\n参与微服务架构设计，编写接口文档，推动前后端协作效率提升；\n独立完成用户行为分析功能，日处理数据量达1000万条。'
      },
      {
        id: '2',
        company: '阿里巴巴',
        position: 'Java开发工程师',
        startDate: '2023-07',
        endDate: '至今',
        description: '负责电商订单系统核心模块开发，支撑双十一峰值QPS达5万；\n主导订单流程重构，将系统响应时间从200ms优化至80ms；\n设计并实现分布式锁方案，解决超卖问题，减少资损99%。'
      }
    ],
    projects: [
      {
        id: '1',
        name: '智能问答系统',
        role: '项目负责人',
        startDate: '2022-03',
        endDate: '2022-06',
        description: '基于Transformer的智能问答系统，支持多轮对话和上下文理解；\n准确率达92%，已应用于公司客服系统，日活用户5万+；\n负责模型训练、API设计、前端对接全流程。',
        technologies: ['Python', 'PyTorch', 'FastAPI', 'React']
      },
      {
        id: '2',
        name: '高并发电商平台',
        role: '核心开发',
        startDate: '2023-09',
        endDate: '2023-12',
        description: '搭建支持10万+ QPS的电商平台，采用微服务架构；\n实现分布式缓存、消息队列、读写分离等性能优化方案；\n压测结果：单节点QPS 8000+，99%响应时间<100ms。',
        technologies: ['Java', 'Spring Boot', 'Redis', 'RabbitMQ', 'MySQL']
      }
    ],
    skills: [
      { id: '1', name: 'Java', level: 95 },
      { id: '2', name: 'Spring Boot', level: 90 },
      { id: '3', name: 'MySQL', level: 88 },
      { id: '4', name: 'Redis', level: 85 },
      { id: '5', name: 'Python', level: 80 },
      { id: '6', name: 'Git', level: 90 },
      { id: '7', name: 'Linux', level: 82 },
      { id: '8', name: '设计模式', level: 85 }
    ]
  }
};

const ResumeListPage: React.FC = () => {
  const { resumes, setResumes, setCurrentResume, setQualityReport, deliveries, setDeliveries } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const screens = useBreakpoint();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resumesRes, deliveriesRes] = await Promise.all([
        resumeApi.list(),
        deliveryApi.list()
      ]);
      setResumes(resumesRes.resumes);
      setDeliveries(deliveriesRes.records);
    } catch (err: any) {
      message.error(err.error || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    setCreateLoading(true);
    try {
      const res: any = await resumeApi.create({ title: values.title });
      message.success('创建成功，正在进入编辑器...');
      setCreateModalVisible(false);
      form.resetFields();
      setTimeout(() => navigate(`/resumes/${res.id}`), 300);
    } catch (err: any) {
      message.error(err.error || '创建失败，请稍后重试');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateFailed = () => {
    message.warning('请输入有效的简历标题（1-100个字符）');
  };

  const handleCreateFromTemplate = () => {
    navigate('/templates');
  };

  const handleImportFile = async (file: File) => {
    setImportLoading(true);
    setImportProgress(20);
    try {
      const res: any = await importApi.uploadFile(file);
      setImportProgress(70);
      
      const createRes: any = await resumeApi.create({
        title: `导入的简历 - ${file.name}`,
        template_id: 'tech-modern',
        content: res.content
      });
      setImportProgress(100);
      
      message.success('导入成功，正在进入编辑器...');
      setImportModalVisible(false);
      setTimeout(() => navigate(`/resumes/${createRes.id}`), 500);
    } catch (err: any) {
      message.error(err.error || '导入失败，请检查文件格式');
    } finally {
      setImportLoading(false);
      setImportProgress(0);
    }
    return false;
  };

  const handleImportText = async (text: string) => {
    if (!text.trim()) {
      message.warning('请输入简历内容');
      return;
    }
    setImportLoading(true);
    try {
      const res: any = await importApi.parseText(text);
      const createRes: any = await resumeApi.create({
        title: '文本导入的简历',
        template_id: 'tech-modern',
        content: res.content
      });
      message.success('解析成功，正在进入编辑器...');
      setImportModalVisible(false);
      setTimeout(() => navigate(`/resumes/${createRes.id}`), 500);
    } catch (err: any) {
      message.error(err.error || '解析失败');
    } finally {
      setImportLoading(false);
    }
  };

  const handleLoadSample = async () => {
    try {
      const res: any = await resumeApi.create(SAMPLE_RESUME);
      message.success('示例简历已创建，正在进入编辑器...');
      setTimeout(() => navigate(`/resumes/${res.id}`), 300);
    } catch (err: any) {
      message.error(err.error || '创建失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await resumeApi.delete(id);
      message.success('删除成功');
      loadAllData();
    } catch (err: any) {
      message.error(err.error || '删除失败');
    }
  };

  const handleEdit = (resume: Resume) => {
    setCurrentResume(resume);
    navigate(`/resumes/${resume.id}`);
  };

  const handleDuplicate = async (resume: Resume) => {
    try {
      const res: any = await resumeApi.create({
        title: `${resume.title} - 副本`,
        template_id: resume.template_id,
        content: resume.content
      });
      message.success('复制成功');
      loadAllData();
    } catch (err: any) {
      message.error(err.error || '复制失败');
    }
  };

  const handleQualityCheck = async (resume: Resume) => {
    try {
      const res: any = await qualityApi.analyze(resume.content, 'tech');
      setQualityReport(res.report);
      message.success(`质量评分：${res.report.overallScore}分`);
      navigate('/quality');
    } catch (err: any) {
      message.error(err.error || '诊断失败');
    }
  };

  const handleDelivery = async (resume: Resume) => {
    try {
      const res: any = await deliveryApi.create({
        resume_id: resume.id,
        company: '示例公司',
        position: '目标职位'
      });
      message.success('投递记录已创建');
      navigate('/delivery');
    } catch (err: any) {
      message.error(err.error || '创建失败');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const renderEmptyState = () => (
    <Card style={{ borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>📄</div>
        <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>开始创建你的第一份简历</h3>
        <p style={{ color: '#718096', marginBottom: 32, fontSize: 15 }}>
          支持 Word/PDF 导入、9类行业模板、智能质量诊断
        </p>
        
        <Row gutter={[16, 16]} style={{ maxWidth: 800, margin: '0 auto 32px' }}>
          <Col xs={24} sm={12} md={8}>
            <Card 
              hoverable 
              style={{ textAlign: 'center', height: '100%', borderRadius: 8 }}
              onClick={handleCreateFromTemplate}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
              <h4 style={{ marginBottom: 8, fontWeight: 600 }}>从模板创建</h4>
              <p style={{ color: '#718096', fontSize: 13, margin: 0 }}>9类行业专属模板<br/>封面+自荐信+技能图表</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card 
              hoverable 
              style={{ textAlign: 'center', height: '100%', borderRadius: 8 }}
              onClick={() => setImportModalVisible(true)}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>📥</div>
              <h4 style={{ marginBottom: 8, fontWeight: 600 }}>导入已有简历</h4>
              <p style={{ color: '#718096', fontSize: 13, margin: 0 }}>支持 Word / PDF / TXT<br/>自动提取教育经历项目</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card 
              hoverable 
              style={{ textAlign: 'center', height: '100%', borderRadius: 8 }}
              onClick={handleLoadSample}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
              <h4 style={{ marginBottom: 8, fontWeight: 600 }}>加载示例简历</h4>
              <p style={{ color: '#718096', fontSize: 13, margin: 0 }}>查看完整示例<br/>体验质量诊断导出投递</p>
            </Card>
          </Col>
        </Row>

        <Space size="middle">
          <Button 
            type="primary" 
            size="large" 
            icon={<FileTextOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            创建空白简历
          </Button>
          <Button 
            size="large" 
            icon={<RocketOutlined />}
            onClick={handleCreateFromTemplate}
          >
            浏览模板库
          </Button>
        </Space>

        <Divider style={{ margin: '32px 0 24px' }} />

        <div style={{ textAlign: 'left', maxWidth: 600, margin: '0 auto' }}>
          <h4 style={{ marginBottom: 16, fontWeight: 600 }}>
            <BulbOutlined style={{ color: '#faad14', marginRight: 8 }} />
            快速上手指南
          </h4>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ 
                  width: 28, height: 28, borderRadius: '50%', 
                  background: '#e6f7ff', color: '#1890ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontWeight: 600
                }}>1</div>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>创建或导入简历</div>
                  <div style={{ color: '#718096', fontSize: 13 }}>选择模板或导入已有简历，系统自动提取信息</div>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ 
                  width: 28, height: 28, borderRadius: '50%', 
                  background: '#f6ffed', color: '#52c41a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontWeight: 600
                }}>2</div>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>编辑完善内容</div>
                  <div style={{ color: '#718096', fontSize: 13 }}>补充教育经历、项目经验、专业技能等信息</div>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ 
                  width: 28, height: 28, borderRadius: '50%', 
                  background: '#fff7e6', color: '#fa8c16',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontWeight: 600
                }}>3</div>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>质量智能诊断</div>
                  <div style={{ color: '#718096', fontSize: 13 }}>系统分析关键词、动词强度、可读性，给出优化建议</div>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ 
                  width: 28, height: 28, borderRadius: '50%', 
                  background: '#f9f0ff', color: '#722ed1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontWeight: 600
                }}>4</div>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>导出与投递</div>
                  <div style={{ color: '#718096', fontSize: 13 }}>导出PDF/Word/ATS文本，生成扫码投递追踪码</div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </Card>
  );

  const renderResumeCard = (resume: Resume) => {
    const hasContent = resume.content?.basicInfo?.name;
    const expCount = resume.content?.experience?.length || 0;
    const projCount = resume.content?.projects?.length || 0;
    const eduCount = resume.content?.education?.length || 0;
    const skillCount = resume.content?.skills?.length || 0;
    const completionScore = Math.min(100, 
      (hasContent ? 20 : 0) + 
      (resume.content?.summary ? 15 : 0) +
      (eduCount > 0 ? 15 : 0) +
      (expCount > 0 ? 25 : 0) +
      (projCount > 0 ? 15 : 0) +
      (skillCount > 0 ? 10 : 0)
    );

    const resumeDeliveries = deliveries.filter(d => d.resume_id === resume.id);
    const hasDeliveries = resumeDeliveries.length > 0;
    const viewedCount = resumeDeliveries.filter(d => d.status === 'viewed').length;
    
    const qualityReport = useAppStore.getState().qualityReport;
    const hasDiagnosis = qualityReport !== null;

    const templateFeatures = resume.content?.templateFeatures;
    const features = [];
    if (templateFeatures?.hasCover) features.push('封面');
    if (templateFeatures?.hasLetter) features.push('自荐信');
    if (templateFeatures?.hasCharts) features.push('技能图表');

    return (
      <Col xs={24} sm={12} lg={8} key={resume.id}>
        <Card
          className="card-hover"
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>{resume.title}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {hasDiagnosis && <Tag color="purple" style={{ fontSize: 11 }}>已诊断</Tag>}
                {hasDeliveries && <Tag color="blue" style={{ fontSize: 11 }}>已投递</Tag>}
                {features.length > 0 && features.map((f, i) => (
                  <Tag key={i} color="green" style={{ fontSize: 11 }}>{f}</Tag>
                ))}
              </div>
            </div>
          }
          actions={[
            <Tooltip title="预览">
              <EyeOutlined key="preview" onClick={() => exportApi.preview(resume.id)} />
            </Tooltip>,
            <Tooltip title="编辑">
              <EditOutlined key="edit" onClick={() => handleEdit(resume)} />
            </Tooltip>,
            <Tooltip title="质量诊断">
              <BarChartOutlined key="quality" onClick={() => handleQualityCheck(resume)} style={{ color: '#722ed1' }} />
            </Tooltip>,
            <Tooltip title="投递">
              <SendOutlined key="delivery" onClick={() => handleDelivery(resume)} style={{ color: '#1890ff' }} />
            </Tooltip>,
            <Tooltip title="复制">
              <CopyOutlined key="copy" onClick={() => handleDuplicate(resume)} />
            </Tooltip>,
            <Tooltip title="导出三版本">
              <ExportOutlined key="export" onClick={() => exportApi.downloadHTML(resume.id)} />
            </Tooltip>,
            <Popconfirm
              key="delete"
              title="确定删除这份简历吗？"
              description="删除后无法恢复"
              onConfirm={() => handleDelete(resume.id)}
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <DeleteOutlined style={{ color: '#ff4d4f' }} />
            </Popconfirm>
          ]}
          style={{ height: '100%', borderRadius: 8 }}
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#718096', fontSize: 12 }}>完整度</span>
              <span style={{ color: getScoreColor(completionScore), fontWeight: 600, fontSize: 12 }}>
                {completionScore}%
              </span>
            </div>
            <Progress 
              percent={completionScore} 
              showInfo={false} 
              size="small"
              strokeColor={getScoreColor(completionScore)}
            />
          </div>

          <div style={{ color: '#4a5568', fontSize: 14, marginBottom: 12 }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>
              {resume.content?.basicInfo?.name || '👤 未填写姓名'}
            </div>
            {resume.content?.basicInfo?.email && (
              <div style={{ color: '#718096', fontSize: 13 }}>
                {resume.content.basicInfo.email}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {eduCount > 0 && <Tag color="orange">🎓 {eduCount} 教育</Tag>}
            {expCount > 0 && <Tag color="green">💼 {expCount} 经历</Tag>}
            {projCount > 0 && <Tag color="blue">🚀 {projCount} 项目</Tag>}
            {skillCount > 0 && <Tag color="purple">⭐ {skillCount} 技能</Tag>}
          </div>

          {hasDeliveries && (
            <div style={{ background: '#f0f5ff', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 12 }}>
              <SendOutlined style={{ color: '#1677ff', marginRight: 6 }} />
              已投递 {resumeDeliveries.length} 次 · 被查看 {viewedCount} 次
            </div>
          )}

          <div style={{ 
            paddingTop: 12, 
            borderTop: '1px solid #f0f0f0',
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: '#a0aec0'
          }}>
            <span>更新于 {dayjs(resume.updated_at).format('MM-DD HH:mm')}</span>
            <Space size={8}>
              <Tooltip title="可导出Word可编辑版">
                <FileWordOutlined style={{ color: '#1890ff' }} />
              </Tooltip>
              <Tooltip title="可导出PDF打印版">
                <FilePdfOutlined style={{ color: '#ff4d4f' }} />
              </Tooltip>
              <Tooltip title="端到端加密，仅您可见">
                <SafetyOutlined style={{ color: '#52c41a' }} />
              </Tooltip>
            </Space>
          </div>
        </Card>
      </Col>
    );
  };

  const renderStats = () => (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={12} sm={6}>
        <Card style={{ borderRadius: 8 }}>
          <Statistic 
            title="简历总数" 
            value={resumes.length} 
            prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
            valueStyle={{ fontSize: 24 }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card style={{ borderRadius: 8 }}>
          <Statistic 
            title="平均完整度" 
            value={resumes.length > 0 
              ? Math.round(resumes.reduce((sum, r) => {
                  const hasContent = r.content?.basicInfo?.name;
                  return sum + Math.min(100,
                    (hasContent ? 20 : 0) + 
                    (r.content?.summary ? 15 : 0) +
                    ((r.content?.education?.length || 0) > 0 ? 15 : 0) +
                    ((r.content?.experience?.length || 0) > 0 ? 25 : 0) +
                    ((r.content?.projects?.length || 0) > 0 ? 15 : 0) +
                    ((r.content?.skills?.length || 0) > 0 ? 10 : 0)
                  );
                }, 0) / resumes.length)
              : 0
            } 
            suffix="%"
            prefix={<BarChartOutlined style={{ color: '#722ed1' }} />}
            valueStyle={{ fontSize: 24 }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card style={{ borderRadius: 8 }}>
          <Statistic 
            title="投递记录" 
            value={0} 
            prefix={<SendOutlined style={{ color: '#52c41a' }} />}
            valueStyle={{ fontSize: 24 }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card style={{ borderRadius: 8 }}>
          <Statistic 
            title="今日可用" 
            value={9} 
            suffix="套模板"
            prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />}
            valueStyle={{ fontSize: 24 }}
          />
        </Card>
      </Col>
    </Row>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>我的简历</h3>
          <p style={{ margin: '4px 0 0 0', color: '#718096' }}>
            共 {resumes.length} 份简历 · 数据加密存储，仅您可见
          </p>
        </div>
        <Space wrap size="small">
          <Button 
            icon={<UploadOutlined />} 
            onClick={() => setImportModalVisible(true)}
          >
            导入简历
          </Button>
          <Button 
            icon={<ThunderboltOutlined />} 
            onClick={handleLoadSample}
            type="default"
          >
            加载示例
          </Button>
          <Button onClick={handleCreateFromTemplate}>
            从模板创建
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setCreateModalVisible(true)}
          >
            新建简历
          </Button>
        </Space>
      </div>

      {resumes.length > 0 && renderStats()}

      {resumes.length === 0 ? (
        renderEmptyState()
      ) : (
        <Row gutter={[16, 16]}>
          {resumes.map(renderResumeCard)}
        </Row>
      )}

      {/* 创建空白简历弹窗 */}
      <Modal
        title="创建空白简历"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} onFinish={handleCreate} onFinishFailed={handleCreateFailed} layout="vertical">
          <Form.Item
            label="简历标题"
            name="title"
            rules={[
              { required: true, message: '请输入简历标题' },
              { min: 1, message: '标题不能为空' },
              { max: 100, message: '标题长度不能超过100个字符' }
            ]}
          >
            <Input placeholder="例如：Java开发工程师 - 张三" disabled={createLoading} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createLoading}>
                创建并开始编辑
              </Button>
              <Button onClick={() => setCreateModalVisible(false)} disabled={createLoading}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 导入简历弹窗 */}
      <Modal
        title="导入简历"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
        width={screens.md ? 700 : '90%'}
        destroyOnClose
      >
        <Tabs
          defaultActiveKey="file"
          items={[
            {
              key: 'file',
              label: '上传文件',
              children: (
                <div>
                  <p style={{ color: '#718096', marginBottom: 16 }}>
                    支持 Word (.docx)、PDF、TXT 格式，系统将自动提取教育背景、实习经历、项目描述等信息
                  </p>
                  
                  <Upload
                    name="file"
                    accept=".pdf,.docx,.txt"
                    showUploadList={false}
                    beforeUpload={handleImportFile}
                    disabled={importLoading}
                  >
                    <div style={{ 
                      border: '2px dashed #d9d9d9',
                      borderRadius: 8,
                      padding: '40px 20px',
                      textAlign: 'center',
                      cursor: importLoading ? 'not-allowed' : 'pointer',
                      background: importLoading ? '#f5f5f5' : '#fafafa'
                    }}>
                      {importLoading ? (
                        <div>
                          <div style={{ fontSize: 32, marginBottom: 12, color: '#1890ff' }}>
                            <UploadOutlined spin />
                          </div>
                          <p style={{ margin: '0 0 8px', fontWeight: 500 }}>正在解析简历...</p>
                          <Progress percent={importProgress} showInfo={false} style={{ width: 200, margin: '0 auto' }} />
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: 48, marginBottom: 16 }}>
                            <FileWordOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                            <FilePdfOutlined style={{ color: '#ff4d4f' }} />
                          </div>
                          <p style={{ margin: '0 0 8px', fontWeight: 500, fontSize: 16 }}>点击或拖拽文件到此处上传</p>
                          <p style={{ margin: 0, color: '#718096', fontSize: 13 }}>
                            支持 .pdf, .docx, .txt 格式，单文件不超过 10MB
                          </p>
                        </div>
                      )}
                    </div>
                  </Upload>
                </div>
              )
            },
            {
              key: 'text',
              label: '粘贴文本',
              children: (
                <div>
                  <p style={{ color: '#718096', marginBottom: 16 }}>
                    直接粘贴简历内容，系统将自动解析并结构化提取信息
                  </p>
                  <Form onFinish={async (values) => { await handleImportText(values.text); }} layout="vertical">
                    <Form.Item
                      name="text"
                      rules={[{ required: true, message: '请粘贴简历内容' }]}
                    >
                      <Input.TextArea
                        rows={12}
                        placeholder="请粘贴简历内容，例如：&#10;&#10;张三&#10;13800138000 | zhangsan@example.com&#10;&#10;教育背景&#10;清华大学 计算机科学与技术 硕士 2020-2023&#10;&#10;工作经历&#10;字节跳动 后端开发工程师 2023-至今&#10;负责用户系统开发与维护..."
                        disabled={importLoading}
                      />
                    </Form.Item>
                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={importLoading}
                        icon={<ThunderboltOutlined />}
                      >
                        开始解析
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
              )
            }
          ]}
        />
      </Modal>
    </div>
  );
};

export default ResumeListPage;
