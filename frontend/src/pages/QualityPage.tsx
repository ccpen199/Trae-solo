import React, { useEffect, useState } from 'react';
import { Card, Select, Button, Row, Col, List, Tag, Progress, Space, Empty, message, App } from 'antd';
import { BarChartOutlined, ArrowUpOutlined, BulbOutlined, FileTextOutlined } from '@ant-design/icons';
import { useAppStore } from '../store';
import { resumeApi, qualityApi } from '../api';
import { QualityReport, Resume } from '../types';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

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

const QualityPage: React.FC = () => {
  const { resumes, setResumes, qualityReport, setQualityReport } = useAppStore();
  const { message: msg } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState('tech');
  const [fullReport, setFullReport] = useState<QualityReport | null>(null);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    setLoading(true);
    try {
      const res: any = await resumeApi.list();
      setResumes(res.resumes);
    } catch (err: any) {
      msg.error(err.error || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedResume) {
      msg.error('请先选择要诊断的简历');
      return;
    }

    setAnalyzing(true);
    try {
      const res: any = await resumeApi.get(selectedResume.id);
      const qualityRes: any = await qualityApi.analyze(res.resume.content, selectedIndustry);
      setFullReport(qualityRes.report);
      setQualityReport(qualityRes.report);
      msg.success('诊断完成');
    } catch (err: any) {
      msg.error(err.error || '诊断失败');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreClass = (score: number) => {
    if (score >= 80) return 'score-good';
    if (score >= 60) return 'score-medium';
    return 'score-poor';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '优秀';
    if (score >= 60) return '良好';
    if (score >= 40) return '一般';
    return '待优化';
  };

  const radarData = fullReport ? [
    { subject: '关键词', A: fullReport.keywordScore, fullMark: 100 },
    { subject: '动词强度', A: fullReport.verbScore, fullMark: 100 },
    { subject: '可读性', A: fullReport.readabilityScore, fullMark: 100 },
    { subject: '完整性', A: Math.min(100, (
      (selectedResume?.content?.experience?.length || 0) * 20 +
      (selectedResume?.content?.projects?.length || 0) * 15 +
      (selectedResume?.content?.education?.length || 0) * 15 +
      (selectedResume?.content?.skills?.length || 0) * 10 +
      (selectedResume?.content?.summary?.length || 0) > 50 ? 20 : 0
    )), fullMark: 100 },
    { subject: 'ATS友好', A: fullReport.overallScore, fullMark: 100 }
  ] : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>简历质量诊断</h3>
          <p style={{ margin: '4px 0 0 0', color: '#718096' }}>
            AI智能分析，提供针对性优化建议
          </p>
        </div>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>选择简历</div>
            <Select
              placeholder="请选择要诊断的简历"
              style={{ width: '100%' }}
              value={selectedResume?.id}
              onChange={(value) => {
                const resume = resumes.find(r => r.id === value);
                setSelectedResume(resume || null);
                setFullReport(null);
              }}
              loading={loading}
            >
              {resumes.map((resume) => (
                <Option key={resume.id} value={resume.id}>
                  {resume.title}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>目标行业</div>
            <Select
              value={selectedIndustry}
              onChange={setSelectedIndustry}
              style={{ width: '100%' }}
              options={INDUSTRY_OPTIONS}
            />
          </Col>
          <Col xs={24} md={8}>
            <div style={{ height: 32 }} />
            <Button
              type="primary"
              size="large"
              icon={<BarChartOutlined />}
              onClick={handleAnalyze}
              loading={analyzing}
              disabled={!selectedResume}
              block
            >
              开始诊断
            </Button>
          </Col>
        </Row>
      </Card>

      {!fullReport ? (
        <Card>
          <Empty
            description={selectedResume ? '点击"开始诊断"按钮分析简历质量' : '请先选择一份简历'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card style={{ textAlign: 'center', height: '100%' }}>
              <div className={`score-circle ${getScoreClass(fullReport.overallScore)}`} style={{ width: 120, height: 120, fontSize: 36, margin: '0 auto 16px' }}>
                {fullReport.overallScore}
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                综合评分：{getScoreLabel(fullReport.overallScore)}
              </h3>
              <p style={{ color: '#718096', marginTop: 8, marginBottom: 24 }}>
                基于关键词、动词强度、可读性多维度分析
              </p>
              
              <div style={{ textAlign: 'left' }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>关键词匹配</span>
                    <span style={{ fontWeight: 600 }}>{fullReport.keywordScore}%</span>
                  </div>
                  <Progress percent={fullReport.keywordScore} showInfo={false} strokeColor="#1677ff" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>动词强度</span>
                    <span style={{ fontWeight: 600 }}>{fullReport.verbScore}%</span>
                  </div>
                  <Progress percent={fullReport.verbScore} showInfo={false} strokeColor="#52c41a" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>可读性</span>
                    <span style={{ fontWeight: 600 }}>{fullReport.readabilityScore}%</span>
                  </div>
                  <Progress percent={fullReport.readabilityScore} showInfo={false} strokeColor="#faad14" />
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="能力雷达图" style={{ height: '100%' }}>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="得分"
                      dataKey="A"
                      stroke="#1677ff"
                      fill="#1677ff"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="缺失关键词" style={{ height: '100%' }}>
              {fullReport.missingKeywords.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {fullReport.missingKeywords.map((kw, idx) => (
                    <Tag key={idx} color="orange" style={{ fontSize: 13, padding: '4px 12px' }}>
                      <BulbOutlined style={{ marginRight: 4 }} />
                      {kw}
                    </Tag>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#52c41a', textAlign: 'center', padding: 20 }}>
                  ✅ 关键词覆盖良好
                </div>
              )}

              {fullReport.weakVerbs.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontWeight: 500, marginBottom: 12 }}>弱动词建议替换</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {fullReport.weakVerbs.map((v, idx) => (
                      <Tag key={idx} color="red" style={{ fontSize: 13 }}>
                        {v}
                      </Tag>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: '#718096', marginTop: 8 }}>
                    建议替换为：主导、负责、设计、优化、推动、搭建等强动词
                  </p>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24}>
            <Card title="优化建议">
              {fullReport.suggestions.length > 0 ? (
                <List
                  dataSource={fullReport.suggestions}
                  renderItem={(suggestion, index) => (
                    <List.Item style={{ border: '1px solid #e8e8e8', borderRadius: 8, marginBottom: 8, padding: 16 }}>
                      <Space align="start">
                        <div style={{ 
                          width: 28, 
                          height: 28, 
                          borderRadius: '50%', 
                          background: '#e6f4ff', 
                          color: '#1677ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <ArrowUpOutlined />
                        </div>
                        <span>{suggestion}</span>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ color: '#52c41a', textAlign: 'center', padding: 20 }}>
                  ✅ 简历质量优秀，暂无优化建议
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24}>
            <Card 
              title="ATS友好纯文本预览" 
              extra={
                <Button 
                  size="small" 
                  icon={<FileTextOutlined />}
                  onClick={async () => {
                    if (!selectedResume) return;
                    try {
                      const res: any = await qualityApi.generateATSText(selectedResume.content);
                      const blob = new Blob([res.text], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'ATS友好简历.txt';
                      a.click();
                      URL.revokeObjectURL(url);
                      msg.success('下载成功');
                    } catch (err: any) {
                      msg.error(err.error || '生成失败');
                    }
                  }}
                >
                  下载纯文本
                </Button>
              }
            >
              <div style={{ background: '#fafafa', padding: 20, borderRadius: 8, fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto' }}>
                {selectedResume && (
                  <>
{selectedResume.content?.basicInfo?.name || '姓名'}
电话: {selectedResume.content?.basicInfo?.phone || ''} | 邮箱: {selectedResume.content?.basicInfo?.email || ''}

{selectedResume.content?.summary || '个人简介...'}

【工作/实习经历】
{selectedResume.content?.experience?.map((exp, idx) => (
`▪ ${exp.company || '公司'} - ${exp.position || '职位'}
  ${exp.startDate || ''} - ${exp.endDate || '至今'}
  ${exp.description || ''}`
)).join('\n\n') || '暂无'}

【项目经历】
{selectedResume.content?.projects?.map((proj, idx) => (
`▪ ${proj.name || '项目'}${proj.role ? ' - ' + proj.role : ''}
  技术栈: ${proj.technologies?.join(', ') || ''}
  ${proj.description || ''}`
)).join('\n\n') || '暂无'}

【教育背景】
{selectedResume.content?.education?.map((edu, idx) => (
`▪ ${edu.school || '学校'}${edu.degree ? ' - ' + edu.degree : ''}${edu.major ? ' - ' + edu.major : ''}
  ${edu.startDate || ''} - ${edu.endDate || ''}`
)).join('\n\n') || '暂无'}

【专业技能】
{selectedResume.content?.skills?.map((skill, idx) => (
`▪ ${skill.category}: ${skill.items?.join(', ')}`
)).join('\n') || '暂无'}
                  </>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default QualityPage;
