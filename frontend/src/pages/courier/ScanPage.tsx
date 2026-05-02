import React, { useState } from 'react';
import { Card, Form, Input, Button, InputNumber, message, Tag, Typography, Divider, Space } from 'antd';
import { ScanOutlined, BarcodeOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;

interface PackageDetails {
  trackingNumber: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;
  weight?: number;
}

export default function ScanPage() {
  const [form] = Form.useForm();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const handleScan = async (values: PackageDetails) => {
    setScanning(true);
    try {
      const response = await api.post('/packages/scan', {
        trackingNumber: values.trackingNumber,
        packageDetails: {
          receiverName: values.receiverName,
          receiverPhone: values.receiverPhone,
          receiverAddress: values.receiverAddress,
          senderName: values.senderName,
          senderPhone: values.senderPhone,
          senderAddress: values.senderAddress,
          weight: values.weight
        }
      });
      
      setScanResult(response.data);
      message.success('包裹入库成功！');
      form.resetFields(['trackingNumber', 'receiverName', 'receiverPhone', 'receiverAddress', 'senderName', 'senderPhone', 'senderAddress', 'weight']);
    } catch (error: any) {
      message.error(error.response?.data?.error || '入库失败');
    } finally {
      setScanning(false);
    }
  };

  const generateMockTracking = () => {
    const carriers = ['SF', 'YT', 'ZT', 'JD'];
    const carrier = carriers[Math.floor(Math.random() * carriers.length)];
    const numbers = Array.from({ length: 12 }, () => 
      Math.floor(Math.random() * 10).toString()
    ).join('');
    form.setFieldValue('trackingNumber', `${carrier}${numbers}`);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <Title level={4} style={{ marginBottom: 24 }}>
          <ScanOutlined style={{ marginRight: 8 }} />
          包裹入库扫描
        </Title>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleScan}
        >
          <Form.Item
            name="trackingNumber"
            label="运单号"
            rules={[{ required: true, message: '请输入或扫描运单号' }]}
          >
            <Input
              prefix={<BarcodeOutlined />}
              placeholder="请输入运单号或扫描条码"
              size="large"
              addonAfter={
                <Button onClick={generateMockTracking}>模拟扫码</Button>
              }
            />
          </Form.Item>

          <Divider orientation="left">收件人信息</Divider>

          <Form.Item
            name="receiverName"
            label="收件人姓名"
            rules={[{ required: true, message: '请输入收件人姓名' }]}
          >
            <Input placeholder="请输入收件人姓名" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="receiverPhone"
              label="收件人电话"
              rules={[{ required: true, message: '请输入收件人电话' }]}
            >
              <Input placeholder="请输入收件人电话" />
            </Form.Item>

            <Form.Item
              name="weight"
              label="重量 (kg)"
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="包裹重量"
                min={0}
                step={0.1}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="receiverAddress"
            label="收件地址"
            rules={[{ required: true, message: '请输入收件地址' }]}
          >
            <Input.TextArea
              placeholder="请输入详细收件地址"
              rows={2}
            />
          </Form.Item>

          <Divider orientation="left">寄件人信息（可选）</Divider>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="senderName"
              label="寄件人姓名"
            >
              <Input placeholder="请输入寄件人姓名" />
            </Form.Item>

            <Form.Item
              name="senderPhone"
              label="寄件人电话"
            >
              <Input placeholder="请输入寄件人电话" />
            </Form.Item>
          </div>

          <Form.Item
            name="senderAddress"
            label="寄件地址"
          >
            <Input.TextArea
              placeholder="请输入详细寄件地址"
              rows={2}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={scanning}
              icon={<ScanOutlined />}
              style={{ width: '100%' }}
            >
              确认入库
            </Button>
          </Form.Item>
        </Form>

        {scanResult && (
          <Card type="inner" title="入库结果" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">运单号：</Text>
                <Tag color="blue">{scanResult.trackingNumber}</Tag>
              </div>
              <div>
                <Text type="secondary">收件人：</Text>
                <Text strong>{scanResult.receiverName}</Text>
                <Text style={{ marginLeft: 16 }}>{scanResult.receiverPhone}</Text>
              </div>
              <div>
                <Text type="secondary">状态：</Text>
                <Tag color="green">已入库</Tag>
              </div>
            </Space>
          </Card>
        )}
      </Card>
    </div>
  );
}
