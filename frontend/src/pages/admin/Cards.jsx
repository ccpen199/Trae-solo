import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Select, Button, Space, Tag, Modal, Descriptions, message, Spin, Popconfirm } from 'antd';
import { SearchOutlined, EyeOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { getCards, updateCardStatus } from '../../api/admin';

const { Option } = Select;

const Cards = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [detailModal, setDetailModal] = useState(false);
  const [cardDetail, setCardDetail] = useState(null);

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize]);

  const loadData = async (overrides = {}) => {
    const nextPagination = overrides.pagination || pagination;
    const nextSearchText = overrides.searchText ?? searchText;
    const nextStatusFilter = overrides.statusFilter ?? statusFilter;
    const nextTypeFilter = overrides.typeFilter ?? typeFilter;
    const nextRegionFilter = overrides.regionFilter ?? regionFilter;
    try {
      setLoading(true);
      const res = await getCards({
        page: nextPagination.current,
        page_size: nextPagination.pageSize,
        keyword: nextSearchText,
        status: nextStatusFilter,
        card_type: nextTypeFilter,
        region: nextRegionFilter
      });
      setData((res?.list || []).map((card) => ({
        ...card,
        card_number: card.card_no,
        user_name: card.real_name || card.phone || '-',
        user_phone: card.phone,
        status: card.card_status,
      })));
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
    setTypeFilter('');
    setRegionFilter('');
    setPagination(nextPagination);
    loadData({
      pagination: nextPagination,
      searchText: '',
      statusFilter: '',
      typeFilter: '',
      regionFilter: ''
    });
  };

  const handleViewDetail = (record) => {
    setCardDetail(record);
    setDetailModal(true);
  };

  const handleFreeze = async (id) => {
    try {
      await updateCardStatus(id, { card_status: 'frozen' });
      message.success('卡片已冻结');
      loadData();
    } catch (err) {
      console.error(err);
      message.error('操作失败');
    }
  };

  const handleUnfreeze = async (id) => {
    try {
      await updateCardStatus(id, { card_status: 'active' });
      message.success('卡片已解冻');
      loadData();
    } catch (err) {
      console.error(err);
      message.error('操作失败');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      active: { color: 'green', text: '正常' },
      frozen: { color: 'orange', text: '冻结' },
      expired: { color: 'red', text: '过期' },
      lost: { color: 'default', text: '挂失' },
      cancelled: { color: 'default', text: '注销' }
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getTypeTag = (type) => {
    const typeMap = {
      normal: { color: 'blue', text: '普通卡' },
      student: { color: 'green', text: '学生卡' },
      elderly: { color: 'orange', text: '老年卡' },
      disabled: { color: 'purple', text: '爱心卡' },
      employee: { color: 'gold', text: '员工卡' }
    };
    const config = typeMap[type] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '卡号',
      dataIndex: 'card_number',
      key: 'card_number',
      width: 180
    },
    {
      title: '持卡人',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 120
    },
    {
      title: '手机号',
      dataIndex: 'user_phone',
      key: 'user_phone',
      width: 130
    },
    {
      title: '卡类型',
      dataIndex: 'card_type',
      key: 'card_type',
      width: 100,
      render: (type) => getTypeTag(type)
    },
    {
      title: '余额（元）',
      dataIndex: 'balance',
      key: 'balance',
      width: 110,
      render: (balance) => `¥ ${balance?.toFixed(2) || '0.00'}`
    },
    {
      title: '所在区域',
      dataIndex: 'region',
      key: 'region',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status)
    },
    {
      title: '办理时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'active' ? (
            <Popconfirm
              title="确定要冻结该卡片吗？"
              onConfirm={() => handleFreeze(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger icon={<LockOutlined />}>冻结</Button>
            </Popconfirm>
          ) : record.status === 'frozen' ? (
            <Popconfirm
              title="确定要解冻该卡片吗？"
              onConfirm={() => handleUnfreeze(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" icon={<UnlockOutlined />}>解冻</Button>
            </Popconfirm>
          ) : null}
        </Space>
      )
    }
  ];

  return (
    <div className="admin-cards">
      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索卡号/持卡人/手机号"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="卡状态"
            value={statusFilter || undefined}
            onChange={(value) => setStatusFilter(value)}
            style={{ width: 140 }}
            allowClear
          >
            <Option value="active">正常</Option>
            <Option value="frozen">冻结</Option>
            <Option value="expired">过期</Option>
            <Option value="lost">挂失</Option>
            <Option value="cancelled">注销</Option>
          </Select>
          <Select
            placeholder="卡类型"
            value={typeFilter || undefined}
            onChange={(value) => setTypeFilter(value)}
            style={{ width: 140 }}
            allowClear
          >
            <Option value="normal">普通卡</Option>
            <Option value="student">学生卡</Option>
            <Option value="elderly">老年卡</Option>
            <Option value="disabled">爱心卡</Option>
            <Option value="employee">员工卡</Option>
          </Select>
          <Select
            placeholder="区域"
            value={regionFilter || undefined}
            onChange={(value) => setRegionFilter(value)}
            style={{ width: 140 }}
            allowClear
          >
            <Option value="锦江区">锦江区</Option>
            <Option value="青羊区">青羊区</Option>
            <Option value="金牛区">金牛区</Option>
            <Option value="武侯区">武侯区</Option>
            <Option value="成华区">成华区</Option>
            <Option value="龙泉驿区">龙泉驿区</Option>
            <Option value="青白江区">青白江区</Option>
            <Option value="新都区">新都区</Option>
            <Option value="温江区">温江区</Option>
            <Option value="双流区">双流区</Option>
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
            scroll={{ x: 1300 }}
          />
        </Spin>
      </Card>

      <Modal
        title="卡片详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={700}
      >
        {cardDetail && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="卡号">{cardDetail.card_number}</Descriptions.Item>
            <Descriptions.Item label="卡类型">{getTypeTag(cardDetail.card_type)}</Descriptions.Item>
            <Descriptions.Item label="持卡人">{cardDetail.user_name}</Descriptions.Item>
            <Descriptions.Item label="手机号">{cardDetail.user_phone}</Descriptions.Item>
            <Descriptions.Item label="身份证号">{cardDetail.id_card || '-'}</Descriptions.Item>
            <Descriptions.Item label="当前余额">¥ {cardDetail.balance?.toFixed(2) || '0.00'}</Descriptions.Item>
            <Descriptions.Item label="所在区域">{cardDetail.region || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">{getStatusTag(cardDetail.status)}</Descriptions.Item>
            <Descriptions.Item label="办理时间">{cardDetail.created_at}</Descriptions.Item>
            <Descriptions.Item label="到期时间">{cardDetail.expiry_date || '长期有效'}</Descriptions.Item>
            <Descriptions.Item label="累计消费" span={2}>
              ¥ {cardDetail.balance?.toFixed(2) || '0.00'}
            </Descriptions.Item>
            <Descriptions.Item label="累计乘车次数" span={2}>
              {cardDetail.times_count || 0} 次
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Cards;
