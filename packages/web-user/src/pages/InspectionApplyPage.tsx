import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, DatePicker, Upload, Steps, message, Checkbox } from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { GD_CITIES } from '@platform/shared';
import api from '@/api';

const InspectionApplyPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [cfg, setCfg] = useState<any>(null);

  const steps = [{ title: '车辆信息' }, { title: '收寄信息' }, { title: '确认提交' }];

  const loadCfg = async (city: string) => {
    const res: any = await api.get(`/admin/city-configs/${city}`);
    setCfg(res.data);
  };

  const submit = async () => {
    const vals = form.getFieldsValue();
    if (vals.deliverySameAsPickup) {
      vals.deliveryAddress = vals.pickupAddress;
      vals.deliveryContactName = vals.pickupContactName;
      vals.deliveryContactPhone = vals.pickupContactPhone;
    }
    setSubmitting(true);
    try {
      const res: any = await api.post('/vehicle/inspection', {
        ...vals,
        registerDate: vals.registerDate?.toISOString(),
        inspectionImages: vals.inspectionImages?.map((f: any) => f.url || '/mock.jpg') || [],
      });
      message.success('申请提交成功！揽收员将在2小时内上门');
      navigate(`/order/${res.data.orderId}`);
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <div className="page-header" style={{ padding: 16 }}>
        <div onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', marginBottom: 12, cursor: 'pointer' }}>
          <ArrowLeftOutlined style={{ marginRight: 8 }} />返回
        </div>
        <div style={{ fontSize: 20, fontWeight: 600 }}>机动车六年免检</div>
        <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>上门取件 → 检测站API核验 → 合格标志寄达</div>
      </div>
      <Steps current={step} size="small" items={steps} style={{ padding: 16, background: '#fff' }} />
      <div className="form-section">
        {step === 0 && (
          <Form form={form} layout="vertical" onFinish={() => setStep(1)}>
            <Card style={{ borderRadius: 12, marginBottom: 16 }} size="small" title="📍 办理城市">
              <Form.Item name="applicantCity" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                <Select placeholder="选择办理城市" onChange={loadCfg}>
                  {GD_CITIES.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
                </Select>
              </Form.Item>
            </Card>
            <Card style={{ borderRadius: 12, marginBottom: 16 }} size="small" title="🚗 车辆信息">
              <Form.Item label="车牌号" name="plateNumber" rules={[{ required: true }]}>
                <Input placeholder="粤A12345" style={{ textTransform: 'uppercase' }} />
              </Form.Item>
              <Form.Item label="车辆类型" name="vehicleType" rules={[{ required: true }]}>
                <Select options={[
                  { value: '小型轿车', label: '小型轿车' },
                  { value: '小型普通客车', label: '小型普通客车' },
                  { value: '微型轿车', label: '微型轿车' },
                ]} />
              </Form.Item>
              <div style={{ display: 'flex', gap: 12 }}>
                <Form.Item label="发动机号" name="engineNo" rules={[{ required: true }]} style={{ flex: 1 }}>
                  <Input placeholder="完整号码" />
                </Form.Item>
                <Form.Item label="车架号(VIN)" name="vinNo" rules={[{ required: true }]} style={{ flex: 1 }}>
                  <Input placeholder="17位完整识别码" maxLength={17} />
                </Form.Item>
              </div>
              <Form.Item label="注册日期" name="registerDate" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="上传材料（行驶证/交强险）" name="inspectionImages" valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}>
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
            <Card style={{ borderRadius: 12, marginBottom: 16 }} size="small" title="📦 取件信息">
              <Form.Item label="取件地址" name="pickupAddress" rules={[{ required: true }]}>
                <Input.TextArea rows={2} />
              </Form.Item>
              <div style={{ display: 'flex', gap: 12 }}>
                <Form.Item label="联系人" name="pickupContactName" rules={[{ required: true }]} style={{ flex: 1 }}><Input /></Form.Item>
                <Form.Item label="手机" name="pickupContactPhone" rules={[{ required: true, pattern: /^1\d{10}$/ }]} style={{ flex: 1 }}><Input maxLength={11} /></Form.Item>
              </div>
            </Card>
            <Card style={{ borderRadius: 12, marginBottom: 16 }} size="small" title="📬 合格标志寄回">
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
                const service = Number(cfg?.inspectionServiceFee || 30);
                const courier = Number(cfg?.courierFeeStandard || 18) * 2;
                const total = service + courier;
                return (
                  <>
                    <div className="amount-row"><span>检测站API核验+服务费</span><span>¥{service}</span></div>
                    <div className="amount-row"><span>EMS往返快递费</span><span>¥{courier}</span></div>
                    <div className="amount-row" style={{ fontWeight: 600, fontSize: 15, border: 'none' }}>
                      <span>合计</span><span style={{ color: '#F53F3F' }}>¥{total}</span>
                    </div>
                  </>
                );
              })()}
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

export default InspectionApplyPage;
