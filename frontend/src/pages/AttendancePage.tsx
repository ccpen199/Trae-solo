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
  DatePicker,
  message,
  Popconfirm,
  Row,
  Col,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { attendanceApi, employeeApi } from '../services/api';
import type { Attendance, Employee } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const AttendancePage: React.FC = () => {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({ employeeId: '', year: 0, month: 0 });
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);

  useEffect(() => {
    fetchAttendances();
    fetchEmployees();
  }, []);

  const fetchAttendances = async (params?: any) => {
    setLoading(true);
    try {
      const queryParams: any = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      };
      if (filters.employeeId) queryParams.employeeId = filters.employeeId;
      if (filters.year) queryParams.year = filters.year;
      if (filters.month) queryParams.month = filters.month;

      const result = await attendanceApi.getList(queryParams);
      setAttendances(result.data);
      setPagination({
        ...pagination,
        total: result.pagination.total,
        current: result.pagination.page,
      });
    } catch (error) {
      message.error('获取考勤列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const result = await employeeApi.getList({ pageSize: 1000 });
      setEmployees(result.data);
    } catch (error) {
      console.error('获取员工列表失败:', error);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    fetchAttendances({ page: 1 });
  };

  const handleReset = () => {
    setFilters({ employeeId: '', year: 0, month: 0 });
    setPagination({ ...pagination, current: 1 });
    fetchAttendances({ page: 1 });
  };

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Attendance) => {
    setIsEditing(true);
    setSelectedRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await attendanceApi.delete(id);
      message.success('删除成功');
      fetchAttendances();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (isEditing && selectedRecord) {
        await attendanceApi.update(selectedRecord.id, values);
        message.success('更新成功');
      } else {
        await attendanceApi.create(values);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchAttendances();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleBatchCreate = async (values: { year: number; month: number }) => {
    try {
      const result: any = await attendanceApi.batchCreate(values.year, values.month);
      message.success(`批量创建完成，成功 ${result.data?.successCount || 0} 条`);
      setBatchModalVisible(false);
      fetchAttendances();
    } catch (error) {
      message.error('批量创建失败');
    }
  };

  const columns = [
    {
      title: '员工',
      key: 'employee',
      width: 120,
      render: (_: any, record: Attendance) => record.employee?.name || '-',
    },
    {
      title: '部门',
      key: 'department',
      width: 120,
      render: (_: any, record: Attendance) => record.employee?.department?.name || '-',
    },
    {
      title: '年份',
      dataIndex: 'year',
      key: 'year',
      width: 80,
    },
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
    },
    {
      title: '应出勤',
      dataIndex: 'shouldAttend',
      key: 'shouldAttend',
      width: 80,
    },
    {
      title: '实际出勤',
      dataIndex: 'actualAttend',
      key: 'actualAttend',
      width: 80,
    },
    {
      title: '请假天数',
      dataIndex: 'leaveDays',
      key: 'leaveDays',
      width: 80,
    },
    {
      title: '迟到次数',
      dataIndex: 'lateTimes',
      key: 'lateTimes',
      width: 80,
    },
    {
      title: '旷工天数',
      dataIndex: 'absentDays',
      key: 'absentDays',
      width: 80,
    },
    {
      title: '节假日加班',
      dataIndex: 'overtimeHoliday',
      key: 'overtimeHoliday',
      width: 100,
    },
    {
      title: '日常加班',
      dataIndex: 'overtimeNormal',
      key: 'overtimeNormal',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'CONFIRMED' ? 'green' : 'orange'}>
          {status === 'CONFIRMED' ? '已确认' : status === 'DRAFT' ? '草稿' : status}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Attendance) => (
        <Space size="small">
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

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>考勤管理</h2>
      
      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Select
            placeholder="员工"
            value={filters.employeeId || undefined}
            onChange={(value) => setFilters({ ...filters, employeeId: value || '' })}
            style={{ width: 150 }}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {employees.map((emp) => (
              <Option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeNo})</Option>
            ))}
          </Select>
          <Select
            placeholder="年份"
            value={filters.year || undefined}
            onChange={(value) => setFilters({ ...filters, year: value || 0 })}
            style={{ width: 120 }}
            allowClear
          >
            {years.map((y) => (
              <Option key={y} value={y}>{y}年</Option>
            ))}
          </Select>
          <Select
            placeholder="月份"
            value={filters.month || undefined}
            onChange={(value) => setFilters({ ...filters, month: value || 0 })}
            style={{ width: 100 }}
            allowClear
          >
            {months.map((m) => (
              <Option key={m} value={m}>{m}月</Option>
            ))}
          </Select>
          <Button type="primary" onClick={handleSearch}>查询</Button>
          <Button onClick={handleReset}>重置</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增考勤
          </Button>
          <Button type="dashed" onClick={() => setBatchModalVisible(true)}>
            批量创建本月考勤
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={attendances}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
              fetchAttendances({ page, pageSize });
            },
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title={isEditing ? '编辑考勤' : '新增考勤'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ status: 'DRAFT' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="employeeId" label="员工" rules={[{ required: true, message: '请选择员工' }]}>
                <Select placeholder="请选择员工" showSearch optionFilterProp="children">
                  {employees.map((emp) => (
                    <Option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeNo})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="year" label="年份" rules={[{ required: true, message: '请选择年份' }]}>
                <Select placeholder="请选择年份">
                  {years.map((y) => (
                    <Option key={y} value={y}>{y}年</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="month" label="月份" rules={[{ required: true, message: '请选择月份' }]}>
                <Select placeholder="请选择月份">
                  {months.map((m) => (
                    <Option key={m} value={m}>{m}月</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="shouldAttend" label="应出勤天数">
                <Input.Number style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="actualAttend" label="实际出勤天数">
                <Input.Number style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="workDays" label="工作日天数">
                <Input.Number style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="leaveDays" label="请假天数">
                <Input.Number style={{ width: '100%' }} min={0} step={0.5} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="sickLeave" label="病假天数">
                <Input.Number style={{ width: '100%' }} min={0} step={0.5} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="personalLeave" label="事假天数">
                <Input.Number style={{ width: '100%' }} min={0} step={0.5} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="annualLeave" label="年假天数">
                <Input.Number style={{ width: '100%' }} min={0} step={0.5} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="lateTimes" label="迟到次数">
                <Input.Number style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="earlyLeaveTimes" label="早退次数">
                <Input.Number style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="absentDays" label="旷工天数">
                <Input.Number style={{ width: '100%' }} min={0} step={0.5} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="overtimeHoliday" label="节假日加班(小时)">
                <Input.Number style={{ width: '100%' }} min={0} step={0.5} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="overtimeNormal" label="日常加班(小时)">
                <Input.Number style={{ width: '100%' }} min={0} step={0.5} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="状态">
            <Select>
              <Option value="DRAFT">草稿</Option>
              <Option value="CONFIRMED">已确认</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量创建考勤"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={handleBatchCreate}
          initialValues={{ year: new Date().getFullYear(), month: new Date().getMonth() + 1 }}
        >
          <Form.Item name="year" label="年份" rules={[{ required: true, message: '请选择年份' }]}>
            <Select placeholder="请选择年份" style={{ width: '100%' }}>
              {years.map((y) => (
                <Option key={y} value={y}>{y}年</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="month" label="月份" rules={[{ required: true, message: '请选择月份' }]}>
            <Select placeholder="请选择月份" style={{ width: '100%' }}>
              {months.map((m) => (
                <Option key={m} value={m}>{m}月</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              为所有在职员工创建考勤
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

import { Input } from 'antd';

export default AttendancePage;
