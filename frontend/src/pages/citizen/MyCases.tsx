import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Tag,
  Button,
  Card,
  Input,
  Select,
  Space,
  Spin,
  Empty,
} from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { caseApi } from '../../api';

export const MyCasesPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState<any[]>([]);
  const [filteredCases, setFilteredCases] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const statusMap: Record<string, { color: string; text: string }> = {
    DRAFT: { color: 'default', text: '草稿' },
    MATERIAL_SUBMITTED: { color: 'blue', text: '材料已提交' },
    OCR_PROCESSING: { color: 'processing', text: 'OCR处理中' },
    MATERIAL_PRE_REVIEW: { color: 'orange', text: '审核中' },
    MATERIAL_REJECTED: { color: 'red', text: '需补正' },
    MATERIAL_APPROVED: { color: 'green', text: '审核通过' },
    RESERVATION_AVAILABLE: { color: 'blue', text: '可预约' },
    RESERVED: { color: 'cyan', text: '已预约' },
    CHECKED_IN: { color: 'purple', text: '已取号' },
    PROCESSING: { color: 'processing', text: '办理中' },
    COMPLETED: { color: 'success', text: '已办结' },
    EVALUATED: { color: 'green', text: '已评价' },
    CANCELLED: { color: 'default', text: '已取消' },
  };

  useEffect(() => {
    loadCases();
  }, []);

  useEffect(() => {
    filterCases();
  }, [cases, searchText, statusFilter]);

  const loadCases = async () => {
    setLoading(true);
    try {
      const response = await caseApi.getMy();
      setCases(response.data || []);
    } catch (error) {
      console.error('加载办件失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCases = () => {
    let result = [...cases];

    if (searchText) {
      result = result.filter(
        (c) =>
          c.case_number.includes(searchText) ||
          c.service_item_name.includes(searchText)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }

    setFilteredCases(result);
  };

  const columns = [
    {
      title: '办件编号',
      dataIndex: 'case_number',
      key: 'case_number',
      width: 180,
    },
    {
      title: '服务事项',
      dataIndex: 'service_item_name',
      key: 'service_item_name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const cfg = statusMap[status] || { color: 'default', text: status };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/citizen/cases/${record.id}`)}
        >
          详情
        </Button>
      ),
    },
  ];

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    ...Object.entries(statusMap).map(([key, value]) => ({
      value: key,
      label: value.text,
    })),
  ];

  return (
    <Spin spinning={loading}>
      <Card
        title="我的办件"
        extra={
          <Space>
            <Input
              placeholder="搜索办件编号或事项名称"
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              style={{ width: 150 }}
            />
          </Space>
        }
      >
        {filteredCases.length === 0 && !loading ? (
          <Empty description="暂无办件记录" />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredCases}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        )}
      </Card>
    </Spin>
  );
};
