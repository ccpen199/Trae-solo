import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Row, Col, Card, Form, Input, InputNumber, Select, Button, Space, Tag, message, Modal, Steps, Alert, Statistic, Radio, List, Progress, Divider, Descriptions, QRCode, Switch } from 'antd';
import { SendOutlined, SafetyOutlined, BulbOutlined, WarningOutlined, EnvironmentOutlined, PhoneOutlined, UserOutlined, ShoppingOutlined, UnorderedListOutlined, EyeOutlined, QrcodeOutlined, SyncOutlined, CheckCircleOutlined, RocketOutlined } from '@ant-design/icons';
import { api } from '../api';
import ReactECharts from 'echarts-for-react';

const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆', '天津', '苏州', '青岛', '长沙', '郑州'];

export default function CreateOrder() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [priceResult, setPriceResult] = useState<any>(null);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [sortBy, setSortBy] = useState('composite');
  const [alertVisible, setAlertVisible] = useState(true);
  const [syncEcommerce, setSyncEcommerce] = useState(false);
  const [ecommerceOrderNo, setEcommerceOrderNo] = useState('');
  const preselectedBrandId = searchParams.get('brand_id');

  useEffect(() => {
    if (priceResult && preselectedBrandId) {
      const brandId = Number(preselectedBrandId);
      const brand = priceResult.list.find((b: any) => b.brand_id === brandId);
      if (brand) {
        setSelectedBrand(brandId);
      }
    }
  }, [priceResult, preselectedBrandId]);

  const getSelectedBrandInfo = () => {
    if (!priceResult || !selectedBrand) return null;
    return priceResult.list.find((b: any) => b.brand_id === selectedBrand);
  };

  const onPriceCompare = async () => {
    try {
      const vals = await form.validateFields(['sender_city', 'receiver_city', 'weight', 'length', 'width', 'height', 'priority', 'goods_type']);
      setLoading(true);
      const r: any = await api.price.compare(vals);
      setPriceResult(r);
      setStep(1);
      message.success('比价完成，共匹配 ' + r.summary.brand_count + ' 个品牌');
    } catch (e: any) {
      if (e.errorFields) {
        const fieldNames = e.errorFields.map((f: any) => f.name.join('.')).join('、');
        message.error(`请完善必填信息：${fieldNames}`);
      } else if (e.message) {
        message.error(e.message);
      }
    } finally { setLoading(false); }
  };

  const addressCheck = () => {
    const addr = form.getFieldValue('receiver_address') || '';
    const fakeKeywords = ['虚构路', '假小区', '不存在街', '测试地址', 'xxx路xxx号', '无名氏'];
    return fakeKeywords.some(k => addr.includes(k));
  };

  const goToConfirm = async () => {
    try {
      await form.validateFields();
      if (!selectedBrand) {
        message.warning('请选择快递品牌');
        return;
      }
      setStep(2);
    } catch (e: any) {
      if (e.errorFields) {
        const fieldNames = e.errorFields.map((f: any) => f.name.join('.')).join('、');
        message.error(`请完善必填信息：${fieldNames}`);
      } else if (e.message) {
        message.error(e.message);
      }
    }
  };

  const onSubmit = async () => {
    try {
      const vals = await form.validateFields();
      if (!selectedBrand) { message.warning('请选择快递品牌'); return; }

      const hasFake = addressCheck();
      if (hasFake) {
        Modal.confirm({
          title: <><WarningOutlined style={{ color: '#ff4d4f' }} /> 检测到异常收货地址</>,
          content: '该地址疑似虚构/不存在，继续下单可能导致包裹无法送达，是否仍然提交？',
          okText: '仍然提交',
          okButtonProps: { danger: true },
          cancelText: '修改地址',
          onOk: async () => doSubmit(vals, true)
        });
        return;
      }
      doSubmit(vals, false);
    } catch (e: any) {
      if (e.errorFields) {
        const fieldNames = e.errorFields.map((f: any) => f.name.join('.')).join('、');
        message.error(`请完善必填信息：${fieldNames}`);
      } else if (e.message) {
        message.error(e.message);
      }
    }
  };

  const doSubmit = async (vals: any, forced: boolean) => {
    setSubmitting(true);
    try {
      const brand = getSelectedBrandInfo();
      const r: any = await api.orders.create({
        ...vals,
        brand_id: selectedBrand,
        brand_name: brand?.brand_name,
        force_ignore_address: forced,
        estimated_price: brand?.price,
        estimated_hours: brand?.estimated_hours
      });

      if (syncEcommerce && ecommerceOrderNo) {
        try {
          await api.orders.syncEcommerce({
            order_id: r.id,
            ecommerce_order_no: ecommerceOrderNo
          });
        } catch (syncErr: any) {
          message.warning('运单创建成功，但电商同步失败：' + (syncErr.message || '未知错误'));
        }
      }

      setOrderResult(r);
      setStep(3);
      message.success(r.suspicious_address ? '运单已创建，异常地址已标记并通知人工审核' : '运单创建成功');
    } catch (e: any) { message.error(e.message || '创建运单失败，请重试'); }
    finally { setSubmitting(false); }
  };

  const priceChartOpt = priceResult ? {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['价格(元)', '时效(小时)'] },
    grid: { left: 50, right: 50, top: 40, bottom: 80 },
    xAxis: { type: 'category', data: priceResult.list.slice(0, 10).map((r: any) => r.brand_name), axisLabel: { rotate: 30, fontSize: 11 } },
    yAxis: [{ type: 'value', name: '元' }, { type: 'value', name: '小时' }],
    series: [
      { name: '价格(元)', type: 'bar', data: priceResult.list.slice(0, 10).map((r: any) => r.price), itemStyle: { color: '#1677ff' } },
      { name: '时效(小时)', type: 'line', yAxisIndex: 1, data: priceResult.list.slice(0, 10).map((r: any) => r.estimated_hours), smooth: true, itemStyle: { color: '#fa8c16' }, lineStyle: { width: 3 } }
    ]
  } : {};

  const renderSuccessPage = () => {
    if (!orderResult) return null;
    return (
      <Card>
        <Steps
          current={3}
          items={[
            { title: '填写信息', icon: <UserOutlined /> },
            { title: '智能比价', icon: <BulbOutlined /> },
            { title: '确认下单', icon: <SafetyOutlined /> },
            { title: '下单完成', icon: <CheckCircleOutlined /> }
          ]}
        />
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ marginBottom: 8 }}>运单创建成功</h2>
          <p style={{ color: '#8c8c8c', marginBottom: 24 }}>运单号：<b style={{ color: '#1677ff', fontSize: 18 }}>{orderResult.order_no}</b></p>
          {orderResult.suspicious_address && (
            <Alert
              message={<><WarningOutlined /> 异常地址预警</>}
              description="该地址疑似虚构/不存在，系统已自动标记并生成异常事件，快递员派件前将二次核验。"
              type="warning"
              showIcon
              style={{ marginBottom: 20, textAlign: 'left', maxWidth: 600, margin: '0 auto 20px' }}
            />
          )}
          <Row gutter={[16, 16]} style={{ maxWidth: 700, margin: '0 auto' }}>
            <Col xs={12}>
              <Card styles={{ body: { padding: 14 } }}>
                <Statistic title="快递品牌" value={orderResult.brand_name} valueStyle={{ fontSize: 16 }} />
              </Card>
            </Col>
            <Col xs={12}>
              <Card styles={{ body: { padding: 14 } }}>
                <Statistic title="预估运费" value={orderResult.price} prefix="¥" valueStyle={{ color: '#ff4d4f', fontSize: 20 }} />
              </Card>
            </Col>
            <Col xs={12}>
              <Card styles={{ body: { padding: 14 } }}>
                <Statistic title="预计送达" value={orderResult.estimated_hours} suffix="小时" valueStyle={{ color: '#fa8c16', fontSize: 18 }} />
              </Card>
            </Col>
            <Col xs={12}>
              <Card styles={{ body: { padding: 14 } }}>
                <Statistic title="收件人" value={orderResult.receiver_name} valueStyle={{ fontSize: 16 }} />
              </Card>
            </Col>
          </Row>
          <div style={{ marginTop: 32 }}>
            <Space>
              <Button type="primary" icon={<UnorderedListOutlined />} onClick={() => nav('/orders')}>查看运单列表</Button>
              <Button icon={<EyeOutlined />} onClick={() => nav(`/orders/${orderResult.id}`)}>查看运单详情</Button>
              <Button onClick={() => { setOrderResult(null); setStep(0); setPriceResult(null); setSelectedBrand(null); form.resetFields(); setSyncEcommerce(false); setEcommerceOrderNo(''); }}>再寄一单</Button>
            </Space>
          </div>
        </div>
      </Card>
    );
  };

  const renderConfirmStep = () => {
    const brand = getSelectedBrandInfo();
    if (!brand) return null;
    const formVals = form.getFieldsValue();

    return (
      <Card title={<><SafetyOutlined /> 确认下单信息</>}>
        <Alert
          type="info"
          showIcon
          message="请仔细核对以下信息，确认无误后提交下单"
          style={{ marginBottom: 20 }}
        />

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={14}>
            <Card title="寄件人信息" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="姓名">{formVals.sender_name || '-'}</Descriptions.Item>
                <Descriptions.Item label="手机号">{formVals.sender_phone || '-'}</Descriptions.Item>
                <Descriptions.Item label="城市">{formVals.sender_city || '-'}</Descriptions.Item>
                <Descriptions.Item label="详细地址">{formVals.sender_address || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="收件人信息" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="姓名">{formVals.receiver_name || '-'}</Descriptions.Item>
                <Descriptions.Item label="手机号">{formVals.receiver_phone || '-'}</Descriptions.Item>
                <Descriptions.Item label="城市">{formVals.receiver_city || '-'}</Descriptions.Item>
                <Descriptions.Item label="详细地址">{formVals.receiver_address || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="物品信息" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="重量">{formVals.weight} kg</Descriptions.Item>
                <Descriptions.Item label="尺寸">{formVals.length}×{formVals.width}×{formVals.height} cm</Descriptions.Item>
                <Descriptions.Item label="优先级">{formVals.priority === 'urgent' ? '加急' : '标准'}</Descriptions.Item>
                <Descriptions.Item label="物品类型">
                  {formVals.goods_type === 'standard' ? '标准件' :
                   formVals.goods_type === 'fragile' ? '易碎品' :
                   formVals.goods_type === 'cold' ? '冷链' : '文件'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title={<><SyncOutlined /> 电商同步</>} size="small">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Switch checked={syncEcommerce} onChange={setSyncEcommerce} />
                <span>同步电商平台订单信息</span>
              </div>
              {syncEcommerce && (
                <Input
                  placeholder="请输入电商订单号"
                  value={ecommerceOrderNo}
                  onChange={(e) => setEcommerceOrderNo(e.target.value)}
                  prefix={<ShoppingOutlined />}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card
              title={<><RocketOutlined style={{ color: '#1677ff' }} /> 已选快递品牌</>}
              style={{ marginBottom: 16, border: '2px solid #1677ff', background: '#f0f7ff' }}
            >
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1677ff', marginBottom: 8 }}>{brand.brand_name}</div>
                <Tag color="blue">{brand.brand_code}</Tag>
                <div style={{ marginTop: 12 }}>
                  {brand.tags?.map((t: string, k: number) => (
                    <Tag key={k} color={k === 0 ? 'purple' : k === 1 ? 'cyan' : k === 2 ? 'orange' : 'green'}>{t}</Tag>
                  ))}
                </div>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <Row gutter={[12, 12]}>
                <Col xs={12}>
                  <Statistic title="运费" value={brand.price} prefix="¥" valueStyle={{ color: '#ff4d4f', fontSize: 22 }} />
                </Col>
                <Col xs={12}>
                  <Statistic title="时效" value={brand.estimated_hours} suffix="h" valueStyle={{ color: '#fa8c16', fontSize: 20 }} />
                </Col>
              </Row>
              <div style={{ marginTop: 12 }}>
                <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>覆盖度</div>
                <Progress percent={brand.coverage_score} size="small" />
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>综合评分</div>
                <Progress percent={brand.composite_score} size="small" strokeColor={{ '0%': '#1677ff', '100%': '#52c41a' }} />
              </div>
              {brand.recommendation && (
                <Alert
                  type="success"
                  showIcon
                  message="推荐理由"
                  description={brand.recommendation}
                  style={{ marginTop: 12 }}
                />
              )}
            </Card>

            <Card title={<><QrcodeOutlined /> 面单预览</>} size="small">
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ display: 'inline-block', padding: 16, background: '#fff', border: '1px solid #f0f0f0', borderRadius: 8 }}>
                  <QRCode value={`order://preview/${brand.brand_code}_preview`} size={120} />
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: '#8c8c8c' }}>
                  下单成功后可获取正式面单二维码
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    );
  };

  if (orderResult) {
    return renderSuccessPage();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title={<><SendOutlined /> 智能发件 · 创建运单</>}>
        <Steps
          current={step}
          items={[
            { title: '填写信息', icon: <UserOutlined /> },
            { title: '智能比价', icon: <BulbOutlined /> },
            { title: '确认下单', icon: <SafetyOutlined /> }
          ]}
        />
      </Card>

      {alertVisible && step === 0 && (
        <Alert
          type="info"
          showIcon
          closable
          onClose={() => setAlertVisible(false)}
          message="💡 下单小贴士"
          description={
            <div>
              <div>• 系统将根据「价格35% + 时效30% + 覆盖度20% + 服务评分15%」自动推荐最优快递品牌</div>
              <div>• 签收前需人脸识别二次确认，防止错收误收</div>
              <div>• 异常地址（虚构路/假小区/不存在街）将被自动拦截并预警</div>
            </div>
          }
        />
      )}

      {step <= 1 && (
        <Form form={form} layout="vertical">
        <Card title={<><UserOutlined /> 寄件人信息</>}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item name="sender_name" label="寄件人" rules={[{ required: true, message: '请输入寄件人姓名' }]} style={{ marginBottom: 0 }}>
                <Input prefix={<UserOutlined />} placeholder="姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="sender_phone" label="手机号" rules={[{ required: true, message: '请输入寄件人手机号' }, { pattern: /^1\d{10}$/, message: '请输入有效的手机号' }]} style={{ marginBottom: 0 }}>
                <Input prefix={<PhoneOutlined />} placeholder="11位手机号" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="sender_city" label="寄件城市" rules={[{ required: true, message: '请选择寄件城市' }]} style={{ marginBottom: 0 }}>
                <Select options={cities.map(c => ({ value: c, label: c }))} placeholder="选择城市" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="sender_address" label="详细地址" rules={[{ required: true, message: '请输入寄件人详细地址' }]} style={{ marginBottom: 0 }}>
                <Input prefix={<EnvironmentOutlined />} placeholder="街道门牌号" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title={<><ShoppingOutlined /> 收件人信息</>}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item name="receiver_name" label="收件人" rules={[{ required: true, message: '请输入收件人姓名' }]} style={{ marginBottom: 0 }}>
                <Input prefix={<UserOutlined />} placeholder="姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="receiver_phone" label="手机号" rules={[{ required: true, message: '请输入收件人手机号' }, { pattern: /^1\d{10}$/, message: '请输入有效的手机号' }]} style={{ marginBottom: 0 }}>
                <Input prefix={<PhoneOutlined />} placeholder="11位手机号" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="receiver_city" label="收件城市" rules={[{ required: true, message: '请选择收件城市' }]} style={{ marginBottom: 0 }}>
                <Select options={cities.map(c => ({ value: c, label: c }))} placeholder="选择城市" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="receiver_address" label="详细地址" rules={[{ required: true, message: '请输入收件人详细地址' }]} style={{ marginBottom: 0 }}>
                <Input prefix={<EnvironmentOutlined />} placeholder="街道门牌号（如含'虚构路/假小区'将触发异常拦截）" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title={<><BulbOutlined /> 物品与偏好设置</>}>
          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}>
              <Form.Item name="weight" label="重量(kg)" initialValue={1} rules={[{ required: true, message: '请输入物品重量' }]} style={{ marginBottom: 0 }}>
                <InputNumber min={0.1} max={100} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={8} md={4}>
              <Form.Item name="length" label="长(cm)" initialValue={30} style={{ marginBottom: 0 }}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={8} md={4}>
              <Form.Item name="width" label="宽(cm)" initialValue={20} style={{ marginBottom: 0 }}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={8} md={4}>
              <Form.Item name="height" label="高(cm)" initialValue={15} style={{ marginBottom: 0 }}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="priority" label="优先级" initialValue="normal" style={{ marginBottom: 0 }}>
                <Radio.Group options={[{ value: 'normal', label: '标准' }, { value: 'urgent', label: '加急' }]} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item name="goods_type" label="物品类型" initialValue="standard" style={{ marginBottom: 0 }}>
                <Select style={{ width: '100%' }} options={[
                  { value: 'standard', label: '标准件' },
                  { value: 'fragile', label: '易碎品' },
                  { value: 'cold', label: '冷链' },
                  { value: 'document', label: '文件' }
                ]} />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        </Form>
      )}

      {step >= 1 && priceResult && step <= 1 && (
        <>
          <Card>
            <Steps
              size="small"
              current={-1}
              items={[
                { title: '📦 参数', description: `${priceResult.params.sender_city} → ${priceResult.params.receiver_city} · ${priceResult.params.weight}kg · 计费重${priceResult.params.bill_weight}kg`, icon: <SafetyOutlined /> },
                { title: '📍 距离', description: `${priceResult.params.distance}km · ${priceResult.params.same_city ? '同城' : '异地'}`, icon: <SafetyOutlined /> },
                { title: '💡 方案', description: `${priceResult.summary.brand_count} 个品牌 · ¥${priceResult.summary.price_range[0]} ~ ¥${priceResult.summary.price_range[1]}`, icon: <BulbOutlined /> },
              ]}
            />
          </Card>

          {priceResult.recommendation && (
            <Card>
              <Alert
                type="success"
                showIcon
                icon={<BulbOutlined />}
                message={`智能推荐：${priceResult.recommendation.brand_name}`}
                description={
                  <div>
                    <div style={{ marginBottom: 4 }}>{priceResult.recommendation.recommendation || '综合性价比最优'}</div>
                    <div>
                      <Tag color="blue">¥{priceResult.recommendation.price}</Tag>
                      <Tag color="orange">{priceResult.recommendation.estimated_hours}h</Tag>
                      <Tag color="green">★{priceResult.recommendation.rating}</Tag>
                      <Tag color="purple">覆盖{priceResult.recommendation.coverage_score}%</Tag>
                    </div>
                  </div>
                }
                action={
                  <Button size="small" type="primary" onClick={() => setSelectedBrand(priceResult.recommendation.brand_id)}>
                    选择推荐
                  </Button>
                }
              />
            </Card>
          )}

          <Card title="📊 价格与时效对比（TOP 10）">
            <ReactECharts option={priceChartOpt} style={{ height: 320 }} />
          </Card>

          <Card title="📋 选择快递品牌" extra={
            <Radio.Group value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <Radio.Button value="composite">综合评分</Radio.Button>
              <Radio.Button value="price">价格从低</Radio.Button>
              <Radio.Button value="time">时效最快</Radio.Button>
              <Radio.Button value="rating">评分最高</Radio.Button>
            </Radio.Group>
          }>
            <List
              dataSource={priceResult.list.slice().sort((a: any, b: any) =>
                sortBy === 'price' ? a.price - b.price :
                sortBy === 'time' ? a.estimated_hours - b.estimated_hours :
                sortBy === 'rating' ? b.rating - a.rating : b.composite_score - a.composite_score
              )}
              renderItem={(r: any, i: number) => (
                <List.Item
                  key={r.brand_id}
                  style={{
                    padding: '14px 16px',
                    border: selectedBrand === r.brand_id ? '2px solid #1677ff' : '1px solid #f0f0f0',
                    borderRadius: 8,
                    marginBottom: 8,
                    background: selectedBrand === r.brand_id ? '#e6f4ff' : '#fff',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedBrand(r.brand_id)}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{ width: 48, height: 48, borderRadius: 10, background: i < 3 ? 'linear-gradient(135deg, #fa8c16, #faad14)' : '#e6f4ff', color: i < 3 ? '#fff' : '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {i + 1}
                      </div>
                    }
                    title={
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 16, fontWeight: 600 }}>{r.brand_name}</span>
                        <Tag color="blue">{r.brand_code}</Tag>
                        {r.tags?.map((t: string, k: number) => <Tag key={k} color={k === 0 ? 'purple' : k === 1 ? 'cyan' : k === 2 ? 'orange' : 'green'}>{t}</Tag>)}
                        {priceResult.recommendation?.brand_id === r.brand_id && <Tag color="gold">智能推荐</Tag>}
                      </div>
                    }
                    description={
                      <Row gutter={[12, 8]} style={{ marginTop: 6 }}>
                        <Col xs={8} sm={6} md={4}>
                          <span style={{ color: '#8c8c8c', fontSize: 12 }}>运费</span>
                          <div style={{ fontSize: 20, fontWeight: 700, color: '#ff4d4f' }}>¥{r.price}</div>
                        </Col>
                        <Col xs={8} sm={6} md={4}>
                          <span style={{ color: '#8c8c8c', fontSize: 12 }}>时效</span>
                          <div><b>{r.estimated_hours}h</b> ({r.estimated_days}天)</div>
                        </Col>
                        <Col xs={8} sm={6} md={4}>
                          <span style={{ color: '#8c8c8c', fontSize: 12 }}>覆盖度</span>
                          <div><Progress percent={r.coverage_score} size="small" showInfo={false} style={{ width: 80 }} /> {r.coverage_score}%</div>
                        </Col>
                        <Col xs={8} sm={6} md={4}>
                          <span style={{ color: '#8c8c8c', fontSize: 12 }}>服务评分</span>
                          <div style={{ color: '#fa8c16', fontWeight: 600 }}>★ {r.rating}</div>
                        </Col>
                        <Col xs={24} md={8}>
                          <span style={{ color: '#8c8c8c', fontSize: 12 }}>综合评分</span>
                          <Progress percent={r.composite_score} size="small" strokeColor={{ '0%': '#1677ff', '100%': '#52c41a' }} />
                        </Col>
                        {r.recommendation && (
                          <Col xs={24}>
                            <div style={{ fontSize: 12, color: '#52c41a', marginTop: 4 }}>
                              💡 推荐理由：{r.recommendation}
                            </div>
                          </Col>
                        )}
                      </Row>
                    }
                  />
                  <Button type={selectedBrand === r.brand_id ? 'primary' : 'default'} onClick={(e) => { e.stopPropagation(); setSelectedBrand(r.brand_id); }}>
                    {selectedBrand === r.brand_id ? '✓ 已选' : '选择'}
                  </Button>
                </List.Item>
              )}
            />
          </Card>
        </>
      )}

      {step === 2 && renderConfirmStep()}

      <Card>
        <Space>
          {step === 0 && (
            <Button type="primary" onClick={onPriceCompare} loading={loading} icon={<BulbOutlined />}>
              下一步：智能比价
            </Button>
          )}
          {step === 1 && (
            <>
              <Button onClick={() => setStep(0)} disabled={submitting}>上一步</Button>
              <Button type="primary" onClick={goToConfirm} disabled={!selectedBrand} icon={<SafetyOutlined />}>
                下一步：确认下单
              </Button>
              {selectedBrand && <Tag color="blue">已选：{getSelectedBrandInfo()?.brand_name}</Tag>}
            </>
          )}
          {step === 2 && (
            <>
              <Button onClick={() => setStep(1)} disabled={submitting}>返回比价</Button>
              <Button type="primary" onClick={onSubmit} loading={submitting} icon={<SendOutlined />}>
                确认下单
              </Button>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
}
