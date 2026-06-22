import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Select, Slider, Switch, Button, Checkbox, message, TimePicker } from 'antd';
import { SettingOutlined, EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import PageHeader from '@/components/PageHeader';
import Loading from '@/components/Loading';
import { riderService } from '@/services/rider.service';
import type { RiderPreference } from '@shared/types';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = TimePicker;

const Preferences: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<RiderPreference | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const data = await riderService.getPreferences();
      setPreferences(data);
      form.setFieldsValue({
        orderTypes: data.orderTypes,
        maxDistance: data.maxDistance,
        minAmount: data.minAmount,
        acceptAutoDispatch: data.acceptAutoDispatch,
        workingHours: data.workingHours?.map((h: any) => [
          dayjs(h.start, 'HH:mm'),
          dayjs(h.end, 'HH:mm'),
        ]),
        avoidAreas: data.avoidAreas,
        vehicleType: data.vehicleType || user?.vehicleType,
      });
    } catch (error) {
      console.error('Load preferences error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      const formattedValues = {
        ...values,
        workingHours: values.workingHours?.map((h: any) => ({
          start: h[0].format('HH:mm'),
          end: h[1].format('HH:mm'),
        })),
      };
      await riderService.updatePreferences(formattedValues);
      message.success('偏好设置已保存');
      navigate(-1);
    } catch (error) {
      console.error('Save preferences error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  const orderTypeOptions = [
    { label: '快递', value: 'express' },
    { label: '外卖', value: 'takeout' },
    { label: '生鲜', value: 'grocery' },
    { label: '药品', value: 'medicine' },
    { label: '文件', value: 'document' },
    { label: '其他', value: 'other' },
  ];

  return (
    <div className="page-container">
      <PageHeader title="接单偏好" showBack />

      <div className="p-4 space-y-4">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <SettingOutlined className="text-blue-500" />
              订单类型
            </h3>
            <Form.Item
              name="orderTypes"
              label="选择接单类型"
              rules={[{ required: true, message: '请至少选择一种订单类型' }]}
            >
              <Checkbox.Group options={orderTypeOptions} />
            </Form.Item>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <EnvironmentOutlined className="text-green-500" />
              配送范围
            </h3>

            <Form.Item
              name="maxDistance"
              label={`最大接单距离: ${form.getFieldValue('maxDistance') || 5}公里`}
            >
              <Slider min={1} max={20} step={1} />
            </Form.Item>

            <Form.Item
              name="minAmount"
              label={`最低接单金额: ¥${form.getFieldValue('minAmount') || 0}`}
            >
              <Slider min={0} max={50} step={1} />
            </Form.Item>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <ClockCircleOutlined className="text-orange-500" />
              工作时间
            </h3>

            <Form.Item name="workingHours" label="设置工作时间段">
              <RangePicker
                format="HH:mm"
                minuteStep={30}
                multiple
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="acceptAutoDispatch"
              label="智能派单"
              valuePropName="checked"
            >
              <Switch checkedChildren="开启" unCheckedChildren="关闭" />
            </Form.Item>
            <p className="text-xs text-gray-500">开启后系统将自动为您推送符合偏好的订单</p>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">车辆信息</h3>

            <Form.Item
              name="vehicleType"
              label="车辆类型"
              rules={[{ required: true, message: '请选择车辆类型' }]}
            >
              <Select placeholder="请选择车辆类型">
                <Option value="electric_scooter">电动车</Option>
                <Option value="motorcycle">摩托车</Option>
                <Option value="car">汽车</Option>
                <Option value="bicycle">自行车</Option>
                <Option value="walk">步行</Option>
              </Select>
            </Form.Item>
          </div>

          <div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-white border-t">
            <Button type="primary" size="large" block htmlType="submit" loading={saving}>
              保存设置
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Preferences;
