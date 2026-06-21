import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Tabs,
  Table,
  Tag,
  Button,
  Space,
  Select,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  message,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  BankOutlined,
  CalculatorOutlined,
  ImportOutlined,
  EditOutlined,
  EyeOutlined,
  UploadOutlined,
  SyncOutlined,
  DownloadOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { mockEmployees, cityRatePlans } from 'shared/mockData';
import { CITY_NAMES, INSURANCE_NAMES } from 'shared/types';
import { formatMoney } from '@/utils/format';
import dayjs from 'dayjs';

interface EmployeeRow {
  id: string;
  employeeNo: string;
  name: string;
  department: string;
  cityCode: string;
  cityName: string;
  insuranceBase: number;
  housingFundBase: number;
  status: string;
}

interface SalaryRow {
  id: string;
  employeeNo: string;
  name: string;
  department: string;
  baseSalary: number;
  bonus: number;
  personalInsurance: number;
  personalHousingFund: number;
  taxDeduction: number;
  individualTax: number;
  netSalary: number;
}

interface TaxRow {
  id: string;
  employeeNo: string;
  name: string;
  cumulativeIncome: number;
  cumulativeDeduction: number;
  cumulativeTaxable: number;
  cumulativeTax: number;
  currentMonthTax: number;
}

interface BankRow {
  id: string;
  date: string;
  bankRefNo: string;
  employeeName: string;
  bankAmount: number;
  systemAmount: number;
  status: string;
  diff: number;
}

const employeeStatusMap: Record<string, { color: string; text: string }> = {
  ONBOARD: { color: 'default', text: '待参保' },
  INSURED: { color: 'success', text: '正常参保' },
  SUSPENDED: { color: 'warning', text: '停缴' },
  OFFBOARD: { color: 'error', text: '已离职' },
};

const batchStatusMap: Record<string, { color: string; text: string; icon: any }> = {
  DRAFT: { color: 'default', text: '待提交', icon: ClockCircleOutlined },
  SUBMITTED: { color: 'processing', text: '已提交', icon: ClockCircleOutlined },
  BANK_PROCESSING: { color: 'warning', text: '银行处理中', icon: ClockCircleOutlined },
  PARTIAL_SUCCESS: { color: 'warning', text: '部分成功', icon: ExclamationCircleOutlined },
  SUCCESS: { color: 'success', text: '全部成功', icon: CheckCircleOutlined },
  FAILED: { color: 'error', text: '失败', icon: CloseCircleOutlined },
};

function FinanceConsole() {
  const [activeTab, setActiveTab] = useState('roster');
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [batchStatus, setBatchStatus] = useState('DRAFT');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [form] = Form.useForm();

  const summaryCards = useMemo(() => {
    const insuredCount = mockEmployees.filter(e => e.status === 'INSURED').length;
    let totalSalary = 0;
    let totalInsuranceFund = 0;
    let totalTax = 0;

    mockEmployees.forEach(emp => {
      const base = emp.insuranceBase;
      const plan = cityRatePlans[emp.cityCode];
      let personalInsurance = 0;
      let personalHousingFund = 0;

      if (plan) {
        plan.items.forEach(item => {
          if (item.type !== 'HOUSING_FUND') {
            personalInsurance += base * (item.personalRate / 100);
          } else {
            personalHousingFund += emp.housingFundBase * (item.personalRate / 100);
          }
        });
      }

      totalSalary += base;
      totalInsuranceFund += personalInsurance + personalHousingFund;

      const taxDeduction = emp.taxDeductions.reduce((sum, d) => sum + d.monthlyAmount, 0);
      const taxableIncome = Math.max(0, base - 5000 - personalInsurance - personalHousingFund - taxDeduction);
      let tax = 0;
      if (taxableIncome > 0) {
        if (taxableIncome <= 3000) tax = taxableIncome * 0.03;
        else if (taxableIncome <= 12000) tax = taxableIncome * 0.1 - 210;
        else if (taxableIncome <= 25000) tax = taxableIncome * 0.2 - 1410;
        else tax = taxableIncome * 0.25 - 2660;
      }
      totalTax += Math.max(0, tax);
    });

    return [
      { title: '参保员工数', value: `${insuredCount} 人`, icon: UserOutlined, color: '#1E40AF' },
      { title: '本月薪资总额', value: formatMoney(totalSalary), icon: DollarOutlined, color: '#059669' },
      { title: '本月社保公积金总额', value: formatMoney(totalInsuranceFund), icon: BankOutlined, color: '#7C3AED' },
      { title: '本月个税总额', value: formatMoney(totalTax), icon: CalculatorOutlined, color: '#D97706' },
    ];
  }, []);

  const employeeData: EmployeeRow[] = useMemo(() =>
    mockEmployees.map(e => ({
      id: e.id,
      employeeNo: e.employeeNo,
      name: e.name,
      department: e.department,
      cityCode: e.cityCode,
      cityName: CITY_NAMES[e.cityCode as keyof typeof CITY_NAMES],
      insuranceBase: e.insuranceBase,
      housingFundBase: e.housingFundBase,
      status: e.status,
    })), [mockEmployees]);

  const salaryData: SalaryRow[] = useMemo(() =>
    mockEmployees.map(e => {
      const base = e.insuranceBase;
      const plan = cityRatePlans[e.cityCode];
      let personalInsurance = 0;
      let personalHousingFund = 0;

      if (plan) {
        plan.items.forEach(item => {
          if (item.type !== 'HOUSING_FUND') {
            personalInsurance += base * (item.personalRate / 100);
          } else {
            personalHousingFund += e.housingFundBase * (item.personalRate / 100);
          }
        });
      }

      const taxDeduction = e.taxDeductions.reduce((sum, d) => sum + d.monthlyAmount, 0);
      const bonus = Math.floor(base * 0.15);
      const taxableIncome = Math.max(0, base + bonus - 5000 - personalInsurance - personalHousingFund - taxDeduction);
      let individualTax = 0;
      if (taxableIncome > 0) {
        if (taxableIncome <= 3000) individualTax = taxableIncome * 0.03;
        else if (taxableIncome <= 12000) individualTax = taxableIncome * 0.1 - 210;
        else if (taxableIncome <= 25000) individualTax = taxableIncome * 0.2 - 1410;
        else individualTax = taxableIncome * 0.25 - 2660;
      }
      individualTax = Math.max(0, Math.round(individualTax * 100) / 100);

      return {
        id: e.id,
        employeeNo: e.employeeNo,
        name: e.name,
        department: e.department,
        baseSalary: base,
        bonus,
        personalInsurance: Math.round(personalInsurance * 100) / 100,
        personalHousingFund: Math.round(personalHousingFund * 100) / 100,
        taxDeduction,
        individualTax,
        netSalary: Math.round((base + bonus - personalInsurance - personalHousingFund - individualTax) * 100) / 100,
      };
    }), [mockEmployees]);

  const taxData: TaxRow[] = useMemo(() =>
    mockEmployees.map((e, idx) => {
      const base = e.insuranceBase;
      const plan = cityRatePlans[e.cityCode];
      let personalInsurance = 0;
      if (plan) {
        plan.items.forEach(item => {
          if (item.type !== 'HOUSING_FUND') personalInsurance += base * (item.personalRate / 100);
          else personalInsurance += e.housingFundBase * (item.personalRate / 100);
        });
      }
      const taxDeduction = e.taxDeductions.reduce((sum, d) => sum + d.monthlyAmount, 0);
      const months = idx + 1;
      const cumulativeIncome = base * months;
      const cumulativeDeduction = (5000 + personalInsurance + taxDeduction) * months;
      const cumulativeTaxable = Math.max(0, cumulativeIncome - cumulativeDeduction);
      let cumulativeTax = 0;
      if (cumulativeTaxable > 0) {
        if (cumulativeTaxable <= 36000) cumulativeTax = cumulativeTaxable * 0.03;
        else if (cumulativeTaxable <= 144000) cumulativeTax = cumulativeTaxable * 0.1 - 2520;
        else cumulativeTax = cumulativeTaxable * 0.2 - 16920;
      }
      const currentMonthTax = Math.max(0, Math.round((cumulativeTax / months) * 100) / 100);

      return {
        id: e.id,
        employeeNo: e.employeeNo,
        name: e.name,
        cumulativeIncome: Math.round(cumulativeIncome * 100) / 100,
        cumulativeDeduction: Math.round(cumulativeDeduction * 100) / 100,
        cumulativeTaxable: Math.round(cumulativeTaxable * 100) / 100,
        cumulativeTax: Math.round(Math.max(0, cumulativeTax) * 100) / 100,
        currentMonthTax,
      };
    }), [mockEmployees]);

  const bankData: BankRow[] = useMemo(() => {
    const records: BankRow[] = [];
    mockEmployees.forEach((e, idx) => {
      const base = e.insuranceBase;
      const plan = cityRatePlans[e.cityCode];
      let personalInsurance = 0;
      let personalHousingFund = 0;
      if (plan) {
        plan.items.forEach(item => {
          if (item.type !== 'HOUSING_FUND') personalInsurance += base * (item.personalRate / 100);
          else personalHousingFund += e.housingFundBase * (item.personalRate / 100);
        });
      }
      const taxDeduction = e.taxDeductions.reduce((sum, d) => sum + d.monthlyAmount, 0);
      const taxableIncome = Math.max(0, base - 5000 - personalInsurance - personalHousingFund - taxDeduction);
      let tax = 0;
      if (taxableIncome > 0) {
        if (taxableIncome <= 3000) tax = taxableIncome * 0.03;
        else if (taxableIncome <= 12000) tax = taxableIncome * 0.1 - 210;
        else tax = taxableIncome * 0.2 - 1410;
      }
      const netSalary = Math.round((base - personalInsurance - personalHousingFund - Math.max(0, tax)) * 100) / 100;
      const hasDiff = idx % 4 === 0;
      const diff = hasDiff ? (idx % 2 === 0 ? 100 : -50) : 0;

      records.push({
        id: `B${idx + 1}`,
        date: dayjs().subtract(idx, 'day').format('YYYY-MM-DD'),
        bankRefNo: `BK${20250620}${String(idx + 1).padStart(4, '0')}`,
        employeeName: e.name,
        bankAmount: netSalary + diff,
        systemAmount: netSalary,
        status: hasDiff ? 'DIFF' : 'MATCHED',
        diff,
      });
    });
    return records;
  }, [mockEmployees]);

  const employeeColumns: ColumnsType<EmployeeRow> = [
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '工号', dataIndex: 'employeeNo', key: 'employeeNo', width: 100 },
    { title: '部门', dataIndex: 'department', key: 'department', width: 120 },
    { title: '城市', dataIndex: 'cityName', key: 'cityName', width: 100 },
    { title: '社保基数', dataIndex: 'insuranceBase', key: 'insuranceBase', width: 120, render: (v) => formatMoney(v) },
    { title: '公积金基数', dataIndex: 'housingFundBase', key: 'housingFundBase', width: 120, render: (v) => formatMoney(v) },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s) => {
        const cfg = employeeStatusMap[s] || { color: 'default', text: s };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
        </Space>
      ),
    },
  ];

  const salaryColumns: ColumnsType<SalaryRow> = [
    { title: '工号', dataIndex: 'employeeNo', key: 'employeeNo', width: 100, fixed: 'left' },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100, fixed: 'left' },
    { title: '部门', dataIndex: 'department', key: 'department', width: 120 },
    { title: '基本工资', dataIndex: 'baseSalary', key: 'baseSalary', width: 120, render: (v) => formatMoney(v) },
    { title: '奖金', dataIndex: 'bonus', key: 'bonus', width: 100, render: (v) => formatMoney(v) },
    { title: '社保(个人)', dataIndex: 'personalInsurance', key: 'personalInsurance', width: 120, render: (v) => formatMoney(v) },
    { title: '公积金(个人)', dataIndex: 'personalHousingFund', key: 'personalHousingFund', width: 120, render: (v) => formatMoney(v) },
    { title: '专项附加扣除', dataIndex: 'taxDeduction', key: 'taxDeduction', width: 130, render: (v) => formatMoney(v) },
    { title: '个税', dataIndex: 'individualTax', key: 'individualTax', width: 110, render: (v) => formatMoney(v) },
    {
      title: '实发工资',
      dataIndex: 'netSalary',
      key: 'netSalary',
      width: 130,
      fixed: 'right',
      render: (v) => <span className="font-semibold text-[#059669]">{formatMoney(v)}</span>,
    },
  ];

  const taxColumns: ColumnsType<TaxRow> = [
    { title: '工号', dataIndex: 'employeeNo', key: 'employeeNo', width: 100 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '累计收入', dataIndex: 'cumulativeIncome', key: 'cumulativeIncome', width: 140, render: (v) => formatMoney(v) },
    { title: '累计扣除', dataIndex: 'cumulativeDeduction', key: 'cumulativeDeduction', width: 140, render: (v) => formatMoney(v) },
    { title: '累计应纳税所得', dataIndex: 'cumulativeTaxable', key: 'cumulativeTaxable', width: 160, render: (v) => formatMoney(v) },
    { title: '累计已预缴税额', dataIndex: 'cumulativeTax', key: 'cumulativeTax', width: 150, render: (v) => formatMoney(v) },
    {
      title: '本月应预扣税额',
      dataIndex: 'currentMonthTax',
      key: 'currentMonthTax',
      width: 140,
      render: (v) => <span className="font-semibold">{formatMoney(v)}</span>,
    },
  ];

  const bankColumns: ColumnsType<BankRow> = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    { title: '银行流水号', dataIndex: 'bankRefNo', key: 'bankRefNo', width: 180 },
    { title: '员工姓名', dataIndex: 'employeeName', key: 'employeeName', width: 120 },
    { title: '银行金额', dataIndex: 'bankAmount', key: 'bankAmount', width: 130, render: (v) => formatMoney(v) },
    { title: '系统金额', dataIndex: 'systemAmount', key: 'systemAmount', width: 130, render: (v) => formatMoney(v) },
    {
      title: '差异',
      dataIndex: 'diff',
      key: 'diff',
      width: 110,
      render: (v, record) => (
        <span style={{ color: record.status === 'DIFF' ? '#DC2626' : '#059669', fontWeight: 600 }}>
          {v === 0 ? '-' : (v > 0 ? `+${formatMoney(v).replace('¥', '')}` : `-${formatMoney(Math.abs(v)).replace('¥', '')}`)}
        </span>
      ),
    },
    {
      title: '匹配状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s) => (
        s === 'MATCHED'
          ? <Tag color="success">已匹配</Tag>
          : <Tag color="error">有差异</Tag>
      ),
    },
  ];

  const handleEdit = (record: EmployeeRow) => {
    setCurrentEmployee(record);
    form.setFieldsValue({
      name: record.name,
      department: record.department,
      insuranceBase: record.insuranceBase,
      housingFundBase: record.housingFundBase,
    });
    setEditModalVisible(true);
  };

  const handleView = (record: any) => {
    setCurrentEmployee(mockEmployees.find(e => e.id === record.id));
    setViewModalVisible(true);
  };

  const handleEditSubmit = () => {
    form.validateFields().then(() => {
      message.success('员工信息更新成功');
      setEditModalVisible(false);
    });
  };

  const handleSubmitToBank = () => {
    if (batchStatus === 'DRAFT' || batchStatus === 'FAILED') {
      setBatchStatus('SUBMITTED');
      message.success('已提交至银行处理');
      setTimeout(() => setBatchStatus('BANK_PROCESSING'), 1500);
      setTimeout(() => setBatchStatus('SUCCESS'), 3500);
    }
  };

  const batchCfg = batchStatusMap[batchStatus];
  const BatchStatusIcon = batchCfg.icon;

  const renderRosterTab = () => (
    <div>
      <div className="mb-4 flex justify-end">
        <Button type="primary" icon={<ImportOutlined />}>
          批量导入
        </Button>
      </div>
      <Table
        columns={employeeColumns}
        dataSource={employeeData}
        rowKey="id"
        scroll={{ x: 900 }}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );

  const renderSalaryTab = () => (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Space>
          <span className="text-gray-600">选择月份：</span>
          <Select
            style={{ width: 160 }}
            value={selectedMonth}
            onChange={setSelectedMonth}
            options={Array.from({ length: 6 }, (_, i) => {
              const m = dayjs().subtract(i, 'month');
              return { label: m.format('YYYY年MM月'), value: m.format('YYYY-MM') };
            })}
          />
        </Space>
        <Button icon={<UploadOutlined />}>导入薪资表</Button>
      </div>
      <Table
        columns={salaryColumns}
        dataSource={salaryData}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 10 }}
        summary={(pageData) => {
          let totalBase = 0, totalBonus = 0, totalIns = 0, totalHf = 0, totalTax = 0, totalNet = 0;
          pageData.forEach(row => {
            totalBase += row.baseSalary;
            totalBonus += row.bonus;
            totalIns += row.personalInsurance;
            totalHf += row.personalHousingFund;
            totalTax += row.individualTax;
            totalNet += row.netSalary;
          });
          return (
            <Table.Summary fixed>
              <Table.Summary.Row style={{ fontWeight: 600, background: '#F8FAFC' }}>
                <Table.Summary.Cell index={0} colSpan={3}>本页合计</Table.Summary.Cell>
                <Table.Summary.Cell index={3}>{formatMoney(totalBase)}</Table.Summary.Cell>
                <Table.Summary.Cell index={4}>{formatMoney(totalBonus)}</Table.Summary.Cell>
                <Table.Summary.Cell index={5}>{formatMoney(totalIns)}</Table.Summary.Cell>
                <Table.Summary.Cell index={6}>{formatMoney(totalHf)}</Table.Summary.Cell>
                <Table.Summary.Cell index={7}>-</Table.Summary.Cell>
                <Table.Summary.Cell index={8}>{formatMoney(totalTax)}</Table.Summary.Cell>
                <Table.Summary.Cell index={9} style={{ color: '#059669' }}>{formatMoney(totalNet)}</Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />
      <div className="mt-6 p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center justify-between">
        <Space size="large">
          <span className="text-gray-600">银行直连状态：</span>
          <Tag color={batchCfg.color} icon={<BatchStatusIcon />}>
            {batchCfg.text}
          </Tag>
          {batchStatus === 'SUCCESS' && (
            <span className="text-gray-500 text-sm">共 {salaryData.length} 笔，总金额 {formatMoney(salaryData.reduce((s, r) => s + r.netSalary, 0))}</span>
          )}
        </Space>
        <Space>
          <Button disabled={batchStatus === 'BANK_PROCESSING'}>
            查看银行回执
          </Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmitToBank}
            disabled={batchStatus === 'BANK_PROCESSING' || batchStatus === 'SUCCESS'}
            loading={batchStatus === 'BANK_PROCESSING'}
          >
            {batchStatus === 'DRAFT' || batchStatus === 'FAILED' ? '提交银行代发' : batchStatus === 'SUBMITTED' ? '已提交' : batchStatus === 'BANK_PROCESSING' ? '银行处理中' : '代发完成'}
          </Button>
        </Space>
      </div>
    </div>
  );

  const renderTaxTab = () => (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <Space>
          <span className="text-gray-600">税款所属期：{dayjs().format('YYYY年MM月')}</span>
        </Space>
        <Space>
          <Button icon={<SyncOutlined />}>同步专项附加扣除</Button>
          <Button type="primary" icon={<DownloadOutlined />}>
            导出申报文件
          </Button>
        </Space>
      </div>
      <Table
        columns={taxColumns}
        dataSource={taxData}
        rowKey="id"
        scroll={{ x: 1000 }}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );

  const renderBankTab = () => (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <Space>
          <Tag color="success">已匹配：{bankData.filter(b => b.status === 'MATCHED').length} 笔</Tag>
          <Tag color="error">有差异：{bankData.filter(b => b.status === 'DIFF').length} 笔</Tag>
        </Space>
        <Space>
          <Button icon={<UploadOutlined />}>导入银行流水</Button>
          <Button type="primary" icon={<SyncOutlined />}>自动对账</Button>
        </Space>
      </div>
      <Table
        columns={bankColumns}
        dataSource={bankData}
        rowKey="id"
        scroll={{ x: 900 }}
        pagination={{ pageSize: 10 }}
        rowClassName={(record) => record.status === 'DIFF' ? 'bg-red-50' : ''}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">企业财务控制台</h2>
        <p className="text-gray-500 mt-1">统一管理员工薪资核算、社保公积金缴纳及个税申报</p>
      </div>

      <Row gutter={[16, 16]}>
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Col xs={24} sm={12} lg={6} key={idx}>
              <Card hoverable className="!border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ background: `${card.color}15`, color: card.color }}
                  >
                    <Icon style={{ fontSize: 24 }} />
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Card className="!border-[#E2E8F0]" bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarStyle={{ paddingLeft: 16, paddingRight: 16, marginBottom: 0 }}
          items={[
            { key: 'roster', label: '员工花名册', children: <div className="p-6">{renderRosterTab()}</div> },
            { key: 'salary', label: '薪资核算与代发', children: <div className="p-6">{renderSalaryTab()}</div> },
            { key: 'tax', label: '个税申报', children: <div className="p-6">{renderTaxTab()}</div> },
            { key: 'bank', label: '银行对账', children: <div className="p-6">{renderBankTab()}</div> },
          ]}
        />
      </Card>

      <Modal
        title="编辑员工信息"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleEditSubmit}
        okText="保存"
        cancelText="取消"
        width={520}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="部门" name="department" rules={[{ required: true, message: '请输入部门' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="社保基数" name="insuranceBase" rules={[{ required: true, message: '请输入社保基数' }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="公积金基数" name="housingFundBase" rules={[{ required: true, message: '请输入公积金基数' }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="员工详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>关闭</Button>,
        ]}
        width={600}
      >
        {currentEmployee && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-[#F0F9FF] rounded-lg">
              <div className="w-14 h-14 rounded-full bg-[#1E40AF] flex items-center justify-center text-white text-xl font-bold">
                {currentEmployee.name?.charAt(0)}
              </div>
              <div>
                <p className="text-lg font-bold">{currentEmployee.name}</p>
                <p className="text-gray-500 text-sm">{currentEmployee.employeeNo} · {currentEmployee.department} · {currentEmployee.position}</p>
              </div>
            </div>
            <Row gutter={[16, 8]}>
              <Col span={12}><span className="text-gray-500">身份证号：</span>{currentEmployee.idNumber}</Col>
              <Col span={12}><span className="text-gray-500">手机号：</span>{currentEmployee.phone}</Col>
              <Col span={12}><span className="text-gray-500">参保城市：</span>{CITY_NAMES[currentEmployee.cityCode as keyof typeof CITY_NAMES]}</Col>
              <Col span={12}><span className="text-gray-500">入职日期：</span>{currentEmployee.entryDate}</Col>
              <Col span={12}><span className="text-gray-500">社保基数：</span>{formatMoney(currentEmployee.insuranceBase)}</Col>
              <Col span={12}><span className="text-gray-500">公积金基数：</span>{formatMoney(currentEmployee.housingFundBase)}</Col>
            </Row>
            {currentEmployee.taxDeductions?.length > 0 && (
              <div>
                <p className="text-gray-700 font-medium mb-2">专项附加扣除：</p>
                <Space wrap>
                  {currentEmployee.taxDeductions.map((d: any, idx: number) => (
                    <Tag key={idx} color="blue">{d.name}：{formatMoney(d.monthlyAmount)}/月</Tag>
                  ))}
                </Space>
              </div>
            )}
            <div>
              <p className="text-gray-700 font-medium mb-2">参保项目：</p>
              <Space wrap>
                {currentEmployee.selectedItems?.map((t: string) => (
                  <Tag key={t} color="green">{INSURANCE_NAMES[t as keyof typeof INSURANCE_NAMES]}</Tag>
                ))}
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default FinanceConsole;
