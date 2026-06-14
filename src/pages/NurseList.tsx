import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, Avatar, Space, Button, Tooltip, Tag } from 'antd';
import { Eye, CheckCircle, Star, Building2, AlertTriangle } from 'lucide-react';
import type { TabsProps } from 'antd';
import dayjs from 'dayjs';
import DataTable from '@/components/DataTable';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { useGlobalStore } from '@/store/useGlobalStore';
import { mockNurses } from '@/mock';
import type { Nurse, VerifyStatus } from '@/types';
import type { ColumnType } from 'antd/es/table';

type TabKey = 'all' | 'pending' | 'verifying' | 'verified' | 'rejected' | 'expiring';

export default function NurseList() {
  const navigate = useNavigate();
  const { nurses, setNurses, searchNurses } = useGlobalStore();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    if (nurses.length === 0) {
      setNurses(mockNurses);
    }
  }, [nurses.length, setNurses]);

  const isExpiring = (validUntil: string) => {
    const diffDays = dayjs(validUntil).diff(dayjs(), 'day');
    return diffDays <= 90 && diffDays > 0;
  };

  const filteredData = useMemo(() => {
    let data = [...nurses];

    if (searchKeyword) {
      data = searchNurses(searchKeyword);
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
  }, [nurses, activeTab, searchKeyword, searchNurses]);

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
    { key: 'pending', label: `待核验 (${tabCounts.pending})` },
    { key: 'verifying', label: `核验中 (${tabCounts.verifying})` },
    { key: 'verified', label: `已通过 (${tabCounts.verified})` },
    { key: 'rejected', label: `已驳回 (${tabCounts.rejected})` },
    { key: 'expiring', label: `将到期 (${tabCounts.expiring})` },
  ];

  const columns: ColumnType<Nurse>[] = [
    {
      title: '头像姓名',
      key: 'name',
      width: 180,
      fixed: 'left',
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatar} size={40}>
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
      render: (text) => <span className="font-mono text-sm">{text}</span>,
    },
    {
      title: '资质类型',
      dataIndex: 'certificateType',
      key: 'certificateType',
      width: 120,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '执业范围',
      dataIndex: 'practiceScope',
      key: 'practiceScope',
      width: 200,
      render: (scopes: string[]) => (
        <div className="flex flex-wrap gap-1">
          {scopes.map((scope, idx) => (
            <Tag key={idx} color="default" className="mb-0">
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
      render: (status: VerifyStatus) => <StatusBadge type="verify" status={status} />,
    },
    {
      title: '有效期',
      dataIndex: 'validUntil',
      key: 'validUntil',
      width: 140,
      render: (text) => {
        const isExpiringSoon = isExpiring(text);
        return (
          <div className="flex items-center gap-1">
            {isExpiringSoon && (
              <Tooltip title="证书即将到期">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </Tooltip>
            )}
            <span className={isExpiringSoon ? 'text-amber-600' : ''}>
              {dayjs(text).format('YYYY-MM-DD')}
            </span>
          </div>
        );
      },
    },
    {
      title: '所属机构',
      key: 'organization',
      width: 200,
      render: (_, record) => (
        <div className="flex items-center gap-1">
          <Building2 className="h-4 w-4 text-slate-400" />
          <span className="text-sm">{record.organizationName}</span>
        </div>
      ),
    },
    {
      title: '完成订单数',
      dataIndex: 'completedOrders',
      key: 'completedOrders',
      width: 120,
      align: 'center',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 120,
      align: 'center',
      render: (text) => (
        <div className="flex items-center justify-center gap-1">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
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
          {record.verifyStatus === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircle className="h-4 w-4" />}
              onClick={() => navigate(`/nurses/${record.id}/verify`)}
            >
              核验
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
  };

  const handleRefresh = () => {
    setNurses([...mockNurses]);
  };

  return (
    <div>
      <PageHeader title="护士资质管理" description="管理和核验护士执业资质信息" />

      <div className="rounded-xl border border-slate-200 bg-white">
        <Tabs
          activeKey={activeTab}
          items={tabItems}
          onChange={(key) => setActiveTab(key as TabKey)}
          className="px-4 pt-2"
          size="large"
        />
      </div>

      <div className="mt-4">
        <DataTable<Nurse>
          columns={columns}
          dataSource={filteredData}
          showSearch={true}
          showFilter={false}
          showRefresh={true}
          searchPlaceholder="搜索护士姓名/手机号/证号"
          onSearch={handleSearch}
          onRefresh={handleRefresh}
          scroll={{ x: 1400 }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
          }}
        />
      </div>
    </div>
  );
}
