import { useState } from 'react';
import { Card, Form, Input, Select, Button, Upload, message, Space } from 'antd';
import { PlusOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const { TextArea } = Input;

const workOrderTypes = [
  { value: 'plumbing', label: '水电维修' },
  { value: 'electrical', label: '电器维修' },
  { value: 'structural', label: '土建维修' },
  { value: 'other', label: '其他问题' },
];

const priorities = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '紧急' },
];

export default function WorkOrderSubmit() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [location, setLocation] = useState<any>(null);

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, address: '已获取位置' });
          message.success('位置获取成功');
        },
        () => message.error('位置获取失败，请手动填写')
      );
    } else {
      message.error('浏览器不支持定位');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const imageUrls: string[] = [];
      if (fileList.length > 0) {
        const formData = new FormData();
        fileList.forEach((f) => formData.append('files', f.originFileObj));
        const uploadRes = await api.post('/upload', formData);
        imageUrls.push(...uploadRes.data.urls);
      }
      await api.post('/workorders', {
        ...values,
        images: imageUrls,
        location: location || null,
      });
      message.success('报修提交成功，系统将自动派单');
      navigate('/workorders');
    } catch (err: any) {
      message.error(err.response?.data?.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="提交报修工单" style={{ maxWidth: 720, margin: '0 auto', borderRadius: 12 }}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="报修类型" name="type" rules={[{ required: true }]}>
          <Select placeholder="请选择报修类型" options={workOrderTypes} />
        </Form.Item>
        <Form.Item label="优先级" name="priority" initialValue="medium">
          <Select options={priorities} />
        </Form.Item>
        <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入问题标题' }]}>
          <Input placeholder="简要描述问题，如：厨房水龙头漏水" maxLength={50} />
        </Form.Item>
        <Form.Item label="详细描述" name="description" rules={[{ required: true, message: '请详细描述问题' }]}>
          <TextArea rows={4} placeholder="请详细描述问题情况，方便维修人员提前准备" />
        </Form.Item>
        <Form.Item label="现场照片">
          <Upload
            listType="picture-card"
            fileList={fileList}
            beforeUpload={() => false}
            onChange={({ fileList }) => setFileList(fileList)}
            multiple
            accept="image/*"
          >
            {fileList.length >= 9 ? null : <div><PlusOutlined /><div style={{ marginTop: 8 }}>上传</div></div>}
          </Upload>
        </Form.Item>
        <Form.Item label="位置信息">
          <Space>
            <Button icon={<EnvironmentOutlined />} onClick={getLocation}>获取当前位置</Button>
            {location && <span style={{ color: '#52c41a' }}>已获取位置</span>}
          </Space>
          <Form.Item name={['location', 'address']} style={{ marginTop: 8, marginBottom: 0 }}>
            <Input placeholder="或手动输入地址" />
          </Form.Item>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            提交报修
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
