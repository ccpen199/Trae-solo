import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Input, Select, Tag, Space, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { riderService } from '@/services/rider.service';
import type { Rider } from '@shared/types';

const RiderList: React.FC = () => {
  const navigate = useNavigate();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [isOnline, setIsOnline] = useState<boolean | undefined>(undefined);
  const [isFrozen, setIsFrozen] = useState<boolean | undefined>(undefined);

  const fetchRiders = async () => {
    setLoading(true);
    try {
      const result = await riderService.getList({
        page,
        pageSize,
        keyword: keyword || undefined,
        isOnline,
        isFrozen,
      });
      setRiders(result.data);
      setTotal(result.total);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRiders();
  }, [page, pageSize, isOnline, isFrozen]);

  const columns: ColumnsType<Rider> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => record.realName || record.nickname || text,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '在线状态',
      dataIndex: 'isOnline',
      key: 'isOnline',
      render: (val: boolean) => (
        <Tag color={val ? 'green' : 'default'}>{val ? '在线' : '离线'}</Tag>
      ),
    },
    {
      title: '冻结状态',
      dataIndex: 'isFrozen',
      key: 'isFrozen',
      render: (val: boolean) => (
        <Tag color={val ? 'red' : 'green'}>{val ? '已冻结' : '正常'}</Tag>
      ),
    },
    {
      title: '信用分',
      dataIndex: 'creditScore',
      key: 'creditScore',
      render: (val: number) => (
        <span style={{ color: val < 60 ? '#cf1322' : val < 80 ? '#faad14' : '#52c41a' }}>
          {val}
        </span>
      ),
    },
    {
      title: '完成订单',
      dataIndex: 'completedOrders',
      key: 'completedOrders',
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
      render: (val: string) => {
        const map: Record<string, { color: string; text: string }> = {
          pending: { color: 'orange', text: '待审核' },
          approved: { color: 'green', text: '已通过' },
          rejected: { color: 'red', text: '已拒绝' },
        };
        const item = map[val] || { color: 'default', text: val };
        return <Tag color={item.color}>{item.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/rider/${record.id}`)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card className="page-card">
        <div className="filter-bar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索姓名/手机号"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={fetchRiders}
            style={{ width: 240 }}
          />
          <Select
            placeholder="在线状态"
            allowClear
            value={isOnline}
            onChange={(val) => setIsOnline(val)}
            style={{ width: 120 }}
            options={[
              { label: '在线', value: true },
              { label: '离线', value: false },
            ]}
          />
          <Select
            placeholder="冻结状态"
            allowClear
            value={isFrozen}
            onChange={(val) => setIsFrozen(val)}
            style={{ width: 120 }}
            options={[
              { label: '已冻结', value: true },
              { label: '正常', value: false },
            ]}
          />
          <Button icon={<SearchOutlined />} type="primary" onClick={fetchRiders}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setIsOnline(undefined); setIsFrozen(undefined); fetchRiders(); }}>
            重置
          </Button>
        </div>
        <Table<Rider>
          columns={columns}
          dataSource={riders}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default RiderList;
