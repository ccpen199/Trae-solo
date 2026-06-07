import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, message } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminAPI, merchantAPI } from '../../api';

const AdminMerchants: React.FC = () => {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadMerchants();
  }, []);

  const loadMerchants = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getReviewMerchants();
      setMerchants(res.data.merchants);
    } catch (error) {
      message.error('加载待审核商家失败');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (merchantId: number, isVerified: boolean) => {
    try {
      await merchantAPI.verifyMerchant(merchantId, { is_verified: isVerified });
      message.success(isVerified ? '审核通过' : '已拒绝');
      loadMerchants();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '商家名称', dataIndex: 'name', key: 'name' },
    { title: '类目', dataIndex: 'category', key: 'category', width: 120 },
    { title: '申请人', dataIndex: 'owner_name', key: 'owner_name', width: 100 },
    { title: '城市', dataIndex: 'city_name', key: 'city_name', width: 100 },
    { title: '营业执照', dataIndex: 'license_number', key: 'license_number', width: 160 },
    { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/merchants/${record.id}`)}>查看</Button>
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleVerify(record.id, true)}>通过</Button>
          <Button size="small" danger icon={<CloseOutlined />} onClick={() => handleVerify(record.id, false)}>拒绝</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="商家资质核验" style={{ marginBottom: 16 }}>
        <Table
          loading={loading}
          dataSource={merchants}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default AdminMerchants;
