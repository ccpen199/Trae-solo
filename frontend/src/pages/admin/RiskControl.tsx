import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Switch, Modal, Tabs, List, message, Input, Select, Space, Descriptions, Form, Badge, Alert } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, SearchOutlined, StopOutlined, ThunderboltOutlined, HistoryOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from '../../utils/axios';

const { TextArea } = Input;

const getRiskLevel = (reason: string, type: string) => {
  const highRiskKeywords = ['诈骗', '违法', '传销', '色情', '暴力', '威胁', '勒索'];
  const mediumRiskKeywords = ['虚假', '欺诈', '违规', '歧视', '骚扰', '泄露'];
  
  const lowerReason = reason?.toLowerCase() || '';
  
  if (highRiskKeywords.some(k => lowerReason.includes(k))) {
    return { level: 'high', label: '高风险', color: 'red' };
  }
  if (mediumRiskKeywords.some(k => lowerReason.includes(k))) {
    return { level: 'medium', label: '中风险', color: 'orange' };
  }
  return { level: 'low', label: '低风险', color: 'green' };
};

export default function AdminRiskControl() {
  const [pendingCompanies, setPendingCompanies] = useState<any[]>([]);
  const [pendingJobs, setPendingJobs] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [resolvedReports, setResolvedReports] = useState<any[]>([]);
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [blacklistModalVisible, setBlacklistModalVisible] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<any>(null);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [reportDetailVisible, setReportDetailVisible] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [handlingNotes, setHandlingNotes] = useState('');
  const [reportFilterType, setReportFilterType] = useState<string | undefined>(undefined);
  const [reportFilterStatus, setReportFilterStatus] = useState<string | undefined>(undefined);
  const [quickActionLoading, setQuickActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadPendingCompanies();
    loadPendingJobs();
    loadReports();
    loadResolvedReports();
    loadBlacklist();
  }, []);

  const loadPendingCompanies = async () => {
    try {
      const { data } = await axios.get('/admin/companies/pending');
      setPendingCompanies(data || []);
    } catch (error) {
      console.error('Failed to load companies:', error);
    }
  };

  const loadPendingJobs = async () => {
    try {
      const { data } = await axios.get('/admin/jobs/unverified');
      setPendingJobs(data || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const loadReports = async () => {
    try {
      const params: any = { status: 'pending' };
      const { data } = await axios.get('/admin/reports', { params });
      let filtered = data || [];
      if (reportFilterType) {
        filtered = filtered.filter((r: any) => r.type === reportFilterType);
      }
      setReports(filtered);
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  const loadResolvedReports = async () => {
    try {
      const { data } = await axios.get('/admin/reports', { params: { status: 'resolved' } });
      setResolvedReports(data || []);
    } catch (error) {
      console.error('Failed to load resolved reports:', error);
    }
  };

  const loadBlacklist = async () => {
    try {
      const { data } = await axios.get('/admin/blacklist/companies');
      setBlacklist(data || []);
    } catch (error) {
      console.error('Failed to load blacklist:', error);
    }
  };

  useEffect(() => {
    loadReports();
  }, [reportFilterType, reportFilterStatus]);

  const handleVerifyCompany = async (id: number, verified: boolean) => {
    try {
      await axios.put(`/admin/company/${id}/verify`, {
        verified,
        social_security_verified: verified
      });
      message.success(verified ? '审核通过' : '已拒绝');
      loadPendingCompanies();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleVerifySocialSecurity = async (id: number, verified: boolean) => {
    try {
      await axios.put(`/admin/company/${id}/verify`, {
        social_security_verified: verified
      });
      message.success(verified ? '社保认证已通过' : '社保认证已取消');
      loadPendingCompanies();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleVerifyJob = async (id: number, verified: boolean) => {
    try {
      await axios.put(`/admin/job/${id}/verify`, { verified });
      message.success(verified ? '审核通过' : '已拒绝');
      loadPendingJobs();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleQuickReportAction = async (id: number, status: string) => {
    setQuickActionLoading(id);
    try {
      await axios.put(`/admin/report/${id}/handle`, {
        status,
        handling_notes: status === 'resolved' ? '快速处理' : '已驳回'
      });
      message.success(status === 'resolved' ? '已标记为解决' : '已驳回');
      loadReports();
      loadResolvedReports();
    } catch (error) {
      message.error('操作失败');
    } finally {
      setQuickActionLoading(null);
    }
  };

  const handleReport = async (id: number, status: string) => {
    try {
      await axios.put(`/admin/report/${id}/handle`, {
        status,
        handling_notes: handlingNotes || undefined
      });
      message.success('处理完成');
      setReportDetailVisible(false);
      loadReports();
      loadResolvedReports();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleAddBlacklist = (company: any) => {
    setCurrentCompany(company);
    setBlacklistReason('');
    setBlacklistModalVisible(true);
  };

  const confirmAddBlacklist = async () => {
    try {
      await axios.post('/admin/blacklist/company', {
        company_id: currentCompany.id,
        reason: blacklistReason
      });
      message.success('已加入黑名单');
      setBlacklistModalVisible(false);
      loadBlacklist();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const showReportDetail = (record: any) => {
    setCurrentReport(record);
    setHandlingNotes(record.handling_notes || '');
    setReportDetailVisible(true);
  };

  const pendingReportCount = reports.filter((r: any) => r.status === 'pending').length;
  const highRiskCount = reports.filter((r: any) => getRiskLevel(r.reason, r.type).level === 'high').length;

  const companyColumns = [
    { title: '公司名称', dataIndex: 'name', key: 'name' },
    { title: '行业', dataIndex: 'industry', key: 'industry' },
    { title: '规模', dataIndex: 'scale', key: 'scale' },
    { title: '地址', dataIndex: 'address', key: 'address' },
    {
      title: '社保认证',
      key: 'social_security',
      render: (_: any, record: any) => (
        <Switch
          size="small"
          checked={record.social_security_verified === 1}
          onChange={(checked) => handleVerifySocialSecurity(record.id, checked)}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleVerifyCompany(record.id, true)}
          >
            通过
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => handleVerifyCompany(record.id, false)}
          >
            拒绝
          </Button>
          <Button
            size="small"
            icon={<WarningOutlined />}
            onClick={() => handleAddBlacklist(record)}
          >
            拉黑
          </Button>
        </Space>
      )
    }
  ];

  const jobColumns = [
    { title: '职位名称', dataIndex: 'title', key: 'title' },
    { title: '公司', dataIndex: 'company_name', key: 'company_name' },
    { title: '薪资', dataIndex: 'salary_min', key: 'salary',
      render: (_: any, record: any) => `${record.salary_min}-${record.salary_max}K`
    },
    { title: '城市', dataIndex: 'city', key: 'city' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleVerifyJob(record.id, true)}
          >
            通过
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => handleVerifyJob(record.id, false)}
          >
            拒绝
          </Button>
        </Space>
      )
    }
  ];

  const reportColumns = [
    {
      title: '风险等级',
      key: 'risk_level',
      render: (_: any, record: any) => {
        const risk = getRiskLevel(record.reason, record.type);
        return (
          <Badge
            status={risk.color as any}
            text={
              <Tag color={risk.color} icon={<ExclamationCircleOutlined />}>
                {risk.label}
              </Tag>
            }
          />
        );
      }
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const labels: Record<string, string> = { job: '职位', company: '企业', user: '用户' };
        return labels[type] || type;
      }
    },
    { title: '举报原因', dataIndex: 'reason', key: 'reason' },
    { title: '举报人', dataIndex: 'reporter_name', key: 'reporter_name', render: (name: string) => name || '匿名' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = { pending: 'warning', processing: 'processing', resolved: 'success', rejected: 'default' };
        const labels: Record<string, string> = { pending: '待处理', processing: '处理中', resolved: '已解决', rejected: '已驳回' };
        return <Tag color={colors[status]}>{labels[status]}</Tag>;
      }
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '快速处理',
      key: 'quick_action',
      render: (_: any, record: any) => {
        if (record.status !== 'pending') return <span style={{ color: '#999' }}>-</span>;
        return (
          <Space size={4}>
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              loading={quickActionLoading === record.id}
              onClick={() => handleQuickReportAction(record.id, 'resolved')}
            >
              解决
            </Button>
            <Button
              size="small"
              icon={<CloseCircleOutlined />}
              loading={quickActionLoading === -record.id}
              onClick={() => handleQuickReportAction(record.id, 'rejected')}
            >
              驳回
            </Button>
          </Space>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => showReportDetail(record)}
          >
            详情
          </Button>
          {record.type === 'company' && record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => handleAddBlacklist({ id: record.target_id, name: `企业#${record.target_id}` })}
            >
              拉黑
            </Button>
          )}
        </Space>
      )
    }
  ];

  const resolvedReportColumns = [
    {
      title: '风险等级',
      key: 'risk_level',
      render: (_: any, record: any) => {
        const risk = getRiskLevel(record.reason, record.type);
        return (
          <Tag color={risk.color} icon={<ExclamationCircleOutlined />}>
            {risk.label}
          </Tag>
        );
      }
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const labels: Record<string, string> = { job: '职位', company: '企业', user: '用户' };
        return labels[type] || type;
      }
    },
    { title: '举报原因', dataIndex: 'reason', key: 'reason' },
    { title: '处理结果', dataIndex: 'status', key: 'status',
      render: (status: string) => status === 'resolved' ? <Tag color="success">已解决</Tag> : <Tag color="default">已驳回</Tag>
    },
    { title: '处理备注', dataIndex: 'handling_notes', key: 'handling_notes', render: (text: string) => text || '-' },
    { title: '处理时间', dataIndex: 'updated_at', key: 'updated_at' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="link" size="small" onClick={() => showReportDetail(record)}>
          查看详情
        </Button>
      )
    }
  ];

  const tabItems = [
    {
      key: 'companies',
      label: `企业审核 (${pendingCompanies.length})`,
      children: (
        <Table
          columns={companyColumns}
          dataSource={pendingCompanies}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )
    },
    {
      key: 'jobs',
      label: `职位审核 (${pendingJobs.length})`,
      children: (
        <Table
          columns={jobColumns}
          dataSource={pendingJobs}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )
    },
    {
      key: 'reports',
      label: `举报处理 (${pendingReportCount})`,
      children: (
        <div>
          {highRiskCount > 0 && (
            <Alert
              message={<span><ThunderboltOutlined style={{ marginRight: 8 }} />您有 {highRiskCount} 个高风险举报需要处理</span>}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          <Space style={{ marginBottom: 16 }} wrap>
            <Select
              placeholder="按类型筛选"
              allowClear
              style={{ width: 140 }}
              value={reportFilterType}
              onChange={(val) => setReportFilterType(val || undefined)}
            >
              <Select.Option value="job">职位</Select.Option>
              <Select.Option value="company">企业</Select.Option>
              <Select.Option value="user">用户</Select.Option>
            </Select>
            <Select
              placeholder="按风险等级筛选"
              allowClear
              style={{ width: 140 }}
            >
              <Select.Option value="high">高风险</Select.Option>
              <Select.Option value="medium">中风险</Select.Option>
              <Select.Option value="low">低风险</Select.Option>
            </Select>
          </Space>
          <Table
            columns={reportColumns}
            dataSource={reports}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </div>
      )
    },
    {
      key: 'resolved-reports',
      label: (
        <span>
          <HistoryOutlined style={{ marginRight: 4 }} />
          举报复查记录 ({resolvedReports.length})
        </span>
      ),
      children: (
        <Table
          columns={resolvedReportColumns}
          dataSource={resolvedReports}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )
    },
    {
      key: 'blacklist',
      label: `黑名单 (${blacklist.length})`,
      children: (
        <List
          dataSource={blacklist}
          renderItem={(item: any) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  size="small"
                  icon={<SearchOutlined />}
                  onClick={() => {
                    setReportFilterType('company');
                    setReportFilterStatus(undefined);
                  }}
                >
                  相关举报
                </Button>
              ]}
            >
              <List.Item.Meta
                title={item.company_name}
                description={
                  <Space direction="vertical" size={2}>
                    <span>拉黑原因: {item.reason}</span>
                    {item.created_at && (
                      <span style={{ color: '#999', fontSize: 12 }}>
                        拉黑时间: {dayjs(item.created_at).format('YYYY-MM-DD')}
                      </span>
                    )}
                  </Space>
                }
              />
              <Tag color="error">已拉黑</Tag>
            </List.Item>
          )}
          locale={{ emptyText: '暂无黑名单数据' }}
        />
      )
    }
  ];

  return (
    <Card title="风控中心">
      <Tabs items={tabItems} />

      <Modal
        title="加入黑名单"
        open={blacklistModalVisible}
        onOk={confirmAddBlacklist}
        onCancel={() => setBlacklistModalVisible(false)}
      >
        <p><strong>企业：</strong>{currentCompany?.name}</p>
        <p style={{ marginTop: 16 }}><strong>拉黑原因：</strong></p>
        <TextArea
          rows={4}
          value={blacklistReason}
          onChange={(e) => setBlacklistReason(e.target.value)}
          placeholder="请输入拉黑原因"
        />
      </Modal>

      <Modal
        title="举报详情"
        open={reportDetailVisible}
        onCancel={() => setReportDetailVisible(false)}
        footer={null}
        width={600}
      >
        {currentReport && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="举报类型">
                {({ job: '职位', company: '企业', user: '用户' } as Record<string, string>)[currentReport.type] || currentReport.type}
              </Descriptions.Item>
              <Descriptions.Item label="风险等级">
                {(() => {
                  const risk = getRiskLevel(currentReport.reason, currentReport.type);
                  return <Tag color={risk.color}>{risk.label}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="目标ID">{currentReport.target_id}</Descriptions.Item>
              <Descriptions.Item label="举报人">{currentReport.reporter_name || '匿名'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={({ pending: 'warning', processing: 'processing', resolved: 'success', rejected: 'default' } as Record<string, string>)[currentReport.status]}>
                  {({ pending: '待处理', processing: '处理中', resolved: '已解决', rejected: '已驳回' } as Record<string, string>)[currentReport.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="举报原因" span={2}>{currentReport.reason}</Descriptions.Item>
              <Descriptions.Item label="详细描述" span={2}>{currentReport.description || '无'}</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>{currentReport.created_at}</Descriptions.Item>
              {currentReport.handling_notes && (
                <Descriptions.Item label="处理备注" span={2}>{currentReport.handling_notes}</Descriptions.Item>
              )}
            </Descriptions>

            {currentReport.status !== 'resolved' && currentReport.status !== 'rejected' && (
              <div style={{ marginTop: 16 }}>
                <strong>处理备注：</strong>
                <TextArea
                  rows={3}
                  value={handlingNotes}
                  onChange={(e) => setHandlingNotes(e.target.value)}
                  placeholder="请输入处理备注..."
                  style={{ marginTop: 8 }}
                />
              </div>
            )}

            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {currentReport.status !== 'resolved' && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleReport(currentReport.id, 'resolved')}
                >
                  标记解决
                </Button>
              )}
              {currentReport.status !== 'rejected' && (
                <Button
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleReport(currentReport.id, 'rejected')}
                >
                  驳回
                </Button>
              )}
              {currentReport.type === 'company' && currentReport.status === 'pending' && (
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={() => {
                    setReportDetailVisible(false);
                    handleAddBlacklist({ id: currentReport.target_id, name: `企业#${currentReport.target_id}` });
                  }}
                >
                  转黑名单
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}
