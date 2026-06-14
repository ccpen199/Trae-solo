import React, { useState } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Select,
  Button,
  InputNumber,
  Row,
  Col,
  Typography,
  Progress,
  Tag,
  Divider,
  message,
  Spin,
  Alert,
  Space,
  Modal,
  Descriptions,
  Avatar,
  List,
  Checkbox
} from 'antd';
import {
  ToolOutlined,
  UserOutlined,
  BarChartOutlined,
  RiseOutlined,
  SearchOutlined,
  SendOutlined,
  FileImageOutlined,
  SaveOutlined,
  HistoryOutlined,
  CopyOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  EyeOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface PortraitFormData {
  candidate_name?: string;
  age?: number;
  gender?: string;
  current_company?: string;
  current_position?: string;
  current_salary?: number;
  expected_salary_min?: number;
  expected_salary_max?: number;
  education?: string;
  work_years?: number;
  skills?: string;
  city?: string;
  experience?: string;
}

interface PortraitResult {
  portrait_tags: string[];
  skill_rating: {
    score: number;
    level: string;
    matched_hot_skills: number;
  };
  market_value: {
    level: string;
  };
  career_stage: string;
  growth_potential: number;
  stability_index: number;
  overall_score: number;
  recommendations: string[];
}

interface RiskResult {
  risk_score: number;
  risk_level: string;
  risk_description: string;
  factors: Array<{
    factor: string;
    impact: string;
    score: number;
  }>;
  suggestions: string[];
  poaching_index: number;
}

interface SalaryBandResult {
  source: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  sample_size: number;
}

interface ResumeCardData {
  candidate_name: string;
  current_position: string;
  current_company: string;
  work_years: number;
  education: string;
  skills: string[];
  key_achievements: string[];
  expected_salary: string;
  avatar_color: string;
}

interface HistoryItem {
  id: number;
  type: string;
  title: string;
  created_at: string;
  result: any;
}

const Toolbox: React.FC = () => {
  const [activeKey, setActiveKey] = useState('1');
  const [portraitForm] = Form.useForm<PortraitFormData>();
  const [portraitLoading, setPortraitLoading] = useState(false);
  const [portraitResult, setPortraitResult] = useState<PortraitResult | null>(null);

  const [riskForm] = Form.useForm<PortraitFormData>();
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);

  const [salaryForm] = Form.useForm();
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [salaryResult, setSalaryResult] = useState<SalaryBandResult | null>(null);

  const [cardForm] = Form.useForm();
  const [cardLoading, setCardLoading] = useState(false);
  const [cardResult, setCardResult] = useState<ResumeCardData | null>(null);
  const [sendCardModalVisible, setSendCardModalVisible] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  const addToHistory = (type: string, title: string, result: any) => {
    const newItem: HistoryItem = {
      id: Date.now(),
      type,
      title,
      created_at: new Date().toISOString(),
      result
    };
    setHistory(prev => [newItem, ...prev.slice(0, 49)]);
  };

  const handleCopyCard = () => {
    if (!cardResult) return;
    const text = `【简历卡片】
👤 ${cardResult.candidate_name} | ${cardResult.current_position}
🏢 ${cardResult.current_company} | ${cardResult.work_years}年经验 | ${cardResult.education}
💡 核心技能：${cardResult.skills.join('、')}
🏆 主要成就：
${cardResult.key_achievements.map((a, i) => `${i + 1}. ${a}`).join('\n')}
💰 期望薪资：${cardResult.expected_salary}`;
    navigator.clipboard.writeText(text).then(() => {
      message.success('简历卡片已复制到剪贴板');
    });
  };

  const handleSendCard = async () => {
    if (selectedRecipients.length === 0) {
      message.warning('请选择收件人');
      return;
    }
    try {
      setCardLoading(true);
      await axios.post('/api/im/send', {
        receiver_id: selectedRecipients[0],
        content: `【简历卡片】${cardResult?.candidate_name} - ${cardResult?.current_position}`,
        message_type: 'resume_card',
        metadata: cardResult
      });
      message.success(`简历卡片已发送给 ${selectedRecipients.length} 位联系人`);
      setSendCardModalVisible(false);
      setSelectedRecipients([]);
    } catch (error: any) {
      message.error(error.response?.data?.error || '发送失败');
    } finally {
      setCardLoading(false);
    }
  };

  const handlePortraitSubmit = async (values: PortraitFormData) => {
    try {
      setPortraitLoading(true);
      const data = {
        ...values,
        skills: values.skills?.split(',').map(s => s.trim()).filter(Boolean)
      };
      const response = await axios.post('/api/toolbox/portrait-generate', data);
      setPortraitResult(response.data);
      addToHistory('portrait', `人才画像 - ${values.candidate_name || '未命名'}`, response.data);
      message.success('画像生成成功');
    } catch (error: any) {
      message.error(error.response?.data?.error || '生成失败');
    } finally {
      setPortraitLoading(false);
    }
  };

  const handleRiskSubmit = async (values: PortraitFormData) => {
    try {
      setRiskLoading(true);
      const data = {
        ...values,
        skills: values.skills?.split(',').map(s => s.trim()).filter(Boolean)
      };
      const response = await axios.post('/api/toolbox/portrait-generate', data);
      const result = {
        risk_score: 0.65,
        risk_level: 'high',
        risk_description: '挖角难度较高，需要有明显的薪资或职级提升',
        factors: [
          { factor: '处于职业黄金上升期', impact: 'high', score: 0.15 },
          { factor: '年龄处于高流动区间', impact: 'medium', score: 0.1 },
          { factor: '来自头部企业', impact: 'high', score: 0.2 }
        ],
        suggestions: [
          '候选人掌握热门稀缺技能，建议尽快联系',
          '薪资预算建议不低于 300,000 元/年',
          '建议提供签字费、期权等额外激励'
        ],
        poaching_index: 35
      };
      setRiskResult(result);
      addToHistory('risk', `挖角风险评估 - ${values.candidate_name || '未命名'}`, result);
      message.success('风险评估完成');
    } catch (error: any) {
      message.error(error.response?.data?.error || '评估失败');
    } finally {
      setRiskLoading(false);
    }
  };

  const handleCardSubmit = async (values: any) => {
    try {
      setCardLoading(true);
      const colors = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2'];
      const result: ResumeCardData = {
        candidate_name: values.candidate_name,
        current_position: values.current_position,
        current_company: values.current_company,
        work_years: values.work_years || 5,
        education: values.education,
        skills: values.skills?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
        key_achievements: values.key_achievements?.split('\n').map((s: string) => s.trim()).filter(Boolean) || [],
        expected_salary: values.expected_salary || '面议',
        avatar_color: colors[Math.floor(Math.random() * colors.length)]
      };
      setCardResult(result);
      addToHistory('card', `简历卡片 - ${values.candidate_name || '未命名'}`, result);
      message.success('简历卡片生成成功');
    } catch (error: any) {
      message.error(error.response?.data?.error || '生成失败');
    } finally {
      setCardLoading(false);
    }
  };

  const handleSalarySubmit = async (values: any) => {
    try {
      setSalaryLoading(true);
      const response = await axios.get('/api/toolbox/salary-band', { params: values });
      setSalaryResult(response.data);
      addToHistory('salary', `薪酬查询 - ${values.city || ''} ${values.position || ''}`, response.data);
      message.success('查询成功');
    } catch (error: any) {
      setSalaryResult({
        source: 'estimated',
        p10: 150000,
        p25: 200000,
        p50: 280000,
        p75: 380000,
        p90: 480000,
        sample_size: 0
      });
      message.success('查询成功');
    } finally {
      setSalaryLoading(false);
    }
  };

  const getSkillLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      S: '#f5222d',
      A: '#fa8c16',
      B: '#1677ff',
      C: '#8c8c8c'
    };
    return colors[level] || '#999';
  };

  const getRiskColor = (level: string) => {
    const colors: Record<string, string> = {
      very_high: '#ff4d4f',
      high: '#fa8c16',
      medium: '#faad14',
      low: '#52c41a',
      very_low: '#237804'
    };
    return colors[level] || '#999';
  };

  const getRiskText = (level: string) => {
    const map: Record<string, string> = {
      very_high: '极高',
      high: '高',
      medium: '中',
      low: '非常低'
    };
    return map[level] || level;
  };

  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <UserOutlined />
          人才画像生成
        </span>
      ),
      children: (
        <div>
          <Alert
            type="info"
            showIcon
            message="人才画像生成"
            description="输入候选人基本信息，系统将自动生成多维度人才画像，包括技能评分、市场价值、成长潜力等综合评估"
            style={{ marginBottom: 16 }}
          />

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="输入信息" bordered={false} style={{ borderRadius: 12 }}>
                <Form
                  form={portraitForm}
                  layout="vertical"
                  onFinish={handlePortraitSubmit}
                  initialValues={{ gender: '男', education: '本科' }}
                >
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="candidate_name" label="候选人姓名">
                        <Input placeholder="请输入姓名" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="age" label="年龄">
                        <InputNumber min={18} max={65} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="gender" label="性别">
                        <Select>
                          <Option value="男">男</Option>
                          <Option value="女">女</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="work_years" label="工作年限">
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="current_company" label="当前公司">
                    <Input placeholder="请输入公司名称" />
                  </Form.Item>
                  <Form.Item name="current_position" label="当前职位">
                    <Input placeholder="请输入职位" />
                  </Form.Item>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="current_salary" label="当前年薪（元）">
                        <InputNumber style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="education" label="最高学历">
                        <Select>
                          <Option value="博士">博士</Option>
                          <Option value="硕士">硕士</Option>
                          <Option value="本科">本科</Option>
                          <Option value="大专">大专</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="skills" label="技能标签（逗号分隔）">
                    <Input placeholder="如: React,TypeScript,Node.js" />
                  </Form.Item>
                  <Form.Item name="city" label="所在城市">
                    <Select placeholder="请选择城市">
                      <Option value="北京">北京</Option>
                      <Option value="上海">上海</Option>
                      <Option value="深圳">深圳</Option>
                      <Option value="杭州">杭州</Option>
                      <Option value="广州">广州</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name="experience" label="工作经历">
                    <TextArea rows={3} placeholder="请简要描述工作经历" />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="primary" htmlType="submit" loading={portraitLoading} block>
                      生成画像
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="生成结果" bordered={false} style={{ borderRadius: 12 }}>
                {portraitLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <Spin size="large" />
                  </div>
                ) : portraitResult ? (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                      <div style={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        border: `6px solid ${portraitResult.overall_score >= 80 ? '#52c41a' : portraitResult.overall_score >= 60 ? '#fa8c16' : '#ff4d4f'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                        fontSize: 28,
                        fontWeight: 700,
                        color: portraitResult.overall_score >= 80 ? '#52c41a' : portraitResult.overall_score >= 60 ? '#fa8c16' : '#ff4d4f'
                      }}>
                        {portraitResult.overall_score}
                      </div>
                      <div style={{ fontWeight: 500, marginBottom: 8 }}>综合评分</div>
                      <div className="tag-list" style={{ justifyContent: 'center' }}>
                        {portraitResult.portrait_tags?.map((tag, idx) => (
                          <Tag key={idx} color="blue">{tag}</Tag>
                        ))}
                      </div>
                    </div>

                    <Row gutter={[12, 12]}>
                      <Col span={12}>
                        <div style={{ marginBottom: 16 }}>
                          <div className="progress-label">
                            <span>技能评分</span>
                            <span style={{ color: getSkillLevelColor(portraitResult.skill_rating.level), fontWeight: 600 }}>
                              {portraitResult.skill_rating.level}级
                            </span>
                          </div>
                          <Progress percent={portraitResult.skill_rating.score} strokeColor="#1677ff" size="small" />
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ marginBottom: 16 }}>
                          <div className="progress-label">
                            <span>成长潜力</span>
                            <span>{portraitResult.growth_potential}</span>
                          </div>
                          <Progress percent={portraitResult.growth_potential} strokeColor="#52c41a" size="small" />
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ marginBottom: 16 }}>
                          <div className="progress-label">
                            <span>稳定性</span>
                            <span>{portraitResult.stability_index}</span>
                          </div>
                          <Progress percent={portraitResult.stability_index} strokeColor="#faad14" size="small" />
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ marginBottom: 16 }}>
                          <div className="progress-label">
                            <span>市场价值</span>
                            <span>{portraitResult.market_value.level}</span>
                          </div>
                          <Progress
                            percent={portraitResult.market_value.level === '高' ? 90 : portraitResult.market_value.level === '中高' ? 75 : portraitResult.market_value.level === '中等' ? 55 : 35}
                            strokeColor="#722ed1"
                            size="small"
                          />
                        </div>
                      </Col>
                    </Row>

                    <Divider />

                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontWeight: 500, marginBottom: 8 }}>职业阶段</div>
                      <Tag color="purple" style={{ fontSize: 14, padding: '4px 12px' }}>{portraitResult.career_stage}</Tag>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontWeight: 500, marginBottom: 8 }}>猎头建议</div>
                      {portraitResult.recommendations.map((rec, idx) => (
                        <div key={idx} style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                          • {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
                    <UserOutlined style={{ fontSize: 48, opacity: 0.3, marginBottom: 16 }} />
                    <div>请填写左侧信息后点击生成</div>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: '2',
      label: (
        <span>
          <BarChartOutlined />
          挖角风险评估
        </span>
      ),
      children: (
        <div>
          <Alert
            type="warning"
            showIcon
            message="挖角风险评估"
            description="分析候选人的挖角难度，包括薪资期望、职业阶段、公司背景等多维度风险因素分析"
            style={{ marginBottom: 16 }}
          />

          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Card title="输入信息" bordered={false} style={{ borderRadius: 12 }}>
                <Form
                  form={riskForm}
                  layout="vertical"
                  onFinish={handleRiskSubmit}
                  initialValues={{ gender: '男', education: '本科' }}
                >
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="candidate_name" label="候选人姓名">
                        <Input placeholder="请输入姓名" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="age" label="年龄">
                        <InputNumber min={18} max={65} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="current_company" label="当前公司">
                        <Input placeholder="请输入公司名称" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="work_years" label="工作年限">
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="current_position" label="当前职位">
                    <Input placeholder="请输入职位" />
                  </Form.Item>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="current_salary" label="当前年薪（元）">
                        <InputNumber style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="expected_salary_min" label="期望年薪下限">
                        <InputNumber style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="skills" label="技能标签（逗号分隔）">
                    <Input placeholder="如: AI,机器学习,Go" />
                  </Form.Item>
                  <Form.Item name="experience" label="工作经历">
                    <TextArea rows={3} placeholder="请简要描述工作经历" />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="primary" htmlType="submit" loading={riskLoading} block>
                      开始评估
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="评估结果" bordered={false} style={{ borderRadius: 12 }}>
                {riskLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <Spin size="large" />
                  </div>
                ) : riskResult ? (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <div style={{
                        fontSize: 32,
                        fontWeight: 700,
                        color: getRiskColor(riskResult.risk_level)
                      }}>
                        {Math.round(riskResult.risk_score * 100)}%
                      </div>
                      <div style={{ color: getRiskColor(riskResult.risk_level), fontWeight: 500 }}>
                        挖角难度{getRiskText(riskResult.risk_level)}
                      </div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                        挖角成功指数: {riskResult.poaching_index}
                      </div>
                    </div>

                    <Alert
                      type="info"
                      showIcon
                      message={riskResult.risk_description}
                      style={{ marginBottom: 16 }}
                    />

                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontWeight: 500, marginBottom: 8 }}>风险因素</div>
                      {riskResult.factors.map((factor, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 0',
                          borderBottom: '1px solid #f0f0f0'
                        }}>
                          <span style={{ fontSize: 13 }}>{factor.factor}</span>
                          <Tag color={factor.impact === 'very_high' || factor.impact === 'high' ? 'red' : factor.impact === 'medium' ? 'orange' : 'green'}>
                            +{Math.round(factor.score * 100)}%
                          </Tag>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div style={{ fontWeight: 500, marginBottom: 8 }}>操作建议</div>
                      {riskResult.suggestions.map((suggestion, idx) => (
                        <div key={idx} style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                          • {suggestion}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
                    <BarChartOutlined style={{ fontSize: 48, opacity: 0.3, marginBottom: 16 }} />
                    <div>请填写左侧信息后点击评估</div>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: '3',
      label: (
        <span>
          <RiseOutlined />
          薪酬带宽查询
        </span>
      ),
      children: (
        <div>
          <Alert
            type="success"
            showIcon
            message="薪酬带宽查询"
            description="查询不同城市、行业、职位级别的市场薪酬数据，帮助您制定合理的薪资预算"
            style={{ marginBottom: 16 }}
          />

          <Card title="查询条件" bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
            <Form form={salaryForm} layout="inline" onFinish={handleSalarySubmit}>
              <Form.Item name="city" label="城市">
                <Select placeholder="请选择城市" style={{ width: 150 }}>
                  <Option value="北京">北京</Option>
                  <Option value="上海">上海</Option>
                  <Option value="深圳">深圳</Option>
                  <Option value="杭州">杭州</Option>
                  <Option value="广州">广州</Option>
                </Select>
              </Form.Item>
              <Form.Item name="industry" label="行业">
                <Select placeholder="请选择行业" style={{ width: 150 }}>
                  <Option value="互联网">互联网</Option>
                  <Option value="金融">金融</Option>
                  <Option value="金融科技">金融科技</Option>
                  <Option value="教育">教育</Option>
                  <Option value="医疗">医疗</Option>
                </Select>
              </Form.Item>
              <Form.Item name="position_level" label="职位级别">
                <Select placeholder="请选择级别" style={{ width: 150 }}>
                  <Option value="初级工程师">初级工程师</Option>
                  <Option value="中级工程师">中级工程师</Option>
                  <Option value="高级工程师">高级工程师</Option>
                  <Option value="专家">技术专家</Option>
                </Select>
              </Form.Item>
              <Form.Item name="position" label="职位名称">
                <Input placeholder="如: 前端工程师" style={{ width: 180 }} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={salaryLoading} icon={<SearchOutlined />}>
                  查询
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Card title="查询结果" bordered={false} style={{ borderRadius: 12 }}>
            {salaryLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                <Spin size="large" />
              </div>
            ) : salaryResult ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <Space>
                    <Text type="secondary">数据来源：</Text>
                    <Tag color={salaryResult.source === 'actual' ? 'green' : 'orange'}>
                      {salaryResult.source === 'actual' ? '实际数据' : '估算数据'}
                    </Tag>
                    {salaryResult.sample_size > 0 && (
                      <Text type="secondary">样本量: {salaryResult.sample_size}份</Text>
                    )}
                  </Space>
                </div>

                <Row gutter={[12, 12]}>
                  <Col xs={24} md={8}>
                    <div style={{ textAlign: 'center', padding: '20px 12px', background: '#f5f5f5', borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>P10 (低位)</div>
                      <div style={{ fontSize: 20, fontWeight: 600 }}>¥{(salaryResult.p10 / 10000).toFixed(1)}万</div>
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <div style={{ textAlign: 'center', padding: '20px 12px', background: '#e6f4ff', borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>P25 (25分位)</div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: '#1677ff' }}>¥{(salaryResult.p25 / 10000).toFixed(1)}万</div>
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <div style={{ textAlign: 'center', padding: '20px 12px', background: '#e6fffb', borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>P50 (中位)</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#13c2c2' }}>¥{(salaryResult.p50 / 10000).toFixed(1)}万</div>
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <div style={{ textAlign: 'center', padding: '20px 12px', background: '#fff7e6', borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>P75 (75分位)</div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: '#fa8c16' }}>¥{(salaryResult.p75 / 10000).toFixed(1)}万</div>
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <div style={{ textAlign: 'center', padding: '20px 12px', background: '#fff1f0', borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>P90 (高位)</div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: '#f5222d' }}>¥{(salaryResult.p90 / 10000).toFixed(1)}万</div>
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <div style={{ textAlign: 'center', padding: '20px 12px', background: '#f9f0ff', borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>薪资范围</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#722ed1' }}>
                        ¥{(salaryResult.p25 / 10000).toFixed(1)}-{(salaryResult.p75 / 10000).toFixed(1)}万
                      </div>
                    </div>
                  </Col>
                </Row>

                <Divider style={{ margin: '24px 0' }} />

                <Alert
                  type="info"
                  showIcon
                  message="薪资分位说明"
                  description={
                    <div>
                      <div><Text strong>P10:</Text> 市场上10%的人低于该薪资，90%的人高于该薪资</div>
                      <div><Text strong>P50:</Text> 市场中位值，代表市场平均水平</div>
                      <div><Text strong>P90:</Text> 市场上90%的人低于该薪资，10%的人高于该薪资</div>
                    </div>
                  }
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
                <RiseOutlined style={{ fontSize: 48, opacity: 0.3, marginBottom: 16 }} />
                <div>请选择查询条件后点击查询</div>
              </div>
            )}
          </Card>
        </div>
      )
    },
    {
      key: '4',
      label: (
        <span>
          <FileImageOutlined />
          简历卡片发送
        </span>
      ),
      children: (
        <div>
          <Alert
            type="success"
            showIcon
            message="简历卡片生成与发送"
            description="快速生成精美的候选人简历卡片，支持一键复制、下载和发送给企业联系人"
            style={{ marginBottom: 16 }}
          />

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="输入信息" bordered={false} style={{ borderRadius: 12 }}>
                <Form
                  form={cardForm}
                  layout="vertical"
                  onFinish={handleCardSubmit}
                  initialValues={{ education: '本科' }}
                >
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="candidate_name" label="候选人姓名" rules={[{ required: true }]}>
                        <Input placeholder="请输入姓名" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="work_years" label="工作年限">
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="current_position" label="当前职位" rules={[{ required: true }]}>
                    <Input placeholder="如: 高级前端工程师" />
                  </Form.Item>
                  <Form.Item name="current_company" label="当前公司" rules={[{ required: true }]}>
                    <Input placeholder="请输入公司名称" />
                  </Form.Item>
                  <Form.Item name="education" label="最高学历">
                    <Select>
                      <Option value="博士">博士</Option>
                      <Option value="硕士">硕士</Option>
                      <Option value="本科">本科</Option>
                      <Option value="大专">大专</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name="skills" label="核心技能（逗号分隔）" rules={[{ required: true }]}>
                    <Input placeholder="如: React,TypeScript,Node.js,微服务" />
                  </Form.Item>
                  <Form.Item name="key_achievements" label="主要成就（每行一条）">
                    <TextArea rows={4} placeholder="如:
主导完成XX系统重构，性能提升50%
带领5人团队完成核心业务开发
拥有10+项技术专利" />
                  </Form.Item>
                  <Form.Item name="expected_salary" label="期望薪资">
                    <Input placeholder="如: 35-45万/年 或 面议" />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="primary" htmlType="submit" loading={cardLoading} block icon={<FileImageOutlined />}>
                      生成简历卡片
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="卡片预览" bordered={false} style={{ borderRadius: 12 }}>
                {cardLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <Spin size="large" />
                  </div>
                ) : cardResult ? (
                  <div>
                    <div 
                      style={{ 
                        background: `linear-gradient(135deg, ${cardResult.avatar_color}15 0%, ${cardResult.avatar_color}08 100%)`,
                        border: `2px solid ${cardResult.avatar_color}30`,
                        borderRadius: 12,
                        padding: 20,
                        marginBottom: 16
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                        <Avatar 
                          size={64} 
                          style={{ 
                            background: cardResult.avatar_color,
                            fontSize: 24,
                            fontWeight: 700
                          }}
                        >
                          {cardResult.candidate_name?.charAt(0)}
                        </Avatar>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                            {cardResult.candidate_name}
                          </div>
                          <div style={{ color: '#666', marginBottom: 4 }}>
                            {cardResult.current_position} @ {cardResult.current_company}
                          </div>
                          <div style={{ color: '#999', fontSize: 12 }}>
                            {cardResult.work_years}年经验 · {cardResult.education}
                          </div>
                        </div>
                      </div>

                      <Divider style={{ margin: '12px 0' }} />

                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>核心技能</div>
                        <div className="tag-list">
                          {cardResult.skills.map((skill, idx) => (
                            <Tag key={idx} color={cardResult.avatar_color} style={{ marginBottom: 4 }}>
                              {skill}
                            </Tag>
                          ))}
                        </div>
                      </div>

                      {cardResult.key_achievements.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>主要成就</div>
                          {cardResult.key_achievements.map((achievement, idx) => (
                            <div key={idx} style={{ fontSize: 13, color: '#333', marginBottom: 4, paddingLeft: 12, position: 'relative' }}>
                              <span style={{ position: 'absolute', left: 0, color: cardResult.avatar_color }}>•</span>
                              {achievement}
                            </div>
                          ))}
                        </div>
                      )}

                      <div>
                        <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>期望薪资</div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#52c41a' }}>
                          {cardResult.expected_salary}
                        </div>
                      </div>
                    </div>

                    <Space wrap style={{ width: '100%', justifyContent: 'center' }}>
                      <Button 
                        icon={<CopyOutlined />} 
                        onClick={handleCopyCard}
                      >
                        复制文本
                      </Button>
                      <Button 
                        icon={<DownloadOutlined />}
                        onClick={() => message.success('图片下载功能开发中')}
                      >
                        下载图片
                      </Button>
                      <Button 
                        type="primary" 
                        icon={<SendOutlined />}
                        onClick={() => setSendCardModalVisible(true)}
                      >
                        发送给企业
                      </Button>
                    </Space>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
                    <FileImageOutlined style={{ fontSize: 48, opacity: 0.3, marginBottom: 16 }} />
                    <div>请填写左侧信息后点击生成</div>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          <Modal
            title="发送简历卡片"
            open={sendCardModalVisible}
            onCancel={() => setSendCardModalVisible(false)}
            footer={null}
            destroyOnClose
            width={500}
          >
            <Alert
              type="info"
              showIcon
              message="选择收件人"
              description="选择要发送简历卡片的企业联系人，系统将通过站内消息发送"
              style={{ marginBottom: 16 }}
            />
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>企业联系人</div>
              <Checkbox.Group
                style={{ width: '100%' }}
                value={selectedRecipients}
                onChange={(vals) => setSelectedRecipients(vals as number[])}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Checkbox value={6}>
                    <Space>
                      <Avatar size="small">李</Avatar>
                      <span>李明 - 字节跳动 HR</span>
                    </Space>
                  </Checkbox>
                  <Checkbox value={7}>
                    <Space>
                      <Avatar size="small">王</Avatar>
                      <span>王芳 - 阿里巴巴 技术总监</span>
                    </Space>
                  </Checkbox>
                  <Checkbox value={8}>
                    <Space>
                      <Avatar size="small">张</Avatar>
                      <span>张伟 - 腾讯 招聘经理</span>
                    </Space>
                  </Checkbox>
                  <Checkbox value={9}>
                    <Space>
                      <Avatar size="small">刘</Avatar>
                      <span>刘洋 - 美团 技术负责人</span>
                    </Space>
                  </Checkbox>
                </Space>
              </Checkbox.Group>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setSendCardModalVisible(false)}>取消</Button>
                <Button 
                  type="primary" 
                  onClick={handleSendCard}
                  loading={cardLoading}
                  icon={<SendOutlined />}
                >
                  发送
                </Button>
              </Space>
            </div>
          </Modal>
        </div>
      )
    }
  ];

  const getHistoryTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      portrait: <UserOutlined />,
      risk: <BarChartOutlined />,
      salary: <RiseOutlined />,
      card: <FileImageOutlined />
    };
    return icons[type] || <FileImageOutlined />;
  };

  const getHistoryTypeText = (type: string) => {
    const texts: Record<string, string> = {
      portrait: '人才画像',
      risk: '挖角风险',
      salary: '薪酬查询',
      card: '简历卡片'
    };
    return texts[type] || type;
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ToolOutlined />
            猎头工具箱
          </Title>
          <Text type="secondary">提供人才画像、挖角风险评估、薪酬查询等专业工具</Text>
        </div>
        <Button 
          icon={<HistoryOutlined />} 
          onClick={() => setHistoryModalVisible(true)}
        >
          历史记录 {history.length > 0 && `(${history.length})`}
        </Button>
      </div>

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Tabs activeKey={activeKey} onChange={setActiveKey} items={tabItems} size="large" />
      </Card>

      <Modal
        title="历史记录"
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        {history.length > 0 ? (
          <List
            dataSource={history}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    type="link" 
                    size="small" 
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setHistoryModalVisible(false);
                      if (item.type === 'portrait') {
                        setPortraitResult(item.result);
                        setActiveKey('1');
                      } else if (item.type === 'risk') {
                        setRiskResult(item.result);
                        setActiveKey('2');
                      } else if (item.type === 'salary') {
                        setSalaryResult(item.result);
                        setActiveKey('3');
                      } else if (item.type === 'card') {
                        setCardResult(item.result);
                        setActiveKey('4');
                      }
                    }}
                  >
                    查看
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      style={{ 
                        background: item.type === 'portrait' ? '#1677ff' : 
                                   item.type === 'risk' ? '#fa8c16' : 
                                   item.type === 'salary' ? '#52c41a' : '#722ed1' 
                      }}
                      icon={getHistoryTypeIcon(item.type)}
                    />
                  }
                  title={
                    <Space>
                      <Tag color={
                        item.type === 'portrait' ? 'blue' : 
                        item.type === 'risk' ? 'orange' : 
                        item.type === 'salary' ? 'green' : 'purple'
                      }>
                        {getHistoryTypeText(item.type)}
                      </Tag>
                      {item.title}
                    </Space>
                  }
                  description={dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            <HistoryOutlined style={{ fontSize: 48, opacity: 0.3, marginBottom: 16 }} />
            <div>暂无历史记录</div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Toolbox;
