import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Button, Card, Col, DatePicker, Descriptions, Drawer, Form, Input, InputNumber, List, Modal, Progress, Row, Select, Space, Steps, Table, Tag, Timeline, message,
} from 'antd';
import {
  EyeOutlined, PlusOutlined, RobotOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, SyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '@/utils/api';

type Inspection = {
  id: number;
  project_id: number;
  project_title?: string;
  type: string;
  inspector?: string;
  inspector_name?: string;
  scheduled_date: string;
  status: string;
  created_at?: string;
  updated_at?: string;
};

type InspectionReport = {
  id: number;
  inspection_id: number;
  task_id: number;
  image_urls: string[];
  images: string[];
  defects: Defect[];
  suggestions: string[];
  overall_score: number;
  ai_analysis?: string;
  status: string;
  created_at: string;
  updated_at?: string;
};

type Defect = {
  id?: number;
  name?: string;
  description: string;
  severity: string;
  location?: string;
};

type Project = {
  id: number;
  title: string;
};

const typeLabels: Record<string, string> = {
  water_electric: '水电隐蔽工程',
  masonry: '泥木验收',
  completion: '竣工交付',
};

const statusColors: Record<string, string> = {
  pending: 'blue',
  in_progress: 'orange',
  completed: 'green',
  failed: 'red',
};

const statusLabels: Record<string, string> = {
  pending: '待检',
  in_progress: '进行中',
  completed: '已完成',
  failed: '不合格',
};

const severityColors: Record<string, string> = {
  high: 'red',
  medium: 'orange',
  low: 'blue',
};

const severityLabels: Record<string, string> = {
  high: '严重',
  medium: '中等',
  low: '轻微',
};

const reportStatusLabels: Record<string, string> = {
  pass: '通过',
  conditional: '有条件通过',
  fail: '不合格',
};

const reportStatusColors: Record<string, string> = {
  pass: 'green',
  conditional: 'orange',
  fail: 'red',
};

export default function Inspections() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filterProject, setFilterProject] = useState<number | undefined>();
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentInspection, setCurrentInspection] = useState<Inspection | null>(null);
  const [report, setReport] = useState<InspectionReport | null>(null);

  const [reportEditOpen, setReportEditOpen] = useState(false);
  const [reportViewOpen, setReportViewOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [defects, setDefects] = useState<Defect[]>([{ description: '', severity: 'low', location: '' }]);
  const [suggestions, setSuggestions] = useState<string[]>(['']);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [reportScore, setReportScore] = useState(0);
  const [reportAiAnalysis, setReportAiAnalysis] = useState('');

  const [createForm] = Form.useForm();
  const [reportForm] = Form.useForm();

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (filterProject) params.project_id = filterProject;
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/inspections', { params });
      const data = res.data.data;
      setInspections(data.list || []);
      setTotal(data.total || 0);
    } catch {
      message.error('获取质检列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterProject, filterType, filterStatus]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get('/projects', { params: { pageSize: 100 } });
      setProjects(res.data.data.list || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  async function handleCreate(values: { project_id: number; type: string; inspector?: string; scheduled_date: dayjs.Dayjs }) {
    try {
      await api.post('/inspections', { ...values, scheduled_date: values.scheduled_date.format('YYYY-MM-DD') });
      message.success('创建成功');
      setCreateOpen(false);
      createForm.resetFields();
      fetchInspections();
    } catch {
      message.error('创建失败');
    }
  }

  async function handleViewDetail(record: Inspection) {
    setCurrentInspection(record);
    setDetailOpen(true);
    try {
      const res = await api.get(`/inspections/${record.id}/report`);
      setReport(res.data.data || null);
    } catch {
      setReport(null);
    }
  }

  function openReportEdit() {
    if (report) {
      setDefects(report.defects.length > 0 ? report.defects : [{ description: '', severity: 'low', location: '' }]);
      setSuggestions(report.suggestions.length > 0 ? report.suggestions : ['']);
      setImageUrls(report.image_urls.length > 0 ? report.image_urls : ['']);
      setReportScore(report.overall_score);
      setReportAiAnalysis(report.ai_analysis || '');
    } else {
      setDefects([{ description: '', severity: 'low', location: '' }]);
      setSuggestions(['']);
      setImageUrls(['']);
      setReportScore(0);
      setReportAiAnalysis('');
    }
    setDetailOpen(false);
    setReportEditOpen(true);
  }

  const getReportStatusFromScore = (score: number): 'pass' | 'conditional' | 'fail' => {
    if (score >= 80) return 'pass';
    if (score >= 60) return 'conditional';
    return 'fail';
  };

  async function handleAiAnalyze() {
    if (!currentInspection) return;
    setAiLoading(true);
    try {
      const res = await api.post('/inspections/ai-analyze', { inspection_id: currentInspection.id });
      const aiData = res.data.data;
      setReportAiAnalysis(aiData.ai_analysis || aiData.analysis || '');
      if (aiData.defects) {
        const normalizedDefects = aiData.defects.map((d: any) => ({
          description: d.description || d.name || '',
          severity: d.severity || 'low',
          location: d.location || '',
        }));
        setDefects(normalizedDefects.length > 0 ? normalizedDefects : [{ description: '', severity: 'low', location: '' }]);
      }
      if (aiData.suggestions) {
        setSuggestions(aiData.suggestions.length > 0 ? aiData.suggestions : ['']);
      }
      if (aiData.overall_score !== undefined) {
        setReportScore(Number(aiData.overall_score));
      }
      message.success('AI分析完成，请核对后保存');
    } catch {
      message.error('AI分析失败');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSaveReport() {
    if (!currentInspection) return;
    try {
      const reportStatus = getReportStatusFromScore(reportScore);
      const payload = {
        image_urls: imageUrls.filter((u) => u.trim()),
        images: imageUrls.filter((u) => u.trim()),
        defects: defects.filter((d) => d.description.trim()),
        suggestions: suggestions.filter((s) => s.trim()),
        overall_score: reportScore,
        ai_analysis: reportAiAnalysis,
        status: reportStatus,
      };
      let saveRes;
      if (report?.id) {
        saveRes = await api.patch(`/inspections/${currentInspection.id}/report`, payload);
      } else {
        saveRes = await api.post(`/inspections/${currentInspection.id}/report`, payload);
      }
      message.success('报告保存成功');
      setReportEditOpen(false);
      await fetchInspections();
      const res = await api.get(`/inspections/${currentInspection.id}/report`);
      const updatedReport = res.data.data || null;
      setReport(updatedReport);
      if (currentInspection && updatedReport) {
        const taskStatus = reportStatus === 'fail' ? 'failed' : 'completed';
        setCurrentInspection({ ...currentInspection, status: taskStatus, updated_at: new Date().toISOString() });
      }
      setDetailOpen(true);
    } catch {
      message.error('报告保存失败');
    }
  }

  function openReportView() {
    setReportViewOpen(true);
  }

  async function handleCreateReinspection() {
    if (!currentInspection) return;
    try {
      await api.post('/inspections', {
        project_id: currentInspection.project_id,
        type: currentInspection.type,
        inspector: currentInspection.inspector,
        scheduled_date: dayjs().add(3, 'day').format('YYYY-MM-DD'),
        description: `复检任务 - 基于原任务#${currentInspection.id}`,
      });
      message.success('复检任务创建成功');
      setReportViewOpen(false);
      fetchInspections();
    } catch {
      message.error('创建复检任务失败');
    }
  }

  const getReinspectionSuggestion = (score: number, status: string) => {
    if (status === 'pass') {
      return {
        title: '验收通过',
        type: 'success' as const,
        content: '本次质检验收通过，工程质量符合标准要求。可进入下一施工阶段。',
      };
    }
    if (status === 'conditional') {
      return {
        title: '有条件通过，需复检',
        type: 'warning' as const,
        content: `综合评分 ${score} 分，存在 minor 缺陷需要整改。请在3个工作日内完成整改并申请复检。`,
      };
    }
    return {
      title: '验收不合格，需整改',
      type: 'error' as const,
      content: `综合评分 ${score} 分，存在严重质量问题。必须立即停工整改，整改完成后重新申请验收。`,
    };
  };

  const getStatusTimeline = (inspection: Inspection, report?: InspectionReport) => {
    const items: any[] = [
      {
        color: 'blue',
        dot: <ClockCircleOutlined />,
        children: <div><div style={{ fontWeight: 'bold' }}>待检</div><div style={{ color: '#999', fontSize: 12 }}>{dayjs(inspection.created_at || inspection.scheduled_date).format('YYYY-MM-DD HH:mm')}</div></div>,
      },
    ];

    if (inspection.status === 'in_progress' || inspection.status === 'completed' || inspection.status === 'failed') {
      items.push({
        color: 'orange',
        dot: <SyncOutlined spin={inspection.status === 'in_progress'} />,
        children: <div><div style={{ fontWeight: 'bold' }}>进行中</div><div style={{ color: '#999', fontSize: 12 }}>质检中</div></div>,
      });
    }

    if (inspection.status === 'completed' || inspection.status === 'failed') {
      const isPassed = inspection.status === 'completed';
      items.push({
        color: isPassed ? 'green' : 'red',
        dot: isPassed ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
        children: (
          <div>
            <div style={{ fontWeight: 'bold' }}>{isPassed ? '已完成' : '不合格'}</div>
            <div style={{ color: '#999', fontSize: 12 }}>{report ? dayjs(report.created_at).format('YYYY-MM-DD HH:mm') : dayjs(inspection.updated_at).format('YYYY-MM-DD HH:mm')}</div>
          </div>
        ),
      });
    }

    return items;
  };

  const columns: ColumnsType<Inspection> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '项目', dataIndex: 'project_title', key: 'project_title', ellipsis: true, render: (v, r) => v || `项目#${r.project_id}` },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: (v) => <Tag color="purple">{typeLabels[v] || v}</Tag>,
    },
    { title: '质检员', dataIndex: 'inspector', key: 'inspector', width: 90, render: (v) => v || '-' },
    {
      title: '计划日期',
      dataIndex: 'scheduled_date',
      key: 'scheduled_date',
      width: 120,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v) => <Tag color={statusColors[v] || 'default'}>{statusLabels[v] || v}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => { setCurrentInspection(record); openReportEdit(); }}>报告</Button>
        </Space>
      ),
    },
  ];

  const scoreColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title="质检任务管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新建质检任务</Button>}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col>
            <Select
              placeholder="选择项目"
              allowClear
              style={{ width: 200 }}
              value={filterProject}
              onChange={(v) => { setFilterProject(v); setPage(1); }}
              options={projects.map((p) => ({ value: p.id, label: p.title }))}
            />
          </Col>
          <Col>
            <Select
              placeholder="质检类型"
              allowClear
              style={{ width: 160 }}
              value={filterType}
              onChange={(v) => { setFilterType(v); setPage(1); }}
              options={Object.entries(typeLabels).map(([value, label]) => ({ value, label }))}
            />
          </Col>
          <Col>
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 120 }}
              value={filterStatus}
              onChange={(v) => { setFilterStatus(v); setPage(1); }}
              options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
            />
          </Col>
        </Row>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={inspections}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      <Modal title="新建质检任务" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={() => createForm.submit()}>
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="project_id" label="所属项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select placeholder="请选择项目" options={projects.map((p) => ({ value: p.id, label: p.title }))} />
          </Form.Item>
          <Form.Item name="type" label="质检类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select placeholder="请选择质检类型" options={Object.entries(typeLabels).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="inspector" label="质检员">
            <Input placeholder="请输入质检员姓名" />
          </Form.Item>
          <Form.Item name="scheduled_date" label="计划日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="质检详情"
        width={640}
        open={detailOpen}
        closable={false}
        destroyOnClose
        onClose={() => setDetailOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setDetailOpen(false)}>关闭</Button>
            <Button icon={<FileTextOutlined />} onClick={openReportEdit}>编辑报告</Button>
            {report && <Button type="primary" onClick={openReportView}>查看报告</Button>}
          </Space>
        }
      >
        {currentInspection && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="ID">{currentInspection.id}</Descriptions.Item>
              <Descriptions.Item label="项目">{currentInspection.project_title || `项目#${currentInspection.project_id}`}</Descriptions.Item>
              <Descriptions.Item label="类型"><Tag color="purple">{typeLabels[currentInspection.type] || currentInspection.type}</Tag></Descriptions.Item>
              <Descriptions.Item label="质检员">{currentInspection.inspector || '-'}</Descriptions.Item>
              <Descriptions.Item label="计划日期">{dayjs(currentInspection.scheduled_date).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusColors[currentInspection.status]}>{statusLabels[currentInspection.status]}</Tag></Descriptions.Item>
            </Descriptions>
            {report && ['pass', 'conditional', 'fail'].includes(report.status) ? (
              <Card title="报告摘要" size="small" style={{ marginTop: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>报告状态: <Tag color={reportStatusColors[report.status]}>{reportStatusLabels[report.status]}</Tag></div>
                  <div>综合评分: <span style={{ fontSize: 24, fontWeight: 'bold', color: scoreColor(report.overall_score) }}>{report.overall_score}</span></div>
                  <div>缺陷数: {report.defects?.length || 0}</div>
                  <div>建议数: {report.suggestions?.length || 0}</div>
                  {report.ai_analysis && <div style={{ marginTop: 8, padding: 8, background: '#f6f6f6', borderRadius: 4 }}>AI分析: {report.ai_analysis}</div>}
                </Space>
              </Card>
            ) : (
              <Card size="small" style={{ marginTop: 16 }}>
                <Alert type="info" message="暂无报告，点击编辑报告生成" />
              </Card>
            )}
          </>
        )}
      </Drawer>

      <Modal title="质检报告" open={reportEditOpen} onCancel={() => setReportEditOpen(false)} onOk={handleSaveReport} width={720}>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<RobotOutlined />} loading={aiLoading} onClick={handleAiAnalyze}>AI分析</Button>
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Card title="图片" size="small">
            {imageUrls.map((url, i) => (
              <Row key={i} gutter={8} style={{ marginBottom: 4 }}>
                <Col flex="auto">
                  <Input value={url} placeholder="图片URL" onChange={(e) => { const next = [...imageUrls]; next[i] = e.target.value; setImageUrls(next); }} />
                </Col>
                <Col><Button danger onClick={() => setImageUrls(imageUrls.filter((_, idx) => idx !== i))}>删除</Button></Col>
              </Row>
            ))}
            <Button size="small" onClick={() => setImageUrls([...imageUrls, ''])}>添加图片</Button>
          </Card>

          <Card title="缺陷列表" size="small">
            {defects.map((defect, i) => (
              <Row key={i} gutter={8} style={{ marginBottom: 8 }} align="middle">
                <Col span={8}>
                  <Input value={defect.description} placeholder="缺陷描述" onChange={(e) => { const next = [...defects]; next[i] = { ...next[i], description: e.target.value }; setDefects(next); }} />
                </Col>
                <Col span={4}>
                  <Select value={defect.severity} style={{ width: '100%' }} onChange={(v) => { const next = [...defects]; next[i] = { ...next[i], severity: v }; setDefects(next); }} options={Object.entries(severityLabels).map(([value, label]) => ({ value, label }))} />
                </Col>
                <Col span={8}>
                  <Input value={defect.location || ''} placeholder="位置" onChange={(e) => { const next = [...defects]; next[i] = { ...next[i], location: e.target.value }; setDefects(next); }} />
                </Col>
                <Col span={4}><Button danger size="small" onClick={() => setDefects(defects.filter((_, idx) => idx !== i))}>删除</Button></Col>
              </Row>
            ))}
            <Button size="small" onClick={() => setDefects([...defects, { description: '', severity: 'low', location: '' }])}>添加缺陷</Button>
          </Card>

          <Card title="建议" size="small">
            {suggestions.map((s, i) => (
              <Row key={i} gutter={8} style={{ marginBottom: 4 }}>
                <Col flex="auto"><Input value={s} placeholder="建议内容" onChange={(e) => { const next = [...suggestions]; next[i] = e.target.value; setSuggestions(next); }} /></Col>
                <Col><Button danger onClick={() => setSuggestions(suggestions.filter((_, idx) => idx !== i))}>删除</Button></Col>
              </Row>
            ))}
            <Button size="small" onClick={() => setSuggestions([...suggestions, ''])}>添加建议</Button>
          </Card>

          <Card title="综合评分" size="small">
            <Row align="middle" gutter={16}>
              <Col><InputNumber min={0} max={100} value={reportScore} onChange={(v) => setReportScore(v || 0)} style={{ width: 100 }} /></Col>
              <Col flex="auto"><Progress percent={reportScore} strokeColor={scoreColor(reportScore)} /></Col>
            </Row>
          </Card>

          {reportAiAnalysis && (
            <Card title="AI分析结果" size="small">
              <div style={{ padding: 8, background: '#f0f5ff', borderRadius: 4, whiteSpace: 'pre-wrap' }}>{reportAiAnalysis}</div>
            </Card>
          )}
        </Space>
      </Modal>

      <Modal
        title="质检报告查看"
        open={reportViewOpen}
        onCancel={() => setReportViewOpen(false)}
        width={720}
        footer={
          report?.status === 'conditional' ? (
            <Button type="primary" danger icon={<PlusOutlined />} onClick={handleCreateReinspection}>创建复检任务</Button>
          ) : null
        }
      >
        {report && currentInspection && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {report.status === 'conditional' && (
              <Alert
                type="warning"
                showIcon
                message="待复检"
                description="本报告为有条件通过，需要在整改完成后进行复检。"
                style={{ marginBottom: 16 }}
              />
            )}

            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" title="报告状态">
                  <Tag color={reportStatusColors[report.status]} style={{ fontSize: 16, padding: '4px 12px' }}>
                    {reportStatusLabels[report.status]}
                  </Tag>
                </Card>
              </Col>
              <Col span={16}>
                <Card size="small">
                  <Row align="middle" gutter={16}>
                    <Col>
                      <Progress
                        type="dashboard"
                        percent={report.overall_score}
                        strokeColor={scoreColor(report.overall_score)}
                        width={80}
                        format={(percent) => <span style={{ fontSize: 20, fontWeight: 'bold', color: scoreColor(percent || 0) }}>{percent}</span>}
                      />
                    </Col>
                    <Col flex="auto">
                      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>综合评分</div>
                      <div style={{ color: '#666' }}>
                        {report.overall_score >= 80 ? '优秀，工程质量符合标准' :
                         report.overall_score >= 60 ? '合格，但存在缺陷需整改' :
                         '不合格，存在严重质量问题'}
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            <Card title="验收状态流转" size="small">
              <Timeline items={getStatusTimeline(currentInspection, report)} />
            </Card>

            {(() => {
              const suggestion = getReinspectionSuggestion(report.overall_score, report.status);
              return (
                <Alert
                  type={suggestion.type}
                  showIcon
                  message={suggestion.title}
                  description={suggestion.content}
                />
              );
            })()}

            {(report.image_urls?.length > 0 || report.images?.length > 0) && (
              <Card title="缺陷图片" size="small">
                <Space wrap>
                  {(report.image_urls || report.images || []).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`缺陷图片${i + 1}`}
                      style={{ maxWidth: 200, maxHeight: 150, borderRadius: 4, border: '1px solid #eee', cursor: 'pointer' }}
                    />
                  ))}
                </Space>
              </Card>
            )}

            {report.ai_analysis && (
              <Card title="AI分析" size="small">
                <div style={{ padding: 12, background: '#f0f5ff', borderRadius: 4, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {report.ai_analysis}
                </div>
              </Card>
            )}

            <Card title={`缺陷列表 (${report.defects?.length || 0})`} size="small">
              <List
                dataSource={report.defects || []}
                locale={{ emptyText: '暂无缺陷记录' }}
                renderItem={(defect) => (
                  <List.Item>
                    <Space direction="vertical" style={{ width: '100%' }} size={0}>
                      <Space>
                        <Tag color={severityColors[defect.severity]}>{severityLabels[defect.severity]}</Tag>
                        <span style={{ fontWeight: 500 }}>{defect.description}</span>
                      </Space>
                      {defect.location && <div style={{ color: '#999', fontSize: 12, paddingLeft: 28 }}>位置: {defect.location}</div>}
                    </Space>
                  </List.Item>
                )}
              />
            </Card>

            <Card title={`复检建议 (${report.suggestions?.length || 0})`} size="small">
              <List
                dataSource={report.suggestions || []}
                locale={{ emptyText: '暂无建议' }}
                renderItem={(item, index) => (
                  <List.Item>
                    <Space>
                      <Tag color="blue">{index + 1}</Tag>
                      <span>{item}</span>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          </Space>
        )}
      </Modal>
    </div>
  );
}
