import React, { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Select,
  Button,
  Descriptions,
  Statistic,
  Row,
  Col,
  Table,
  Spin,
  message,
  Divider,
} from 'antd';
import {
  CalculatorOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { calculateTax, getListings, getBuyers } from '@/api';

interface ListingOption {
  id: number;
  title: string;
  price: number;
}

interface BuyerOption {
  id: number;
  name: string;
}

interface TaxResult {
  deed_tax: number;
  vat: number;
  personal_income_tax: number;
  stamp_duty: number;
  total_tax: number;
  listing_price: number;
  details: { item: string; amount: number; rate: string; description: string }[];
}

const TaxCalc: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [buyers, setBuyers] = useState<BuyerOption[]>([]);
  const [result, setResult] = useState<TaxResult | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    Promise.all([getListings(), getBuyers()])
      .then(([lRes, bRes]: any[]) => {
        const lList = lRes?.list ?? [];
        const bList = bRes?.list ?? [];
        setListings(lList.map((l: any) => ({ id: l.id, title: l.title, price: l.price })));
        setBuyers(bList.map((b: any) => ({ id: b.id, name: b.name })));
      })
      .catch(() => message.error('加载数据失败'));
  }, []);

  const handleCalculate = async (values: { listing_id: number; buyer_id: number }) => {
    setLoading(true);
    try {
      const res: any = await calculateTax(values);
      setResult(res);
    } catch (e: any) {
      message.error(e.message || '税费计算失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '税费项目', dataIndex: 'item', key: 'item' },
    { title: '金额（元）', dataIndex: 'amount', key: 'amount', render: (v: number) => <span className="price-text">{v.toLocaleString()}</span> },
    { title: '税率', dataIndex: 'rate', key: 'rate' },
    { title: '说明', dataIndex: 'description', key: 'description' },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>税费计算</h2>
        <p>精准房产交易税费测算工具</p>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Form form={form} layout="inline" onFinish={handleCalculate}>
          <Form.Item name="listing_id" label="选择房源" rules={[{ required: true, message: '请选择房源' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              style={{ width: 240 }}
              placeholder="选择房源"
              options={listings.map((l) => ({
                label: `${l.title} (${(l.price / 10000).toFixed(0)}万)`,
                value: l.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="buyer_id" label="选择买方" rules={[{ required: true, message: '请选择买方' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              style={{ width: 200 }}
              placeholder="选择买方"
              options={buyers.map((b) => ({ label: b.name, value: b.id }))}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<CalculatorOutlined />}>
              计算税费
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Spin spinning={loading}>
        {result && (
          <>
            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="契税"
                    value={result.deed_tax}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#1677ff', fontSize: 20 }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="增值税"
                    value={result.vat}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#722ed1', fontSize: 20 }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="个人所得税"
                    value={result.personal_income_tax}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#fa8c16', fontSize: 20 }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card>
                  <Statistic
                    title="印花税"
                    value={result.stamp_duty}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#52c41a', fontSize: 20 }}
                  />
                </Card>
              </Col>
            </Row>

            <Card title="税费明细" style={{ marginBottom: 24 }}>
              <Table
                columns={columns}
                dataSource={result.details || []}
                pagination={false}
                rowKey="item"
                size="middle"
              />
            </Card>

            <Card>
              <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="房源总价">
                  <span className="price-text">¥ {result.listing_price?.toLocaleString()}</span>
                </Descriptions.Item>
                <Descriptions.Item label="税费合计">
                  <span className="price-text" style={{ fontSize: 20 }}>¥ {result.total_tax?.toLocaleString()}</span>
                </Descriptions.Item>
                <Descriptions.Item label="购房总成本">
                  <span style={{ fontWeight: 700, fontSize: 18, color: '#ff4d4f' }}>
                    ¥ {((result.listing_price || 0) + (result.total_tax || 0)).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="税费占比">
                  {result.listing_price
                    ? ((result.total_tax / result.listing_price) * 100).toFixed(2)
                    : 0}%
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </>
        )}
      </Spin>
    </div>
  );
};

export default TaxCalc;
