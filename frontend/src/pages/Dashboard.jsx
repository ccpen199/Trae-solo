import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Steps, Typography } from 'antd';
import {
  DashboardOutlined,
  CarryOutOutlined,
  ContainerOutlined,
  AppstoreOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { dashboardAPI, vesselPlansAPI, tasksAPI, exceptionsAPI } from '../utils/api';
import { 
  getStatusLabel, 
  getStatusColor, 
  WORKFLOW_NODES,
  STATUS_MAP 
} from '../utils/constants';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [recentPlans, setRecentPlans] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [pendingExceptions, setPendingExceptions] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, plansRes, tasksRes, exceptionsRes] = await Promise.all([
        dashboardAPI.getSummary(),
        vesselPlansAPI.getAll({}),
        tasksAPI.getAll({ status: 'PENDING' }),
        exceptionsAPI.getPending(),
      ]);

      if (summaryRes.data.success) {
        setSummary(summaryRes.data.data);
      }
      if (plansRes.data.success) {
        setRecentPlans(plansRes.data.data.slice(0, 5));
      }
      if (tasksRes.data.success) {
        setPendingTasks(tasksRes.data.data.slice(0, 5));
      }
      if (exceptionsRes.data.success) {
        setPendingExceptions(exceptionsRes.data.data.slice(0, 5));
      }
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const planColumns = [
    {
      title: '计划编号',
      dataIndex: 'plan_no',
      key: 'plan_no',
      render: (text, record) => (
        <a onClick={() => navigate(`/vessel-plans/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '船名',
      dataIndex: 'vessel_name',
      key: 'vessel_name',
    },
    {
      title: '航次号',
      dataIndex: 'voyage_no',
      key: 'voyage_no',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
  ];

  const taskColumns = [
    {
      title: '任务编号',
      dataIndex: 'task_no',
      key: 'task_no',
      render: (text, record) => (
        <a onClick={() => navigate(`/tasks/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '任务类型',
      dataIndex: 'task_type',
      key: 'task_type',
      render: (type) => {
        const typeMap = {
          LOADING: '装卸作业',
          UNLOADING: '卸船作业',
          YARD_MOVE: '堆场移箱',
          GATE_IN: '闸口进场',
          GATE_OUT: '闸口出场',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const colorMap = {
          LOW: 'default',
          NORMAL: 'blue',
          HIGH: 'orange',
          URGENT: 'red',
        };
        const labelMap = {
          LOW: '低',
          NORMAL: '普通',
          HIGH: '高',
          URGENT: '紧急',
        };
        return <Tag color={colorMap[priority]}>{labelMap[priority] || priority}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
    },
  ];

  const exceptionColumns = [
    {
      title: '异常类型',
      dataIndex: 'exception_type',
      key: 'exception_type',
      render: (type) => {
        const typeMap = {
          LOCATION_DRIFT: '定位漂移',
          ROUTE_DEVIATION: '路线偏离',
          DRIVER_REJECT: '司机拒接',
          ARRIVAL_UNCONFIRMED: '到达未确认',
          MAP_CALLBACK_DELAY: '地图回调延迟',
        };
        return <Tag color="red">{typeMap[type] || type}</Tag>;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>仪表盘</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="船舶计划"
              value={summary?.vessel_plans?.length || 0}
              prefix={<CarryOutOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="集装箱数量"
              value={summary?.containers?.reduce((acc, item) => acc + item.count, 0) || 0}
              prefix={<ContainerOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待处理任务"
              value={summary?.tasks?.find(t => t.status === 'PENDING')?.count || 0}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待处理异常"
              value={summary?.pending_exceptions || 0}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="业务流程节点" extra={<a onClick={() => navigate('/vessel-plans')}>查看全部</a>}>
            <Steps
              direction="vertical"
              current={2}
              items={WORKFLOW_NODES.map((node, index) => ({
                title: node.label,
                description: node.description,
                status: index <= 2 ? 'finish' : 'wait',
              }))}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="堆场占用情况" extra={<a onClick={() => navigate('/yard')}>查看全部</a>}>
            {summary?.yard && (
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Statistic
                    title="总位置数"
                    value={summary.yard.total}
                    prefix={<AppstoreOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="已占用"
                    value={summary.yard.occupied}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="可用"
                    value={summary.yard.available}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
              </Row>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card 
            title="最近船舶计划" 
            extra={<a onClick={() => navigate('/vessel-plans')}>查看全部</a>}
          >
            <Table
              columns={planColumns}
              dataSource={recentPlans}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card 
            title="待处理任务" 
            extra={<a onClick={() => navigate('/tasks')}>查看全部</a>}
          >
            <Table
              columns={taskColumns}
              dataSource={pendingTasks}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title="待处理异常" 
            extra={<a onClick={() => navigate('/exceptions')}>查看全部</a>}
          >
            <Table
              columns={exceptionColumns}
              dataSource={pendingExceptions}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
