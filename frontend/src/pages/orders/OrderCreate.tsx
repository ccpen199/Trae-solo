import React, { useState, useEffect } from 'react';
import { Card, Form, Select, DatePicker, Button, InputNumber, message, Row, Col, Descriptions } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { vehicleApi, storeApi, userApi, orderApi } from '../../services/api';
import { Vehicle, Store } from '../../types';

const { RangePicker } = DatePicker;
const { Option } = Select;

const OrderCreate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDates, setSelectedDates] = useState<any>(null);
  const [totalDays, setTotalDays] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    loadData();
    const vehicleId = searchParams.get('vehicle_id');
    if (vehicleId) {
      form.setFieldsValue({ vehicle_id: Number(vehicleId) });
      handleVehicleChange(Number(vehicleId));
    }
  }, []);

  const loadData = async () => {
    try {
      const [vRes, sRes, cRes] = await Promise.all([
        vehicleApi.available(),
        storeApi.all(),
        userApi.customers().catch(() => ({ data: [] }))
      ]);
      setVehicles(vRes.data || []);
      setStores(sRes.data || []);
      setCustomers(cRes.data || []);
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const handleVehicleChange = (value: number) => {
    const vehicle = vehicles.find(v => v.id === value);
    setSelectedVehicle(vehicle || null);
    if (vehicle && selectedDates) {
      calculateAmount(vehicle, selectedDates[0], selectedDates[1]);
    }
  };

  const handleDateChange = (dates: any) => {
    setSelectedDates(dates);
    if (dates && selectedVehicle) {
      calculateAmount(selectedVehicle, dates[0], dates[1]);
    }
  };

  const calculateAmount = (vehicle: Vehicle, start: any, end: any) => {
    const days = Math.ceil(end.diff(start, 'day', true));
    setTotalDays(days);
    const base = vehicle.daily_rate * days;
    const insurance = vehicle.insurance_fee * days;
    setTotalAmount(base + insurance);
    form.setFieldsValue({
      total_days: days,
      base_amount: base,
      insurance_fee: insurance,
      total_amount: base + insurance
    });
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const data = {
        ...values,
        pickup_time: values.pickup_return[0].toISOString(),
        return_time: values.pickup_return[1].toISOString()
      };
      delete data.pickup_return;
      
      const res = await orderApi.create(data);
      if (res.code === 200) {
        message.success('订单创建成功');
        navigate(`/orders/${res.data.id}`);
      }
    } catch (err) {
      message.error('创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
          创建订单
        </h2>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Card title="订单信息">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item name="vehicle_id" label="选择车辆" rules={[{ required: true, message: '请选择车辆' }]}>
                <Select placeholder="请选择车辆" onChange={handleVehicleChange} showSearch optionFilterProp="children">
                  {vehicles.map(v => (
                    <Option key={v.id} value={v.id}>
                      {v.plate_number} - {v.brand} {v.model} (¥{v.daily_rate}/天)
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="user_id" label="选择客户" rules={[{ required: true, message: '请选择客户' }]}>
                <Select placeholder="请选择客户" showSearch optionFilterProp="children">
                  {customers.map(c => (
                    <Option key={c.id} value={c.id}>
                      {c.real_name} ({c.phone}) {c.license_verified === 1 ? '✅' : '⚠️ 未审核'}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="pickup_store_id" label="取车门店" rules={[{ required: true }]}>
                    <Select placeholder="请选择门店">
                      {stores.map(s => (
                        <Option key={s.id} value={s.id}>{s.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="return_store_id" label="还车门店" rules={[{ required: true }]}>
                    <Select placeholder="请选择门店">
                      {stores.map(s => (
                        <Option key={s.id} value={s.id}>{s.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="pickup_return" label="取还车时间" rules={[{ required: true, message: '请选择时间' }]}>
                <RangePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  onChange={handleDateChange}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} size="large">
                  创建订单
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={8}>
          {selectedVehicle && (
            <Card title="费用明细">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="日租金">¥{selectedVehicle.daily_rate}</Descriptions.Item>
                <Descriptions.Item label="保险费">¥{selectedVehicle.insurance_fee}/天</Descriptions.Item>
                <Descriptions.Item label="押金">¥{selectedVehicle.deposit_amount}</Descriptions.Item>
                {totalDays > 0 && (
                  <>
                    <Descriptions.Item label="租用天数">{totalDays}天</Descriptions.Item>
                    <Descriptions.Item label="基础租金">¥{selectedVehicle.daily_rate * totalDays}</Descriptions.Item>
                    <Descriptions.Item label="保险费合计">¥{selectedVehicle.insurance_fee * totalDays}</Descriptions.Item>
                    <Descriptions.Item label="应付总额">
                      <span style={{ color: '#1677ff', fontSize: 18, fontWeight: 600 }}>
                        ¥{totalAmount}
                      </span>
                    </Descriptions.Item>
                  </>
                )}
              </Descriptions>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default OrderCreate;
