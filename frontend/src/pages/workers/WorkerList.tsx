import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Table,
  Card,
  Tag,
  Space,
  Modal,
  message,
  Row,
  Col,
  InputNumber,
  Radio,
  Rate,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  ReloadOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { workerApi } from '../../api';
import { Worker, WorkerRoleMap } from '../../types';

const { Option } = Select;

export default function WorkerList() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Worker[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<any>({});
  const [searchForm] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [createForm] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchList();
  }, [page, pageSize]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize,
        ...filters,
      };
      const result = await workerApi.list(params);
      setList(result.list || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values: any) => {
    const cleanedFilters: any = {};
    Object.keys(values).forEach((key) => {
      if (values[key] !== undefined && values[key] !== '' && values[key] !== null) {
        cleanedFilters[key] = values[key];
      }
    });
    setFilters(cleanedFilters);
    setPage(1);
    setTimeout(() => fetchList(), 0);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setFilters({});
    setPage(1);
    setTimeout(() => fetchList(), 0);
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setModalLoading(true);
      const result = await workerApi.create(values);
      message.success(result.message || '创建成功');
      setModalOpen(false);
      createForm.resetFields();
      fetchList();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      console.error(error);
    } finally {
      setModalLoading(false);
    }
  };

  const statusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      active: { color: 'green', text: '正常' },
      inactive: { color: 'default', text: '停用' },
      pending_review: { color: 'orange', text: '待审核' },
    };
    const cfg = map[status] || { color: 'default', text: status };
    return <Tag color={cfg.color}>{cfg.text}</Tag>;
  };

  const renderRating = (rating: number) => {
    return (
      <span>
        <Rate disabled allowHalf value={rating || 0} style={{ fontSize: 14 }} />
        <span style={{ marginLeft: 8, color: '#666' }}>{rating?.toFixed(1) || 0}</span>
      </span>
    );
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => (
        <Tag color="blue">{WorkerRoleMap[role as keyof typeof WorkerRoleMap] || role}</Tag>
      ),
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 80,
    },
    {
      title: '经验(年)',
      dataIndex: 'experience_years',
      key: 'experience_years',
      width: 100,
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 180,
      render: (rating: number) => renderRating(rating),
      sorter: (a: Worker, b: Worker) => (a.rating || 0) - (b.rating || 0),
    },
    {
      title: '订单数',
      dataIndex: 'order_count',
      key: 'order_count',
      width: 100,
      sorter: (a: Worker, b: Worker) => (a.order_count || 0) - (b.order_count || 0),
    },
    {
      title: '服务城市',
      dataIndex: 'service_cities_data',
      key: 'service_cities_data',
      render: (cities: string[]) => (
        <Space size={[4, 4]} wrap>
          {(cities || []).map((city, idx) => (
            <Tag key={idx} color="geekblue">{city}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => statusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Worker) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/workers/${record.id}`)}
          >
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card className="filter-card" style={{ marginBottom: 16 }} bodyStyle={{ padding: 20 }}>
        <Form
          form={searchForm}
          layout="vertical"
          onFinish={handleSearch}
          initialValues={{ minRating: undefined }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="role" label="角色">
                <Select placeholder="请选择角色" allowClear>
                  <Option value="nanny">保姆</Option>
                  <Option value="cleaner">保洁</Option>
                  <Option value="maternity">月嫂</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="status" label="状态">
                <Select placeholder="请选择状态" allowClear>
                  <Option value="active">正常</Option>
                  <Option value="inactive">停用</Option>
                  <Option value="pending_review">待审核</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="city" label="城市">
                <Input placeholder="请输入城市" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="姓名/技能" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="minRating" label="最低评分">
                <Select placeholder="请选择最低评分" allowClear>
                  <Option value={3}>3分及以上</Option>
                  <Option value={4}>4分及以上</Option>
                  <Option value={4.5}>4.5分及以上</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={16} lg={18}>
              <Form.Item label=" " colon={false}>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} htmlType="submit">
                    搜索
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card
        className="table-card"
        bodyStyle={{ padding: 20 }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>阿姨列表 ({total})</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              新增阿姨
            </Button>
          </div>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
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
            },
          }}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Modal
        title="新增阿姨"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          createForm.resetFields();
        }}
        onOk={handleCreate}
        confirmLoading={modalLoading}
        width={720}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{
            role: 'nanny',
            gender: 'female',
            experience_years: 1,
            age: 30,
            education: '高中',
            service_cities: ['上海市'],
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="id_card"
                label="身份证号"
                rules={[{ required: true, message: '请输入身份证号' }]}
              >
                <Input placeholder="请输入身份证号" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select>
                  <Option value="nanny">保姆</Option>
                  <Option value="cleaner">保洁</Option>
                  <Option value="maternity">月嫂</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
                ]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="age"
                label="年龄"
                rules={[{ required: true, message: '请输入年龄' }]}
              >
                <InputNumber min={18} max={80} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="gender"
                label="性别"
                rules={[{ required: true, message: '请选择性别' }]}
              >
                <Radio.Group>
                  <Radio value="female">女</Radio>
                  <Radio value="male">男</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="experience_years" label="从业年限(年)">
                <InputNumber min={0} max={50} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="native_place" label="籍贯">
                <Input placeholder="请输入籍贯" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="education" label="学历">
                <Select>
                  <Option value="小学">小学</Option>
                  <Option value="初中">初中</Option>
                  <Option value="高中">高中</Option>
                  <Option value="大专">大专</Option>
                  <Option value="本科">本科</Option>
                  <Option value="硕士及以上">硕士及以上</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="skills" label="技能标签">
                <Select
                  mode="tags"
                  placeholder="输入后回车添加"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="languages" label="语言能力">
                <Select mode="tags" placeholder="输入后回车添加" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="service_cities" label="服务城市">
                <Select mode="tags" placeholder="输入后回车添加" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
