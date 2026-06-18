import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Input,
  Select,
  Modal,
  message,
  Spin,
  Table,
  Statistic,
  Empty,
  Tooltip,
} from 'antd';
import {
  PayCircleOutlined,
  ReloadOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
  BankOutlined,
  RiseOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { supportApi, workerApi } from '../../api';
import { SalaryRecord, Worker } from '../../types';

const { Option } = Select;

const SalaryStatusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待发放', color: 'orange' },
  processing: { text: '处理中', color: 'blue' },
  paid: { text: '已发放', color: 'green' },
  failed: { text: '发放失败', color: 'red' },
};

interface SalaryStats {
  pending_total: number;
  paid_total: number;
  total_count: number;
  pending_count: number;
  paid_count: number;
  failed_count: number;
}

export default function SalaryList() {
  const [loading, setLoading] = useState(false);
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [stats, setStats] = useState<SalaryStats>({
    pending_total: 0,
    paid_total: 0,
    total_count: 0,
    pending_count: 0,
    paid_count: 0,
    failed_count: 0,
  });

  const [filterWorkerId, setFilterWorkerId] = useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);

  const [payLoading, setPayLoading] = useState<string | null>(null);
  const [workerOptions, setWorkerOptions] = useState<Worker[]>([]);

  useEffect(() => {
    fetchSalaries();
  }, [page, pageSize, filterWorkerId, filterStatus]);

  useEffect(() => {
    loadWorkerOptions();
  }, []);

  const loadWorkerOptions = async () => {
    try {
      const result = await workerApi.list({ page: 1, pageSize: 200 });
      setWorkerOptions(result.list || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize,
      };
      if (filterWorkerId) {
        params.worker_id = filterWorkerId;
      }
      if (filterStatus) {
        params.status = filterStatus;
      }
      const result = await supportApi.salaries(params);
      setSalaries(result.list || []);
      setTotal(result.total || 0);
      if (result.stats) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = (record: SalaryRecord) => {
    Modal.confirm({
      title: '确认发放薪资',
      content: (
        <div>
          <p>确认向 <strong>{record.worker_name}</strong> 发放薪资？</p>
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col span={12}>
              <div style={{ color: '#666', fontSize: 12 }}>发放金额</div>
              <div style={{ color: '#fa8c16', fontSize: 18, fontWeight: 700 }}>
                ¥{record.amount.toLocaleString()}
              </div>
            </Col>
            <Col span={12}>
              <div style={{ color: '#666', fontSize: 12 }}>收款银行卡</div>
              <div style={{ color: '#333', fontSize: 13, fontWeight: 500 }}>
                {record.bank_name} ({record.bank_card})
              </div>
            </Col>
          </Row>
        </div>
      ),
      okText: '确认发放',
      okButtonProps: { type: 'primary' as const },
      cancelText: '取消',
      onOk: async () => {
        setPayLoading(record.id);
        try {
          await supportApi.paySalary(record.id);
          message.success('薪资发放成功');
          fetchSalaries();
        } catch (error) {
          console.error(error);
        } finally {
          setPayLoading(null);
        }
      },
    });
  };

  const maskBankCard = (card: string) => {
    if (!card) return '-';
    if (card.length <= 4) return card;
    return `****${card.slice(-4)}`;
  };

  const columns = [
    {
      title: '记录号',
      dataIndex: 'id',
      key: 'id',
      width: 180,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', color: '#1677ff' }}>{text}</span>
      ),
    },
    {
      title: '阿姨姓名',
      dataIndex: 'worker_name',
      key: 'worker_name',
      width: 130,
      render: (text: string) => (
        <Space>
          <UserOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontWeight: 500 }}>{text || '-'}</span>
        </Space>
      ),
    },
    {
      title: '关联订单',
      dataIndex: 'order_title',
      key: 'order_title',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Space size={4}>
          <ShoppingCartOutlined style={{ color: '#13c2c2' }} />
          <span style={{ fontSize: 13 }}>{text || '-'}</span>
        </Space>
      ),
    },
    {
      title: '发放金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right' as const,
      sorter: (a: SalaryRecord, b: SalaryRecord) => a.amount - b.amount,
      render: (val: number) => (
        <span style={{ color: '#fa8c16', fontWeight: 700, fontSize: 15 }}>
          ¥{val?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      title: '收款银行',
      key: 'bank',
      width: 200,
      render: (_: any, record: SalaryRecord) => (
        <Space>
          <BankOutlined style={{ color: '#722ed1' }} />
          <div>
            <div style={{ fontSize: 13, color: '#333' }}>{record.bank_name}</div>
            <div style={{ fontSize: 11, color: '#999', fontFamily: 'monospace' }}>
              {maskBankCard(record.bank_card)}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => {
        const info = SalaryStatusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color} style={{ padding: '3px 10px' }}>{info.text}</Tag>;
      },
    },
    {
      title: '流水号',
      dataIndex: 'transaction_id',
      key: 'transaction_id',
      width: 200,
      render: (text: string) => (
        text ? (
          <Tooltip title={text}>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#666' }}>
              {text}
            </span>
          </Tooltip>
        ) : (
          <span style={{ color: '#ccc' }}>-</span>
        )
      ),
    },
    {
      title: '发放时间',
      dataIndex: 'paid_at',
      key: 'paid_at',
      width: 170,
      render: (text: string) => (
        text ? (
          <Space size={4}>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span style={{ fontSize: 13 }}>{text}</span>
          </Space>
        ) : (
          <Space size={4} style={{ color: '#999' }}>
            <ClockCircleOutlined />
            <span style={{ fontSize: 13 }}>待发放</span>
          </Space>
        )
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: SalaryRecord) => (
        record.status === 'pending' ? (
          <Button
            type="primary"
            size="small"
            icon={<SendOutlined />}
            loading={payLoading === record.id}
            onClick={() => handlePay(record)}
          >
            发放
          </Button>
        ) : null
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card
        className="card-hover"
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: 0 }}
        title={
          <Space>
            <PayCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>薪资代发管理</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchSalaries()}>
              刷新
            </Button>
          </Space>
        }
      >
        <div style={{ padding: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Card
                className="card-hover"
                style={{
                  background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
                  borderColor: '#ffd591',
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <WalletOutlined style={{ color: '#fa8c16' }} />
                      <span>待发总额</span>
                    </Space>
                  }
                  value={stats.pending_total}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#fa8c16', fontWeight: 700 }}
                  suffix={
                    <span style={{ fontSize: 12, color: '#999', fontWeight: 400 }}>
                      ({stats.pending_count} 笔)
                    </span>
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card
                className="card-hover"
                style={{
                  background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
                  borderColor: '#b7eb8f',
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <span>已发总额</span>
                    </Space>
                  }
                  value={stats.paid_total}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#52c41a', fontWeight: 700 }}
                  suffix={
                    <span style={{ fontSize: 12, color: '#999', fontWeight: 400 }}>
                      ({stats.paid_count} 笔)
                    </span>
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Card
                className="card-hover"
                style={{
                  background: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)',
                  borderColor: '#91caff',
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <RiseOutlined style={{ color: '#1677ff' }} />
                      <span>总笔数</span>
                    </Space>
                  }
                  value={stats.total_count}
                  valueStyle={{ color: '#1677ff', fontWeight: 700 }}
                  suffix={
                    <span style={{ fontSize: 12, color: '#999', fontWeight: 400 }}>
                      笔
                      {stats.failed_count > 0 && (
                        <Tag color="red" style={{ marginLeft: 8 }}>
                          失败 {stats.failed_count}
                        </Tag>
                      )}
                    </span>
                  }
                />
              </Card>
            </Col>
          </Row>
        </div>
      </Card>

      <Card
        className="card-hover"
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ padding: 16 }}>
          <Card
            size="small"
            className="card-hover"
            style={{ marginBottom: 16 }}
            bodyStyle={{ padding: 12 }}
          >
            <Row gutter={16} align="middle">
              <Col xs={24} sm={12}>
                <Space>
                  <FilterOutlined style={{ color: '#999' }} />
                  <span style={{ color: '#666' }}>阿姨：</span>
                  <Select
                    placeholder="全部阿姨"
                    allowClear
                    style={{ width: 200 }}
                    showSearch
                    optionFilterProp="children"
                    value={filterWorkerId}
                    onChange={(val) => {
                      setFilterWorkerId(val);
                      setPage(1);
                    }}
                  >
                    {workerOptions.map((w) => (
                      <Option key={w.id} value={w.id}>
                        {w.name} - {w.phone}
                      </Option>
                    ))}
                  </Select>
                </Space>
              </Col>
              <Col xs={24} sm={12}>
                <Space>
                  <span style={{ color: '#666' }}>状态：</span>
                  <Select
                    placeholder="全部状态"
                    allowClear
                    style={{ width: 160 }}
                    value={filterStatus}
                    onChange={(val) => {
                      setFilterStatus(val);
                      setPage(1);
                    }}
                  >
                    {Object.entries(SalaryStatusMap).map(([key, val]) => (
                      <Option key={key} value={key}>
                        <Tag color={val.color}>{val.text}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Space>
              </Col>
            </Row>
          </Card>

          <Spin spinning={loading}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={salaries}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条`,
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                },
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无薪资记录"
                  />
                ),
              }}
              scroll={{ x: 1400 }}
            />
          </Spin>
        </div>
      </Card>
    </div>
  );
}
