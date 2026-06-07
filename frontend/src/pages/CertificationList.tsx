import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Spin, message, Tag } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { TradeCertification } from '../types';
import type { ColumnsType } from 'antd/es/table';

const CertificationList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [certifications, setCertifications] = useState<TradeCertification[]>([]);

  const fetchCertifications = async () => {
    setLoading(true);
    try {
      const res = await api.certifications.getMy();
      setCertifications(res.data || []);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取认证列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertifications();
  }, []);

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: '待审核',
      verified: '已通过',
      rejected: '已拒绝'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'orange',
      verified: 'green',
      rejected: 'red'
    };
    return map[status] || 'default';
  };

  const columns: ColumnsType<TradeCertification> = [
    {
      title: '工种',
      dataIndex: 'gbName',
      key: 'gbName',
      width: 150
    },
    {
      title: '证书编号',
      dataIndex: 'certificateNumber',
      key: 'certificateNumber',
      width: 200
    },
    {
      title: '证书类型',
      dataIndex: 'certificateType',
      key: 'certificateType',
      width: 150
    },
    {
      title: '发证机构',
      dataIndex: 'verificationSource',
      key: 'verificationSource',
      render: (text) => text || '-'
    },
    {
      title: '审核状态',
      dataIndex: 'verificationStatus',
      key: 'verificationStatus',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '审核时间',
      dataIndex: 'verifiedAt',
      key: 'verifiedAt',
      width: 180,
      render: (text) => text ? new Date(text).toLocaleString('zh-CN') : '-'
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {record.certificateImage && (
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => window.open(record.certificateImage, '_blank')}
            >
              查看证书
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <Card
      title="我的工种认证"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/certifications/submit')}
        >
          提交认证
        </Button>
      }
    >
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={certifications}
          rowKey="id"
          scroll={{ x: 1000 }}
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

export default CertificationList;
