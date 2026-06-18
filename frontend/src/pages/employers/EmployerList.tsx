import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Table,
  Card,
  Space,
  message,
  Row,
  Col,
  Tag,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { employerApi } from '../../api';
import { Employer } from '../../types';

const { Option } = Select;

export default function EmployerList() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Employer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<any>({});
  const [searchForm] = Form.useForm();
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
      const result = await employerApi.list(params);
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

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (text: string) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#1677ff' }} />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (text: string) => (
        <Space>
          <PhoneOutlined style={{ color: '#52c41a' }} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '城市/区域',
      dataIndex: 'city',
      key: 'city',
      width: 200,
      render: (_: any, record: Employer) => (
        <Space size={[4, 4]} wrap>
          <Tag color="blue">{record.city || '-'}</Tag>
          <Tag color="geekblue">{record.district || '-'}</Tag>
        </Space>
      ),
    },
    {
      title: '详细地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '家庭人数',
      dataIndex: 'family_members',
      key: 'family_members',
      width: 100,
      align: 'center' as const,
      render: (num: number) => (
        <Space>
          <TeamOutlined style={{ color: '#722ed1' }} />
          <span>{num || 0} 人</span>
        </Space>
      ),
    },
    {
      title: '总订单',
      dataIndex: 'total_orders',
      key: 'total_orders',
      width: 100,
      align: 'center' as const,
      sorter: (a: Employer, b: Employer) => (a.total_orders || 0) - (b.total_orders || 0),
      render: (num: number) => (
        <Tag color="purple" style={{ margin: 0 }}>
          {num || 0} 单
        </Tag>
      ),
    },
    {
      title: '已完成订单',
      dataIndex: 'completed_orders',
      key: 'completed_orders',
      width: 120,
      align: 'center' as const,
      sorter: (a: Employer, b: Employer) =>
        (a.completed_orders || 0) - (b.completed_orders || 0),
      render: (num: number) => (
        <Tag color="green" style={{ margin: 0 }}>
          {num || 0} 单
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Employer) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/employers/${record.id}`)}
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
        <Form form={searchForm} layout="vertical" onFinish={handleSearch}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8} lg={8}>
              <Form.Item name="city" label="城市">
                <Select placeholder="请选择城市" allowClear>
                  <Option value="上海市">上海市</Option>
                  <Option value="北京市">北京市</Option>
                  <Option value="广州市">广州市</Option>
                  <Option value="深圳市">深圳市</Option>
                  <Option value="杭州市">杭州市</Option>
                  <Option value="南京市">南京市</Option>
                  <Option value="成都市">成都市</Option>
                  <Option value="武汉市">武汉市</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="姓名/手机号" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={8} lg={8}>
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
        title={<span>雇主列表 ({total})</span>}
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
    </div>
  );
}
