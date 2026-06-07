import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';

const { Option } = Select;

const certTypes = [
  { type: '身份证', name: '居民身份证', issuer: '公安局' },
  { type: '社保卡', name: '社会保障卡', issuer: '人力资源和社会保障局' },
  { type: '医保卡', name: '医疗保险卡', issuer: '医疗保障局' },
  { type: '驾驶证', name: '机动车驾驶证', issuer: '公安局交通管理局' },
  { type: '营业执照', name: '营业执照', issuer: '市场监督管理局' },
  { type: '不动产权证', name: '不动产权证书', issuer: '自然资源局' }
];

function ApplyCertModal({ visible, onCancel, onSubmit }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleTypeChange = (value) => {
    const cert = certTypes.find(c => c.type === value);
    if (cert) {
      form.setFieldsValue({
        certName: cert.name,
        issuer: cert.issuer
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onSubmit(values);
      form.resetFields();
    } catch (err) {
      if (err.errorFields) {
        // 表单验证失败
      } else {
        message.error('请填写完整信息');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="申领电子证照"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={500}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="certType"
          label="证照类型"
          rules={[{ required: true, message: '请选择证照类型' }]}
        >
          <Select placeholder="请选择" onChange={handleTypeChange}>
            {certTypes.map(cert => (
              <Option key={cert.type} value={cert.type}>{cert.name}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="certName"
          label="证照名称"
          rules={[{ required: true, message: '请输入证照名称' }]}
        >
          <Input placeholder="请输入证照名称" />
        </Form.Item>
        <Form.Item
          name="issuer"
          label="签发机关"
          rules={[{ required: true, message: '请输入签发机关' }]}
        >
          <Input placeholder="请输入签发机关" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default ApplyCertModal;
