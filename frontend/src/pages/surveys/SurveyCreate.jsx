import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Input, Select, DatePicker, InputNumber, Button, Space, Upload, message, Divider } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { createSurvey, getReports } from '../../utils/api.js';

const statusColors = {
  pending: 'orange',
  surveying: 'blue',
  surveyed: 'cyan',
  approved: 'green',
  rejected: 'red',
  paid: 'purple',
  reviewing: 'orange'
};

const statusLabels = {
  pending: '待查勘',
  surveying: '查勘中',
  surveyed: '已查勘',
  approved: '已通过',
  rejected: '已拒赔',
  paid: '已赔付',
  reviewing: '审核中'
};

const roleLabels = {
  insurer: '保险公司',
  township: '乡镇',
  regulator: '监管方'
};

const samplingMethods = [
  { value: 'random', label: '随机抽样' },
  { value: 'systematic', label: '系统抽样' },
  { value: 'stratified', label: '分层抽样' },
  { value: 'cluster', label: '整群抽样' }
];

function SurveyCreate({ currentUser }) {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    loadPendingReports();
  }, []);

  const loadPendingReports = async () => {
    try {
      const res = await getReports({ status: 'pending' });
      setReports(res.data.data || []);
    } catch (e) {
      console.error('Load pending reports failed:', e);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const data = {
        ...values,
        survey_time: values.survey_time ? values.survey_time.format('YYYY-MM-DD HH:mm:ss') : undefined,
        sample_loss_ratio: values.sample_loss_ratio ? values.sample_loss_ratio / 100 : undefined,
        loss_ratio: values.loss_ratio ? values.loss_ratio / 100 : undefined,
        photos: fileList.map(f => f.url || f.response?.url)
      };
      await createSurvey(data);
      message.success('查勘创建成功');
      navigate('/surveys');
    } catch (e) {
      console.error('Create survey failed:', e);
      message.error('创建查勘失败');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    fileList,
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    beforeUpload: () => false
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/surveys')}>
          返回列表
        </Button>
      </Space>

      <div className="page-title">新增查勘</div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            survey_time: dayjs()
          }}
        >
          <Form.Item
            name="report_id"
            label="选择报案"
            rules={[{ required: true, message: '请选择报案' }]}
          >
            <Select
              placeholder="请选择待查勘的报案"
              showSearch
              optionFilterProp="children"
              options={reports.map(r => ({
                value: r.id,
                label: `${r.report_no} - ${r.farmer_name} - ${r.disaster_type} - ${r.damaged_area}亩`
              }))}
            />
          </Form.Item>

          <Form.Item
            name="survey_time"
            label="查勘时间"
            rules={[{ required: true, message: '请选择查勘时间' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Divider />

          <Form.Item
            name="field_records"
            label="现场记录"
            rules={[{ required: true, message: '请输入现场记录' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入现场情况描述" />
          </Form.Item>

          <Divider />

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                name="sampling_method"
                label="抽样方法"
                rules={[{ required: true, message: '请选择抽样方法' }]}
              >
                <Select
                  placeholder="请选择抽样方法"
                  options={samplingMethods}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="sampling_count"
                label="抽样数量"
                rules={[{ required: true, message: '请输入抽样数量' }]}
              >
                <InputNumber
                  min={1}
                  placeholder="个"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="sample_loss_ratio"
                label="样本损失率"
                rules={[{ required: true, message: '请输入样本损失率' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  placeholder="%"
                  suffix="%"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="satellite_reference"
                label="卫星参考"
              >
                <Input.TextArea rows={3} placeholder="请输入卫星参考信息" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="weather_reference"
                label="气象参考"
              >
                <Input.TextArea rows={3} placeholder="请输入气象参考信息" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="loss_ratio"
                label="损失比例"
                rules={[{ required: true, message: '请输入损失比例' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  placeholder="%"
                  suffix="%"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="estimated_loss"
                label="预估损失"
                rules={[{ required: true, message: '请输入预估损失' }]}
              >
                <InputNumber
                  min={0}
                  placeholder="元"
                  prefix="¥"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item
            name="survey_opinion"
            label="查勘意见"
            rules={[{ required: true, message: '请输入查勘意见' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入查勘意见" />
          </Form.Item>

          <Divider />

          <Form.Item label="查勘照片">
            <Upload {...uploadProps} multiple listType="picture-card">
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
              >
                保存
              </Button>
              <Button onClick={() => navigate('/surveys')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default SurveyCreate;
