import React, { useEffect, useState } from 'react';
import { Card, Button, Tag, Row, Col, Select, message, Modal, Form, Input } from 'antd';
import { CheckOutlined, FileTextOutlined, PictureOutlined, BarChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { templateApi, resumeApi } from '../api';
import { Template } from '../types';

const INDUSTRY_OPTIONS = [
  { value: 'all', label: '全部行业' },
  { value: 'tech', label: '互联网/技术' },
  { value: 'product', label: '产品' },
  { value: 'design', label: '设计' },
  { value: 'data', label: '数据' },
  { value: 'marketing', label: '市场营销' },
  { value: 'hr', label: '人力资源' },
  { value: 'finance', label: '金融财务' },
  { value: 'operation', label: '运营' }
];

const TemplateSelectPage: React.FC = () => {
  const { templates, setTemplates } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, [selectedIndustry]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const industry = selectedIndustry === 'all' ? undefined : selectedIndustry;
      const res: any = await templateApi.list(industry);
      setTemplates(res.templates);
    } catch (err: any) {
      message.error(err.error || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFailed = () => {
    message.warning('请输入有效的简历标题（1-100个字符）');
  };

  const handleCreate = async (values: any) => {
    if (!selectedTemplate) {
      message.error('请先选择一个模板');
      return;
    }
    
    setCreateLoading(true);
    try {
      const templateContent: any = {
        basicInfo: { name: '', phone: '', email: '', location: '', website: '' },
        education: [],
        experience: [],
        projects: [],
        skills: [],
        summary: '',
        templateFeatures: {
          hasCover: selectedTemplate.hasCover,
          hasLetter: selectedTemplate.hasLetter,
          hasCharts: selectedTemplate.hasCharts
        }
      };
      
      if (selectedTemplate.hasCover) {
        templateContent.cover = { title: '', subtitle: '', backgroundImage: '' };
      }
      
      if (selectedTemplate.hasLetter) {
        templateContent.coverLetter = { recipient: '', position: '', company: '', content: '' };
      }
      
      if (selectedTemplate.hasCharts) {
        templateContent.skillCharts = { radar: [], bar: [] };
      }
      
      const res: any = await resumeApi.create({
        title: values.title,
        template_id: selectedTemplate.id,
        content: templateContent
      });
      
      const features = [];
      if (selectedTemplate.hasCover) features.push('封面');
      if (selectedTemplate.hasLetter) features.push('自荐信');
      if (selectedTemplate.hasCharts) features.push('技能图表');
      
      message.success(`创建成功！已应用模板特性：${features.length > 0 ? features.join('+') : '基础版'}`);
      setModalVisible(false);
      form.resetFields();
      navigate(`/resumes/${res.id}`);
    } catch (err: any) {
      message.error(err.error || '创建失败，请稍后重试');
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredTemplates = selectedIndustry === 'all' 
    ? templates 
    : templates.filter(t => t.industry === selectedIndustry);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>选择模板</h3>
          <p style={{ margin: '4px 0 0 0', color: '#718096' }}>9类行业专属模板，适配不同岗位需求</p>
        </div>
        <Select
          value={selectedIndustry}
          onChange={setSelectedIndustry}
          options={INDUSTRY_OPTIONS}
          style={{ width: 180 }}
        />
      </div>

      <Row gutter={[16, 16]}>
        {filteredTemplates.map((template) => (
          <Col xs={24} sm={12} lg={8} key={template.id}>
            <Card
              className="card-hover"
              onClick={() => setSelectedTemplate(template)}
              style={{
                border: selectedTemplate?.id === template.id ? '2px solid #1677ff' : '1px solid #e8e8e8',
                cursor: 'pointer'
              }}
              cover={
                <div style={{ 
                  height: 180, 
                  background: `linear-gradient(135deg, ${getTemplateColor(template.id)} 0%, ${getTemplateColor(template.id, true)} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  {selectedTemplate?.id === template.id && (
                    <div style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#1677ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CheckOutlined style={{ color: 'white', fontSize: 16 }} />
                    </div>
                  )}
                  <FileTextOutlined style={{ fontSize: 64, color: 'rgba(255,255,255,0.9)' }} />
                </div>
              }
            >
              <Card.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{template.name}</span>
                    <Tag color="blue">{INDUSTRY_OPTIONS.find(o => o.value === template.industry)?.label}</Tag>
                  </div>
                }
                description={
                  <div>
                    <p style={{ margin: '8px 0', color: '#4a5568', fontSize: 13 }}>{template.description}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      {template.hasCover && <Tag icon={<PictureOutlined />} color="green">封面</Tag>}
                      {template.hasLetter && <Tag icon={<FileTextOutlined />} color="orange">自荐信</Tag>}
                      {template.hasCharts && <Tag icon={<BarChartOutlined />} color="blue">技能图表</Tag>}
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {selectedTemplate && (
        <div style={{ position: 'fixed', bottom: 0, left: 220, right: 0, background: 'white', padding: '16px 24px', borderTop: '1px solid #e8e8e8', zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              已选择：<span style={{ fontWeight: 600 }}>{selectedTemplate.name}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {selectedTemplate.hasCover && <Tag icon={<PictureOutlined />} color="green">包含封面</Tag>}
              {selectedTemplate.hasLetter && <Tag icon={<FileTextOutlined />} color="orange">包含自荐信</Tag>}
              {selectedTemplate.hasCharts && <Tag icon={<BarChartOutlined />} color="blue">包含技能图表</Tag>}
              {!selectedTemplate.hasCover && !selectedTemplate.hasLetter && !selectedTemplate.hasCharts && <Tag color="default">基础版</Tag>}
            </div>
          </div>
          <Button type="primary" size="large" onClick={() => setModalVisible(true)}>
            使用此模板创建
          </Button>
        </div>
      )}

      <Modal
        title="创建简历"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        {selectedTemplate && (
          <div style={{ background: '#f0f5ff', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>当前模板：{selectedTemplate.name}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {selectedTemplate.hasCover && <Tag icon={<PictureOutlined />} color="green">封面</Tag>}
              {selectedTemplate.hasLetter && <Tag icon={<FileTextOutlined />} color="orange">自荐信</Tag>}
              {selectedTemplate.hasCharts && <Tag icon={<BarChartOutlined />} color="blue">技能图表</Tag>}
            </div>
          </div>
        )}
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
            <Input placeholder="例如：前端开发工程师简历" disabled={createLoading} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={createLoading}>
              开始编辑
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

function getTemplateColor(id: string, dark = false): string {
  const colors: Record<string, [string, string]> = {
    'tech-modern': ['#667eea', '#764ba2'],
    'tech-creative': ['#f093fb', '#f5576c'],
    'product-pro': ['#4facfe', '#00f2fe'],
    'design-creative': ['#fa709a', '#fee140'],
    'data-analyst': ['#30cfd0', '#330867'],
    'marketing-digital': ['#a8edea', '#fed6e3'],
    'hr-professional': ['#d4fc79', '#96e6a1'],
    'finance-conservative': ['#84fab0', '#8fd3f4'],
    'operation-growth': ['#fccb90', '#d57eeb']
  };
  return colors[id]?.[dark ? 1 : 0] || '#667eea';
}

export default TemplateSelectPage;
