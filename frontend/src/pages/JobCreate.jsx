import { useState } from 'react';
import { Form, Input, Select, InputNumber, DatePicker, Button, Card, Switch, message, Space, Upload, Divider, Alert, Row, Col, Tag } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UploadOutlined, SafetyOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { jobsAPI } from '../utils/api';

const { Option } = Select;
const { TextArea } = Input;

const SKILLS = [
  '旋挖钻机手', '木工', '电工', '架子工', '钢筋工', '混凝土工', '砌筑工', '抹灰工',
  '防水工', '油漆工', '水暖工', '焊工', '起重工', '信号工', '测量工', '试验工',
  '挖掘机司机', '装载机司机', '塔吊司机', '施工升降机司机', '叉车司机'
];

const JOB_TYPES = ['全职', '临时', '包工', '点工'];

function JobCreate() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const data = {
        ...values,
        start_date: values.date_range[0].format('YYYY-MM-DD'),
        end_date: values.date_range[1].format('YYYY-MM-DD'),
      };
      delete data.date_range;

      await jobsAPI.createJob(data);
      message.success('招工发布成功');
      navigate('/my-jobs');
    } catch (error) {
      message.error(error.response?.data?.error || '发布失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/my-jobs')}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      <Card title="发布招工信息">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            workers_needed: 1,
            job_type: '临时',
            safety_training_required: false,
          }}
        >
          <Form.Item
            name="title"
            label="招工标题"
            rules={[{ required: true, message: '请输入招工标题' }]}
          >
            <Input placeholder="例如：急招木工师傅10名" size="large" />
          </Form.Item>

          <Form.Item
            name="job_type"
            label="用工类型"
            rules={[{ required: true, message: '请选择用工类型' }]}
          >
            <Select size="large">
              {JOB_TYPES.map(t => <Option key={t} value={t}>{t}</Option>)}
            </Select>
          </Form.Item>

          <Form.Item
            name="skill_required"
            label="所需工种"
            rules={[{ required: true, message: '请选择工种' }]}
          >
            <Select size="large" showSearch placeholder="搜索或选择工种">
              {SKILLS.map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Form.Item>

          <Form.Item
            name="workers_needed"
            label="招聘人数"
            rules={[{ required: true, message: '请输入招聘人数' }]}
          >
            <InputNumber min={1} max={500} size="large" />
          </Form.Item>

          <Form.Item
            name="location"
            label="工作地点"
            rules={[{ required: true, message: '请输入工作地点' }]}
          >
            <Input placeholder="例如：北京市朝阳区XX工地" size="large" />
          </Form.Item>

          <Form.Item
            name="daily_salary"
            label="日薪（元）"
            rules={[{ required: true, message: '请输入日薪' }]}
          >
            <InputNumber min={100} max={2000} size="large" />
          </Form.Item>

          <Form.Item
            name="date_range"
            label="工期"
            rules={[{ required: true, message: '请选择工期' }]}
          >
            <DatePicker.RangePicker 
              size="large" 
              style={{ width: '100%' }}
              minDate={dayjs()}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="工作描述"
          >
            <TextArea rows={4} placeholder="请详细描述工作内容、要求等信息" />
          </Form.Item>

          <Form.Item
            name="safety_training_required"
            label="需要安全培训证明"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="special_cert_required"
            label="需要特种作业证"
          >
            <Input placeholder="例如：电工证、焊工证，无需则留空" />
          </Form.Item>

          <Form.Item
            name="deposit_amount"
            label="保证金金额（元）"
          >
            <InputNumber min={0} placeholder="0表示无需保证金" />
          </Form.Item>

          <Divider orientation="left">
            <SafetyOutlined style={{ color: '#faad14' }} /> 安全合规材料
          </Divider>

          <Alert
            message="施工安全规范要求"
            description="为保障施工安全，请上传该项目的安全规范文档。平台将进行合规性审核，审核通过后方可正式发布招工。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card size="small" title="施工安全规范文档">
                <Upload
                  action="#"
                  listType="picture"
                  beforeUpload={() => false}
                  defaultFileList={[
                    { uid: '1', name: '施工现场安全规范.pdf', status: 'done', url: '#' }
                  ]}
                >
                  <Button icon={<UploadOutlined />}>上传</Button>
                </Upload>
                <Tag color="green" style={{ marginTop: 8 }}>已上传</Tag>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small" title="应急救援预案">
                <Upload
                  action="#"
                  listType="picture"
                  beforeUpload={() => false}
                >
                  <Button icon={<UploadOutlined />}>上传</Button>
                </Upload>
                <Tag color="orange" style={{ marginTop: 8 }}>待上传</Tag>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small" title="安全技术交底记录">
                <Upload
                  action="#"
                  listType="picture"
                  beforeUpload={() => false}
                  defaultFileList={[
                    { uid: '2', name: '安全技术交底记录表.pdf', status: 'done', url: '#' }
                  ]}
                >
                  <Button icon={<UploadOutlined />}>上传</Button>
                </Upload>
                <Tag color="green" style={{ marginTop: 8 }}>已上传</Tag>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small" title="特种作业人员名单">
                <Upload
                  action="#"
                  listType="picture"
                  beforeUpload={() => false}
                >
                  <Button icon={<UploadOutlined />}>上传</Button>
                </Upload>
                <Tag color="orange" style={{ marginTop: 8 }}>待上传</Tag>
              </Card>
            </Col>
          </Row>

          <Divider />

          <Form.Item style={{ marginTop: 16 }}>
            <Space>
              <Button 
                type="primary" 
                size="large" 
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
              >
                发布招工
              </Button>
              <Button size="large" onClick={() => navigate('/my-jobs')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default JobCreate;
