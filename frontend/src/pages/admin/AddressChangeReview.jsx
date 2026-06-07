import React, { useEffect, useState } from 'react';
import { Card, Table, Button, message, Tag, Popconfirm } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api from '../../utils/api';

function AddressChangeReview() {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChanges();
  }, []);

  const loadChanges = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/address-changes');
      setChanges(response.data.changes);
    } catch (error) {
      console.error('加载地址变更申请失败', error);
    }
    setLoading(false);
  };

  const handleApprove = async (id, approved) => {
    try {
      await api.post(`/admin/address-changes/${id}/approve`, { approved });
      message.success(approved ? '已批准' : '已拒绝');
      loadChanges();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '申请ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '用户', dataIndex: 'username', key: 'username' },
    { title: '订阅商品', dataIndex: 'product_name', key: 'product_name' },
    { title: '原地址', dataIndex: 'old_address', key: 'old_address', ellipsis: true },
    { title: '新地址', dataIndex: 'new_address', key: 'new_address', ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status) => (
      <Tag color={status === 'pending' ? 'orange' : status === 'approved' ? 'green' : 'red'}>
        {status === 'pending' ? '待审批' : status === 'approved' ? '已批准' : '已拒绝'}
      </Tag>
    )},
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at' },
    { title: '操作', key: 'action', render: (_, record) => record.status === 'pending' && (
      <>
        <Popconfirm title="确定批准该地址变更？" onConfirm={() => handleApprove(record.id, true)}>
          <Button type="primary" size="small" icon={<CheckOutlined />} style={{ marginRight: 8 }}>
            批准
          </Button>
        </Popconfirm>
        <Popconfirm title="确定拒绝该地址变更？" onConfirm={() => handleApprove(record.id, false)}>
          <Button size="small" danger icon={<CloseOutlined />}>
            拒绝
          </Button>
        </Popconfirm>
      </>
    )},
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>地址变更审批</h1>
      <Card>
        <Table
          columns={columns}
          dataSource={changes}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}

export default AddressChangeReview;
