import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Descriptions,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Spin,
} from 'antd';
import { SearchOutlined, EyeOutlined, ReloadOutlined, SafetyOutlined, WarningOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { useAuth } from '../store/auth';

const { Option } = Select;
const { RangePicker } = DatePicker;

const Audit: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const { user } = useAuth();

  const canView = ['AUDITOR', 'CFO', 'ADMIN'].includes(user?.role || '');

  const loadLogs = async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const params: any = {};
      if (searchText) params.keyword = searchText;
      if (selectedModule) params.module = selectedModule;
      if (selectedAction) params.actionType = selectedAction;
      if (selectedUser) params.userId = selectedUser;

      const response: any = await api.get('/audit/logs', { params });
      if (response.success) {
        setLogs(response.data.logs || []);
      }

      const statsResponse: any = await api.get('/audit/stats');
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Load audit logs error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      LOGIN: 'blue',
      LOGOUT: 'default',
      CREATE: 'green',
      UPDATE: 'cyan',
      DELETE: 'red',
      APPROVE: 'green',
      REJECT: 'orange',
      SYNC: 'purple',
      EXECUTE: 'blue',
      OTHER: 'default',
    };
    return colors[action] || 'default';
  };

  const getRiskColor = (risk: string) => {
    const colors: Record<string, string> = {
      LOW: 'success',
      MEDIUM: 'warning',
      HIGH: 'error',
    };
    return colors[risk] || 'default';
  };

  const getModuleText = (module: string) => {
    const texts: Record<string, string> = {
      AUTH: '认证',
      ACCOUNT: '账户',
      TRANSACTION: '交易',
      PAYMENT: '付款',
      APPROVAL: '审批',
      RECONCILIATION: '对账',
      FORECAST: '预测',
      REPORT: '报表',
      SETTINGS: '设置',
      OTHER: '其他',
    };
    return texts[module] || module;
  };

  const getActionText = (action: string) => {
    const texts: Record<string, string> = {
      LOGIN: '登录',
      LOGOUT: '登出',
      CREATE: '创建',
      UPDATE: '更新',
      DELETE: '删除',
      APPROVE: '审批',
      REJECT: '驳回',
      SYNC: '同步',
      EXECUTE: '执行',
      OTHER: '其他',
    };
    return texts[action] || action;
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      SUCCESS: '成功',
      FAILED: '失败',
      WARNING: '警告',
    };
    return texts[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SUCCESS: 'success',
      FAILED: 'error',
      WARNING: 'warning',
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: '操作时间',
      dataIndex: 'actionTime',
      key: 'actionTime',
      render: (time: string) => new Date(time).toLocaleString(),
      width: 180,
    },
    {
      title: '操作人',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => user?.username || '-',
      width: 100,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 100,
      render: (module: string) => <Tag>{getModuleText(module)}</Tag>,
    },
    {
      title: '操作类型',
      dataIndex: 'actionType',
      key: 'actionType',
      width: 100,
      render: (action: string) => (
        <Tag color={getActionColor(action)}>{getActionText(action)}</Tag>
      ),
    },
    {
      title: '操作描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 250,
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (risk: string) => (
        <Tag color={getRiskColor(risk)}>{risk}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
  ];

  if (!canView) {
    return (
      <div className="loading-container">
        <div style={{ textAlign: 'center' }}>
          <SafetyOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
          <h3>无权限访问</h3>
          <p style={{ color: '#999' }}>审计日志仅对管理员、CFO和审计员开放</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>审计日志</h2>
        <p>记录所有系统操作，满足银行级合规及可追溯要求</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日操作数"
              value={stats?.todayCount || 0}
              prefix={<SafetyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本周操作数"
              value={stats?.weekCount || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="警告操作"
              value={stats?.warningCount || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="失败操作"
              value={stats?.failedCount || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadLogs}>
            刷新
          </Button>
        }
        style={{ marginTop: 16 }}
      >
        <div style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={5}>
              <Input
                placeholder="搜索操作描述"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={loadLogs}
                allowClear
              />
            </Col>
            <Col span={4}>
              <Select
                style={{ width: '100%' }}
                placeholder="选择模块"
                value={selectedModule || undefined}
                onChange={setSelectedModule}
                allowClear
              >
                <Option value="AUTH">认证</Option>
                <Option value="ACCOUNT">账户</Option>
                <Option value="TRANSACTION">交易</Option>
                <Option value="PAYMENT">付款</Option>
                <Option value="APPROVAL">审批</Option>
                <Option value="RECONCILIATION">对账</Option>
                <Option value="FORECAST">预测</Option>
                <Option value="SETTINGS">设置</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                style={{ width: '100%' }}
                placeholder="操作类型"
                value={selectedAction || undefined}
                onChange={setSelectedAction}
                allowClear
              >
                <Option value="LOGIN">登录</Option>
                <Option value="LOGOUT">登出</Option>
                <Option value="CREATE">创建</Option>
                <Option value="UPDATE">更新</Option>
                <Option value="DELETE">删除</Option>
                <Option value="APPROVE">审批</Option>
                <Option value="REJECT">驳回</Option>
                <Option value="SYNC">同步</Option>
                <Option value="EXECUTE">执行</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                style={{ width: '100%' }}
                placeholder="风险等级"
                onChange={(val) => val}
                allowClear
              >
                <Option value="LOW">低风险</Option>
                <Option value="MEDIUM">中风险</Option>
                <Option value="HIGH">高风险</Option>
              </Select>
            </Col>
            <Col span={7} style={{ textAlign: 'right' }}>
              <Button type="primary" icon={<SearchOutlined />} onClick={loadLogs}>
                搜索
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Card title="合规说明" style={{ marginTop: 16 }}>
        <Row gutter={[24, 16]}>
          <Col span={12}>
            <h4 style={{ marginBottom: 12 }}>安全审计要求</h4>
            <ul style={{ color: '#666', lineHeight: 2 }}>
              <li>所有登录、登出操作均被记录，包含IP地址和设备信息</li>
              <li>所有数据变更操作（增删改）均记录操作人、时间、变更内容</li>
              <li>资金相关操作自动提升风险等级，重点监控</li>
              <li>审计日志永久保留，不可修改或删除</li>
            </ul>
          </Col>
          <Col span={12}>
            <h4 style={{ marginBottom: 12 }}>操作追溯</h4>
            <ul style={{ color: '#666', lineHeight: 2 }}>
              <li>每笔付款申请可追溯完整审批流程</li>
              <li>每笔银行交易可追溯来源和用途</li>
              <li>所有异常操作实时标记，便于审计</li>
              <li>支持按用户、时间、模块多维度筛选</li>
            </ul>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Audit;
