import { useState, useEffect } from 'react';
import { Tabs, Card, Table, Statistic, Row, Col, Tag, Empty } from 'antd';
import {
  BankOutlined,
  WalletOutlined,
  RiseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { benefitApi, type MedicalRecord } from '@/lib/api';
import type { PensionPayment } from '@shared/types';

const mockPensionList: PensionPayment[] = [
  {
    id: 1,
    userId: 1,
    payMonth: '2024-03',
    amount: 3250.5,
    bankName: '中国工商银行',
    bankAccount: '6222 **** 1234',
    status: 'paid',
    paidAt: '2024-03-15 09:30:00',
  },
  {
    id: 2,
    userId: 1,
    payMonth: '2024-02',
    amount: 3250.5,
    bankName: '中国工商银行',
    bankAccount: '6222 **** 1234',
    status: 'paid',
    paidAt: '2024-02-15 10:15:00',
  },
  {
    id: 3,
    userId: 1,
    payMonth: '2024-01',
    amount: 3250.5,
    bankName: '中国工商银行',
    bankAccount: '6222 **** 1234',
    status: 'paid',
    paidAt: '2024-01-15 08:45:00',
  },
  {
    id: 4,
    userId: 1,
    payMonth: '2023-12',
    amount: 3180.0,
    bankName: '中国工商银行',
    bankAccount: '6222 **** 1234',
    status: 'paid',
    paidAt: '2023-12-15 09:00:00',
  },
  {
    id: 5,
    userId: 1,
    payMonth: '2023-11',
    amount: 3180.0,
    bankName: '中国工商银行',
    bankAccount: '6222 **** 1234',
    status: 'paid',
    paidAt: '2023-11-15 11:20:00',
  },
];

const mockMedicalRecords: MedicalRecord[] = [
  {
    id: 1,
    type: 'income',
    amount: 156.8,
    description: '医保个人账户划拨',
    date: '2024-03-01',
  },
  {
    id: 2,
    type: 'expense',
    amount: 258.5,
    description: '门诊费用',
    hospital: '湘雅医院',
    date: '2024-03-10',
  },
  {
    id: 3,
    type: 'expense',
    amount: 89.0,
    description: '药品费用',
    hospital: '益丰大药房',
    date: '2024-03-08',
  },
  {
    id: 4,
    type: 'income',
    amount: 156.8,
    description: '医保个人账户划拨',
    date: '2024-02-01',
  },
  {
    id: 5,
    type: 'expense',
    amount: 1280.0,
    description: '住院费用',
    hospital: '湖南省人民医院',
    date: '2024-02-20',
  },
];

const pensionStatusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'gold', text: '待发放' },
  paid: { color: 'success', text: '已发放' },
  failed: { color: 'error', text: '发放失败' },
};

const getPageList = <T,>(data: unknown): T[] => {
  if (data && typeof data === 'object') {
    const value = data as { list?: T[]; items?: T[] };
    return value.list || value.items || [];
  }
  return [];
};

const BenefitPage = () => {
  const [pensionList, setPensionList] = useState<PensionPayment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [pensionStats, setPensionStats] = useState({
    totalAmount: 12861.0,
    currentMonthAmount: 3250.5,
    averageAmount: 3215.25,
  });
  const [medicalBalance, setMedicalBalance] = useState({
    balance: 2568.3,
    lastUpdate: '2024-03-10',
  });

  useEffect(() => {
    fetchPensionData();
    fetchMedicalData();
  }, []);

  const fetchPensionData = async () => {
    try {
      setLoading(true);
      const res = await benefitApi.getPensionList();
      if (res?.success && res.data) {
        setPensionList(getPageList<PensionPayment>(res.data));
      } else {
        setPensionList(mockPensionList);
      }

      const statsRes = await benefitApi.getPensionStats();
      if (statsRes?.success && statsRes.data) {
        setPensionStats(statsRes.data);
      }
    } catch {
      setPensionList(mockPensionList);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicalData = async () => {
    try {
      const res = await benefitApi.getMedicalRecords();
      if (res?.success && res.data) {
        setMedicalRecords(getPageList<MedicalRecord>(res.data));
      } else {
        setMedicalRecords(mockMedicalRecords);
      }

      const balanceRes = await benefitApi.getMedicalBalance();
      if (balanceRes?.success && balanceRes.data) {
        setMedicalBalance(balanceRes.data);
      }
    } catch {
      setMedicalRecords(mockMedicalRecords);
    }
  };

  const pensionColumns = [
    {
      title: '发放月份',
      dataIndex: 'payMonth',
      key: 'payMonth',
      render: (val: string) => <span className="font-medium">{val}</span>,
    },
    {
      title: '发放金额(元)',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => (
        <span className="text-success font-semibold">¥{val.toLocaleString()}</span>
      ),
    },
    {
      title: '发放银行',
      dataIndex: 'bankName',
      key: 'bankName',
    },
    {
      title: '银行账户',
      dataIndex: 'bankAccount',
      key: 'bankAccount',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => (
        <Tag color={pensionStatusMap[val].color}>{pensionStatusMap[val].text}</Tag>
      ),
    },
    {
      title: '到账时间',
      dataIndex: 'paidAt',
      key: 'paidAt',
    },
  ];

  const medicalColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (val: string) => (
        <Tag color={val === 'income' ? 'success' : 'warning'}>
          {val === 'income' ? '入账' : '消费'}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '医疗机构',
      dataIndex: 'hospital',
      key: 'hospital',
      render: (val: string) => val || '-',
    },
    {
      title: '金额(元)',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number, record: MedicalRecord) => (
        <span
          className={`font-semibold ${
            record.type === 'income' ? 'text-success' : 'text-warning'
          }`}
        >
          {record.type === 'income' ? '+' : '-'}¥{val.toLocaleString()}
        </span>
      ),
    },
  ];

  const pensionTab = (
    <div className="space-y-6">
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card className="shadow-sm">
            <Statistic
              title="累计发放总额"
              value={pensionStats.totalAmount}
              precision={2}
              prefix={<WalletOutlined className="text-primary" />}
              suffix="元"
              className="text-primary"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="shadow-sm">
            <Statistic
              title="本月发放"
              value={pensionStats.currentMonthAmount}
              precision={2}
              prefix={<BankOutlined className="text-success" />}
              suffix="元"
              className="text-success"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="shadow-sm">
            <Statistic
              title="月均发放"
              value={pensionStats.averageAmount}
              precision={2}
              prefix={<RiseOutlined className="text-gold" />}
              suffix="元"
              className="text-gold"
            />
          </Card>
        </Col>
      </Row>

      <Card title="月度发放记录" className="shadow-sm">
        <Table
          columns={pensionColumns}
          dataSource={pensionList}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );

  const medicalTab = (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm mb-1">医保个人账户余额</p>
            <p className="text-3xl font-bold text-primary">
              ¥{medicalBalance.balance.toLocaleString()}
            </p>
            <p className="text-gray-400 text-xs mt-2">更新时间: {medicalBalance.lastUpdate}</p>
          </div>
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <WalletOutlined className="text-4xl text-primary" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <ArrowUpOutlined className="text-success" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">本月入账</p>
              <p className="font-semibold text-success">+¥313.6</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
              <ArrowDownOutlined className="text-warning" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">本月支出</p>
              <p className="font-semibold text-warning">-¥347.5</p>
            </div>
          </div>
        </div>
      </Card>

      <Card title="账户明细" className="shadow-sm">
        {medicalRecords.length > 0 ? (
          <Table
            columns={medicalColumns}
            dataSource={medicalRecords}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <Empty description="暂无账户明细" />
        )}
      </Card>
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">待遇发放中心</h2>
      <Tabs
        defaultActiveKey="pension"
        items={[
          {
            key: 'pension',
            label: (
              <span>
                <BankOutlined /> 养老金发放
              </span>
            ),
            children: pensionTab,
          },
          {
            key: 'medical',
            label: (
              <span>
                <WalletOutlined /> 医保账户
              </span>
            ),
            children: medicalTab,
          },
        ]}
        size="large"
        className="benefit-tabs"
      />
    </div>
  );
};

export default BenefitPage;
