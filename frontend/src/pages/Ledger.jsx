import React, { useState, useEffect } from 'react';
import { Table, Card, Select, DatePicker, Form, Button, message, Tag, Modal, Descriptions } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { ledgerApi, usersApi } from '../utils/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

function Ledger() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 20,
    action_type: '',
    status: '',
    operator_id: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadUsers();
    loadData();
  }, [filters]);

  const loadUsers = async () => {
    try {
      const res = await usersApi.getList();
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await ledgerApi.getList(filters);
      setData(res.data.list);
      setTotal(res.data.total);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const showDetail = async (id) => {
    try {
      const res = await ledgerApi.getDetail(id);
      setDetailData(res.data);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('加载详情失败');
    }
  };

  const actionTypeOptions = [
    { value: 'create', label: '创建' },
    { value: 'upload', label: '上传' },
    { value: 'parse', label: '解析' },
    { value: 'match', label: '匹配' },
    { value: 'generate', label: '生成' },
    { value: 'review', label: '审核' },
    { value: 'export', label: '导出' },
    { value: 'update', label: '更新' }
  ];

  const columns = [
    { title: '操作类型', dataIndex: 'action_type', width: 100,
      render: (v) => actionTypeOptions.find(o => o.value === v)?.label || v
    },
    { title: '操作详情', dataIndex: 'action_detail' },
    { title: '状态', dataIndex: 'status', width: 100,
      render: (v) => (
        <Tag color={v === 'success' ? 'green' : v === 'failed' ? 'red' : 'orange'}>{v}</Tag>
      )
    },
    { title: '标书', dataIndex: 'project_name', width: 200,
      render: (v, record) => v || record.bid_no || '-'
    },
    { title: '操作人', dataIndex: 'operator_name', width: 100 },
    { title: '负责人', dataIndex: 'owner_name', width: 100 },
    { title: '规则版本', dataIndex: 'rule_version', width: 100 },
    { title: '异常原因', dataIndex: 'exception_reason', width: 150 },
    { title: '操作时间', dataIndex: 'created_at', width: 170,
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm')
    },
    { title: '操作', width: 80,
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => showDetail(record.id)}>详情</Button>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">业务台账</h1>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Form.Item label="操作类型">
            <Select 
              style={{ width: 120 }} 
              allowClear 
              placeholder="全部"
              onChange={(v) => setFilters({ ...filters, action_type: v, page: 1 })}
            >
              {actionTypeOptions.map(o => (
                <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="状态">
            <Select 
              style={{ width: 120 }} 
              allowClear 
              placeholder="全部"
              onChange={(v) => setFilters({ ...filters, status: v, page: 1 })}
            >
              <Select.Option value="success">成功</Select.Option>
              <Select.Option value="failed">失败</Select.Option>
              <Select.Option value="warning">警告</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="操作人">
            <Select 
              style={{ width: 120 }} 
              allowClear 
              placeholder="全部"
              onChange={(v) => setFilters({ ...filters, operator_id: v, page: 1 })}
            >
              {users.map(u => (
                <Select.Option key={u.id} value={u.id}>{u.real_name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="时间">
            <RangePicker 
              onChange={(dates) => setFilters({ 
                ...filters, 
                start_date: dates?.[0]?.format('YYYY-MM-DD') || '', 
                end_date: dates?.[1]?.format('YYYY-MM-DD') || '',
                page: 1 
              })}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SearchOutlined />} onClick={loadData}>搜索</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Table
          loading={loading}
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            current: filters.page,
            pageSize: filters.pageSize,
            total,
            onChange: (page, pageSize) => setFilters({ ...filters, page, pageSize })
          }}
        />
      </Card>

      <Modal
        title="台账详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {detailData && (
          <div>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="操作类型" span={2}>
                {actionTypeOptions.find(o => o.value === detailData.action_type)?.label || detailData.action_type}
              </Descriptions.Item>
              <Descriptions.Item label="操作详情" span={2}>{detailData.action_detail || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={detailData.status === 'success' ? 'green' : detailData.status === 'failed' ? 'red' : 'orange'}>
                  {detailData.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="操作时间">{dayjs(detailData.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="标书">{detailData.project_name || detailData.bid_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="规则版本">{detailData.rule_version || '-'}</Descriptions.Item>
              <Descriptions.Item label="操作人">{detailData.operator_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="负责人">{detailData.owner_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="异常原因" span={2}>{detailData.exception_reason || '-'}</Descriptions.Item>
            </Descriptions>
            {detailData.metadata && (
              <div style={{ marginTop: 16 }}>
                <h4>附加数据</h4>
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, fontSize: 12 }}>
                  {JSON.stringify(detailData.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Ledger;
