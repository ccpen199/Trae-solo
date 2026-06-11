import React, { useState, useEffect } from 'react';
import {
  Card, Steps, Button, Form, Input, InputNumber, Select, Radio,
  DatePicker, Switch, Slider, Descriptions, message, Row, Col, Divider, Space, Alert, Tag,
} from 'antd';
import { CheckCircleOutlined, LineChartOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cargoApi, type CreateCargoRequest } from '../api/cargo';
import { formatMoney } from '../utils/format';
import dayjs from 'dayjs';

const cities = ['上海', '北京', '广州', '深圳', '杭州', '南京', '成都', '武汉', '重庆', '天津', '苏州', '郑州', '长沙', '西安', '合肥'];
const packageTypes = ['木箱', '纸箱', '编织袋', '托盘', '桶装', '散装', '其他'];
const vehicleTypeOptions = [
  { label: '4.2米厢式', value: '4.2米厢式' },
  { label: '6.8米厢式', value: '6.8米厢式' },
  { label: '9.6米厢式', value: '9.6米厢式' },
  { label: '13米半挂', value: '13米半挂' },
  { label: '17.5米大板', value: '17.5米大板' },
  { label: '冷藏车', value: '冷藏车' },
  { label: '平板车', value: '平板车' },
];
const insuranceTypes = [
  { label: '基本险', value: 'basic' },
  { label: '综合险', value: 'comprehensive' },
  { label: '一切险', value: 'all_risk' },
];

interface FormData {
  cargoName: string;
  cargoType: 'LTL' | 'FTL';
  weight?: number;
  volume?: number;
  quantity?: number;
  packageType?: string;
  startCity: string;
  endCity: string;
  startAddress: string;
  endAddress: string;
  pickupTime: dayjs.Dayjs | null;
  deliveryTime?: dayjs.Dayjs | null;
  vehicleType: string;
  vehicleLength?: number;
  expectedPrice: number;
  insuranceEnabled: boolean;
  insuranceType?: string;
  insuranceAmount?: number;
  insurancePremium?: number;
  temperatureEnabled: boolean;
  temperatureMin?: number;
  temperatureMax?: number;
}

const CargoPublish: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<FormData>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState<FormData>({
    cargoName: '',
    cargoType: 'FTL',
    startCity: searchParams.get('startCity') || '',
    endCity: searchParams.get('endCity') || '',
    startAddress: '',
    endAddress: '',
    pickupTime: null,
    vehicleType: searchParams.get('vehicleType') || '',
    expectedPrice: searchParams.get('expectedPrice') ? Number(searchParams.get('expectedPrice')) : 0,
    insuranceEnabled: false,
    temperatureEnabled: false,
  });

  useEffect(() => {
    const urlFields: Partial<FormData> = {};
    const startCity = searchParams.get('startCity');
    const endCity = searchParams.get('endCity');
    const vehicleType = searchParams.get('vehicleType');
    const expectedPrice = searchParams.get('expectedPrice');
    if (startCity) urlFields.startCity = startCity;
    if (endCity) urlFields.endCity = endCity;
    if (vehicleType) urlFields.vehicleType = vehicleType;
    if (expectedPrice) urlFields.expectedPrice = Number(expectedPrice);
    if (Object.keys(urlFields).length > 0) {
      form.setFieldsValue(urlFields);
    }
  }, [searchParams, form]);

  const updateFormData = (partial: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...partial }));
  };

  const handleNext = async () => {
    try {
      if (current === 0) {
        await form.validateFields(['cargoName', 'cargoType']);
      } else if (current === 1) {
        await form.validateFields(['startCity', 'endCity', 'startAddress', 'endAddress', 'pickupTime', 'vehicleType', 'expectedPrice']);
      }
      setCurrent(current + 1);
    } catch {
    }
  };

  const handlePrev = () => {
    setCurrent(current - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload: CreateCargoRequest = {
        cargoName: formData.cargoName,
        cargoType: formData.cargoType,
        weight: formData.weight,
        volume: formData.volume,
        quantity: formData.quantity,
        packageType: formData.packageType,
        startCity: formData.startCity,
        endCity: formData.endCity,
        startAddress: formData.startAddress,
        endAddress: formData.endAddress,
        pickupTime: formData.pickupTime ? dayjs(formData.pickupTime).format('YYYY-MM-DD HH:mm:ss') : '',
        deliveryTime: formData.deliveryTime ? dayjs(formData.deliveryTime).format('YYYY-MM-DD HH:mm:ss') : undefined,
        vehicleReq: {
          vehicleType: formData.vehicleType,
          vehicleLength: formData.vehicleLength ?? 0,
        },
        expectedPrice: formData.expectedPrice,
      };

      if (formData.insuranceEnabled) {
        payload.insurance = {
          enabled: true,
          type: formData.insuranceType ?? 'basic',
          amount: formData.insuranceAmount ?? 0,
          premium: formData.insurancePremium ?? 0,
        };
      }

      if (formData.temperatureEnabled) {
        payload.temperatureReq = {
          min: formData.temperatureMin ?? -20,
          max: formData.temperatureMax ?? 20,
          unit: 'celsius',
        };
      }

      const res = await cargoApi.create(payload);

      if (formData.insuranceEnabled || formData.temperatureEnabled) {
        await cargoApi.publish(res.data.id);
      }

      message.success('货源发布成功');
      navigate('/cargo/list');
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const insuranceRate = 0.003;
  const computedPremium = formData.insuranceAmount
    ? Math.round(formData.insuranceAmount * insuranceRate * 100) / 100
    : 0;

  const step1 = (
    <div className="max-w-2xl">
      <Form form={form} layout="vertical" initialValues={formData} onValuesChange={(_, allValues) => updateFormData(allValues)}>
        <Form.Item label="货物名称" name="cargoName" rules={[{ required: true, message: '请输入货物名称' }]}>
          <Input placeholder="请输入货物名称" />
        </Form.Item>
        <Form.Item label="货物类型" name="cargoType" rules={[{ required: true, message: '请选择货物类型' }]}>
          <Radio.Group>
            <Radio value="LTL">零担 (LTL)</Radio>
            <Radio value="FTL">整车 (FTL)</Radio>
          </Radio.Group>
        </Form.Item>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="重量(吨)" name="weight">
              <InputNumber placeholder="请输入" className="w-full" min={0} step={0.1} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="体积(m³)" name="volume">
              <InputNumber placeholder="请输入" className="w-full" min={0} step={0.1} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="件数" name="quantity">
              <InputNumber placeholder="请输入" className="w-full" min={0} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="包装方式" name="packageType">
          <Select placeholder="请选择包装方式" allowClear options={packageTypes.map(p => ({ label: p, value: p }))} />
        </Form.Item>
      </Form>
    </div>
  );

  const step2 = (
    <div className="max-w-2xl">
      <Form form={form} layout="vertical" initialValues={formData} onValuesChange={(_, allValues) => updateFormData(allValues)}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="出发城市" name="startCity" rules={[{ required: true, message: '请选择出发城市' }]}>
              <Select placeholder="请选择" showSearch options={cities.map(c => ({ label: c, value: c }))} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="目的城市" name="endCity" rules={[{ required: true, message: '请选择目的城市' }]}>
              <Select placeholder="请选择" showSearch options={cities.map(c => ({ label: c, value: c }))} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="出发地址" name="startAddress" rules={[{ required: true, message: '请输入出发地址' }]}>
          <Input placeholder="请输入详细出发地址" />
        </Form.Item>
        <Form.Item label="目的地址" name="endAddress" rules={[{ required: true, message: '请输入目的地址' }]}>
          <Input placeholder="请输入详细目的地址" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="装货时间" name="pickupTime" rules={[{ required: true, message: '请选择装货时间' }]}>
              <DatePicker showTime className="w-full" placeholder="请选择" format="YYYY-MM-DD HH:mm" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="送达时间" name="deliveryTime">
              <DatePicker showTime className="w-full" placeholder="请选择" format="YYYY-MM-DD HH:mm" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="车型要求" name="vehicleType" rules={[{ required: true, message: '请选择车型' }]}>
              <Select placeholder="请选择车型" options={vehicleTypeOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="车长(米)" name="vehicleLength">
              <InputNumber placeholder="请输入" className="w-full" min={0} step={0.1} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="期望运费(元)" name="expectedPrice" rules={[{ required: true, message: '请输入期望运费' }]}>
          <InputNumber placeholder="请输入期望运费" className="w-full" min={0} step={100} addonAfter="元" />
        </Form.Item>
      </Form>
    </div>
  );

  const step3 = (
    <div className="max-w-2xl">
      <Form form={form} layout="vertical" initialValues={formData} onValuesChange={(_, allValues) => updateFormData(allValues)}>
        <Divider orientation="left">保险选项</Divider>
        <Form.Item label="是否投保" name="insuranceEnabled" valuePropName="checked">
          <Switch checkedChildren="是" unCheckedChildren="否" />
        </Form.Item>
        {formData.insuranceEnabled && (
          <>
            <Form.Item label="保险类型" name="insuranceType">
              <Select placeholder="请选择保险类型" options={insuranceTypes} />
            </Form.Item>
            <Form.Item label="保额(元)" name="insuranceAmount">
              <InputNumber
                placeholder="请输入保额"
                className="w-full"
                min={0}
                step={1000}
                onChange={() => updateFormData({ insurancePremium: computedPremium })}
              />
            </Form.Item>
            <Form.Item label="保费(元)">
              <InputNumber
                className="w-full"
                value={computedPremium}
                disabled
                addonAfter="元"
              />
            </Form.Item>
          </>
        )}

        <Divider orientation="left">温控要求</Divider>
        <Form.Item label="温控开关" name="temperatureEnabled" valuePropName="checked">
          <Switch checkedChildren="开" unCheckedChildren="关" />
        </Form.Item>
        {formData.temperatureEnabled && (
          <>
            <Form.Item label="温度范围(℃)">
              <Row gutter={16}>
                <Col span={10}>
                  <Form.Item name="temperatureMin" noStyle>
                    <InputNumber placeholder="最低温度" className="w-full" min={-40} max={60} />
                  </Form.Item>
                </Col>
                <Col span={4} className="flex items-center justify-center">
                  <span className="text-gray-400">—</span>
                </Col>
                <Col span={10}>
                  <Form.Item name="temperatureMax" noStyle>
                    <InputNumber placeholder="最高温度" className="w-full" min={-40} max={60} />
                  </Form.Item>
                </Col>
              </Row>
            </Form.Item>
            <Form.Item label="温度范围指示">
              <Slider
                range
                min={-40}
                max={60}
                value={[
                  formData.temperatureMin ?? -20,
                  formData.temperatureMax ?? 20,
                ]}
                onChange={([min, max]) => updateFormData({ temperatureMin: min, temperatureMax: max })}
                marks={{ '-40': '-40℃', 0: '0℃', 20: '20℃', 60: '60℃' }}
              />
            </Form.Item>
          </>
        )}
      </Form>
    </div>
  );

  const priceFromQuery = searchParams.get('startCity') && searchParams.get('endCity');

  const step4 = (
    <div className="max-w-3xl">
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="货物名称" span={1}>{formData.cargoName || '-'}</Descriptions.Item>
        <Descriptions.Item label="货物类型" span={1}>{formData.cargoType === 'LTL' ? '零担' : '整车'}</Descriptions.Item>
        <Descriptions.Item label="重量" span={1}>{formData.weight ? `${formData.weight} 吨` : '-'}</Descriptions.Item>
        <Descriptions.Item label="体积" span={1}>{formData.volume ? `${formData.volume} m³` : '-'}</Descriptions.Item>
        <Descriptions.Item label="件数" span={1}>{formData.quantity ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="包装方式" span={1}>{formData.packageType || '-'}</Descriptions.Item>
      </Descriptions>

      <Divider orientation="left">运输要求</Divider>
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="出发城市" span={1}>{formData.startCity || '-'}</Descriptions.Item>
        <Descriptions.Item label="目的城市" span={1}>{formData.endCity || '-'}</Descriptions.Item>
        <Descriptions.Item label="出发地址" span={2}>{formData.startAddress || '-'}</Descriptions.Item>
        <Descriptions.Item label="目的地址" span={2}>{formData.endAddress || '-'}</Descriptions.Item>
        <Descriptions.Item label="装货时间" span={1}>{formData.pickupTime ? dayjs(formData.pickupTime).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
        <Descriptions.Item label="送达时间" span={1}>{formData.deliveryTime ? dayjs(formData.deliveryTime).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
        <Descriptions.Item label="车型要求" span={1}>{formData.vehicleType || '-'}</Descriptions.Item>
        <Descriptions.Item label="车长" span={1}>{formData.vehicleLength ? `${formData.vehicleLength} 米` : '-'}</Descriptions.Item>
        <Descriptions.Item label="期望运费" span={2}>
          <span className="text-lg font-semibold" style={{ color: '#165DFF' }}>
            {formatMoney(formData.expectedPrice)}
          </span>
          {priceFromQuery && (
            <Tag color="blue" className="ml-2">
              <LineChartOutlined /> 运价查询参考
            </Tag>
          )}
        </Descriptions.Item>
      </Descriptions>

      {(formData.insuranceEnabled || formData.temperatureEnabled) && (
        <>
          <Divider orientation="left">附加选项</Divider>
          <Descriptions bordered column={2} size="small">
            {formData.insuranceEnabled && (
              <>
                <Descriptions.Item label="投保" span={1}>是</Descriptions.Item>
                <Descriptions.Item label="保险类型" span={1}>
                  {insuranceTypes.find(t => t.value === formData.insuranceType)?.label || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="保额" span={1}>{formData.insuranceAmount ? formatMoney(formData.insuranceAmount) : '-'}</Descriptions.Item>
                <Descriptions.Item label="保费" span={1}>{formatMoney(computedPremium)}</Descriptions.Item>
              </>
            )}
            {formData.temperatureEnabled && (
              <>
                <Descriptions.Item label="温控" span={1}>开启</Descriptions.Item>
                <Descriptions.Item label="温度范围" span={1}>
                  {formData.temperatureMin ?? '-'}℃ ~ {formData.temperatureMax ?? '-'}℃
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        </>
      )}

      <div className="flex items-center justify-center mt-8 p-6 bg-blue-50 rounded-lg">
        <CheckCircleOutlined style={{ fontSize: 48, color: '#165DFF' }} />
        <div className="ml-4">
          <p className="text-lg font-semibold">确认信息无误</p>
          <p className="text-gray-500">请仔细核对以上信息，确认无误后点击发布</p>
        </div>
      </div>
    </div>
  );

  const steps = [
    { title: '货物信息', content: step1 },
    { title: '运输要求', content: step2 },
    { title: '保险与温控', content: step3 },
    { title: '确认发布', content: step4 },
  ];

  return (
    <div className="space-y-6">
      {priceFromQuery && (
        <Alert
          type="info"
          showIcon
          icon={<LineChartOutlined />}
          message="运价参考信息"
          description={
            <div className="flex items-center gap-4 flex-wrap">
              <span>线路：<Tag color="blue">{searchParams.get('startCity')}</Tag> → <Tag color="blue">{searchParams.get('endCity')}</Tag></span>
              {searchParams.get('vehicleType') && <span>车型：<Tag color="cyan">{searchParams.get('vehicleType')}</Tag></span>}
              {searchParams.get('expectedPrice') && (
                <span>运价指数参考：<span className="text-lg font-semibold" style={{ color: '#165DFF' }}>{formatMoney(Number(searchParams.get('expectedPrice')))}</span></span>
              )}
              <span className="text-gray-400 text-xs">（来源：运价查询，已自动填入表单）</span>
            </div>
          }
          className="mb-2"
          closable
        />
      )}
      <Card variant="borderless" className="card-shadow">
        <Steps current={current} items={steps.map(s => ({ title: s.title }))} className="mb-8" />
        <div className="min-h-[400px]">{steps[current].content}</div>
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
          <Space>
            {current > 0 && (
              <Button onClick={handlePrev}>上一步</Button>
            )}
            {current < steps.length - 1 && (
              <Button type="primary" onClick={handleNext} style={{ background: '#165DFF' }}>
                下一步
              </Button>
            )}
            {current === steps.length - 1 && (
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={submitting}
                style={{ background: '#165DFF' }}
              >
                确认发布
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default CargoPublish;
