import { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, message, Upload, Space, Tag, Row, Col, Table, Statistic } from 'antd';
import { UploadOutlined, PlusOutlined, FileTextOutlined, CalendarOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import axios from '../../utils/axios';

const { TextArea } = Input;
const { Option } = Select;

interface SkillData {
  skill: string;
  weight: number;
  source: string;
}

export default function JobseekerProfile() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [skillGraph, setSkillGraph] = useState<SkillData[]>([]);
  const [skillGraphLoading, setSkillGraphLoading] = useState(false);

  useEffect(() => {
    loadProfile();
    loadSkillGraph();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await axios.get('/jobseeker/profile');
      form.setFieldsValue(data);
      if (data.skills) {
        setSkills(JSON.parse(data.skills));
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadSkillGraph = async () => {
    setSkillGraphLoading(true);
    try {
      const { data } = await axios.get('/jobseeker/skill-graph');
      setSkillGraph(data || []);
    } catch (error) {
      console.error('Failed to load skill graph:', error);
      setSkillGraph([]);
    } finally {
      setSkillGraphLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await axios.put('/jobseeker/profile', {
        ...values,
        skills: JSON.stringify(skills)
      });
      message.success('保存成功');
      loadSkillGraph();
    } catch (error: any) {
      message.error(error.response?.data?.error || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (skillInput && !skills.includes(skillInput)) {
      setSkills([...skills, skillInput]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const topSkills = [...skillGraph]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6)
    .map(s => ({
      subject: s.skill,
      score: s.weight,
      fullMark: 100
    }));

  const sourceLabels: Record<string, string> = {
    resume: '简历',
    assessment: '测评',
    certificate: '证书'
  };

  const skillColumns = [
    {
      title: '技能名称',
      dataIndex: 'skill',
      key: 'skill'
    },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
      render: (weight: number) => (
        <span style={{ color: weight >= 70 ? '#52c41a' : weight >= 40 ? '#faad14' : '#999', fontWeight: 'bold' }}>
          {weight}
        </span>
      )
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => {
        const colors: Record<string, string> = { resume: 'blue', assessment: 'green', certificate: 'purple' };
        return <Tag color={colors[source]}>{sourceLabels[source] || source}</Tag>;
      }
    }
  ];

  const quickActions = [
    { title: '我的申请', icon: <FileTextOutlined />, path: '/jobseeker/applications', color: '#1890ff', count: 0 },
    { title: '面试安排', icon: <CalendarOutlined />, path: '/jobseeker/interviews', color: '#52c41a', count: 0 },
    { title: '完善简历', icon: <EditOutlined />, path: '/jobseeker/profile', color: '#722ed1', count: null }
  ];

  return (
    <div>
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        {quickActions.map((action) => (
          <Col span={8} key={action.title}>
            <Card
              hoverable
              onClick={() => navigate(action.path)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${action.color}15`,
                    color: action.color,
                    fontSize: 24
                  }}
                >
                  {action.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>{action.title}</div>
                  {action.count !== null && (
                    <div style={{ color: '#999', fontSize: 12 }}>共 {action.count} 条</div>
                  )}
                </div>
                {action.count !== null && (
                  <Statistic
                    value={action.count}
                    valueStyle={{ color: action.color, fontSize: 24 }}
                  />
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="我的简历" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ maxWidth: 800 }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="gender" label="性别">
                <Select placeholder="请选择">
                  <Option value="male">男</Option>
                  <Option value="female">女</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="birth_date" label="出生日期">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="education" label="最高学历">
                <Select placeholder="请选择">
                  <Option value="高中">高中</Option>
                  <Option value="大专">大专</Option>
                  <Option value="本科">本科</Option>
                  <Option value="硕士">硕士</Option>
                  <Option value="博士">博士</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="experience_years" label="工作年限">
                <Select placeholder="请选择">
                  <Option value={0}>应届生</Option>
                  <Option value={1}>1年以内</Option>
                  <Option value={3}>1-3年</Option>
                  <Option value={5}>3-5年</Option>
                  <Option value={10}>5-10年</Option>
                  <Option value={15}>10年以上</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="expected_salary_min" label="期望薪资(最低K)">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expected_salary_max" label="期望薪资(最高K)">
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="expected_city" label="期望城市">
            <Select placeholder="请选择">
              <Option value="北京">北京</Option>
              <Option value="上海">上海</Option>
              <Option value="广州">广州</Option>
              <Option value="深圳">深圳</Option>
              <Option value="杭州">杭州</Option>
              <Option value="成都">成都</Option>
            </Select>
          </Form.Item>

          <Form.Item label="技能标签">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space wrap>
                {skills.map(skill => (
                  <Tag
                    key={skill}
                    closable
                    onClose={() => removeSkill(skill)}
                    color="blue"
                  >
                    {skill}
                  </Tag>
                ))}
              </Space>
              <Space>
                <Input
                  style={{ width: 200 }}
                  placeholder="输入技能名称"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onPressEnter={addSkill}
                />
                <Button icon={<PlusOutlined />} onClick={addSkill}>添加</Button>
              </Space>
            </Space>
          </Form.Item>

          <Form.Item name="resume" label="个人简介">
            <TextArea rows={6} placeholder="请输入个人简介..." />
          </Form.Item>

          <Form.Item label="证书上传">
            <Upload
              beforeUpload={() => false}
              multiple
              listType="picture-card"
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item label="作品集">
            <Upload
              beforeUpload={() => false}
              multiple
              listType="text"
            >
              <Button icon={<UploadOutlined />}>上传作品文件</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              保存简历
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="能力图谱" loading={skillGraphLoading}>
        {skillGraph.length > 0 ? (
          <Row gutter={24}>
            <Col span={12}>
              <div style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={topSkills}>
                    <PolarGrid stroke="#e8e8e8" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#999', fontSize: 10 }} />
                    <Radar
                      name="技能权重"
                      dataKey="score"
                      stroke="#1890ff"
                      fill="#1890ff"
                      fillOpacity={0.3}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ textAlign: 'center', color: '#666', fontSize: 12, marginTop: -16 }}>
                Top 6 技能分布
              </div>
            </Col>
            <Col span={12}>
              <Table
                columns={skillColumns}
                dataSource={skillGraph.sort((a, b) => b.weight - a.weight)}
                rowKey="skill"
                pagination={{ pageSize: 8, size: 'small' }}
                size="small"
              />
            </Col>
          </Row>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>暂无技能图谱数据</div>
            <div style={{ fontSize: 14 }}>请先完善技能标签并投递简历</div>
          </div>
        )}
      </Card>
    </div>
  );
}
