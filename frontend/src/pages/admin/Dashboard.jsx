import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Modal, Select, message, Tabs } from 'antd';
import { UserOutlined, FileTextOutlined, IdcardOutlined, AppstoreOutlined, WarningOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import api from '../../utils/api';

const { Option } = Select;

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [applications, setApplications] = useState([]);
  const [overdueWarning, setOverdueWarning] = useState(null);
  const [badReviews, setBadReviews] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [handleModalVisible, setHandleModalVisible] = useState(false);

  useEffect(() => {
    loadDashboard();
    loadApplications();
    loadOverdueWarning();
    loadBadReviews();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await api.get('/admin/dashboard');
      setDashboard(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadApplications = async () => {
    try {
      const data = await api.get('/admin/applications');
      setApplications(data.list || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadOverdueWarning = async () => {
    try {
      const data = await api.get('/admin/overdue-warning');
      setOverdueWarning(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBadReviews = async () => {
    try {
      const data = await api.get('/admin/bad-review');
      setBadReviews(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (id, status, stepNo) => {
    try {
      await api.put(`/admin/applications/${id}/status`, { status, stepNo, remark: '管理员办理' });
      message.success('操作成功');
      setHandleModalVisible(false);
      loadApplications();
      loadDashboard();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const statusColumns = [
    { title: '申请编号', dataIndex: 'application_no', key: 'application_no' },
    { title: '服务名称', dataIndex: 'service_name', key: 'service_name' },
    { title: '申请人', dataIndex: 'user_name', key: 'user_name' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status) => {
      const colorMap = { submitted: 'processing', processing: 'processing', completed: 'success', rejected: 'error' };
      return <Tag color={colorMap[status]}>{status}</Tag>;
    }},
    { title: '提交时间', dataIndex: 'created_at', key: 'created_at' },
    { title: '操作', key: 'action', render: (_, record) => (
      <Button type="link" onClick={() => {
        setSelectedApplication(record);
        setHandleModalVisible(true);
      }}>办理</Button>
    )}
  ];

  const chartOption = {
    title: { text: '办件趋势' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
    yAxis: { type: 'value' },
    series: [
      { name: '办件量', type: 'line', data: [120, 200, 150, 80, 70, 110, 130] },
      { name: '办结量', type: 'line', data: [100, 180, 140, 70, 60, 90, 120] }
    ]
  };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="用户总数"
              value={dashboard?.statistics?.userCount || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="证照总数"
              value={dashboard?.statistics?.certCount || 0}
              prefix={<IdcardOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="办件总数"
              value={dashboard?.statistics?.applicationCount || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="服务事项"
              value={dashboard?.statistics?.serviceCount || 0}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={16}>
          <Card>
            <ReactECharts option={chartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="办件质量">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="待处理"
                  value={dashboard?.statistics?.pendingApplications || 0}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="今日办结"
                  value={dashboard?.statistics?.completedToday || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={24}>
                <Statistic
                  title="平均满意度"
                  value={dashboard?.statistics?.avgRating || 0}
                  suffix="/ 5"
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card
            title={
              <span>
                <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                超时预警
                {overdueWarning?.count > 0 && <Tag color="red" style={{ marginLeft: 8 }}>{overdueWarning?.count}</Tag>}
              </span>
            }
          >
            {overdueWarning?.overdue?.slice(0, 5).map((item) => (
              <div key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.service_name}</span>
                  <Tag color="red">已超 {Math.round(item.days_passed)} 天</Tag>
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>{item.application_no} - {item.user_name}</div>
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={
              <span>
                <WarningOutlined style={{ color: '#f5222d', marginRight: 8 }} />
                差评整改
                {badReviews?.count > 0 && <Tag color="red" style={{ marginLeft: 8 }}>{badReviews?.count}</Tag>}
              </span>
            }
          >
            {badReviews?.badReviews?.slice(0, 5).map((item) => (
              <div key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.service_name}</span>
                  <Tag color="red">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</Tag>
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>{item.feedback || '无评价内容'}</div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      <Card title="办件列表">
        <Table
          columns={statusColumns}
          dataSource={applications}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="办理业务"
        open={handleModalVisible}
        onCancel={() => setHandleModalVisible(false)}
        footer={null}
      >
        {selectedApplication && (
          <div>
            <p>申请编号：{selectedApplication.application_no}</p>
            <p>服务名称：{selectedApplication.service_name}</p>
            <p>申请人：{selectedApplication.user_name}</p>
            <div style={{ marginTop: 16 }}>
              <Select
                placeholder="选择操作"
                style={{ width: '100%' }}
                onChange={(value) => {
                  const [status, stepNo] = value.split('-');
                  handleStatusChange(selectedApplication.id, status, parseInt(stepNo));
                }}
              >
                <Option value="processing-2">材料审核通过</Option>
                <Option value="completed-4">办结</Option>
                <Option value="rejected-2">驳回</Option>
              </Select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminDashboard;
