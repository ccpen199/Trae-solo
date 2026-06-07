import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Space, message, Spin, Empty, Modal,
  Form, Input, Select, Row, Col, DatePicker, Switch, Alert
} from 'antd';
import {
  PlusOutlined, EditOutlined, EyeOutlined,
  FileSearchOutlined, PlayCircleOutlined, PauseCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const EnterpriseJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingJob, setEditingJob] = useState(null);
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, catRes, tplRes] = await Promise.all([
        api.get('/enterprises/my-jobs'),
        api.get('/jobs/categories'),
        api.get('/jd-templates', { params: { is_builtin: 1 } }),
      ]);
      setJobs(jobsRes.data.jobs || []);
      setCategories(catRes.data.tree || []);
      setTemplates(tplRes.data.templates || []);
    } catch (e) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getSalaryText = (min, max) => {
    if (!min && !max) return '面议';
    return `${min / 1000}K-${max / 1000}K`;
  };

  const openModal = (job = null) => {
    setEditingJob(job);
    form.resetFields();
    if (job) {
      form.setFieldsValue({
        ...job,
        ability_model: job.ability_model || {},
      });
    }
    setModalVisible(true);
  };

  const applyTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      form.setFieldsValue({
        job_category_code: template.job_category_code,
        job_title: template.job_title,
        job_description: template.job_description,
        requirements: template.requirements,
        ability_model: template.ability_model,
        salary_min: template.salary_min,
        salary_max: template.salary_max,
      });
      message.success(`已应用模板：${template.template_name}`);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingJob) {
        await api.put(`/jobs/${editingJob.id}`, values);
        message.success('岗位更新成功');
      } else {
        const res = await api.post('/jobs', values);
        if (!res.data.salaryCompliance?.compliant) {
          message.warning(res.data.salaryCompliance?.remark || '薪酬区间需要注意');
        } else {
          message.success('岗位发布成功');
        }
      }
      
      setModalVisible(false);
      fetchData();
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.response?.data?.error || '保存失败');
    }
  };

  const toggleJobStatus = async (job) => {
    const newStatus = job.status === 'active' ? 'paused' : 'active';
    try {
      await api.put(`/jobs/${job.id}`, { status: newStatus });
      message.success(`岗位已${newStatus === 'active' ? '上架' : '下架'}`);
      fetchData();
    } catch (e) {
      message.error('操作失败');
    }
  };

  const renderCategoryOptions = (items, level = 0) => {
    return items.map(item => (
      <React.Fragment key={item.category_code}>
        <Option value={item.category_code} style={{ paddingLeft: level * 16 }}>
          {level > 0 ? '　' : ''}{item.category_name}
        </Option>
        {item.children?.length > 0 && renderCategoryOptions(item.children, level + 1)}
      </React.Fragment>
    ));
  };

  const columns = [
    {
      title: '岗位信息',
      dataIndex: 'job_title',
      key: 'job',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate(`/jobs/${record.id}`)}>
            {text}
          </div>
          <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
            {record.category_name}
          </div>
        </div>
      ),
    },
    {
      title: '薪资',
      dataIndex: 'salary_min',
      key: 'salary',
      render: (_, record) => (
        <div>
          <span className="salary-text" style={{ fontWeight: 600 }}>
            {getSalaryText(record.salary_min, record.salary_max)}
          </span>
          {!record.salary_compliance_checked && (
            <Tag color="orange" style={{ marginLeft: 8 }}>待合规检查</Tag>
          )}
        </div>
      ),
    },
    {
      title: '投递数',
      dataIndex: 'application_count',
      key: 'count',
      render: (count) => <Tag color="blue">{count || 0} 人</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const config = {
          active: { color: 'green', text: '已上架' },
          paused: { color: 'orange', text: '已下架' },
          closed: { color: 'default', text: '已关闭' },
        };
        const cfg = config[status] || config.active;
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '发布时间',
      dataIndex: 'created_at',
      key: 'time',
      render: (time) => dayjs(time).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/jobs/${record.id}`)}>
            查看
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => openModal(record)}>
            编辑
          </Button>
          {record.status === 'active' ? (
            <Button type="link" icon={<PauseCircleOutlined />} onClick={() => toggleJobStatus(record)}>
              下架
            </Button>
          ) : (
            <Button type="link" icon={<PlayCircleOutlined />} onClick={() => toggleJobStatus(record)}>
              上架
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div className="page-header">
        <h2>职位管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          发布新岗位
        </Button>
      </div>

      <Card className="card-shadow">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
        ) : jobs.length === 0 ? (
          <Empty
            description={
              <div>
                <p>暂无岗位，点击右上角发布您的第一个岗位</p>
                <Button type="primary" style={{ marginTop: 16 }} onClick={() => openModal()}>
                  发布岗位
                </Button>
              </div>
            }
          />
        ) : (
          <Table
            dataSource={jobs}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条记录`,
            }}
          />
        )}
      </Card>

      <Modal
        title={editingJob ? '编辑岗位' : '发布新岗位'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={900}
        okText="保存"
        cancelText="取消"
      >
        {templates.length > 0 && !editingJob && (
          <Alert
            message="快速发布"
            description={
              <div>
                选择预置JD模板快速创建岗位：
                <Select
                  placeholder="选择模板..."
                  style={{ width: 300, marginLeft: 12 }}
                  onChange={applyTemplate}
                  allowClear
                >
                  {templates.map(t => (
                    <Option key={t.id} value={t.id}>{t.template_name}</Option>
                  ))}
                </Select>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Form form={form} layout="vertical" size="large">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="job_title"
                label="岗位名称"
                rules={[{ required: true, message: '请输入岗位名称' }]}
              >
                <Input placeholder="例如：高级CNC编程工程师" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="job_category_code"
                label="岗位类别"
                rules={[{ required: true, message: '请选择岗位类别' }]}
              >
                <Select placeholder="请选择岗位类别（按国家标准分类）">
                  {renderCategoryOptions(categories)}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="salary_min"
                label="最低薪资（元/月）"
                rules={[{ required: true, message: '请输入最低薪资' }]}
              >
                <Input type="number" placeholder="例如：12000" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="salary_max"
                label="最高薪资（元/月）"
                rules={[{ required: true, message: '请输入最高薪资' }]}
              >
                <Input type="number" placeholder="例如：20000" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="city"
                label="工作城市"
                rules={[{ required: true, message: '请选择城市' }]}
              >
                <Select>
                  <Option value="上海">上海</Option>
                  <Option value="苏州">苏州</Option>
                  <Option value="深圳">深圳</Option>
                  <Option value="东莞">东莞</Option>
                  <Option value="广州">广州</Option>
                  <Option value="无锡">无锡</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="work_experience_required"
                label="工作经验要求"
                rules={[{ required: true, message: '请选择工作经验要求' }]}
              >
                <Select>
                  <Option value="不限">不限</Option>
                  <Option value="1-3年">1-3年</Option>
                  <Option value="3-5年">3-5年</Option>
                  <Option value="5-10年">5-10年</Option>
                  <Option value="10年以上">10年以上</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="education_required"
                label="学历要求"
                rules={[{ required: true, message: '请选择学历要求' }]}
              >
                <Select>
                  <Option value="不限">不限</Option>
                  <Option value="高中">高中/中专</Option>
                  <Option value="大专">大专</Option>
                  <Option value="本科">本科</Option>
                  <Option value="硕士">硕士</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="job_description"
            label="岗位职责"
            rules={[{ required: true, message: '请输入岗位职责' }]}
          >
            <TextArea rows={4} placeholder="请详细描述岗位职责" />
          </Form.Item>

          <Form.Item
            name="requirements"
            label="任职要求"
            rules={[{ required: true, message: '请输入任职要求' }]}
          >
            <TextArea rows={4} placeholder="请详细描述任职要求，包括技能、经验、证书等" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EnterpriseJobs;
