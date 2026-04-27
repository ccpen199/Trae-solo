import { Card, Table, Button, Input, Space, Tag, Select, DatePicker, Row, Col } from 'antd';
import { SearchOutlined, PlusOutlined, QrcodeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Livestock, LivestockType, LivestockTypeLabels, LivestockStatus, LivestockStatusLabels, Gender, GenderLabels } from '@/types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const LivestockList = () => {
  const navigate = useNavigate();

  const mockData: (Livestock & { key: string })[] = [
    {
      id: '1',
      key: '1',
      earTagId: 'E12345',
      livestockType: LivestockType.PIG,
      breed: '杜洛克',
      gender: Gender.MALE,
      birthDate: '2026-01-01',
      entryWeight: 25.5,
      entryDate: '2026-01-15',
      source: '外购',
      barnId: 'A-01',
      penId: 'A-01-03',
      status: LivestockStatus.IN_BARN,
      currentWeight: 85.3,
      lastFeedingDate: '2026-04-25',
      lastVaccinationDate: '2026-04-20',
      consecutiveDeviationDays: 0,
      triggeredHealthCheck: false,
      operatorId: 'user-001',
      createdAt: '2026-01-15T08:00:00Z',
      updatedAt: '2026-04-25T08:00:00Z',
    },
    {
      id: '2',
      key: '2',
      earTagId: 'E12346',
      livestockType: LivestockType.PIG,
      breed: '长白',
      gender: Gender.FEMALE,
      birthDate: '2026-01-05',
      entryWeight: 24.2,
      entryDate: '2026-01-20',
      source: '自繁',
      barnId: 'A-01',
      penId: 'A-01-03',
      status: LivestockStatus.IN_BARN,
      currentWeight: 78.5,
      lastFeedingDate: '2026-04-25',
      lastVaccinationDate: '2026-04-15',
      consecutiveDeviationDays: 0,
      triggeredHealthCheck: false,
      operatorId: 'user-001',
      createdAt: '2026-01-20T08:00:00Z',
      updatedAt: '2026-04-25T08:00:00Z',
    },
    {
      id: '3',
      key: '3',
      earTagId: 'E20001',
      livestockType: LivestockType.CATTLE,
      breed: '西门塔尔',
      gender: Gender.MALE,
      birthDate: '2025-06-10',
      entryWeight: 350,
      entryDate: '2025-08-15',
      source: '外购',
      barnId: 'B-01',
      penId: 'B-01-02',
      status: LivestockStatus.IN_BARN,
      currentWeight: 580,
      lastFeedingDate: '2026-04-25',
      lastVaccinationDate: '2026-03-10',
      consecutiveDeviationDays: 0,
      triggeredHealthCheck: false,
      operatorId: 'user-002',
      createdAt: '2025-08-15T08:00:00Z',
      updatedAt: '2026-04-25T08:00:00Z',
    },
  ];

  const columns = [
    {
      title: '耳标编号',
      dataIndex: 'earTagId',
      key: 'earTagId',
      render: (text: string, record: Livestock) => (
        <a onClick={() => navigate(`/livestock/detail/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '牲畜类型',
      dataIndex: 'livestockType',
      key: 'livestockType',
      render: (type: string) => LivestockTypeLabels[type as keyof typeof LivestockTypeLabels] || type,
    },
    {
      title: '品种',
      dataIndex: 'breed',
      key: 'breed',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => GenderLabels[gender as keyof typeof GenderLabels] || gender,
    },
    {
      title: '当前体重',
      dataIndex: 'currentWeight',
      key: 'currentWeight',
      render: (weight: number) => `${weight} kg`,
    },
    {
      title: '栏舍',
      dataIndex: 'barnId',
      key: 'barnId',
      render: (barn: string, record: Livestock) => `${barn} / ${record.penId}`,
    },
    {
      title: '进场日期',
      dataIndex: 'entryDate',
      key: 'entryDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          [LivestockStatus.IN_BARN]: 'green',
          [LivestockStatus.SLAUGHTERED]: 'blue',
          [LivestockStatus.DECEASED]: 'red',
          [LivestockStatus.TRANSFERRED]: 'orange',
        };
        return (
          <Tag color={colorMap[status] || 'default'}>
            {LivestockStatusLabels[status as keyof typeof LivestockStatusLabels] || status}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Livestock) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => navigate(`/livestock/detail/${record.id}`)}>
            详情
          </Button>
          <Button type="link" size="small">
            饲喂
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="牲畜列表"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/livestock/admission')}>
              进场登记
            </Button>
            <Button icon={<QrcodeOutlined />}>扫码识别</Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Input placeholder="耳标编号/品种" prefix={<SearchOutlined />} allowClear />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select placeholder="牲畜类型" allowClear style={{ width: '100%' }}>
                {Object.entries(LivestockTypeLabels).map(([key, label]) => (
                  <Select.Option key={key} value={key}>{label}</Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select placeholder="状态" allowClear style={{ width: '100%' }}>
                {Object.entries(LivestockStatusLabels).map(([key, label]) => (
                  <Select.Option key={key} value={key}>{label}</Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space>
                <Button type="primary">搜索</Button>
                <Button>重置</Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={mockData}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>
    </div>
  );
};

export default LivestockList;
