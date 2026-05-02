import React, { useState } from 'react';
import { Card, Input, Button, Table, Tag, Modal, Descriptions, Timeline, message, Space, Row, Col, Statistic } from 'antd';
import { SearchOutlined, FileTextOutlined, PhoneOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { STATUS_MAP, ACTION_MAP, SIGN_TYPE_MAP } from '../../utils/constants';
import type { TableProps } from 'antd';

interface Package {
  id: string;
  trackingNumber: string;
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  weight?: number;
  status: string;
  areaId?: string;
  areaName?: string;
  courierId?: string;
  courierName?: string;
  pickupCode?: string;
  signCode?: string;
  signType?: string;
  signTime?: string;
  createdAt: string;
  updatedAt: string;
}

interface Trail {
  id: string;
  packageId: string;
  action: string;
  operatorId?: string;
  operatorName?: string;
  operatorRole?: string;
  details?: string;
  createdAt: string;
}

export default function SearchPage() {
  const [searchType, setSearchType] = useState<'tracking' | 'phone'>('tracking');
  const [searchValue, setSearchValue] = useState('');
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [detailModal, setDetailModal] = useState(false);

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      message.warning('请输入搜索内容');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (searchType === 'tracking') {
        response = await api.get(`/packages/tracking/${searchValue}`);
        setPackages(response.data ? [response.data] : []);
      } else {
        response = await api.get(`/packages/search?phone=${searchValue}`);
        setPackages(response.data);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setPackages([]);
        message.info('未找到包裹');
      } else {
        message.error('搜索失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTrails = async (packageId: string) => {
    try {
      const response = await api.get(`/packages/${packageId}/trails`);
      setTrails(response.data);
    } catch (error) {
      message.error('获取轨迹失败');
    }
  };

  const showDetail = async (pkg: Package) => {
    setSelectedPackage(pkg);
    await fetchTrails(pkg.id);
    setDetailModal(true);
  };

  const columns: TableProps<Package>['columns'] = [
    {
      title: '运单号',
      dataIndex: 'trackingNumber',
      key: 'trackingNumber',
      width: 160,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '收件人',
      key: 'receiver',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.receiverName}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.receiverPhone}</div>
        </div>
      ),
    },
    {
      title: '收件地址',
      dataIndex: 'receiverAddress',
      key: 'receiverAddress',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const info = STATUS_MAP[status] || { label: status, color: 'default' };
        return <Tag color={info.color as any}>{info.label}</Tag>;
      },
    },
    {
      title: '快递员',
      dataIndex: 'courierName',
      key: 'courierName',
      width: 80,
      render: (name) => name || '-',
    },
    {
      title: '签收方式',
      dataIndex: 'signType',
      key: 'signType',
      width: 100,
      render: (type) => type ? SIGN_TYPE_MAP[type] || type : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => showDetail(record)}>
          查看详情
        </Button>
      ),
    },
  ];

  const statusCounts = {
    total: packages.length,
    inStation: packages.filter(p => ['in_station', 'sorted', 'notified'].includes(p.status)).length,
    delivering: packages.filter(p => p.status === 'delivering').length,
    signed: packages.filter(p => p.status === 'signed').length,
    exception: packages.filter(p => p.status === 'exception').length,
  };

  return (
    <div>
      <Card title="包裹查询">
        <Space style={{ marginBottom: 24, width: '100%' }}>
          <Input.Group compact style={{ width: 500 }}>
            <Select
              value={searchType}
              onChange={(value) => setSearchType(value)}
              style={{ width: 120 }}
            >
              <Select.Option value="tracking">运单号</Select.Option>
              <Select.Option value="phone">手机号</Select.Option>
            </Select>
            <Input
              style={{ width: 280 }}
              placeholder={searchType === 'tracking' ? '请输入运单号' : '请输入手机号'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onPressEnter={handleSearch}
              prefix={searchType === 'tracking' ? <FileTextOutlined /> : <PhoneOutlined />}
            />
            <Button type="primary" onClick={handleSearch} loading={loading}>
              <SearchOutlined /> 查询
            </Button>
          </Input.Group>
        </Space>

        {packages.length > 0 && (
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={4}>
              <Card size="small">
                <Statistic title="查询结果" value={statusCounts.total} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic title="在站" value={statusCounts.inStation} valueStyle={{ color: '#1890ff' }} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic title="派送中" value={statusCounts.delivering} valueStyle={{ color: '#fa8c16' }} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic title="已签收" value={statusCounts.signed} valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic title="异常" value={statusCounts.exception} valueStyle={{ color: '#ff4d4f' }} />
              </Card>
            </Col>
          </Row>
        )}

        <Table
          columns={columns}
          dataSource={packages}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="包裹详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={800}
      >
        {selectedPackage && (
          <div>
            <Descriptions title="包裹信息" bordered column={2} size="small">
              <Descriptions.Item label="运单号">
                <Tag color="blue">{selectedPackage.trackingNumber}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => {
                  const info = STATUS_MAP[selectedPackage.status] || { label: selectedPackage.status, color: 'default' };
                  return <Tag color={info.color as any}>{info.label}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="收件人">
                {selectedPackage.receiverName}
              </Descriptions.Item>
              <Descriptions.Item label="收件电话">
                {selectedPackage.receiverPhone}
              </Descriptions.Item>
              <Descriptions.Item label="收件地址" span={2}>
                {selectedPackage.receiverAddress}
              </Descriptions.Item>
              <Descriptions.Item label="寄件人">
                {selectedPackage.senderName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="寄件电话">
                {selectedPackage.senderPhone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="快递员">
                {selectedPackage.courierName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="区域">
                {selectedPackage.areaName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="取件码">
                {selectedPackage.pickupCode || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="签收方式">
                {selectedPackage.signType ? SIGN_TYPE_MAP[selectedPackage.signType] : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="签收时间">
                {selectedPackage.signTime ? new Date(selectedPackage.signTime).toLocaleString('zh-CN') : '-'}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <h4>包裹轨迹</h4>
              <Timeline>
                {trails.map((trail) => (
                  <Timeline.Item key={trail.id}>
                    <div>
                      <strong>{ACTION_MAP[trail.action] || trail.action}</strong>
                      {trail.operatorName && (
                        <span style={{ color: '#999', marginLeft: 8 }}>
                          - {trail.operatorName}
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#999', fontSize: 12 }}>
                      {new Date(trail.createdAt).toLocaleString('zh-CN')}
                    </div>
                    {trail.details && (
                      <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
                        {trail.details}
                      </div>
                    )}
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
