import React, { useState } from 'react';
import { Form, Input, Button, Card, message, InputNumber, Row, Col, Typography, Space, Alert, DatePicker, Select } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface ProjectCreateForm {
  projectName: string;
  projectCode: string;
  projectType: string;
  projectAddress: string;
  geofenceLat: number;
  geofenceLng: number;
  geofenceRadius: number;
  budget: number;
  startDate: string;
  endDate: string;
}

const ProjectCreate: React.FC = () => {
  const [form] = Form.useForm<ProjectCreateForm>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const submitData = {
        ...values,
        startDate: values.dateRange ? values.dateRange[0].format('YYYY-MM-DD') : undefined,
        endDate: values.dateRange ? values.dateRange[1].format('YYYY-MM-DD') : undefined
      };
      delete submitData.dateRange;
      await api.projects.create(submitData);
      message.success('项目创建成功');
      navigate('/enterprise/projects');
    } catch (error: any) {
      message.error(error.response?.data?.error || '项目创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/enterprise/projects');
  };

  const projectTypes = [
    '住宅建筑',
    '商业建筑',
    '工业建筑',
    '市政工程',
    '道路桥梁',
    '水利工程',
    '电力工程',
    '装修装饰',
    '钢结构',
    '其他'
  ];

  return (
    <div>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={handleBack}
        style={{ marginBottom: '16px' }}
      >
        返回列表
      </Button>

      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={4} style={{ margin: 0 }}>新建项目</Title>
          <Text type="secondary">填写项目基本信息，带*号为必填项</Text>
        </div>

        <Alert
          message="提示"
          description="项目信息将用于考勤地理围栏验证，请确保经纬度坐标准确。"
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Form
          form={form}
          name="projectCreate"
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Title level={5} style={{ color: '#1890ff', marginTop: 0 }}>基本信息</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="projectName"
                label="项目名称"
                rules={[
                  { required: true, message: '请输入项目名称' },
                  { min: 2, max: 100, message: '项目名称长度为2-100个字符' }
                ]}
              >
                <Input placeholder="请输入项目名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="projectCode"
                label="项目编号"
                rules={[
                  { required: true, message: '请输入项目编号' },
                  { min: 2, max: 50, message: '项目编号长度为2-50个字符' }
                ]}
              >
                <Input placeholder="例如：XM2024001" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="projectType"
                label="项目类型"
                rules={[{ required: true, message: '请选择项目类型' }]}
              >
                <Select placeholder="请选择项目类型">
                  {projectTypes.map((type) => (
                    <Option key={type} value={type}>
                      {type}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="budget"
                label="项目预算（元）"
                rules={[
                  { required: true, message: '请输入项目预算' },
                  { type: 'number', min: 0, message: '预算不能为负数' }
                ]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请输入项目预算" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="projectAddress"
            label="项目地址"
            rules={[
              { required: true, message: '请输入项目地址' },
              { min: 5, max: 200, message: '项目地址长度为5-200个字符' }
            ]}
          >
            <Input placeholder="请输入详细项目地址" />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="计划工期"
            rules={[{ required: true, message: '请选择计划工期' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              minDate={dayjs()}
            />
          </Form.Item>

          <Title level={5} style={{ color: '#1890ff', marginTop: '16px' }}>地理围栏设置</Title>
          <Alert
            message="地理围栏说明"
            description="设置项目的经纬度坐标和围栏半径，用于工人考勤打卡时的位置验证。"
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="geofenceLat"
                label="纬度（Lat）"
                rules={[
                  { required: true, message: '请输入纬度' },
                  { type: 'number', min: -90, max: 90, message: '纬度范围为-90到90' }
                ]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="例如：39.9042" min={-90} max={90} step={0.000001} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="geofenceLng"
                label="经度（Lng）"
                rules={[
                  { required: true, message: '请输入经度' },
                  { type: 'number', min: -180, max: 180, message: '经度范围为-180到180' }
                ]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="例如：116.4074" min={-180} max={180} step={0.000001} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="geofenceRadius"
                label="围栏半径（米）"
                rules={[
                  { required: true, message: '请输入围栏半径' },
                  { type: 'number', min: 10, max: 5000, message: '半径范围为10-5000米' }
                ]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="例如：200" min={10} max={5000} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: '32px' }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} size="large">
                创建项目
              </Button>
              <Button size="large" onClick={handleBack}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProjectCreate;
