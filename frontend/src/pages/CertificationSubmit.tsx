import React, { useEffect, useState } from 'react';
import { Card, Form, Select, Input, Upload, Button, Spin, message, Row, Col } from 'antd';
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Trade } from '../types';
import type { UploadProps } from 'antd';

const { Option } = Select;
const { TextArea } = Input;

const CertificationSubmit: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [imageUrl, setImageUrl] = useState<string>('');

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const res = await api.trades.getAll();
      setTrades(res.data || []);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取工种列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const uploadProps: UploadProps = {
    name: 'certificate',
    accept: 'image/*',
    action: '',
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        const res = await api.certifications.uploadImage(file as File);
        setImageUrl(res.data.url);
        form.setFieldsValue({ certificateImage: res.data.url });
        message.success('证书上传成功');
        onSuccess?.(res.data);
      } catch (error: any) {
        message.error(error.response?.data?.error || '证书上传失败');
        onError?.(error);
      }
    }
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      await api.certifications.submit({
        tradeId: values.tradeId,
        certificateNumber: values.certificateNumber,
        certificateType: values.certificateType,
        certificateImage: imageUrl
      });
      message.success('认证提交成功，请等待审核');
      navigate('/certifications');
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交认证失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/certifications')}
        style={{ marginBottom: '16px' }}
      >
        返回认证列表
      </Button>

      <Card title="提交工种认证">
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ certificateType: '职业资格证书' }}
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="tradeId"
                  label="工种"
                  rules={[{ required: true, message: '请选择工种' }]}
                >
                  <Select placeholder="请选择工种">
                    {trades.map((trade) => (
                      <Option key={trade.id} value={trade.id}>
                        {trade.gbName} - {trade.category}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="certificateType"
                  label="证书类型"
                  rules={[{ required: true, message: '请选择证书类型' }]}
                >
                  <Select placeholder="请选择证书类型">
                    <Option value="职业资格证书">职业资格证书</Option>
                    <Option value="技能等级证书">技能等级证书</Option>
                    <Option value="特种作业操作证">特种作业操作证</Option>
                    <Option value="上岗证">上岗证</Option>
                    <Option value="其他">其他</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="certificateNumber"
                  label="证书编号"
                  rules={[{ required: true, message: '请输入证书编号' }]}
                >
                  <Input placeholder="请输入证书编号" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="certificateImage"
              label="证书照片"
              rules={[{ required: true, message: '请上传证书照片' }]}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />}>选择证书照片</Button>
                </Upload>
                {imageUrl && (
                  <span style={{ color: '#52c41a' }}>✓ 已上传证书照片</span>
                )}
              </div>
              <p style={{ color: '#8c8c8c', fontSize: '12px', marginTop: '8px' }}>
                支持 JPG、PNG 格式，文件大小不超过 5MB
              </p>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting}>
                提交认证
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default CertificationSubmit;
