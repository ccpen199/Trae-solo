import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Spin,
  Descriptions,
  Modal,
  Select,
  DatePicker,
  message,
  Space,
} from 'antd';
import {
  DollarOutlined,
  PayCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../utils/api';
import { useAuth } from '../store/auth';

const { RangePicker } = DatePicker;

const ROLES = {
  ADMIN: 'ADMIN',
  CASHIER: 'CASHIER',
  FINANCIAL_MANAGER: 'FINANCIAL_MANAGER',
  CFO: 'CFO',
  AUDITOR: 'AUDITOR',
};

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [detailAccount, setDetailAccount] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [reconModalVisible, setReconModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const { user } = useAuth();

  const canSync = [ROLES.CASHIER, ROLES.FINANCIAL_MANAGER, ROLES.ADMIN].includes(user?.role || '');
  const canReconcile = [ROLES.FINANCIAL_MANAGER, ROLES.CFO, ROLES.ADMIN].includes(user?.role || '');

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, accountsRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/accounts'),
      ]);
      if (summaryRes.success) {
        setSummary(summaryRes.data);
      }
      if (accountsRes.success) {
        setAccounts(accountsRes.data.accounts || []);
        if (accountsRes.data.accounts?.length > 0 && !selectedAccount) {
          setSelectedAccount(accountsRes.data.accounts[0].id);
        }
      }
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncAll = async () => {
    if (accounts.length === 0) {
      message.warning('没有可同步的账户');
      return;
    }
    setSyncing(true);
    try {
      let successCount = 0;
      for (const account of accounts) {
        try {
          const res = await api.post(`/accounts/${account.id}/sync`);
          if (res.success) {
            successCount++;
          }
        } catch (e) {
          console.error('Sync error:', e);
        }
      }
      message.success(`同步完成，成功 ${successCount}/${accounts.length} 个账户`);
      loadData();
    } catch (error) {
      console.error('Sync all error:', error);
      message.error('同步失败');
    } finally {
      setSyncing(false);
    }
  };

  const handleRunRecon = async () => {
    if (!selectedAccount) {
      message.warning('请选择要对账的账户');
      return;
    }

    const startDate = dateRange ? dateRange[0].subtract(7, 'day').toDate() : new Date(Date.now() - 7 * 86400000);
    const endDate = dateRange ? dateRange[1].toDate() : new Date();

    setReconciling(true);
    try {
      const res = await api.post('/reconciliation/run', {
        bankAccountId: selectedAccount,
        startDate,
        endDate,
      });

      if (res.success) {
        message.success(
          `对账完成！匹配: ${res.data.matchedCount}, 未匹配: ${res.data.unmatchedCount}, 异常: ${res.data.exceptionCount}`
        );
        if (res.data.exceptionCount > 0) {
          message.warning(`检测到 ${res.data.exceptionCount} 个异常项，请财务经理检查对账管理页面`);
        }
        setReconModalVisible(false);
        loadData();
      }
    } catch (error: any) {
      console.error('Reconcile error:', error);
      message.error(error.response?.data?.error || '对账失败');
    } finally {
      setReconciling(false);
    }
  };

  const handleViewAccountDetail = (account: any) => {
    setDetailAccount(account);
    setDetailModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'success',
      HAS_EXCEPTIONS: 'warning',
      FAILED: 'error',
      IN_PROGRESS: 'processing',
      PENDING: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      COMPLETED: '已完成',
      HAS_EXCEPTIONS: '有异常',
      FAILED: '失败',
      IN_PROGRESS: '进行中',
      PENDING: '待处理',
    };
    return texts[status] || status;
  };

  const columns = [
    {
      title: '对账编号',
      dataIndex: 'reconNumber',
      key: 'reconNumber',
    },
    {
      title: '对账日期',
      dataIndex: 'reconDate',
      key: 'reconDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '匹配数',
      dataIndex: 'matchedCount',
      key: 'matchedCount',
      render: (count: number) => (
        <Tag icon={<CheckCircleOutlined />} color="success">
          {count}
        </Tag>
      ),
    },
    {
      title: '未匹配',
      dataIndex: 'unmatchedCount',
      key: 'unmatchedCount',
      render: (count: number) => (
        <Tag icon={<WarningOutlined />} color="warning">
          {count}
        </Tag>
      ),
    },
    {
      title: '异常数',
      dataIndex: 'exceptionCount',
      key: 'exceptionCount',
      render: (count: number) => (
        <Tag icon={<ExclamationCircleOutlined />} color={count > 0 ? 'error' : 'default'}>
          {count}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
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

  return (
    <div>
      <div className="page-header">
        <h2>资金看板</h2>
        <p>实时监控集团资金状况，掌握最新余额时点</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="总余额"
              value={summary?.cashPosition?.totalBalance || 0}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="¥"
            />
            {summary?.cashPosition?.lastUpdated && (
              <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
                最后更新: {new Date(summary.cashPosition.lastUpdated).toLocaleString()}
              </div>
            )}
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card positive">
            <Statistic
              title="可用余额"
              value={summary?.cashPosition?.totalAvailable || 0}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
              账户数: {summary?.cashPosition?.accountCount || 0} 个
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="今日交易"
              value={summary?.activities?.todayTransactions || 0}
              prefix={<SyncOutlined />}
            />
            <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
              今日流水记录
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="待处理"
              value={(summary?.activities?.pendingPayments || 0) + (summary?.activities?.pendingExceptions || 0)}
              suffix="项"
              prefix={<PayCircleOutlined />}
            />
            {summary?.activities?.pendingExceptions > 0 && (
              <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 8 }}>
                <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                异常项: {summary.activities.pendingExceptions} 项
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title="银行账户列表"
            extra={
              <Space>
                {canSync && (
                  <Button
                    type="primary"
                    icon={<SyncOutlined spin={syncing} />}
                    onClick={handleSyncAll}
                    loading={syncing}
                  >
                    同步所有账户
                  </Button>
                )}
                {canReconcile && (
                  <Button
                    icon={<CheckCircleOutlined />}
                    onClick={() => setReconModalVisible(true)}
                  >
                    执行对账
                  </Button>
                )}
                <Button icon={<ReloadOutlined />} onClick={loadData}>
                  刷新数据
                </Button>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              {accounts.map((account: any) => (
                <Col span={8} key={account.id}>
                  <Card
                    className="account-card"
                    hoverable
                    onClick={() => handleViewAccountDetail(account)}
                  >
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="账户名称">{account.accountName}</Descriptions.Item>
                      <Descriptions.Item label="银行">{account.bankName}</Descriptions.Item>
                      <Descriptions.Item label="账号">
                        {`${account.accountNumber.slice(0, 4)}****${account.accountNumber.slice(-4)}`}
                      </Descriptions.Item>
                    </Descriptions>
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div className="label">当前余额</div>
                          <div className="balance">¥{Number(account.currentBalance).toLocaleString()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="label">可用余额</div>
                          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#52c41a' }}>
                            ¥{Number(account.availableBalance).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {account.lastSyncTime && (
                        <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                          最后同步: {new Date(account.lastSyncTime).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="最近对账记录">
            <Table
              columns={columns}
              dataSource={summary?.recentReconciliations || []}
              rowKey="id"
              pagination={false}
              locale={{ emptyText: '暂无对账记录，请点击"执行对账"开始' }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="账户详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {detailAccount && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="账户名称">{detailAccount.accountName}</Descriptions.Item>
            <Descriptions.Item label="银行">{detailAccount.bankName}</Descriptions.Item>
            <Descriptions.Item label="账号">{detailAccount.accountNumber}</Descriptions.Item>
            <Descriptions.Item label="币种">{detailAccount.currency}</Descriptions.Item>
            <Descriptions.Item label="当前余额">
              ¥{Number(detailAccount.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Descriptions.Item>
            <Descriptions.Item label="可用余额">
              ¥{Number(detailAccount.availableBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Descriptions.Item>
            <Descriptions.Item label="最后同步时间">
              {detailAccount.lastSyncTime
                ? new Date(detailAccount.lastSyncTime).toLocaleString()
                : '未同步'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="执行对账"
        open={reconModalVisible}
        onCancel={() => setReconModalVisible(false)}
        footer={
          <Space>
            <Button onClick={() => setReconModalVisible(false)}>取消</Button>
            <Button
              type="primary"
              onClick={handleRunRecon}
              loading={reconciling}
            >
              开始对账
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            选择账户
          </label>
          <Select
            style={{ width: '100%' }}
            placeholder="请选择要对账的账户"
            value={selectedAccount}
            onChange={setSelectedAccount}
          >
            {accounts.map((a) => (
              <Select.Option key={a.id} value={a.id}>
                {a.accountName} ({a.bankName})
              </Select.Option>
            ))}
          </Select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            对账日期范围 (可选，默认最近7天)
          </label>
          <RangePicker
            style={{ width: '100%' }}
            value={dateRange}
            onChange={(val) => setDateRange(val as [dayjs.Dayjs, dayjs.Dayjs])}
          />
        </div>
        <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
          <h4 style={{ marginBottom: 8 }}>对账说明</h4>
          <ul style={{ margin: 0, paddingLeft: 16, color: '#666', lineHeight: 1.8 }}>
            <li>系统将自动匹配银行流水与ERP单据</li>
            <li>检测到异常项将生成异常报告推送给财务经理</li>
            <li>未匹配项需人工核查处理</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
