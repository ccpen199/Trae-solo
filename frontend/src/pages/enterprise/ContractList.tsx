import React, { useEffect, useState } from 'react';
import { Table, Card, Select, Button, Space, Spin, message, Tag, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { LaborContract } from '../../types';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

const ContractList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<LaborContract[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const fetchContracts = async (status?: string) => {
    setLoading(true);
    try {
      const params: any = {};
      if (status) params.status = status;
      const res = await api.contracts.getMy(params);
      setContracts(res.data || []);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取合同列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts(statusFilter);
  }, [statusFilter]);

  const handleSign = async (id: number) => {
    try {
      await api.contracts.signEnterprise(id);
      message.success('合同签署成功');
      fetchContracts(statusFilter);
    } catch (error: any) {
      message.error(error.response?.data?.error || '签署合同失败');
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      draft: '草稿',
      signed: '已签署',
      terminated: '已终止',
      expired: '已过期'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      draft: 'orange',
      signed: 'green',
      terminated: 'red',
      expired: 'default'
    };
    return map[status] || 'default';
  };

  const getSalaryTypeText = (type: string) => {
    const map: Record<string, string> = {
      daily: '日薪',
      piece: '计件',
      monthly: '月薪'
    };
    return map[type] || type;
  };

  const columns: ColumnsType<LaborContract> = [
    {
      title: '合同编号',
      dataIndex: 'contractNo',
      key: 'contractNo',
      width: 180
    },
    {
      title: '工人信息',
      key: 'worker',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.workerName || record.workerUsername || '-'}</div>
          <div style={{ color: '#8c8c8c', fontSize: '12px' }}>{record.workerPhone || ''}</div>
        </div>
      )
    },
    {
      title: '岗位名称',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: '薪资待遇',
      key: 'salary',
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', color: '#f5222d' }}>
            ¥{record.salaryAmount}
          </div>
          <Tag>{getSalaryTypeText(record.salaryType)}</Tag>
        </div>
      )
    },
    {
      title: '合同期限',
      key: 'period',
      width: 200,
      render: (_, record) => (
        <div>
          <div>开始：{record.startDate}</div>
          <div>结束：{record.endDate}</div>
        </div>
      )
    },
    {
      title: '签署状态',
      key: 'signStatus',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color={record.workerSigned ? 'green' : 'orange'}>
            工人：{record.workerSigned ? '已签' : '待签'}
          </Tag>
          <Tag color={record.enterpriseSigned ? 'green' : 'orange'}>
            企业：{record.enterpriseSigned ? '已签' : '待签'}
          </Tag>
        </Space>
      )
    },
    {
      title: '合同状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/contracts/${record.id}`)}
          >
            查看
          </Button>
          {!record.enterpriseSigned && record.status === 'draft' && (
            <Popconfirm
              title="确认签署合同"
              description="请仔细阅读合同内容后再签署"
              onConfirm={() => handleSign(record.id)}
              okText="确认签署"
              cancelText="取消"
            >
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
              >
                签署合同
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <Card
      title="合同管理"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/enterprise/contracts/create')}
        >
          创建合同
        </Button>
      }
    >
      <div style={{ marginBottom: '16px' }}>
        <Space>
          <span style={{ color: '#666' }}>状态筛选：</span>
          <Select
            placeholder="全部状态"
            style={{ width: 150 }}
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="draft">待签署</Option>
            <Option value="signed">已签署</Option>
            <Option value="terminated">已终止</Option>
            <Option value="expired">已过期</Option>
          </Select>
          <span style={{ color: '#8c8c8c' }}>共 {contracts.length} 份合同</span>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={contracts}
          rowKey="id"
          scroll={{ x: 1600 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Spin>
    </Card>
  );
};

export default ContractList;
