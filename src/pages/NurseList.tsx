import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, Avatar, Space, Button, Tooltip, Tag, Select, Badge } from 'antd';
import { Eye, CheckCircle, Star, Building2, AlertTriangle, Shield, History, Clock, UserCheck } from 'lucide-react';
import type { TabsProps } from 'antd';
import dayjs from 'dayjs';
import DataTable, { type DataTableFilterField } from '@/components/DataTable';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { useGlobalStore } from '@/store/useGlobalStore';
import { mockNurses } from '@/mock';
import type { Nurse, VerifyStatus } from '@/types';
import type { ColumnType } from 'antd/es/table';
import { cn } from '@/lib/utils';

type TabKey = 'all' | 'pending' | 'verifying' | 'verified' | 'rejected' | 'expiring';

const getVerifyStatusColor = (status: VerifyStatus) => {
  const colorMap: Record<VerifyStatus, string> = {
    pending: 'default',
    verifying: 'processing',
    verified: 'success',
    rejected: 'error',
  };
  return colorMap[status];
};

const getResultText = (status: VerifyStatus) => {
  return status === 'verified' ? '通过' : status === 'rejected' ? '驳回' : '-';
};

export default function NurseList() {
  const navigate = useNavigate();
  const { nurses, setNurses, searchNurses, updateNurse } = useGlobalStore();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<string | undefined>();
  const [selectedCertType, setSelectedCertType] = useState<string | undefined>();

  useEffect(() => {
    if (nurses.length === 0) {
      setNurses(mockNurses);
    }
  }, [nurses.length, setNurses]);

  const isExpiring = (validUntil: string) => {
    const diffDays = dayjs(validUntil).diff(dayjs(), 'day');
    return diffDays <= 90 && diffDays > 0;
  };

  const getVerifyHistorySummary = (nurse: Nurse) => {
    const { verifyHistory } = nurse;
    if (!verifyHistory || verifyHistory.length === 0) {
      return null;
    }
    const lastRecord = verifyHistory[verifyHistory.length - 1];
    return {
      lastAction: lastRecord.action,
      lastOperator: lastRecord.operatorName,
      lastTime: lastRecord.time,
      totalRecords: verifyHistory.length,
    };
  };

  const organizationOptions = useMemo(() => {
    const orgs = [...new Set(nurses.map((n) => n.organizationName))];
    return orgs.map((org) => ({ label: org, value: org }));
  }, [nurses]);

  const certificateTypeOptions = useMemo(() => {
    const types = [...new Set(nurses.map((n) => n.certificateType))];
    return types.map((type) => ({ label: type, value: type }));
  }, [nurses]);

  const verifyStatusOptions = useMemo(
    () => [
      { label: '待核验', value: 'pending' },
      { label: '核验中', value: 'verifying' },
      { label: '已通过', value: 'verified' },
      { label: '已驳回', value: 'rejected' },
    ],
    []
  );

  const filterFields: DataTableFilterField[] = useMemo(
    () => [
      {
        key: 'organization',
        label: '所属机构',
        type: 'select',
        options: organizationOptions,
        width: 200,
      },
      {
        key: 'certificateType',
        label: '证书类型',
        type: 'select',
        options: certificateTypeOptions,
        width: 160,
      },
      {
        key: 'verifyStatus',
        label: '核验状态',
        type: 'select',
        options: verifyStatusOptions,
        width: 140,
      },
    ],
    [organizationOptions, certificateTypeOptions, verifyStatusOptions]
  );

  const filteredData = useMemo(() => {
    let data = [...nurses];

    if (searchKeyword) {
      data = searchNurses(searchKeyword);
    }

    if (selectedOrg) {
      data = data.filter((n) => n.organizationName === selectedOrg);
    }

    if (selectedCertType) {
      data = data.filter((n) => n.certificateType === selectedCertType);
    }

    switch (activeTab) {
      case 'pending':
        data = data.filter((n) => n.verifyStatus === 'pending');
        break;
      case 'verifying':
        data = data.filter((n) => n.verifyStatus === 'verifying');
        break;
      case 'verified':
        data = data.filter((n) => n.verifyStatus === 'verified');
        break;
      case 'rejected':
        data = data.filter((n) => n.verifyStatus === 'rejected');
        break;
      case 'expiring':
        data = data.filter((n) => isExpiring(n.validUntil));
        break;
    }

    return data;
  }, [nurses, activeTab, searchKeyword, searchNurses, selectedOrg, selectedCertType]);

  const tabCounts = useMemo(() => {
    return {
      all: nurses.length,
      pending: nurses.filter((n) => n.verifyStatus === 'pending').length,
      verifying: nurses.filter((n) => n.verifyStatus === 'verifying').length,
      verified: nurses.filter((n) => n.verifyStatus === 'verified').length,
      rejected: nurses.filter((n) => n.verifyStatus === 'rejected').length,
      expiring: nurses.filter((n) => isExpiring(n.validUntil)).length,
    };
  }, [nurses]);

  const tabItems: TabsProps['items'] = [
    { key: 'all', label: `全部 (${tabCounts.all})` },
    {
      key: 'pending',
      label: (
        <Space>
          待核验
          <Badge count={tabCounts.pending} size="small" color="default" />
        </Space>
      ),
    },
    {
      key: 'verifying',
      label: (
        <Space>
          核验中
          <Badge count={tabCounts.verifying} size="small" color="processing" />
        </Space>
      ),
    },
    {
      key: 'verified',
      label: (
        <Space>
          已通过
          <Badge count={tabCounts.verified} size="small" color="success" />
        </Space>
      ),
    },
    {
      key: 'rejected',
      label: (
        <Space>
          已驳回
          <Badge count={tabCounts.rejected} size="small" color="error" />
        </Space>
      ),
    },
    {
      key: 'expiring',
      label: (
        <Space>
          将到期
          <Badge count={tabCounts.expiring} size="small" color="warning" />
        </Space>
      ),
    },
  ];

  const rowClassName = (record: Nurse) => {
    return cn({
      'bg-gradient-to-r from-red-50/80 to-red-50/30 hover:!from-red-50 hover:!to-red-50/50':
        record.verifyStatus === 'rejected',
      'font-semibold': record.verifyStatus === 'pending',
    });
  };

  const columns: ColumnType<Nurse>[] = [
    {
      title: '头像姓名',
      key: 'name',
      dataIndex: 'name',
      width: 180,
      fixed: 'left',
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatar} size={40} className="!bg-sky-100 !text-sky-600">
            {record.name.charAt(0)}
          </Avatar>
          <div>
            <div className="font-medium text-slate-900">{record.name}</div>
            <div className="text-xs text-slate-500">{record.phone}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '执业证号',
      dataIndex: 'certificateNumber',
      key: 'certificateNumber',
      width: 160,
      render: (text: string) => <span className="font-mono text-sm tracking-tight">{text}</span>,
    },
    {
      title: '资质类型',
      dataIndex: 'certificateType',
      key: 'certificateType',
      width: 120,
      render: (text: string) => <Tag color="blue" className="!mb-0">{text}</Tag>,
    },
    {
      title: '执业范围',
      dataIndex: 'practiceScope',
      key: 'practiceScope',
      width: 200,
      render: (scopes: string[]) => (
        <div className="flex flex-wrap gap-1">
          {scopes.map((scope, idx) => (
            <Tag key={idx} color="default" className="mb-0 !text-xs">
              {scope}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: '核验状态',
      dataIndex: 'verifyStatus',
      key: 'verifyStatus',
      width: 130,
      render: (status: VerifyStatus) => (
        <StatusBadge
          type="verify"
          status={status}
          className={cn(
            status === 'rejected' && 'font-semibold border border-red-200 shadow-sm shadow-red-100'
          )}
        />
      ),
    },
    {
      title: '核验详情',
      key: 'verifyDetail',
      width: 240,
      render: (_, record) => {
        if (record.verifyStatus === 'pending') {
          return (
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs">等待核验</span>
            </div>
          );
        }

        const { verifyResult } = record;
        if (!verifyResult) {
          return <span className="text-slate-400">-</span>;
        }

        const isRejected = record.verifyStatus === 'rejected';
        const resultText = getResultText(record.verifyStatus);
        const resultColor = isRejected ? 'red' : 'green';
        const historySummary = getVerifyHistorySummary(record);

        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Tag color={resultColor} className="!mb-0 !font-medium">
                {resultText}
              </Tag>
              {verifyResult.manualReviewerName && (
                <span className="text-xs text-slate-600 flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  {verifyResult.manualReviewerName}
                </span>
              )}
            </div>
            {verifyResult.manualReviewTime && (
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <History className="h-3 w-3" />
                {dayjs(verifyResult.manualReviewTime).format('YYYY-MM-DD HH:mm')}
              </div>
            )}
            {historySummary && historySummary.totalRecords > 0 && (
              <div className="text-xs text-slate-400">
                共 {historySummary.totalRecords} 条核验记录
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '有效期',
      dataIndex: 'validUntil',
      key: 'validUntil',
      width: 140,
      render: (text: string) => {
        const isExpiringSoon = isExpiring(text);
        return (
          <div className="flex items-center gap-1">
            {isExpiringSoon && (
              <Tooltip title="证书即将到期，请及时提醒护士更新">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </Tooltip>
            )}
            <span className={cn(isExpiringSoon && 'text-amber-600 font-medium')}>
              {dayjs(text).format('YYYY-MM-DD')}
            </span>
          </div>
        );
      },
    },
    {
      title: '所属机构',
      dataIndex: 'organizationName',
      key: 'organizationName',
      width: 200,
      render: (text: string) => (
        <div className="flex items-center gap-1">
          <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="text-sm truncate">{text}</span>
        </div>
      ),
    },
    {
      title: '完成订单数',
      dataIndex: 'completedOrders',
      key: 'completedOrders',
      width: 120,
      align: 'center',
      render: (text: number) => <span className="font-medium text-slate-700">{text}</span>,
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 120,
      align: 'center',
      render: (text: number) => (
        <div className="flex items-center justify-center gap-1">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="font-medium text-slate-700">{text}</span>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<Eye className="h-4 w-4" />}
            onClick={() => navigate(`/nurses/${record.id}/verify`)}
          >
            查看详情
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<Shield className="h-4 w-4" />}
            onClick={() => navigate(`/nurses/verify/${record.id}`)}
            disabled={record.verifyStatus === 'verified' || record.verifyStatus === 'rejected'}
          >
            核验
          </Button>
        </Space>
      ),
    },
  ];

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
  };

  const handleFilter = (filters: Record<string, string | number | undefined>) => {
    setSelectedOrg(filters.organization as string | undefined);
    setSelectedCertType(filters.certificateType as string | undefined);
  };

  const handleRefresh = () => {
    setNurses([...mockNurses]);
  };

  const handleQuickVerify = (id: string, status: 'verified' | 'rejected') => {
    const now = new Date().toISOString();
    updateNurse(id, {
      verifyStatus: status,
      verifyResult: {
        systemChecked: true,
        systemMessage: '证书信息核验通过',
        manualChecked: true,
        manualRemark: status === 'verified' ? '资料齐全，快速审核通过' : '资料不完整，驳回申请',
        manualReviewTime: now,
      },
    });
  };

  return (
    <div>
      <PageHeader title="护士资质管理" description="管理和核验护士执业资质信息" />

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <Tabs
          activeKey={activeTab}
          items={tabItems}
          onChange={(key) => setActiveTab(key as TabKey)}
          className="px-4 pt-2"
          size="large"
          tabBarStyle={{ marginBottom: 0 }}
        />
      </div>

      <div className="mt-4">
        <DataTable<Nurse>
          columns={columns}
          dataSource={filteredData}
          showSearch={true}
          showFilter={true}
          showRefresh={true}
          filterFields={filterFields}
          searchPlaceholder="搜索姓名/手机号/证号/所属机构"
          onSearch={handleSearch}
          onFilter={handleFilter}
          onRefresh={handleRefresh}
          scroll={{ x: 1700 }}
          rowClassName={rowClassName}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
        />
      </div>
    </div>
  );
}
