import { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Col,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { policyDocuments, cityRatePlans } from 'shared/mockData';
import { CITY_NAMES, CITIES, INSURANCE_NAMES, InsuranceType } from 'shared/types';
import { formatDate } from '@/utils/format';

interface PolicyRow {
  id: string;
  cityCode: string;
  cityName: string;
  title: string;
  docNo: string;
  effectiveDate: string;
  status: 'EFFECTIVE' | 'EXPIRED';
  category: string;
}

interface RateRow {
  key: string;
  cityCode: string;
  cityName: string;
  insuranceType: InsuranceType;
  insuranceName: string;
  personalRate: number;
  companyRate: number;
  fixedAmount?: number;
}

const EditableCell = ({
  editing,
  dataIndex,
  title,
  record,
  index,
  children,
  ...restProps
}: any) => {
  const inputNode = dataIndex === 'fixedAmount'
    ? <InputNumber min={0} precision={2} />
    : <InputNumber min={0} max={100} precision={2} />;
  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[{ required: true, message: `请输入${title}` }]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

function AdminPolicy() {
  const [policyList, setPolicyList] = useState<PolicyRow[]>(
    policyDocuments.map(p => ({
      id: p.id,
      cityCode: p.cityCode,
      cityName: p.cityName,
      title: p.title,
      docNo: p.docNo,
      effectiveDate: p.effectiveDate,
      status: p.status,
      category: p.category,
    }))
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyRow | null>(null);
  const [viewingPolicy, setViewingPolicy] = useState<any>(null);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');
  const [rateForm] = Form.useForm();

  const isEditing = (record: RateRow) => record.key === editingKey;

  const rateData: RateRow[] = useMemo(() => {
    const rows: RateRow[] = [];
    CITIES.forEach(cityCode => {
      const plan = cityRatePlans[cityCode];
      if (plan) {
        plan.items.forEach(item => {
          rows.push({
            key: `${cityCode}-${item.type}`,
            cityCode,
            cityName: CITY_NAMES[cityCode],
            insuranceType: item.type,
            insuranceName: item.name,
            personalRate: item.personalRate,
            companyRate: item.companyRate,
            fixedAmount: item.fixedAmount,
          });
        });
      }
    });
    return rows;
  }, []);

  const [rateTableData, setRateTableData] = useState<RateRow[]>(rateData);

  const policyColumns: ColumnsType<PolicyRow> = [
    { title: '城市', dataIndex: 'cityName', key: 'cityName', width: 100 },
    { title: '文号', dataIndex: 'docNo', key: 'docNo', width: 200 },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '分类', dataIndex: 'category', key: 'category', width: 120 },
    {
      title: '生效日期',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      width: 120,
      render: (v) => formatDate(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s) => (
        s === 'EFFECTIVE'
          ? <Tag color="success">生效中</Tag>
          : <Tag color="default">已废止</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该政策？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingPolicy(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: PolicyRow) => {
    setEditingPolicy(record);
    form.setFieldsValue({
      ...record,
      effectiveDate: record.effectiveDate ? require('dayjs')(record.effectiveDate) : null,
    });
    setModalVisible(true);
  };

  const handleView = (record: PolicyRow) => {
    setViewingPolicy(policyDocuments.find(p => p.id === record.id) || record);
    setViewModalVisible(true);
  };

  const handleDelete = (id: string) => {
    setPolicyList(prev => prev.filter(p => p.id !== id));
    message.success('删除成功');
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      const data: PolicyRow = {
        ...values,
        cityName: CITY_NAMES[values.cityCode as keyof typeof CITY_NAMES] || values.cityCode,
        effectiveDate: values.effectiveDate?.format('YYYY-MM-DD'),
        status: values.status || 'EFFECTIVE',
      };
      if (editingPolicy) {
        setPolicyList(prev => prev.map(p => p.id === editingPolicy.id ? { ...p, ...data } : p));
        message.success('更新成功');
      } else {
        setPolicyList(prev => [...prev, { ...data, id: `P${Date.now()}` }]);
        message.success('新增成功');
      }
      setModalVisible(false);
    });
  };

  const editRate = (record: RateRow) => {
    rateForm.setFieldsValue({ ...record });
    setEditingKey(record.key);
  };

  const cancelRateEdit = () => {
    setEditingKey('');
  };

  const saveRateEdit = async (key: string) => {
    try {
      const row = await rateForm.validateFields();
      const newData = [...rateTableData];
      const index = newData.findIndex(item => key === item.key);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, { ...item, ...row });
        setRateTableData(newData);
        setEditingKey('');
        message.success('费率更新成功');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const rateColumns = [
    {
      title: '城市',
      dataIndex: 'cityName',
      key: 'cityName',
      width: 100,
      fixed: 'left',
    },
    {
      title: '险种',
      dataIndex: 'insuranceName',
      key: 'insuranceName',
      width: 120,
      fixed: 'left',
    },
    {
      title: '个人比例(%)',
      dataIndex: 'personalRate',
      key: 'personalRate',
      width: 140,
      editable: true,
      align: 'center',
      render: (v: number) => v.toFixed(2),
    },
    {
      title: '企业比例(%)',
      dataIndex: 'companyRate',
      key: 'companyRate',
      width: 140,
      editable: true,
      align: 'center',
      render: (v: number) => v.toFixed(2),
    },
    {
      title: '固定金额(元)',
      dataIndex: 'fixedAmount',
      key: 'fixedAmount',
      width: 140,
      editable: true,
      align: 'center',
      render: (v?: number) => v === undefined ? '-' : v.toFixed(2),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_: any, record: RateRow) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => saveRateEdit(record.key)}
              style={{ padding: 0 }}
            >
              保存
            </Button>
            <Button
              type="link"
              size="small"
              icon={<CloseOutlined />}
              onClick={cancelRateEdit}
              style={{ padding: 0 }}
            >
              取消
            </Button>
          </Space>
        ) : (
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            disabled={editingKey !== ''}
            onClick={() => editRate(record)}
          >
            编辑
          </Button>
        );
      },
    },
  ];

  const mergedRateColumns = rateColumns.map(col => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: RateRow) => ({
        record,
        inputType: 'number',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">政策与费率管理</h2>
        <p className="text-gray-500 mt-1">维护各城市社保公积金政策法规与缴费费率配置</p>
      </div>

      <Card className="!border-[#E2E8F0]" bodyStyle={{ padding: 0 }}>
        <Tabs
          tabBarStyle={{ paddingLeft: 16, paddingRight: 16, marginBottom: 0 }}
          items={[
            {
              key: 'documents',
              label: '政策法规维护',
              children: (
                <div className="p-6">
                  <div className="mb-4 flex justify-between items-center">
                    <Space>
                      <Select
                        placeholder="选择城市"
                        style={{ width: 140 }}
                        allowClear
                        options={CITIES.map(c => ({ label: CITY_NAMES[c], value: c }))}
                      />
                      <Select
                        placeholder="状态"
                        style={{ width: 120 }}
                        allowClear
                        options={[
                          { label: '生效中', value: 'EFFECTIVE' },
                          { label: '已废止', value: 'EXPIRED' },
                        ]}
                      />
                      <Input
                        placeholder="搜索文号/标题"
                        style={{ width: 240 }}
                        prefix={<SearchOutlined className="text-gray-400" />}
                      />
                    </Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                      新增政策
                    </Button>
                  </div>

                  <Table
                    columns={policyColumns}
                    dataSource={policyList}
                    rowKey="id"
                    scroll={{ x: 1100 }}
                    pagination={{ pageSize: 10 }}
                  />
                </div>
              ),
            },
            {
              key: 'rates',
              label: '费率配置',
              children: (
                <div className="p-6">
                  <div className="mb-4 flex justify-between items-center">
                    <Space>
                      <Select
                        placeholder="选择城市"
                        style={{ width: 140 }}
                        allowClear
                        options={CITIES.map(c => ({ label: CITY_NAMES[c], value: c }))}
                      />
                      <span className="text-gray-500 text-sm">
                        点击"编辑"修改对应险种的缴费比例，修改后点击"保存"确认
                      </span>
                    </Space>
                    <Button>导出费率表</Button>
                  </div>

                  <Form.Provider
                    onFormFinish={(name, { values, forms }) => {
                      if (name === 'rateForm') {
                        const { rateForm: form } = forms as any;
                      }
                    }}
                  >
                    <Form form={rateForm} component={false}>
                      <Table
                        components={{
                          body: {
                            cell: EditableCell,
                          },
                        }}
                        bordered
                        columns={mergedRateColumns as any}
                        dataSource={rateTableData}
                        rowKey="key"
                        scroll={{ x: 700 }}
                        pagination={{ pageSize: 12 }}
                      />
                    </Form>
                  </Form.Provider>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editingPolicy ? '编辑政策' : '新增政策'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleModalOk}
        okText="保存"
        cancelText="取消"
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-2">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="适用城市"
                name="cityCode"
                rules={[{ required: true, message: '请选择城市' }]}
              >
                <Select
                  placeholder="请选择城市"
                  options={[
                    { label: '全国', value: 'NATIONAL' },
                    ...CITIES.map(c => ({ label: CITY_NAMES[c], value: c })),
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="分类"
                name="category"
                rules={[{ required: true, message: '请输入分类' }]}
              >
                <Select
                  placeholder="请选择或输入"
                  mode={undefined}
                  options={[
                    { label: '养老保险', value: '养老保险' },
                    { label: '医疗保险', value: '医疗保险' },
                    { label: '失业保险', value: '失业保险' },
                    { label: '工伤保险', value: '工伤保险' },
                    { label: '生育保险', value: '生育保险' },
                    { label: '住房公积金', value: '住房公积金' },
                    { label: '综合', value: '综合' },
                    { label: '税务法规', value: '税务法规' },
                    { label: '基础法律', value: '基础法律' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="文号"
                name="docNo"
                rules={[{ required: true, message: '请输入文号' }]}
              >
                <Input placeholder="如：京人社养发〔2025〕12号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="发文机关"
                name="issuingAuthority"
                rules={[{ required: true, message: '请输入发文机关' }]}
              >
                <Input placeholder="如：北京市人社局" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="政策标题"
            name="title"
            rules={[{ required: true, message: '请输入政策标题' }]}
          >
            <Input placeholder="请输入政策标题" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="发布日期"
                name="issueDate"
                rules={[{ required: true, message: '请选择发布日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="生效日期"
                name="effectiveDate"
                rules={[{ required: true, message: '请选择生效日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="状态"
                name="status"
                initialValue="EFFECTIVE"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: '生效中', value: 'EFFECTIVE' },
                    { label: '已废止', value: 'EXPIRED' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="标签" name="tags">
                <Select
                  mode="tags"
                  placeholder="输入标签后回车"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="政策内容" name="content">
            <Input.TextArea rows={4} placeholder="请输入政策详细内容" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="政策详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>关闭</Button>,
        ]}
        width={720}
      >
        {viewingPolicy && (
          <div className="space-y-4">
            <div className="p-4 bg-[#F0F9FF] rounded-lg border border-[#BFDBFE]">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{viewingPolicy.title}</h3>
              <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                <span>文号：{viewingPolicy.docNo}</span>
                <span>·</span>
                <span>{viewingPolicy.issuingAuthority}</span>
                <span>·</span>
                <span>{viewingPolicy.cityName}</span>
              </div>
            </div>
            <Row gutter={[16, 8]}>
              <Col span={8}>
                <span className="text-gray-500">分类：</span>
                <Tag color="blue">{viewingPolicy.category}</Tag>
              </Col>
              <Col span={8}>
                <span className="text-gray-500">发布日期：</span>
                {formatDate(viewingPolicy.issueDate)}
              </Col>
              <Col span={8}>
                <span className="text-gray-500">生效日期：</span>
                {formatDate(viewingPolicy.effectiveDate)}
              </Col>
            </Row>
            {viewingPolicy.tags?.length > 0 && (
              <div>
                <span className="text-gray-500 mr-2">标签：</span>
                <Space wrap>
                  {viewingPolicy.tags.map((t: string, i: number) => (
                    <Tag key={i}>{t}</Tag>
                  ))}
                </Space>
              </div>
            )}
            {viewingPolicy.applicableGroups?.length > 0 && (
              <div>
                <span className="text-gray-500 mr-2">适用群体：</span>
                <Space wrap>
                  {viewingPolicy.applicableGroups.map((g: string, i: number) => (
                    <Tag key={i} color="green">{g}</Tag>
                  ))}
                </Space>
              </div>
            )}
            <div>
              <p className="text-gray-700 font-medium mb-2">政策内容：</p>
              <div className="p-4 bg-gray-50 rounded text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: viewingPolicy.content || '<p class="text-gray-400">暂无详细内容</p>' }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminPolicy;
