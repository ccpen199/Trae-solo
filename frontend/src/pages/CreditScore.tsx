import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Tag,
  Select,
  Button,
  Space,
  Modal,
  Descriptions,
  message,
  Progress,
  Form,
  InputNumber,
  Input,
  List,
  Avatar,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  StarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TrophyOutlined,
  WarningOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { creditApi, riderApi } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

function CreditScore() {
  const [riderList, setRiderList] = useState<any[]>([]);
  const [selectedRider, setSelectedRider] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [creditLevel, setCreditLevel] = useState<any>(null);
  const [riderDetail, setRiderDetail] = useState<any>(null);
  const [adjustModal, setAdjustModal] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRiders();
  }, []);

  useEffect(() => {
    if (selectedRider) {
      loadCreditData();
    }
  }, [selectedRider, page, pageSize]);

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

  const loadCreditData = async () => {
    if (!selectedRider) return;
    setLoading(true);
    try {
      const [histRes, levelRes, riderRes]: any = await Promise.all([
        creditApi.getHistory(selectedRider, { page, pageSize }),
        creditApi.getLevel(selectedRider),
        riderApi.getDetail(selectedRider),
      ]);
      setHistory(histRes.list || []);
      setTotal(histRes.total || 0);
      setCreditLevel(levelRes || {});
      setRiderDetail(riderRes || {});
    } catch (e) {
      message.error('加载信用分数据失败');
    }
    setLoading(false);
  };

  const handleAdjust = async () => {
    try {
      const values = await form.validateFields();
      await creditApi.adjust(selectedRider!, {
        change_amount: values.change_amount,
        change_type: values.change_type,
        reason: values.reason,
      });
      message.success('信用分调整成功');
      setAdjustModal(false);
      loadCreditData();
      loadRiders();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error('调整失败');
    }
  };

  const getChangeTypeText = (type: string) => {
    const map: Record<string, string> = {
      on_time_delivery: '准时送达',
      good_review: '好评奖励',
      complaint: '申诉扣减',
      reward: '活动奖励',
      penalty: '处罚扣减',
      manual: '人工调整',
    };
    return map[type] || type;
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (t: number) => dayjs.unix(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '变动类型',
      dataIndex: 'change_type',
      key: 'change_type',
      width: 120,
      render: (v: string) => <Tag>{getChangeTypeText(v)}</Tag>,
    },
    {
      title: '变动值',
      dataIndex: 'change_amount',
      key: 'change_amount',
      width: 100,
      render: (v: number) => (
        <span style={{ color: v > 0 ? '#52c41a' : '#f5222d', fontWeight: 500 }}>
          {v > 0 ? '+' : ''}
          {v}
        </span>
      ),
    },
    {
      title: '变动前',
      dataIndex: 'before_score',
      key: 'before_score',
      width: 100,
    },
    {
      title: '变动后',
      dataIndex: 'after_score',
      key: 'after_score',
      width: 100,
    },
    {
      title: '原因说明',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (v: string) => v || '-',
    },
  ];

  const scoreDistribution = [
    { range: '90-100', label: 'S级 金牌骑士', count: 0, color: '#FFD700' },
    { range: '80-89', label: 'A级 优质骑士', count: 0, color: '#C0C0C0' },
    { range: '70-79', label: 'B级 普通骑士', count: 0, color: '#CD7F32' },
    { range: '60-69', label: 'C级 观察骑士', count: 0, color: '#FF6B6B' },
    { range: '0-59', label: 'D级 封禁', count: 0, color: '#333' },
  ];

  riderList.forEach((rider) => {
    if (rider.credit_score >= 90) scoreDistribution[0].count++;
    else if (rider.credit_score >= 80) scoreDistribution[1].count++;
    else if (rider.credit_score >= 70) scoreDistribution[2].count++;
    else if (rider.credit_score >= 60) scoreDistribution[3].count++;
    else scoreDistribution[4].count++;
  });

  const distributionOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: scoreDistribution.map((d) => d.label),
      axisLabel: { rotate: 0, fontSize: 11 },
    },
    yAxis: { type: 'value', name: '人数' },
    series: [
      {
        type: 'bar',
        data: scoreDistribution.map((d) => ({
          value: d.count,
          itemStyle: { color: d.color },
        })),
        barWidth: '50%',
      },
    ],
  };

  const trendOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: history.map((d) => dayjs.unix(d.created_at).format('MM-DD HH:mm')),
    },
    yAxis: { type: 'value', min: 0, max: 100, name: '信用分' },
    series: [
      {
        name: '信用分',
        type: 'line',
        smooth: true,
        data: history.map((d) => d.after_score),
        itemStyle: { color: '#1677ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
              { offset: 1, color: 'rgba(22, 119, 255, 0.05)' },
            ],
          },
        },
        markLine: {
          data: [{ yAxis: 80, label: { formatter: '优秀线' } }],
        },
      },
    ],
  };

  const creditScore = riderDetail?.credit_score || 0;
  const levelInfo = creditLevel?.level || {};

  return (
    <div>
      <Row gutter={16}>
        <Col span={8}>
          <Card title="骑士信用分分布">
            <ReactECharts option={distributionOption} style={{ height: 250 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="选择骑士">
            <Select
              showSearch
              placeholder="搜索骑士"
              style={{ width: '100%' }}
              value={selectedRider || undefined}
              onChange={(v) => {
                setSelectedRider(v);
                setPage(1);
              }}
              optionFilterProp="children"
            >
              {riderList.map((r) => (
                <Option key={r.id} value={r.id}>
                  {r.name} - {r.phone} (信用分: {r.credit_score})
                </Option>
              ))}
            </Select>

            {riderDetail && (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Avatar size={64} icon={<TeamOutlined />} />
                <div style={{ marginTop: 8, fontSize: 16, fontWeight: 500 }}>
                  {riderDetail.name}
                </div>
                <div style={{ color: '#666', fontSize: 13 }}>{riderDetail.phone}</div>

                <div style={{ marginTop: 16 }}>
                  <Progress
                    type="dashboard"
                    percent={creditScore}
                    strokeColor={{
                      '0%': '#52c41a',
                      '50%': '#faad14',
                      '100%': '#f5222d',
                    }}
                  />
                  <div style={{ fontSize: 28, fontWeight: 'bold', marginTop: -20 }}>
                    {creditScore}
                  </div>
                </div>

                {levelInfo && (
                  <Tag color={levelInfo.color} style={{ fontSize: 14, padding: '4px 12px' }}>
                    <TrophyOutlined /> {levelInfo.level}
                  </Tag>
                )}

                <Button
                  type="primary"
                  block
                  style={{ marginTop: 16 }}
                  icon={<StarOutlined />}
                  onClick={() => setAdjustModal(true)}
                >
                  人工调分
                </Button>
              </div>
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="等级权益说明">
            <List
              size="small"
              dataSource={[
                {
                  level: 'S级 金牌骑士',
                  color: '#FFD700',
                  benefits: ['优先派单权', '高额奖励系数', '保险补贴', '专属客服通道'],
                },
                {
                  level: 'A级 优质骑士',
                  color: '#C0C0C0',
                  benefits: ['优先派单权', '奖励加成10%'],
                },
                {
                  level: 'B级 普通骑士',
                  color: '#CD7F32',
                  benefits: ['正常派单', '基础奖励'],
                },
                {
                  level: 'C级 观察骑士',
                  color: '#FF6B6B',
                  benefits: ['限制派单数量', '需参加培训'],
                },
                {
                  level: 'D级 封禁',
                  color: '#333',
                  benefits: ['暂停接单权限'],
                },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: item.color,
                          display: 'inline-block',
                        }}
                      />
                      <span style={{ fontWeight: 500 }}>{item.level}</span>
                    </Space>
                    <Space wrap>
                      {item.benefits.map((b, i) => (
                        <Tag key={i}>
                          {b}
                        </Tag>
                      ))}
                    </Space>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="信用分变动趋势">
            <ReactECharts option={trendOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="升降分规则">
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ color: '#52c41a', fontWeight: 500, marginBottom: 8 }}>
                  <ArrowUpOutlined /> 加分规则
                </div>
                <List size="small" dataSource={[
                  '准时送达: +1分/单',
                  '客户好评: +2分/次',
                  '月度满勤: +10分',
                  '无申诉记录: +5分/月',
                ]} renderItem={(item) => (
                  <List.Item style={{ paddingLeft: 8 }}>
                    <span style={{ color: '#52c41a' }}>+</span> {item}
                  </List.Item>
                )} />
              </Col>
              <Col span={12}>
                <div style={{ color: '#f5222d', fontWeight: 500, marginBottom: 8 }}>
                  <ArrowDownOutlined /> 扣分规则
                </div>
                <List size="small" dataSource={[
                  '超时配送: -5分/次',
                  '丢件: -20分/次',
                  '差评申诉成立: -3分/次',
                  '拒单: 降低意愿系数',
                  '服务投诉: -10分/次',
                ]} renderItem={(item) => (
                  <List.Item style={{ paddingLeft: 8 }}>
                    <span style={{ color: '#f5222d' }}>-</span> {item}
                  </List.Item>
                )} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card title="信用分变动记录" style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={history}
          rowKey="id"
          loading={loading}
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

      <Modal
        title="人工调整信用分"
        open={adjustModal}
        onCancel={() => setAdjustModal(false)}
        onOk={handleAdjust}
        okText="确认调整"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="change_type"
            label="调整类型"
            rules={[{ required: true, message: '请选择调整类型' }]}
          >
            <Select>
              <Option value="reward">奖励加分</Option>
              <Option value="penalty">处罚扣分</Option>
              <Option value="manual">人工调整</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="change_amount"
            label="调整分值"
            rules={[{ required: true, message: '请输入调整分值' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="正数加分，负数扣分" />
          </Form.Item>
          <Form.Item
            name="reason"
            label="调整原因"
            rules={[{ required: true, message: '请输入调整原因' }]}
          >
            <TextArea rows={4} placeholder="请输入调整原因..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default CreditScore;
