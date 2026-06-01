import { useState, useEffect } from 'react';
import { Card, Table, Select, DatePicker, Space, Input, message, Spin } from 'antd';
import dayjs from 'dayjs';
import { reportApi } from '../api';

const { RangePicker } = DatePicker;

const ACTION_LABELS: Record<string, string> = {
  create_station: '创建站点',
  create_threshold: '创建阈值',
  threshold_hit: '阈值命中',
  create_warning: '创建预警',
  update_warning: '更新预警',
  publish_warning: '发布预警',
  cancel_warning: '解除预警',
  create_template: '创建模板',
  update_template: '更新模板',
  create_channel: '创建渠道',
  update_channel: '更新渠道',
  retry_publish: '重发通知',
  confirm_receipt: '确认回执',
  forward_receipt: '转发回执',
  act_receipt: '处置回执',
  mark_no_response: '标记未响应',
  add_feedback: '添加反馈',
  create_target: '创建接收对象',
};

export default function OpsLogPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [action, setAction] = useState<string>('');
  const [actions, setActions] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    reportApi.opsLog({ action: 'none' }).then(() => {}).catch(() => {});
    loadActions();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [page, pageSize, action, keyword]);

  async function loadActions() {
    try {
      const data: any = await fetch('/api/ops-log/actions').then(r => r.json());
      setActions(data);
    } catch (e) {}
  }

  async function loadLogs() {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (action) params.action = action;
      if (keyword) params.operator = keyword;
      const data: any = await reportApi.opsLog(params);
      setLogs(data.rows || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 140,
      render: (v: string) => (
        <Space>
          <code style={{ fontSize: 11, color: '#1677ff' }}>{v}</code>
          <span style={{ color: '#999', fontSize: 12 }}>{ACTION_LABELS[v] || ''}</span>
        </Space>
      ),
    },
    { title: '目标类型', dataIndex: 'target_type', key: 'target_type', width: 100 },
    { title: '目标ID', dataIndex: 'target_id', key: 'target_id', width: 80 },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 120 },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      render: (v: string) => {
        if (!v) return '-';
        try {
          const obj = JSON.parse(v);
          return <code style={{ fontSize: 11 }}>{JSON.stringify(obj)}</code>;
        } catch {
          return <span>{v}</span>;
        }
      },
    },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 160, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
  ];

  return (
    <Spin spinning={loading}>
      <Card
        title="操作日志"
        extra={
          <Space>
            <Select
              placeholder="操作类型"
              style={{ width: 160 }}
              allowClear
              value={action || undefined}
              onChange={(v) => { setAction(v); setPage(1); }}
            >
              {actions.map(a => <Select.Option key={a} value={a}>{a} {ACTION_LABELS[a] ? `(${ACTION_LABELS[a]})` : ''}</Select.Option>)}
            </Select>
            <Input.Search
              placeholder="搜索操作人"
              style={{ width: 160 }}
              allowClear
              onSearch={(v) => { setKeyword(v); setPage(1); }}
            />
          </Space>
        }
      >
        <Table
          dataSource={logs}
          rowKey="id"
          columns={columns}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>
    </Spin>
  );
}