import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Button, Tag, Spin, message, Row, Col, Statistic,
  Divider, Tabs, List, Timeline, Progress, Badge, Empty, Table, Space
} from 'antd';
import {
  ArrowLeftOutlined, FileTextOutlined, WarningOutlined, EditOutlined,
  HeartOutlined, FireOutlined, CoffeeOutlined, MoonOutlined,
  ScheduleOutlined, CheckCircleOutlined, ClockCircleOutlined,
  RiseOutlined, FallOutlined, UserOutlined
} from '@ant-design/icons';
import { Patient, RiskAssessment, RehabilitationPlan } from '../types';
import { patientApi, riskApi, planApi, patientDataApi } from '../services/api';

const { TabPane } = Tabs;

interface PatientAllData {
  patient: Patient;
  healthMetrics: {
    latest: any;
    summary: any;
    recent: any[];
  };
  diet: {
    summary: any;
    recent: any[];
  };
  exercise: {
    summary: any;
    recent: any[];
  };
  sleep: {
    summary: any;
    recent: any[];
  };
}

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState<PatientAllData | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [rehabilitationPlans, setRehabilitationPlans] = useState<RehabilitationPlan[]>([]);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (id) {
      fetchPatientData(id);
    }
  }, [id]);

  const fetchPatientData = async (patientId: string) => {
    setLoading(true);
    try {
      const [data, assessmentData, plansData] = await Promise.all([
        patientDataApi.getAllPatientData(patientId),
        riskApi.assessPatientRisk(patientId),
        planApi.getByPatient(patientId)
      ]);
      setPatientData(data);
      setRiskAssessment(assessmentData);
      setRehabilitationPlans(plansData);
    } catch (error) {
      message.error('获取患者数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: Patient['status']) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      'active': { color: 'green', text: '康复中' },
      'discharged': { color: 'blue', text: '已出院' },
      'follow-up': { color: 'orange', text: '随访中' }
    };
    const config = statusMap[status] || statusMap['active'];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getRiskLevelColor = (level: RiskAssessment['overallLevel']) => {
    const colorMap: Record<string, string> = {
      'low': '#52c41a',
      'medium': '#faad14',
      'high': '#ff4d4f'
    };
    return colorMap[level] || colorMap['low'];
  };

  const getRiskLevelText = (level: RiskAssessment['overallLevel']) => {
    const textMap: Record<string, string> = {
      'low': '低风险',
      'medium': '中风险',
      'high': '高风险'
    };
    return textMap[level] || textMap['low'];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return '#52c41a';
      case 'warning': return '#faad14';
      case 'abnormal': return '#ff4d4f';
      default: return '#52c41a';
    }
  };

  const getTrendIcon = (change: number | null) => {
    if (change === null) return null;
    if (change > 0) return <RiseOutlined style={{ color: '#ff4d4f' }} />;
    if (change < 0) return <FallOutlined style={{ color: '#52c41a' }} />;
    return null;
  };

  const getMealTypeText = (type: string) => {
    const map: Record<string, string> = {
      'breakfast': '早餐',
      'lunch': '午餐',
      'dinner': '晚餐',
      'snack': '加餐'
    };
    return map[type] || type;
  };

  const getIntensityText = (intensity: string) => {
    const map: Record<string, string> = {
      'low': '低强度',
      'medium': '中等强度',
      'high': '高强度'
    };
    return map[intensity] || intensity;
  };

  const getIntensityColor = (intensity: string) => {
    const map: Record<string, string> = {
      'low': '#52c41a',
      'medium': '#1890ff',
      'high': '#ff4d4f'
    };
    return map[intensity] || '#1890ff';
  };

  const getSleepQualityText = (quality: string) => {
    const map: Record<string, string> = {
      'poor': '差',
      'fair': '一般',
      'good': '良好',
      'excellent': '优秀'
    };
    return map[quality] || quality;
  };

  const getPlanStatusColor = (status: string) => {
    const map: Record<string, string> = {
      'active': 'green',
      'suspended': 'orange',
      'completed': 'blue'
    };
    return map[status] || 'default';
  };

  const getPlanStatusText = (status: string) => {
    const map: Record<string, string> = {
      'active': '进行中',
      'suspended': '已暂停',
      'completed': '已完成'
    };
    return map[status] || '未知';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="empty-container">
        <h2>患者不存在</h2>
        <Button onClick={() => navigate('/patients')}>返回患者列表</Button>
      </div>
    );
  }

  const { patient, healthMetrics, diet, exercise, sleep } = patientData;

  const renderBasicInfo = () => (
    <div>
      <Card title={<span className="card-title"><UserOutlined style={{ marginRight: 8 }} />基本信息</span>}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="姓名">{patient.name}</Descriptions.Item>
          <Descriptions.Item label="性别">
            {patient.gender === 'male' ? '男' : '女'}
          </Descriptions.Item>
          <Descriptions.Item label="年龄">{patient.age} 岁</Descriptions.Item>
          <Descriptions.Item label="联系电话">{patient.phone}</Descriptions.Item>
          <Descriptions.Item label="诊断" span={2}>
            {patient.condition}
          </Descriptions.Item>
          <Descriptions.Item label="入院日期">{patient.admissionDate}</Descriptions.Item>
          <Descriptions.Item label="状态">
            {getStatusTag(patient.status)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {riskAssessment && (
        <Card 
          title={
            <span className="card-title">
              <WarningOutlined style={{ marginRight: 8 }} />
              风险评估
            </span>
          }
          style={{ marginTop: 16 }}
        >
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8}>
              <Card bordered={false} style={{ textAlign: 'center' }}>
                <Statistic
                  title="整体风险等级"
                  value={getRiskLevelText(riskAssessment.overallLevel)}
                  valueStyle={{ color: getRiskLevelColor(riskAssessment.overallLevel) }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} style={{ textAlign: 'center' }}>
                <Statistic
                  title="风险因素数"
                  value={riskAssessment.riskFactors.length}
                  valueStyle={{ color: riskAssessment.riskFactors.length > 0 ? '#faad14' : '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} style={{ textAlign: 'center' }}>
                <Statistic
                  title="紧急处理项"
                  value={riskAssessment.immediateActions.length}
                  valueStyle={{ color: riskAssessment.immediateActions.length > 0 ? '#ff4d4f' : '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {riskAssessment.riskFactors.length > 0 && (
            <>
              <Divider />
              <div>
                <h4 style={{ marginBottom: 12 }}>风险因素详情：</h4>
                {riskAssessment.riskFactors.map((factor, index) => (
                  <Card 
                    key={index} 
                    size="small" 
                    style={{ marginBottom: 8 }}
                    className={`alert-${factor.level === 'high' ? 'high' : factor.level === 'medium' ? 'medium' : 'low'}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                          {factor.category}
                          <Tag 
                            color={factor.level === 'high' ? 'red' : factor.level === 'medium' ? 'orange' : 'green'}
                            style={{ marginLeft: 8 }}
                          >
                            {factor.level === 'high' ? '高危' : factor.level === 'medium' ? '中危' : '低危'}
                          </Tag>
                        </div>
                        <div style={{ color: '#8c8c8c', marginBottom: 8 }}>{factor.description}</div>
                        <div style={{ color: '#1890ff' }}>
                          <strong>建议：</strong>{factor.suggestion}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {riskAssessment.immediateActions.length > 0 && (
            <>
              <Divider />
              <div>
                <h4 style={{ marginBottom: 12, color: '#ff4d4f' }}>立即处理措施：</h4>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {riskAssessment.immediateActions.map((action, index) => (
                    <li key={index} style={{ marginBottom: 8, color: '#ff4d4f' }}>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );

  const renderHealthMetrics = () => (
    <div>
      {healthMetrics.summary ? (
        <>
          <Card title={<span className="card-title"><HeartOutlined style={{ marginRight: 8 }} />健康指标概览（近7天）</span>}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered size="small" className="metric-card">
                  <div className="metric-label">血压</div>
                  <div className="metric-value" style={{ color: getStatusColor(healthMetrics.summary.average.bloodPressure.status) }}>
                    {healthMetrics.summary.average.bloodPressure.systolic}/{healthMetrics.summary.average.bloodPressure.diastolic}
                    <span style={{ fontSize: 14, marginLeft: 4 }}>mmHg</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Tag color={getStatusColor(healthMetrics.summary.average.bloodPressure.status)}>
                      {healthMetrics.summary.average.bloodPressure.status === 'normal' ? '正常' : 
                       healthMetrics.summary.average.bloodPressure.status === 'warning' ? '预警' : '异常'}
                    </Tag>
                    {healthMetrics.summary.trend.bloodPressure && (
                      <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                        {getTrendIcon(healthMetrics.summary.trend.bloodPressure.systolicChange)}
                        较前 {healthMetrics.summary.trend.bloodPressure.systolicChange > 0 ? '+' : ''}
                        {healthMetrics.summary.trend.bloodPressure.systolicChange}/
                        {healthMetrics.summary.trend.bloodPressure.diastolicChange > 0 ? '+' : ''}
                        {healthMetrics.summary.trend.bloodPressure.diastolicChange}
                      </span>
                    )}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered size="small" className="metric-card">
                  <div className="metric-label">心率</div>
                  <div className="metric-value" style={{ color: getStatusColor(healthMetrics.summary.average.heartRate.status) }}>
                    {healthMetrics.summary.average.heartRate.value}
                    <span style={{ fontSize: 14, marginLeft: 4 }}>次/分</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Tag color={getStatusColor(healthMetrics.summary.average.heartRate.status)}>
                      {healthMetrics.summary.average.heartRate.status === 'normal' ? '正常' : '异常'}
                    </Tag>
                    {healthMetrics.summary.trend.heartRate !== null && (
                      <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                        {getTrendIcon(healthMetrics.summary.trend.heartRate)}
                        较前 {healthMetrics.summary.trend.heartRate > 0 ? '+' : ''}
                        {healthMetrics.summary.trend.heartRate}
                      </span>
                    )}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered size="small" className="metric-card">
                  <div className="metric-label">血糖</div>
                  <div className="metric-value" style={{ color: getStatusColor(healthMetrics.summary.average.bloodSugar.status) }}>
                    {healthMetrics.summary.average.bloodSugar.value}
                    <span style={{ fontSize: 14, marginLeft: 4 }}>mmol/L</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Tag color={getStatusColor(healthMetrics.summary.average.bloodSugar.status)}>
                      {healthMetrics.summary.average.bloodSugar.status === 'normal' ? '正常' : 
                       healthMetrics.summary.average.bloodSugar.status === 'warning' ? '预警' : '异常'}
                    </Tag>
                    {healthMetrics.summary.trend.bloodSugar !== null && (
                      <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                        {getTrendIcon(parseFloat(healthMetrics.summary.trend.bloodSugar))}
                        较前 {parseFloat(healthMetrics.summary.trend.bloodSugar) > 0 ? '+' : ''}
                        {healthMetrics.summary.trend.bloodSugar}
                      </span>
                    )}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered size="small" className="metric-card">
                  <div className="metric-label">体重</div>
                  <div className="metric-value">
                    {healthMetrics.summary.average.weight}
                    <span style={{ fontSize: 14, marginLeft: 4 }}>kg</span>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Tag color="blue">
                      数据点: {healthMetrics.summary.dataPoints}
                    </Tag>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>

          {healthMetrics.recent && healthMetrics.recent.length > 0 && (
            <Card 
              title={<span className="card-title"><ClockCircleOutlined style={{ marginRight: 8 }} />历史记录</span>}
              style={{ marginTop: 16 }}
            >
              <Table
                dataSource={healthMetrics.recent}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="small"
              >
                <Table.Column title="日期" dataIndex="date" key="date" />
                <Table.Column 
                  title="血压" 
                  key="bloodPressure"
                  render={(_: any, record: any) => (
                    <span>
                      {record.bloodPressure.systolic}/{record.bloodPressure.diastolic} mmHg
                    </span>
                  )}
                />
                <Table.Column 
                  title="心率" 
                  key="heartRate"
                  render={(_: any, record: any) => (
                    <span>{record.heartRate} 次/分</span>
                  )}
                />
                <Table.Column 
                  title="血糖" 
                  key="bloodSugar"
                  render={(_: any, record: any) => (
                    <span>{record.bloodSugar} mmol/L</span>
                  )}
                />
                <Table.Column 
                  title="体重" 
                  key="weight"
                  render={(_: any, record: any) => (
                    <span>{record.weight} kg</span>
                  )}
                />
              </Table>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <Empty description="暂无健康指标数据" />
        </Card>
      )}
    </div>
  );

  const renderDiet = () => (
    <div>
      {diet.summary ? (
        <>
          <Card title={<span className="card-title"><CoffeeOutlined style={{ marginRight: 8 }} />饮食统计（近7天）</span>}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered size="small" className="metric-card">
                  <div className="metric-label">总热量</div>
                  <div className="metric-value" style={{ color: '#1890ff' }}>
                    {diet.summary.summary.totalCalories}
                    <span style={{ fontSize: 14, marginLeft: 4 }}>kcal</span>
                  </div>
                  <div className="metric-label" style={{ marginTop: 4, fontSize: 12 }}>
                    日均: {diet.summary.summary.avgDailyCalories} kcal
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered size="small" className="metric-card">
                  <div className="metric-label">蛋白质</div>
                  <div className="metric-value" style={{ color: '#52c41a' }}>
                    {diet.summary.summary.totalProtein}
                    <span style={{ fontSize: 14, marginLeft: 4 }}>g</span>
                  </div>
                  <div className="metric-label" style={{ marginTop: 4, fontSize: 12 }}>
                    日均: {diet.summary.summary.avgDailyProtein} g
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered size="small" className="metric-card">
                  <div className="metric-label">碳水化合物</div>
                  <div className="metric-value" style={{ color: '#faad14' }}>
                    {diet.summary.summary.totalCarbs}
                    <span style={{ fontSize: 14, marginLeft: 4 }}>g</span>
                  </div>
                  <div className="metric-label" style={{ marginTop: 4, fontSize: 12 }}>
                    日均: {diet.summary.summary.avgDailyCarbs} g
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered size="small" className="metric-card">
                  <div className="metric-label">脂肪</div>
                  <div className="metric-value" style={{ color: '#ff4d4f' }}>
                    {diet.summary.summary.totalFat}
                    <span style={{ fontSize: 14, marginLeft: 4 }}>g</span>
                  </div>
                  <div className="metric-label" style={{ marginTop: 4, fontSize: 12 }}>
                    日均: {diet.summary.summary.avgDailyFat} g
                  </div>
                </Card>
              </Col>
            </Row>

            {diet.summary.mealTypeBreakdown && diet.summary.mealTypeBreakdown.length > 0 && (
              <>
                <Divider />
                <h4 style={{ marginBottom: 12 }}>各餐统计：</h4>
                <Row gutter={[16, 16]}>
                  {diet.summary.mealTypeBreakdown.map((meal: any, index: number) => (
                    <Col xs={24} sm={12} key={index}>
                      <Card size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600 }}>{meal.type}</span>
                          <Tag color="blue">{meal.count} 次</Tag>
                        </div>
                        <Divider style={{ margin: '8px 0' }} />
                        <div style={{ fontSize: 14, color: '#8c8c8c' }}>
                          平均热量: <span style={{ color: '#1890ff' }}>{meal.avgCalories} kcal</span>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </Card>

          {diet.recent && diet.recent.length > 0 && (
            <Card 
              title={<span className="card-title"><ClockCircleOutlined style={{ marginRight: 8 }} />最近饮食记录</span>}
              style={{ marginTop: 16 }}
            >
              <Timeline>
                {diet.recent.slice(0, 10).map((meal: any, index: number) => (
                  <Timeline.Item 
                    key={index}
                    color={meal.mealType === 'breakfast' ? 'green' : 
                           meal.mealType === 'lunch' ? 'blue' : 
                           meal.mealType === 'dinner' ? 'orange' : 'gray'}
                  >
                    <Card size="small" style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Tag 
                            color={meal.mealType === 'breakfast' ? 'green' : 
                                   meal.mealType === 'lunch' ? 'blue' : 
                                   meal.mealType === 'dinner' ? 'orange' : 'default'}
                          >
                            {getMealTypeText(meal.mealType)}
                          </Tag>
                          <span style={{ marginLeft: 8, color: '#8c8c8c' }}>{meal.date}</span>
                        </div>
                        <Tag color="blue">{meal.calories} kcal</Tag>
                      </div>
                      <Divider style={{ margin: '8px 0' }} />
                      <div style={{ fontSize: 14 }}>
                        <strong>食物：</strong>{meal.food}
                      </div>
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                        蛋白质 {meal.protein}g | 碳水 {meal.carbs}g | 脂肪 {meal.fat}g
                      </div>
                      {meal.notes && (
                        <div style={{ fontSize: 12, color: '#1890ff', marginTop: 4 }}>
                          备注: {meal.notes}
                        </div>
                      )}
                    </Card>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <Empty description="暂无饮食记录数据" />
        </Card>
      )}
    </div>
  );

  const renderExercise = () => (
    <div>
      {exercise.summary ? (
        <>
          <Card title={<span className="card-title"><FireOutlined style={{ marginRight: 8 }} />运动统计（近7天）</span>}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered size="small" className="metric-card">
                  <div className="metric-label">总时长</div>
                  <div className="metric-value" style={{ color: '#1890ff' }}>
                    {exercise.summary.summary.totalDuration}
                    <span style={{ fontSize: 14, marginLeft: 4 }}>分钟</span>
                  </div>
                  <div className="metric-label" style={{ marginTop: 4, fontSize: 12 }}>
                    共 {exercise.summary.summary.sessionsCount} 次运动
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered size="small" className="metric-card">
                  <div className="metric-label">消耗热量</div>
                  <div className="metric-value" style={{ color: '#52c41a' }}>
                    {exercise.summary.summary.totalCalories}
                    <span style={{ fontSize: 14, marginLeft: 4 }}>kcal</span>
                  </div>
                  <div className="metric-label" style={{ marginTop: 4, fontSize: 12 }}>
                    活动天数: {exercise.summary.summary.activeDays} 天
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered size="small" className="metric-card">
                  <div className="metric-label">平均时长</div>
                  <div className="metric-value" style={{ color: '#faad14' }}>
                    {exercise.summary.summary.avgDurationPerSession}
                    <span style={{ fontSize: 14, marginLeft: 4 }}>分钟/次</span>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered size="small" className="metric-card">
                  <div className="metric-label">平均消耗</div>
                  <div className="metric-value" style={{ color: '#ff4d4f' }}>
                    {exercise.summary.summary.avgCaloriesPerSession}
                    <span style={{ fontSize: 14, marginLeft: 4 }}>kcal/次</span>
                  </div>
                </Card>
              </Col>
            </Row>

            {exercise.summary.typeBreakdown && exercise.summary.typeBreakdown.length > 0 && (
              <>
                <Divider />
                <h4 style={{ marginBottom: 12 }}>运动类型统计：</h4>
                <Row gutter={[16, 16]}>
                  {exercise.summary.typeBreakdown.map((type: any, index: number) => (
                    <Col xs={24} sm={8} key={index}>
                      <Card size="small">
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                            {type.type}
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <Tag color="blue">{type.count} 次</Tag>
                          </div>
                          <Progress percent={type.percentage} size="small" />
                          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                            平均 {type.avgDuration} 分钟，消耗 {type.avgCalories} kcal
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {exercise.summary.intensityBreakdown && exercise.summary.intensityBreakdown.length > 0 && (
              <>
                <Divider />
                <h4 style={{ marginBottom: 12 }}>运动强度分布：</h4>
                <Row gutter={[16, 16]}>
                  {exercise.summary.intensityBreakdown.map((intensity: any, index: number) => (
                    <Col xs={24} sm={8} key={index}>
                      <Card size="small">
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ 
                            fontSize: 16, 
                            fontWeight: 600, 
                            marginBottom: 4,
                            color: getIntensityColor(intensity.intensityKey)
                          }}>
                            {intensity.intensity}
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <Tag color={getIntensityColor(intensity.intensityKey)}>
                              {intensity.count} 次
                            </Tag>
                          </div>
                          <Progress 
                            percent={intensity.percentage} 
                            size="small"
                            strokeColor={getIntensityColor(intensity.intensityKey)}
                          />
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </Card>

          {exercise.recent && exercise.recent.length > 0 && (
            <Card 
              title={<span className="card-title"><ClockCircleOutlined style={{ marginRight: 8 }} />最近运动记录</span>}
              style={{ marginTop: 16 }}
            >
              <Table
                dataSource={exercise.recent}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="small"
              >
                <Table.Column title="日期" dataIndex="date" key="date" />
                <Table.Column title="运动类型" dataIndex="type" key="type" />
                <Table.Column 
                  title="强度" 
                  key="intensity"
                  render={(_: any, record: any) => (
                    <Tag color={getIntensityColor(record.intensity)}>
                      {getIntensityText(record.intensity)}
                    </Tag>
                  )}
                />
                <Table.Column 
                  title="时长" 
                  key="duration"
                  render={(_: any, record: any) => (
                    <span>{record.duration} 分钟</span>
                  )}
                />
                <Table.Column 
                  title="消耗热量" 
                  key="caloriesBurned"
                  render={(_: any, record: any) => (
                    <span style={{ color: '#52c41a' }}>{record.caloriesBurned} kcal</span>
                  )}
                />
              </Table>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <Empty description="暂无运动记录数据" />
        </Card>
      )}
    </div>
  );

  const renderSleep = () => (
    <div>
      {sleep.summary ? (
        <>
          <Card title={<span className="card-title"><MoonOutlined style={{ marginRight: 8 }} />睡眠统计（近7天）</span>}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered size="small" className="metric-card">
                  <div className="metric-label">平均睡眠时长</div>
                  <div className="metric-value" style={{ color: '#1890ff' }}>
                    {sleep.summary.summary.avgDurationHours}
                    <span style={{ fontSize: 14, marginLeft: 4 }}>小时</span>
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                      {sleep.summary.summary.avgDurationMinutes}分
                    </span>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered size="small" className="metric-card">
                  <div className="metric-label">整体睡眠质量</div>
                  <div className="metric-value" style={{ 
                    color: sleep.summary.summary.overallQuality === 'excellent' ? '#52c41a' :
                           sleep.summary.summary.overallQuality === 'good' ? '#1890ff' :
                           sleep.summary.summary.overallQuality === 'fair' ? '#faad14' : '#ff4d4f'
                  }}>
                    {sleep.summary.summary.overallQualityText}
                  </div>
                  <div className="metric-label" style={{ marginTop: 4, fontSize: 12 }}>
                    记录天数: {sleep.summary.summary.nightsRecorded} 天
                  </div>
                </Card>
              </Col>
            </Row>

            {sleep.summary.qualityBreakdown && sleep.summary.qualityBreakdown.length > 0 && (
              <>
                <Divider />
                <h4 style={{ marginBottom: 12 }}>睡眠质量分布：</h4>
                <Row gutter={[16, 16]}>
                  {sleep.summary.qualityBreakdown.map((quality: any, index: number) => (
                    <Col xs={24} sm={6} key={index}>
                      <Card size="small">
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                            {quality.qualityText}
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <Tag color={
                              quality.quality === 'excellent' ? 'green' :
                              quality.quality === 'good' ? 'blue' :
                              quality.quality === 'fair' ? 'orange' : 'red'
                            }>
                              {quality.count} 天
                            </Tag>
                          </div>
                          <Progress percent={quality.percentage} size="small" />
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {sleep.summary.latest && (
              <>
                <Divider />
                <h4 style={{ marginBottom: 12 }}>最近一次睡眠：</h4>
                <Card size="small">
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="日期">{sleep.summary.latest.date}</Descriptions.Item>
                    <Descriptions.Item label="质量">
                      <Tag color={
                        sleep.summary.latest.quality === 'excellent' ? 'green' :
                        sleep.summary.latest.quality === 'good' ? 'blue' :
                        sleep.summary.latest.quality === 'fair' ? 'orange' : 'red'
                      }>
                        {sleep.summary.latest.qualityText}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="睡眠时长">{sleep.summary.latest.duration} 小时</Descriptions.Item>
                    <Descriptions.Item label="作息时间">
                      {sleep.summary.latest.bedTime} - {sleep.summary.latest.wakeUpTime}
                    </Descriptions.Item>
                    <Descriptions.Item label="备注" span={2}>
                      {sleep.summary.latest.notes || '无'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </>
            )}
          </Card>

          {sleep.recent && sleep.recent.length > 0 && (
            <Card 
              title={<span className="card-title"><ClockCircleOutlined style={{ marginRight: 8 }} />睡眠历史记录</span>}
              style={{ marginTop: 16 }}
            >
              <Table
                dataSource={sleep.recent}
                rowKey="id"
                pagination={{ pageSize: 7 }}
                size="small"
              >
                <Table.Column title="日期" dataIndex="date" key="date" />
                <Table.Column 
                  title="睡眠时长" 
                  key="duration"
                  render={(_: any, record: any) => (
                    <span>{record.duration} 小时</span>
                  )}
                />
                <Table.Column 
                  title="质量" 
                  key="quality"
                  render={(_: any, record: any) => (
                    <Tag color={
                      record.quality === 'excellent' ? 'green' :
                      record.quality === 'good' ? 'blue' :
                      record.quality === 'fair' ? 'orange' : 'red'
                    }>
                      {getSleepQualityText(record.quality)}
                    </Tag>
                  )}
                />
                <Table.Column title="入睡时间" dataIndex="bedTime" key="bedTime" />
                <Table.Column title="起床时间" dataIndex="wakeUpTime" key="wakeUpTime" />
              </Table>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <Empty description="暂无睡眠记录数据" />
        </Card>
      )}
    </div>
  );

  const renderPlans = () => (
    <div>
      {rehabilitationPlans && rehabilitationPlans.length > 0 ? (
        rehabilitationPlans.map((plan, index) => (
          <Card 
            key={plan.id}
            title={
              <span className="card-title">
                <ScheduleOutlined style={{ marginRight: 8 }} />
                {plan.title}
                <Tag color={getPlanStatusColor(plan.status)} style={{ marginLeft: 8 }}>
                  {getPlanStatusText(plan.status)}
                </Tag>
              </span>
            }
            style={{ marginBottom: 16 }}
            extra={
              <Button 
                type="link" 
                onClick={() => navigate('/plans')}
              >
                查看详情
              </Button>
            }
          >
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="创建人">{plan.createdBy}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(plan.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="开始日期">{plan.startDate}</Descriptions.Item>
              <Descriptions.Item label="结束日期">{plan.endDate}</Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {plan.description}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div>
              <h4 style={{ marginBottom: 12 }}>康复目标：</h4>
              <List
                bordered
                dataSource={plan.goals}
                renderItem={(goal, goalIndex) => (
                  <List.Item>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8, marginTop: 4 }} />
                      <span>{goal}</span>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </Card>
        ))
      ) : (
        <Card>
          <Empty description="暂无康复计划">
            <Button type="primary" onClick={() => navigate('/plans')}>
              创建康复计划
            </Button>
          </Empty>
        </Card>
      )}
    </div>
  );

  const tabItems = [
    {
      key: 'basic',
      label: (
        <span>
          <UserOutlined style={{ marginRight: 4 }} />
          基本信息
        </span>
      ),
      children: renderBasicInfo()
    },
    {
      key: 'health',
      label: (
        <span>
          <HeartOutlined style={{ marginRight: 4 }} />
          健康指标
        </span>
      ),
      children: renderHealthMetrics()
    },
    {
      key: 'diet',
      label: (
        <span>
          <CoffeeOutlined style={{ marginRight: 4 }} />
          饮食记录
        </span>
      ),
      children: renderDiet()
    },
    {
      key: 'exercise',
      label: (
        <span>
          <FireOutlined style={{ marginRight: 4 }} />
          运动记录
        </span>
      ),
      children: renderExercise()
    },
    {
      key: 'sleep',
      label: (
        <span>
          <MoonOutlined style={{ marginRight: 4 }} />
          睡眠记录
        </span>
      ),
      children: renderSleep()
    },
    {
      key: 'plans',
      label: (
        <span>
          <ScheduleOutlined style={{ marginRight: 4 }} />
          康复计划
        </span>
      ),
      children: renderPlans()
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/patients')}
          style={{ marginBottom: 16 }}
        >
          返回患者列表
        </Button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title" style={{ margin: 0 }}>
            患者详情 - {patient.name}
          </h1>
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate('/patients')}
            >
              编辑信息
            </Button>
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              onClick={() => navigate(`/reports/${patient.id}`)}
            >
              生成报告
            </Button>
          </Space>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={24}>
          <Card>
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              items={tabItems}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PatientDetail;
