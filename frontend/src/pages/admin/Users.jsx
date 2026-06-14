import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Select, Button, Space, Tag, Modal, Descriptions, Switch, message, Spin } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { getUsers, getUserDetail, updateUserStatus } from '../../api/admin';

const { Option } = Select;

const Users = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailModal, setDetailModal] = useState(false);
  const [userDetail, setUserDetail] = useState(null);

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize]);

  const loadData = async (overrides = {}) => {
    const nextPagination = overrides.pagination || pagination;
    const nextSearchText = overrides.searchText ?? searchText;
    const nextStatusFilter = overrides.statusFilter ?? statusFilter;
    try {
      setLoading(true);
      const res = await getUsers({
        page: nextPagination.current,
        page_size: nextPagination.pageSize,
        keyword: nextSearchText,
        status: nextStatusFilter
      });
      setData(res?.list || []);
      setPagination(prev => ({ ...prev, total: res?.total || 0 }));
    } catch (err) {
      console.error(err);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const nextPagination = { ...pagination, current: 1 };
    setPagination(nextPagination);
    loadData({ pagination: nextPagination });
  };

  const handleReset = () => {
    const nextPagination = { ...pagination, current: 1 };
    setSearchText('');
    setStatusFilter('');
    setPagination(nextPagination);
    loadData({ pagination: nextPagination, searchText: '', statusFilter: '' });
  };

  const handleViewDetail = async (id) => {
    try {
      setLoading(true);
      const res = await getUserDetail(id);
      setUserDetail(res);
      setDetailModal(true);
    } catch (err) {
      console.error(err);
      message.error('获取用户详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, checked) => {
    try {
      await updateUserStatus(id, { status: checked ? 1 : 0 });
      message.success(checked ? '用户已启用' : '用户已禁用');
      loadData();
    } catch (err) {
      console.error(err);
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '用户ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '用户类型',
      dataIndex: 'user_type',
      key: 'user_type',
      width: 120
    },
    {
      title: '真实姓名',
      dataIndex: 'real_name',
      key: 'real_name',
      width: 120
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={Number(status) === 1 ? 'green' : 'red'}>
          {Number(status) === 1 ? '正常' : '禁用'}
        </Tag>
      )
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160
    },
    {
      title: '启用/禁用',
      key: 'action_switch',
      width: 100,
      render: (_, record) => (
        <Switch
          checked={Number(record.status) === 1}
          onChange={(checked) => handleStatusChange(record.id, checked)}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record.id)}
        >
          详情
        </Button>
      )
    }
  ];

  return (
    <div className="admin-users">
      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索用户名/姓名/手机号"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="用户状态"
            value={statusFilter || undefined}
            onChange={(value) => setStatusFilter(value)}
            style={{ width: 140 }}
            allowClear
          >
            <Option value="1">正常</Option>
            <Option value="0">禁用</Option>
          </Select>
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
            }}
            scroll={{ x: 1200 }}
          />
        </Spin>
      </Card>

      <Modal
        title="用户详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={700}
      >
        {userDetail && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="用户ID">{(userDetail.user || userDetail).id}</Descriptions.Item>
            <Descriptions.Item label="真实姓名">{(userDetail.user || userDetail).real_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="手机号">{(userDetail.user || userDetail).phone}</Descriptions.Item>
            <Descriptions.Item label="用户类型">{(userDetail.user || userDetail).user_type || '-'}</Descriptions.Item>
            <Descriptions.Item label="身份证号">{(userDetail.user || userDetail).id_card || '-'}</Descriptions.Item>
            <Descriptions.Item label="详细地址">{(userDetail.user || userDetail).address || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={Number((userDetail.user || userDetail).status) === 1 ? 'green' : 'red'}>
                {Number((userDetail.user || userDetail).status) === 1 ? '正常' : '禁用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">{(userDetail.user || userDetail).created_at}</Descriptions.Item>
            <Descriptions.Item label="绑定卡片数" span={2}>
              {userDetail.cards?.length || 0} 张
            </Descriptions.Item>
            <Descriptions.Item label="当前积分" span={2}>
              {userDetail.points?.points || 0}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Users;
