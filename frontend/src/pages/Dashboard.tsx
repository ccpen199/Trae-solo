import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, Table, Tag, Button, Spin, Empty, message } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  WarningOutlined,
  ArrowRightOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { Patient, RiskAlert } from '../types';
import { patientApi, riskApi } from '../services/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [patientsData, alertsData] = await Promise.all([
        patientApi.getAll(),
        riskApi.getActiveAlerts()
      ]);
      setPatients(patientsData);
      setAlerts(alertsData);
    } catch (error) {
      message.error('获取数据失败');
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

  const getRiskLevelTag = (level: RiskAlert['level']) => {
    const levelMap: Record<string, { color: string; text: string }> = {
      'high': { color: 'red', text: '高危' },
      'medium': { color: 'orange', text: '中危' },
      'low': { color: 'green', text: '低危' }
    };
    const config = levelMap[level] || levelMap['low'];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const patientColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: '诊断',
      dataIndex: 'condition',
      key: 'condition',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: Patient['status']) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Patient) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/patients/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  const alertColumns = [
    {
      title: '风险等级',
      dataIndex: 'level',
      key: 'level',
      render: (level: RiskAlert['level']) => getRiskLevelTag(level),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: RiskAlert['type']) => {
        const typeMap: Record<string, string> = {
          'health': '健康指标',
          'medication': '用药',
          'lifestyle': '生活方式',
          'other': '其他'
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Button type="link" onClick={() => navigate('/alerts')}>
          处理
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  const activePatients = patients.filter(p => p.status === 'active').length;
  const highRiskCount = alerts.filter(a => a.level === 'high').length;

  return (
    <div>
      <h1 className="page-title">仪表盘</h1>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="患者总数"
              value={patients.length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="康复中"
              value={activePatients}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="活跃告警"
              value={alerts.length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="高风险"
              value={highRiskCount}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <span className="card-title">
                <UserOutlined style={{ marginRight: 8 }} />
                患者列表
              </span>
            }
            extra={
              <Button type="link" onClick={() => navigate('/patients')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            }
          >
            {patients.length > 0 ? (
              <Table
                columns={patientColumns}
                dataSource={patients}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="small"
              />
            ) : (
              <Empty description="暂无患者数据" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <span className="card-title">
                <WarningOutlined style={{ marginRight: 8 }} />
                风险告警
              </span>
            }
            extra={
              <Button type="link" onClick={() => navigate('/alerts')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            }
          >
            {alerts.length > 0 ? (
              <Table
                columns={alertColumns}
                dataSource={alerts}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                size="small"
              />
            ) : (
              <Empty description="暂无风险告警" />
            )}
          </Card>

          <Card
            style={{ marginTop: 16 }}
            title={
              <span className="card-title">
                <FileTextOutlined style={{ marginRight: 8 }} />
                快捷操作
              </span>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button
                type="primary"
                block
                icon={<FileTextOutlined />}
                onClick={() => navigate('/reports')}
              >
                生成健康报告
              </Button>
              <Button
                block
                icon={<WarningOutlined />}
                onClick={() => navigate('/alerts')}
              >
                处理风险告警
              </Button>
              <Button
                block
                icon={<UserOutlined />}
                onClick={() => navigate('/patients')}
              >
                管理患者信息
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
