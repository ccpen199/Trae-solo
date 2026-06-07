import React, { useState, useEffect } from 'react';
import { Table, Tag, Card, Button, Select, message, Modal, Timeline } from 'antd';
import { policyAPI } from '../../services/api';

const { Option } = Select;

function MyApplications() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentApplication, setCurrentApplication] = useState(null);

  useEffect(() => {
    loadData();
  }, [page, status]);

  const loadData = async () => {
    try {
      const res = await policyAPI.getMyApplications({ page, pageSize: 10, status });
      setData(res.data.list);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (id) => {
    try {
      await policyAPI.cancelApplication(id);
      message.success('取消成功');
      loadData();
    } catch (err) {
      message.error('取消失败');
    }
  };

  const viewDetail = async (id) => {
    try {
      const res = await policyAPI.getApplicationDetail(id);
      setCurrentApplication(res.data);
      setDetailVisible(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    const map = {
      submitted: 'blue',
      reviewing: 'orange',
      approved: 'green',
      paid: 'green',
      rejected: 'red',
      cancelled: 'default'
    };
    return map[status] || 'default';
  };

  const getStatusText = (status) => {
    const map = {
      submitted: '已提交',
      reviewing: '审核中',
      approved: '已通过',
      paid: '已兑付',
      rejected: '已拒绝',
      cancelled: '已取消'
    };
    return map[status] || status;
  };

  const columns = [
    { title: '政策名称', dataIndex: 'policy_title', key: 'title' },
    { 
      title: '申报企业', 
      dataIndex: 'enterprise_name', 
      key: 'enterprise' 
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: status => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
    },
    { title: '当前阶段', dataIndex: 'current_stage', key: 'stage' },
    { title: '提交时间', dataIndex: 'submitted_at', key: 'time' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <span>
          <Button type="link" onClick={() => viewDetail(record.id)}>
            查看进度
          </Button>
          {record.status === 'submitted' && (
            <Button type="link" danger onClick={() => handleCancel(record.id)}>
              取消
            </Button>
          )}
        </span>
      )
    }
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Select
            placeholder="状态筛选"
            style={{ width: 150 }}
            allowClear
            onChange={setStatus}
          >
            <Option value="submitted">已提交</Option>
            <Option value="reviewing">审核中</Option>
            <Option value="approved">已通过</Option>
            <Option value="paid">已兑付</Option>
            <Option value="rejected">已拒绝</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            total,
            current: page,
            onChange: setPage
          }}
        />
      </Card>

      <Modal
        title="申报进度详情"
        open={detailVisible}
        width={600}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>
        ]}
      >
        {currentApplication && (
          <div>
            <Card type="inner" title="基本信息" style={{ marginBottom: 16 }}>
              <p><strong>政策名称：</strong>{currentApplication.policy_title}</p>
              <p><strong>申报企业：</strong>{currentApplication.enterprise_name}</p>
              <p><strong>统一社会信用代码：</strong>{currentApplication.unified_credit_code}</p>
              <p><strong>当前状态：</strong>
                <Tag color={getStatusColor(currentApplication.status)}>
                  {getStatusText(currentApplication.status)}
                </Tag>
              </p>
            </Card>

            <Card type="inner" title="办理进度">
              <Timeline>
                {currentApplication.logs?.map(log => (
                  <Timeline.Item key={log.id}>
                    <p><strong>{log.stage}</strong> - {log.status}</p>
                    <p style={{ color: '#999', fontSize: 12 }}>{log.created_at}</p>
                    {log.remark && <p>{log.remark}</p>}
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default MyApplications;
