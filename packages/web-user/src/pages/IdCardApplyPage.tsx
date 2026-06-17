import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, Radio, Upload, Steps, message, Checkbox } from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { GD_CITIES } from '@platform/shared';
import api from '@/api';

const IdCardApplyPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [cfg, setCfg] = useState<any>(null);
  const steps = [{ title: '补换领信息' }, { title: '邮寄信息' }, { title: '确认提交' }];
  const loadCfg = async (city: string) => {
    const res: any = await api.get(`/admin/city-configs/${city}`);
    setCfg(res.data);
  };
  const submit = async () => {
    const vals = form.getFieldsValue();
    setSubmitting(true);
    try {
      const res: any = await api.post('/orders/id-card', {
        ...vals,
        idCardImages: vals.idCardImages?.map((f: any) => f.url || '/mock.jpg') || [],
      });
      message.success('申请已提交！信息同步公安人口库，制证完成后EMS寄达');
      navigate(`/order/${res.data.orderId}`);
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <div className="page-header" style={{ padding: 16 }}>
        <div onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', marginBottom: 12, cursor: 'pointer' }}>
          <ArrowLeftOutlined style={{ marginRight: 8 }} />返回
        </div>
        <div style={{ fontSize: 20, fontWeight: 600 }}>居民身份证补换领</div>
        <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>信息同步公安人口库 · 7个工作日制证寄达</div>
      </div>
      <Steps current={step} size="small" items={steps} style={{ padding: 16, background: '#fff' }} />
      <div className="form-section">
        {step === 0 && (
          <Form form={form} layout="vertical" onFinish={() => setStep(1)}>
            <Card style={{ borderRadius: 12, marginBottom: 16 }} size="small" title="📍 办理城市">
              <Form.Item name="applicantCity" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                <Select placeholder="选择户籍/办理城市" onChange={loadCfg}>
                  {GD_CITIES.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
                </Select>
              </Form.Item>
            </Card>
            <Card style={{ borderRadius: 12, marginBottom: 16 }} size="small" title="🔁 补换领原因">
              <Form.Item name="replaceReason" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                <Radio.Group>
                  <Space direction="vertical">
                    <Radio value="LOST" style={{ display: 'flex', padding: 10, border: '1px solid #eee', borderRadius: 8 }}>证件遗失（补办）</Radio>
                    <Radio value="DAMAGED" style={{ display: 'flex', padding: 10, border: '1px solid #eee', borderRadius: 8 }}>证件损坏（换领）</Radio>
                    <Radio value="EXPIRED" style={{ display: 'flex', padding: 10, border: '1px solid #eee', borderRadius: 8 }}>有效期满（换领）</Radio>
                    <Radio value="INFORMATION_CHANGE" style={{ display: 'flex', padding: 10, border: '1px solid #eee', borderRadius: 8 }}>信息变更换发</Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>
            </Card>
            <Card style={{ borderRadius: 12, marginBottom: 16 }} size="small" title="📎 材料上传">
              <Form.Item label="上传身份证照片/户口本页" name="idCardImages" valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList} rules={[{ required: true }]}>
                <Upload listType="picture-card" multiple beforeUpload={() => false} maxCount={6}>
                  <PlusOutlined /><div style={{ marginTop: 8 }}>上传</div>
                </Upload>
              </Form.Item>
            </Card>
            <Button type="primary" block size="large" htmlType="submit">下一步</Button>
          </Form>
        )}
        {step === 1 && (
          <Form form={form} layout="vertical" onFinish={() => setStep(2)} initialValues={{ deliverySameAsPickup: true }}>
            <Card style={{ borderRadius: 12, marginBottom: 16 }} size="small" title="📦 上门取件信息（旧证回收）">
              <Form.Item label="取件地址" name="pickupAddress" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item>
              <div style={{ display: 'flex', gap: 12 }}>
                <Form.Item label="联系人" name="pickupContactName" rules={[{ required: true }]} style={{ flex: 1 }}><Input /></Form.Item>
                <Form.Item label="手机" name="pickupContactPhone" rules={[{ required: true, pattern: /^1\d{10}$/ }]} style={{ flex: 1 }}><Input maxLength={11} /></Form.Item>
              </div>
            </Card>
            <Card style={{ borderRadius: 12, marginBottom: 16 }} size="small" title="📬 新证寄达地址">
              <Form.Item name="deliverySameAsPickup" valuePropName="checked"><Checkbox style={{ width: '100%' }}>与取件地址相同</Checkbox></Form.Item>
              <Form.Item noStyle shouldUpdate={(p, c) => p.deliverySameAsPickup !== c.deliverySameAsPickup}>
                {({ getFieldValue }) => !getFieldValue('deliverySameAsPickup') && (
                  <>
                    <Form.Item label="送达地址" name="deliveryAddress" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <Form.Item label="联系人" name="deliveryContactName" rules={[{ required: true }]} style={{ flex: 1 }}><Input /></Form.Item>
                      <Form.Item label="手机" name="deliveryContactPhone" rules={[{ required: true }]} style={{ flex: 1 }}><Input maxLength={11} /></Form.Item>
                    </div>
                  </>
                )}
              </Form.Item>
              <div style={{ marginTop: 8, padding: 8, background: '#f0f9ff', borderRadius: 6, fontSize: 12, color: '#026' }}>
                ℹ️ 邮寄信息将预填并同步至公安人口库系统，新证直接由制证中心EMS寄出
              </div>
            </Card>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button block onClick={() => setStep(0)}>上一步</Button>
              <Button type="primary" block htmlType="submit">下一步</Button>
            </div>
          </Form>
        )}
        {step === 2 && (
          <Form form={form} layout="vertical">
            <Card style={{ borderRadius: 12, marginBottom: 16 }} size="small" title="💰 费用确认">
              {(() => {
                const service = Number(cfg?.idCardServiceFee || 20);
                const gov = 40;
                const courier = Number(cfg?.courierFeeStandard || 18) * 2;
                const total = service + gov + courier;
                return (
                  <>
                    <div className="amount-row"><span>身份核验+服务费</span><span>¥{service}</span></div>
                    <div className="amount-row"><span>制证工本费</span><span>¥{gov}</span></div>
                    <div className="amount-row"><span>EMS往返</span><span>¥{courier}</span></div>
                    <div className="amount-row" style={{ fontWeight: 600, fontSize: 15, border: 'none' }}>
                      <span>合计</span><span style={{ color: '#F53F3F' }}>¥{total}</span>
                    </div>
                  </>
                );
              })()}
            </Card>
            <Card style={{ borderRadius: 12, marginBottom: 16 }} size="small" title="🔒 公安人口库同步说明">
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
                · 您的邮寄信息将加密同步至公安人口库系统<br/>
                · 新证由制证中心直接签发EMS寄达<br/>
                · 旧证回收后统一销毁，保障信息安全<br/>
                · 可在"粤省事"小程序同步查询办证进度
              </div>
            </Card>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button block onClick={() => setStep(1)}>上一步</Button>
              <Button type="primary" block onClick={submit} loading={submitting}>提交申请</Button>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
};

import { Space } from 'antd';
export default IdCardApplyPage;
