import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Select,
  InputNumber,
  Radio,
  Button,
  Alert,
  List,
  Row,
  Col,
  message,
  Result,
  Descriptions,
} from 'antd';
import {
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { checkPurchase, checkSale, getListings, getBuyers } from '@/api';

interface PurchaseResult {
  eligible: boolean;
  reasons: string[];
  restrictions: string[];
}

interface SaleResult {
  can_sell: boolean;
  reasons: string[];
  hold_years?: number;
}

const PolicyCheck: React.FC = () => {
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [saleLoading, setSaleLoading] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null);
  const [saleResult, setSaleResult] = useState<SaleResult | null>(null);
  const [listings, setListings] = useState<{ id: number; title: string }[]>([]);
  const [buyers, setBuyers] = useState<{ id: number; name: string }[]>([]);
  const [purchaseForm] = Form.useForm();
  const [saleForm] = Form.useForm();

  useEffect(() => {
    getListings({ pageSize: 50 })
      .then((res: any) => {
        const list = res?.list || [];
        setListings(list.map((l: any) => ({ id: l.id, title: l.title })));
        if (list[0]) {
          saleForm.setFieldsValue({ listing_id: list[0].id });
        }
      })
      .catch(() => {});
    getBuyers()
      .then((res: any) => {
        const list = res?.list || [];
        setBuyers(list.map((b: any) => ({ id: b.id, name: b.name })));
        if (list[0]) {
          purchaseForm.setFieldsValue({ buyer_id: list[0].id, city: '上海' });
        }
      })
      .catch(() => {});
  }, []);

  const handlePurchaseCheck = async (values: any) => {
    setPurchaseLoading(true);
    try {
      const res: any = await checkPurchase({
        buyer_id: values.buyer_id,
        city: values.city || '上海',
      });
      setPurchaseResult(res);
    } catch (e: any) {
      message.error(e.message || '购房资格校验失败');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleSaleCheck = async (values: any) => {
    setSaleLoading(true);
    try {
      const res: any = await checkSale(values.listing_id);
      setSaleResult(res);
    } catch (e: any) {
      message.error(e.message || '限售校验失败');
    } finally {
      setSaleLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'purchase',
      label: '购房资格预审',
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="购房资格预审">
              <Form form={purchaseForm} layout="vertical" onFinish={handlePurchaseCheck}>
                <Form.Item name="buyer_id" label="选择购房者" rules={[{ required: true, message: '请选择购房者' }]}>
                  <Select
                    placeholder="选择购房者"
                    showSearch
                    optionFilterProp="label"
                    options={buyers.map((b) => ({ label: b.name, value: b.id }))}
                  />
                </Form.Item>
                <Form.Item name="city" label="购房城市" initialValue="上海">
                  <Select
                    options={[
                      { label: '上海', value: '上海' },
                      { label: '北京', value: '北京' },
                      { label: '深圳', value: '深圳' },
                      { label: '广州', value: '广州' },
                    ]}
                  />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={purchaseLoading} icon={<SafetyCertificateOutlined />}>
                    提交购房资格校验
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            <Card title="上海限购政策说明" style={{ marginTop: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="本地户籍">
                  <List size="small" dataSource={[
                    '单身（含离异）：限1套',
                    '已婚家庭：限2套',
                  ]} />
                </Descriptions.Item>
                <Descriptions.Item label="外地户籍">
                  <List size="small" dataSource={[
                    '需连续缴纳5年社保或个税',
                    '限1套（单身/已婚相同）',
                  ]} />
                </Descriptions.Item>
                <Descriptions.Item label="限售政策">
                  产权满2年方可上市交易（免增值税）
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            {purchaseResult ? (
              <Card title="校验结果">
                <Alert
                  type={purchaseResult.eligible ? 'success' : 'error'}
                  message={purchaseResult.eligible ? '符合购房资格' : '不符合购房资格'}
                  icon={purchaseResult.eligible ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                {purchaseResult.reasons.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h4>原因说明</h4>
                    <List
                      size="small"
                      dataSource={purchaseResult.reasons}
                      renderItem={(item) => (
                        <List.Item><WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />{item}</List.Item>
                      )}
                    />
                  </div>
                )}
                {purchaseResult.restrictions.length > 0 && (
                  <div>
                    <h4>限制条件</h4>
                    <List
                      size="small"
                      dataSource={purchaseResult.restrictions}
                      renderItem={(item) => <List.Item>{item}</List.Item>}
                    />
                  </div>
                )}
              </Card>
            ) : (
              <Card>
                <Result
                  icon={<SafetyCertificateOutlined style={{ color: '#d9d9d9' }} />}
                  title="购房资格预审"
                  subTitle="选择购房者，系统将根据上海限购政策自动校验您的购房资格"
                />
              </Card>
            )}
          </Col>
        </Row>
      ),
    },
    {
      key: 'sale',
      label: '限售校验',
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="限售校验">
              <Form form={saleForm} layout="vertical" onFinish={handleSaleCheck}>
                <Form.Item name="listing_id" label="选择房源" rules={[{ required: true, message: '请选择房源' }]}>
                  <Select
                    placeholder="选择房源"
                    showSearch
                    optionFilterProp="label"
                    options={listings.map((l) => ({ label: l.title, value: l.id }))}
                  />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={saleLoading} icon={<SafetyCertificateOutlined />}>
                    提交限售校验
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            <Card title="增值税政策" style={{ marginTop: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="普通住宅">
                  <List size="small" dataSource={[
                    '未满2年：全额征收增值税（约5.3%）',
                    '满2年：免征增值税',
                  ]} />
                </Descriptions.Item>
                <Descriptions.Item label="非普通住宅">
                  <List size="small" dataSource={[
                    '未满2年：全额征收增值税（约5.3%）',
                    '满2年：差额征收增值税',
                  ]} />
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            {saleResult ? (
              <Card title="校验结果">
                <Alert
                  type={saleResult.can_sell ? 'success' : 'error'}
                  message={saleResult.can_sell ? '该房源可以出售' : '该房源不可出售'}
                  icon={saleResult.can_sell ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                {saleResult.hold_years !== undefined && (
                  <div style={{ marginBottom: 16 }}>
                    <Descriptions size="small">
                      <Descriptions.Item label="持有年限">{saleResult.hold_years}年</Descriptions.Item>
                    </Descriptions>
                  </div>
                )}
                {saleResult.reasons.length > 0 && (
                  <div>
                    <h4>原因说明</h4>
                    <List
                      size="small"
                      dataSource={saleResult.reasons}
                      renderItem={(item) => (
                        <List.Item><WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />{item}</List.Item>
                      )}
                    />
                  </div>
                )}
              </Card>
            ) : (
              <Card>
                <Result
                  icon={<SafetyCertificateOutlined style={{ color: '#d9d9d9' }} />}
                  title="限售校验"
                  subTitle="选择房源，校验该房源是否处于限售期"
                />
              </Card>
            )}
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>政策合规</h2>
        <p>购房资格预审与限售校验服务，符合上海本地政策要求</p>
      </div>
      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
};

export default PolicyCheck;
