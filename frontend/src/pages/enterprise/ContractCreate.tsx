import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, message, Select, InputNumber, Row, Col, Typography, Space, Alert, DatePicker } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { JobPosting } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ContractCreateForm {
  workerId: number;
  jobPostingId: number;
  startDate: string;
  endDate: string;
  salaryAmount: number;
  salaryType: 'daily' | 'piece' | 'monthly';
  contractContent: string;
  contractType: string;
}

const ContractCreate: React.FC = () => {
  const [form] = Form.useForm<ContractCreateForm>();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.jobs.getMy();
        setJobs(res.data || []);
      } catch (error: any) {
        message.error(error.response?.data?.error || '获取岗位列表失败');
      }
    };
    fetchJobs();
  }, []);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const submitData = {
        ...values,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : undefined,
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined
      };
      await api.contracts.create(submitData);
      message.success('合同创建成功');
      navigate('/enterprise/contracts');
    } catch (error: any) {
      message.error(error.response?.data?.error || '合同创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/enterprise/contracts');
  };

  const contractTypes = [
    '固定期限劳动合同',
    '无固定期限劳动合同',
    '以完成一定工作任务为期限劳动合同',
    '劳务派遣合同',
    '非全日制劳动合同',
    '实习协议',
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
          <Title level={4} style={{ margin: 0 }}>创建合同</Title>
          <Text type="secondary">填写合同信息，带*号为必填项</Text>
        </div>

        <Alert
          message="法律提示"
          description="请确保合同内容符合《中华人民共和国劳动合同法》及相关法律法规，明确双方权利义务。"
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Form
          form={form}
          name="contractCreate"
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
          initialValues={{
            salaryType: 'monthly',
            contractType: '固定期限劳动合同'
          }}
        >
          <Title level={5} style={{ color: '#1890ff', marginTop: 0 }}>基本信息</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="workerId"
                label="工人ID"
                rules={[
                  { required: true, message: '请输入工人ID' },
                  { type: 'number', min: 1, message: '工人ID必须大于0' }
                ]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请输入工人用户ID" min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="jobPostingId"
                label="关联岗位"
                rules={[{ required: true, message: '请选择关联岗位' }]}
              >
                <Select placeholder="请选择关联的岗位" showSearch optionFilterProp="children">
                  {jobs.map((job) => (
                    <Option key={job.id} value={job.id}>
                      {job.title} - {job.gbName || ''}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="合同开始日期"
                rules={[{ required: true, message: '请选择合同开始日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                  minDate={dayjs()}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="合同结束日期"
                rules={[{ required: true, message: '请选择合同结束日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                  minDate={dayjs().add(1, 'day')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5} style={{ color: '#1890ff', marginTop: '16px' }}>薪资待遇</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="salaryType"
                label="薪资类型"
                rules={[{ required: true, message: '请选择薪资类型' }]}
              >
                <Select placeholder="请选择薪资类型">
                  <Option value="daily">日薪</Option>
                  <Option value="piece">计件</Option>
                  <Option value="monthly">月薪</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="salaryAmount"
                label="薪资金额（元）"
                rules={[
                  { required: true, message: '请输入薪资金额' },
                  { type: 'number', min: 0, message: '薪资金额不能为负数' }
                ]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请输入薪资金额" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5} style={{ color: '#1890ff', marginTop: '16px' }}>合同内容</Title>
          <Form.Item
            name="contractType"
            label="合同类型"
            rules={[{ required: true, message: '请选择合同类型' }]}
          >
            <Select placeholder="请选择合同类型">
              {contractTypes.map((type) => (
                <Option key={type} value={type}>
                  {type}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="contractContent"
            label="合同内容"
            rules={[
              { required: true, message: '请输入合同内容' },
              { min: 50, max: 10000, message: '合同内容长度为50-10000个字符' }
            ]}
          >
            <TextArea
              rows={12}
              placeholder="请详细填写合同内容，包括但不限于：工作内容、工作地点、工作时间、休息休假、劳动保护、社会保险、劳动纪律、合同终止条件等。"
              maxLength={10000}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginTop: '32px' }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} size="large">
                创建合同
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

export default ContractCreate;
