import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Statistic,
  Row,
  Col,
  Progress,
  Tag,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  Descriptions,
  Tabs
} from 'antd';
import {
  DollarOutlined,
  FileExcelOutlined,
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useQuery, useMutation } from 'react-query';
import { financeApi } from '@/services/api';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const FinancePage: React.FC = () => {
  const [exportForm] = Form.useForm();
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('budgets');

  const { data: budgets, isLoading: budgetsLoading } = useQuery(
    ['budgets'],
    () => financeApi.listBudgets({ limit: 100 })
  );

  const { data: subsidySummary, isLoading: summaryLoading } = useQuery(
    ['subsidy-summary'],
    () => financeApi.getSubsidySummary({})
  );

  const { data: auditLogs, isLoading: logsLoading } = useQuery(
    ['audit-logs'],
    () => financeApi.getAuditLogs({ limit: 50 }),
    { enabled: activeTab === 'audit' }
  );

  const exportMutation = useMutation(
    (data: any) => financeApi.exportReport(data),
    {
      onSuccess: (result) => {
        if (result.data) {
          const jsonData = JSON.stringify(result.data, null, 2);
          const blob = new Blob([jsonData], { type: 'application/json' });
          saveAs(blob, result.filename || 'report.json');
          message.success('报告导出成功');
        } else if (result.buffer) {
          saveAs(new Blob([result.buffer]), result.filename);
          message.success('报告导出成功');
        }
        setExportModalVisible(false);
      },
      onError: () => {
        message.error('导出失败，请重试');
      }
    }
  );

  const handleExport = (values: any) => {
    const data = {
      ...values,
      startDate: values.dateRange?.[0]?.toDate(),
      endDate: values.dateRange?.[1]?.toDate()
    };
    exportMutation.mutate(data);
  };

  const budgetColumns = [
    {
      title: '预算名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Button
          type="link"
          onClick={() => setSelectedBudget(record)}
        >
          {text}
        </Button>
      )
    },
    {
      title: '周期类型',
      dataIndex: 'periodType',
      key: 'periodType',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          monthly: '月度',
          quarterly: '季度',
          yearly: '年度',
          custom: '自定义'
        };
        return <Tag>{typeMap[type] || type}</Tag>;
      }
    },
    {
      title: '总预算',
      dataIndex: 'totalBudget',
      key: 'totalBudget',
      render: (val: number) => `¥${val.toLocaleString()}`
    },
    {
      title: '已使用',
      dataIndex: 'usedBudget',
      key: 'usedBudget',
      render: (val: number) => (
        <span style={{ color: '#ff4d4f' }}>¥{val.toLocaleString()}</span>
      )
    },
    {
      title: '剩余',
      dataIndex: 'remainingBudget',
      key: 'remainingBudget',
      render: (val: number) => (
        <span style={{ color: '#52c41a' }}>¥{val.toLocaleString()}</span>
      )
    },
    {
      title: '使用率',
      key: 'utilization',
      render: (_: any, record: any) => {
        const percent = Math.round((record.usedBudget / record.totalBudget) * 100);
        return (
          <Progress
            percent={percent}
            size="small"
            status={percent > 90 ? 'exception' : percent > 70 ? 'active' : 'normal'}
          />
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          active: { color: 'green', text: '活跃' },
          suspended: { color: 'orange', text: '暂停' },
          expired: { color: 'default', text: '已过期' },
          depleted: { color: 'red', text: '已耗尽' }
        };
        const badge = statusMap[status] || { color: 'default', text: status };
        return <Tag color={badge.color}>{badge.text}</Tag>;
      }
    },
    {
      title: '有效期',
      key: 'validity',
      render: (_: any, record: any) => (
        <span style={{ fontSize: 12 }}>
          {dayjs(record.startDate).format('MM-DD')} ~ {dayjs(record.endDate).format('MM-DD')}
        </span>
      )
    }
  ];

  const auditColumns = [
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => <Tag color="blue">{action}</Tag>
    },
    {
      title: '操作人',
      dataIndex: 'userId',
      key: 'userId',
      render: (id: string) => <span style={{ fontFamily: 'monospace' }}>{id.substring(0, 8)}...</span>
    },
    {
      title: '角色',
      dataIndex: 'userRole',
      key: 'userRole',
      render: (role: string) => {
        const roleMap: Record<string, string> = {
          admin: '管理员',
          operator: '运营',
          merchant: '商家',
          finance: '财务',
          customer: '用户'
        };
        return <Tag>{roleMap[role] || role}</Tag>;
      }
    },
    {
      title: '资源类型',
      dataIndex: 'resourceType',
      key: 'resourceType',
      render: (type: string) => <Tag color="green">{type}</Tag>
    },
    {
      title: '资源ID',
      dataIndex: 'resourceId',
      key: 'resourceId',
      render: (id: string) => id ? <span style={{ fontFamily: 'monospace' }}>{id.substring(0, 12)}...</span> : '-'
    },
    {
      title: '追踪ID',
      dataIndex: 'traceId',
      key: 'traceId',
      render: (id: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {id.substring(0, 12)}...
        </span>
      )
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MM-DD HH:mm:ss')
    }
  ];

  const totalBudget = budgets?.data?.reduce((sum: number, b: any) => sum + b.totalBudget, 0) || 0;
  const usedBudget = budgets?.data?.reduce((sum: number, b: any) => sum + b.usedBudget, 0) || 0;
  const remainingBudget = budgets?.data?.reduce((sum: number, b: any) => sum + b.remainingBudget, 0) || 0;

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总预算"
              value={totalBudget}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="已使用"
              value={usedBudget}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="剩余预算"
              value={remainingBudget}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="累计补贴金额"
              value={subsidySummary?.totalSubsidy || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="财务核算"
        extra={
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={() => setExportModalVisible(true)}
          >
            导出对账单
          </Button>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="预算管理" key="budgets">
            <Table
              columns={budgetColumns}
              dataSource={budgets?.data || []}
              rowKey="id"
              loading={budgetsLoading}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
                defaultPageSize: 10
              }}
            />
          </TabPane>
          <TabPane tab="补贴汇总" key="summary">
            <Card size="small" title="补贴统计" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="补贴总额"
                    value={subsidySummary?.totalSubsidy || 0}
                    prefix="¥"
                    precision={2}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="用券数量"
                    value={subsidySummary?.couponCount || 0}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="关联订单"
                    value={subsidySummary?.orderCount || 0}
                  />
                </Col>
              </Row>
            </Card>
            {subsidySummary?.breakdown && (
              <div>
                <Card size="small" title="按模板统计">
                  <Table
                    dataSource={Object.entries(subsidySummary.breakdown.byTemplate || {}).map(
                      ([key, val]: [string, any]) => ({
                        id: key,
                        templateId: key,
                        ...val
                      })
                    )}
                    columns={[
                      {
                        title: '模板ID',
                        dataIndex: 'templateId',
                        key: 'templateId',
                        render: (id: string) => (
                          <span style={{ fontFamily: 'monospace' }}>
                            {id.substring(0, 12)}...
                          </span>
                        )
                      },
                      {
                        title: '用券数量',
                        dataIndex: 'count',
                        key: 'count'
                      },
                      {
                        title: '补贴金额',
                        dataIndex: 'amount',
                        key: 'amount',
                        render: (val: number) => `¥${val.toFixed(2)}`
                      }
                    ]}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                </Card>
              </div>
            )}
          </TabPane>
          <TabPane tab="审计日志" key="audit">
            <Table
              columns={auditColumns}
              dataSource={auditLogs?.data || []}
              rowKey="id"
              loading={logsLoading}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
                defaultPageSize: 20
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="导出对账单"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        onOk={() => exportForm.submit()}
        confirmLoading={exportMutation.isLoading}
        width={500}
      >
        <Form form={exportForm} layout="vertical" onFinish={handleExport}>
          <Form.Item
            name="format"
            label="导出格式"
            rules={[{ required: true, message: '请选择导出格式' }]}
            initialValue="excel"
          >
            <Select>
              <Select.Option value="excel">Excel (.xlsx)</Select.Option>
              <Select.Option value="csv">CSV (.csv)</Select.Option>
              <Select.Option value="json">JSON (.json)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="统计周期">
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="budgetId" label="指定预算">
            <Select placeholder="留空则导出全部" allowClear>
              {budgets?.data?.map((budget: any) => (
                <Select.Option key={budget.id} value={budget.id}>
                  {budget.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="includeTemplates" label="包含模板详情" valuePropName="checked">
            <Select mode="multiple" placeholder="选择要包含的内容">
              <Select.Option value="templates">券模板详情</Select.Option>
              <Select.Option value="orders">订单详情</Select.Option>
              <Select.Option value="audit">审计追踪</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="预算详情"
        open={!!selectedBudget}
        onCancel={() => setSelectedBudget(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedBudget(null)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedBudget && (
          <div>
            <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="预算名称">
                  {selectedBudget.name}
                </Descriptions.Item>
                <Descriptions.Item label="周期类型">
                  {(() => {
                    const typeMap: Record<string, string> = {
                      monthly: '月度',
                      quarterly: '季度',
                      yearly: '年度',
                      custom: '自定义'
                    };
                    return typeMap[selectedBudget.periodType] || selectedBudget.periodType;
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="总预算">
                  <span style={{ fontSize: 16, fontWeight: 'bold' }}>
                    ¥{selectedBudget.totalBudget.toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="已使用">
                  <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                    ¥{selectedBudget.usedBudget.toLocaleString()}
                    <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>
                      ({((selectedBudget.usedBudget / selectedBudget.totalBudget) * 100).toFixed(1)}%)
                    </span>
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="剩余预算">
                  <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                    ¥{selectedBudget.remainingBudget.toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  {(() => {
                    const statusMap: Record<string, { color: string; text: string }> = {
                      active: { color: 'green', text: '活跃' },
                      suspended: { color: 'orange', text: '暂停' },
                      expired: { color: 'default', text: '已过期' },
                      depleted: { color: 'red', text: '已耗尽' }
                    };
                    const badge = statusMap[selectedBudget.status] || { color: 'default', text: selectedBudget.status };
                    return <Tag color={badge.color}>{badge.text}</Tag>;
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="开始日期" span={2}>
                  {dayjs(selectedBudget.startDate).format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label="结束日期" span={2}>
                  {dayjs(selectedBudget.endDate).format('YYYY-MM-DD')}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="使用进度">
              <Progress
                percent={Math.round((selectedBudget.usedBudget / selectedBudget.totalBudget) * 100)}
                status={selectedBudget.usedBudget / selectedBudget.totalBudget > 0.9 ? 'exception' : 'active'}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': selectedBudget.usedBudget / selectedBudget.totalBudget > 0.9 ? '#ff4d4f' : '#87d068'
                }}
              />
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={8}>
                  <Statistic title="已分配" value={selectedBudget.allocatedBudget} prefix="¥" precision={2} />
                </Col>
                <Col span={8}>
                  <Statistic title="已使用" value={selectedBudget.usedBudget} prefix="¥" precision={2} />
                </Col>
                <Col span={8}>
                  <Statistic title="剩余" value={selectedBudget.remainingBudget} prefix="¥" precision={2} />
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FinancePage;
