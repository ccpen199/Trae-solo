import React from 'react';
import { Card, Table, Tag, Button, Modal, Input, Select, message, Popconfirm, Space } from 'antd';
import { api } from '../../services/api';
import { Report, ReportStatus, ReportType } from '../../types';
import dayjs from 'dayjs';

const { TextArea } = Input;

const AuditorReports: React.FC = () => {
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedReport, setSelectedReport] = React.useState<Report | null>(null);
  const [processModalVisible, setProcessModalVisible] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const [pagination, setPagination] = React.useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = React.useState({
    status: '',
    type: ''
  });
  const [processForm, setProcessForm] = React.useState({
    status: '',
    resolutionNote: ''
  });

  const fetchReports = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize
      };

      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;

      const response = await api.get('/reports', { params });
      
      if (response.data.success) {
        setReports(response.data.data);
      }
    } catch (error) {
      console.error('获取举报列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination, filters]);

  React.useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleProcess = (report: Report) => {
    setSelectedReport(report);
    setProcessForm({ status: report.status, resolutionNote: '' });
    setProcessModalVisible(true);
  };

  const submitProcess = async () => {
    if (!selectedReport) return;

    setProcessing(true);
    try {
      const response = await api.put(`/reports/${selectedReport.id}/process`, {
        status: processForm.status,
        resolutionNote: processForm.resolutionNote
      });

      if (response.data.success) {
        message.success('处理成功');
        setProcessModalVisible(false);
        fetchReports();
      } else {
        message.error(response.data.error || '处理失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '处理失败');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusTag = (status: ReportStatus) => {
    const statusMap: Record<ReportStatus, { color: string; text: string }> = {
      [ReportStatus.PENDING]: { color: 'orange', text: '待处理' },
      [ReportStatus.REVIEWING]: { color: 'blue', text: '审核中' },
      [ReportStatus.RESOLVED]: { color: 'green', text: '已解决' },
      [ReportStatus.DISMISSED]: { color: 'default', text: '已驳回' }
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getTypeTag = (type: ReportType) => {
    const typeMap: Record<ReportType, { color: string; text: string }> = {
      [ReportType.SPAM]: { color: 'orange', text: '垃圾信息' },
      [ReportType.HATE]: { color: 'red', text: '仇恨言论' },
      [ReportType.HARASSMENT]: { color: 'red', text: '骚扰' },
      [ReportType.VIOLENCE]: { color: 'red', text: '暴力' },
      [ReportType.ADULT]: { color: 'red', text: '成人内容' },
      [ReportType.ILLEGAL]: { color: 'red', text: '非法内容' },
      [ReportType.OTHER]: { color: 'default', text: '其他' }
    };
    const info = typeMap[type] || { color: 'default', text: type };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: '举报类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: ReportType) => getTypeTag(type)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ReportStatus) => getStatusTag(status)
    },
    {
      title: '举报内容',
      key: 'content',
      width: 200,
      render: (_: any, record: Report) => {
        if (record.post) {
          return (
            <div>
              <div style={{ fontWeight: 'bold' }}>帖子: {record.post.title}</div>
              <div style={{ color: '#999', fontSize: 12 }}>作者: {record.post.author?.username}</div>
            </div>
          );
        }
        if (record.comment) {
          return (
            <div>
              <div style={{ fontWeight: 'bold' }}>评论</div>
              <div style={{ color: '#999', fontSize: 12 }}>
                {record.comment.content.length > 50 
                  ? record.comment.content.substring(0, 50) + '...' 
                  : record.comment.content}
              </div>
            </div>
          );
        }
        return '-';
      }
    },
    {
      title: '举报原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 200,
      ellipsis: true
    },
    {
      title: '举报人',
      dataIndex: 'reporter',
      key: 'reporter',
      width: 100,
      render: (reporter: any) => reporter?.username || '-'
    },
    {
      title: '处理人',
      dataIndex: 'handler',
      key: 'handler',
      width: 100,
      render: (handler: any) => handler?.username || '-'
    },
    {
      title: '举报时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Report) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleProcess(record)}>
            处理
          </Button>
        </Space>
      )
    }
  ];

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: ReportStatus.PENDING, label: '待处理' },
    { value: ReportStatus.REVIEWING, label: '审核中' },
    { value: ReportStatus.RESOLVED, label: '已解决' },
    { value: ReportStatus.DISMISSED, label: '已驳回' }
  ];

  const typeOptions = [
    { value: '', label: '全部类型' },
    { value: ReportType.SPAM, label: '垃圾信息' },
    { value: ReportType.HATE, label: '仇恨言论' },
    { value: ReportType.HARASSMENT, label: '骚扰' },
    { value: ReportType.VIOLENCE, label: '暴力' },
    { value: ReportType.ADULT, label: '成人内容' },
    { value: ReportType.ILLEGAL, label: '非法内容' },
    { value: ReportType.OTHER, label: '其他' }
  ];

  const processStatusOptions = [
    { value: ReportStatus.REVIEWING, label: '标记为审核中' },
    { value: ReportStatus.RESOLVED, label: '标记为已解决' },
    { value: ReportStatus.DISMISSED, label: '标记为已驳回' }
  ];

  return (
    <div className="auditor-reports">
      <Card title="举报管理">
        <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
          <Select
            placeholder="状态筛选"
            style={{ width: 150 }}
            allowClear
            options={statusOptions}
            value={filters.status || undefined}
            onChange={(value) => setFilters({ ...filters, status: value || '' })}
          />
          <Select
            placeholder="类型筛选"
            style={{ width: 150 }}
            allowClear
            options={typeOptions}
            value={filters.type || undefined}
            onChange={(value) => setFilters({ ...filters, type: value || '' })}
          />
        </div>

        <Table
          dataSource={reports}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
            onShowSizeChange: (current, size) => setPagination({ ...pagination, current, pageSize: size })
          }}
        />
      </Card>

      <Modal
        title="处理举报"
        open={processModalVisible}
        onOk={submitProcess}
        onCancel={() => setProcessModalVisible(false)}
        confirmLoading={processing}
        okText="提交处理"
        cancelText="取消"
        width={600}
      >
        {selectedReport && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>举报信息</label>
              <Card size="small">
                <p><strong>类型:</strong> {getTypeTag(selectedReport.type)}</p>
                <p><strong>当前状态:</strong> {getStatusTag(selectedReport.status)}</p>
                <p><strong>举报原因:</strong> {selectedReport.reason}</p>
                {selectedReport.resolutionNote && (
                  <p><strong>之前的处理备注:</strong> {selectedReport.resolutionNote}</p>
                )}
              </Card>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>处理状态</label>
              <Select
                style={{ width: '100%' }}
                options={processStatusOptions}
                value={processForm.status || undefined}
                onChange={(value) => setProcessForm({ ...processForm, status: value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>处理备注</label>
              <TextArea
                rows={4}
                placeholder="请输入处理备注..."
                value={processForm.resolutionNote}
                onChange={(e) => setProcessForm({ ...processForm, resolutionNote: e.target.value })}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditorReports;
