import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Progress, Table, Input, Button, Row, Col, Descriptions, Tag, theme, message } from 'antd';
import { SearchOutlined, FileSearchOutlined, TrophyOutlined, BulbOutlined, DollarOutlined, SwapOutlined, GiftOutlined, BarChartOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface DimensionScore {
  label: string;
  score: number;
  maxScore: number;
  description: string;
}

interface AssessmentResult {
  patentNumber: string;
  patentName: string;
  overallScore: number;
  level: string;
  dimensions: DimensionScore[];
  report: string;
  assessmentDate: string;
}

interface HistoryRecord {
  id: string;
  patentNumber: string;
  patentName: string;
  overallScore: number;
  level: string;
  assessmentDate: string;
  assessor: string;
}

interface ReviewRecord {
  id: string;
  reviewDate: string;
  reviewer: string;
  scoreChange: string;
  remark: string;
}

interface ComparablePatent {
  id: string;
  patentNumber: string;
  patentName: string;
  field: string;
  overallScore: number;
  level: string;
}

const mockAssessment: AssessmentResult = {
  patentNumber: 'CN202410890123.4',
  patentName: '基于Transformer的中文文本检索系统',
  overallScore: 82,
  level: '高价值',
  dimensions: [
    { label: '引用数', score: 78, maxScore: 100, description: '该专利被引用35次，高于同领域平均水平' },
    { label: '法律状态', score: 90, maxScore: 100, description: '专利已授权，权利要求范围稳固，无无效宣告记录' },
    { label: '技术领域热度', score: 88, maxScore: 100, description: 'NLP与信息检索为当前热门技术领域' },
    { label: '剩余保护期', score: 65, maxScore: 100, description: '已授权2年，剩余保护期约18年' },
    { label: '市场应用度', score: 85, maxScore: 100, description: '技术可应用于搜索、推荐、客服等多个商业场景' },
  ],
  report: '本专利涉及基于Transformer架构的中文文本检索技术，属于人工智能与自然语言处理交叉领域的高价值专利。该专利技术方案创新性较强，采用预训练语言模型进行语义编码，有效解决了传统关键词匹配的语义鸿沟问题。从法律状态来看，专利已获授权且权利稳定；从技术热度来看，大语言模型与语义检索为当前最具前景的技术方向之一；从市场应用角度，该技术可广泛应用于搜索引擎、智能客服、知识管理等领域，商业化前景良好。综合评估，该专利属于高价值专利，建议持续维护并积极进行许可运营。',
  assessmentDate: '2026-06-09',
};

const mockHistory: HistoryRecord[] = [
  { id: '1', patentNumber: 'CN202410890123.4', patentName: '基于Transformer的中文文本检索系统', overallScore: 82, level: '高价值', assessmentDate: '2026-06-09', assessor: '张代理' },
  { id: '2', patentNumber: 'CN202410123456.7', patentName: '一种智能土壤耕作装置', overallScore: 61, level: '中等价值', assessmentDate: '2026-06-05', assessor: '张代理' },
  { id: '3', patentNumber: 'CN202310678901.2', patentName: '基于纳米材料的生物传感器', overallScore: 74, level: '较高价值', assessmentDate: '2026-06-01', assessor: '李代理' },
  { id: '4', patentNumber: 'CN202410901234.5', patentName: '一种联邦学习隐私保护方法', overallScore: 88, level: '高价值', assessmentDate: '2026-05-28', assessor: '张代理' },
  { id: '5', patentNumber: 'CN202410567890.1', patentName: '电动汽车无线充电系统及方法', overallScore: 70, level: '较高价值', assessmentDate: '2026-05-20', assessor: '王代理' },
  { id: '6', patentNumber: 'CN202310012345.6', patentName: '光谱分析检测食品中有害物质的方法', overallScore: 55, level: '中等价值', assessmentDate: '2026-05-15', assessor: '李代理' },
];

const mockReviewRecords: ReviewRecord[] = [
  { id: '1', reviewDate: '2026-06-09', reviewer: '张代理', scoreChange: '85→88', remark: '市场应用度评分上调，大模型领域商业化加速' },
  { id: '2', reviewDate: '2026-03-15', reviewer: '李代理', scoreChange: '82→85', remark: '引用数增长，技术热度持续上升' },
  { id: '3', reviewDate: '2025-12-01', reviewer: '张代理', scoreChange: '78→82', remark: '专利获得授权，法律状态评分提升' },
  { id: '4', reviewDate: '2025-08-20', reviewer: '王代理', scoreChange: '-', remark: '首次评估，综合评分78' },
];

const mockComparablePatents: ComparablePatent[] = [
  { id: '1', patentNumber: 'CN202310556677.8', patentName: '基于BERT的语义匹配检索方法', field: 'NLP/信息检索', overallScore: 76, level: '较高价值' },
  { id: '2', patentNumber: 'CN202410334455.6', patentName: '多模态文档检索与知识抽取系统', field: 'NLP/信息检索', overallScore: 84, level: '高价值' },
  { id: '3', patentNumber: 'CN202310778899.0', patentName: '面向中文的预训练语言模型优化方法', field: 'NLP/信息检索', overallScore: 71, level: '较高价值' },
];

const levelColorMap: Record<string, string> = {
  '极高价值': '#722ed1',
  '高价值': '#1890ff',
  '较高价值': '#52c41a',
  '中等价值': '#faad14',
  '一般价值': '#fa8c16',
  '低价值': '#f5222d',
};

function getScoreColor(score: number): string {
  if (score >= 85) return '#722ed1';
  if (score >= 70) return '#1890ff';
  if (score >= 55) return '#52c41a';
  if (score >= 40) return '#faad14';
  return '#f5222d';
}

function RadarChart({ dimensions }: { dimensions: DimensionScore[] }) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 110;
  const n = dimensions.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const getPoint = (index: number, ratio: number) => {
    const angle = startAngle + index * angleStep;
    return {
      x: cx + maxR * ratio * Math.cos(angle),
      y: cy + maxR * ratio * Math.sin(angle),
    };
  };

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const dataPoints = dimensions.map((d, i) => getPoint(i, d.score / d.maxScore));
  const dataPath = dataPoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ') + ' Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gridLevels.map((level) => {
        const points = dimensions.map((_, i) => {
          const p = getPoint(i, level);
          return `${p.x},${p.y}`;
        });
        return <polygon key={level} points={points.join(' ')} fill="none" stroke="#e8e8e8" strokeWidth={1} />;
      })}
      {dimensions.map((_, i) => {
        const p = getPoint(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e8e8e8" strokeWidth={1} />;
      })}
      <path d={dataPath} fill="rgba(102,126,234,0.15)" stroke="#667eea" strokeWidth={2} />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="#667eea" stroke="#fff" strokeWidth={2} />
      ))}
      {dimensions.map((d, i) => {
        const p = getPoint(i, 1.22);
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: 11, fill: '#666', fontWeight: 500 }}
          >
            {d.label}
          </text>
        );
      })}
      {dimensions.map((d, i) => {
        const p = getPoint(i, 1.38);
        return (
          <text
            key={`s-${i}`}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: 10, fill: '#667eea', fontWeight: 700 }}
          >
            {d.score}
          </text>
        );
      })}
    </svg>
  );
}

function GaugeScore({ score }: { score: number }) {
  const color = getScoreColor(score);
  const radius = 80;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;
  const size = 200;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
        <path
          d={`M 20 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 20} ${size / 2 + 10}`}
          fill="none"
          stroke="#f0f0f0"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <path
          d={`M 20 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 20} ${size / 2 + 10}`}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
        />
        <text x={size / 2} y={size / 2 - 10} textAnchor="middle" style={{ fontSize: 40, fontWeight: 800, fill: color }}>
          {score}
        </text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" style={{ fontSize: 12, fill: '#999' }}>
          综合评分
        </text>
      </svg>
      <Tag
        color={color}
        style={{
          fontSize: 15,
          padding: '4px 20px',
          borderRadius: 20,
          fontWeight: 700,
          marginTop: -8,
          border: 'none',
        }}
      >
        {mockAssessment.level}
      </Tag>
    </div>
  );
}

const PatentValueAssessment: React.FC = () => {
  const navigate = useNavigate();
  const [patentNumber, setPatentNumber] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const { token } = theme.useToken();

  const handleSearch = () => {
    if (!patentNumber.trim()) {
      message.warning('请输入专利号');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setShowResult(true);
      setLoading(false);
      message.success('评估完成');
    }, 1200);
  };

  const historyColumns: ColumnsType<HistoryRecord> = [
    {
      title: '专利号',
      dataIndex: 'patentNumber',
      key: 'patentNumber',
      width: 180,
      render: (text: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{text}</span>,
    },
    {
      title: '专利名称',
      dataIndex: 'patentName',
      key: 'patentName',
      width: 260,
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '综合评分',
      dataIndex: 'overallScore',
      key: 'overallScore',
      width: 100,
      align: 'center',
      render: (score: number) => (
        <span style={{ fontWeight: 700, color: getScoreColor(score), fontSize: 16 }}>{score}</span>
      ),
    },
    {
      title: '价值等级',
      dataIndex: 'level',
      key: 'level',
      width: 110,
      align: 'center',
      render: (level: string) => <Tag color={levelColorMap[level] ?? 'default'}>{level}</Tag>,
    },
    {
      title: '评估日期',
      dataIndex: 'assessmentDate',
      key: 'assessmentDate',
      width: 120,
    },
    {
      title: '评估人',
      dataIndex: 'assessor',
      key: 'assessor',
      width: 90,
    },
  ];

  const reviewColumns: ColumnsType<ReviewRecord> = [
    {
      title: '复查日期',
      dataIndex: 'reviewDate',
      key: 'reviewDate',
      width: 120,
    },
    {
      title: '复查人',
      dataIndex: 'reviewer',
      key: 'reviewer',
      width: 90,
      align: 'center',
    },
    {
      title: '评分变化',
      dataIndex: 'scoreChange',
      key: 'scoreChange',
      width: 120,
      align: 'center',
      render: (text: string) => {
        if (text === '-') return <span style={{ color: token.colorTextSecondary }}>-</span>;
        const parts = text.split('→');
        if (parts.length === 2) {
          const from = parseInt(parts[0], 10);
          const to = parseInt(parts[1], 10);
          const isUp = to > from;
          return (
            <span>
              <span style={{ color: token.colorTextSecondary }}>{parts[0]}</span>
              <span style={{ margin: '0 4px', color: token.colorTextSecondary }}>→</span>
              <span style={{ fontWeight: 700, color: isUp ? '#52c41a' : '#f5222d' }}>{parts[1]}</span>
              {isUp && <span style={{ color: '#52c41a', marginLeft: 4, fontSize: 11 }}>↑</span>}
              {!isUp && <span style={{ color: '#f5222d', marginLeft: 4, fontSize: 11 }}>↓</span>}
            </span>
          );
        }
        return <span>{text}</span>;
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
  ];

  const comparableColumns: ColumnsType<ComparablePatent> = [
    {
      title: '专利号',
      dataIndex: 'patentNumber',
      key: 'patentNumber',
      width: 180,
      render: (text: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{text}</span>,
    },
    {
      title: '专利名称',
      dataIndex: 'patentName',
      key: 'patentName',
      width: 240,
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '技术领域',
      dataIndex: 'field',
      key: 'field',
      width: 120,
      align: 'center',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '综合评分',
      dataIndex: 'overallScore',
      key: 'overallScore',
      width: 100,
      align: 'center',
      render: (score: number) => (
        <span style={{ fontWeight: 700, color: getScoreColor(score), fontSize: 16 }}>{score}</span>
      ),
    },
    {
      title: '价值等级',
      dataIndex: 'level',
      key: 'level',
      width: 110,
      align: 'center',
      render: (level: string) => <Tag color={levelColorMap[level] ?? 'default'}>{level}</Tag>,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 700, color: token.colorTextHeading }}>专利价值评估</h2>
        <span style={{ color: token.colorTextSecondary, fontSize: 13 }}>多维度评估专利价值，辅助知识产权运营决策</span>
      </div>

      <Card
        style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <Row align="middle" gutter={12}>
          <Col>
            <FileSearchOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
          </Col>
          <Col>
            <span style={{ fontWeight: 600, fontSize: 14 }}>输入专利号进行评估</span>
          </Col>
          <Col flex="auto">
            <Input
              placeholder="请输入专利号，如 CN202410890123.4"
              prefix={<SearchOutlined />}
              value={patentNumber}
              onChange={(e) => setPatentNumber(e.target.value)}
              onPressEnter={handleSearch}
              style={{ maxWidth: 400, borderRadius: 8 }}
              size="large"
              allowClear
            />
          </Col>
          <Col>
            <Button
              type="primary"
              size="large"
              onClick={handleSearch}
              loading={loading}
              icon={<TrophyOutlined />}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              开始评估
            </Button>
          </Col>
        </Row>
      </Card>

      {showResult && (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card
                title="综合评分"
                style={{ borderRadius: 12, height: '100%', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                styles={{ header: { borderBottom: `1px solid ${token.colorBorderSecondary}` } }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                  <GaugeScore score={mockAssessment.overallScore} />
                </div>
                <Descriptions
                  column={1}
                  size="small"
                  style={{ marginTop: 12 }}
                  contentStyle={{ fontSize: 12 }}
                  labelStyle={{ fontSize: 12, color: token.colorTextSecondary }}
                >
                  <Descriptions.Item label="专利号">{mockAssessment.patentNumber}</Descriptions.Item>
                  <Descriptions.Item label="专利名称">{mockAssessment.patentName}</Descriptions.Item>
                  <Descriptions.Item label="评估日期">{mockAssessment.assessmentDate}</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            <Col span={16}>
              <Card
                title="多维度评分"
                style={{ borderRadius: 12, height: '100%', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                styles={{ header: { borderBottom: `1px solid ${token.colorBorderSecondary}` } }}
              >
                <Row>
                  <Col span={10}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <RadarChart dimensions={mockAssessment.dimensions} />
                    </div>
                  </Col>
                  <Col span={14}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
                      {mockAssessment.dimensions.map((dim) => (
                        <div key={dim.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontWeight: 500, fontSize: 13 }}>{dim.label}</span>
                            <span style={{ fontWeight: 700, color: getScoreColor(dim.score), fontSize: 14 }}>{dim.score}/{dim.maxScore}</span>
                          </div>
                          <Progress
                            percent={dim.score}
                            strokeColor={getScoreColor(dim.score)}
                            showInfo={false}
                            size="small"
                            style={{ marginBottom: 2 }}
                          />
                          <div style={{ fontSize: 11, color: token.colorTextSecondary, lineHeight: 1.5 }}>{dim.description}</div>
                        </div>
                      ))}
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Card
            title="评估报告"
            style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            styles={{ header: { borderBottom: `1px solid ${token.colorBorderSecondary}` } }}
          >
            <div style={{
              padding: 20,
              background: token.colorBgLayout,
              borderRadius: 10,
              fontSize: 13,
              lineHeight: 2,
              color: token.colorText,
            }}>
              {mockAssessment.report}
            </div>
          </Card>

          <Card
            title={<><BulbOutlined style={{ marginRight: 6 }} />评估建议</>}
            style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', background: 'linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)' }}
            styles={{ header: { borderBottom: `1px solid ${token.colorBorderSecondary}` } }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Card
                  size="small"
                  style={{ borderRadius: 10, border: `1px solid #b7eb8f`, height: '100%' }}
                  styles={{ body: { padding: 16 } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <DollarOutlined style={{ fontSize: 18, color: '#52c41a' }} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>建议续费维护</span>
                  </div>
                  <div style={{ fontSize: 12, color: token.colorTextSecondary, lineHeight: 1.7, marginBottom: 12 }}>
                    该专利价值稳定上升，建议及时缴纳年费维持专利权有效，避免因逾期失效造成资产损失。
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    icon={<DollarOutlined />}
                    onClick={() => navigate('/patent/fee-reminder')}
                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  >
                    前往年费代缴
                  </Button>
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  size="small"
                  style={{ borderRadius: 10, border: `1px solid #91d5ff`, height: '100%' }}
                  styles={{ body: { padding: 16 } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <SwapOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>建议许可转让</span>
                  </div>
                  <div style={{ fontSize: 12, color: token.colorTextSecondary, lineHeight: 1.7, marginBottom: 12 }}>
                    该专利技术成熟度高、市场应用面广，适合通过许可或转让方式实现商业变现，建议启动许可运营。
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    icon={<SwapOutlined />}
                    onClick={() => navigate('/trademark/contracts')}
                  >
                    前往合同管理
                  </Button>
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  size="small"
                  style={{ borderRadius: 10, border: `1px solid #d3adf7`, height: '100%' }}
                  styles={{ body: { padding: 16 } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <GiftOutlined style={{ fontSize: 18, color: '#722ed1' }} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>建议申请补贴</span>
                  </div>
                  <div style={{ fontSize: 12, color: token.colorTextSecondary, lineHeight: 1.7, marginBottom: 12 }}>
                    该专利符合高新技术企业知识产权补贴政策要求，建议尽快申请相关财政补贴，降低维护成本。
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    icon={<GiftOutlined />}
                    onClick={() => navigate('/admin/subsidy-engine')}
                    style={{ background: '#722ed1', borderColor: '#722ed1' }}
                  >
                    前往补贴引擎
                  </Button>
                </Card>
              </Col>
            </Row>
          </Card>

          <Card
            title="复查记录"
            style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            styles={{ header: { borderBottom: `1px solid ${token.colorBorderSecondary}` }, body: { padding: 0 } }}
          >
            <Table
              columns={reviewColumns}
              dataSource={mockReviewRecords}
              rowKey="id"
              pagination={false}
            />
          </Card>

          <Card
            title={<><BarChartOutlined style={{ marginRight: 6 }} />同领域专利对比</>}
            style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            styles={{ header: { borderBottom: `1px solid ${token.colorBorderSecondary}` }, body: { padding: 0 } }}
          >
            <Table
              columns={comparableColumns}
              dataSource={mockComparablePatents}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </>
      )}

      <Card
        title="历史评估记录"
        style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        styles={{ header: { borderBottom: `1px solid ${token.colorBorderSecondary}` }, body: { padding: 0 } }}
      >
        <Table
          columns={historyColumns}
          dataSource={mockHistory}
          rowKey="id"
          pagination={{ pageSize: 5, showSizeChanger: false, showTotal: (total) => `共 ${total} 条记录` }}
        />
      </Card>
    </div>
  );
};

export default PatentValueAssessment;
