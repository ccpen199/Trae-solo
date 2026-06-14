import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Space, message } from 'antd';
import { Eye, Download, FileText, Shield, RefreshCw } from 'lucide-react';
import DataTable from '@/components/DataTable';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { useGlobalStore } from '@/store/useGlobalStore';
import type { InsurancePolicy, PolicyStatus } from '@/types';
import { POLICY_STATUS_MAP } from '@/utils/constants';
import type { TableProps } from 'antd';

const POLICY_STATUS_OPTIONS = Object.entries(POLICY_STATUS_MAP).map(([key, val]) => ({
  value: key as PolicyStatus,
  label: val.label,
}));

export default function InsuranceList() {
  const navigate = useNavigate();
  const { policies, searchPolicies, filterPoliciesByStatus } = useGlobalStore();
  const [filteredData, setFilteredData] = useState<InsurancePolicy[]>(policies);

  const handleSearch = (keyword: string) => {
    if (!keyword.trim()) {
      setFilteredData(policies);
      return;
    }
    const results = searchPolicies(keyword);
    setFilteredData(results);
  };

  const handleFilter = (filters: Record<string, string | number | undefined>) => {
    let result = [...policies];
    if (filters.status) {
      result = filterPoliciesByStatus(filters.status as PolicyStatus);
    }
    setFilteredData(result);
  };

  const handleRefresh = () => {
    setFilteredData(policies);
    message.success('数据已刷新');
  };

  const handleViewDetail = (policy: InsurancePolicy) => {
    navigate(`/insurance/${policy.id}`);
  };

  const handleClaim = (policy: InsurancePolicy) => {
    navigate(`/insurance/${policy.id}`);
  };

  const columns: TableProps<InsurancePolicy>['columns'] = useMemo(
    () => [
      {
        title: '保单号',
        dataIndex: 'policyNo',
        key: 'policyNo',
        width: 180,
        render: (text: string) => (
          <span className="font-mono text-sm font-medium text-slate-800">{text}</span>
        ),
      },
      {
        title: '订单号',
        dataIndex: 'orderNo',
        key: 'orderNo',
        width: 180,
        render: (text: string) => (
          <span className="font-mono text-sm text-slate-600">{text}</span>
        ),
      },
      {
        title: '被保险人',
        dataIndex: 'insuredName',
        key: 'insuredName',
        width: 120,
      },
      {
        title: '保险公司',
        dataIndex: 'insurerName',
        key: 'insurerName',
        width: 160,
      },
      {
        title: '险种',
        dataIndex: 'productName',
        key: 'productName',
        width: 180,
      },
      {
        title: '保费',
        dataIndex: 'premium',
        key: 'premium',
        width: 100,
        render: (value: number) => (
          <span className="font-medium text-slate-700">¥{value.toFixed(2)}</span>
        ),
      },
      {
        title: '保额',
        dataIndex: 'coverage',
        key: 'coverage',
        width: 120,
        render: (value: number) => (
          <span className="font-medium text-emerald-600">¥{value.toLocaleString()}</span>
        ),
      },
      {
        title: '保障期限',
        key: 'period',
        width: 220,
        render: (_, record: InsurancePolicy) => (
          <div className="text-sm">
            <div className="text-slate-700">{record.period.start}</div>
            <div className="text-slate-400">至 {record.period.end}</div>
          </div>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (status: PolicyStatus) => (
          <StatusBadge type="policy" status={status} />
        ),
      },
      {
        title: '操作',
        key: 'action',
        width: 180,
        fixed: 'right',
        render: (_, record: InsurancePolicy) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<Eye className="h-3.5 w-3.5" />}
              onClick={() => handleViewDetail(record)}
            >
              详情
            </Button>
            {record.status === 'active' && (
              <Button
                type="link"
                size="small"
                icon={<FileText className="h-3.5 w-3.5" />}
                onClick={() => handleClaim(record)}
              >
                理赔
              </Button>
            )}
            <Button
              type="link"
              size="small"
              icon={<Download className="h-3.5 w-3.5" />}
              onClick={() => message.success('保单下载中...')}
            >
              下载
            </Button>
          </Space>
        ),
      },
    ],
    []
  );

  const searchFields = [
    { key: 'policyNo', label: '保单号' },
    { key: 'orderNo', label: '订单号' },
    { key: 'insuredName', label: '被保险人' },
  ];

  const filterFields = [
    {
      key: 'status',
      label: '保单状态',
      type: 'select' as const,
      options: POLICY_STATUS_OPTIONS,
      width: 140,
    },
    {
      key: 'insurerName',
      label: '保险公司',
      type: 'input' as const,
      placeholder: '请输入保险公司',
      width: 160,
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="保单管理"
        description="管理所有居家护理服务相关的保险保单"
        icon={<Shield className="h-6 w-6" />}
        actions={[
          {
            key: 'refresh',
            label: '刷新',
            icon: <RefreshCw className="h-4 w-4" />,
            onClick: handleRefresh,
          },
          {
            key: 'export',
            label: '导出报表',
            icon: <Download className="h-4 w-4" />,
            onClick: () => message.success('导出任务已创建'),
          },
        ]}
      />

      <DataTable<InsurancePolicy>
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        searchFields={searchFields}
        filterFields={filterFields}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onRefresh={handleRefresh}
        searchPlaceholder="搜索保单号、订单号或被保险人"
        totalLabel="共"
        scroll={{ x: 1400 }}
      />
    </div>
  );
}
