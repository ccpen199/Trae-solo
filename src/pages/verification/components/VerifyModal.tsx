import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, Result, Descriptions, Progress, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { UploadPro, StatusTag } from '@/components/common';
import { realNameVerify } from '@/services/api/verification';
import type { RealNameVerifyResult } from '@/services/api/verification';
import { getPlaceList } from '@/services/api/place';

interface VerifyModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}

const VerifyModal: React.FC<VerifyModalProps> = ({ open, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RealNameVerifyResult | null>(null);
  const [placeOptions, setPlaceOptions] = useState<{ label: string; value: string }[]>([]);

  const fetchPlaces = async () => {
    try {
      const res = await getPlaceList({ page: 1, pageSize: 100, status: 'approved' });
      if (res.data?.list) {
        setPlaceOptions(res.data.list.map(p => ({ label: p.name, value: p.id })));
      }
    } catch {}
  };

  React.useEffect(() => {
    if (open) {
      fetchPlaces();
      setResult(null);
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const faceImage = values.faceImages?.[0]?.url || values.faceImages?.[0]?.response?.data?.url;
      const res = await realNameVerify({
        placeId: values.placeId,
        type: values.type || 'id_card',
        name: values.name,
        idCard: values.idCard,
        phone: values.phone,
        faceImage,
      });
      if (res.data) {
        setResult(res.data);
        if (res.data.success) {
          onSuccess?.();
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setResult(null);
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="实名核验"
      open={open}
      onCancel={handleCancel}
      width={560}
      footer={
        result ? (
          <Button type="primary" onClick={handleCancel}>关闭</Button>
        ) : (
          <Space>
            <Button onClick={handleCancel}>取消</Button>
            <Button type="primary" loading={loading} onClick={handleSubmit}>
              开始核验
            </Button>
          </Space>
        )
      }
      destroyOnClose
    >
      {result ? (
        <div className="py-4">
          <Result
            icon={result.success ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            title={result.success ? '核验通过' : '核验失败'}
            subTitle={result.message}
          />
          <Descriptions column={1} bordered size="small" className="mt-4">
            <Descriptions.Item label="核验记录ID">{result.recordId}</Descriptions.Item>
            <Descriptions.Item label="核验时间">{result.verifyTime}</Descriptions.Item>
            <Descriptions.Item label="核验结果">
              <StatusTag status={result.success ? 'success' : 'danger'} text={result.success ? '通过' : '失败'} />
            </Descriptions.Item>
          </Descriptions>
          {result.success && (
            <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <div className="text-sm font-medium mb-2">匹配置信度</div>
              <Progress percent={92} strokeColor="#52c41a" />
            </div>
          )}
        </div>
      ) : (
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="placeId" label="核验场所" rules={[{ required: true, message: '请选择场所' }]}>
            <Select
              placeholder="请选择场所"
              options={placeOptions}
              showSearch
              filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
          <Form.Item name="type" label="核验方式" initialValue="id_card">
            <Select
              options={[
                { label: '身份证核验', value: 'id_card' },
                { label: '人脸核验', value: 'face' },
                { label: '票务核验', value: 'ticket' },
              ]}
            />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" maxLength={20} />
          </Form.Item>
          <Form.Item name="idCard" label="身份证号" rules={[
            { required: true, message: '请输入身份证号' },
            { pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/, message: '请输入正确的18位身份证号' },
          ]}>
            <Input placeholder="请输入18位身份证号" maxLength={18} />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="请输入手机号（选填）" maxLength={11} />
          </Form.Item>
          <Form.Item name="faceImages" label="人脸照片" valuePropName="value">
            <UploadPro uploadType="idCard" maxCount={1} listType="picture-card" buttonText="上传人脸照片" />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default VerifyModal;
