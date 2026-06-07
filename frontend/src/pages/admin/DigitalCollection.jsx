import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Tabs } from 'antd';
import api from '../../utils/api';

function DigitalCollection() {
  const [stamps, setStamps] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStamps();
    loadNFTs();
  }, []);

  const loadStamps = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/stamps');
      setStamps(response.data.stamps);
    } catch (error) {
      console.error('加载电子邮戳失败', error);
    }
    setLoading(false);
  };

  const loadNFTs = async () => {
    try {
      const response = await api.get('/admin/nft');
      setNfts(response.data.nfts);
    } catch (error) {
      console.error('加载数字藏品失败', error);
    }
  };

  const stampColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '邮戳编号', dataIndex: 'stamp_code', key: 'stamp_code' },
    { title: '持有人', dataIndex: 'username', key: 'username' },
    { title: '设计', dataIndex: 'design', key: 'design', ellipsis: true },
    { title: '签发时间', dataIndex: 'issued_at', key: 'issued_at' },
  ];

  const nftColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '藏品名称', dataIndex: 'name', key: 'name' },
    { title: 'Token ID', dataIndex: 'token_id', key: 'token_id' },
    { title: '持有人', dataIndex: 'username', key: 'username' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status) => (
      <Tag color="purple">{status}</Tag>
    )},
    { title: '铸造时间', dataIndex: 'created_at', key: 'created_at' },
  ];

  const items = [
    {
      key: 'stamps',
      label: '电子邮戳',
      children: (
        <Card>
          <Table
            columns={stampColumns}
            dataSource={stamps}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: 'nfts',
      label: '数字藏品',
      children: (
        <Card>
          <Table
            columns={nftColumns}
            dataSource={nfts}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>数字藏品管理</h1>
      <Tabs items={items} defaultActiveKey="stamps" />
    </div>
  );
}

export default DigitalCollection;
