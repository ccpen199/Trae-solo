import { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Typography,
  Row,
  Col,
  Statistic,
  Descriptions,
  List,
} from 'antd';
import {
  FileTextOutlined,
  DownloadOutlined,
  EyeOutlined,
  PayCircleOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store/appStore';
import { Statement } from '@/types';

const { Title } = Typography;

const StatementsPage = () => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStatement, setSelectedStatement] = useState<Statement | null>(null);

  const statements = useAppStore((state) => state.statements);
  const waybills = useAppStore((state) => state.waybills);

  const statusMap: Record<string, { text: string; color: string }> = {
    unpaid: { text: '待支付', color: 'warning' },
    partial: { text: '部分支付', color: 'processing' },
    paid: { text: '已支付', color: 'success' },
  };

  const totalUnpaid = statements
    .filter((s) => s.status !== 'paid')
    .reduce((sum, s) => sum + (s.totalAmount - s.paidAmount), 0);

  const columns = [
    {
      title: '对账单号',
      dataIndex: 'statementNo',
      key: 'statementNo',
      render: (text: string, record: Statement) => (
        <a onClick={() => handleViewDetail(record)}>{text}</a>
      ),
    },
    {
      title: '账期',
      dataIndex: 'period',
      key: 'period',
    },
    {
      title: '运单数量',
      dataIndex: 'waybillCount',
      key: 'waybillCount',
      render: (val: number) => `${val} 单`,
    },
    {
      title: '账单金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (val: number) => `¥${val.toFixed(2)}`,
    },
    {
      title: '已支付',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      render: (val: number) => `¥${val.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status];
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '到期日',
      dataIndex: 'dueDate',
      key: 'dueDate',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Statement) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<DownloadOutlined />}>
            下载
          </Button>
          {record.status !== 'paid' && (
            <Button type="link" size="small" icon={<PayCircleOutlined />}>
              去支付
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleViewDetail = (statement: Statement) => {
    setSelectedStatement(statement);
    setIsDetailModalOpen(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          对账单管理
        </Title>
        <Space>
          <Button icon={<FileExcelOutlined />}>导出Excel</Button>
          <Button icon={<FilePdfOutlined />}>导出PDF</Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="待支付金额"
              value={totalUnpaid}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月账单"
              value={statements.find((s) => s.period.includes('6月'))?.waybillCount || 0}
              suffix="单"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月金额"
              value={statements.find((s) => s.period.includes('6月'))?.totalAmount || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="累计账单"
              value={statements.length}
              suffix="个"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table columns={columns} dataSource={statements} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title="对账单详情"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        width={800}
        footer={
          <Space>
            <Button icon={<DownloadOutlined />}>下载对账单</Button>
            <Button type="primary" icon={<PayCircleOutlined />}>
              立即支付
            </Button>
          </Space>
        }
      >
        {selectedStatement && (
          <div>
            <div
              style={{
                padding: 16,
                background: '#f0f5ff',
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ color: '#999', fontSize: 12 }}>对账单号</div>
                  <div style={{ fontWeight: 600 }}>{selectedStatement.statementNo}</div>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#999', fontSize: 12 }}>账期</div>
                  <div style={{ fontWeight: 600 }}>{selectedStatement.period}</div>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#999', fontSize: 12 }}>状态</div>
                  <Tag color={statusMap[selectedStatement.status].color}>
                    {statusMap[selectedStatement.status].text}
                  </Tag>
                </Col>
              </Row>
            </div>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="账单金额"
                    value={selectedStatement.totalAmount}
                    precision={2}
                    prefix="¥"
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="已支付金额"
                    value={selectedStatement.paidAmount}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            <Descriptions
              column={2}
              size="small"
              bordered
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="运单数量">
                {selectedStatement.waybillCount} 单
              </Descriptions.Item>
              <Descriptions.Item label="到期日">
                {selectedStatement.dueDate}
              </Descriptions.Item>
              <Descriptions.Item label="生成时间">
                {selectedStatement.createTime}
              </Descriptions.Item>
              <Descriptions.Item label="待支付金额">
                <span style={{ color: '#faad14', fontWeight: 600 }}>
                  ¥{(selectedStatement.totalAmount - selectedStatement.paidAmount).toFixed(2)}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <Title level={5}>明细运单</Title>
            <List
              size="small"
              bordered
              dataSource={waybills.slice(0, selectedStatement.waybillCount)}
              renderItem={(item, index) => (
                <List.Item
                  actions={[<span style={{ color: '#f5222d' }}>¥{item.freight.toFixed(2)}</span>]}
                >
                  <List.Item.Meta
                    title={`${index + 1}. ${item.waybillNo}`}
                    description={
                      <span style={{ color: '#999' }}>
                        {item.sender.city} → {item.receiver.city} · {item.cargo.name}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StatementsPage;
