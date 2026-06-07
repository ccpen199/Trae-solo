import React, { useEffect, useState } from 'react';
import {
  Card,
  Tabs,
  Table,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Modal,
  Tag,
  Row,
  Col,
  Spin,
  message,
  Space,
} from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import {
  getListings,
  createListing,
  getAppointments,
  createAppointment,
  getContracts,
  createContract,
  signContract,
  getAgents,
  getBuyers,
  getBuildings,
} from '@/api';

interface ListingItem {
  id: number;
  title: string;
  price: number;
  area: number;
  rooms: string;
  type: string;
  status?: string;
}

interface OptionItem {
  id: number;
  name?: string;
  title?: string;
}

interface AppointmentItem {
  id: number;
  listing_id: number;
  listing_title?: string;
  agent_id: number;
  agent_name?: string;
  buyer_id: number;
  buyer_name?: string;
  appointment_time: string;
  status: string;
  notes?: string;
}

interface ContractItem {
  id: number;
  listing_id: number;
  listing_title?: string;
  buyer_id: number;
  buyer_name?: string;
  agent_id: number;
  agent_name?: string;
  contract_no?: string;
  amount: number;
  status: string;
  created_at: string;
  signed_at?: string;
}

const statusMap: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
  pending: { color: 'orange', icon: <ClockCircleOutlined />, text: '待处理' },
  confirmed: { color: 'blue', icon: <CheckCircleOutlined />, text: '已确认' },
  completed: { color: 'green', icon: <CheckCircleOutlined />, text: '已完成' },
  cancelled: { color: 'red', icon: <CloseCircleOutlined />, text: '已取消' },
  unsigned: { color: 'orange', icon: <EditOutlined />, text: '待签署' },
  signed: { color: 'green', icon: <CheckCircleOutlined />, text: '已签署' },
  在售: { color: 'green', icon: <CheckCircleOutlined />, text: '在售' },
  已售: { color: 'default', icon: <CheckCircleOutlined />, text: '已售' },
  已下架: { color: 'default', icon: <CloseCircleOutlined />, text: '已下架' },
  待确认: { color: 'orange', icon: <ClockCircleOutlined />, text: '待确认' },
  已确认: { color: 'blue', icon: <CheckCircleOutlined />, text: '已确认' },
  已完成: { color: 'green', icon: <CheckCircleOutlined />, text: '已完成' },
  已取消: { color: 'red', icon: <CloseCircleOutlined />, text: '已取消' },
  起草中: { color: 'orange', icon: <EditOutlined />, text: '起草中' },
  待签署: { color: 'orange', icon: <EditOutlined />, text: '待签署' },
  已签署: { color: 'green', icon: <CheckCircleOutlined />, text: '已签署' },
  已作废: { color: 'red', icon: <CloseCircleOutlined />, text: '已作废' },
};

const statusTag = (value?: string) => {
  const s = statusMap[value || 'pending'] || statusMap.pending;
  return <Tag color={s.color} icon={s.icon}>{s.text}</Tag>;
};

const AgentSpace: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [agents, setAgents] = useState<OptionItem[]>([]);
  const [buyers, setBuyers] = useState<OptionItem[]>([]);
  const [buildings, setBuildings] = useState<OptionItem[]>([]);
  const [addListingModal, setAddListingModal] = useState(false);
  const [addAppointmentModal, setAddAppointmentModal] = useState(false);
  const [addContractModal, setAddContractModal] = useState(false);
  const [listingForm] = Form.useForm();
  const [appointmentForm] = Form.useForm();
  const [contractForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lRes, aRes, cRes, agentRes, buyerRes, buildingRes]: any[] = await Promise.all([
        getListings({ pageSize: 100 }),
        getAppointments({ pageSize: 100 }),
        getContracts({ pageSize: 100 }),
        getAgents({ pageSize: 100 }),
        getBuyers({ pageSize: 100 }),
        getBuildings({ pageSize: 100 }),
      ]);
      setListings(lRes?.list || []);
      setAppointments(aRes?.list || []);
      setContracts(cRes?.list || []);
      setAgents(agentRes?.list || []);
      setBuyers(buyerRes?.list || []);
      setBuildings(buildingRes?.list || []);
    } catch {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openListingModal = () => {
    listingForm.setFieldsValue({
      building_id: buildings[0]?.id || 1,
      agent_id: agents[0]?.id || 1,
      title: '线上新增优质房源',
      type: '二手房',
      price: 980,
      area: 88,
      rooms: '2室1厅',
      floor: '中层',
      orientation: '南',
      decoration: '精装',
      owner_name: '业主',
      owner_phone: '138****0000',
      description: '交通便利，配套成熟，可安排带看。',
    });
    setAddListingModal(true);
  };

  const openAppointmentModal = () => {
    const firstListing = listings[0];
    appointmentForm.setFieldsValue({
      listing_id: firstListing?.id,
      agent_id: firstListing?.id ? (firstListing as any).agent_id || agents[0]?.id : agents[0]?.id,
      buyer_id: buyers[0]?.id,
      appointment_time: '2026-06-06 14:00',
      status: '待确认',
      notes: '客户从本地页面提交看房预约',
    });
    setAddAppointmentModal(true);
  };

  const openContractModal = () => {
    const firstListing = listings[0];
    contractForm.setFieldsValue({
      listing_id: firstListing?.id,
      agent_id: (firstListing as any)?.agent_id || agents[0]?.id,
      buyer_id: buyers[0]?.id,
      contract_no: `HT-${Date.now()}`,
      amount: Math.round((firstListing?.price || 100) * 10000),
      status: '起草中',
    });
    setAddContractModal(true);
  };

  const handleCreateListing = async (values: any) => {
    try {
      await createListing({
        ...values,
        status: '在售',
        property_status: 'pending',
      });
      message.success('房源创建成功');
      setAddListingModal(false);
      listingForm.resetFields();
      fetchData();
    } catch (e: any) {
      message.error(e.message || '房源创建失败');
    }
  };

  const handleCreateAppointment = async (values: any) => {
    try {
      await createAppointment(values);
      message.success('带看预约创建成功');
      setAddAppointmentModal(false);
      appointmentForm.resetFields();
      fetchData();
    } catch (e: any) {
      message.error(e.message || '预约创建失败');
    }
  };

  const handleCreateContract = async (values: any) => {
    try {
      await createContract(values);
      message.success('合同创建成功');
      setAddContractModal(false);
      contractForm.resetFields();
      fetchData();
    } catch (e: any) {
      message.error(e.message || '合同创建失败');
    }
  };

  const handleSignContract = (id: number) => {
    Modal.confirm({
      title: '确认签署合同',
      content: '签署后合同将生效，请确认合同内容无误。',
      okText: '确认签署',
      cancelText: '取消',
      onOk: async () => {
        try {
          await signContract(id);
          message.success('合同签署成功');
          fetchData();
        } catch {
          message.error('签署失败');
        }
      },
    });
  };

  const listingColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '价格', dataIndex: 'price', key: 'price', render: (v: number) => <span className="price-text">{v.toLocaleString()}万</span> },
    { title: '面积', dataIndex: 'area', key: 'area', render: (v: number) => `${v}㎡` },
    { title: '户型', dataIndex: 'rooms', key: 'rooms' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: statusTag },
  ];

  const appointmentColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '房源', dataIndex: 'listing_title', key: 'listing_title', ellipsis: true },
    { title: '经纪人', dataIndex: 'agent_name', key: 'agent_name', render: (v: string, r: AppointmentItem) => v || r.agent_id },
    { title: '购房者', dataIndex: 'buyer_name', key: 'buyer_name', render: (v: string, r: AppointmentItem) => v || r.buyer_id },
    { title: '预约时间', dataIndex: 'appointment_time', key: 'appointment_time' },
    { title: '状态', dataIndex: 'status', key: 'status', render: statusTag },
    { title: '备注', dataIndex: 'notes', key: 'notes', ellipsis: true },
  ];

  const contractColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '合同号', dataIndex: 'contract_no', key: 'contract_no', render: (v: string) => v || '待生成' },
    { title: '房源', dataIndex: 'listing_title', key: 'listing_title', ellipsis: true },
    { title: '买方', dataIndex: 'buyer_name', key: 'buyer_name', render: (v: string, r: ContractItem) => v || r.buyer_id },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => <span className="price-text">¥{v?.toLocaleString()}</span> },
    { title: '状态', dataIndex: 'status', key: 'status', render: statusTag },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ContractItem) =>
        record.status !== '已签署' && record.status !== 'signed' ? (
          <Button type="link" onClick={() => handleSignContract(record.id)}>
            签署
          </Button>
        ) : (
          <span style={{ color: '#8c8c8c' }}>已签署</span>
        ),
    },
  ];

  const tabItems = [
    {
      key: 'listings',
      label: '房源共建',
      children: (
        <Spin spinning={loading}>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openListingModal}>
              添加房源
            </Button>
          </div>
          <Table columns={listingColumns} dataSource={listings} rowKey="id" pagination={{ pageSize: 10 }} size="middle" />
        </Spin>
      ),
    },
    {
      key: 'appointments',
      label: '带看预约',
      children: (
        <Spin spinning={loading}>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAppointmentModal}>
              创建预约
            </Button>
          </div>
          <Table columns={appointmentColumns} dataSource={appointments} rowKey="id" pagination={{ pageSize: 10 }} size="middle" />
        </Spin>
      ),
    },
    {
      key: 'contracts',
      label: '合同签署',
      children: (
        <Spin spinning={loading}>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openContractModal}>
              创建合同
            </Button>
          </div>
          <Table columns={contractColumns} dataSource={contracts} rowKey="id" pagination={{ pageSize: 10 }} size="middle" />
        </Spin>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>经纪人协作</h2>
        <p>房源共建、带看预约与合同签署管理</p>
      </div>

      <Card>
        <Tabs items={tabItems} />
      </Card>

      <Modal title="添加房源" open={addListingModal} onCancel={() => setAddListingModal(false)} onOk={() => listingForm.submit()} width={760}>
        <Form form={listingForm} layout="vertical" onFinish={handleCreateListing}>
          <Form.Item name="title" label="房源标题" rules={[{ required: true, message: '请输入房源标题' }]}>
            <Input placeholder="输入房源标题" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="building_id" label="所属楼盘" rules={[{ required: true, message: '请选择楼盘' }]}>
                <Select
                  options={buildings.map((b) => ({ label: b.name || b.title || `楼盘${b.id}`, value: b.id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="agent_id" label="负责经纪人" rules={[{ required: true, message: '请选择经纪人' }]}>
                <Select options={agents.map((a) => ({ label: a.name || `经纪人${a.id}`, value: a.id }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="price" label="价格（万元）" rules={[{ required: true, message: '请输入价格' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="area" label="面积（㎡）" rules={[{ required: true, message: '请输入面积' }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select options={[
                  { label: '二手房', value: '二手房' },
                  { label: '新房', value: '新房' },
                  { label: '租赁', value: '租赁' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="rooms" label="户型" rules={[{ required: true, message: '请输入户型' }]}>
                <Input placeholder="2室1厅" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="floor" label="楼层">
                <Input placeholder="中层" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="orientation" label="朝向">
                <Input placeholder="南" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="decoration" label="装修">
                <Input placeholder="精装" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="owner_name" label="业主姓名">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="owner_phone" label="业主电话">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="房源描述">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="创建带看预约" open={addAppointmentModal} onCancel={() => setAddAppointmentModal(false)} onOk={() => appointmentForm.submit()} width={680}>
        <Form form={appointmentForm} layout="vertical" onFinish={handleCreateAppointment}>
          <Form.Item name="listing_id" label="房源" rules={[{ required: true, message: '请选择房源' }]}>
            <Select showSearch optionFilterProp="label" options={listings.map((l) => ({ label: l.title, value: l.id }))} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="agent_id" label="经纪人" rules={[{ required: true, message: '请选择经纪人' }]}>
                <Select options={agents.map((a) => ({ label: a.name || `经纪人${a.id}`, value: a.id }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="buyer_id" label="购房者" rules={[{ required: true, message: '请选择购房者' }]}>
                <Select options={buyers.map((b) => ({ label: b.name || `购房者${b.id}`, value: b.id }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="appointment_time" label="预约时间" rules={[{ required: true, message: '请输入预约时间' }]}>
                <Input placeholder="2026-06-06 14:00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="预约状态">
                <Select options={[
                  { label: '待确认', value: '待确认' },
                  { label: '已确认', value: '已确认' },
                  { label: '已完成', value: '已完成' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="创建合同" open={addContractModal} onCancel={() => setAddContractModal(false)} onOk={() => contractForm.submit()} width={680}>
        <Form form={contractForm} layout="vertical" onFinish={handleCreateContract}>
          <Form.Item name="listing_id" label="房源" rules={[{ required: true, message: '请选择房源' }]}>
            <Select showSearch optionFilterProp="label" options={listings.map((l) => ({ label: l.title, value: l.id }))} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="buyer_id" label="买方" rules={[{ required: true, message: '请选择买方' }]}>
                <Select options={buyers.map((b) => ({ label: b.name || `购房者${b.id}`, value: b.id }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="agent_id" label="经纪人" rules={[{ required: true, message: '请选择经纪人' }]}>
                <Select options={agents.map((a) => ({ label: a.name || `经纪人${a.id}`, value: a.id }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contract_no" label="合同号" rules={[{ required: true, message: '请输入合同号' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label="合同金额（元）" rules={[{ required: true, message: '请输入合同金额' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="合同状态">
            <Select options={[
              { label: '起草中', value: '起草中' },
              { label: '待签署', value: '待签署' },
              { label: '已签署', value: '已签署' },
            ]} />
          </Form.Item>
          <Space>
            <FileTextOutlined />
            <span>提交后可在合同签署列表中继续签署。</span>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default AgentSpace;
