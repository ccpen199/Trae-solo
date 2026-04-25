import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Button, Table, Tag, Space, Spin, message, Empty,
  Modal, Form, Input, Select, DatePicker, Popconfirm,
  Row, Col, Statistic, Divider, List, Progress, Descriptions,
  Tabs, Collapse, Switch, InputNumber, TimePicker, Checkbox,
  Alert, Steps, Timeline
} from 'antd';
import {
  PlusOutlined, ArrowLeftOutlined, EyeOutlined, EditOutlined,
  DeleteOutlined, PauseOutlined, CheckCircleOutlined, FileTextOutlined,
  UserOutlined, CalendarOutlined, ReloadOutlined,
  CoffeeOutlined, FireOutlined, MoonOutlined, AppstoreOutlined,
  MedicineBoxOutlined, ClockCircleOutlined, FireFilled, RightOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { 
  RehabilitationPlan, Patient, PlanCategory, PlanProgressDetail,
  DietPlanConfig, ExercisePlanConfig, SleepPlanConfig, HabitPlanConfig
} from '../types';
import { planApi, patientApi } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Panel } = Collapse;

interface TemplateData {
  title: string;
  description: string;
  goals: string[];
  suggestedDuration: number;
  category: PlanCategory;
  dietConfig?: DietPlanConfig;
  exerciseConfig?: ExercisePlanConfig;
  sleepConfig?: SleepPlanConfig;
  habitConfig?: HabitPlanConfig;
}

const CATEGORY_CONFIG: Record<PlanCategory, {
  label: string;
  icon: React.ReactNode;
  color: string;
}> = {
  diet: { label: '饮食管理', icon: <CoffeeOutlined />, color: '#fa8c16' },
  exercise: { label: '运动康复', icon: <FireOutlined />, color: '#f5222d' },
  sleep: { label: '睡眠改善', icon: <MoonOutlined />, color: '#722ed1' },
  habit: { label: '习惯养成', icon: <AppstoreOutlined />, color: '#13c2c2' },
  comprehensive: { label: '综合计划', icon: <FileTextOutlined />, color: '#1890ff' }
};

const getCategoryTag = (category: PlanCategory) => {
  const config = CATEGORY_CONFIG[category];
  return <Tag color={config.color}>{config.icon} {config.label}</Tag>;
};

const getMealTypeText = (type: string) => {
  const map: Record<string, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐'
  };
  return map[type] || type;
};

const getIntensityText = (intensity: string) => {
  const map: Record<string, string> = {
    low: '低强度',
    medium: '中等强度',
    high: '高强度'
  };
  return map[intensity] || intensity;
};

const getHabitTypeText = (type: string) => {
  const map: Record<string, string> = {
    diet: '饮食',
    exercise: '运动',
    sleep: '睡眠',
    medication: '用药',
    other: '其他'
  };
  return map[type] || type;
};

const PlanManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<RehabilitationPlan[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<RehabilitationPlan | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<RehabilitationPlan | null>(null);
  const [planProgress, setPlanProgress] = useState<PlanProgressDetail | null>(null);
  const [filterCategory, setFilterCategory] = useState<PlanCategory | 'all'>('all');
  const [filterPatient, setFilterPatient] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansData, patientsData] = await Promise.all([
        planApi.getAll(),
        patientApi.getAll()
      ]);
      setPlans(plansData);
      setPatients(patientsData);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.name || '未知患者';
  };

  const getStatusColor = (status: RehabilitationPlan['status']) => {
    const colorMap: Record<string, string> = {
      'active': 'green',
      'suspended': 'orange',
      'completed': 'blue'
    };
    return colorMap[status] || 'default';
  };

  const getStatusText = (status: RehabilitationPlan['status']) => {
    const textMap: Record<string, string> = {
      'active': '进行中',
      'suspended': '已暂停',
      'completed': '已完成'
    };
    return textMap[status] || '未知';
  };

  const handleAdd = () => {
    setEditingPlan(null);
    setTemplateData(null);
    form.resetFields();
    form.setFieldsValue({
      category: 'comprehensive'
    });
    setModalVisible(true);
  };

  const handleEdit = (plan: RehabilitationPlan) => {
    setEditingPlan(plan);
    form.resetFields();
    form.setFieldsValue({
      ...plan,
      dateRange: [dayjs(plan.startDate), dayjs(plan.endDate)],
      goals: plan.goals.join('\n')
    });
    setModalVisible(true);
  };

  const handleViewDetail = async (plan: RehabilitationPlan) => {
    setSelectedPlan(plan);
    setDetailModalVisible(true);
    setPlanProgress(null);
    
    try {
      const progress = await planApi.getProgress(plan.id);
      setPlanProgress(progress);
    } catch (error) {
      message.error('获取计划进度失败');
    }
  };

  const handleSuspend = async (planId: string) => {
    try {
      await planApi.suspend(planId);
      message.success('计划已暂停');
      fetchData();
    } catch (error) {
      message.error('暂停计划失败');
    }
  };

  const handleComplete = async (planId: string) => {
    try {
      await planApi.complete(planId);
      message.success('计划已完成');
      fetchData();
    } catch (error) {
      message.error('完成计划失败');
    }
  };

  const handleDelete = async (planId: string) => {
    try {
      await planApi.delete(planId);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleCategoryChange = async (category: PlanCategory) => {
    const patientId = form.getFieldValue('patientId');
    if (patientId) {
      await handleGenerateTemplate(patientId, category);
    }
  };

  const handleGenerateTemplate = async (patientId: string, category?: PlanCategory) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    try {
      const template = await planApi.generateTemplate(patientId, patient.condition);
      setTemplateData(template);
      
      const endDate = dayjs().add(template.suggestedDuration, 'day');
      
      const currentCategory = category || template.category;
      
      form.setFieldsValue({
        category: currentCategory,
        title: template.title,
        description: template.description,
        goals: template.goals.join('\n'),
        dateRange: [dayjs(), endDate]
      });
      
      message.success('已生成计划模板');
    } catch (error) {
      message.error('生成模板失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const { patientId, title, description, category, dateRange, goals } = values;
      const goalsArray = goals ? goals.split('\n').filter((g: string) => g.trim()) : [];
      
      let dietConfig: DietPlanConfig | undefined;
      let exerciseConfig: ExercisePlanConfig | undefined;
      let sleepConfig: SleepPlanConfig | undefined;
      let habitConfig: HabitPlanConfig | undefined;

      if (templateData) {
        dietConfig = templateData.dietConfig;
        exerciseConfig = templateData.exerciseConfig;
        sleepConfig = templateData.sleepConfig;
        habitConfig = templateData.habitConfig;
      }

      const planData = {
        patientId,
        title,
        description: description || '',
        category: category || 'comprehensive',
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        goals: goalsArray,
        createdBy: '医生',
        dietConfig,
        exerciseConfig,
        sleepConfig,
        habitConfig
      };

      if (editingPlan) {
        await planApi.update(editingPlan.id, {
          title,
          description: description || '',
          category: category || 'comprehensive',
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD'),
          goals: goalsArray,
          dietConfig,
          exerciseConfig,
          sleepConfig,
          habitConfig
        });
        message.success('更新成功');
      } else {
        await planApi.create(planData);
        message.success('创建成功');
      }

      setModalVisible(false);
      setTemplateData(null);
      fetchData();
    } catch (error) {
      message.error(editingPlan ? '更新失败' : '创建失败');
    }
  };

  const filteredPlans = plans.filter(plan => {
    const categoryMatch = filterCategory === 'all' || plan.category === filterCategory;
    const patientMatch = filterPatient === 'all' || plan.patientId === filterPatient;
    const statusMatch = filterStatus === 'all' || plan.status === filterStatus;
    return categoryMatch && patientMatch && statusMatch;
  });

  const stats = {
    total: plans.length,
    active: plans.filter(p => p.status === 'active').length,
    suspended: plans.filter(p => p.status === 'suspended').length,
    completed: plans.filter(p => p.status === 'completed').length
  };

  const columns = [
    {
      title: '患者',
      dataIndex: 'patientId',
      key: 'patientId',
      render: (patientId: string) => (
        <Button type="link" onClick={() => navigate(`/patients/${patientId}`)}>
          {getPatientName(patientId)}
        </Button>
      ),
    },
    {
      title: '计划标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: RehabilitationPlan) => (
        <Button type="link" onClick={() => handleViewDetail(record)}>
          {text}
        </Button>
      ),
    },
    {
      title: '计划类型',
      dataIndex: 'category',
      key: 'category',
      render: (category: PlanCategory) => getCategoryTag(category),
    },
    {
      title: '计划周期',
      key: 'period',
      render: (_: unknown, record: RehabilitationPlan) => (
        <span>
          <CalendarOutlined style={{ marginRight: 4 }} />
          {record.startDate} 至 {record.endDate}
        </span>
      ),
    },
    {
      title: '目标数量',
      dataIndex: 'goals',
      key: 'goals',
      render: (goals: string[]) => <Tag color="blue">{goals.length} 个目标</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: RehabilitationPlan['status']) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      key: 'createdBy',
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: unknown, record: RehabilitationPlan) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.status === 'active' && (
            <Popconfirm
              title="确定要暂停该计划吗？"
              onConfirm={() => handleSuspend(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<PauseOutlined />}>
                暂停
              </Button>
            </Popconfirm>
          )}
          {record.status !== 'completed' && (
            <Popconfirm
              title="确定要标记该计划为已完成吗？"
              onConfirm={() => handleComplete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }}>
                完成
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="确定要删除该计划吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderDetailContent = () => {
    if (!selectedPlan) return null;

    const progress = planProgress;

    const detailTabs = [
      {
        key: 'basic',
        label: (
          <span>
            <FileTextOutlined style={{ marginRight: 4 }} />
            基本信息
          </span>
        ),
        children: (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="患者">
                <Button type="link" onClick={() => navigate(`/patients/${selectedPlan.patientId}`)}>
                  {getPatientName(selectedPlan.patientId)}
                </Button>
              </Descriptions.Item>
              <Descriptions.Item label="计划类型">
                {getCategoryTag(selectedPlan.category)}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(selectedPlan.status)}>
                  {getStatusText(selectedPlan.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建人">{selectedPlan.createdBy}</Descriptions.Item>
              <Descriptions.Item label="开始日期">{selectedPlan.startDate}</Descriptions.Item>
              <Descriptions.Item label="结束日期">{selectedPlan.endDate}</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {new Date(selectedPlan.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="计划描述" span={2}>
                {selectedPlan.description || '暂无描述'}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <h4 style={{ marginBottom: 12 }}>康复目标：</h4>
              <List
                bordered
                dataSource={selectedPlan.goals}
                renderItem={(goal, index) => (
                  <List.Item>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Tag color="blue" style={{ marginRight: 12, marginTop: 2 }}>
                        目标 {index + 1}
                      </Tag>
                      <span>{goal}</span>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </div>
        )
      }
    ];

    if (selectedPlan.category === 'diet' || selectedPlan.category === 'comprehensive') {
      detailTabs.push({
        key: 'diet',
        label: (
          <span>
            <CoffeeOutlined style={{ marginRight: 4 }} />
            饮食配置
          </span>
        ),
        children: (
          <div>
            {selectedPlan.dietConfig ? (
              <div>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={6}>
                    <Card bordered size="small" className="metric-card">
                      <div className="metric-label">目标热量</div>
                      <div className="metric-value" style={{ color: '#fa8c16' }}>
                        {selectedPlan.dietConfig.targetCalories}
                        <span style={{ fontSize: 14, marginLeft: 4 }}>kcal/天</span>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card bordered size="small" className="metric-card">
                      <div className="metric-label">蛋白质</div>
                      <div className="metric-value" style={{ color: '#52c41a' }}>
                        {selectedPlan.dietConfig.targetProtein}
                        <span style={{ fontSize: 14, marginLeft: 4 }}>g</span>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card bordered size="small" className="metric-card">
                      <div className="metric-label">碳水化合物</div>
                      <div className="metric-value" style={{ color: '#1890ff' }}>
                        {selectedPlan.dietConfig.targetCarbs}
                        <span style={{ fontSize: 14, marginLeft: 4 }}>g</span>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Card bordered size="small" className="metric-card">
                      <div className="metric-label">脂肪</div>
                      <div className="metric-value" style={{ color: '#f5222d' }}>
                        {selectedPlan.dietConfig.targetFat}
                        <span style={{ fontSize: 14, marginLeft: 4 }}>g</span>
                      </div>
                    </Card>
                  </Col>
                </Row>

                {selectedPlan.dietConfig.restrictions.length > 0 && (
                  <Alert
                    message="饮食限制"
                    description={selectedPlan.dietConfig.restrictions.join('、')}
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}

                <div>
                  <h4 style={{ marginBottom: 12 }}>饮食时间表：</h4>
                  <List
                    bordered
                    dataSource={selectedPlan.dietConfig.mealSchedules}
                    renderItem={(meal) => (
                      <List.Item>
                        <List.Item.Meta
                        avatar={
                          <Tag color={
                            meal.mealType === 'breakfast' ? 'green' :
                            meal.mealType === 'lunch' ? 'blue' :
                            meal.mealType === 'dinner' ? 'orange' : 'default'
                          }>
                            {getMealTypeText(meal.mealType)}
                          </Tag>
                        }
                        title={
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <ClockCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                            {meal.suggestedTime}
                          </div>
                        }
                        description={
                          <div>
                            <strong>建议食物：</strong>
                            {meal.suggestedFoods.join('、')}
                          </div>
                        }
                      />
                      </List.Item>
                    )}
                  />
                </div>

                {progress?.dietProgress && (
                  <>
                    <Divider />
                    <div>
                      <h4 style={{ marginBottom: 12 }}>饮食进度：</h4>
                      <Card size="small">
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span>整体饮食达标率</span>
                            <span>{progress.dietProgress.totalDays > 0
                              ? Math.round((progress.dietProgress.completedDays / progress.dietProgress.totalDays) * 100)
                              : 0}%</span>
                          </div>
                          <Progress 
                            percent={progress.dietProgress.totalDays > 0
                              ? Math.round((progress.dietProgress.completedDays / progress.dietProgress.totalDays) * 100)
                              : 0}
                          />
                        </div>
                        <Row gutter={16}>
                          <Col xs={12}>
                            <div className="metric-label">平均热量</div>
                            <div className="metric-value" style={{ fontSize: 20 }}>
                              {progress.dietProgress.avgCalories} <span style={{ fontSize: 14 }}>kcal</span>
                            </div>
                          </Col>
                          <Col xs={12}>
                            <div className="metric-label">目标热量</div>
                            <div className="metric-value" style={{ fontSize: 20, color: '#8c8c8c' }}>
                              {progress.dietProgress.targetCalories} <span style={{ fontSize: 14 }}>kcal</span>
                            </div>
                          </Col>
                        </Row>
                      </Card>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Empty description="暂无饮食配置" />
            )}
          </div>
        )
      });
    }

    if (selectedPlan.category === 'exercise' || selectedPlan.category === 'comprehensive') {
      detailTabs.push({
        key: 'exercise',
        label: (
          <span>
            <FireOutlined style={{ marginRight: 4 }} />
            运动配置
          </span>
        ),
        children: (
          <div>
            {selectedPlan.exerciseConfig ? (
              <div>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={8}>
                    <Card bordered size="small" className="metric-card">
                      <div className="metric-label">目标时长</div>
                      <div className="metric-value" style={{ color: '#f5222d' }}>
                        {selectedPlan.exerciseConfig.targetDuration}
                        <span style={{ fontSize: 14, marginLeft: 4 }}>分钟/周</span>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card bordered size="small" className="metric-card">
                      <div className="metric-label">目标频率</div>
                      <div className="metric-value" style={{ color: '#1890ff' }}>
                        {selectedPlan.exerciseConfig.targetFrequency}
                        <span style={{ fontSize: 14, marginLeft: 4 }}>次/周</span>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card bordered size="small" className="metric-card">
                      <div className="metric-label">推荐强度</div>
                      <div className="metric-value" style={{ color: '#52c41a' }}>
                        {getIntensityText(selectedPlan.exerciseConfig.preferredIntensity)}
                      </div>
                    </Card>
                  </Col>
                </Row>

                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ marginBottom: 12 }}>推荐运动类型：</h4>
                  <Space wrap>
                    {selectedPlan.exerciseConfig.exerciseTypes.map((type, index) => (
                    <Tag key={index} color="blue">{type}</Tag>
                  ))}
                  </Space>
                </div>

                <div>
                  <h4 style={{ marginBottom: 12 }}>每周运动安排：</h4>
                  <Timeline>
                    {selectedPlan.exerciseConfig.weeklySchedule.map((schedule, index) => {
                    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
                    return (
                      <Timeline.Item key={index} color="green">
                        <div style={{ fontWeight: 600 }}>{dayNames[schedule.dayOfWeek]}</div>
                        <List
                          size="small"
                          dataSource={schedule.exercises}
                          renderItem={(exercise) => (
                            <List.Item>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <span><FireFilled style={{ color: '#f5222d', marginRight: 4 }} />{exercise.name}</span>
                                <span>{exercise.duration} 分钟</span>
                                <Tag>{getIntensityText(exercise.intensity)}</Tag>
                              </div>
                            </List.Item>
                          )}
                        />
                      </Timeline.Item>
                    );
                  })}
                  </Timeline>
                </div>

                {progress?.exerciseProgress && (
                  <>
                    <Divider />
                    <div>
                      <h4 style={{ marginBottom: 12 }}>运动进度：</h4>
                      <Card size="small">
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span>运动完成率</span>
                            <span>{progress.exerciseProgress.totalSessions > 0
                              ? Math.round((progress.exerciseProgress.completedSessions / progress.exerciseProgress.totalSessions) * 100)
                              : 0}%</span>
                          </div>
                          <Progress 
                            percent={progress.exerciseProgress.totalSessions > 0
                              ? Math.round((progress.exerciseProgress.completedSessions / progress.exerciseProgress.totalSessions) * 100)
                              : 0}
                          />
                        </div>
                        <Row gutter={16}>
                          <Col xs={12}>
                            <div className="metric-label">累计运动时长</div>
                            <div className="metric-value" style={{ fontSize: 20 }}>
                              {progress.exerciseProgress.totalMinutes} <span style={{ fontSize: 14 }}>分钟</span>
                            </div>
                          </Col>
                          <Col xs={12}>
                            <div className="metric-label">累计消耗热量</div>
                            <div className="metric-value" style={{ fontSize: 20, color: '#f5222d' }}>
                              {progress.exerciseProgress.totalCaloriesBurned} <span style={{ fontSize: 14 }}>kcal</span>
                            </div>
                          </Col>
                        </Row>
                      </Card>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Empty description="暂无运动配置" />
            )}
          </div>
        )
      });
    }

    if (selectedPlan.category === 'sleep' || selectedPlan.category === 'comprehensive') {
      detailTabs.push({
        key: 'sleep',
        label: (
          <span>
            <MoonOutlined style={{ marginRight: 4 }} />
            睡眠配置
          </span>
        ),
        children: (
          <div>
            {selectedPlan.sleepConfig ? (
              <div>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={8}>
                    <Card bordered size="small" className="metric-card">
                      <div className="metric-label">目标睡眠时长</div>
                      <div className="metric-value" style={{ color: '#722ed1' }}>
                        {selectedPlan.sleepConfig.targetDuration}
                        <span style={{ fontSize: 14, marginLeft: 4 }}>小时</span>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card bordered size="small" className="metric-card">
                      <div className="metric-label">目标入睡时间</div>
                      <div className="metric-value" style={{ color: '#1890ff' }}>
                        {selectedPlan.sleepConfig.targetBedTime}
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card bordered size="small" className="metric-card">
                      <div className="metric-label">目标起床时间</div>
                      <div className="metric-value" style={{ color: '#52c41a' }}>
                        {selectedPlan.sleepConfig.targetWakeUpTime}
                      </div>
                    </Card>
                  </Col>
                </Row>

                <div>
                  <h4 style={{ marginBottom: 12 }}>睡前准备流程：</h4>
                  <List
                    bordered
                    dataSource={selectedPlan.sleepConfig.preSleepRoutine}
                    renderItem={(item, index) => (
                      <List.Item>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Steps
                            size="small"
                            current={index + 1}
                            items={[
                              { title: item }
                            ]}
                          />
                        </div>
                      </List.Item>
                    )}
                  />
                </div>

                <Divider />

                <div>
                  <h4 style={{ marginBottom: 12 }}>睡眠卫生规则：</h4>
                  <List
                    bordered
                    dataSource={selectedPlan.sleepConfig.sleepHygieneRules}
                    renderItem={(item) => (
                      <List.Item>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        {item}
                      </List.Item>
                    )}
                  />
                </div>

                {progress?.sleepProgress && (
                  <>
                    <Divider />
                    <div>
                      <h4 style={{ marginBottom: 12 }}>睡眠进度：</h4>
                      <Card size="small">
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span>优质睡眠比例</span>
                            <span>{progress.sleepProgress.totalNights > 0
                              ? Math.round((progress.sleepProgress.goodQualityNights / progress.sleepProgress.totalNights) * 100)
                              : 0}%</span>
                          </div>
                          <Progress 
                            percent={progress.sleepProgress.totalNights > 0
                              ? Math.round((progress.sleepProgress.goodQualityNights / progress.sleepProgress.totalNights) * 100)
                              : 0}
                          />
                        </div>
                        <Row gutter={16}>
                          <Col xs={12}>
                            <div className="metric-label">平均睡眠时长</div>
                            <div className="metric-value" style={{ fontSize: 20 }}>
                              {progress.sleepProgress.avgDuration.toFixed(1)} <span style={{ fontSize: 14 }}>小时</span>
                            </div>
                          </Col>
                          <Col xs={12}>
                            <div className="metric-label">目标时长</div>
                            <div className="metric-value" style={{ fontSize: 20, color: '#8c8c8c' }}>
                              {progress.sleepProgress.targetDuration} <span style={{ fontSize: 14 }}>小时</span>
                            </div>
                          </Col>
                        </Row>
                      </Card>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Empty description="暂无睡眠配置" />
            )}
          </div>
        )
      });
    }

    if (selectedPlan.category === 'habit' || selectedPlan.category === 'comprehensive') {
      detailTabs.push({
        key: 'habit',
        label: (
          <span>
            <AppstoreOutlined style={{ marginRight: 4 }} />
            习惯配置
          </span>
        ),
        children: (
          <div>
            {selectedPlan.habitConfig?.habits && selectedPlan.habitConfig.habits.length > 0 ? (
            <div>
              <h4 style={{ marginBottom: 12 }}>习惯列表：</h4>
              <List
                bordered
                dataSource={selectedPlan.habitConfig.habits}
                renderItem={(habit, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Tag color={
                          habit.type === 'diet' ? 'orange' :
                          habit.type === 'exercise' ? 'red' :
                          habit.type === 'sleep' ? 'purple' :
                          habit.type === 'medication' ? 'blue' : 'default'
                        }>
                          {getHabitTypeText(habit.type)}
                        </Tag>
                      }
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600 }}>{habit.name}</span>
                          {habit.reminders && (
                            <Tag color="blue">
                              <ClockCircleOutlined style={{ marginRight: 4 }} />
                              提醒时间: {habit.reminderTime}
                            </Tag>
                          )}
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 4 }}>{habit.description}</div>
                          <div>
                            <Tag>频率: {habit.frequency === 'daily' ? '每天' : habit.frequency === 'weekly' ? '每周' : '每月'}
                            </Tag>
                            <Tag style={{ marginLeft: 8 }}>目标天数: {habit.targetDays} 天</Tag>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />

              {progress?.habitProgress && (
                <>
                  <Divider />
                  <div>
                    <h4 style={{ marginBottom: 12 }}>习惯进度：</h4>
                    {progress.habitProgress.habits.map((habit, index) => (
                      <Card key={index} size="small" style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontWeight: 600 }}>{habit.name}</span>
                          <Space>
                            <Tag color="green">
                              当前连续: {habit.currentStreak} 天
                            </Tag>
                            <Tag color="blue">
                              最长连续: {habit.longestStreak} 天
                            </Tag>
                          </Space>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span>完成率</span>
                            <span>{habit.totalDays > 0
                              ? Math.round((habit.completedDays / habit.totalDays) * 100)
                              : 0}%</span>
                          </div>
                          <Progress 
                            percent={habit.totalDays > 0
                              ? Math.round((habit.completedDays / habit.totalDays) * 100)
                              : 0}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <Empty description="暂无习惯配置" />
          )}
        </div>
        )
      });
    }

    if (progress) {
      detailTabs.push({
        key: 'progress',
        label: (
          <span>
            <ReloadOutlined style={{ marginRight: 4 }} />
            进度展示
          </span>
        ),
        children: (
          <div>
            <Card title="整体进度" style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 16 }}>总进度</span>
                  <span style={{ fontSize: 24, fontWeight: 600, color: progress.overallProgress >= 80 ? '#52c41a' : '#1890ff' }}>
                    {progress.overallProgress}%
                  </span>
                </div>
                <Progress 
                  percent={progress.overallProgress} 
                  strokeWidth={15}
                  strokeColor={progress.overallProgress >= 80 ? '#52c41a' : '#1890ff'}
                />
            </div>

            <Row gutter={[16, 16]}>
              {progress.dietProgress && (
                <Col xs={24} sm={6}>
                  <Card bordered size="small" className="metric-card">
                    <div className="metric-label">饮食管理</div>
                    <div className="metric-value" style={{ color: '#fa8c16' }}>
                      {progress.dietProgress.totalDays > 0
                        ? Math.round((progress.dietProgress.completedDays / progress.dietProgress.totalDays) * 100)
                        : 0}%
                    </div>
                    <Progress 
                      percent={progress.dietProgress.totalDays > 0
                        ? Math.round((progress.dietProgress.completedDays / progress.dietProgress.totalDays) * 100)
                        : 0} 
                      size="small"
                    />
                  </Card>
                </Col>
              )}
              {progress.exerciseProgress && (
                <Col xs={24} sm={6}>
                  <Card bordered size="small" className="metric-card">
                    <div className="metric-label">运动康复</div>
                    <div className="metric-value" style={{ color: '#f5222d' }}>
                      {progress.exerciseProgress.totalSessions > 0
                        ? Math.round((progress.exerciseProgress.completedSessions / progress.exerciseProgress.totalSessions) * 100)
                        : 0}%
                    </div>
                    <Progress 
                      percent={progress.exerciseProgress.totalSessions > 0
                        ? Math.round((progress.exerciseProgress.completedSessions / progress.exerciseProgress.totalSessions) * 100)
                        : 0} 
                      size="small"
                    />
                  </Card>
                </Col>
              )}
              {progress.sleepProgress && (
                <Col xs={24} sm={6}>
                  <Card bordered size="small" className="metric-card">
                    <div className="metric-label">睡眠改善</div>
                    <div className="metric-value" style={{ color: '#722ed1' }}>
                      {progress.sleepProgress.totalNights > 0
                        ? Math.round((progress.sleepProgress.goodQualityNights / progress.sleepProgress.totalNights) * 100)
                        : 0}%
                    </div>
                    <Progress 
                      percent={progress.sleepProgress.totalNights > 0
                        ? Math.round((progress.sleepProgress.goodQualityNights / progress.sleepProgress.totalNights) * 100)
                        : 0} 
                      size="small"
                    />
                  </Card>
                </Col>
              )}
              {progress.habitProgress && (
                <Col xs={24} sm={6}>
                  <Card bordered size="small" className="metric-card">
                    <div className="metric-label">习惯养成</div>
                    <div className="metric-value" style={{ color: '#13c2c2' }}>
                      {progress.habitProgress.habits.length > 0
                        ? Math.round(
                            progress.habitProgress.habits.reduce((sum, h) => 
                              sum + (h.totalDays > 0 ? (h.completedDays / h.totalDays) * 100 : 0), 0
                            ) / progress.habitProgress.habits.length
                          )
                        : 0}%
                    </div>
                    <Progress 
                      percent={progress.habitProgress.habits.length > 0
                        ? Math.round(
                            progress.habitProgress.habits.reduce((sum, h) => 
                              sum + (h.totalDays > 0 ? (h.completedDays / h.totalDays) * 100 : 0), 0
                            ) / progress.habitProgress.habits.length
                          )
                        : 0} 
                      size="small"
                    />
                  </Card>
                </Col>
              )}
            </Row>
            </Card>

            <div>
              <h4 style={{ marginBottom: 12 }}>目标完成情况：</h4>
              {progress.goalProgress.map((item, index) => (
                <Card key={index} size="small" style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {item.completed ? (
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                      ) : (
                        <RightOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                      )}
                      <span style={{ 
                        textDecoration: item.completed ? 'line-through' : 'none',
                        color: item.completed ? '#8c8c8c' : 'inherit'
                      }}>
                        {item.goal}
                      </span>
                      {item.relatedCategory && (
                        <Tag style={{ marginLeft: 8 }}>
                          {CATEGORY_CONFIG[item.relatedCategory].label}
                        </Tag>
                      )}
                    </div>
                    <span style={{ 
                      color: item.completed ? '#52c41a' : '#1890ff',
                      fontWeight: 600
                    }}>
                      {item.progress}%
                    </span>
                  </div>
                  <Progress 
                    percent={item.progress} 
                    size="small"
                    strokeColor={item.completed ? '#52c41a' : '#1890ff'}
                  />
                </Card>
              ))}
            </div>
          </div>
        )
      });
    }

    return <Tabs defaultActiveKey="basic" items={detailTabs} />;
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
          style={{ marginBottom: 16 }}
        >
          返回
        </Button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title" style={{ margin: 0 }}>
            <FileTextOutlined style={{ marginRight: 8 }} />
            康复计划管理
          </h1>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建计划
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="计划总数"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="进行中"
              value={stats.active}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="已暂停"
              value={stats.suspended}
              prefix={<PauseOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={6}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>计划类型</div>
            <Select
              style={{ width: '100%' }}
              value={filterCategory}
              onChange={(value: PlanCategory | 'all') => setFilterCategory(value)}
              placeholder="选择类型"
            >
              <Option value="all">全部类型</Option>
              {(Object.keys(CATEGORY_CONFIG) as PlanCategory[]).map(category => (
                <Option key={category} value={category}>
                  {CATEGORY_CONFIG[category].icon} {CATEGORY_CONFIG[category].label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>筛选患者</div>
            <Select
              style={{ width: '100%' }}
              value={filterPatient}
              onChange={setFilterPatient}
              allowClear
              placeholder="选择患者"
            >
              <Option value="all">全部患者</Option>
              {patients.map(patient => (
                <Option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.condition}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>筛选状态</div>
            <Select
              style={{ width: '100%' }}
              value={filterStatus}
              onChange={setFilterStatus}
            >
              <Option value="all">全部状态</Option>
              <Option value="active">进行中</Option>
              <Option value="suspended">已暂停</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>操作</div>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              刷新数据
            </Button>
          </Col>
        </Row>
      </Card>

      <Card>
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : filteredPlans.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredPlans}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <Empty description="暂无康复计划，点击上方按钮创建">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新建计划
            </Button>
          </Empty>
        )}
      </Card>

      <Modal
        title={
          <span>
            {editingPlan ? '编辑康复计划' : '新建康复计划'}
          </span>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setTemplateData(null);
        }}
        footer={null}
        width={900}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 24 }}
        >
          <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="patientId"
                  label="选择患者"
                  rules={[{ required: true, message: '请选择患者' }]}
                >
                  <Select 
                    placeholder="请选择患者"
                    onChange={(patientId) => {
                      const category = form.getFieldValue('category');
                      if (patientId) {
                        handleGenerateTemplate(patientId, category);
                      }
                    }}
                  >
                    {patients.map(patient => (
                      <Option key={patient.id} value={patient.id}>
                        {patient.name} - {patient.condition}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="category"
                  label="计划类型"
                  rules={[{ required: true, message: '请选择计划类型' }]}
                >
                  <Select 
                    placeholder="请选择计划类型"
                    onChange={handleCategoryChange}
                  >
                    {(Object.keys(CATEGORY_CONFIG) as PlanCategory[]).map(category => (
                      <Option key={category} value={category}>
                        {CATEGORY_CONFIG[category].icon} {CATEGORY_CONFIG[category].label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="title"
                  label="计划标题"
                  rules={[{ required: true, message: '请输入计划标题' }]}
                >
                  <Input placeholder="请输入计划标题" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="dateRange"
                  label="计划周期"
                  rules={[{ required: true, message: '请选择计划周期' }]}
                >
                  <RangePicker 
                    style={{ width: '100%' }}
                    placeholder={['开始日期', '结束日期']}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="计划描述"
            >
              <TextArea rows={2} placeholder="请输入计划描述" />
            </Form.Item>

            <Form.Item
              name="goals"
              label="康复目标"
              help="每行一个目标"
            >
              <TextArea 
                rows={4} 
                placeholder="请输入康复目标，每行一个目标&#10;例如：&#10;控制血压在正常范围内&#10;改善生活质量&#10;提高运动能力"
              />
            </Form.Item>
          </Card>

          {templateData && (
            <div>
              <Alert
                message="已根据患者病情生成计划模板"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              {(templateData.dietConfig || templateData.exerciseConfig || 
                templateData.sleepConfig || templateData.habitConfig) && (
                <Collapse defaultActiveKey={[]}>
                  {templateData.dietConfig && (
                    <Panel 
                      header={<span><CoffeeOutlined style={{ marginRight: 8 }} />饮食配置预览</span>} 
                      key="diet"
                    >
                      <Descriptions column={2} size="small">
                        <Descriptions.Item label="目标热量">
                          {templateData.dietConfig.targetCalories} kcal/天
                        </Descriptions.Item>
                        <Descriptions.Item label="蛋白质">
                          {templateData.dietConfig.targetProtein} g
                        </Descriptions.Item>
                        <Descriptions.Item label="碳水化合物">
                          {templateData.dietConfig.targetCarbs} g
                        </Descriptions.Item>
                        <Descriptions.Item label="脂肪">
                          {templateData.dietConfig.targetFat} g
                        </Descriptions.Item>
                        <Descriptions.Item label="饮食限制" span={2}>
                          {templateData.dietConfig.restrictions.join('、') || '无'}
                        </Descriptions.Item>
                      </Descriptions>
                    </Panel>
                  )}

                  {templateData.exerciseConfig && (
                    <Panel 
                      header={<span><FireOutlined style={{ marginRight: 8 }} />运动配置预览</span>} 
                      key="exercise"
                    >
                      <Descriptions column={2} size="small">
                        <Descriptions.Item label="目标时长">
                          {templateData.exerciseConfig.targetDuration} 分钟/周
                        </Descriptions.Item>
                        <Descriptions.Item label="目标频率">
                          {templateData.exerciseConfig.targetFrequency} 次/周
                        </Descriptions.Item>
                        <Descriptions.Item label="推荐强度">
                          {getIntensityText(templateData.exerciseConfig.preferredIntensity)}
                        </Descriptions.Item>
                        <Descriptions.Item label="推荐运动">
                          {templateData.exerciseConfig.exerciseTypes.join('、')}
                        </Descriptions.Item>
                      </Descriptions>
                    </Panel>
                  )}

                  {templateData.sleepConfig && (
                    <Panel 
                      header={<span><MoonOutlined style={{ marginRight: 8 }} />睡眠配置预览</span>} 
                      key="sleep"
                    >
                      <Descriptions column={2} size="small">
                        <Descriptions.Item label="目标睡眠时长">
                          {templateData.sleepConfig.targetDuration} 小时
                        </Descriptions.Item>
                        <Descriptions.Item label="作息时间">
                          {templateData.sleepConfig.targetBedTime} - {templateData.sleepConfig.targetWakeUpTime}
                        </Descriptions.Item>
                      </Descriptions>
                    </Panel>
                  )}

                  {templateData.habitConfig && (
                    <Panel 
                      header={<span><AppstoreOutlined style={{ marginRight: 8 }} />习惯配置预览</span>} 
                      key="habit"
                    >
                      <List
                        size="small"
                        dataSource={templateData.habitConfig.habits}
                        renderItem={(habit) => (
                          <List.Item>
                            <div>
                              <span style={{ fontWeight: 600, marginRight: 8 }}>{habit.name}</span>
                              <Tag>{getHabitTypeText(habit.type)}</Tag>
                              {habit.reminders && (
                                <Tag style={{ marginLeft: 8 }}>提醒: {habit.reminderTime}</Tag>
                              )}
                              <div style={{ color: '#8c8c8c', marginTop: 4 }}>
                                {habit.description}
                              </div>
                            </div>
                          </List.Item>
                        )}
                      />
                    </Panel>
                  )}
                </Collapse>
              )}
            </div>
          )}

          <Form.Item style={{ marginBottom: 0, marginTop: 24, textAlign: 'right' }}>
            <Button onClick={() => {
              setModalVisible(false);
              setTemplateData(null);
            }} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingPlan ? '保存' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="计划详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          selectedPlan && selectedPlan.status === 'active' && (
            <Button
              key="edit"
              onClick={() => {
                setDetailModalVisible(false);
                handleEdit(selectedPlan);
              }}
            >
              编辑计划
            </Button>
          )
        ]}
        width={1000}
      >
        {renderDetailContent()}
      </Modal>
    </div>
  );
};

export default PlanManagement;
