import React from 'react';
import { Card, Form, Input, Select, Button, DatePicker, Radio, Upload, message, Space, Divider, Steps, Checkbox } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { GD_CITIES, VisaType } from '@platform/shared';
import api from '@/api';
import { useState } from 'react';

const visaTypeLabels: Record<string, string> = {
  HK_G_SIGN: '香港 个人旅游(G签)', HK_L_SIGN: '香港 团队旅游(L签)',
  HK_T_SIGN: '香港 探亲(T签)', HK_S_SIGN: '香港 商务(S签)', HK_D_SIGN: '香港 逗留(D签)',
  MACAO_G_SIGN: '澳门 个人旅游(G签)', MACAO_L_SIGN: '澳门 团队旅游(L签)',
  TAIWAN_G_SIGN: '台湾 个人旅游(G签)', TAIWAN_L_SIGN: '台湾 团队旅游(L签)', TAIWAN_T_SIGN: '台湾 探亲(T签)',
};

const VisaApplyPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [cityCfg, setCityCfg] = useState<any>(null);

  const loadCityCfg = async (city: string) => {
    const res: any = await api.get(`/admin/city-configs/${city}`);
    setCityCfg(res.data);
  };

  const submit = async (values: any) => {
    setSubmitting(true);
    try {
      const res: any = await api.post('/orders/visa', {
        ...values,
        passportImages: values.passportImages?.map((f: any) => f.url || '/mock-passport.jpg') || ['/mock-passport.jpg'],
        pickupAppointmentFrom: values.pickupAppointment?.[0]?.toISOString(),
        pickupAppointmentTo: values.pickupAppointment?.[1]?.toISOString(),
      });
      message.success('提交成功！揽收员将按预约时间上门');
      navigate(`/order/${res.data.orderId}`);
    } finally { setSubmitting(false); }
  };

  const steps = [
    { title: '签注信息', },
    { title: '收寄信息' },
    { title: '费用确认' },
  ];

  return (
    <div>
      <div className="page-header" style={{ padding: 16 }}>
        <div onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', marginBottom: 12, cursor: 'pointer' }}>
          <ArrowLeftOutlined style={{ marginRight: 8 }} />返回
        </div>
        <div style={{ fontSize: 20, fontWeight: 600 }}>港澳 / 赴台签注申请</div>
        <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>全程线上办理 · 上门取件 · 72小时出证</div>
      </div>

      <Steps current={step} size="small" items={steps} style={{ padding: 16, background: '#fff' }} />

      <div className="form-section">
        {step === 0 && (
          <Form form={form} layout="vertical" onFinish={() => setStep(1)} initialValues={{ validMonths: 12, entryCount: '一次' }}>
            <Card style={{ borderRadius: 12, marginBottom: 16 }} size="small" title="📍 办理城市">
              <Form.Item name="applicantCity" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                <Select placeholder="选择办理城市（广东21地市）" onChange={loadCityCfg}>
                  {GD_CITIES.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
                </Select>
              </Form.Item>
              {cityCfg && (
                <div style={{ marginTop: 10, padding: 8, background: '#f0f9ff', borderRadius: 6, fontSize: 12 }}>
                  ✅ {cityCfg.city}已开通 · SLA：{cityCfg.slaProcessHours}小时出证 · 服务热线：{cityCfg.hotlinePhone || '11185'}
                </div>
              )}
            </Card>
            <Card style={{ borderRadius: 12, marginBottom: 16 }} size="small" title="🛂 签注类型">
              <Form.Item name="visaType" rules={[{ required: true, message: '请选择签注类型' }]} style={{ marginBottom: 0 }}>
                <Radio.Group>
                  <Space direction="vertical">
                    {Object.entries(visaTypeLabels).map(([k, v]) => (
                      <Radio key={k} value={k} style={{ display: 'flex', padding: '8px 12px', border: '1px solid #eee', borderRadius: 8 }}>{v}</Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </Form.Item>
            </Card>
            <Card style={{ borderRadius: 12, marginBottom: 16 }} size="small" title="🗓️ 签注参数">
              <Form.Item label="有效期（月）" name="validMonths" rules={[{ required: true }]}>
                <Select options={[1, 3, 6, 12, 24, 36].map(m => ({ value: m, label: `${m}个月` }))} />
              </Form.Item>
              <Form.Item label="往返次数" name="entryCount" rules={[{ required: true }]}>
                <Select options={['一次', '两次', '多次'].map(v => ({ value: v, label: v }))} />
              </Form.Item>
              <Form.Item label="出行目的" name="travelPurpose">
                <Input placeholder="选填" />
              </Form.Item>
            </Card>
            <Card style={{ borderRadius: 12, marginBottom: 16 }} size="small" title="📎 材料上传（证件照/通行证）">
              <Form.Item name="passportImages" valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList} rules={[{ required: true, message: '请上传证件照片' }]}>
                <Upload listType="picture-card" multiple beforeUpload={() => false} maxCount={5}>
                  <PlusOutlined /><div style={{ marginTop: 8 }}>上传</div>
                </Upload>
              </Form.Item>
              <div style={{ fontSize: 12, color: '#999' }}>支持JPG/PNG，建议清晰拍摄；OCR自动识别信息</div>
            </Card>
            <Button type="primary" block size="large" htmlType="submit">下一步</Button>
          </Form>
        )}

        {step === 1 && (
          <Form form={form} layout="vertical" onFinish={() => setStep(2)}
            initialValues={{ pickupContactPhone: '13912345678', deliverySameAsPickup: true }}
          >
            <Card style={{ borderRadius: 12, marginBottom: 16 }} size="small" title="📦 上门取件信息">
              <Form.Item label="取件地址" name="pickupAddress" rules={[{ required: true, message: '请输入详细地址' }]}>
                <Input.TextArea rows={2} placeholder="省/市/区/街道/门牌号" />
              </Form.Item>
              <div style={{ display: 'flex', gap: 12 }}>
                <Form.Item label="联系人" name="pickupContactName" rules={[{ required: true }]} style={{ flex: 1 }}>
                  <Input />
                </Form.Item>
                <Form.Item label="手机号" name="pickupContactPhone" rules={[{ required: true, pattern: /^1\d{10}$/ }]} style={{ flex: 1 }}>
                  <Input maxLength={11} />
                </Form.Item>
              </div>
              <Form.Item label="取件预约时段" name="pickupAppointment" rules={[{ required: true }]}>
                <DatePicker.RangePicker showTime={{ format: 'HH:mm' }} style={{ width: '100%' }} />
              </Form.Item>
            </Card>
            <Card style={{ borderRadius: 12, marginBottom: 16 }} size="small" title="📬 证件寄回地址">
              <Form.Item name="deliverySameAsPickup" valuePropName="checked">
                <Checkbox style={{ width: '100%' }}>与取件地址相同</Checkbox>
              </Form.Item>
              <Form.Item noStyle shouldUpdate={(prev, cur) => prev.deliverySameAsPickup !== cur.deliverySameAsPickup}>
                {({ getFieldValue }) => !getFieldValue('deliverySameAsPickup') && (
                  <>
                    <Form.Item label="送达地址" name="deliveryAddress" rules={[{ required: true }]}>
                      <Input.TextArea rows={2} placeholder="省/市/区/街道/门牌号" />
                    </Form.Item>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <Form.Item label="联系人" name="deliveryContactName" rules={[{ required: true }]} style={{ flex: 1 }}>
                        <Input />
                      </Form.Item>
                      <Form.Item label="手机号" name="deliveryContactPhone" rules={[{ required: true, pattern: /^1\d{10}$/ }]} style={{ flex: 1 }}>
                        <Input maxLength={11} />
                      </Form.Item>
                    </div>
                  </>
                )}
              </Form.Item>
            </Card>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button block onClick={() => setStep(0)}>上一步</Button>
              <Button type="primary" block htmlType="submit">下一步</Button>
            </div>
          </Form>
        )}

        {step === 2 && (
          <Form form={form} layout="vertical" onFinish={form.submit}>
            <Card style={{ borderRadius: 12, marginBottom: 16 }} size="small" title="💰 费用明细">
              {(() => {
                const values = form.getFieldsValue();
                const city = values.applicantCity;
                const cfg = cityCfg || { visaServiceFee: 25, courierFeeStandard: 18 };
                const serviceFee = Number(cfg.visaServiceFee || 25);
                const govFee = 80;
                const courier = Number(cfg.courierFeeStandard || 18) * 2;
                const total = serviceFee + govFee + courier;
                return (
                  <>
                    <div className="amount-row"><span>签注服务费</span><span>¥{serviceFee}</span></div>
                    <div className="amount-row"><span>政府规费</span><span>¥{govFee}</span></div>
                    <div className="amount-row"><span>EMS往返</span><span>¥{courier}</span></div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div className="amount-row" style={{ fontSize: 16, fontWeight: 600, border: 'none' }}>
                      <span>合计</span><span style={{ color: '#F53F3F' }}>¥{total}</span>
                    </div>
                  </>
                );
              })()}
            </Card>
            <Card style={{ borderRadius: 12, marginBottom: 16 }} size="small" title="✅ 办理时效保障">
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
                <div>· 揽收时效：预约时段内 <b>2小时</b> 内上门</div>
                <div>· 办理时效：材料预审通过后 <b>72小时</b> 审批出证</div>
                <div>· 超时预警：自动触发 SLA 预警，专属客服跟进</div>
              </div>
            </Card>
            <div style={{ fontSize: 12, color: '#999', textAlign: 'center', margin: '16px 0' }}>
              <CheckCircleOutlined style={{ color: '#00B42A', marginRight: 4 }} />
              个人信息加密存储 · 敏感字段脱敏 · 资金监管账户隔离
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button block onClick={() => setStep(1)}>上一步</Button>
              <Button type="primary" block loading={submitting} onClick={() => {
                const vals = form.getFieldsValue();
                if (vals.deliverySameAsPickup) {
                  vals.deliveryAddress = vals.pickupAddress;
                  vals.deliveryContactName = vals.pickupContactName;
                  vals.deliveryContactPhone = vals.pickupContactPhone;
                }
                submit(vals);
              }}>提交申请并支付</Button>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
};

export default VisaApplyPage;
