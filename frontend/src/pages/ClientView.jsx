import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Tag, Select, Row, Col, Statistic, Steps, Button, Modal, Form, Input, message, Tabs, Space } from 'antd';
import { ProjectOutlined, UserOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { projectApi, positionApi, candidateApi, clientApi } from '../services/api';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';

const { Title } = Typography;
const { Option } = Select;
const { Step } = Steps;
const { TabPane } = Tabs;

const STAGES = [
  { key: 'screening', name: '简历筛选' },
  { key: 'phone_interview', name: '电话沟通' },
  { key: 'client_recommend', name: '推荐客户' },
  { key: 'interview', name: '面试' },
  { key: 'offer', name: 'Offer' },
  { key: 'onboard', name: '入职' }
];

const ClientView = () => {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [applications, setApplications] = useState([]);
  const [funnelData, setFunnelData] = useState({});
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportForm] = Form.useForm();

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadProjects(selectedClient);
    }
  }, [selectedClient]);

  useEffect(() => {
    if (selectedProject) {
      loadPositions(selectedProject);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedPosition) {
      loadApplications(selectedPosition);
    }
  }, [selectedPosition]);

  const loadClients = async () => {
    try {
      const response = await clientApi.list();
      setClients(response.data);
      if (response.data.length > 0) {
        setSelectedClient(response.data[0].id);
      }
    } catch (error) {
      message.error('加载客户列表失败');
    }
  };

  const loadProjects = async (clientId) => {
    try {
      const response = await projectApi.list();
      const clientProjects = response.data.filter(p => p.client_id === clientId);
      setProjects(clientProjects);
      if (clientProjects.length > 0) {
        setSelectedProject(clientProjects[0].id);
      }
    } catch (error) {
      message.error('加载项目列表失败');
    }
  };

  const loadPositions = async (projectId) => {
    try {
      const response = await positionApi.list();
      const projectPositions = response.data.filter(p => p.project_id === projectId);
      setPositions(projectPositions);
      if (projectPositions.length > 0) {
        setSelectedPosition(projectPositions[0].id);
      }
    } catch (error) {
      message.error('加载岗位列表失败');
    }
  };

  const loadApplications = async (positionId) => {
    try {
      const response = await candidateApi.getApplications(positionId);
      setApplications(response.data);
    } catch (error) {
      message.error('加载应聘记录失败');
    }
  };

  const getStageStatus = (stage) => {
    const count = applications.filter(a => a.current_stage === stage).length;
    return count;
  };

  const getFunnelChartOption = () => {
    const data = STAGES.map(stage => ({
      value: getStageStatus(stage.key),
      name: stage.name
    }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}人'
      },
      series: [
        {
          name: '招聘漏斗',
          type: 'funnel',
          left: '10%',
          width: '80%',
          label: {
            show: true,
            position: 'inside'
          },
          data
        }
      ]
    };
  };

  const positionColumns = [
    {
      title: '岗位名称',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '招聘人数',
      dataIndex: 'headcount',
      key: 'headcount'
    },
    {
      title: '已入职',
      key: 'onboarded',
      render: (_, record) => {
        const onboarded = applications.filter(
          a => a.position_id === record.id && a.current_stage === 'onboard'
        ).length;
        return <Tag color="green">{onboarded}人</Tag>;
      }
    },
    {
      title: '进行中',
      key: 'in_progress',
      render: (_, record) => {
        const inProgress = applications.filter(
          a => a.position_id === record.id && 
          a.current_stage !== 'onboard' && 
          a.current_stage !== 'eliminated'
        ).length;
        return <Tag color="blue">{inProgress}人</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          open: { color: 'green', text: '招聘中' },
          paused: { color: 'orange', text: '暂停' },
          closed: { color: 'default', text: '已关闭' }
        };
        const config = statusMap[status] || statusMap.open;
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    }
  ];

  const applicationColumns = [
    {
      title: '候选人姓名',
      dataIndex: 'candidate_name',
      key: 'candidate_name'
    },
    {
      title: '当前阶段',
      dataIndex: 'current_stage',
      key: 'current_stage',
      render: (stage) => {
        const stageMap = {
          screening: '简历筛选',
          phone_interview: '电话沟通',
          client_recommend: '推荐客户',
          interview: '面试',
          offer: 'Offer',
          onboard: '入职',
          eliminated: '已淘汰'
        };
        return <Tag>{stageMap[stage] || stage}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'stage_status',
      key: 'stage_status',
      render: (status) => (
        <Tag color={status === 'pending' ? 'orange' : 'green'}>
          {status === 'pending' ? '进行中' : '已完成'}
        </Tag>
      )
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    }
  ];

  const stats = {
    totalPositions: positions.length,
    activePositions: positions.filter(p => p.status === 'open').length,
    totalCandidates: applications.length,
    onboarded: applications.filter(a => a.current_stage === 'onboard').length
  };

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>客户招聘视图</Title>
        <Space>
          <Select
            style={{ width: 200 }}
            placeholder="选择客户"
            value={selectedClient}
            onChange={setSelectedClient}
          >
            {clients.map(client => (
              <Option key={client.id} value={client.id}>{client.name}</Option>
            ))}
          </Select>
          <Select
            style={{ width: 200 }}
            placeholder="选择项目"
            value={selectedProject}
            onChange={setSelectedProject}
            disabled={!selectedClient}
          >
            {projects.map(project => (
              <Option key={project.id} value={project.id}>{project.name}</Option>
            ))}
          </Select>
        </Space>
      </div>

      <Tabs defaultActiveKey="1">
        <TabPane tab="数据总览" key="1">
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card className="card-shadow">
                <Statistic
                  title="岗位总数"
                  value={stats.totalPositions}
                  prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="card-shadow">
                <Statistic
                  title="招聘中"
                  value={stats.activePositions}
                  prefix={<ProjectOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="card-shadow">
                <Statistic
                  title="候选人总数"
                  value={stats.totalCandidates}
                  prefix={<UserOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="card-shadow">
                <Statistic
                  title="已入职"
                  value={stats.onboarded}
                  prefix={<CheckCircleOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={8}>
              <Card title="招聘漏斗" className="card-shadow">
                <ReactECharts
                  option={getFunnelChartOption()}
                  style={{ height: '350px' }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={16}>
              <Card title="阶段进度" className="card-shadow">
                <Steps direction="vertical" current={-1}>
                  {STAGES.map((stage, index) => {
                    const count = getStageStatus(stage.key);
                    return (
                      <Step
                        key={stage.key}
                        title={
                          <Space>
                            <span>{stage.name}</span>
                            <Tag color={count > 0 ? 'blue' : 'default'}>{count}人</Tag>
                          </Space>
                        }
                        description={count > 0 ? `当前有 ${count} 人在此阶段` : '暂无候选人'}
                        status={count > 0 ? 'process' : 'wait'}
                      />
                    );
                  })}
                </Steps>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="岗位列表" key="2">
          <Card title="岗位详情" className="card-shadow">
            <Table
              dataSource={positions}
              columns={positionColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              onRow={(record) => ({
                onClick: () => {
                  setSelectedPosition(record.id);
                  loadApplications(record.id);
                }
              })}
            />
          </Card>
        </TabPane>

        <TabPane tab="候选人列表" key="3">
          <Card 
            title="候选人进度" 
            className="card-shadow"
            extra={
              <Select
                style={{ width: 200 }}
                placeholder="选择岗位"
                value={selectedPosition}
                onChange={setSelectedPosition}
              >
                {positions.map(position => (
                  <Option key={position.id} value={position.id}>{position.title}</Option>
                ))}
              </Select>
            }
          >
            <Table
              dataSource={applications}
              columns={applicationColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="周报" key="4">
          <Card 
            title="项目周报" 
            className="card-shadow"
            extra={
              <Button type="primary" onClick={() => setReportModalVisible(true)}>
                提交周报
              </Button>
            }
          >
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#999' }}>
              <ClockCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <p>暂无周报数据</p>
            </div>
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title="提交项目周报"
        open={reportModalVisible}
        onOk={() => {
          message.success('周报提交成功');
          setReportModalVisible(false);
        }}
        onCancel={() => setReportModalVisible(false)}
        width={700}
      >
        <Form form={reportForm} layout="vertical">
          <Form.Item name="week_start" label="周报开始日期">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="new_candidates" label="本周新增候选人">
            <Input type="number" placeholder="请输入人数" />
          </Form.Item>
          <Form.Item name="interviews" label="本周面试人数">
            <Input type="number" placeholder="请输入人数" />
          </Form.Item>
          <Form.Item name="offers" label="本周发Offer数">
            <Input type="number" placeholder="请输入人数" />
          </Form.Item>
          <Form.Item name="onboards" label="本周入职人数">
            <Input type="number" placeholder="请输入人数" />
          </Form.Item>
          <Form.Item name="content" label="本周工作总结">
            <Input.TextArea rows={4} placeholder="请详细描述本周招聘工作情况" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClientView;
