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
  Statistic,
  Descriptions,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import { salaryApi, employeeApi, departmentApi } from '../services/api';
import type { Salary, Employee, Department } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;

const SalaryPage: React.FC = () => {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({ employeeId: '', year: 0, month: 0, departmentId: '' });
  
  const [modalVisible, setModalVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Salary | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [reportForm] = Form.useForm();

  useEffect(() => {
    fetchSalaries();
    fetchEmployees();
    fetchDepartments();
  }, []);

  const fetchSalaries = async (params?: any) => {
    setLoading(true);
    try {
      const queryParams: any = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      };
      if (filters.employeeId) queryParams.employeeId = filters.employeeId;
      if (filters.year) queryParams.year = filters.year;
      if (filters.month) queryParams.month = filters.month;
      if (filters.departmentId) queryParams.departmentId = filters.departmentId;

      const result = await salaryApi.getList(queryParams);
      setSalaries(result.data);
      setPagination({
        ...pagination,
        total: result.pagination.total,
        current: result.pagination.page,
      });
    } catch (error) {
      message.error('获取工资列表失败');
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
    fetchSalaries({ page: 1 });
  };

  const handleReset = () => {
    setFilters({ employeeId: '', year: 0, month: 0, departmentId: '' });
    setPagination({ ...pagination, current: 1 });
    fetchSalaries({ page: 1 });
  };

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Salary) => {
    setIsEditing(true);
    setSelectedRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleView = (record: Salary) => {
    setSelectedRecord(record);
    setReportVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await salaryApi.delete(id);
      message.success('删除成功');
      fetchSalaries();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (isEditing && selectedRecord) {
        await salaryApi.update(selectedRecord.id, values);
        message.success('更新成功');
      } else {
        await salaryApi.create(values);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchSalaries();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleBatchCalculate = async (values: { year: number; month: number }) => {
    try {
      const result: any = await salaryApi.batchCalculate(values.year, values.month);
      message.success(`批量计算完成，成功 ${result.data?.successCount || 0} 条`);
      setBatchModalVisible(false);
      fetchSalaries();
    } catch (error) {
      message.error('批量计算失败');
    }
  };

  const handleGenerateReport = async (values: { year: number; month: number; departmentId?: string }) => {
    try {
      const data = await salaryApi.getReport(values);
      setReportData(data);
    } catch (error) {
      message.error('生成报表失败');
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const columns = [
    {
      title: '员工',
      key: 'employee',
      width: 120,
      render: (_: any, record: Salary) => record.employee?.name || '-',
    },
    {
      title: '部门',
      key: 'department',
      width: 120,
      render: (_: any, record: Salary) => record.employee?.department?.name || '-',
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
      title: '基本工资',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      width: 100,
      render: (v: number) => `¥${v}`,
    },
    {
      title: '绩效工资',
      dataIndex: 'performanceSalary',
      key: 'performanceSalary',
      width: 100,
      render: (v: number) => `¥${v}`,
    },
    {
      title: '加班工资',
      dataIndex: 'overtimePay',
      key: 'overtimePay',
      width: 100,
      render: (v: number) => `¥${v}`,
    },
    {
      title: '应发工资',
      dataIndex: 'totalIncome',
      key: 'totalIncome',
      width: 100,
      render: (v: number) => <span style={{ color: '#3f8600', fontWeight: 'bold' }}>¥{v}</span>,
    },
    {
      title: '扣款合计',
      dataIndex: 'totalDeduction',
      key: 'totalDeduction',
      width: 100,
      render: (v: number) => <span style={{ color: '#cf1322' }}>-¥{v}</span>,
    },
    {
      title: '实发工资',
      dataIndex: 'netSalary',
      key: 'netSalary',
      width: 100,
      render: (v: number) => <span style={{ color: '#1890ff', fontWeight: 'bold' }}>¥{v}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'PAID' ? 'green' : status === 'CONFIRMED' ? 'blue' : 'orange'}>
          {status === 'PAID' ? '已发放' : status === 'CONFIRMED' ? '已确认' : '草稿'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: Salary) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            详情
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
      <h2 style={{ marginBottom: 24 }}>工资管理</h2>
      
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
            新增工资
          </Button>
          <Button type="dashed" onClick={() => setBatchModalVisible(true)}>
            批量计算本月工资
          </Button>
          <Button type="dashed" icon={<FileTextOutlined />} onClick={() => reportForm.resetFields() || setReportData(null) || setReportVisible(true)}>
            工资报表
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={salaries}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
              fetchSalaries({ page, pageSize });
            },
          }}
          scroll={{ x: 1600 }}
        />
      </Card>

      <Modal
        title={isEditing ? '编辑工资' : '新增工资'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={900}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ status: 'DRAFT' }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="employeeId" label="员工" rules={[{ required: true, message: '请选择员工' }]}>
                <Select placeholder="请选择员工" showSearch optionFilterProp="children">
                  {employees.map((emp) => (
                    <Option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeNo})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="year" label="年份" rules={[{ required: true, message: '请选择年份' }]}>
                <Select placeholder="请选择年份">
                  {years.map((y) => (
                    <Option key={y} value={y}>{y}年</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
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
            <Col span={6}>
              <Form.Item name="baseSalary" label="基本工资">
                <Input.Number style={{ width: '100%' }} min={0} prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="performanceSalary" label="绩效工资">
                <Input.Number style={{ width: '100%' }} min={0} prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="allowance" label="津贴">
                <Input.Number style={{ width: '100%' }} min={0} prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="bonus" label="奖金">
                <Input.Number style={{ width: '100%' }} min={0} prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="housingFund" label="公积金">
                <Input.Number style={{ width: '100%' }} min={0} prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="pension" label="养老金">
                <Input.Number style={{ width: '100%' }} min={0} prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="medicalInsurance" label="医保">
                <Input.Number style={{ width: '100%' }} min={0} prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="tax" label="个税">
                <Input.Number style={{ width: '100%' }} min={0} prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="状态">
            <Select>
              <Option value="DRAFT">草稿</Option>
              <Option value="CONFIRMED">已确认</Option>
              <Option value="PAID">已发放</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量计算工资"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={handleBatchCalculate}
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
              为所有在职员工计算工资
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="工资详情"
        open={reportVisible && selectedRecord !== null && reportData === null}
        onCancel={() => { setReportVisible(false); setSelectedRecord(null); }}
        footer={null}
        width={800}
      >
        {selectedRecord && (
          <div>
            <Descriptions bordered column={2} title="工资明细">
              <Descriptions.Item label="员工">{selectedRecord.employee?.name}</Descriptions.Item>
              <Descriptions.Item label="月份">{selectedRecord.year}年{selectedRecord.month}月</Descriptions.Item>
              <Descriptions.Item label="基本工资">¥{selectedRecord.baseSalary}</Descriptions.Item>
              <Descriptions.Item label="绩效工资">¥{selectedRecord.performanceSalary}</Descriptions.Item>
              <Descriptions.Item label="津贴">¥{selectedRecord.allowance}</Descriptions.Item>
              <Descriptions.Item label="奖金">¥{selectedRecord.bonus}</Descriptions.Item>
              <Descriptions.Item label="加班工资">¥{selectedRecord.overtimePay}</Descriptions.Item>
              <Descriptions.Item label="应发工资" span={2}>
                <span style={{ color: '#3f8600', fontSize: 18, fontWeight: 'bold' }}>¥{selectedRecord.totalIncome}</span>
              </Descriptions.Item>
              <Descriptions.Item label="公积金">¥{selectedRecord.housingFund}</Descriptions.Item>
              <Descriptions.Item label="养老金">¥{selectedRecord.pension}</Descriptions.Item>
              <Descriptions.Item label="医保">¥{selectedRecord.medicalInsurance}</Descriptions.Item>
              <Descriptions.Item label="个税">¥{selectedRecord.tax}</Descriptions.Item>
              <Descriptions.Item label="扣款合计" span={2}>
                <span style={{ color: '#cf1322', fontSize: 18, fontWeight: 'bold' }}>-¥{selectedRecord.totalDeduction}</span>
              </Descriptions.Item>
              <Descriptions.Item label="实发工资" span={2}>
                <span style={{ color: '#1890ff', fontSize: 24, fontWeight: 'bold' }}>¥{selectedRecord.netSalary}</span>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      <Modal
        title="工资报表"
        open={reportVisible && reportData !== null}
        onCancel={() => { setReportVisible(false); setReportData(null); }}
        width={1000}
        footer={
          <Button onClick={() => { setReportVisible(false); setReportData(null); }}>关闭</Button>
        }
      >
        <Card style={{ marginBottom: 16 }}>
          <Form form={reportForm} layout="inline" onFinish={handleGenerateReport} initialValues={{ year: new Date().getFullYear(), month: new Date().getMonth() + 1 }}>
            <Form.Item name="year" label="年份">
              <Select style={{ width: 120 }}>
                {years.map((y) => <Option key={y} value={y}>{y}年</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="month" label="月份">
              <Select style={{ width: 100 }}>
                {months.map((m) => <Option key={m} value={m}>{m}月</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="departmentId" label="部门">
              <Select style={{ width: 150 }} allowClear placeholder="全部部门">
                {departments.map((d) => <Option key={d.id} value={d.id}>{d.name}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">生成报表</Button>
            </Form.Item>
          </Form>
        </Card>
        
        {reportData && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic title="员工人数" value={reportData.summary?.totalEmployees || 0} />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic title="工资总额" value={reportData.summary?.totalNetSalary || 0} prefix="¥" precision={2} />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic title="平均工资" value={reportData.summary?.avgNetSalary || 0} prefix="¥" precision={2} />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic title="应发合计" value={reportData.summary?.totalIncome || 0} prefix="¥" precision={2} />
                </Card>
              </Col>
            </Row>
            
            <Table
              dataSource={reportData.data || []}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '员工', key: 'name', render: (_: any, r: any) => r.employee?.name },
                { title: '部门', key: 'dept', render: (_: any, r: any) => r.employee?.department?.name },
                { title: '基本工资', dataIndex: 'baseSalary', render: (v: number) => `¥${v}` },
                { title: '应发工资', dataIndex: 'totalIncome', render: (v: number) => <span style={{ color: '#3f8600' }}>¥{v}</span> },
                { title: '扣款合计', dataIndex: 'totalDeduction', render: (v: number) => <span style={{ color: '#cf1322' }}>¥{v}</span> },
                { title: '实发工资', dataIndex: 'netSalary', render: (v: number) => <span style={{ color: '#1890ff', fontWeight: 'bold' }}>¥{v}</span> },
              ]}
              scroll={{ x: 800 }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

import { Input } from 'antd';

export default SalaryPage;
