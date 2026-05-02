import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Form, 
  Input, 
  InputNumber, 
  Button, 
  Card, 
  Typography, 
  DatePicker, 
  message,
  Space,
  Row,
  Col,
  Select
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { projectApi } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const ProjectCreate = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const payload = {
        ...values,
        announcementDate: values.announcementDate?.format('YYYY-MM-DD'),
        registrationStartDate: values.registrationPeriod?.[0]?.format('YYYY-MM-DD'),
        registrationEndDate: values.registrationPeriod?.[1]?.format('YYYY-MM-DD'),
        biddingStartDate: values.biddingPeriod?.[0]?.format('YYYY-MM-DD'),
        biddingEndDate: values.biddingPeriod?.[1]?.format('YYYY-MM-DD')
      };
      
      delete payload.registrationPeriod;
      delete payload.biddingPeriod;

      const response = await projectApi.createProject(payload);
      if (response.data.success) {
        message.success('项目创建成功！项目编号: ' + response.data.data.projectNumber);
        navigate('/projects');
      } else {
        message.error(response.data.message || '创建失败');
      }
    } catch (error) {
      message.error('创建失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card 
        title={
          <Title level={4} style={{ margin: 0 }}>
            <Space>
              <Button 
                type="link" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/projects')}
              >
                返回
              </Button>
              新建招标项目
            </Space>
          </Title>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            budget: 100000,
            deposit: 5000,
            announcementDate: dayjs(),
            category: '货物类',
            location: '北京市'
          }}
        >
          <Row gutter={[24, 0]}>
            <Col xs={24} lg={12}>
              <Form.Item
                name="name"
                label="项目名称"
                rules={[{ required: true, message: '请输入项目名称' }]}
              >
                <Input placeholder="请输入项目名称，如：XX单位办公设备采购项目" />
              </Form.Item>
            </Col>

            <Col xs={24} lg={12}>
              <Form.Item
                name="category"
                label="项目类别"
                rules={[{ required: true, message: '请选择项目类别' }]}
              >
                <Select placeholder="请选择项目类别">
                  <Select.Option value="货物类">货物类</Select.Option>
                  <Select.Option value="工程类">工程类</Select.Option>
                  <Select.Option value="服务类">服务类</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 0]}>
            <Col xs={24} lg={8}>
              <Form.Item
                name="budget"
                label="预算金额 (元)"
                rules={[{ required: true, message: '请输入预算金额' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={1000}
                  precision={2}
                  placeholder="请输入预算金额"
                />
              </Form.Item>
            </Col>

            <Col xs={24} lg={8}>
              <Form.Item
                name="deposit"
                label="保证金金额 (元)"
                rules={[{ required: true, message: '请输入保证金金额' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={0}
                  precision={2}
                  placeholder="请输入保证金金额"
                />
              </Form.Item>
            </Col>

            <Col xs={24} lg={8}>
              <Form.Item
                name="location"
                label="项目地点"
                rules={[{ required: true, message: '请输入项目地点' }]}
              >
                <Input placeholder="请输入项目地点" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 0]}>
            <Col xs={24} lg={8}>
              <Form.Item
                name="announcementDate"
                label="公告日期"
                rules={[{ required: true, message: '请选择公告日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} lg={8}>
              <Form.Item
                name="registrationPeriod"
                label="报名时间范围"
                rules={[{ required: true, message: '请选择报名时间范围' }]}
              >
                <RangePicker 
                  showTime
                  style={{ width: '100%' }}
                  placeholder={['开始时间', '结束时间']}
                />
              </Form.Item>
            </Col>

            <Col xs={24} lg={8}>
              <Form.Item
                name="biddingPeriod"
                label="竞价时间范围"
                rules={[{ required: true, message: '请选择竞价时间范围' }]}
              >
                <RangePicker 
                  showTime
                  style={{ width: '100%' }}
                  placeholder={['开始时间', '结束时间']}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="项目描述"
          >
            <TextArea 
              rows={4} 
              placeholder="请输入项目详细描述，包括采购需求、技术要求等"
            />
          </Form.Item>

          <Form.Item
            name="requirements"
            label="供应商资质要求"
          >
            <TextArea 
              rows={3} 
              placeholder="请输入参与竞价的供应商资质要求"
            />
          </Form.Item>

          <Form.Item
            name="contactName"
            label="联系人"
            rules={[{ required: true, message: '请输入联系人' }]}
          >
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>

          <Form.Item
            name="contactPhone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <Card type="inner" title="注意事项" style={{ marginBottom: 24, background: '#fafafa' }}>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#666' }}>
              <li>创建项目后状态为"草稿"，可编辑修改</li>
              <li>点击"发布"后状态变为"公告中"，同步至各级分中心</li>
              <li>保证金金额为0时表示无需缴纳保证金</li>
              <li>所有操作将被记录审计日志，具备防篡改签名</li>
            </ul>
          </Card>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SaveOutlined />}
                size="large"
              >
                保存项目
              </Button>
              <Button 
                size="large"
                onClick={() => navigate('/projects')}
              >
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
