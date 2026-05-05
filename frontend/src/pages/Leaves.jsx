import React, { useState, useEffect } from 'react';
import {
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Spin,
  Empty,
  Popconfirm,
  message,
  Tabs
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { leaveApi } from '../services/api';
import { useUserStore } from '../store/userStore';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const getStatusTag = (status) => {
  const statusMap = {
    PENDING: { text: '待审批', color: 'orange' },
    APPROVED: { text: '已通过', color: 'green' },
    REJECTED: { text: '已拒绝', color: 'red' },
    COMPLETED: { text: '已销假', color: 'blue' },
    CANCELLED: { text: '已取消', color: 'default' },
    DRAFT: { text: '草稿', color: 'default' },
    EXTENDING: { text: '续假中', color: 'gold' }
  };
  const config = statusMap[status] || { text: status, color: 'default' };
  return <Tag color={config.color}>{config.text}</Tag>;
};

const getTypeText = (type) => {
  const typeMap = {
    PERSONAL: '事假',
    SICK: '病假',
    BUSINESS: '公差',
    OTHER: '其他'
  };
  return typeMap[type] || type;
};

const Leaves = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [activeTab, setActiveTab] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [extendModalVisible, setExtendModalVisible] = useState(false);
  const [currentLeave, setCurrentLeave] = useState(null);
  const [form] = Form.useForm();
  const [extendForm] = Form.useForm();
  const { user, isTeacher } = useUserStore();
  const canApprove = isTeacher();

  const fetchData = async () => {
    setLoading(true);
    try {
      let result;
      if (activeTab === 'pending' && canApprove) {
        result = await leaveApi.getPending({ page, pageSize });
      } else {
        const params = { page, pageSize };
        if (activeTab !== 'all') {
          params.status = activeTab.toUpperCase();
        }
        result = await leaveApi.getList(params);
      }
      setData(result.data.list);
      setTotal(result.data.total);
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, activeTab]);

  const handleCreate = () => {
    form.resetFields();
    setCurrentLeave(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    if (record.status !== 'PENDING' && record.status !== 'DRAFT') {
      message.warning('只有草稿或待审批状态的请假申请可以修改');
      return;
    }
    setCurrentLeave(record);
    form.setFieldsValue({
      ...record,
      dateRange: [dayjs(record.startTime), dayjs(record.endTime)]
    });
    setModalVisible(true);
  };

  const handleDetail = (record) => {
    setCurrentLeave(record);
    setDetailVisible(true);
  };

  const handleCancel = async (id) => {
    try {
      await leaveApi.cancel(id);
      message.success('取消成功');
      fetchData();
    } catch (error) {
      console.error('Failed to cancel:', error);
    }
  };

  const handleExtend = (record) => {
    if (record.status !== 'APPROVED') {
      message.warning('只有已审批通过的请假申请可以续假');
      return;
    }
    setCurrentLeave(record);
    extendForm.resetFields();
    setExtendModalVisible(true);
  };

  const handleApprove = async (record) => {
    try {
      await leaveApi.approve(record.id, {});
      message.success('审批通过');
      fetchData();
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async (record) => {
    try {
      await leaveApi.reject(record.id, {});
      message.success('已拒绝');
      fetchData();
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  const handleCheckIn = async (record) => {
    try {
      await leaveApi.checkIn(record.id);
      message.success('销假成功');
      fetchData();
    } catch (error) {
      console.error('Failed to check in:', error);
    }
  };

  const handleSubmit = async (values) => {
    const { dateRange, leaveType, reason, attachmentUrl } = values;
    const [startTime, endTime] = dateRange;

    const data = {
      leaveType: leaveType || 'PERSONAL',
      reason,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      attachmentUrl
    };

    try {
      if (currentLeave) {
        await leaveApi.update(currentLeave.id, data);
        message.success('更新成功');
      } else {
        await leaveApi.create(data);
        message.success('提交成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('Failed to submit:', error);
    }
  };

  const handleExtendSubmit = async (values) => {
    const { dateRange, reason } = values;
    const [startTime, endTime] = dateRange;

    try {
      await leaveApi.extend(currentLeave.id, {
        reason: reason || '续假申请',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });
      message.success('续假申请已提交');
      setExtendModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('Failed to extend:', error);
    }
  };

  const columns = [
    {
      title: '申请人',
      dataIndex: ['applicant', 'name'],
      key: 'applicant',
      render: (text, record) => text || user?.name
    },
    {
      title: '请假类型',
      dataIndex: 'leaveType',
      key: 'leaveType',
      render: getTypeText
    },
    {
      title: '请假原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true
    },
    {
      title: '请假时间',
      key: 'time',
      render: (_, record) => (
        <div>
          <div>{dayjs(record.startTime).format('YYYY-MM-DD HH:mm')}</div>
          <div>至 {dayjs(record.endTime).format('YYYY-MM-DD HH:mm')}</div>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>共 {record.days} 天</div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag
    },
    {
      title: '审批人',
      dataIndex: ['approver', 'name'],
      key: 'approver',
      render: (text) => text || '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>
            查看
          </Button>
          {(record.status === 'PENDING' || record.status === 'DRAFT') && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {(record.status === 'PENDING' || record.status === 'EXTENDING') && (
            <Popconfirm
              title="确定要取消吗？"
              onConfirm={() => handleCancel(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger>
                取消
              </Button>
            </Popconfirm>
          )}
          {record.status === 'APPROVED' && (
            <>
              <Button type="link" size="small" onClick={() => handleExtend(record)}>
                续假
              </Button>
              {canApprove && (
                <Button type="link" size="small" onClick={() => handleCheckIn(record)}>
                  销假
                </Button>
              )}
            </>
          )}
          {canApprove && (record.status === 'PENDING' || record.status === 'EXTENDING') && (
            <>
              <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleApprove(record)}>
                通过
              </Button>
              <Button type="link" size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleReject(record)}>
                拒绝
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  const tabItems = canApprove
    ? [
        { key: 'all', label: '全部' },
        { key: 'pending', label: '待审批' },
        { key: 'approved', label: '已通过' },
        { key: 'rejected', label: '已拒绝' }
      ]
    : [
        { key: 'all', label: '全部' },
        { key: 'pending', label: '待审批' },
        { key: 'approved', label: '已通过' },
        { key: 'rejected', label: '已拒绝' }
      ];

  return (
    <div>
      <div className="page-header">
        <h2>请假审批</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          申请请假
        </Button>
      </div>

      <div className="table-container">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : data.length > 0 ? (
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={{
              current: page,
              pageSize,
              total,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (p) => setPage(p)
            }}
          />
        ) : (
          <Empty description="暂无请假记录" />
        )}
      </div>

      <Modal
        title={currentLeave ? '编辑请假申请' : '申请请假'}
        open={modalVisible}
        width={600}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="form-modal"
        >
          <Form.Item
            name="leaveType"
            label="请假类型"
            rules={[{ required: true, message: '请选择请假类型' }]}
          >
            <Select placeholder="请选择请假类型">
              <Option value="PERSONAL">事假</Option>
              <Option value="SICK">病假</Option>
              <Option value="BUSINESS">公差</Option>
              <Option value="OTHER">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="请假时间"
            rules={[{ required: true, message: '请选择请假时间' }]}
          >
            <RangePicker
              showTime
              style={{ width: '100%' }}
              format="YYYY-MM-DD HH:mm"
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="请假原因"
            rules={[{ required: true, message: '请输入请假原因' }]}
          >
            <TextArea rows={4} placeholder="请输入请假原因" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {currentLeave ? '更新' : '提交'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="续假申请"
        open={extendModalVisible}
        width={600}
        onCancel={() => setExtendModalVisible(false)}
        footer={null}
      >
        <Form
          form={extendForm}
          layout="vertical"
          onFinish={handleExtendSubmit}
          className="form-modal"
        >
          <Form.Item
            name="dateRange"
            label="续假时间"
            rules={[{ required: true, message: '请选择续假时间' }]}
          >
            <RangePicker
              showTime
              style={{ width: '100%' }}
              format="YYYY-MM-DD HH:mm"
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>

          <Form.Item name="reason" label="续假原因">
            <TextArea rows={3} placeholder="请输入续假原因（选填）" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setExtendModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                提交续假
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="请假详情"
        open={detailVisible}
        width={600}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        ]}
      >
        {currentLeave && (
          <div>
            <table style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 0', color: '#8c8c8c', width: 100 }}>申请人：</td>
                  <td style={{ padding: '8px 0' }}>{currentLeave.applicant?.name}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#8c8c8c' }}>请假类型：</td>
                  <td style={{ padding: '8px 0' }}>{getTypeText(currentLeave.leaveType)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#8c8c8c' }}>状态：</td>
                  <td style={{ padding: '8px 0' }}>{getStatusTag(currentLeave.status)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#8c8c8c' }}>开始时间：</td>
                  <td style={{ padding: '8px 0' }}>
                    {dayjs(currentLeave.startTime).format('YYYY-MM-DD HH:mm')}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#8c8c8c' }}>结束时间：</td>
                  <td style={{ padding: '8px 0' }}>
                    {dayjs(currentLeave.endTime).format('YYYY-MM-DD HH:mm')}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#8c8c8c' }}>请假天数：</td>
                  <td style={{ padding: '8px 0' }}>{currentLeave.days} 天</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#8c8c8c' }}>审批人：</td>
                  <td style={{ padding: '8px 0' }}>{currentLeave.approver?.name || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#8c8c8c' }}>审批意见：</td>
                  <td style={{ padding: '8px 0' }}>{currentLeave.approvalComment || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#8c8c8c' }}>销假时间：</td>
                  <td style={{ padding: '8px 0' }}>
                    {currentLeave.checkInTime 
                      ? dayjs(currentLeave.checkInTime).format('YYYY-MM-DD HH:mm') 
                      : '-'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#8c8c8c', verticalAlign: 'top' }}>请假原因：</td>
                  <td style={{ padding: '8px 0' }}>{currentLeave.reason}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Leaves;
