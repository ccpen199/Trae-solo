import { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Tag, Space, Button, Progress, Input, Avatar, Empty, Tabs, Alert, Statistic, List } from 'antd';
import { BulbOutlined, SearchOutlined, UserOutlined, AccountBookOutlined, TrophyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAppStore } from '../store';

const { Title, Text, Paragraph } = Typography;

export default function Matching() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [activeTab, setActiveTab] = useState(user?.role === 'jobseeker' ? 'jobs' : 'resumes');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [graphData, setGraphData] = useState<any>(null);
  const [intentText, setIntentText] = useState('');
  const [intentResult, setIntentResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadRecommendations = () => {
    setLoading(true);
    const apiCall = activeTab === 'jobs' ? '/matching/jobs/recommend' : `/matching/resumes/recommend/demo`;
    api.get(apiCall).then((d: any) => {
      setRecommendations(d.recommendations || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadRecommendations(); }, [activeTab]);

  useEffect(() => {
    api.get('/matching/skill-graph').then((d: any) => setGraphData(d));
  }, []);

  const analyzeIntent = () => {
    if (!intentText.trim()) return;
    api.post('/matching/analyze-intent', { text: intentText }).then((d: any) => setIntentResult(d));
  };

  const graphOption = graphData ? {
    tooltip: {},
    legend: [{ data: graphData.categories?.map((c: any) => c.name) || [], bottom: 0 }],
    series: [{
      type: 'graph', layout: 'force',
      data: graphData.nodes?.map((n: any) => ({ id: n.id, name: n.name, category: n.categoryIndex, symbolSize: n.value * 10 + 20 })) || [],
      links: graphData.links || [],
      categories: graphData.categories || [],
      force: { repulsion: 200, edgeLength: 60 },
      label: { show: true, position: 'right', fontSize: 10 },
      roam: true,
      lineStyle: { color: 'source', curveness: 0.3 }
    }]
  } : {};

  const scoreOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: recommendations.slice(0, 10).map(r => (r.job?.title || r.resume?.user_name || '').substring(0, 8)) },
    yAxis: { type: 'value', max: 1, axisLabel: { formatter: (v: number) => (v * 100) + '%' } },
    series: [
      { type: 'bar', name: '匹配度', data: recommendations.slice(0, 10).map(r => r.score), itemStyle: { color: '#1677ff' }, barWidth: 20 },
      { type: 'line', name: '置信度', data: recommendations.slice(0, 10).map(r => r.confidence), itemStyle: { color: '#52c41a' }, smooth: true }
    ]
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <div className="flex-between">
        <Title level={4} style={{ margin: 0 }}><BulbOutlined style={{ color: '#1677ff' }} /> 多维智能匹配中心</Title>
        <Space>
          <Input
            prefix={<SearchOutlined />}
            placeholder="输入需求分析意图..."
            value={intentText}
            onChange={e => setIntentText(e.target.value)}
            style={{ width: 320 }}
            onPressEnter={analyzeIntent}
          />
          <Button type="primary" icon={<ThunderboltOutlined />} onClick={analyzeIntent}>意图识别</Button>
        </Space>
      </div>

      {intentResult && (
        <Alert
          type="info"
          showIcon
          message={
            <Space>
              <Tag color="blue" style={{ fontSize: 14 }}>识别意图：{intentResult.intentInfo?.label}</Tag>
              <Text>{intentResult.intentInfo?.description}</Text>
            </Space>
          }
          description={
            <Space wrap>
              {intentResult.intentInfo?.actions?.map((a: string) => <Button key={a} size="small">{a}</Button>)}
            </Space>
          }
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card
            title="智能推荐结果"
            extra={<Button onClick={loadRecommendations} loading={loading}>刷新推荐</Button>}
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                { key: 'jobs', label: <span><AccountBookOutlined /> 岗位推荐（求职者）</span> },
                { key: 'resumes', label: <span><UserOutlined /> 人才推荐（HR）</span> }
              ]}
            />
            {loading ? <Card loading /> :
              recommendations.length === 0 ? <Empty description={activeTab === 'jobs' ? '请先创建简历以获取推荐' : '暂无匹配的候选人'} /> :
                <List
                  dataSource={recommendations.slice(0, 10)}
                  renderItem={(item: any) => {
                    const target = item.job || item.resume;
                    return (
                      <div className="card-hover" onClick={() => navigate(activeTab === 'jobs' ? `/jobs/${item.id}` : `/resumes/${item.id}`)} style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
                        <Row gutter={16} align="middle">
                          <Col flex="auto">
                            <Space>
                              <Avatar size={40}>{(target?.title || target?.user_name || '?')[0]}</Avatar>
                              <div>
                                <Text strong style={{ fontSize: 16 }}>{target?.title || target?.user_name}</Text>
                                <div style={{ fontSize: 12, color: '#999' }}>
                                  {activeTab === 'jobs' ? `${target?.location || '远程'} · ${target?.salary_min || 0}-${target?.salary_max || 0}K` : `${target?.experience || 0}年经验 · ${target?.education || '学历未填'}`}
                                </div>
                              </div>
                            </Space>
                            <Space wrap size="small" style={{ marginTop: 8 }}>
                              {item.matched?.slice(0, 4).map((m: string) => <Tag key={m} color="green">{m} ✓</Tag>)}
                              {item.missing?.slice(0, 2).map((m: string) => <Tag key={m} color="orange">{m} 待提升</Tag>)}
                            </Space>
                            <div style={{ marginTop: 8 }}>
                              {item.reasons?.slice(0, 2).map((r: string, i: number) => <Text key={i} type="secondary" style={{ fontSize: 12, display: 'block' }}>• {r}</Text>)}
                            </div>
                          </Col>
                          <Col>
                            <div style={{ textAlign: 'center' }}>
                              <Progress type="dashboard" percent={Math.round(item.score * 100)} size={80} />
                              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                                置信度 {Math.round(item.confidence * 100)}%
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    );
                  }}
                />
            }
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title={<span><TrophyOutlined style={{ color: '#faad14' }} /> 匹配概览</span>}>
            <Row gutter={[8, 16]}>
              <Col span={12}><Statistic title="推荐总数" value={recommendations.length} /></Col>
              <Col span={12}><Statistic title="高精度匹配" value={recommendations.filter((r: any) => r.score > 0.8).length} valueStyle={{ color: '#52c41a' }} /></Col>
              <Col span={12}><Statistic title="平均匹配度" value={recommendations.length ? Math.round((recommendations.reduce((a: number, b: any) => a + b.score, 0) / recommendations.length) * 100) : 0} suffix="%" /></Col>
              <Col span={12}><Statistic title="平均置信度" value={recommendations.length ? Math.round((recommendations.reduce((a: number, b: any) => a + b.confidence, 0) / recommendations.length) * 100) : 0} suffix="%" valueStyle={{ color: '#1677ff' }} /></Col>
            </Row>
          </Card>

          <Card title="技能分布图谱" style={{ marginTop: 16 }}>
            {graphData ? (
              <ReactECharts option={graphOption} style={{ height: 320 }} />
            ) : <Card loading />}
          </Card>
        </Col>
      </Row>

      {recommendations.length > 0 && (
        <Card title="匹配度与置信度对比分析">
          <ReactECharts option={scoreOption} style={{ height: 300 }} />
        </Card>
      )}
    </Space>
  );
}
