import React, { useState } from 'react';
import { Tabs, Card, Form, Input, Select, Button, Upload, message, Result } from 'antd';
import {
  UserOutlined,
  CarOutlined,
  UploadOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { http } from '../utils/request';
import type { ApiResponse } from '../../shared/types';

const { TextArea } = Input;

const licenseTypeOptions = [
  { value: 'A1', label: 'A1 - 大型客车' },
  { value: 'A2', label: 'A2 - 牵引车' },
  { value: 'B1', label: 'B1 - 中型客车' },
  { value: 'B2', label: 'B2 - 大型货车' },
  { value: 'C1', label: 'C1 - 小型汽车' },
];

const vehicleTypeOptions = [
  { value: 'van', label: '厢式货车' },
  { value: 'flatbed', label: '平板车' },
  { value: 'refrigerated', label: '冷藏车' },
  { value: 'tanker', label: '罐车' },
  { value: 'container', label: '集装箱车' },
  { value: 'dump', label: '自卸车' },
];

const AuthCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('driver');
  const [driverForm] = Form.useForm();
  const [vehicleForm] = Form.useForm();
  const [driverSubmitting, setDriverSubmitting] = useState(false);
  const [vehicleSubmitting, setVehicleSubmitting] = useState(false);
  const [driverSuccess, setDriverSuccess] = useState(false);
  const [vehicleSuccess, setVehicleSuccess] = useState(false);

  const submitDriverAuth = async () => {
    try {
      const values = await driverForm.validateFields();
      setDriverSubmitting(true);
      await http.post<ApiResponse<unknown>>('/auth/driver', values);
      message.success('司机认证提交成功');
      setDriverSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        message.error(err.message || '认证提交失败');
      }
    } finally {
      setDriverSubmitting(false);
    }
  };

  const submitVehicleAuth = async () => {
    try {
      const values = await vehicleForm.validateFields();
      setVehicleSubmitting(true);
      await http.post<ApiResponse<unknown>>('/auth/vehicle', values);
      message.success('车辆认证提交成功');
      setVehicleSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        message.error(err.message || '认证提交失败');
      }
    } finally {
      setVehicleSubmitting(false);
    }
  };

  const handleDriverReset = () => {
    driverForm.resetFields();
    setDriverSuccess(false);
  };

  const handleVehicleReset = () => {
    vehicleForm.resetFields();
    setVehicleSuccess(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card variant="borderless" className="card-shadow">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          centered
          items={[
            {
              key: 'driver',
              label: (
                <span>
                  <UserOutlined className="mr-1" />
                  司机认证
                </span>
              ),
            },
            {
              key: 'vehicle',
              label: (
                <span>
                  <CarOutlined className="mr-1" />
                  车辆认证
                </span>
              ),
            },
          ]}
        />

        {activeTab === 'driver' && (
          <div className="max-w-lg mx-auto py-4">
            {driverSuccess ? (
              <Result
                status="success"
                title="认证信息已提交"
                subTitle="我们将在1-3个工作日内完成审核，请耐心等待"
                extra={
                  <Button type="primary" onClick={handleDriverReset}>
                    重新提交
                  </Button>
                }
              />
            ) : (
              <Form
                form={driverForm}
                layout="vertical"
                className="space-y-0"
              >
                <Form.Item
                  name="name"
                  label="姓名"
                  rules={[{ required: true, message: '请输入姓名' }]}
                >
                  <Input placeholder="请输入真实姓名" prefix={<UserOutlined />} />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label="手机号"
                  rules={[
                    { required: true, message: '请输入手机号' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                  ]}
                >
                  <Input placeholder="请输入手机号" maxLength={11} />
                </Form.Item>

                <Form.Item
                  name="idCard"
                  label="身份证号"
                  rules={[
                    { required: true, message: '请输入身份证号' },
                    { pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/, message: '请输入正确的身份证号' },
                  ]}
                >
                  <Input placeholder="请输入18位身份证号" maxLength={18} />
                </Form.Item>

                <Form.Item
                  name="driverLicense"
                  label="驾驶证编号"
                  rules={[{ required: true, message: '请输入驾驶证编号' }]}
                >
                  <Input placeholder="请输入驾驶证编号" />
                </Form.Item>

                <Form.Item
                  name="driverLicenseType"
                  label="准驾车型"
                  rules={[{ required: true, message: '请选择准驾车型' }]}
                >
                  <Select placeholder="请选择准驾车型" options={licenseTypeOptions} />
                </Form.Item>

                <Form.Item
                  name="qualificationCertificate"
                  label="从业资格证号"
                >
                  <Input placeholder="请输入从业资格证号（选填）" />
                </Form.Item>

                <Form.Item label="驾驶证照片">
                  <Upload
                    listType="picture-card"
                    maxCount={2}
                    beforeUpload={() => false}
                  >
                    <div className="flex flex-col items-center">
                      <UploadOutlined className="text-lg text-gray-400" />
                      <span className="text-xs text-gray-400 mt-1">上传照片</span>
                    </div>
                  </Upload>
                </Form.Item>

                <Form.Item className="mt-6 mb-0">
                  <div className="flex gap-3">
                    <Button
                      type="primary"
                      size="large"
                      block
                      icon={<SafetyCertificateOutlined />}
                      loading={driverSubmitting}
                      onClick={submitDriverAuth}
                      style={{ background: '#165DFF' }}
                    >
                      提交司机认证
                    </Button>
                  </div>
                </Form.Item>
              </Form>
            )}
          </div>
        )}

        {activeTab === 'vehicle' && (
          <div className="max-w-lg mx-auto py-4">
            {vehicleSuccess ? (
              <Result
                status="success"
                title="认证信息已提交"
                subTitle="我们将在1-3个工作日内完成审核，请耐心等待"
                extra={
                  <Button type="primary" onClick={handleVehicleReset}>
                    重新提交
                  </Button>
                }
              />
            ) : (
              <Form
                form={vehicleForm}
                layout="vertical"
                className="space-y-0"
              >
                <Form.Item
                  name="plateNo"
                  label="车牌号"
                  rules={[
                    { required: true, message: '请输入车牌号' },
                    { pattern: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤川青藏琼宁使领][A-Z][A-Z0-9]{5,6}$/, message: '请输入正确的车牌号' },
                  ]}
                >
                  <Input placeholder="如：京A12345" prefix={<CarOutlined />} />
                </Form.Item>

                <Form.Item
                  name="vehicleType"
                  label="车辆类型"
                  rules={[{ required: true, message: '请选择车辆类型' }]}
                >
                  <Select placeholder="请选择车辆类型" options={vehicleTypeOptions} />
                </Form.Item>

                <Form.Item
                  name="vehicleLength"
                  label="车长（米）"
                  rules={[{ required: true, message: '请输入车长' }]}
                >
                  <Input placeholder="如：9.6" type="number" />
                </Form.Item>

                <Form.Item
                  name="maxLoad"
                  label="载重（吨）"
                  rules={[{ required: true, message: '请输入载重' }]}
                >
                  <Input placeholder="如：15" type="number" />
                </Form.Item>

                <Form.Item
                  name="maxVolume"
                  label="容积（m³）"
                >
                  <Input placeholder="如：60" type="number" />
                </Form.Item>

                <Form.Item
                  name="color"
                  label="车身颜色"
                >
                  <Input placeholder="如：白色" />
                </Form.Item>

                <Form.Item
                  name="drivingLicense"
                  label="行驶证编号"
                  rules={[{ required: true, message: '请输入行驶证编号' }]}
                >
                  <Input placeholder="请输入行驶证编号" />
                </Form.Item>

                <Form.Item
                  name="roadTransportPermit"
                  label="道路运输证号"
                >
                  <Input placeholder="请输入道路运输证号（选填）" />
                </Form.Item>

                <Form.Item label="行驶证照片">
                  <Upload
                    listType="picture-card"
                    maxCount={2}
                    beforeUpload={() => false}
                  >
                    <div className="flex flex-col items-center">
                      <UploadOutlined className="text-lg text-gray-400" />
                      <span className="text-xs text-gray-400 mt-1">上传照片</span>
                    </div>
                  </Upload>
                </Form.Item>

                <Form.Item className="mt-6 mb-0">
                  <div className="flex gap-3">
                    <Button
                      type="primary"
                      size="large"
                      block
                      icon={<SafetyCertificateOutlined />}
                      loading={vehicleSubmitting}
                      onClick={submitVehicleAuth}
                      style={{ background: '#165DFF' }}
                    >
                      提交车辆认证
                    </Button>
                  </div>
                </Form.Item>
              </Form>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuthCenter;
