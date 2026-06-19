import { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Statistic, Row, Col, Table, Tag, Spin, message, Modal, Tree } from 'antd';
import { TeamOutlined, DollarOutlined, PercentageOutlined } from '@ant-design/icons';
import api from '../api';

interface PartnerInfo {
  id: string;
  shopName: string;
  shopType: string;
  commissionRate: number;
  totalEarnings: number;
  level: number;
}

interface ReferralNode {
  title: string;
  key: string;
  level: number;
  children?: ReferralNode[];
}

interface Settlement {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
}

const shopTypeOptions = [
  { value: 'food', label: '食品' },
  { value: 'service', label: '服务' },
  { value: 'daily', label: '日用品' },
  { value: 'digital', label: '数码' },
];

const Partners: React.FC = () => {
  const [partner, setPartner] = useState<PartnerInfo | null>(null);
  const [referralTree, setReferralTree] = useState<ReferralNode[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [settling, setSettling] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partnerRes, treeRes, settlementsRes] = await Promise.all([
          api.get('/partners/me'),
          api.get('/partners/referral-tree'),
          api.get('/partners/settlements'),
        ]);
        setPartner(partnerRes.data);
        setReferralTree(treeRes.data.children || []);
        setSettlements(settlementsRes.data.items || []);
      } catch {
        setPartner({
          id: 'p1',
          shopName: '邻里好物店',
          shopType: 'food',
          commissionRate: 0.15,
          totalEarnings: 2580,
          level: 2,
        });
        setReferralTree([
          {
            title: '王先生 (一级)',
            key: 'r1',
            level: 1,
            children: [
              { title: '赵女士 (二级)', key: 'r3', level: 2 },
              { title: '钱先生 (二级)', key: 'r4', level: 2 },
            ],
          },
          { title: '李女士 (一级)', key: 'r2', level: 1 },
        ]);
        setSettlements([
          { id: 's1', amount: 580, status: 'settled', createdAt: '2026-06-15T10:00:00Z' },
          { id: 's2', amount: 320, status: 'pending', createdAt: '2026-06-18T10:00:00Z' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApply = async (values: { shopName: string; shopType: string }) => {
    setApplying(true);
    try {
      await api.post('/partners/apply', values);
      message.success('申请已提交，等待审核');
      form.resetFields();
    } catch {
      message.error('申请失败');
    } finally {
      setApplying(false);
    }
  };

  const handleSettle = async () => {
    Modal.confirm({
      title: '结算确认',
      content: '确定要结算当前待结算金额吗？',
      onOk: async () => {
        setSettling(true);
        try {
          await api.post('/partners/settle');
          message.success('结算成功');
        } catch {
          message.error('结算失败');
        } finally {
          setSettling(false);
        }
      },
    });
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const settlementColumns = [
    { title: '结算单号', dataIndex: 'id', key: 'id' },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>¥{v.toFixed(2)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={v === 'settled' ? 'green' : 'gold'}>{v === 'settled' ? '已结算' : '待结算'}</Tag>
      ),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleDateString('zh-CN'),
    },
  ];

  return (
    <div>
      {!partner ? (
        <Card title="申请成为合伙人">
          <Form form={form} onFinish={handleApply} layout="vertical">
            <Form.Item name="shopName" label="店铺名称" rules={[{ required: true, message: '请输入店铺名称' }]}>
              <Input placeholder="请输入店铺名称" />
            </Form.Item>
            <Form.Item name="shopType" label="店铺类型" rules={[{ required: true, message: '请选择店铺类型' }]}>
              <Select options={shopTypeOptions} placeholder="请选择店铺类型" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={applying}>提交申请</Button>
          </Form>
        </Card>
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title="店铺名称" value={partner.shopName} valueStyle={{ fontSize: 18 }} prefix={<TeamOutlined />} />
              </Col>
              <Col span={6}>
                <Statistic title="佣金比例" value={partner.commissionRate * 100} suffix="%" prefix={<PercentageOutlined />} />
              </Col>
              <Col span={6}>
                <Statistic title="累计收入" value={partner.totalEarnings} prefix="¥" valueStyle={{ color: '#52c41a' }} />
              </Col>
              <Col span={6}>
                <Statistic title="合伙人等级" value={partner.level} suffix="级" />
              </Col>
            </Row>
          </Card>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Card title="推荐关系树" extra={<Tag color="blue">{partner.shopName}</Tag>}>
                <Tree
                  treeData={referralTree}
                  defaultExpandAll
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="结算记录" extra={
                <Button type="primary" size="small" onClick={handleSettle} loading={settling}>
                  结算
                </Button>
              }>
                <Table
                  dataSource={settlements}
                  columns={settlementColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Partners;
