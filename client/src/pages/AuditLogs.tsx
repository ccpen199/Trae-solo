import React, { useEffect, useState } from 'react';
import {
  Card, Table, Select, DatePicker, Space, Tag, Empty,
  Input, Tooltip, Modal, Descriptions, Button, Avatar, List
} from 'antd';
import {
  SafetyOutlined, SearchOutlined, FilterOutlined,
  UserOutlined, EyeOutlined, SendOutlined,
  WarningOutlined, CheckCircleOutlined, ClockCircleOutlined,
  EnvironmentOutlined, FileTextOutlined
} from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import dayjs, { Dayjs } from 'dayjs';
import { streamApi, userApi } from '@/services/api';
import { formatTime, formatRelativeTime } from '@/utils/format';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface AuditLog {
  id: number;
  alert_id: number;
  user_id: number;
  username: string;
  nickname: string;
  action: string;
  action_detail: string;
  alert_title: string;
  ip: string;
  created_at: string;
}

const AuditLogs: React.FC = observer(() => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [filterAction, setFilterAction] = useState<string | undefined>(undefined);
  const [filterUser, setFilterUser] = useState<number | undefined>(undefined);
  const [filterAlert, setFilterAlert] = useState<number | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [keyword, setKeyword] = useState('');

  const [details, setDetails] = useState<{ show: boolean; data?: AuditLog }>({ show: false });

  useEffect(() => {
    loadLogs();
  }, [page, pageSize, filterAction, filterUser, filterAlert, dateRange]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (filterAlert) params.alertId = filterAlert;
      if (dateRange && dateRange[0]) params.startTime = dateRange[0].toISOString();
      if (dateRange && dateRange[1]) params.endTime = dateRange[1].toISOString();
      const res = await streamApi.listAuditLogs(params);
      let list = res?.list || [];
      if (filterUser) list = list.filter((l: AuditLog) => l.user_id === filterUser);
      if (filterAction) list = list.filter((l: AuditLog) => l.action === filterAction);
      if (keyword) {
        const kw = keyword.toLowerCase();
        list = list.filter((l: AuditLog) =>
          l.username?.toLowerCase().includes(kw) ||
          l.alert_title?.toLowerCase().includes(kw) ||
          l.action_detail?.toLowerCase().includes(kw)
        );
      }
      setLogs(list);
      setTotal(res?.total || list.length);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const actionMap: Record<string, { color: string; icon: any; text: string }> = {
    read: { color: 'blue', icon: <EyeOutlined />, text: '查看告警' },
    confirm: { color: 'green', icon: <CheckCircleOutlined />, text: '确认有效' },
    ignore: { color: 'orange', icon: <WarningOutlined />, text: '标记误报' },
    dispatch: { color: 'purple', icon: <SendOutlined />, text: '派发处理' },
    close: { color: 'default', icon: <CheckCircleOutlined />, text: '处理完成' },
  };

  const columns = [
    {
      title: '操作人',
      key: 'user',
      width: 180,
      render: (_: any, r: AuditLog) => (
        <div className="flex items-center gap-2">
          <Avatar size={36} icon={<UserOutlined />} />
          <div>
            <div className="font-medium text-sm">{r.nickname || r.username}</div>
            <div className="text-xs text-gray-500">@{r.username}</div>
          </div>
        </div>
      )
    },
    {
      title: '处置动作',
      dataIndex: 'action',
      key: 'action',
      width: 140,
      render: (action: string) => {
        const info = actionMap[action] || { color: 'default', icon: <FileTextOutlined />, text: action };
        return (
          <Tag icon={info.icon} color={info.color}>
            {info.text}
          </Tag>
        );
      },
    },
    {
      title: '对应告警',
      dataIndex: 'alert_title',
      key: 'alert',
      render: (title: string, r: AuditLog) => (
        <div>
          <div className="font-medium truncate">{title}</div>
          <div className="text-xs text-gray-500 mt-0.5">告警ID: #{r.alert_id}</div>
        </div>
      ),
    },
    {
      title: '处置详情',
      dataIndex: 'action_detail',
      key: 'detail',
      render: (v: string) => v || <span className="text-gray-400">-</span>,
    },
    {
      title: '操作IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 140,
      render: (v: string) => (
        <span className="font-mono text-xs flex items-center gap-1">
          <EnvironmentOutlined /> {v || '-'}
        </span>
      ),
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created',
      width: 180,
      render: (v: string) => (
        <div className="text-sm">
          <div>{formatTime(v, 'MM-DD HH:mm:ss')}</div>
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <ClockCircleOutlined /> {formatRelativeTime(v)}
          </div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'view',
      width: 80,
      render: (_: any, r: AuditLog) => (
        <Tooltip title="查看详情">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setDetails({ show: true, data: r })} />
        </Tooltip>
      ),
    },
  ];

  // 统计数据
  const actionStats = logs.reduce((acc: Record<string, number>, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <Card
        className="!rounded-xl !mb-4"
        title={<span className="font-semibold text-base"><SafetyOutlined /> 告警处置审计</span>}
        extra={
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="搜索用户/告警/详情"
              style={{ width: 220 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Select
              placeholder="处置动作"
              allowClear
              style={{ width: 140 }}
              value={filterAction}
              onChange={(v) => { setFilterAction(v); setPage(1); }}
            >
              <Option value="read">查看告警</Option>
              <Option value="confirm">确认有效</Option>
              <Option value="ignore">标记误报</Option>
              <Option value="dispatch">派发处理</Option>
              <Option value="close">处理完成</Option>
            </Select>
            <Select
              placeholder="操作人"
              allowClear
              style={{ width: 140 }}
              value={filterUser}
              onChange={(v) => { setFilterUser(v); setPage(1); }}
              showSearch
              optionFilterProp="label"
            >
              {Array.from(new Set(logs.map(l => l.user_id))).map(uid => {
                const log = logs.find(l => l.user_id === uid);
                if (!log) return null;
                return <Option key={uid} value={uid} label={log.nickname || log.username}>{log.nickname || log.username}</Option>;
              })}
            </Select>
            <Input
              placeholder="告警ID"
              style={{ width: 120 }}
              allowClear
              onChange={(e) => { setFilterAlert(e.target.value ? +e.target.value : undefined); setPage(1); }}
            />
            <RangePicker
              showTime
              value={dateRange}
              onChange={(v) => { setDateRange(v as any); setPage(1); }}
            />
            <Button icon={<FilterOutlined />} onClick={() => {
              setFilterAction(undefined); setFilterUser(undefined); setFilterAlert(undefined);
              setDateRange(null); setKeyword(''); setPage(1);
            }}>重置</Button>
            <Button icon={<SearchOutlined />} onClick={loadLogs}>刷新</Button>
          </Space>
        }
      >
        {Object.keys(actionStats).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
            {Object.entries(actionMap).map(([key, info]) => (
              <div key={key} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Tag icon={info.icon} color={info.color}>{info.text}</Tag>
                </div>
                <div className="mt-1 text-2xl font-bold text-gray-800">
                  {actionStats[key] || 0}
                </div>
              </div>
            ))}
          </div>
        )}

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={logs}
          locale={{ emptyText: <Empty description="暂无审计记录，只有主账号对告警进行处置后会产生日志" /> }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条审计记录`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); }
          }}
        />
      </Card>

      <Modal
        title="审计记录详情"
        open={details.show}
        onCancel={() => setDetails({ show: false })}
        footer={[
          <Button key="close" onClick={() => setDetails({ show: false })}>关闭</Button>
        ]}
        width={600}
      >
        {details.data && (
          <div className="space-y-4">
            <Descriptions column={1} size="small" bordered title="基本信息">
              <Descriptions.Item label="操作人">
                <Space>
                  <Avatar size={28} icon={<UserOutlined />} />
                  <span>{details.data.nickname || details.data.username}</span>
                  <span className="text-gray-500 text-xs">(@{details.data.username})</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="处置动作">
                {(() => {
                  const info = actionMap[details.data.action] || { color: 'default', icon: null, text: details.data.action };
                  return <Tag icon={info.icon} color={info.color}>{info.text}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="对应告警">
                <div>
                  <div className="font-medium">{details.data.alert_title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">告警ID: #{details.data.alert_id}</div>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="处置详情">
                {details.data.action_detail || <span className="text-gray-400">无</span>}
              </Descriptions.Item>
              <Descriptions.Item label="来源IP">
                <span className="font-mono">{details.data.ip || '-'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="操作时间">
                <div>
                  <div>{formatTime(details.data.created_at)}</div>
                  <div className="text-xs text-gray-500">{formatRelativeTime(details.data.created_at)}</div>
                </div>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
});

export default AuditLogs;
