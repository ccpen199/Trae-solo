import { useState, useCallback } from 'react';
import { Card, Table, Tag, Button, Modal, message } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { getReportStatusList } from '@/services/api/analytics';
import type { ReportStatusItem } from '@/services/api/analytics';

interface Props {
  regionCode?: string;
}

const statusConfig: Record<string, { color: string; text: string }> = {
  submitted: { color: 'green', text: '已报' },
  not_submitted: { color: 'orange', text: '未报' },
  overdue: { color: 'red', text: '逾期' },
};

const integrityConfig: Record<string, { color: string; text: string }> = {
  complete: { color: 'green', text: '完整' },
  incomplete: { color: 'orange', text: '不完整' },
  failed: { color: 'red', text: '校验失败' },
};

const ReportStatusTab: React.FC<Props> = ({ regionCode }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { data: reportData } = useRequest(() => getReportStatusList({ regionCode }), {
    refreshDeps: [regionCode],
  });

  const handleUrge = useCallback((record: ReportStatusItem) => {
    Modal.confirm({
      title: '催报确认',
      content: `确认向 "${record.placeName}" 发送催报通知？`,
      onOk: () => {
        message.success(`已向 ${record.placeName} 发送催报通知`);
      },
    });
  }, []);

  const handleBatchUrge = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择需要催报的场所');
      return;
    }
    Modal.confirm({
      title: '批量催报确认',
      content: `确认向选中的 ${selectedRowKeys.length} 个场所发送催报通知？`,
      onOk: () => {
        message.success(`已向 ${selectedRowKeys.length} 个场所发送催报通知`);
        setSelectedRowKeys([]);
      },
    });
  }, [selectedRowKeys]);

  const columns = [
    {
      title: '场所名称',
      dataIndex: 'placeName',
      key: 'placeName',
      ellipsis: true,
      width: 200,
    },
    {
      title: '所属区域',
      dataIndex: 'regionName',
      key: 'regionName',
      width: 150,
    },
    {
      title: '上报状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const cfg = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '上报时间',
      dataIndex: 'reportTime',
      key: 'reportTime',
      width: 170,
      render: (v: string | null) => v || '-',
    },
    {
      title: '上报人',
      dataIndex: 'reporter',
      key: 'reporter',
      width: 80,
      render: (v: string | null) => v || '-',
    },
    {
      title: '数据完整性',
      dataIndex: 'integrity',
      key: 'integrity',
      width: 110,
      render: (integrity: string) => {
        const cfg = integrityConfig[integrity] || { color: 'default', text: integrity };
        return <Tag color={cfg.color} className="integrity-tag">{cfg.text}</Tag>;
      },
    },
    {
      title: '校验详情',
      dataIndex: 'integrityDetail',
      key: 'integrityDetail',
      ellipsis: true,
      width: 200,
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      render: (_: unknown, record: ReportStatusItem) =>
        record.status !== 'submitted' ? (
          <Button
            type="link"
            size="small"
            icon={<BellOutlined />}
            onClick={() => handleUrge(record)}
          >
            催报
          </Button>
        ) : null,
    },
  ];

  const overdueCount = (reportData?.data || []).filter((d) => d.status === 'overdue').length;
  const notSubmittedCount = (reportData?.data || []).filter((d) => d.status === 'not_submitted').length;
  const submittedCount = (reportData?.data || []).filter((d) => d.status === 'submitted').length;

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <Card size="small" style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>{submittedCount}</div>
            <div style={{ fontSize: 13, color: '#86909C', marginTop: 4 }}>已上报</div>
          </div>
        </Card>
        <Card size="small" style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#faad14' }}>{notSubmittedCount}</div>
            <div style={{ fontSize: 13, color: '#86909C', marginTop: 4 }}>未上报</div>
          </div>
        </Card>
        <Card size="small" style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#f5222d' }}>{overdueCount}</div>
            <div style={{ fontSize: 13, color: '#86909C', marginTop: 4 }}>逾期未报</div>
          </div>
        </Card>
      </div>

      <Card
        title="各场所上报状态"
        extra={
          <Button
            type="primary"
            icon={<BellOutlined />}
            onClick={handleBatchUrge}
            disabled={selectedRowKeys.length === 0}
          >
            批量催报 ({selectedRowKeys.length})
          </Button>
        }
      >
        <Table
          rowKey="placeId"
          columns={columns}
          dataSource={reportData?.data || []}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          size="middle"
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
            getCheckboxProps: (record) => ({
              disabled: record.status === 'submitted',
            }),
          }}
          rowClassName={(record) =>
            record.status === 'overdue' ? 'report-status-row-overdue' : ''
          }
        />
      </Card>
    </div>
  );
};

export default ReportStatusTab;
