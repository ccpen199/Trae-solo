import React, { useState, useEffect } from 'react';
import {
  Form, Input, Select, DatePicker, Upload, Button, Card, message, Space, Alert, Modal
} from 'antd';
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { clueApi } from '../api';
import { SOURCE_CHANNELS, CATEGORIES, SECURITY_LEVELS } from '../utils/constants';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const ClueCreate: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const values = form.getFieldsValue();
      if (values.title || values.involved_persons || values.location) {
        checkDuplicate();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [form.getFieldsValue()]);

  const checkDuplicate = async () => {
    const values = form.getFieldsValue();
    if (!values.title && !values.involved_persons && !values.location) return;
    
    setChecking(true);
    try {
      const response = await clueApi.checkDuplicate({
        title: values.title,
        involved_persons: values.involved_persons,
        location: values.location
      });
      if (response.data.count > 0) {
        setDuplicates(response.data.duplicates);
        setShowDuplicateModal(true);
      }
    } catch (error) {
      console.error('检查重复失败');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const data = {
        ...values,
        occur_time: values.occur_time ? values.occur_time.format('YYYY-MM-DD HH:mm:ss') : null
      };
      const response = await clueApi.create(data);
      message.success(`线索创建成功，编号：${response.data.clue_no}`);
      navigate(`/clues/${response.data.id}`);
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/clues')}>
            返回列表
          </Button>
          <h2>线索登记</h2>
        </Space>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ security_level: 1 }}
        >
          <Alert
            message="提示：系统会自动检查重复线索，敏感信息请根据保密等级正确设置"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Form.Item
            name="source_channel"
            label="来源渠道"
            rules={[{ required: true, message: '请选择来源渠道' }]}
          >
            <Select placeholder="请选择来源渠道">
              {SOURCE_CHANNELS.map(ch => (
                <Option key={ch} value={ch}>{ch}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="线索标题"
            rules={[{ required: true, message: '请输入线索标题' }]}
          >
            <Input placeholder="简要描述线索内容" onChange={checkDuplicate} />
          </Form.Item>

          <Form.Item name="description" label="详细描述">
            <TextArea rows={4} placeholder="详细描述线索情况" />
          </Form.Item>

          <Form.Item name="involved_persons" label="涉及人员">
            <Input placeholder="涉及人员信息" onChange={checkDuplicate} />
          </Form.Item>

          <Form.Item name="location" label="发生地点">
            <Input placeholder="线索发生地点" onChange={checkDuplicate} />
          </Form.Item>

          <Form.Item name="occur_time" label="发生时间">
            <DatePicker
              showTime
              style={{ width: '100%' }}
              disabledDate={(current) => current && current > dayjs().endOf('day')}
            />
          </Form.Item>

          <Form.Item name="category" label="线索分类">
            <Select placeholder="请选择线索分类">
              {CATEGORIES.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="security_level"
            label="保密等级"
            rules={[{ required: true, message: '请选择保密等级' }]}
          >
            <Select>
              {SECURITY_LEVELS.map(level => (
                <Option key={level.value} value={level.value}>{level.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="attachments" label="附件上传">
            <Upload
              multiple
              beforeUpload={() => false}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>

          <div className="form-actions">
            <Space>
              <Button onClick={() => navigate('/clues')}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                提交登记
              </Button>
            </Space>
          </div>
        </Form>
      </Card>

      <Modal
        title="发现疑似重复线索"
        open={showDuplicateModal}
        onOk={() => setShowDuplicateModal(false)}
        onCancel={() => setShowDuplicateModal(false)}
        width={600}
      >
        <p>系统检测到以下相似线索，请确认是否为重复线索：</p>
        <ul>
          {duplicates.map((item: any) => (
            <li key={item.id} style={{ marginBottom: 8 }}>
              <a onClick={() => {
                setShowDuplicateModal(false);
                navigate(`/clues/${item.id}`);
              }}>
                [{item.clue_no}] {item.title}
              </a>
              <span style={{ color: '#999', marginLeft: 8 }}>
                ({dayjs(item.created_at).format('YYYY-MM-DD')})
              </span>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
};

export default ClueCreate;
