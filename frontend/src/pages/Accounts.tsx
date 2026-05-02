import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Tag,
  Space,
  message,
  Popconfirm,
  Spin,
} from 'antd';
import { PlusOutlined, SyncOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { useAuth } from '../store/auth';

const { Option } = Select;

const Accounts: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [form] = Form.useForm();
  const { user } = useAuth();

  const canEdit = ['CASHIER', 'FINANCIAL_MANAGER', 'ADMIN'].includes(user?.role || '');

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const response: any = await api.get('/accounts');
      if (response.success) {
        setAccounts(response.data.accounts || []);
      }
    } catch (error) {
      console.error('Load accounts error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      const response: any = await api.post('/accounts', values);
      if (response.success) {
        message.success('账户创建成功');
        setModalVisible(false);
        form.resetFields();
        loadAccounts();
      }
    } catch (error) {
      console.error('Create account error:', error);
    }
  };

  const handleSync = async (id: string, accountNumber: string) => {
    setSyncing(id);
    try {
      const response: any = await api.post(`/accounts/${id}/sync`);
      if (response.success) {
        message.success('同步成功');
        loadAccounts();
      }
    } catch (error) {
      console.error('Sync account error:', error);
    } finally {
      setSyncing(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'success',
      INACTIVE: 'default',
      FROZEN: 'warning',
      CLOSED: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      ACTIVE: '正常',
      INACTIVE: '停用',
      FROZEN: '冻结',
      CLOSED: '已销户',
    };
    return texts[status] || status;
  };

  const getAccountTypeText = (type: string) => {
    const texts: Record<string, string> = {
      BASIC: '基本户',
      GENERAL: '一般户',
      SPECIAL: '专户',
      FOREIGN_CURRENCY: '外币户',
    };
    return texts[type] || type;
  };

  const columns = [
    {
      title: '账户名称',
      dataIndex: 'accountName',
      key: 'accountName',
    },
    {
      title: '账号',
      dataIndex: 'accountNumber',
      key: 'accountNumber',
      render: (val: string) => `${val.slice(0, 4)}****${val.slice(-4)}`,
    },
    {
      title: '银行',
      dataIndex: 'bankName',
      key: 'bankName',
    },
    {
      title: '账户类型',
      dataIndex: 'accountType',
      key: 'accountType',
      render: (val: string) => getAccountTypeText(val),
    },
    {
      title: '币种',
      dataIndex: 'currency',
      key: 'currency',
    },
    {
      title: '当前余额',
      dataIndex: 'currentBalance',
      key: 'currentBalance',
      render: (val: number) => `¥${Number(val).toLocaleString()}`,
    },
    {
      title: '可用余额',
      dataIndex: 'availableBalance',
      key: 'availableBalance',
      render: (val: number) => (
        <span style={{ color: '#52c41a', fontWeight: 500 }}>
          ¥{Number(val).toLocaleString()}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '最后同步',
      dataIndex: 'lastSyncTime',
      key: 'lastSyncTime',
      render: (time: string) =>
        time ? new Date(time).toLocaleString() : '未同步',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          {canEdit && (
            <Button
              type="link"
              size="small"
              icon={<SyncOutlined spin={syncing === record.id} />}
              onClick={() => handleSync(record.id, record.accountNumber)}
              disabled={syncing === record.id}
            >
              同步
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>账户管理</h2>
        <p>管理企业银行账户，查看余额和流水</p>
      </div>

      <Card
        extra={
          canEdit && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              新增账户
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={accounts}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title="新增银行账户"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          className="modal-form"
        >
          <Form.Item
            name="accountNumber"
            label="银行账号"
            rules={[{ required: true, message: '请输入银行账号' }]}
          >
            <Input placeholder="请输入银行账号" />
          </Form.Item>
          <Form.Item
            name="accountName"
            label="账户名称"
            rules={[{ required: true, message: '请输入账户名称' }]}
          >
            <Input placeholder="请输入账户名称" />
          </Form.Item>
          <Form.Item
            name="bankName"
            label="开户银行"
            rules={[{ required: true, message: '请选择开户银行' }]}
          >
            <Select placeholder="请选择开户银行">
              <Option value="中国工商银行">中国工商银行</Option>
              <Option value="中国建设银行">中国建设银行</Option>
              <Option value="中国农业银行">中国农业银行</Option>
              <Option value="中国银行">中国银行</Option>
              <Option value="招商银行">招商银行</Option>
              <Option value="交通银行">交通银行</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="bankCode"
            label="银行代码"
          >
            <Input placeholder="请输入银行代码（可选）" />
          </Form.Item>
          <Form.Item
            name="accountType"
            label="账户类型"
            rules={[{ required: true, message: '请选择账户类型' }]}
            initialValue="GENERAL"
          >
            <Select placeholder="请选择账户类型">
              <Option value="BASIC">基本户</Option>
              <Option value="GENERAL">一般户</Option>
              <Option value="SPECIAL">专户</Option>
              <Option value="FOREIGN_CURRENCY">外币户</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="currency"
            label="币种"
            initialValue="CNY"
          >
            <Select placeholder="请选择币种">
              <Option value="CNY">人民币 (CNY)</Option>
              <Option value="USD">美元 (USD)</Option>
              <Option value="EUR">欧元 (EUR)</Option>
              <Option value="GBP">英镑 (GBP)</Option>
              <Option value="JPY">日元 (JPY)</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="initialBalance"
            label="初始余额"
            initialValue={0}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入初始余额"
              precision={2}
              min={0}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Accounts;
