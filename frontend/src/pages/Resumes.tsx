import React, { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Button,
  Form,
  Input,
  Select,
  Tag,
  Modal,
  InputNumber,
  Space,
  Typography,
  message,
  Popconfirm,
  Spin,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/auth';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Resume {
  id: number;
  candidate_name: string;
  candidate_phone: string;
  candidate_email: string;
  age: number;
  gender: string;
  current_company: string;
  current_position: string;
  current_salary: number;
  expected_salary_min: number;
  expected_salary_max: number;
  city: string;
  education: string;
  work_years: number;
  skills: string[];
  portrait_tags: string[];
  poaching_risk: number;
  owner_name: string;
  owner_credit: number;
  is_public: boolean;
  created_at: string;
}

interface ResumeForm {
  candidate_name: string;
  candidate_phone: string;
  candidate_email: string;
  age: number;
  gender: string;
  current_company: string;
  current_position: string;
  current_salary: number;
  expected_salary_min: number;
  expected_salary_max: number;
  city: string;
  education: string;
  work_years: number;
  skills: string;
  experience: string;
  education_detail: string;
  is_public: boolean;
}

const Resumes: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    keyword: '',
    city: '',
    education: '',
    work_years: undefined as number | undefined,
    is_public: undefined as boolean | undefined
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingResume, setEditingResume] = useState<Resume | null>(null);
  const [form] = Form.useForm<ResumeForm>();

  useEffect(() => {
    fetchResumes();
  }, [page, pageSize, filters]);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        pageSize,
        ...filters
      };
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined || params[key] === null) {
          delete params[key];
        }
      });
      const response = await axios.get('/api/resumes', { params });
      setResumes(response.data.list);
      setTotal(response.data.total);
    } catch (error) {
      message.error('获取简历列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values: any) => {
    setFilters(values);
    setPage(1);
  };

  const handleReset = () => {
    setFilters({
      keyword: '',
      city: '',
      education: '',
      work_years: undefined,
      is_public: undefined
    });
    setPage(1);
    form.resetFields();
  };

  const handleCreate = () => {
    setEditingResume(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (resume: Resume) => {
    setEditingResume(resume);
    form.setFieldsValue({
      ...resume,
      skills: resume.skills?.join(',') || ''
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/resumes/${id}`);
      message.success('删除成功');
      fetchResumes();
    } catch (error: any) {
      message.error(error.response?.data?.error || '删除失败');
    }
  };

  const handleSubmit = async (values: ResumeForm) => {
    try {
      const data = {
        ...values,
        skills: values.skills?.split(',').map(s => s.trim()).filter(Boolean) || [],
        is_public: values.is_public || false
      };

      if (editingResume) {
        await axios.put(`/api/resumes/${editingResume.id}`, data);
        message.success('更新成功');
      } else {
        await axios.post('/api/resumes', data);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchResumes();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const getRiskLevel = (risk: number) => {
    if (risk >= 0.8) return { color: 'red', text: '极高', className: 'risk-high' };
    if (risk >= 0.65) return { color: 'orange', text: '高', className: 'risk-high' };
    if (risk >= 0.5) return { color: 'gold', text: '中', className: 'risk-medium' };
    if (risk >= 0.35) return { color: 'green', text: '低', className: 'risk-low' };
    return { color: 'success', text: '极低', className: 'risk-low' };
  };

  const getCreditClass = (score: number) => {
    if (score >= 80) return 'credit-score-good';
    if (score >= 60) return 'credit-score-medium';
    return 'credit-score-low';
  };

  const columns = [
    {
      title: '候选人',
      dataIndex: 'candidate_name',
      key: 'candidate_name',
      width: 100,
      render: (name: string, record: Resume) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.age}岁 · {record.gender}</div>
        </div>
      )
    },
    {
      title: '当前职位',
      key: 'position',
      width: 180,
      render: (_: any, record: Resume) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.current_position}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.current_company}</div>
        </div>
      )
    },
    {
      title: '所在城市',
      dataIndex: 'city',
      key: 'city',
      width: 80
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
      width: 80
    },
    {
      title: '工作年限',
      dataIndex: 'work_years',
      key: 'work_years',
      width: 90,
      render: (val: number) => `${val}年`
    },
    {
      title: '当前薪资',
      dataIndex: 'current_salary',
      key: 'current_salary',
      width: 120,
      render: (val: number) => <span className="salary-text">¥{(val / 10000).toFixed(1)}万/年</span>
    },
    {
      title: '期望薪资',
      key: 'expected_salary',
      width: 140,
      render: (_: any, record: Resume) => (
        <span className="salary-text">
          ¥{(record.expected_salary_min / 10000).toFixed(1)}-{(record.expected_salary_max / 10000).toFixed(1)}万
        </span>
      )
    },
    {
      title: '挖角风险',
      dataIndex: 'poaching_risk',
      key: 'poaching_risk',
      width: 100,
      render: (risk: number) => {
        const level = getRiskLevel(risk);
        return <Tag color={level.color} className={level.className}>风险{level.text} ({Math.round(risk * 100)}%)</Tag>;
      }
    },
    {
      title: '人才标签',
      dataIndex: 'portrait_tags',
      key: 'portrait_tags',
      width: 180,
      render: (tags: string[]) => (
        <div className="tag-list">
          {tags?.slice(0, 3).map((tag, idx) => (
            <Tag key={idx} color="blue">{tag}</Tag>
          ))}
          {tags?.length > 3 && <Tag>+{tags.length - 3}</Tag>}
        </div>
      )
    },
    {
      title: '录入人',
      key: 'owner',
      width: 100,
      render: (_: any, record: Resume) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.owner_name}</div>
          <div style={{ fontSize: 12 }} className={getCreditClass(record.owner_credit)}>
            信用: {record.owner_credit}
          </div>
        </div>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: Resume) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/resumes/${record.id}`)}
          >
            查看
          </Button>
          {(record.owner_name === user?.real_name || user?.role === 'admin') && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定删除此简历？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                >
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>简历库</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            录入简历
          </Button>
        </div>
        <Form layout="inline" onFinish={handleSearch} initialValues={filters}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="姓名/职位/技能" style={{ width: 180 }} prefix={<SearchOutlined />} />
          </Form.Item>
          <Form.Item name="city" label="城市">
            <Select placeholder="全部" style={{ width: 120 }} allowClear>
              <Option value="北京">北京</Option>
              <Option value="上海">上海</Option>
              <Option value="深圳">深圳</Option>
              <Option value="杭州">杭州</Option>
              <Option value="广州">广州</Option>
            </Select>
          </Form.Item>
          <Form.Item name="education" label="学历">
            <Select placeholder="全部" style={{ width: 120 }} allowClear>
              <Option value="博士">博士</Option>
              <Option value="硕士">硕士</Option>
              <Option value="本科">本科</Option>
              <Option value="大专">大专</Option>
            </Select>
          </Form.Item>
          <Form.Item name="work_years" label="工作年限">
            <Select placeholder="全部" style={{ width: 120 }} allowClear>
              <Option value={1}>1年以上</Option>
              <Option value={3}>3年以上</Option>
              <Option value={5}>5年以上</Option>
              <Option value={10}>10年以上</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>搜索</Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          dataSource={resumes}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            }
          }}
        />
      </Card>

      <Modal
        title={editingResume ? '编辑简历' : '录入新简历'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ is_public: true, gender: '男' }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="candidate_name" label="候选人姓名" rules={[{ required: true }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
                <Select>
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="age" label="年龄" rules={[{ required: true }]}>
                <InputNumber min={18} max={65} style={{ width: '100%' }} placeholder="岁" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="candidate_phone" label="联系电话" rules={[{ required: true }]}>
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="candidate_email" label="电子邮箱">
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="current_company" label="当前公司">
                <Input placeholder="请输入公司名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="current_position" label="当前职位" rules={[{ required: true }]}>
                <Input placeholder="请输入职位名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="current_salary" label="当前年薪（元）">
                <InputNumber style={{ width: '100%' }} placeholder="年薪" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="expected_salary_min" label="期望年薪下限">
                <InputNumber style={{ width: '100%' }} placeholder="最低期望" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="expected_salary_max" label="期望年薪上限">
                <InputNumber style={{ width: '100%' }} placeholder="最高期望" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="city" label="所在城市" rules={[{ required: true }]}>
                <Select placeholder="请选择城市">
                  <Option value="北京">北京</Option>
                  <Option value="上海">上海</Option>
                  <Option value="深圳">深圳</Option>
                  <Option value="杭州">杭州</Option>
                  <Option value="广州">广州</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="education" label="最高学历" rules={[{ required: true }]}>
                <Select placeholder="请选择学历">
                  <Option value="博士">博士</Option>
                  <Option value="硕士">硕士</Option>
                  <Option value="本科">本科</Option>
                  <Option value="大专">大专</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="work_years" label="工作年限" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="年" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="skills" label="技能标签（逗号分隔）">
            <Input placeholder="如: React,TypeScript,Node.js" />
          </Form.Item>
          <Form.Item name="experience" label="工作经历">
            <TextArea rows={3} placeholder="请详细描述工作经历" />
          </Form.Item>
          <Form.Item name="education_detail" label="教育经历">
            <TextArea rows={2} placeholder="请描述教育经历" />
          </Form.Item>
          <Form.Item name="is_public" valuePropName="checked">
            <Select>
              <Option value={true}>公开（可被搜索）</Option>
              <Option value={false}>私有（仅自己可见）</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingResume ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Resumes;
