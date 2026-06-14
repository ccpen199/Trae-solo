import { useState } from 'react';
import {
  Card,
  Tag,
  Button,
  Space,
  Modal,
  Row,
  Col,
  Typography,
  Skeleton,
  Empty,
  message,
  Divider,
  Descriptions,
  QRCode,
  Alert,
  Table,
} from 'antd';
import {
  PrinterOutlined,
  DownloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useRequest from '../../hooks/useRequest';
import { getAdmissionTicket, getExamRegistrations } from '../../api/exam';

const { Title, Text, Paragraph } = Typography;

const mockTickets = [
  {
    id: 1,
    examName: '2024年国家公务员考试',
    examType: 'civil_servant',
    examTypeName: '公务员考试',
    ticketNumber: 'G2024110010012345',
    examTime: '2024-11-26 09:00:00',
    examEndTime: '2024-11-26 17:00:00',
    examLocation: '北京市海淀区中关村第一小学',
    examAddress: '北京市海淀区中关村大街1号',
    classroom: '3号楼 2层 203教室',
    seatNumber: '15号',
    status: 'available',
    subjects: [
      { name: '行政职业能力测验', time: '2024-11-26 09:00-11:00', classroom: '203教室', seat: '15号' },
      { name: '申论', time: '2024-11-26 14:00-17:00', classroom: '203教室', seat: '15号' },
    ],
  },
  {
    id: 2,
    examName: '2024年上半年事业单位公开招聘',
    examType: 'public_institution',
    examTypeName: '事业单位',
    ticketNumber: 'S2024050010067890',
    examTime: '2024-05-12 09:00:00',
    examEndTime: '2024-05-12 11:00:00',
    examLocation: '广州市天河区华阳小学',
    examAddress: '广州市天河区天河路100号',
    classroom: '1号楼 3层 305教室',
    seatNumber: '22号',
    status: 'expired',
    subjects: [
      { name: '公共基础知识', time: '2024-05-12 09:00-11:00', classroom: '305教室', seat: '22号' },
    ],
  },
  {
    id: 3,
    examName: '2024年一级建造师资格考试',
    examType: 'professional_qualification',
    examTypeName: '职业资格',
    ticketNumber: 'J2024090010054321',
    examTime: '2024-09-07 09:00:00',
    examEndTime: '2024-09-08 18:00:00',
    examLocation: '上海市浦东新区张江中学',
    examAddress: '上海市浦东新区张江高科技园区',
    classroom: '2号楼 4层 402教室',
    seatNumber: '8号',
    status: 'available',
    subjects: [
      { name: '建设工程经济', time: '2024-09-07 09:00-11:00', classroom: '402教室', seat: '8号' },
      { name: '建设工程法规及相关知识', time: '2024-09-07 14:00-17:00', classroom: '402教室', seat: '8号' },
      { name: '建设工程项目管理', time: '2024-09-08 09:00-12:00', classroom: '402教室', seat: '8号' },
      { name: '专业工程管理与实务', time: '2024-09-08 14:00-18:00', classroom: '402教室', seat: '8号' },
    ],
  },
];

const examRules = [
  '考生应在考试前30分钟到达考点，凭准考证和有效身份证件入场。',
  '考生须携带黑色墨水笔、2B铅笔、橡皮、直尺等文具，不得携带任何书籍、笔记、报纸、稿纸、电子设备等进入考场。',
  '考试开始30分钟后，考生不得入场；考试期间，考生不得提前交卷退场。',
  '考生需在答题卡规定位置填写姓名、准考证号等信息，不得在答题卡上做任何标记。',
  '考场内必须保持安静，严禁交头接耳、窥视他人试题答案或交换试卷、答题卡。',
  '考试结束信号发出后，考生应立即停止答题，待监考人员收齐试卷、答题卡后方可离场。',
  '考生应妥善保管准考证，以备成绩查询、面试等环节使用。',
  '严禁替考、伪造证件等违纪行为，违者将按有关规定严肃处理。',
];

const notices = [
  { type: 'warning', content: '请提前熟悉考点位置和交通路线，避免迟到' },
  { type: 'info', content: '建议携带身份证、准考证复印件备用' },
  { type: 'info', content: '考试当天请提前出发，预留充足时间' },
];

const Tickets = () => {
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const { loading, data: registrations } = useRequest(getExamRegistrations, {
    onError: () => {
      message.error('获取报名记录失败');
    },
  });

  const {
    loading: ticketLoading,
    data: ticketDetail,
    run: fetchTicket,
  } = useRequest(getAdmissionTicket, {
    manual: true,
    onError: () => {
      message.error('获取准考证详情失败');
    },
  });

  const tickets = mockTickets;

  const getTypeColor = (type) => {
    const colorMap = {
      civil_servant: '#1E6FDB',
      public_institution: '#52C41A',
      professional_qualification: '#FAAD14',
      teacher: '#722ED1',
      medical: '#13C2C2',
      other: '#8C8C8C',
    };
    return colorMap[type] || '#8C8C8C';
  };

  const getStatusTag = (status) => {
    const statusMap = {
      available: { color: 'success', text: '可打印', icon: <CheckCircleOutlined /> },
      expired: { color: 'default', text: '已过期', icon: <ExclamationCircleOutlined /> },
    };
    const statusInfo = statusMap[status] || statusMap.available;
    return <Tag icon={statusInfo.icon} color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const handlePreview = async (ticket) => {
    setSelectedTicket(ticket);
    setPreviewModalVisible(true);
    try {
      await fetchTicket(ticket.id);
    } catch (error) {
      console.log('Using mock data');
    }
  };

  const handleDownload = (ticket) => {
    message.success(`正在下载「${ticket.examName}」准考证PDF...`);
  };

  const handlePrint = (ticket) => {
    message.success(`正在打印「${ticket.examName}」准考证...`);
  };

  const subjectColumns = [
    { title: '考试科目', dataIndex: 'name', key: 'name' },
    { title: '考试时间', dataIndex: 'time', key: 'time' },
    { title: '考场', dataIndex: 'classroom', key: 'classroom' },
    { title: '座位号', dataIndex: 'seat', key: 'seat' },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>准考证</Title>
        <Text type="secondary">下载打印准考证，准时参加考试</Text>
      </div>

      <Alert
        message="温馨提示"
        description={
          <div>
            {notices.map((notice, index) => (
              <div key={index}>• {notice.content}</div>
            ))}
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {tickets.length === 0 ? (
        <Card>
          <Empty description="暂无准考证信息" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {tickets.map(ticket => (
            <Col xs={24} lg={12} key={ticket.id}>
              <Card
                hoverable
                actions={[
                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreview(ticket)}
                  >
                    预览
                  </Button>,
                  <Button
                    type="link"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(ticket)}
                    disabled={ticket.status === 'expired'}
                  >
                    下载
                  </Button>,
                  <Button
                    type="link"
                    icon={<PrinterOutlined />}
                    onClick={() => handlePrint(ticket)}
                    disabled={ticket.status === 'expired'}
                  >
                    打印
                  </Button>,
                ]}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <Space style={{ marginBottom: 12 }}>
                      <Tag color={getTypeColor(ticket.examType)}>{ticket.examTypeName}</Tag>
                      {getStatusTag(ticket.status)}
                    </Space>
                    <Title level={5} style={{ margin: '0 0 8px 0' }}>{ticket.examName}</Title>
                    <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                      准考证号：{ticket.ticketNumber}
                    </Text>
                  </div>
                  <div
                    style={{
                      width: 80,
                      height: 100,
                      background: '#f0f0f0',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IdcardOutlined style={{ fontSize: 32, color: '#ccc' }} />
                  </div>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                <div style={{ fontSize: 13, lineHeight: 2 }}>
                  <div>
                    <CalendarOutlined style={{ marginRight: 8, color: '#1E6FDB' }} />
                    <Text type="secondary">考试时间：</Text>
                    <Text strong>{dayjs(ticket.examTime).format('YYYY-MM-DD HH:mm')}</Text>
                  </div>
                  <div>
                    <EnvironmentOutlined style={{ marginRight: 8, color: '#1E6FDB' }} />
                    <Text type="secondary">考试地点：</Text>
                    {ticket.examLocation}
                  </div>
                  <div>
                    <InfoCircleOutlined style={{ marginRight: 8, color: '#1E6FDB' }} />
                    <Text type="secondary">考场座位：</Text>
                    {ticket.classroom} {ticket.seatNumber}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Card
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#1E6FDB' }} />
            注意事项
          </Space>
        }
        style={{ marginTop: 24 }}
      >
        <div style={{ lineHeight: 2 }}>
          {examRules.map((rule, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ color: '#1E6FDB', fontWeight: 'bold' }}>{index + 1}.</span>
              <Text type="secondary">{rule}</Text>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#1E6FDB' }} />
            准考证预览
          </Space>
        }
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => selectedTicket && handleDownload(selectedTicket)}
            disabled={selectedTicket?.status === 'expired'}
            style={{ background: '#1E6FDB', borderColor: '#1E6FDB' }}
          >
            下载PDF
          </Button>,
          <Button
            key="print"
            icon={<PrinterOutlined />}
            onClick={() => selectedTicket && handlePrint(selectedTicket)}
            disabled={selectedTicket?.status === 'expired'}
          >
            打印
          </Button>,
        ]}
      >
        {selectedTicket && (
          <div style={{ background: '#fff', padding: 32, border: '2px solid #1E6FDB', borderRadius: 8 }}>
            <div style={{ textAlign: 'center', borderBottom: '3px double #1E6FDB', paddingBottom: 20, marginBottom: 24 }}>
              <SafetyCertificateOutlined style={{ fontSize: 48, color: '#1E6FDB', marginBottom: 12 }} />
              <Title level={3} style={{ margin: '0 0 8px 0', color: '#1E6FDB' }}>
                人事考试准考证
              </Title>
              <Title level={5} style={{ margin: 0 }}>{selectedTicket.examName}</Title>
            </div>

            <Row gutter={[24, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={16}>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="准考证号">
                    <Text strong style={{ fontFamily: 'monospace', fontSize: 16, color: '#1E6FDB' }}>
                      {selectedTicket.ticketNumber}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="姓名">张三</Descriptions.Item>
                  <Descriptions.Item label="身份证号">110101********1234</Descriptions.Item>
                  <Descriptions.Item label="考试类型">{selectedTicket.examTypeName}</Descriptions.Item>
                  <Descriptions.Item label="考试时间">
                    {dayjs(selectedTicket.examTime).format('YYYY-MM-DD HH:mm')} ~ {dayjs(selectedTicket.examEndTime).format('HH:mm')}
                  </Descriptions.Item>
                  <Descriptions.Item label="考试地点">{selectedTicket.examLocation}</Descriptions.Item>
                  <Descriptions.Item label="考点地址">{selectedTicket.examAddress}</Descriptions.Item>
                  <Descriptions.Item label="考场">{selectedTicket.classroom}</Descriptions.Item>
                  <Descriptions.Item label="座位号">{selectedTicket.seatNumber}</Descriptions.Item>
                </Descriptions>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: 140,
                      height: 180,
                      background: '#f5f5f5',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      border: '1px solid #ddd',
                    }}
                  >
                    <IdcardOutlined style={{ fontSize: 48, color: '#ccc' }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>照片（2寸证件照）</div>
                  <div style={{ marginTop: 16, padding: 12, background: '#f5f9ff', borderRadius: 4 }}>
                    <QRCode
                      value={`https://verify.example.com/ticket/${selectedTicket.ticketNumber}`}
                      size={100}
                      color="#1E6FDB"
                      style={{ margin: '0 auto' }}
                    />
                    <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 11 }}>
                      扫码验证
                    </Text>
                  </div>
                </div>
              </Col>
            </Row>

            <Divider />

            <Title level={5} style={{ marginBottom: 16 }}>
              <Space>
                <ClockCircleOutlined style={{ color: '#1E6FDB' }} />
                考试科目安排
              </Space>
            </Title>
            <Table
              columns={subjectColumns}
              dataSource={selectedTicket.subjects}
              rowKey="name"
              pagination={false}
              size="small"
            />

            <Divider />

            <Title level={5} style={{ marginBottom: 16 }}>
              <Space>
                <ExclamationCircleOutlined style={{ color: '#FAAD14' }} />
                考场规则
              </Space>
            </Title>
            <div style={{ lineHeight: 1.8, fontSize: 13, background: '#fffbe6', padding: 16, borderRadius: 4, border: '1px solid #ffe58f' }}>
              {examRules.slice(0, 6).map((rule, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: '#FAAD14', fontWeight: 'bold' }}>{index + 1}.</span>
                  <Text>{rule}</Text>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
                <div>本准考证由人事考试机构出具，请妥善保管</div>
                <div>生成时间：{new Date().toLocaleString()}</div>
              </div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '8px 20px',
                  border: '3px solid #1E6FDB',
                  borderRadius: 4,
                  color: '#1E6FDB',
                  fontSize: 16,
                  fontWeight: 'bold',
                }}
              >
                人事考试机构专用章
              </div>
            </div>

            <div style={{ marginTop: 24, borderTop: '1px dashed #ccc', paddingTop: 16, textAlign: 'center', fontSize: 11, color: '#999' }}>
              <Text type="secondary">
                验证链接：https://verify.example.com/ticket/{selectedTicket.ticketNumber}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Tickets;
