import { useEffect, useRef, useState, useMemo } from 'react';
import { Card, Table, Tag, Input, Button, Space, Statistic, Row, Col, List, Avatar, Progress, Modal, Form, Select, Empty } from 'antd';
import { Lightbulb, Search, User, Filter, RefreshCw, CheckCircle, AlertCircle, Clock, BookOpen, Target, TrendingUp, Zap } from 'lucide-react';
import * as echarts from 'echarts';
import { mockPolicies, mockPolicyMatches, mockDepartments, mockUser } from '../../mock/data';
import type { Policy, PolicyMatch } from '../../shared/types';

const { Search: SearchInput } = Input;
const { Option } = Select;

const categoryColors: Record<string, string> = {
  '就业创业': 'blue',
  '企业扶持': 'purple',
  '计划生育': 'green',
  '社会保障': 'orange',
  '住房补贴': 'cyan',
  '医疗救助': 'red',
  '教育扶持': 'geekblue',
};

const userProfileTags = [
  { key: 'age', label: '34岁', icon: User },
  { key: 'education', label: '本科', icon: BookOpen },
  { key: 'employment', label: '在职', icon: Target },
  { key: 'has_only_child', label: '独生子女', icon: CheckCircle },
  { key: 'enterprise_type', label: '小微企业', icon: Zap },
];

export default function Policy() {
  const matchChartRef = useRef<HTMLDivElement>(null);
  const categoryChartRef = useRef<HTMLDivElement>(null);
  const matchChartInstance = useRef<echarts.ECharts | null>(null);
  const categoryChartInstance = useRef<echarts.ECharts | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [isMatchModalVisible, setIsMatchModalVisible] = useState(false);
  const [matchResults, setMatchResults] = useState<PolicyMatch[]>(mockPolicyMatches);
  const [form] = Form.useForm();

  const categories = useMemo(() => {
    const cats = [...new Set(mockPolicies.map(p => p.category))];
    return cats;
  }, []);

  const filteredPolicies = useMemo(() => {
    let result = [...mockPolicies];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    return result;
  }, [searchQuery, selectedCategory]);

  const matchStats = useMemo(() => {
    const totalPolicies = mockPolicies.length;
    const matchedPolicies = matchResults.length;
    const avgMatchScore = matchResults.length > 0
      ? matchResults.reduce((sum, m) => sum + m.matchScore, 0) / matchResults.length
      : 0;
    const highMatchCount = matchResults.filter(m => m.matchScore >= 90).length;

    return {
      totalPolicies,
      matchedPolicies,
      avgMatchScore: Math.round(avgMatchScore * 10) / 10,
      highMatchCount,
      matchRate: totalPolicies > 0 ? Math.round((matchedPolicies / totalPolicies) * 1000) / 10 : 0,
    };
  }, [matchResults]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    mockPolicies.forEach(p => {
      stats[p.category] = (stats[p.category] || 0) + 1;
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }, []);

  useEffect(() => {
    if (!matchChartRef.current) return;
    matchChartInstance.current = echarts.init(matchChartRef.current);

    const scoreData = matchResults.map(m => ({
      name: m.policy.title,
      value: m.matchScore,
    })).sort((a, b) => b.value - a.value);

    const names = scoreData.map(d => d.name);
    const scores = scoreData.map(d => d.value);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: { color: '#1D2129' },
        formatter: (params: any) => {
          const param = params[0];
          return `${param.name}<br/>匹配度: ${param.value}%`;
        },
      },
      grid: {
        left: '3%',
        right: '10%',
        bottom: '3%',
        top: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
        axisLabel: { color: '#86909C', fontSize: 11, formatter: '{value}%' },
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisLabel: {
          color: '#4E5969',
          fontSize: 11,
          width: 120,
          overflow: 'truncate',
        },
        axisTick: { show: false },
      },
      series: [
        {
          name: '匹配度',
          type: 'bar',
          barWidth: '60%',
          itemStyle: {
            color: (params: any) => {
              const value = params.value;
              if (value >= 90) return '#00B42A';
              if (value >= 80) return '#FF7D00';
              return '#F53F3F';
            },
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: true,
            position: 'right',
            color: '#4E5969',
            fontSize: 12,
            formatter: '{c}%',
          },
          data: scores,
        },
      ],
    };

    matchChartInstance.current.setOption(option);

    const handleResize = () => {
      matchChartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      matchChartInstance.current?.dispose();
    };
  }, [matchResults]);

  useEffect(() => {
    if (!categoryChartRef.current) return;
    categoryChartInstance.current = echarts.init(categoryChartRef.current);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: { color: '#1D2129' },
        formatter: '{b}: {c}项 ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: '#4E5969', fontSize: 12 },
      },
      color: ['#165DFF', '#722ED1', '#FF7D00', '#00B42A', '#F53F3F', '#86909C'],
      series: [
        {
          name: '政策分类',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: false,
          },
          data: categoryStats,
        },
      ],
    };

    categoryChartInstance.current.setOption(option);

    const handleResize = () => {
      categoryChartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      categoryChartInstance.current?.dispose();
    };
  }, [categoryStats]);

  const handleMatch = (policy: Policy) => {
    setSelectedPolicy(policy);
    setIsMatchModalVisible(true);
    form.setFieldsValue({
      age: mockUser.idCard ? 34 : undefined,
      education: '本科',
      employment_status: 'employed',
    });
  };

  const handleMatchSubmit = () => {
    form.validateFields().then((values) => {
      if (selectedPolicy) {
        let score = 70;
        const criteria = selectedPolicy.eligibilityCriteria;

        if (criteria.age) {
          if (criteria.age.$lte && values.age <= criteria.age.$lte) score += 10;
          if (criteria.age.$gte && values.age >= criteria.age.$gte) score += 10;
        }
        if (criteria.education && criteria.education.includes(values.education)) {
          score += 10;
        }
        if (criteria.employment_status && criteria.employment_status === values.employment_status) {
          score += 10;
        }

        const newMatch: PolicyMatch = {
          id: `pm${Date.now()}`,
          userId: mockUser.id,
          policyId: selectedPolicy.id,
          policy: selectedPolicy,
          matchScore: Math.min(score, 100),
          matchedCriteria: values,
          matchedAt: new Date(),
        };

        setMatchResults(prev => {
          const existing = prev.find(m => m.policyId === selectedPolicy.id);
          if (existing) {
            return prev.map(m => m.policyId === selectedPolicy.id ? newMatch : m);
          }
          return [...prev, newMatch];
        });

        setIsMatchModalVisible(false);
      }
    });
  };

  const columns = [
    {
      title: '政策名称',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Policy) => (
        <div>
          <div className="font-medium text-gov-gray-700 mb-1">{title}</div>
          <div className="text-sm text-gov-gray-500 line-clamp-1">{record.content}</div>
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => (
        <Tag color={categoryColors[category] || 'default'}>{category}</Tag>
      ),
    },
    {
      title: '有效期',
      key: 'validity',
      width: 200,
      render: (_: any, record: Policy) => {
        const start = new Date(record.effectiveDate).toLocaleDateString('zh-CN');
        const end = record.expiryDate.getFullYear() > 9000
          ? '长期有效'
          : new Date(record.expiryDate).toLocaleDateString('zh-CN');
        return (
          <div className="text-sm text-gov-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {start} ~ {end}
            </div>
          </div>
        );
      },
    },
    {
      title: '匹配状态',
      key: 'matchStatus',
      width: 120,
      render: (_: any, record: Policy) => {
        const match = matchResults.find(m => m.policyId === record.id);
        if (match) {
          return (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-green-600 font-medium">{match.matchScore}%</span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-gov-gray-400" />
            <span className="text-gov-gray-400">未匹配</span>
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Policy) => (
        <Button
          type="primary"
          size="small"
          icon={<Target className="w-3.5 h-3.5" />}
          onClick={() => handleMatch(record)}
        >
          智能匹配
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gov-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gov-gray-700">政策适配引擎</h1>
            <Button
              type="primary"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              重置
            </Button>
          </div>
          <p className="text-gov-gray-500">基于用户画像智能匹配适用政策，精准推送政策红利</p>
        </div>

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-card border-l-4 border-l-blue-500">
              <Statistic
                title={
                  <div className="flex items-center gap-2 text-gov-gray-500">
                    <BookOpen className="w-4 h-4" />
                    政策总数
                  </div>
                }
                value={matchStats.totalPolicies}
                valueStyle={{ color: '#165DFF' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-card border-l-4 border-l-green-500">
              <Statistic
                title={
                  <div className="flex items-center gap-2 text-gov-gray-500">
                    <CheckCircle className="w-4 h-4" />
                    已匹配政策
                  </div>
                }
                value={matchStats.matchedPolicies}
                valueStyle={{ color: '#00B42A' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-card border-l-4 border-l-purple-500">
              <Statistic
                title={
                  <div className="flex items-center gap-2 text-gov-gray-500">
                    <TrendingUp className="w-4 h-4" />
                    平均匹配度
                  </div>
                }
                value={matchStats.avgMatchScore}
                suffix="%"
                valueStyle={{ color: '#722ED1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-card border-l-4 border-l-orange-500">
              <Statistic
                title={
                  <div className="flex items-center gap-2 text-gov-gray-500">
                    <Zap className="w-4 h-4" />
                    高匹配政策
                  </div>
                }
                value={matchStats.highMatchCount}
                valueStyle={{ color: '#FF7D00' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} lg={8}>
            <Card
              title={
                <div className="flex items-center">
                  <User className="w-5 h-5 text-primary-600 mr-2" />
                  <span className="font-semibold">用户画像</span>
                </div>
              }
              className="shadow-card h-full"
            >
              <div className="flex items-center mb-4">
                <Avatar size={64} className="bg-primary-100 mr-4">
                  <User className="w-8 h-8 text-primary-600" />
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gov-gray-700">{mockUser.name}</h3>
                  <p className="text-sm text-gov-gray-500">
                    {mockUser.idCard ? mockUser.idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2') : ''}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gov-gray-50 rounded-lg">
                  <span className="text-gov-gray-600">用户类型</span>
                  <Tag color="blue">个人用户</Tag>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {userProfileTags.map(tag => {
                    const Icon = tag.icon;
                    return (
                      <Tag key={tag.key} className="flex items-center gap-1 px-3 py-1">
                        <Icon className="w-3 h-3" />
                        {tag.label}
                      </Tag>
                    );
                  })}
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card
              title={
                <div className="flex items-center">
                  <Lightbulb className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="font-semibold">匹配度分析</span>
                </div>
              }
              className="shadow-card h-full"
            >
              <div ref={matchChartRef} style={{ height: '280px', width: '100%' }} />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card
              title={
                <div className="flex items-center">
                  <Filter className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="font-semibold">政策分类统计</span>
                </div>
              }
              className="shadow-card h-full"
            >
              <div ref={categoryChartRef} style={{ height: '280px', width: '100%' }} />
            </Card>
          </Col>
        </Row>

        <Card
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BookOpen className="w-5 h-5 text-primary-600 mr-2" />
                <span className="font-semibold">政策列表</span>
              </div>
              <div className="flex items-center gap-3">
                <SearchInput
                  placeholder="搜索政策名称或内容..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  allowClear
                  style={{ width: 250 }}
                  prefix={<Search className="w-4 h-4 text-gov-gray-400" />}
                />
                <Select
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  style={{ width: 150 }}
                  allowClear
                >
                  <Option value="all">全部分类</Option>
                  {categories.map(cat => (
                    <Option key={cat} value={cat}>{cat}</Option>
                  ))}
                </Select>
              </div>
            </div>
          }
          className="shadow-card"
        >
          {filteredPolicies.length > 0 ? (
            <Table
              dataSource={filteredPolicies}
              columns={columns}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条政策`,
              }}
            />
          ) : (
            <Empty description="未找到相关政策" />
          )}
        </Card>

        {matchResults.length > 0 && (
          <Card
            title={
              <div className="flex items-center mt-6">
                <Target className="w-5 h-5 text-green-600 mr-2" />
                <span className="font-semibold">匹配结果</span>
              </div>
            }
            className="shadow-card"
          >
            <List
              dataSource={matchResults.sort((a, b) => b.matchScore - a.matchScore)}
              renderItem={(match) => (
                <List.Item className="px-0 py-4 hover:bg-gov-gray-50 -mx-4 px-4 rounded-lg transition-colors">
                  <List.Item.Meta
                    avatar={
                      <Avatar className="bg-primary-100">
                        <Lightbulb className="w-5 h-5 text-primary-600" />
                      </Avatar>
                    }
                    title={
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gov-gray-700">{match.policy.title}</span>
                        <Tag color={categoryColors[match.policy.category] || 'default'}>
                          {match.policy.category}
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <p className="text-sm text-gov-gray-500 mb-3 line-clamp-2">
                          {match.policy.content}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2" style={{ flex: 1 }}>
                            <span className="text-sm text-gov-gray-500 whitespace-nowrap">匹配度:</span>
                            <Progress
                              percent={match.matchScore}
                              size="small"
                              strokeColor={match.matchScore >= 90 ? '#00B42A' : match.matchScore >= 80 ? '#FF7D00' : '#F53F3F'}
                              style={{ flex: 1, maxWidth: 200 }}
                            />
                            <span className={`font-semibold text-sm ${
                              match.matchScore >= 90 ? 'text-green-600' : match.matchScore >= 80 ? 'text-orange-600' : 'text-red-600'
                            }`}>
                              {match.matchScore}%
                            </span>
                          </div>
                          <span className="text-xs text-gov-gray-400">
                            匹配时间: {new Date(match.matchedAt).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}

        <Modal
          title={
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-600" />
              政策智能匹配
            </div>
          }
          open={isMatchModalVisible}
          onOk={handleMatchSubmit}
          onCancel={() => setIsMatchModalVisible(false)}
          okText="开始匹配"
          cancelText="取消"
          width={600}
        >
          {selectedPolicy && (
            <div>
              <div className="mb-6 p-4 bg-gov-gray-50 rounded-lg">
                <h4 className="font-semibold text-gov-gray-700 mb-2">{selectedPolicy.title}</h4>
                <p className="text-sm text-gov-gray-500">{selectedPolicy.content}</p>
              </div>
              <Form form={form} layout="vertical">
                <Form.Item
                  name="age"
                  label="年龄"
                  rules={[{ required: true, message: '请输入年龄' }]}
                >
                  <Input type="number" placeholder="请输入年龄" />
                </Form.Item>
                <Form.Item
                  name="education"
                  label="学历"
                  rules={[{ required: true, message: '请选择学历' }]}
                >
                  <Select placeholder="请选择学历">
                    <Option value="高中">高中</Option>
                    <Option value="大专">大专</Option>
                    <Option value="本科">本科</Option>
                    <Option value="硕士">硕士</Option>
                    <Option value="博士">博士</Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  name="employment_status"
                  label="就业状态"
                  rules={[{ required: true, message: '请选择就业状态' }]}
                >
                  <Select placeholder="请选择就业状态">
                    <Option value="employed">在职</Option>
                    <Option value="unemployed">失业</Option>
                    <Option value="student">学生</Option>
                    <Option value="retired">退休</Option>
                  </Select>
                </Form.Item>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-700">资格条件</p>
                      <ul className="text-sm text-blue-600 mt-1 space-y-1">
                        {Object.entries(selectedPolicy.eligibilityCriteria).map(([key, value]) => (
                          <li key={key}>
                            {key}: {JSON.stringify(value)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Form>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
