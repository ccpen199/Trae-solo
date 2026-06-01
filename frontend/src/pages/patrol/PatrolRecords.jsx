import React, { useEffect, useState } from 'react';
import { Table, DatePicker, Select, Tag, Modal, Image, Descriptions, Card, List } from 'antd';
import dayjs from 'dayjs';
import api from '../../utils/api';

function PatrolRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    start_date: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD'),
    status: ''
  });
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, [filters]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.status) params.append('status', filters.status);
      
      const response = await api.get(`/patrol/records?${params.toString()}`);
      setRecords(response.data);
    } catch (error) {
      console.error('获取记录失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const response = await api.get(`/patrol/records/${record.id}`);
      setSelectedRecord(response.data);
      setDetailVisible(true);
    } catch (error) {
      console.error('获取详情失败', error);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      normal: { color: 'green', text: '正常' },
      late: { color: 'orange', text: '迟巡' },
      missed: { color: 'red', text: '漏巡' }
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    { title: '点位', dataIndex: 'checkpoint_name', key: 'checkpoint_name' },
    { title: '楼栋', dataIndex: 'building_name', key: 'building_name' },
    { title: '区域', dataIndex: 'area', key: 'area' },
    { title: '计划', dataIndex: 'plan_name', key: 'plan_name' },
    { title: '巡更人员', dataIndex: 'user_name', key: 'user_name' },
    { title: '扫码时间', dataIndex: 'scan_time', key: 'scan_time', 
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm:ss') },
    { title: '状态', dataIndex: 'status', key: 'status', render: getStatusTag },
    { 
      title: '操作', 
      key: 'action',
      render: (_, record) => (
        <a onClick={() => handleViewDetail(record)}>查看详情</a>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>巡更记录</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <DatePicker.RangePicker
            value={[dayjs(filters.start_date), dayjs(filters.end_date)]}
            onChange={(dates) => setFilters({
              ...filters,
              start_date: dates[0]?.format('YYYY-MM-DD') || '',
              end_date: dates[1]?.format('YYYY-MM-DD') || ''
            })}
          />
          <Select
            style={{ width: 120 }}
            placeholder="状态筛选"
            value={filters.status || undefined}
            onChange={(v) => setFilters({ ...filters, status: v })}
            allowClear
          >
            <Select.Option value="normal">正常</Select.Option>
            <Select.Option value="late">迟巡</Select.Option>
            <Select.Option value="missed">漏巡</Select.Option>
          </Select>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title="巡更记录详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedRecord && (
          <div>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="点位">{selectedRecord.checkpoint_name}</Descriptions.Item>
              <Descriptions.Item label="楼栋">{selectedRecord.building_name}</Descriptions.Item>
              <Descriptions.Item label="巡更人员">{selectedRecord.user_name}</Descriptions.Item>
              <Descriptions.Item label="计划">{selectedRecord.plan_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="扫码时间">
                {dayjs(selectedRecord.scan_time).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(selectedRecord.status)}</Descriptions.Item>
              <Descriptions.Item label="定位">
                {selectedRecord.latitude ? `${selectedRecord.latitude}, ${selectedRecord.longitude}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="离线补传">
                {selectedRecord.is_offline ? '是' : '否'}
              </Descriptions.Item>
            </Descriptions>

            {selectedRecord.check_results && selectedRecord.check_results.length > 0 && (
              <Card title="检查结果" size="small" style={{ marginTop: 16 }}>
                <List
                  size="small"
                  dataSource={selectedRecord.check_results}
                  renderItem={item => (
                    <List.Item>
                      <span>{item.check_item_name}</span>
                      <Tag color={item.is_abnormal ? 'red' : 'green'}>
                        {item.is_abnormal ? '异常' : '正常'}
                      </Tag>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {selectedRecord.photos && selectedRecord.photos.length > 0 && (
              <Card title="现场照片" size="small" style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedRecord.photos.map(photo => (
                    <Image
                      key={photo.id}
                      width={120}
                      height={90}
                      src={`/uploads/${photo.file_path}`}
                      style={{ objectFit: 'cover' }}
                    />
                  ))}
                </div>
              </Card>
            )}

            {selectedRecord.work_orders && selectedRecord.work_orders.length > 0 && (
              <Card title="关联工单" size="small" style={{ marginTop: 16 }}>
                <List
                  size="small"
                  dataSource={selectedRecord.work_orders}
                  renderItem={wo => (
                    <List.Item>
                      <span>{wo.title}</span>
                      <Tag>{wo.type}</Tag>
                      <Tag color={wo.status === 'completed' ? 'green' : 'orange'}>
                        {wo.status}
                      </Tag>
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PatrolRecords;
