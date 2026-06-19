import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Tag,
  Select,
  DatePicker,
  Button,
  Space,
  Statistic,
  Modal,
  Descriptions,
  message,
  InputNumber,
  Form,
} from 'antd';
import {
  SearchOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { incomeApi, riderApi } from '../api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

function Income() {
  const [riderList, setRiderList] = useState<any[]>([]);
  const [selectedRider, setSelectedRider] = useState<number | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [summary, setSummary] = useState<any>({});
  const [balance, setBalance] = useState(0);
  const [detailModal, setDetailModal] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    loadRiders();
  }, []);

  useEffect(() => {
    if (selectedRider) {
      loadIncomeData();
      loadSummary();
      loadBalance();
    }
  }, [selectedRider, page, pageSize, filterType]);

  const loadRiders = async () => {
    try {
      const result: any = await riderApi.getList({ pageSize: 100 });
      setRiderList(result.list || []);
      if (result.list && result.list.length > 0) {
        setSelectedRider(result.list[0].id);
      }
    } catch (e) {
      message.error('加载骑士列表失败');
    }
  };

  const loadIncomeData = async () => {
    if (!selectedRider) return;
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (filterType) params.type = filterType;
      const result: any = await incomeApi.getRiderList(selectedRider, params);
      setData(result.list || []);
      setTotal(result.total || 0);
    } catch (e) {
      message.error('加载收入明细失败');
    }
    setLoading(false);
  };

  const loadSummary = async () => {
    if (!selectedRider) return;
    try {
      const result: any = await incomeApi.getSummary(selectedRider, 7);
      setSummary(result || {});
    } catch (e) {
      console.error('加载汇总失败');
    }
  };

  const loadBalance = async () => {
    if (!selectedRider) return;
    try {
      const result: any = await incomeApi.getBalance(selectedRider);
      setBalance(result?.balance || 0);
    } catch (e) {
      console.error('加载余额失败');
    }
  };

  const handleSearch = () => {
    if (!selectedRider) {
      message.warning('请先选择骑士');
      return;
    }
    setPage(1);
    loadIncomeData();
    loadSummary();
    loadBalance();
  };

  const viewDetail = (record: any) => {
    setCurrentRecord(record);
    setDetailModal(true);
  };

  const getTypeTag = (type: string, amount: number) => {
    const isPositive = amount > 0;
    const typeMap: Record<string, { text: string; color: string }> = {
      delivery_fee: { text: '配送费', color: 'blue' },
      tip: { text: '小费', color: 'green' },
      reward: { text: '奖励', color: 'gold' },
      platform_commission: { text: '平台抽成', color: 'orange' },
      insurance: { text: '保险扣费', color: 'purple' },
      penalty: { text: '处罚扣款', color: 'red' },
      withdraw: { text: '提现', color: 'default' },
    };
    const info = typeMap[type] || { text: type, color: 'default' };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (t: number) => dayjs.unix(t).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (v: string, record: any) => getTypeTag(v, record.amount),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (v: number) => (
        <span style={{ color: v >= 0 ? '#52c41a' : '#f5222d', fontWeight: 500 }}>
          {v >= 0 ? '+' : ''}
          {v.toFixed(2)}
        </span>
      ),
    },
    {
      title: '账户余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      render: (v: number) => `¥${v.toFixed(2)}`,
    },
    {
      title: '平台抽成',
      dataIndex: 'platform_commission',
      key: 'platform_commission',
      width: 100,
      render: (v: number) => (v > 0 ? `¥${v.toFixed(2)}` : '-'),
    },
    {
      title: '保险扣费',
      dataIndex: 'insurance_fee',
      key: 'insurance_fee',
      width: 100,
      render: (v: number) => (v > 0 ? `¥${v.toFixed(2)}` : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => viewDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  const summaryOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '收入构成',
        type: 'pie',
        radius: ['40%', '65%'],
        data: [
          { value: summary.delivery_fee || 0, name: '配送费', itemStyle: { color: '#1890ff' } },
          { value: summary.tips || 0, name: '小费', itemStyle: { color: '#52c41a' } },
          { value: summary.rewards || 0, name: '奖励', itemStyle: { color: '#faad14' } },
          { value: summary.deductions || 0, name: '扣款', itemStyle: { color: '#f5222d' } },
        ],
      },
    ],
  };

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="账户余额"
              value={balance}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="近7日总收入"
              value={summary.total_income || 0}
              precision={2}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="近7日完成订单"
              value={summary.order_count || 0}
              suffix="单"
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="近7日扣款合计"
              value={summary.deductions || 0}
              precision={2}
              prefix={<ArrowDownOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card title="收入构成分析">
            <ReactECharts option={summaryOption} style={{ height: 250 }} />
          </Card>
        </Col>
        <Col span={16}>
          <Card>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Select
                  placeholder="选择骑士"
                  style={{ width: '100%' }}
                  value={selectedRider || undefined}
                  onChange={(v) => {
                    setSelectedRider(v);
                    setPage(1);
                  }}
                >
                  {riderList.map((r) => (
                    <Option key={r.id} value={r.id}>
                      {r.name} - {r.phone}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={6}>
                <Select
                  placeholder="收支类型"
                  allowClear
                  style={{ width: '100%' }}
                  value={filterType || undefined}
                  onChange={(v) => {
                    setFilterType(v || '');
                    setPage(1);
                  }}
                >
                  <Option value="delivery_fee">配送费</Option>
                  <Option value="tip">小费</Option>
                  <Option value="reward">奖励</Option>
                  <Option value="platform_commission">平台抽成</Option>
                  <Option value="insurance">保险扣费</Option>
                  <Option value="penalty">处罚扣款</Option>
                </Select>
              </Col>
              <Col span={6}>
                <RangePicker style={{ width: '100%' }} />
              </Col>
              <Col span={4}>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  查询
                </Button>
              </Col>
            </Row>

            <Table
              columns={columns}
              dataSource={data}
              rowKey="id"
              loading={loading}
              size="small"
              scroll={{ x: 900 }}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showTotal: (t) => `共 ${t} 条记录`,
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                },
              }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="收支明细详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={<Button onClick={() => setDetailModal(false)}>关闭</Button>}
        width={600}
      >
        {currentRecord && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="类型">
              {getTypeTag(currentRecord.type, currentRecord.amount)}
            </Descriptions.Item>
            <Descriptions.Item label="金额">
              <span style={{ color: currentRecord.amount >= 0 ? '#52c41a' : '#f5222d' }}>
                {currentRecord.amount >= 0 ? '+' : ''}
                ¥{currentRecord.amount.toFixed(2)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="账户余额" span={2}>
              ¥{currentRecord.balance.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>
              {currentRecord.description || '-'}
            </Descriptions.Item>
            {currentRecord.order_id && (
              <Descriptions.Item label="关联订单" span={2}>
                订单#{currentRecord.order_id}
              </Descriptions.Item>
            )}
            {currentRecord.platform_commission > 0 && (
              <Descriptions.Item label="平台抽成">
                ¥{currentRecord.platform_commission.toFixed(2)}
              </Descriptions.Item>
            )}
            {currentRecord.insurance_fee > 0 && (
              <Descriptions.Item label="保险扣费">
                ¥{currentRecord.insurance_fee.toFixed(2)}
              </Descriptions.Item>
            )}
            {currentRecord.reward_type && (
              <Descriptions.Item label="奖励类型">{currentRecord.reward_type}</Descriptions.Item>
            )}
            <Descriptions.Item label="发生时间" span={2}>
              {dayjs.unix(currentRecord.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default Income;
