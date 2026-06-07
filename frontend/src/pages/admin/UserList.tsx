import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Spin, message, Tag, Select, Input, Form, Modal, Typography, Descriptions, Divider, Alert, List, Empty, Tabs, Timeline, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined, CheckOutlined, CloseOutlined, LockOutlined, UnlockOutlined, HistoryOutlined, ExclamationCircleOutlined, InfoCircleOutlined, EyeOutlined, FileTextOutlined, ClockCircleOutlined, SafetyOutlined } from '@ant-design/icons';
import { api } from '../../api';
import type { ColumnsType } from 'antd/es/table';

interface StatusChangeRecord {
  id: number;
  userId: number;
  oldStatus: string;
  newStatus: string;
  reason?: string;
  operatorId?: number;
  operatorName?: string;
  ipAddress?: string;
  createdAt: string;
  permissionImpacts?: PermissionImpact[];
  [key: string]: any;
}

interface PermissionImpact {
  type: 'contract' | 'attendance' | 'payroll';
  name: string;
  action: string;
  description: string;
}

interface AdminUser {
  id: number;
  username: string;
  role: string;
  realName?: string;
  phone?: string;
  idCard?: string;
  status: string;
  createdAt: string;
  gender?: string;
  birthDate?: string;
  workYears?: number;
  skillLevel?: number;
  hasBiometricData?: number;
  biometricDeleted?: number;
  companyName?: string;
  unifiedCreditCode?: string;
  enterpriseVerificationStatus?: string;
  statusChangeRecords?: StatusChangeRecord[];
}

const { Option } = Select;
const { TextArea } = Input;
const { Text, Title } = Typography;
const { TabPane } = Tabs;

const UserList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [form] = Form.useForm();
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [verifyForm] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [statusHistory, setStatusHistory] = useState<StatusChangeRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('basic');

  const fetchUsers = async (params?: any) => {
    setLoading(true);
    try {
      const res = await api.admin.getUsers({
        page,
        pageSize,
        ...params
      });
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize]);

  const handleSearch = (values: any) => {
    setPage(1);
    fetchUsers(values);
  };

  const handleReset = () => {
    form.resetFields();
    setPage(1);
    fetchUsers();
  };

  const handleStatusChange = (record: AdminUser, status: string) => {
    setSelectedUser(record);
    setPendingStatus(status);
    statusForm.resetFields();
    setStatusModalVisible(true);
  };

  const handleStatusConfirm = async (values: any) => {
    if (!selectedUser) return;
    setStatusChangeLoading(true);
    try {
      await api.admin.updateUserStatus(selectedUser.id, pendingStatus, {
        reason: values.reason
      });
      message.success(`用户状态已${pendingStatus === 'active' ? '启用' : '禁用'}`);
      setStatusModalVisible(false);
      fetchUsers(form.getFieldsValue());
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const generatePermissionImpacts = (isDeactivating: boolean): PermissionImpact[] => {
    if (isDeactivating) {
      return [
        {
          type: 'contract',
          name: '合同管理',
          action: '标记待处理',
          description: '该用户正在履行的合同已标记为待处理，需进行合同终止或变更处理'
        },
        {
          type: 'attendance',
          name: '考勤管理',
          action: '暂停打卡',
          description: '该用户的考勤打卡权限已暂停，无法进行签到签退'
        },
        {
          type: 'payroll',
          name: '工资条',
          action: '跳过生成',
          description: '工资条生成时将自动跳过该用户，待恢复后重新生成'
        }
      ];
    } else {
      return [
        {
          type: 'contract',
          name: '合同管理',
          action: '恢复处理',
          description: '该用户的合同已恢复正常处理状态'
        },
        {
          type: 'attendance',
          name: '考勤管理',
          action: '恢复打卡',
          description: '该用户的考勤打卡权限已恢复，可正常进行签到签退'
        },
        {
          type: 'payroll',
          name: '工资条',
          action: '恢复生成',
          description: '工资条生成时将包含该用户'
        }
      ];
    }
  };

  const handleViewHistory = async (record: AdminUser) => {
    setSelectedUser(record);
    setHistoryLoading(true);
    setStatusHistory([]);
    try {
      const [deactivatedRes, activatedRes] = await Promise.all([
        api.admin.getAuditLogs({
          userId: record.id,
          action: 'user_deactivated',
          pageSize: 100
        }),
        api.admin.getAuditLogs({
          userId: record.id,
          action: 'user_activated',
          pageSize: 100
        })
      ]);

      const deactivatedLogs = deactivatedRes.data?.logs || [];
      const activatedLogs = activatedRes.data?.logs || [];
      const allLogs = [...deactivatedLogs, ...activatedLogs].sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const records: StatusChangeRecord[] = allLogs.map((log: any, idx: number) => {
        let oldValues: any = {};
        let newValues: any = {};
        
        try {
          if (log.oldValues) oldValues = typeof log.oldValues === 'string' ? JSON.parse(log.oldValues) : log.oldValues;
        } catch (e) {}
        
        try {
          if (log.newValues) newValues = typeof log.newValues === 'string' ? JSON.parse(log.newValues) : log.newValues;
        } catch (e) {}

        const isDeactivating = log.action === 'user_deactivated';
        
        return {
          id: log.id || idx + 1,
          userId: record.id,
          oldStatus: oldValues.status || (isDeactivating ? 'active' : 'inactive'),
          newStatus: newValues.status || (isDeactivating ? 'inactive' : 'active'),
          reason: newValues.reason || log.details?.reason || '-',
          operatorId: log.userId,
          operatorName: log.realName || log.username || '-',
          ipAddress: log.ipAddress || log.ip_address || '-',
          createdAt: log.createdAt || log.timestamp,
          permissionImpacts: generatePermissionImpacts(isDeactivating)
        };
      });

      if (record.statusChangeRecords) {
        setStatusHistory([...record.statusChangeRecords, ...records]);
      } else {
        setStatusHistory(records);
      }
    } catch (error: any) {
      console.error('获取状态变更历史失败:', error);
      if (record.statusChangeRecords) {
        setStatusHistory(record.statusChangeRecords);
      }
    } finally {
      setHistoryLoading(false);
      setHistoryModalVisible(true);
    }
  };

  const handleViewDetail = (record: AdminUser) => {
    setSelectedUser(record);
    setActiveTab('basic');
    setDetailModalVisible(true);
  };

  const handleVerifyEnterprise = (record: AdminUser) => {
    setSelectedUser(record);
    verifyForm.resetFields();
    setVerifyModalVisible(true);
  };

  const handleVerifySubmit = async (values: any) => {
    if (!selectedUser) return;
    try {
      await api.admin.verifyEnterprise(selectedUser.id, {
        status: values.status,
        rejectReason: values.rejectReason
      });
      message.success(values.status === 'active' ? '企业审核通过' : '企业审核拒绝');
      setVerifyModalVisible(false);
      fetchUsers(form.getFieldsValue());
    } catch (error: any) {
      message.error(error.response?.data?.error || '审核失败');
    }
  };

  const getRoleText = (role: string) => {
    const map: Record<string, string> = {
      worker: '工人',
      enterprise: '企业',
      admin: '管理员'
    };
    return map[role] || role;
  };

  const getRoleColor = (role: string) => {
    const map: Record<string, string> = {
      worker: 'blue',
      enterprise: 'purple',
      admin: 'red'
    };
    return map[role] || 'default';
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      active: '正常',
      inactive: '禁用',
      pending: '待审核'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      active: 'green',
      inactive: 'default',
      pending: 'orange'
    };
    return map[status] || 'default';
  };

  const getImpactIcon = (type: string) => {
    switch (type) {
      case 'contract':
        return <FileTextOutlined style={{ color: '#1890ff' }} />;
      case 'attendance':
        return <ClockCircleOutlined style={{ color: '#52c41a' }} />;
      case 'payroll':
        return <SafetyOutlined style={{ color: '#faad14' }} />;
      default:
        return <InfoCircleOutlined />;
    }
  };

  const renderStatusChangeTimeline = (record: StatusChangeRecord) => {
    return (
      <Timeline.Item 
        color={record.newStatus === 'active' ? 'green' : 'red'}
        dot={record.newStatus === 'active' ? <UnlockOutlined /> : <LockOutlined />}
      >
        <div style={{ marginBottom: '8px' }}>
          <Space>
            <Tag color={getStatusColor(record.newStatus)}>
              {getStatusText(record.oldStatus)} → {getStatusText(record.newStatus)}
            </Tag>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {new Date(record.createdAt).toLocaleString('zh-CN')}
            </Text>
          </Space>
        </div>
        
        <Descriptions column={2} size="small" bordered style={{ marginBottom: '8px' }}>
          <Descriptions.Item label="操作人" span={1}>
            {record.operatorName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="IP地址" span={1}>
            {record.ipAddress || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="变更原因" span={2}>
            {record.reason || '-'}
          </Descriptions.Item>
        </Descriptions>

        {record.permissionImpacts && record.permissionImpacts.length > 0 && (
          <div>
            <Divider orientation="left" style={{ margin: '8px 0' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>权限影响记录</Text>
            </Divider>
            <Row gutter={[8, 8]}>
              {record.permissionImpacts.map((impact, idx) => (
                <Col span={8} key={idx}>
                  <Card size="small" style={{ height: '100%' }}>
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Space>
                        {getImpactIcon(impact.type)}
                        <Text strong>{impact.name}</Text>
                      </Space>
                      <Tag color="orange" style={{ margin: 0 }}>
                        {impact.action}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {impact.description}
                      </Text>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Timeline.Item>
    );
  };

  const columns: ColumnsType<AdminUser> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      fixed: 'left'
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 80,
      render: (role) => (
        <Tag color={getRoleColor(role)}>
          {getRoleText(role)}
        </Tag>
      )
    },
    {
      title: '姓名',
      dataIndex: 'realName',
      key: 'realName',
      width: 100,
      render: (text, record) => text || record.companyName || '-'
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 120
    },
    {
      title: '企业名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 180,
      render: (text) => text || '-'
    },
    {
      title: '统一信用代码',
      dataIndex: 'unifiedCreditCode',
      key: 'unifiedCreditCode',
      width: 180,
      render: (text) => text || '-'
    },
    {
      title: '技能等级',
      dataIndex: 'skillLevel',
      key: 'skillLevel',
      width: 100,
      render: (level, record) => record.role === 'worker' ? (level ? `${level}级` : '未评级') : '-'
    },
    {
      title: '生物特征',
      dataIndex: 'hasBiometricData',
      key: 'hasBiometricData',
      width: 100,
      render: (value, record) => {
        if (record.role !== 'worker') return '-';
        if (record.biometricDeleted === 1) return <Tag color="red">已删除</Tag>;
        return value === 1 ? <Tag color="green">已录入</Tag> : <Tag color="default">未录入</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && record.role === 'enterprise' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleVerifyEnterprise(record)}
            >
              审核
            </Button>
          )}
          {record.status === 'active' ? (
            <Button
              type="link"
              size="small"
              danger
              icon={<LockOutlined />}
              onClick={() => handleStatusChange(record, 'inactive')}
            >
              禁用
            </Button>
          ) : record.status === 'inactive' ? (
            <Button
              type="link"
              size="small"
              icon={<UnlockOutlined />}
              onClick={() => handleStatusChange(record, 'active')}
            >
              启用
            </Button>
          ) : null}
          <Button
            type="link"
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => handleViewHistory(record)}
          >
            变更记录
          </Button>
        </Space>
      )
    }
  ];

  const renderUserDetail = () => {
    if (!selectedUser) return null;
    
    return (
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="基本信息" key="basic">
          <Row gutter={16}>
            <Col span={12}>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="用户名">
                  {selectedUser.username}
                </Descriptions.Item>
                <Descriptions.Item label="角色">
                  <Tag color={getRoleColor(selectedUser.role)}>
                    {getRoleText(selectedUser.role)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="姓名">
                  {selectedUser.realName || selectedUser.companyName || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="手机号">
                  {selectedUser.phone || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={getStatusColor(selectedUser.status)}>
                    {getStatusText(selectedUser.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="注册时间">
                  {new Date(selectedUser.createdAt).toLocaleString('zh-CN')}
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col span={12}>
              {selectedUser.role === 'worker' ? (
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="性别">
                    {selectedUser.gender || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="出生日期">
                    {selectedUser.birthDate || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="工作年限">
                    {selectedUser.workYears ? `${selectedUser.workYears}年` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="技能等级">
                    {selectedUser.skillLevel ? `${selectedUser.skillLevel}级` : '未评级'}
                  </Descriptions.Item>
                  <Descriptions.Item label="生物特征">
                    {selectedUser.biometricDeleted === 1 
                      ? <Tag color="red">已删除</Tag>
                      : selectedUser.hasBiometricData === 1 
                        ? <Tag color="green">已录入</Tag> 
                        : <Tag color="default">未录入</Tag>}
                  </Descriptions.Item>
                  <Descriptions.Item label="身份证号">
                    {selectedUser.idCard || '-'}
                  </Descriptions.Item>
                </Descriptions>
              ) : selectedUser.role === 'enterprise' ? (
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="企业名称">
                    {selectedUser.companyName || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="统一信用代码">
                    {selectedUser.unifiedCreditCode || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="审核状态">
                    {selectedUser.enterpriseVerificationStatus 
                      ? <Tag color={getStatusColor(selectedUser.enterpriseVerificationStatus)}>
                          {getStatusText(selectedUser.enterpriseVerificationStatus)}
                        </Tag>
                      : '-'}
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="管理员权限">
                    <Tag color="red">全部权限</Tag>
                  </Descriptions.Item>
                </Descriptions>
              )}
            </Col>
          </Row>
        </TabPane>
        
        <TabPane tab="状态变更历史" key="history">
          <Spin spinning={historyLoading}>
            {statusHistory.length > 0 ? (
              <Timeline mode="left">
                {statusHistory.map((record) => (
                  <React.Fragment key={record.id}>
                    {renderStatusChangeTimeline(record)}
                  </React.Fragment>
                ))}
              </Timeline>
            ) : (
              <Empty description="暂无状态变更记录" />
            )}
          </Spin>
        </TabPane>
      </Tabs>
    );
  };

  return (
    <Card title="用户管理">
      <Form
        form={form}
        layout="inline"
        onFinish={handleSearch}
        style={{ marginBottom: '16px' }}
      >
        <Form.Item name="role" label="角色">
          <Select placeholder="全部" allowClear style={{ width: 120 }}>
            <Option value="worker">工人</Option>
            <Option value="enterprise">企业</Option>
            <Option value="admin">管理员</Option>
          </Select>
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select placeholder="全部" allowClear style={{ width: 120 }}>
            <Option value="active">正常</Option>
            <Option value="inactive">禁用</Option>
            <Option value="pending">待审核</Option>
          </Select>
        </Form.Item>
        <Form.Item name="keyword" label="关键词">
          <Input placeholder="用户名/姓名/手机号" allowClear style={{ width: 200 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
            <Button onClick={handleReset} icon={<ReloadOutlined />}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          scroll={{ x: 1600 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            }
          }}
        />
      </Spin>

      <Modal
        title="企业资质审核"
        open={verifyModalVisible}
        onCancel={() => setVerifyModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedUser && (
          <div style={{ marginBottom: '16px' }}>
            <p><Text strong>企业名称：</Text>{selectedUser.companyName}</p>
            <p><Text strong>统一信用代码：</Text>{selectedUser.unifiedCreditCode}</p>
            <p><Text strong>用户名：</Text>{selectedUser.username}</p>
            <p><Text strong>手机号：</Text>{selectedUser.phone}</p>
          </div>
        )}
        <Form
          form={verifyForm}
          layout="vertical"
          onFinish={handleVerifySubmit}
        >
          <Form.Item
            name="status"
            label="审核结果"
            rules={[{ required: true, message: '请选择审核结果' }]}
          >
            <Select placeholder="请选择审核结果">
              <Option value="active">审核通过</Option>
              <Option value="rejected">审核拒绝</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="rejectReason"
            label="拒绝原因"
            dependencies={['status']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue('status') === 'rejected' && !value) {
                    return Promise.reject(new Error('请填写拒绝原因'));
                  }
                  return Promise.resolve();
                }
              })
            ]}
          >
            <TextArea rows={4} placeholder="请填写拒绝原因" maxLength={500} />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setVerifyModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={pendingStatus === 'active' ? '启用用户' : '禁用用户'}
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={null}
        width={550}
        maskClosable={false}
      >
        <Spin spinning={statusChangeLoading}>
          {selectedUser && (
            <div>
              <Alert
                message={pendingStatus === 'active' ? '即将启用用户' : '即将禁用用户'}
                description={
                  <div>
                    <p><Text strong>用户：</Text>{selectedUser.realName || selectedUser.companyName || selectedUser.username} ({selectedUser.username})</p>
                    <p><Text strong>角色：</Text>{getRoleText(selectedUser.role)}</p>
                  </div>
                }
                type={pendingStatus === 'active' ? 'success' : 'warning'}
                showIcon
                icon={pendingStatus === 'active' ? <UnlockOutlined /> : <ExclamationCircleOutlined />}
                style={{ marginBottom: '16px' }}
              />

              {pendingStatus === 'inactive' && (
                <Alert
                  message="禁用后联动影响"
                  description={
                    <ul style={{ paddingLeft: '20px', margin: '8px 0 0 0' }}>
                      <li style={{ marginBottom: '4px' }}>
                        <FileTextOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
                        正在履行的合同将标记为待处理
                      </li>
                      <li style={{ marginBottom: '4px' }}>
                        <ClockCircleOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
                        考勤打卡权限将被暂停
                      </li>
                      <li>
                        <SafetyOutlined style={{ marginRight: '4px', color: '#faad14' }} />
                        工资条生成将自动跳过
                      </li>
                    </ul>
                  }
                  type="warning"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  style={{ marginBottom: '16px' }}
                />
              )}

              {pendingStatus === 'active' && (
                <Alert
                  message="启用后联动影响"
                  description={
                    <ul style={{ paddingLeft: '20px', margin: '8px 0 0 0' }}>
                      <li style={{ marginBottom: '4px' }}>
                        <FileTextOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
                        合同管理恢复正常处理
                      </li>
                      <li style={{ marginBottom: '4px' }}>
                        <ClockCircleOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
                        考勤打卡权限恢复
                      </li>
                      <li>
                        <SafetyOutlined style={{ marginRight: '4px', color: '#faad14' }} />
                        工资条生成恢复包含该用户
                      </li>
                    </ul>
                  }
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  style={{ marginBottom: '16px' }}
                />
              )}

              <Form
                form={statusForm}
                layout="vertical"
                onFinish={handleStatusConfirm}
              >
                <Form.Item
                  name="reason"
                  label={pendingStatus === 'active' ? '启用原因' : '禁用原因'}
                  rules={[{ required: true, message: `请填写${pendingStatus === 'active' ? '启用' : '禁用'}原因` }]}
                >
                  <TextArea
                    rows={4}
                    placeholder={`请详细说明${pendingStatus === 'active' ? '启用' : '禁用'}原因`}
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
                <Form.Item>
                  <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button onClick={() => setStatusModalVisible(false)}>
                      取消
                    </Button>
                    <Button
                      type={pendingStatus === 'active' ? 'primary' : 'primary'}
                      danger={pendingStatus === 'inactive'}
                      htmlType="submit"
                      icon={pendingStatus === 'active' ? <UnlockOutlined /> : <LockOutlined />}
                    >
                      确认{pendingStatus === 'active' ? '启用' : '禁用'}
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </div>
          )}
        </Spin>
      </Modal>

      <Modal
        title="用户详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          selectedUser && (
            <Button 
              key="history" 
              icon={<HistoryOutlined />}
              onClick={() => {
                setDetailModalVisible(false);
                handleViewHistory(selectedUser);
              }}
            >
              查看变更记录
            </Button>
          )
        ]}
        width={800}
      >
        {selectedUser && renderUserDetail()}
      </Modal>

      <Modal
        title="状态变更记录"
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <Spin spinning={historyLoading}>
          {selectedUser && (
            <div>
              <Descriptions column={2} size="small" style={{ marginBottom: '16px' }}>
                <Descriptions.Item label="用户">
                  {selectedUser.realName || selectedUser.companyName || selectedUser.username}
                </Descriptions.Item>
                <Descriptions.Item label="用户名">
                  {selectedUser.username}
                </Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  <Tag color={getStatusColor(selectedUser.status)}>
                    {getStatusText(selectedUser.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="角色">
                  {getRoleText(selectedUser.role)}
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left" style={{ marginTop: 0 }}>历史变更记录</Divider>

              {statusHistory.length > 0 ? (
                <Timeline mode="left">
                  {statusHistory.map((record) => (
                    <React.Fragment key={record.id}>
                      {renderStatusChangeTimeline(record)}
                    </React.Fragment>
                  ))}
                </Timeline>
              ) : (
                <Empty description="暂无状态变更记录" />
              )}
            </div>
          )}
        </Spin>
      </Modal>
    </Card>
  );
};

export default UserList;
