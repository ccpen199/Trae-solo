import { useState, useEffect } from 'react';
import { Card, Table, Select, DatePicker, Tag, Spin, Button } from 'antd';
import { ExpandOutlined } from '@ant-design/icons';
import api from '../../api';

const { RangePicker } = DatePicker;

interface FraudLog {
  id: string;
  entityType: string;
  action: string;
  actor: string;
  ip: string;
  time: string;
  detail: string;
}

const entityTypeOptions = [
  { value: '', label: '全部类型' },
  { value: 'order', label: '订单' },
  { value: 'wallet', label: '钱包' },
  { value: 'red_packet', label: '红包' },
  { value: 'user', label: '用户' },
  { value: 'topic', label: '话题' },
];

const FraudLogs: React.FC = () => {
  const [logs, setLogs] = useState<FraudLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/admin/fraud-logs', {
          params: { entityType },
        });
        setLogs(data.items || []);
      } catch {
        setLogs([
          { id: 'fl1', entityType: 'order', action: '批量下单', actor: 'user_001', ip: '192.168.1.100', time: '2026-06-19T10:30:00Z', detail: '1分钟内连续下单5笔，触发风控规则。IP来源与历史记录不一致。' },
          { id: 'fl2', entityType: 'wallet', action: '高频提现', actor: 'user_042', ip: '10.0.0.55', time: '2026-06-19T09:15:00Z', detail: '24小时内提现3次，累计金额¥8000，超出日限额。' },
          { id: 'fl3', entityType: 'red_packet', action: '异常领取', actor: 'user_108', ip: '172.16.0.22', time: '2026-06-18T22:05:00Z', detail: '同一设备领取5个不同用户红包，疑似薅羊毛行为。' },
          { id: 'fl4', entityType: 'topic', action: '敏感词触发', actor: 'user_055', ip: '192.168.2.88', time: '2026-06-18T16:45:00Z', detail: '发布内容包含3个敏感词，已自动过滤并记录。' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [entityType]);

  const toggleExpand = (id: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const entityTagMap: Record<string, { label: string; color: string }> = {
    order: { label: '订单', color: 'blue' },
    wallet: { label: '钱包', color: 'green' },
    red_packet: { label: '红包', color: 'red' },
    user: { label: '用户', color: 'purple' },
    topic: { label: '话题', color: 'orange' },
  };

  const columns = [
    {
      title: '实体类型',
      dataIndex: 'entityType',
      key: 'entityType',
      render: (v: string) => <Tag color={entityTagMap[v]?.color}>{entityTagMap[v]?.label || v}</Tag>,
    },
    { title: '操作', dataIndex: 'action', key: 'action' },
    { title: '操作者', dataIndex: 'actor', key: 'actor' },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip' },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '详情',
      key: 'detail',
      render: (_: unknown, record: FraudLog) => (
        <Button
          type="link"
          icon={<ExpandOutlined />}
          onClick={() => toggleExpand(record.id)}
        >
          {expandedKeys.has(record.id) ? '收起' : '展开'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Select
          value={entityType}
          onChange={setEntityType}
          options={entityTypeOptions}
          style={{ width: 160, marginRight: 16 }}
        />
        <RangePicker />
      </Card>

      <Card title="欺诈溯源日志" loading={loading}>
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="id"
          expandable={{
            expandedRowKeys: [...expandedKeys],
            onExpandedRowsChange: (keys) => setExpandedKeys(new Set(keys as string[])),
            expandedRowRender: (record) => (
              <div style={{ padding: 8, background: '#fafafa', borderRadius: 4 }}>
                <strong>详细信息：</strong>
                <p style={{ margin: '8px 0 0' }}>{record.detail}</p>
              </div>
            ),
          }}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default FraudLogs;
