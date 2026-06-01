import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Select, message } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getLogs } from '../utils/api.js';

const { Option } = Select;

const moduleLabels = {
  policy: '保单管理',
  report: '出险报案',
  survey: '查勘定损',
  claim: '理赔审核'
};

const actionLabels = {
  create: '创建',
  update: '更新',
  pay: '支付',
  approve: '审批通过',
  reject: '拒赔'
};

function Logs() {
  const [module, setModule] = useState(null);
  const [operator, setOperator] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize
      };
      if (module) {
        params.module = module;
      }
      if (operator) {
        params.operator = operator;
      }
      const res = await getLogs(params);
      setData(res.data.data || res.data || []);
      setPagination((prev) => ({
        ...prev,
        total: res.data.total || res.data.data?.length || 0
      }));
    } catch (e) {
      console.error('Load logs failed:', e);
      message.error('加载日志失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadData();
  };

  const handleReset = () => {
    setModule(null);
    setOperator(null);
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadData();
  };

  const handleTableChange = (pag) => {
    setPagination({
      current: pag.current,
      pageSize: pag.pageSize,
      total: pag.total
    });
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作人',
      dataIndex: 'operator_name',
      key: 'operator_name',
      width: 120
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (m) => moduleLabels[m] || m
    },
    {
      title: '动作',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (a) => actionLabels[a] || a
    },
    {
      title: '记录ID',
      dataIndex: 'record_id',
      key: 'record_id',
      width: 100
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 140
    }
  ];

  return (
    <div>
      <div className="page-title">操作日志</div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="选择模块"
            value={module}
            onChange={setModule}
            style={{ width: 160 }}
            allowClear
          >
            {Object.entries(moduleLabels).map(([key, label]) => (
              <Option key={key} value={key}>{label}</Option>
            ))}
          </Select>
          <Select
            placeholder="选择操作人"
            value={operator}
            onChange={setOperator}
            style={{ width: 160 }}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            <Option value="admin">admin</Option>
            <Option value="operator">operator</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>
            查询
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}

export default Logs;
