import { useState, useMemo } from 'react';
import { Button, Space, Modal, message } from 'antd';
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
  const { policies, searchPolicies, filterPoliciesByStatus } = useGlobalStore();
  const [filteredData, setFilteredData] = useState<InsurancePolicy[]>(policies);
  const [detailModal, setDetailModal] = useState<{
    visible: boolean;
    policy: InsurancePolicy | null;
  }>({ visible: false, policy: null });

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
    setDetailModal({ visible: true, policy });
  };

  const handleClaim = (policy: InsurancePolicy) => {
    Modal.confirm({
      title: '申请理赔',
      content: `确定要对保单 ${policy.policyNo} 发起理赔申请吗？`,
      okText: '确认申请',
      cancelText: '取消',
      onOk: () => {
        message.success('理赔申请已提交');
      },
    });
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

      <Modal
        title="保单详情"
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, policy: null })}
        footer={[
          <Button key="close" onClick={() => setDetailModal({ visible: false, policy: null })}>
            关闭
          </Button>,
          <Button
            key="claim"
            type="primary"
            disabled={detailModal.policy?.status !== 'active'}
            onClick={() => {
              if (detailModal.policy) handleClaim(detailModal.policy);
              setDetailModal({ visible: false, policy: null });
            }}
          >
            申请理赔
          </Button>,
        ]}
        width={600}
      >
        {detailModal.policy && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
              <div>
                <p className="text-sm text-slate-500">保单号</p>
                <p className="font-mono text-lg font-semibold text-slate-800">
                  {detailModal.policy.policyNo}
                </p>
              </div>
              <StatusBadge
                type="policy"
                status={detailModal.policy.status}
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-slate-500">关联订单</p>
                <p className="font-medium text-slate-700">{detailModal.policy.orderNo}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-500">被保险人</p>
                <p className="font-medium text-slate-700">{detailModal.policy.insuredName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-500">保险公司</p>
                <p className="font-medium text-slate-700">{detailModal.policy.insurerName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-500">险种</p>
                <p className="font-medium text-slate-700">{detailModal.policy.productName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-500">保费</p>
                <p className="font-medium text-slate-700">¥{detailModal.policy.premium.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-500">保额</p>
                <p className="font-medium text-emerald-600">¥{detailModal.policy.coverage.toLocaleString()}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="mb-2 text-sm text-slate-500">保障期限</p>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700">{detailModal.policy.period.start}</span>
                <span className="text-slate-400">至</span>
                <span className="font-medium text-slate-700">{detailModal.policy.period.end}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-slate-500">服务护士</p>
              <p className="font-medium text-slate-700">{detailModal.policy.nurseName || '-'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-slate-500">理赔状态</p>
              <p className="font-medium text-slate-700">
                {detailModal.policy.claimStatus === 'none'
                  ? '未申请'
                  : detailModal.policy.claimStatus === 'applied'
                  ? '已申请'
                  : detailModal.policy.claimStatus === 'processing'
                  ? '处理中'
                  : detailModal.policy.claimStatus === 'approved'
                  ? '已赔付'
                  : '已拒绝'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
