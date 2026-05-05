import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Card,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  message,
  Popconfirm,
  Tag,
  Descriptions,
  Tabs,
  List,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { employeeApi, departmentApi } from '../services/api';
import type { Employee, Department, EmployeeStatus } from '../types';
import { EmployeeStatusLabel } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { TabPane } = Tabs;

const EmployeePage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({ employeeNo: '', name: '', departmentId: '', status: '' });
  
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const fetchEmployees = async (params?: any) => {
    setLoading(true);
    try {
      const result = await employeeApi.getList({
        ...filters,
        ...params,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setEmployees(result.data);
      setPagination({
        ...pagination,
        total: result.pagination.total,
        current: result.pagination.page,
      });
    } catch (error) {
      message.error('获取员工列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await departmentApi.getList();
      setDepartments(data);
    } catch (error) {
      console.error('获取部门列表失败:', error);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    fetchEmployees({ page: 1 });
  };

  const handleReset = () => {
    setFilters({ employeeNo: '', name: '', departmentId: '', status: '' });
    setPagination({ ...pagination, current: 1 });
    fetchEmployees({ page: 1 });
  };

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedEmployee(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Employee) => {
    setIsEditing(true);
    setSelectedEmployee(record);
    form.setFieldsValue({
      ...record,
      birthDate: record.birthDate ? dayjs(record.birthDate) : null,
      entryDate: record.entryDate ? dayjs(record.entryDate) : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await employeeApi.delete(id);
      message.success('删除成功');
      fetchEmployees();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleView = (record: Employee) => {
    setSelectedEmployee(record);
    employeeApi.getById(record.id).then((data) => {
      setSelectedEmployee(data);
      setDetailVisible(true);
    }).catch(() => {
      setSelectedEmployee(record);
      setDetailVisible(true);
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const formattedValues = {
        ...values,
        birthDate: values.birthDate ? values.birthDate.format('YYYY-MM-DD') : null,
        entryDate: values.entryDate ? values.entryDate.format('YYYY-MM-DD') : null,
      };

      if (isEditing && selectedEmployee) {
        await employeeApi.update(selectedEmployee.id, formattedValues);
        message.success('更新成功');
      } else {
        await employeeApi.create(formattedValues);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchEmployees();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '员工编号',
      dataIndex: 'employeeNo',
      key: 'employeeNo',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (gender: string) => gender === 'M' ? '男' : gender === 'F' ? '女' : gender,
    },
    {
      title: '部门',
      dataIndex: ['department', 'name'],
      key: 'department',
      width: 120,
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: EmployeeStatus) => (
        <Tag color={status === 'ACTIVE' ? 'green' : status === 'PROBATION' ? 'orange' : 'default'}>
          {EmployeeStatusLabel[status]}
        </Tag>
      ),
    },
    {
      title: '基本工资',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      width: 100,
      render: (salary: number) => `¥${salary}`,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Employee) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定要删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>员工管理</h2>
      
      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input
            placeholder="员工编号"
            value={filters.employeeNo}
            onChange={(e) => setFilters({ ...filters, employeeNo: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="姓名"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Select
            placeholder="部门"
            value={filters.departmentId || undefined}
            onChange={(value) => setFilters({ ...filters, departmentId: value || '' })}
            style={{ width: 150 }}
            allowClear
          >
            {departments.map((dept) => (
              <Option key={dept.id} value={dept.id}>{dept.name}</Option>
            ))}
          </Select>
          <Select
            placeholder="状态"
            value={filters.status || undefined}
            onChange={(value) => setFilters({ ...filters, status: value || '' })}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="ACTIVE">在职</Option>
            <Option value="PROBATION">试用</Option>
            <Option value="ON_LEAVE">休假</Option>
            <Option value="RESIGNED">辞职</Option>
            <Option value="RETIRED">退休</Option>
            <Option value="DISMISSED">开除</Option>
          </Select>
          <Button type="primary" onClick={handleSearch}>查询</Button>
          <Button onClick={handleReset}>重置</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增员工
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={employees}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
              fetchEmployees({ page, pageSize });
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={isEditing ? '编辑员工' : '新增员工'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 'ACTIVE', gender: 'M' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="employeeNo" label="员工编号">
                <Input placeholder="自动生成或手动输入" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择性别' }]}>
                <Select>
                  <Option value="M">男</Option>
                  <Option value="F">女</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="birthDate" label="出生日期">
                <DatePicker style={{ width: '100%' }} picker="date" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="idCard" label="身份证号">
                <Input placeholder="请输入身份证号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="电话">
                <Input placeholder="请输入电话号码" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="departmentId" label="部门">
                <Select placeholder="请选择部门">
                  {departments.map((dept) => (
                    <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="position" label="职位">
                <Input placeholder="请输入职位" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="entryDate" label="入职日期">
                <DatePicker style={{ width: '100%' }} picker="date" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select>
                  <Option value="ACTIVE">在职</Option>
                  <Option value="PROBATION">试用</Option>
                  <Option value="ON_LEAVE">休假</Option>
                  <Option value="RESIGNED">辞职</Option>
                  <Option value="RETIRED">退休</Option>
                  <Option value="DISMISSED">开除</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="baseSalary" label="基本工资">
                <InputNumber style={{ width: '100%' }} min={0} prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="地址">
            <Input.TextArea rows={2} placeholder="请输入地址" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="员工详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        {selectedEmployee && (
          <Tabs>
            <TabPane tab="基本信息" key="basic">
              <Descriptions bordered column={2}>
                <Descriptions.Item label="员工编号">{selectedEmployee.employeeNo}</Descriptions.Item>
                <Descriptions.Item label="姓名">{selectedEmployee.name}</Descriptions.Item>
                <Descriptions.Item label="性别">
                  {selectedEmployee.gender === 'M' ? '男' : selectedEmployee.gender === 'F' ? '女' : selectedEmployee.gender}
                </Descriptions.Item>
                <Descriptions.Item label="出生日期">
                  {selectedEmployee.birthDate ? dayjs(selectedEmployee.birthDate).format('YYYY-MM-DD') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="身份证号">{selectedEmployee.idCard || '-'}</Descriptions.Item>
                <Descriptions.Item label="电话">{selectedEmployee.phone || '-'}</Descriptions.Item>
                <Descriptions.Item label="邮箱">{selectedEmployee.email || '-'}</Descriptions.Item>
                <Descriptions.Item label="部门">{selectedEmployee.department?.name || '-'}</Descriptions.Item>
                <Descriptions.Item label="职位">{selectedEmployee.position || '-'}</Descriptions.Item>
                <Descriptions.Item label="入职日期">
                  {selectedEmployee.entryDate ? dayjs(selectedEmployee.entryDate).format('YYYY-MM-DD') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="状态">{EmployeeStatusLabel[selectedEmployee.status as EmployeeStatus]}</Descriptions.Item>
                <Descriptions.Item label="基本工资">¥{selectedEmployee.baseSalary}</Descriptions.Item>
                <Descriptions.Item label="地址" span={2}>{selectedEmployee.address || '-'}</Descriptions.Item>
              </Descriptions>
            </TabPane>
            
            <TabPane tab="培训记录" key="training">
              {selectedEmployee.trainings && selectedEmployee.trainings.length > 0 ? (
                <Table
                  dataSource={selectedEmployee.trainings}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: '培训名称', dataIndex: 'name', key: 'name' },
                    { title: '培训机构', dataIndex: 'provider', key: 'provider' },
                    { title: '开始日期', dataIndex: 'startDate', key: 'startDate', render: (d) => d ? dayjs(d).format('YYYY-MM-DD') : '-' },
                    { title: '结束日期', dataIndex: 'endDate', key: 'endDate', render: (d) => d ? dayjs(d).format('YYYY-MM-DD') : '-' },
                    { title: '结果', dataIndex: 'result', key: 'result' },
                  ]}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>暂无培训记录</div>
              )}
            </TabPane>

            <TabPane tab="调动记录" key="transfer">
              {selectedEmployee.transfers && selectedEmployee.transfers.length > 0 ? (
                <Table
                  dataSource={selectedEmployee.transfers}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: '原部门', dataIndex: ['fromDepartment', 'name'], key: 'fromDept' },
                    { title: '原职位', dataIndex: 'fromPosition', key: 'fromPos' },
                    { title: '新部门', dataIndex: ['toDepartment', 'name'], key: 'toDept' },
                    { title: '新职位', dataIndex: 'toPosition', key: 'toPos' },
                    { title: '调动日期', dataIndex: 'transferDate', key: 'date', render: (d) => d ? dayjs(d).format('YYYY-MM-DD') : '-' },
                    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => s === 'APPROVED' ? '已批准' : s === 'PENDING' ? '待审批' : '已拒绝' },
                  ]}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>暂无调动记录</div>
              )}
            </TabPane>

            <TabPane tab="奖惩记录" key="rp">
              {selectedEmployee.rewardsPunishments && selectedEmployee.rewardsPunishments.length > 0 ? (
                <Table
                  dataSource={selectedEmployee.rewardsPunishments}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: '类型', dataIndex: 'type', key: 'type', render: (t) => t === 'REWARD' ? '奖励' : '处罚' },
                    { title: '类别', dataIndex: 'category', key: 'category' },
                    { title: '原因', dataIndex: 'reason', key: 'reason' },
                    { title: '金额', dataIndex: 'amount', key: 'amount', render: (a) => `¥${a}` },
                    { title: '日期', dataIndex: 'date', key: 'date', render: (d) => d ? dayjs(d).format('YYYY-MM-DD') : '-' },
                    { title: '备注', dataIndex: 'remark', key: 'remark' },
                  ]}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>暂无奖惩记录</div>
              )}
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
};

import { Col, Row } from 'antd';

export default EmployeePage;
