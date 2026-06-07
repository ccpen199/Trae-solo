import React, { useState, useMemo } from 'react';
import {
  Table,
  Form,
  Input,
  Select,
  Button,
  Modal,
  Tag,
  Card,
  Statistic,
  DatePicker,
  Timeline,
  Row,
  Col,
  Space,
  message,
  Popconfirm,
  InputNumber,
  Divider,
  Tabs,
  List,
  Tooltip,
  Alert,
} from 'antd';
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  SearchOutlined,
  CalculatorOutlined,
  RiseOutlined,
  TeamOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  FilterOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { adminApi } from '../../api';
import type { Commission, CommissionStats, Broker, Store, AuditRecord } from '../../types';
import type { ColumnsType, TableRowSelection } from 'antd/es/table/interface';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface FilterParams {
  broker_id?: number;
  store_id?: number;
  status?: 'pending' | 'settled' | 'rejected';
  deal_date_start?: string;
  deal_date_end?: string;
  min_amount?: number;
  max_amount?: number;
  page?: number;
  pageSize?: number;
}

const CommissionManagementPage: React.FC = () => {
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState<FilterParams>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [settleModalVisible, setSettleModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [currentCommission, setCurrentCommission] = useState<Commission | null>(null);
  const [batchMode, setBatchMode] = useState(false);

  const { data: brokersData } = useRequest(() => adminApi.getBrokers());
  const brokers = brokersData?.data || [];

  const { data: storesData } = useRequest(() => adminApi.getStores());
  const stores = storesData?.data || [];

  const { data: statsData, loading: statsLoading } = useRequest(() =>
    adminApi.getCommissionStats()
  );
  const stats: CommissionStats = statsData?.data || {
    month_pending: 0,
    month_settled: 0,
    total_commission: 0,
    avg_commission_rate: 0,
  };

  const { data, loading, refresh } = useRequest(
    () =>
      adminApi.getCommissions({
        ...filters,
        page: pagination.current,
        pageSize: pagination.pageSize,
      }),
    {
      refreshDeps: [filters, pagination],
    }
  );

  const commissions = data?.data || [];
  const total = data?.total || 0;

  const rowSelection: TableRowSelection<Commission> = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: record.status !== 'pending',
    }),
  };

  const handleSearch = (values: any) => {
    const newFilters: FilterParams = {
      broker_id: values.broker_id,
      store_id: values.store_id,
      status: values.status,
      min_amount: values.min_amount,
      max_amount: values.max_amount,
    };
    if (values.deal_date_range && values.deal_date_range.length === 2) {
      newFilters.deal_date_start = values.deal_date_range[0].format('YYYY-MM-DD');
      newFilters.deal_date_end = values.deal_date_range[1].format('YYYY-MM-DD');
    }
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({});
    setPagination({ current: 1, pageSize: 10 });
    setSelectedRowKeys([]);
    message.info('筛选条件已重置');
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination({ current: page, pageSize });
  };

  const handleViewDetail = (record: Commission) => {
    setCurrentCommission(record);
    setDetailModalVisible(true);
  };

  const handleOpenSettleModal = (record: Commission) => {
    setCurrentCommission(record);
    setBatchMode(false);
    setSettleModalVisible(true);
  };

  const handleBatchSettle = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要结算的记录');
      return;
    }
    setBatchMode(true);
    setSettleModalVisible(true);
  };

  const handleSettle = async (values: { remark?: string }) => {
    try {
      if (batchMode) {
        await adminApi.batchSettleCommissions({
          ids: selectedRowKeys as number[],
          remark: values.remark,
        });
        message.success(`成功结算 ${selectedRowKeys.length} 条记录`);
      } else if (currentCommission) {
        await adminApi.settleCommission(currentCommission.id, { remark: values.remark });
        message.success('结算成功');
      }
      setSettleModalVisible(false);
      setSelectedRowKeys([]);
      refresh();
    } catch (error) {
      message.error('结算失败，请重试');
    }
  };

  const handleOpenRejectModal = (record: Commission) => {
    setCurrentCommission(record);
    setRejectModalVisible(true);
  };

  const handleReject = async (values: { reason: string }) => {
    if (!currentCommission) return;
    try {
      await adminApi.rejectCommission(currentCommission.id, { reason: values.reason });
      message.success('驳回成功');
      setRejectModalVisible(false);
      refresh();
    } catch (error) {
      message.error('驳回失败，请重试');
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待结算' },
      settled: { color: 'success', text: '已结算' },
      rejected: { color: 'error', text: '已驳回' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getAuditActionText = (action: string) => {
    const actionMap: Record<string, string> = {
      create: '创建佣金记录',
      submit: '提交审核',
      settle: '结算通过',
      reject: '结算驳回',
    };
    return actionMap[action] || action;
  };

  const getAuditActionColor = (action: string) => {
    const colorMap: Record<string, string> = {
      create: 'blue',
      submit: 'orange',
      settle: 'green',
      reject: 'red',
    };
    return colorMap[action] || 'gray';
  };

  const columns: ColumnsType<Commission> = [
    {
      title: '成交编号',
      dataIndex: 'deal_no',
      key: 'deal_no',
      width: 140,
      render: (text) => text || '-',
    },
    {
      title: '房源标题',
      dataIndex: 'property_title',
      key: 'property_title',
      width: 200,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '成交金额',
      dataIndex: 'deal_amount',
      key: 'deal_amount',
      width: 120,
      render: (value) => `¥${value?.toLocaleString() || '-'}`,
    },
    {
      title: '佣金比例',
      dataIndex: 'commission_rate',
      key: 'commission_rate',
      width: 100,
      render: (value) => `${value || 0}%`,
    },
    {
      title: '佣金金额',
      dataIndex: 'commission_amount',
      key: 'commission_amount',
      width: 120,
      render: (value) => <b style={{ color: '#1677ff' }}>¥{value?.toLocaleString() || '-'}</b>,
    },
    {
      title: '经纪人',
      dataIndex: 'broker_name',
      key: 'broker_name',
      width: 100,
      render: (text) => (
        <Space>
          <TeamOutlined style={{ color: '#1677ff' }} />
          {text || '-'}
        </Space>
      ),
    },
    {
      title: '门店',
      dataIndex: 'store_name',
      key: 'store_name',
      width: 150,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Space>
            <ShopOutlined style={{ color: '#722ed1' }} />
            <span>{text || '-'}</span>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: '成交日期',
      dataIndex: 'deal_date',
      key: 'deal_date',
      width: 110,
      render: (text) => text || '-',
    },
    {
      title: '结算状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '结算日期',
      dataIndex: 'settlement_date',
      key: 'settlement_date',
      width: 110,
      render: (text) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => handleOpenSettleModal(record)}
              >
                结算
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CloseOutlined />}
                style={{ color: '#ff4d4f' }}
                onClick={() => handleOpenRejectModal(record)}
              >
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const monthlyTrendOption = useMemo(() => {
    const trend = stats.monthly_trend || [];
    return {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>佣金: ¥{c}',
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: trend.map((item) => item.month),
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => `¥${value / 10000}万`,
        },
      },
      series: [
        {
          name: '佣金金额',
          type: 'line',
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
                { offset: 1, color: 'rgba(22, 119, 255, 0.05)' },
              ],
            },
          },
          lineStyle: { color: '#1677ff', width: 2 },
          itemStyle: { color: '#1677ff' },
          data: trend.map((item) => item.amount),
        },
      ],
    };
  }, [stats.monthly_trend]);

  const brokerRankingOption = useMemo(() => {
    const ranking = stats.broker_ranking || [];
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: '{b}<br/>佣金: ¥{c}',
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ranking.map((item) => item.broker_name),
        axisLabel: { interval: 0, rotate: 0 },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => `¥${value / 10000}万`,
        },
      },
      series: [
        {
          name: '佣金金额',
          type: 'bar',
          barWidth: '50%',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#722ed1' },
                { offset: 1, color: '#9254de' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
          data: ranking.map((item) => item.amount),
        },
      ],
    };
  }, [stats.broker_ranking]);

  const storeDistributionOption = useMemo(() => {
    const distribution = stats.store_distribution || [];
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
      },
      series: [
        {
          name: '门店佣金',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              formatter: '{b}\n{d}%',
            },
          },
          labelLine: {
            show: false,
          },
          data: distribution.map((item, index) => ({
            value: item.amount,
            name: item.store_name,
            itemStyle: {
              color: ['#1677ff', '#722ed1', '#52c41a', '#fa8c16', '#eb2f96', '#13c2c2'][index % 6],
            },
          })),
        },
      ],
    };
  }, [stats.store_distribution]);

  const calculateActualCommission = (commission: Commission) => {
    const base = commission.commission_amount;
    const bonus = commission.performance_bonus || 0;
    const deduction = commission.deduction || 0;
    return base + bonus - deduction;
  };

  return (
    <div style={{ padding: 24, minHeight: 'calc(100vh - 64px)', background: '#f0f2f5' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={statsLoading}>
            <Statistic
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                  本月待结算佣金
                </Space>
              }
              value={stats.month_pending}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={statsLoading}>
            <Statistic
              title={
                <Space>
                  <CheckOutlined style={{ color: '#52c41a' }} />
                  本月已结算佣金
                </Space>
              }
              value={stats.month_settled}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={statsLoading}>
            <Statistic
              title={
                <Space>
                  <DollarOutlined style={{ color: '#1677ff' }} />
                  累计佣金
                </Space>
              }
              value={stats.total_commission}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={statsLoading}>
            <Statistic
              title={
                <Space>
                  <PercentageOutlined style={{ color: '#722ed1' }} />
                  平均佣金率
                </Space>
              }
              value={stats.avg_commission_rate}
              precision={2}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ marginBottom: 16 }}
        title={
          <Space>
            <FilterOutlined />
            筛选条件
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        }
      >
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item name="broker_id" label="经纪人">
            <Select
              placeholder="选择经纪人"
              allowClear
              style={{ width: 150 }}
              showSearch
              optionFilterProp="children"
            >
              {brokers.map((broker: Broker) => (
                <Option key={broker.id} value={broker.id}>
                  {broker.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="store_id" label="门店">
            <Select
              placeholder="选择门店"
              allowClear
              style={{ width: 180 }}
              showSearch
              optionFilterProp="children"
            >
              {stores.map((store: Store) => (
                <Option key={store.id} value={store.id}>
                  {store.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="结算状态">
            <Select placeholder="选择状态" allowClear style={{ width: 130 }}>
              <Option value="pending">待结算</Option>
              <Option value="settled">已结算</Option>
              <Option value="rejected">已驳回</Option>
            </Select>
          </Form.Item>
          <Form.Item name="deal_date_range" label="成交时间">
            <RangePicker style={{ width: 260 }} />
          </Form.Item>
          <Form.Item label="佣金金额">
            <Space>
              <Form.Item name="min_amount" noStyle>
                <InputNumber
                  placeholder="最低"
                  style={{ width: 100 }}
                  min={0}
                  precision={2}
                />
              </Form.Item>
              <span>-</span>
              <Form.Item name="max_amount" noStyle>
                <InputNumber
                  placeholder="最高"
                  style={{ width: 100 }}
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card
        style={{ marginBottom: 16 }}
        title={
          <Space>
            <DollarOutlined />
            佣金列表
          </Space>
        }
        extra={
          <Space>
            <span style={{ color: '#666' }}>
              已选择 <b style={{ color: '#1677ff' }}>{selectedRowKeys.length}</b> 条
            </span>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleBatchSettle}
              disabled={selectedRowKeys.length === 0}
            >
              批量结算
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={commissions}
          rowSelection={rowSelection}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: handlePageChange,
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Card
        title={
          <Space>
            <BarChartOutlined />
            佣金统计分析
          </Space>
        }
      >
        <Tabs defaultActiveKey="trend">
          <TabPane
            tab={
              <Space>
                <LineChartOutlined />
                月度佣金趋势
              </Space>
            }
            key="trend"
          >
            <ReactECharts option={monthlyTrendOption} style={{ height: 400 }} />
          </TabPane>
          <TabPane
            tab={
              <Space>
                <BarChartOutlined />
                经纪人佣金排名
              </Space>
            }
            key="ranking"
          >
            <ReactECharts option={brokerRankingOption} style={{ height: 400 }} />
          </TabPane>
          <TabPane
            tab={
              <Space>
                <PieChartOutlined />
                门店佣金占比
              </Space>
            }
            key="distribution"
          >
            <ReactECharts option={storeDistributionOption} style={{ height: 400 }} />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={
          <Space>
            <CalculatorOutlined />
            佣金详情
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {currentCommission && (
          <div>
            <Card
              size="small"
              title={
                <Space>
                  <RiseOutlined />
                  成交信息
                </Space>
              }
              style={{ marginBottom: 12 }}
            >
              <List
                grid={{ gutter: 16, column: 2 }}
                dataSource={[
                  { label: '成交编号', value: currentCommission.deal_no || '-' },
                  { label: '房源标题', value: currentCommission.property_title || '-' },
                  { label: '客户姓名', value: currentCommission.customer_name || '-' },
                  { label: '客户电话', value: currentCommission.customer_phone || '-' },
                  { label: '成交金额', value: `¥${currentCommission.deal_amount?.toLocaleString()}` },
                  { label: '成交日期', value: currentCommission.deal_date || '-' },
                  { label: '经纪人', value: currentCommission.broker_name || '-' },
                  { label: '门店', value: currentCommission.store_name || '-' },
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <span style={{ color: '#666' }}>{item.label}：</span>
                    <b>{item.value}</b>
                  </List.Item>
                )}
              />
            </Card>

            <Card
              size="small"
              title={
                <Space>
                  <CalculatorOutlined />
                  佣金计算明细
                </Space>
              }
              style={{ marginBottom: 12 }}
            >
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="基础佣金"
                    value={currentCommission.commission_amount}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ fontSize: 16 }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="业绩奖励"
                    value={currentCommission.performance_bonus || 0}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ fontSize: 16, color: '#52c41a' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="扣款"
                    value={currentCommission.deduction || 0}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ fontSize: 16, color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="实发佣金"
                    value={calculateActualCommission(currentCommission)}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ fontSize: 16, color: '#1677ff', fontWeight: 'bold' }}
                  />
                </Col>
              </Row>

              <Divider style={{ margin: '12px 0' }} />

              <div
                style={{
                  padding: 12,
                  background: '#f6ffed',
                  borderRadius: 4,
                  border: '1px solid #b7eb8f',
                }}
              >
                <Space>
                  <CalculatorOutlined style={{ color: '#52c41a' }} />
                  <b style={{ color: '#52c41a' }}>佣金计算公式：</b>
                  <span>
                    佣金 = 成交金额 × 佣金比例 + 业绩奖励 - 扣款
                  </span>
                </Space>
                <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
                  {currentCommission.deal_amount} × {currentCommission.commission_rate}% +{' '}
                  {currentCommission.performance_bonus || 0} - {currentCommission.deduction || 0} ={' '}
                  <b style={{ color: '#1677ff' }}>
                    ¥{calculateActualCommission(currentCommission).toLocaleString()}
                  </b>
                </div>
              </div>
            </Card>

            <Card
              size="small"
              title={
                <Space>
                  <ClockCircleOutlined />
                  审核记录
                </Space>
              }
            >
              <Timeline>
                {(currentCommission.audit_records || []).length > 0 ? (
                  (currentCommission.audit_records || []).map((record: AuditRecord) => (
                    <Timeline.Item
                      key={record.id}
                      color={getAuditActionColor(record.action)}
                    >
                      <div>
                        <b>{getAuditActionText(record.action)}</b>
                        <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
                          {dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss')}
                        </span>
                      </div>
                      <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
                        操作人：{record.operator}
                        {record.remark && (
                          <span style={{ marginLeft: 16 }}>备注：{record.remark}</span>
                        )}
                      </div>
                    </Timeline.Item>
                  ))
                ) : (
                  <Timeline.Item color="gray">暂无审核记录</Timeline.Item>
                )}
              </Timeline>
            </Card>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <CheckOutlined />
            {batchMode ? '批量结算' : '结算佣金'}
          </Space>
        }
        open={settleModalVisible}
        onCancel={() => setSettleModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" onFinish={handleSettle}>
          {batchMode ? (
            <div style={{ marginBottom: 16 }}>
              <Alert
                message={`确认结算选中的 ${selectedRowKeys.length} 条佣金记录？`}
                type="info"
                showIcon
              />
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <p>
                确认结算 <b>{currentCommission?.property_title}</b> 的佣金？
              </p>
              <p>
                佣金金额：<b style={{ color: '#1677ff' }}>
                  ¥{currentCommission?.commission_amount?.toLocaleString()}
                </b>
              </p>
            </div>
          )}
          <Form.Item name="remark" label="结算备注">
            <TextArea rows={3} placeholder="请输入结算备注（可选）" maxLength={200} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setSettleModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" icon={<CheckOutlined />}>
                确认结算
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <CloseOutlined />
            驳回佣金
          </Space>
        }
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" onFinish={handleReject}>
          <div style={{ marginBottom: 16 }}>
            <p>
              确认驳回 <b>{currentCommission?.property_title}</b> 的佣金结算？
            </p>
          </div>
          <Form.Item
            name="reason"
            label="驳回原因"
            rules={[{ required: true, message: '请输入驳回原因' }]}
          >
            <TextArea rows={4} placeholder="请输入驳回原因" maxLength={500} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setRejectModalVisible(false)}>取消</Button>
              <Button type="primary" danger htmlType="submit" icon={<CloseOutlined />}>
                确认驳回
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CommissionManagementPage;
