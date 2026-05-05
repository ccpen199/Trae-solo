import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Radio, 
  Table, 
  Tag, 
  message,
  Space,
  Descriptions,
  Modal
} from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import * as api from '../services/api';

const { Search } = Input;

const STATUS_MAP = {
  active: { text: '正常', color: 'success' },
  inactive: { text: '停用', color: 'default' },
  moved: { text: '已迁出', color: 'warning' },
  deleted: { text: '已注销', color: 'error' }
};

const GENDER_MAP = {
  male: '男',
  female: '女'
};

const HouseholdSearch = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [searchType, setSearchType] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      message.warning('请输入搜索关键词');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      const response = await api.searchHouseholds({
        keyword: keyword.trim(),
        type: searchType
      });
      if (response.success) {
        setData(response.data.households);
        if (response.data.households.length === 0) {
          message.info('未找到匹配的户籍信息');
        }
      }
    } catch (error) {
      console.error('搜索失败:', error);
      message.error('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (text, record) => (
        <a onClick={() => {
          setSelectedRecord(record);
          setDetailVisible(true);
        }}>
          {text}
        </a>
      )
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 200
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (val) => GENDER_MAP[val] || val
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 60
    },
    {
      title: '现住址',
      dataIndex: 'currentAddress',
      key: 'currentAddress'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val) => {
        const status = STATUS_MAP[val] || { text: val, color: 'default' };
        return <Tag color={status.color}>{status.text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedRecord(record);
            setDetailVisible(true);
          }}
        >
          详情
        </Button>
      )
    }
  ];

  return (
    <div>
      <Card title="户籍查询">
        <Form layout="inline" style={{ marginBottom: 24 }}>
          <Form.Item label="搜索类型">
            <Radio.Group value={searchType} onChange={(e) => setSearchType(e.target.value)}>
              <Radio value="all">全部</Radio>
              <Radio value="name">按姓名</Radio>
              <Radio value="idCard">按身份证号</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item>
            <Search
              placeholder="请输入姓名或身份证号"
              allowClear
              enterButton={<><SearchOutlined /> 搜索</>}
              size="large"
              style={{ width: 400 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={handleSearch}
            />
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{
            emptyText: hasSearched ? '未找到匹配的户籍信息' : '请输入关键词进行搜索'
          }}
        />
      </Card>

      <Modal
        title="户籍详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {selectedRecord && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="姓名">{selectedRecord.name}</Descriptions.Item>
            <Descriptions.Item label="身份证号">{selectedRecord.idCard}</Descriptions.Item>
            <Descriptions.Item label="性别">{GENDER_MAP[selectedRecord.gender]}</Descriptions.Item>
            <Descriptions.Item label="年龄">{selectedRecord.age}</Descriptions.Item>
            <Descriptions.Item label="民族">{selectedRecord.ethnicity || '-'}</Descriptions.Item>
            <Descriptions.Item label="学历">{selectedRecord.education || '-'}</Descriptions.Item>
            <Descriptions.Item label="职业">{selectedRecord.occupation || '-'}</Descriptions.Item>
            <Descriptions.Item label="婚姻状况">{selectedRecord.maritalStatus || '-'}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{selectedRecord.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="户口类型">{selectedRecord.householdType || '-'}</Descriptions.Item>
            <Descriptions.Item label="现住址" span={2}>{selectedRecord.currentAddress}</Descriptions.Item>
            <Descriptions.Item label="户籍地址" span={2}>{selectedRecord.householdAddress}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={STATUS_MAP[selectedRecord.status]?.color || 'default'}>
                {STATUS_MAP[selectedRecord.status]?.text || selectedRecord.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{selectedRecord.createdAt}</Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{selectedRecord.note || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default HouseholdSearch;
