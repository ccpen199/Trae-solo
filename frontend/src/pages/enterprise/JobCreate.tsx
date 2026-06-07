import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, message, Select, Switch, InputNumber, Row, Col, Typography, Space, Alert } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { Trade, ConstructionProject } from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface JobCreateForm {
  tradeId: number;
  projectId?: number;
  title: string;
  description?: string;
  salaryType: 'daily' | 'piece' | 'monthly';
  salaryMin: number;
  salaryMax?: number;
  salaryDetails?: string;
  includesBoard: boolean;
  includesLodging: boolean;
  safetyTrainingRequired: boolean;
  workLocation: string;
  requirementDescription?: string;
  peopleNeeded: number;
}

const JobCreate: React.FC = () => {
  const [form] = Form.useForm<JobCreateForm>();
  const [loading, setLoading] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tradesRes, projectsRes] = await Promise.all([
          api.trades.getAll(),
          api.projects.getMy()
        ]);
        setTrades(tradesRes.data || []);
        setProjects(projectsRes.data || []);
      } catch (error: any) {
        message.error(error.response?.data?.error || '获取数据失败');
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (values: JobCreateForm) => {
    setLoading(true);
    try {
      const submitData = {
        ...values,
        includesBoard: values.includesBoard ? 1 : 0,
        includesLodging: values.includesLodging ? 1 : 0,
        safetyTrainingRequired: values.safetyTrainingRequired ? 'yes' : 'no',
        salaryDetails: values.salaryDetails ? JSON.parse(values.salaryDetails) : undefined
      };
      await api.jobs.create(submitData);
      message.success('岗位发布成功');
      navigate('/enterprise/jobs');
    } catch (error: any) {
      message.error(error.response?.data?.error || '岗位发布失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/enterprise/jobs');
  };

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
          <Title level={4} style={{ margin: 0 }}>发布岗位</Title>
          <Text type="secondary">填写岗位信息，带*号为必填项</Text>
        </div>

        <Alert
          message="提示"
          description="请确保岗位信息真实有效，薪资待遇需符合当地用工标准。"
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Form
          form={form}
          name="jobCreate"
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
          initialValues={{
            includesBoard: false,
            includesLodging: false,
            safetyTrainingRequired: false,
            salaryType: 'daily',
            peopleNeeded: 1
          }}
        >
          <Title level={5} style={{ color: '#1890ff', marginTop: 0 }}>基本信息</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tradeId"
                label="工种"
                rules={[{ required: true, message: '请选择工种' }]}
              >
                <Select placeholder="请选择工种" showSearch optionFilterProp="children">
                  {trades.map((trade) => (
                    <Option key={trade.id} value={trade.id}>
                      [{trade.gbCode}] {trade.gbName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="projectId"
                label="所属项目"
              >
                <Select placeholder="请选择项目（可选）" allowClear>
                  {projects.map((project) => (
                    <Option key={project.id} value={project.id}>
                      {project.projectName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="title"
            label="岗位名称"
            rules={[
              { required: true, message: '请输入岗位名称' },
              { min: 2, max: 50, message: '岗位名称长度为2-50个字符' }
            ]}
          >
            <Input placeholder="例如：建筑木工、钢筋工等" />
          </Form.Item>

          <Form.Item
            name="description"
            label="岗位描述"
          >
            <TextArea rows={4} placeholder="请详细描述岗位职责、工作内容等" maxLength={1000} showCount />
          </Form.Item>

          <Title level={5} style={{ color: '#1890ff', marginTop: '16px' }}>薪资待遇</Title>
          <Row gutter={16}>
            <Col span={8}>
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
            <Col span={8}>
              <Form.Item
                name="salaryMin"
                label="最低薪资（元）"
                rules={[
                  { required: true, message: '请输入最低薪资' },
                  { type: 'number', min: 0, message: '薪资不能为负数' }
                ]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请输入最低薪资" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="salaryMax"
                label="最高薪资（元）"
                rules={[
                  { type: 'number', min: 0, message: '薪资不能为负数' }
                ]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请输入最高薪资（可选）" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="salaryDetails"
            label="薪资明细（JSON格式）"
            help='例如：{"base": 200, "overtime": 50, "bonus": 30}'
          >
            <TextArea rows={3} placeholder='{"base": 200, "overtime": 50, "bonus": 30}' />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="includesBoard"
                label="包吃"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="includesLodging"
                label="包住"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="safetyTrainingRequired"
                label="需安全培训"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5} style={{ color: '#1890ff', marginTop: '16px' }}>其他信息</Title>
          <Form.Item
            name="workLocation"
            label="工作地点"
            rules={[
              { required: true, message: '请输入工作地点' },
              { min: 2, max: 200, message: '工作地点长度为2-200个字符' }
            ]}
          >
            <Input placeholder="请输入详细工作地址" />
          </Form.Item>

          <Form.Item
            name="requirementDescription"
            label="任职要求"
          >
            <TextArea rows={3} placeholder="请描述岗位要求，如经验、技能、证书等" maxLength={500} showCount />
          </Form.Item>

          <Form.Item
            name="peopleNeeded"
            label="招聘人数"
            rules={[
              { required: true, message: '请输入招聘人数' },
              { type: 'number', min: 1, max: 1000, message: '招聘人数范围为1-1000' }
            ]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="请输入招聘人数" min={1} max={1000} />
          </Form.Item>

          <Form.Item style={{ marginTop: '32px' }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} size="large">
                发布岗位
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

export default JobCreate;
