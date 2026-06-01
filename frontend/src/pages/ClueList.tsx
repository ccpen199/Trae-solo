import React, { useEffect, useState } from 'react';
import { Button, Table, Tag, Input, Select, Space, Row, Col, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { clueApi } from '../api';
import { STATUS_MAP, SOURCE_CHANNELS, CATEGORIES } from '../utils/constants';
import dayjs from 'dayjs';

const { Option } = Select;

const ClueList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    keyword: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.keyword) params.keyword = filters.keyword;
      
      const response = await clueApi.getList(params);
      setData(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.error || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '线索编号',
      dataIndex: 'clue_no',
      key: 'clue_no',
      width: 160,
      render: (text: string, record: any) => (
        <a onClick={() => navigate(`/clues/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '来源',
      dataIndex: 'source_channel',
      key: 'source_channel',
      width: 100
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      width: 120
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = STATUS_MAP[status] || { label: status, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      }
    },
    {
      title: '保密等级',
      dataIndex: 'security_level',
      key: 'security_level',
      width: 100,
      render: (level: number) => `${level}级`
    },
    {
      title: '创建人',
      dataIndex: 'creator_name',
      key: 'creator_name',
      width: 100
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>线索管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/clues/create')}>
          登记线索
        </Button>
      </div>

      <div className="table-container">
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Input
              placeholder="搜索标题/描述"
              prefix={<SearchOutlined />}
              value={filters.keyword}
              onChange={e => setFilters({ ...filters, keyword: e.target.value })}
              onPressEnter={loadData}
            />
          </Col>
          <Col span={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="状态筛选"
              value={filters.status || undefined}
              onChange={value => setFilters({ ...filters, status: value })}
              allowClear
            >
              {Object.entries(STATUS_MAP).map(([key, val]) => (
                <Option key={key} value={key}>{val.label}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="类别筛选"
              value={filters.category || undefined}
              onChange={value => setFilters({ ...filters, category: value })}
              allowClear
            >
              {CATEGORIES.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Space>
              <Button onClick={loadData}>查询</Button>
              <Button onClick={() => setFilters({ status: '', category: '', keyword: '' })}>重置</Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/clues/${record.id}`),
            style: { cursor: 'pointer' }
          })}
        />
      </div>
    </div>
  );
};

export default ClueList;
