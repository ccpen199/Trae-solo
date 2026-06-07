import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Typography, Tag, Space, Modal, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { lawyerAPI } from '../../utils/api';

const { Title } = Typography;

function LawyerVerify() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPendingLawyers();
  }, []);

  const loadPendingLawyers = async () => {
    setLoading(true);
    try {
      const res = await lawyerAPI.getPendingLawyers();
      if (res.data.success) {
        setLawyers(res.data.lawyers);
      }
    } catch (err) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (id, status) => {
    Modal.confirm({
      title: `确认${status === 'approved' ? '通过' : '拒绝'}审核`,
      content: status === 'approved' ? '确认该律师资质审核通过吗？' : '确认拒绝该律师的入驻申请吗？',
      onOk: async () => {
        try {
          await lawyerAPI.verifyLawyer(id, status);
          message.success('审核完成');
          loadPendingLawyers();
        } catch (err) {
          message.error('审核失败');
        }
      },
    });
  };

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '执业证号', dataIndex: 'license_number', key: 'license_number' },
    { title: '审核状态', dataIndex: 'verification_status', key: 'verification_status',
      render: (status) => <Tag color="orange">待审核</Tag>
    },
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleVerify(record.id, 'approved')}>
            通过
          </Button>
          <Button danger size="small" icon={<CloseOutlined />} onClick={() => handleVerify(record.id, 'rejected')}>
            拒绝
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>律师资质审核</Title>
      <Card style={{ marginTop: 24 }}>
        <Table
          dataSource={lawyers}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}

export default LawyerVerify;
