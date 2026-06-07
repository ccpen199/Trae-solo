import { useEffect, useState } from 'react';
import { Card, Descriptions, Button, message, Spin, Table, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import api from '../utils/api';

export default function AccountBalance() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    try {
      setLoading(true);
      const response = await api.get('/account/balance');
      setAccount(response.data);
    } catch (error) {
      message.error('加载账户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await api.post('/account/sync');
      message.success('账户同步成功');
      if (res.data?.cross_center_sync || res.data?.fund_arrivals) {
        message.info('同步已更新跨中心记录和资金到账信息', 3);
      }
      loadAccount();
    } catch (error) {
      message.error('同步失败');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
  }

  const syncStatusTag = (status) => {
    const map = {
      synced: { color: 'green', text: '已同步' },
      conflict: { color: 'red', text: '冲突' },
      pending: { color: 'orange', text: '待同步' }
    };
    const info = map[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const arrivalStatusTag = (status) => {
    const map = {
      arrived: { color: 'green', text: '已到账' },
      pending: { color: 'orange', text: '待到账' },
      overdue: { color: 'red', text: '逾期' }
    };
    const info = map[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const multiTenantColumns = [
    { title: '中心名称', dataIndex: 'center_name', key: 'center_name' },
    { title: '同步状态', dataIndex: 'sync_status', key: 'sync_status', render: (v) => syncStatusTag(v) },
    { title: '差异金额', dataIndex: 'diff_amount', key: 'diff_amount', render: (v) => v ? `¥${v.toFixed(2)}` : '-' },
    { title: '最后同步时间', dataIndex: 'last_sync_time', key: 'last_sync_time' }
  ];

  const crossCenterColumns = [
    { title: '源中心', dataIndex: 'from_center', key: 'from_center' },
    { title: '目标中心', dataIndex: 'to_center', key: 'to_center' },
    { title: '同步类型', dataIndex: 'sync_type', key: 'sync_type' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v) => syncStatusTag(v) },
    { title: '差异金额', dataIndex: 'diff_amount', key: 'diff_amount', render: (v) => v ? `¥${v.toFixed(2)}` : '-' },
    { title: '差异详情', dataIndex: 'diff_detail', key: 'diff_detail' },
    { title: '同步时间', dataIndex: 'synced_at', key: 'synced_at' }
  ];

  const fundArrivalColumns = [
    { title: '预计到账日期', dataIndex: 'expected_date', key: 'expected_date' },
    { title: '实际到账日期', dataIndex: 'actual_date', key: 'actual_date', render: (v) => v || '-' },
    { title: '到账状态', dataIndex: 'arrival_status', key: 'arrival_status', render: (v) => arrivalStatusTag(v) },
    { title: '来源类型', dataIndex: 'source_type', key: 'source_type' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v) => `¥${v?.toFixed(2)}` }
  ];

  const auditColumns = [
    { title: '操作', dataIndex: 'action', key: 'action' },
    { title: '模块', dataIndex: 'module', key: 'module' },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip' },
    { title: '操作时间', dataIndex: 'created_at', key: 'created_at' }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>账户余额</h2>
        <Button icon={<ReloadOutlined />} onClick={handleSync} loading={syncing}>
          同步账户
        </Button>
      </div>

      <Card title="基本信息">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="账户编号">{account?.account_no}</Descriptions.Item>
          <Descriptions.Item label="账户状态">
            <Tag color={account?.status === 'normal' ? 'green' : 'red'}>
              {account?.status === 'normal' ? '正常' : '异常'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="姓名">{account?.name}</Descriptions.Item>
          <Descriptions.Item label="身份证号">{account?.id_card}</Descriptions.Item>
          <Descriptions.Item label="手机号码">{account?.phone}</Descriptions.Item>
          <Descriptions.Item label="所属中心">{account?.center_name}</Descriptions.Item>
          <Descriptions.Item label="所属单位">{account?.unit_name}</Descriptions.Item>
          <Descriptions.Item label="最后同步时间">{account?.last_sync_at || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="缴存信息" style={{ marginTop: 24 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="账户余额">
            <span style={{ fontSize: 24, color: '#1890ff', fontWeight: 'bold' }}>
              ¥{account?.balance?.toFixed(2)}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="月缴存额">¥{account?.monthly_pay?.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="缴存基数">¥{account?.base_salary?.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="缴存比例">
            单位 {account?.unit_ratio || 12}% / 个人 {account?.personal_ratio || 12}%
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="多租户中心来源" style={{ marginTop: 24 }}>
        <Table
          columns={multiTenantColumns}
          dataSource={account?.multi_tenant_sources || []}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: '暂无多中心来源记录' }}
        />
      </Card>

      <Card title="跨中心同步差异" style={{ marginTop: 24 }}>
        <Table
          columns={crossCenterColumns}
          dataSource={account?.cross_center_sync || []}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: '暂无跨中心同步记录' }}
        />
      </Card>

      <Card title="资金到账时效" style={{ marginTop: 24 }}>
        <Table
          columns={fundArrivalColumns}
          dataSource={account?.fund_arrivals || []}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: '暂无资金到账记录' }}
        />
      </Card>

      <Card title="操作审计记录" style={{ marginTop: 24 }}>
        <Table
          columns={auditColumns}
          dataSource={account?.personal_audit_records || []}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: '暂无审计记录' }}
        />
      </Card>
    </div>
  );
}
