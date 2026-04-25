import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Button, Table, Tag, Space, Spin, message, Empty,
  Modal, Form, Input, Select, DatePicker, Popconfirm,
  Row, Col, Statistic, Divider, List, Progress, Descriptions
} from 'antd';
import {
  PlusOutlined, ArrowLeftOutlined, EyeOutlined, EditOutlined,
  DeleteOutlined, PauseOutlined, CheckCircleOutlined, FileTextOutlined,
  UserOutlined, CalendarOutlined, ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { RehabilitationPlan, Patient } from '../types';
import { planApi, patientApi } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface PlanProgress {
  plan: RehabilitationPlan;
  progressPercentage: number;
  dietProgress: number;
  exerciseProgress: number;
  sleepProgress: number;
  goalProgress: { goal: string; completed: boolean; progress: number }[];
}

const PlanManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<RehabilitationPlan[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<RehabilitationPlan | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<RehabilitationPlan | null>(null);
  const [planProgress, setPlanProgress] = useState<PlanProgress | null>(null);
  const [filterPatient, setFilterPatient] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
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
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (plan: RehabilitationPlan) => {
    setEditingPlan(plan);
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

  const handleGenerateTemplate = async (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    try {
      const template = await planApi.generateTemplate(patientId, patient.condition);
      const endDate = dayjs().add(template.suggestedDuration, 'day');
      
      form.setFieldsValue({
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
      const { patientId, title, description, dateRange, goals } = values;
      const goalsArray = goals ? goals.split('\n').filter((g: string) => g.trim()) : [];
      
      const planData = {
        patientId,
        title,
        description: description || '',
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        goals: goalsArray,
        createdBy: '医生'
      };

      if (editingPlan) {
        await planApi.update(editingPlan.id, {
          title,
          description: description || '',
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD'),
          goals: goalsArray
        });
        message.success('更新成功');
      } else {
        await planApi.create(planData);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error(editingPlan ? '更新失败' : '创建失败');
    }
  };

  const filteredPlans = plans.filter(plan => {
    const patientMatch = filterPatient === 'all' || plan.patientId === filterPatient;
    const statusMatch = filterStatus === 'all' || plan.status === filterStatus;
    return patientMatch && statusMatch;
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
          <Col xs={24} sm={8}>
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
          <Col xs={24} sm={8}>
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
          <Col xs={24} sm={8}>
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
        title={editingPlan ? '编辑康复计划' : '新建康复计划'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 24 }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="patientId"
                label="选择患者"
                rules={[{ required: true, message: '请选择患者' }]}
              >
                <Select 
                  placeholder="请选择患者"
                  onChange={handleGenerateTemplate}
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
            name="title"
            label="计划标题"
            rules={[{ required: true, message: '请输入计划标题' }]}
          >
            <Input placeholder="请输入计划标题" />
          </Form.Item>

          <Form.Item
            name="description"
            label="计划描述"
          >
            <TextArea rows={3} placeholder="请输入计划描述" />
          </Form.Item>

          <Form.Item
            name="goals"
            label="康复目标"
            help="每行一个目标"
          >
            <TextArea 
              rows={5} 
              placeholder="请输入康复目标，每行一个目标&#10;例如：&#10;控制血压在正常范围内&#10;改善生活质量&#10;提高运动能力"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setModalVisible(false)} style={{ marginRight: 8 }}>
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
        width={800}
      >
        {selectedPlan && (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="患者">
                <Button type="link" onClick={() => navigate(`/patients/${selectedPlan.patientId}`)}>
                  {getPatientName(selectedPlan.patientId)}
                </Button>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(selectedPlan.status)}>
                  {getStatusText(selectedPlan.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="开始日期">{selectedPlan.startDate}</Descriptions.Item>
              <Descriptions.Item label="结束日期">{selectedPlan.endDate}</Descriptions.Item>
              <Descriptions.Item label="创建人">{selectedPlan.createdBy}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(selectedPlan.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div>
              <h4 style={{ marginBottom: 12 }}>计划描述：</h4>
              <Card size="small" style={{ background: '#fafafa', marginBottom: 16 }}>
                {selectedPlan.description || '暂无描述'}
              </Card>
            </div>

            <Divider />

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

            {planProgress && (
              <>
                <Divider />
                
                <div>
                  <h4 style={{ marginBottom: 12 }}>计划进度：</h4>
                  <Card size="small">
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>整体进度</span>
                        <span>{planProgress.progressPercentage}%</span>
                      </div>
                      <Progress 
                        percent={planProgress.progressPercentage} 
                        status={planProgress.progressPercentage >= 100 ? 'success' : 'active'}
                      />
                    </div>

                    <Row gutter={16}>
                      <Col xs={24} sm={8}>
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span>饮食管理</span>
                            <span>{planProgress.dietProgress}%</span>
                          </div>
                          <Progress percent={planProgress.dietProgress} size="small" />
                        </div>
                      </Col>
                      <Col xs={24} sm={8}>
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span>运动康复</span>
                            <span>{planProgress.exerciseProgress}%</span>
                          </div>
                          <Progress percent={planProgress.exerciseProgress} size="small" />
                        </div>
                      </Col>
                      <Col xs={24} sm={8}>
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span>睡眠管理</span>
                            <span>{planProgress.sleepProgress}%</span>
                          </div>
                          <Progress percent={planProgress.sleepProgress} size="small" />
                        </div>
                      </Col>
                    </Row>

                    <Divider style={{ margin: '16px 0' }} />

                    <div>
                      <h5 style={{ marginBottom: 12 }}>目标完成情况：</h5>
                      {planProgress.goalProgress.map((item, index) => (
                        <div key={index} style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              {item.completed ? (
                                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                              ) : (
                                <span style={{ marginRight: 8 }}>•</span>
                              )}
                              <span style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#8c8c8c' : 'inherit' }}>
                                {item.goal}
                              </span>
                            </div>
                            <span style={{ color: item.completed ? '#52c41a' : '#1890ff' }}>
                              {item.progress}%
                            </span>
                          </div>
                          <Progress 
                            percent={item.progress} 
                            size="small"
                            strokeColor={item.completed ? '#52c41a' : '#1890ff'}
                          />
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PlanManagement;
