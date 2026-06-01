import React, { useState, useEffect } from 'react';
import { Table, Card, Select, Form, Button, message, Tag, Modal, Descriptions, Input, Row, Col, Statistic } from 'antd';
import { SearchOutlined, EyeOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { exceptionsApi } from '../utils/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

function Exceptions() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ pending: 0, resolved: 0 });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 20,
    operation: '',
    error_type: '',
    status: ''
  });

  useEffect(() => {
    loadStats();
    loadData();
  }, [filters]);

  const loadStats = async () => {
    try {
      const res = await exceptionsApi.getStats();
      setStats(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await exceptionsApi.getList(filters);
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
      const res = await exceptionsApi.getDetail(id);
      setDetailData(res.data);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('加载详情失败');
    }
  };

  const showResolve = (record) => {
    setDetailData(record);
    setResolveModalVisible(true);
  };

  const handleResolve = async (values) => {
    try {
      await exceptionsApi.resolve(detailData.id, values);
      message.success('处理完成');
      setResolveModalVisible(false);
      loadData();
      loadStats();
    } catch (error) {
      message.error('处理失败');
    }
  };

  const errorTypeOptions = [
    { value: 'pdf_parse_failure', label: 'PDF解析失败' },
    { value: 'version_conflict', label: '版本冲突' },
    { value: 'missing_answers', label: '评分项漏答' },
    { value: 'database', label: '数据库错误' },
    { value: 'upload', label: '上传错误' },
    { value: 'network', label: '网络错误' }
  ];

  const columns = [
    { title: '操作', dataIndex: 'operation', width: 120 },
    { title: '错误类型', dataIndex: 'error_type', width: 150,
      render: (v) => errorTypeOptions.find(o => o.value === v)?.label || v
    },
    { title: '错误信息', dataIndex: 'error_message' },
    { title: '标书', dataIndex: 'project_name', width: 180,
      render: (v, r) => v || r.bid_no || '-'
    },
    { title: '操作人', dataIndex: 'operator_name', width: 100 },
    { title: '状态', dataIndex: 'status', width: 100,
      render: (v) => (
        <Tag color={v === 'resolved' ? 'green' : 'orange'}>{v}</Tag>
      )
    },
    { title: '创建时间', dataIndex: 'created_at', width: 170,
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm')
    },
    { title: '操作', width: 150,
      render: (_, record) => (
        <div>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(record.id)}>详情</Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" onClick={() => showResolve(record)}>处理</Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">异常处理</h1>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card size="small">
            <Statistic 
              title="待处理异常" 
              value={stats.pending} 
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic 
              title="已处理" 
              value={stats.resolved}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Form.Item label="错误类型">
            <Select 
              style={{ width: 150 }} 
              allowClear 
              placeholder="全部"
              onChange={(v) => setFilters({ ...filters, error_type: v, page: 1 })}
            >
              {errorTypeOptions.map(o => (
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
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="resolved">已处理</Select.Option>
            </Select>
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
        title="异常详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {detailData && (
          <div>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="操作" span={2}>{detailData.operation}</Descriptions.Item>
              <Descriptions.Item label="错误类型">
                {errorTypeOptions.find(o => o.value === detailData.error_type)?.label || detailData.error_type}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={detailData.status === 'resolved' ? 'green' : 'orange'}>{detailData.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="标书" span={2}>{detailData.project_name || detailData.bid_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="操作人">{detailData.operator_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(detailData.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="错误信息" span={2}>{detailData.error_message || '-'}</Descriptions.Item>
              <Descriptions.Item label="补偿动作" span={2}>{detailData.compensation_action || '-'}</Descriptions.Item>
              <Descriptions.Item label="人工备注" span={2}>{detailData.manual_remark || '-'}</Descriptions.Item>
            </Descriptions>
            {detailData.request_data && (
              <div style={{ marginTop: 16 }}>
                <h4>原始请求</h4>
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, fontSize: 12, maxHeight: 200, overflow: 'auto' }}>
                  {JSON.stringify(detailData.request_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="处理异常"
        open={resolveModalVisible}
        onCancel={() => setResolveModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleResolve}>
          <Form.Item label="补偿动作" name="compensation_action">
            <TextArea rows={3} placeholder="描述采取的补偿动作" />
          </Form.Item>
          <Form.Item label="人工备注" name="manual_remark">
            <TextArea rows={3} placeholder="记录处理备注" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认处理</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Exceptions;
