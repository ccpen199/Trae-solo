import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  message,
  Typography,
  Row,
  Col,
  Modal,
  Form,
  Progress,
} from 'antd';
import {
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
  BankOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Company } from '../../types';
import { admin } from '../../api/endpoints';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const statusConfig: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待审核' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已拒绝' },
  suspended: { color: 'default', text: '已暂停' },
};

const EnterpriseList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [auditModalVisible, setAuditModalVisible] = useState(false);
  const [auditType, setAuditType] = useState<'approve' | 'reject'>('approve');
  const [auditCompany, setAuditCompany] = useState<Company | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (status) params.status = status;

      const response = await admin.enterprises(params);
      setData(response.data.list);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch enterprises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleAudit = (company: Company, type: 'approve' | 'reject') => {
    setAuditCompany(company);
    setAuditType(type);
    form.resetFields();
    setAuditModalVisible(true);
  };

  const handleAuditSubmit = async () => {
    if (!auditCompany) return;
    try {
      const values = await form.validateFields();
      await admin.auditCompany(
        auditCompany.id,
        auditType === 'approve' ? 'approved' : 'rejected',
        values.reason
      );
      message.success(auditType === 'approve' ? '审核通过' : '已拒绝');
      setAuditModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('操作失败，请稍后重试');
    }
  };

  const getCreditScoreColor = (score?: number) => {
    if (!score) return '#d9d9d9';
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const columns = [
    {
      title: '公司名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200,
      render: (text: string) => (
        <Space>
          <BankOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '规模',
      dataIndex: 'scale',
      key: 'scale',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '认证状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '信用评分',
      key: 'creditScore',
      width: 160,
      render: (_: any, record: Company) => {
        const score = record.credits?.[0]?.overallRating;
        return (
          <Space>
            <Progress
              type="dashboard"
              percent={score || 0}
              size={40}
              strokeColor={getCreditScoreColor(score)}
              showInfo={false}
            />
            <Text strong style={{ color: getCreditScoreColor(score) }}>
              {score ? `${score}分` : '暂无'}
            </Text>
          </Space>
        );
      },
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: Company) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<CreditCardOutlined />}
            onClick={() => navigate(`/admin/credit/${record.id}`)}
          >
            信用档案
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleAudit(record, 'approve')}
                style={{ color: '#52c41a' }}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleAudit(record, 'reject')}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <BankOutlined /> 企业管理
          </Title>
        </Col>
      </Row>

      <Space style={{ marginBottom: '16px' }} wrap>
        <Search
          placeholder="搜索企业名称"
          allowClear
          enterButton={<SearchOutlined />}
          style={{ width: 280 }}
          onSearch={handleSearch}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Select
          placeholder="筛选状态"
          allowClear
          style={{ width: 140 }}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
            setTimeout(fetchData, 0);
          }}
        >
          <Option value="pending">待审核</Option>
          <Option value="approved">已通过</Option>
          <Option value="rejected">已拒绝</Option>
          <Option value="suspended">已暂停</Option>
        </Select>
        <Button onClick={handleSearch}>查询</Button>
      </Space>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
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
      />

      <Modal
        title={auditType === 'approve' ? '审核通过' : '拒绝申请'}
        open={auditModalVisible}
        onCancel={() => setAuditModalVisible(false)}
        onOk={handleAuditSubmit}
        okText={auditType === 'approve' ? '确认通过' : '确认拒绝'}
        okButtonProps={{
          danger: auditType === 'reject',
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <Text>企业名称：</Text>
          <Text strong>{auditCompany?.companyName}</Text>
        </div>
        <Form form={form} layout="vertical">
          <Form.Item
            name="reason"
            label={auditType === 'approve' ? '备注（可选）' : '拒绝原因'}
            rules={auditType === 'reject' ? [{ required: true, message: '请输入拒绝原因' }] : []}
          >
            <TextArea
              rows={4}
              placeholder={auditType === 'approve' ? '请输入备注信息' : '请输入拒绝原因'}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EnterpriseList;
