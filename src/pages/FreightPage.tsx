import { useState } from 'react';
import {
  Card,
  Form,
  InputNumber,
  Select,
  Button,
  Row,
  Col,
  Typography,
  Divider,
  Tag,
  Table,
  Space,
  Alert,
} from 'antd';
import {
  CalculatorOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store/appStore';
import { FreightRule } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;

const FreightPage = () => {
  const [form] = Form.useForm();
  const [result, setResult] = useState<{
    total: number;
    basePrice: number;
    weightCost: number;
    volumeCost: number;
    discount: number;
    finalPrice: number;
    rule: FreightRule;
  } | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');

  const freightRules = useAppStore((state) => state.freightRules);
  const customers = useAppStore((state) => state.customers);
  const calculateFreight = useAppStore((state) => state.calculateFreight);

  const handleCalculate = (values: any) => {
    const rule = freightRules.find((r) => r.expressType === values.expressType);
    if (!rule) return;

    const total = calculateFreight(values.weight, values.volume, values.expressType);

    let discount = 0;
    if (selectedCustomer) {
      const customer = customers.find((c) => c.id === selectedCustomer);
      if (customer) {
        const discountMap: Record<string, number> = {
          diamond: 0.15,
          gold: 0.1,
          silver: 0.05,
          normal: 0,
        };
        discount = discountMap[customer.level] || 0;
      }
    }

    const weightCost = Math.max(0, total - rule.basePrice);
    const finalPrice = Math.round(total * (1 - discount) * 100) / 100;

    setResult({
      total,
      basePrice: rule.basePrice,
      weightCost: weightCost,
      volumeCost: values.volume * rule.volumePrice,
      discount: Math.round(total * discount * 100) / 100,
      finalPrice,
      rule,
    });
  };

  const stepColumns = [
    {
      title: '重量区间',
      dataIndex: 'range',
      key: 'range',
    },
    {
      title: '单价(元/kg)',
      dataIndex: 'price',
      key: 'price',
    },
  ];

  const stepData = (rule: FreightRule) =>
    rule.steps.map((step, index) => ({
      key: index,
      range: step.maxWeight ? `${step.minWeight} - ${step.maxWeight}kg` : `${step.minWeight}kg 以上`,
      price: step.pricePerKg,
    }));

  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>
        运费计算器
      </Title>

      <Row gutter={16}>
        <Col span={10}>
          <Card title="运费计算">
            <Form form={form} layout="vertical" onFinish={handleCalculate}>
              <Form.Item
                label="快递产品"
                name="expressType"
                initialValue="standard"
                rules={[{ required: true, message: '请选择快递产品' }]}
              >
                <Select>
                  {freightRules.map((rule) => (
                    <Option key={rule.id} value={rule.expressType}>
                      {rule.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="重量(kg)"
                    name="weight"
                    initialValue={100}
                    rules={[{ required: true, message: '请输入重量' }]}
                  >
                    <InputNumber style={{ width: '100%' }} min={0} step={1} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="体积(m³)"
                    name="volume"
                    initialValue={1}
                    rules={[{ required: true, message: '请输入体积' }]}
                  >
                    <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="企业客户"
                help="选择企业客户可享受对应等级折扣"
              >
                <Select
                  placeholder="选择企业月结账号"
                  value={selectedCustomer || undefined}
                  onChange={setSelectedCustomer}
                  allowClear
                >
                  {customers
                    .filter((c) => c.monthlySettlement)
                    .map((c) => (
                      <Option key={c.id} value={c.id}>
                        {c.name} ({c.accountNo})
                      </Option>
                    ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<CalculatorOutlined />} block size="large">
                  计算运费
                </Button>
              </Form.Item>
            </Form>

            {selectedCustomer && (
              <Alert
                message={`客户等级：${
                  customers.find((c) => c.id === selectedCustomer)?.level === 'diamond'
                    ? '钻石客户'
                    : customers.find((c) => c.id === selectedCustomer)?.level === 'gold'
                    ? '黄金客户'
                    : customers.find((c) => c.id === selectedCustomer)?.level === 'silver'
                    ? '白银客户'
                    : '普通客户'
                }，可享受 ${
                  customers.find((c) => c.id === selectedCustomer)?.level === 'diamond'
                    ? '85折'
                    : customers.find((c) => c.id === selectedCustomer)?.level === 'gold'
                    ? '9折'
                    : customers.find((c) => c.id === selectedCustomer)?.level === 'silver'
                    ? '95折'
                    : '无'
                } 优惠`}
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />
            )}
          </Card>

          <Card title="计费规则说明" style={{ marginTop: 16 }}>
            <div style={{ color: '#666', lineHeight: 1.8 }}>
              <p>• 运费 = 基础运费 + 续重费用（取重量和体积计费较大值）</p>
              <p>• 体积重量 = 体积(m³) × 体积系数</p>
              <p>• 企业月结客户享受等级折扣</p>
              <p>• 最低收费按产品类型不同而不同</p>
              <p>• 节假日、特殊时段可能加收服务费</p>
            </div>
          </Card>
        </Col>

        <Col span={14}>
          {result ? (
            <Card title="计算结果">
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px 0',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 12,
                  color: '#fff',
                  marginBottom: 24,
                }}
              >
                <div style={{ fontSize: 16, marginBottom: 8 }}>预估运费</div>
                <div style={{ fontSize: 48, fontWeight: 700 }}>¥{result.finalPrice}</div>
                {result.discount > 0 && (
                  <div style={{ fontSize: 14, marginTop: 8 }}>
                    <Tag color="gold">已优惠 ¥{result.discount}</Tag>
                  </div>
                )}
                <div style={{ fontSize: 12, marginTop: 12, opacity: 0.8 }}>
                  {result.rule.name} · 预计时效 {result.rule.expressType === 'overnight' ? '次日达' : result.rule.expressType === 'fast' ? '2-3天' : '3-5天'}
                </div>
              </div>

              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: 16, background: '#fafafa', borderRadius: 8 }}>
                    <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>基础运费</div>
                    <div style={{ fontSize: 20, fontWeight: 500 }}>¥{result.basePrice}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: 16, background: '#fafafa', borderRadius: 8 }}>
                    <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>重量计费</div>
                    <div style={{ fontSize: 20, fontWeight: 500 }}>¥{result.weightCost.toFixed(2)}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: 16, background: '#fafafa', borderRadius: 8 }}>
                    <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>体积计费</div>
                    <div style={{ fontSize: 20, fontWeight: 500 }}>¥{result.volumeCost.toFixed(2)}</div>
                  </div>
                </Col>
              </Row>

              <Divider />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <CreditCardOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                  <span>支持企业月结，自动挂账</span>
                </Space>
                <Button type="primary" size="large">
                  立即下单
                </Button>
              </div>

              <Divider />

              <Title level={5}>阶梯报价明细</Title>
              <Table
                columns={stepColumns}
                dataSource={stepData(result.rule)}
                pagination={false}
                size="small"
              />
            </Card>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#999' }}>
                <CalculatorOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>请填写参数后计算运费</div>
              </div>
            </Card>
          )}

          <Card title="全部快递产品" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              {freightRules.map((rule) => (
                <Col span={8} key={rule.id}>
                  <Card
                    size="small"
                    hoverable
                    style={{
                      borderColor: result?.rule.id === rule.id ? '#1890ff' : '#f0f0f0',
                      borderWidth: result?.rule.id === rule.id ? 2 : 1,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
                      {rule.name}
                    </div>
                    <div style={{ color: '#f5222d', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                      ¥{rule.basePrice}起
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      最低收费：¥{rule.minCharge}
                    </div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      {rule.expressType === 'overnight'
                        ? '次日达，时效保障'
                        : rule.expressType === 'fast'
                        ? '快速达，2-3天送达'
                        : '标准快递，3-5天送达'}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FreightPage;
