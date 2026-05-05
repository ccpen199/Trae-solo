import React, { useState } from 'react';
import { Card, Table, Button, Form, Select, Input, Tabs, message, DatePicker } from 'antd';
import { SearchOutlined, FileTextOutlined } from '@ant-design/icons';
import { employeeApi, salaryApi, attendanceApi } from '../services/api';
import type { Employee, Salary, Attendance } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { TabPane } = Tabs;

const SearchPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('employee');
  const [employeeForm] = Form.useForm();
  const [salaryForm] = Form.useForm();
  const [attendanceForm] = Form.useForm();

  const [employeeResults, setEmployeeResults] = useState<Employee[]>([]);
  const [salaryResults, setSalaryResults] = useState<Salary[]>([]);
  const [attendanceResults, setAttendanceResults] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);

  const searchEmployees = async (values: any) => {
    setLoading(true);
    try {
      const params: any = {};
      if (values.employeeNo) params.employeeNo = values.employeeNo;
      if (values.name) params.name = values.name;
      if (values.departmentId) params.departmentId = values.departmentId;
      if (values.status) params.status = values.status;

      const result = await employeeApi.getList({ ...params, pageSize: 100 });
      setEmployeeResults(result.data);
      message.success(`找到 ${result.data.length} 条记录`);
    } catch (error) {
      message.error('查询失败');
    } finally {
      setLoading(false);
    }
  };

  const searchSalaries = async (values: any) => {
    setLoading(true);
    try {
      const params: any = {};
      if (values.employeeId) params.employeeId = values.employeeId;
      if (values.year) params.year = values.year;
      if (values.month) params.month = values.month;

      const result = await salaryApi.getList({ ...params, pageSize: 100 });
      setSalaryResults(result.data);
      message.success(`找到 ${result.data.length} 条记录`);
    } catch (error) {
      message.error('查询失败');
    } finally {
      setLoading(false);
    }
  };

  const searchAttendances = async (values: any) => {
    setLoading(true);
    try {
      const params: any = {};
      if (values.employeeId) params.employeeId = values.employeeId;
      if (values.year) params.year = values.year;
      if (values.month) params.month = values.month;

      const result = await attendanceApi.getList({ ...params, pageSize: 100 });
      setAttendanceResults(result.data);
      message.success(`找到 ${result.data.length} 条记录`);
    } catch (error) {
      message.error('查询失败');
    } finally {
      setLoading(false);
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const employeeColumns = [
    { title: '员工编号', dataIndex: 'employeeNo', key: 'employeeNo' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '性别', dataIndex: 'gender', key: 'gender', render: (g: string) => g === 'M' ? '男' : g === 'F' ? '女' : g },
    { title: '部门', key: 'dept', render: (_: any, r: Employee) => r.department?.name || '-' },
    { title: '职位', dataIndex: 'position', key: 'position' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => {
      const labels: Record<string, string> = { ACTIVE: '在职', PROBATION: '试用', RESIGNED: '辞职', RETIRED: '退休', DISMISSED: '开除', ON_LEAVE: '休假' };
      return labels[s] || s;
    }},
    { title: '基本工资', dataIndex: 'baseSalary', key: 'baseSalary', render: (v: number) => `¥${v}` },
  ];

  const salaryColumns = [
    { title: '员工', key: 'name', render: (_: any, r: Salary) => r.employee?.name },
    { title: '年份', dataIndex: 'year', key: 'year' },
    { title: '月份', dataIndex: 'month', key: 'month' },
    { title: '基本工资', dataIndex: 'baseSalary', key: 'baseSalary', render: (v: number) => `¥${v}` },
    { title: '绩效工资', dataIndex: 'performanceSalary', key: 'performanceSalary', render: (v: number) => `¥${v}` },
    { title: '应发工资', dataIndex: 'totalIncome', key: 'totalIncome', render: (v: number) => <span style={{ color: '#3f8600' }}>¥{v}</span> },
    { title: '实发工资', dataIndex: 'netSalary', key: 'netSalary', render: (v: number) => <span style={{ color: '#1890ff', fontWeight: 'bold' }}>¥{v}</span> },
  ];

  const attendanceColumns = [
    { title: '员工', key: 'name', render: (_: any, r: Attendance) => r.employee?.name },
    { title: '年份', dataIndex: 'year', key: 'year' },
    { title: '月份', dataIndex: 'month', key: 'month' },
    { title: '应出勤', dataIndex: 'shouldAttend', key: 'shouldAttend' },
    { title: '实际出勤', dataIndex: 'actualAttend', key: 'actualAttend' },
    { title: '请假天数', dataIndex: 'leaveDays', key: 'leaveDays' },
    { title: '迟到次数', dataIndex: 'lateTimes', key: 'lateTimes' },
    { title: '旷工天数', dataIndex: 'absentDays', key: 'absentDays' },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>查询统计</h2>
      
      <Card style={{ marginBottom: 16 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="员工查询" key="employee">
            <Form
              form={employeeForm}
              layout="inline"
              onFinish={searchEmployees}
            >
              <Form.Item name="employeeNo" label="员工编号">
                <Input placeholder="请输入员工编号" style={{ width: 150 }} />
              </Form.Item>
              <Form.Item name="name" label="姓名">
                <Input placeholder="请输入姓名" style={{ width: 150 }} />
              </Form.Item>
              <Form.Item name="departmentId" label="部门">
                <Select placeholder="请选择部门" style={{ width: 150 }} allowClear>
                </Select>
              </Form.Item>
              <Form.Item name="status" label="状态">
                <Select placeholder="请选择状态" style={{ width: 120 }} allowClear>
                  <Option value="ACTIVE">在职</Option>
                  <Option value="PROBATION">试用</Option>
                  <Option value="RESIGNED">辞职</Option>
                  <Option value="RETIRED">退休</Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
                  查询
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="工资查询" key="salary">
            <Form
              form={salaryForm}
              layout="inline"
              onFinish={searchSalaries}
            >
              <Form.Item name="employeeId" label="员工">
                <Select placeholder="请选择员工" style={{ width: 150 }} allowClear showSearch>
                </Select>
              </Form.Item>
              <Form.Item name="year" label="年份">
                <Select placeholder="请选择年份" style={{ width: 120 }} allowClear>
                  {years.map((y) => <Option key={y} value={y}>{y}年</Option>)}
                </Select>
              </Form.Item>
              <Form.Item name="month" label="月份">
                <Select placeholder="请选择月份" style={{ width: 100 }} allowClear>
                  {months.map((m) => <Option key={m} value={m}>{m}月</Option>)}
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
                  查询
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="考勤查询" key="attendance">
            <Form
              form={attendanceForm}
              layout="inline"
              onFinish={searchAttendances}
            >
              <Form.Item name="employeeId" label="员工">
                <Select placeholder="请选择员工" style={{ width: 150 }} allowClear showSearch>
                </Select>
              </Form.Item>
              <Form.Item name="year" label="年份">
                <Select placeholder="请选择年份" style={{ width: 120 }} allowClear>
                  {years.map((y) => <Option key={y} value={y}>{y}年</Option>)}
                </Select>
              </Form.Item>
              <Form.Item name="month" label="月份">
                <Select placeholder="请选择月份" style={{ width: 100 }} allowClear>
                  {months.map((m) => <Option key={m} value={m}>{m}月</Option>)}
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
                  查询
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>

      <Card>
        {activeTab === 'employee' && (
          <Table
            columns={employeeColumns}
            dataSource={employeeResults}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
            scroll={{ x: 1000 }}
          />
        )}
        {activeTab === 'salary' && (
          <Table
            columns={salaryColumns}
            dataSource={salaryResults}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
            scroll={{ x: 1000 }}
          />
        )}
        {activeTab === 'attendance' && (
          <Table
            columns={attendanceColumns}
            dataSource={attendanceResults}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
            scroll={{ x: 1000 }}
          />
        )}
      </Card>
    </div>
  );
};

export default SearchPage;
