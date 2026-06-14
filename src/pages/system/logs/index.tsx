import { useState } from 'react';
import { Tabs, Select, Input, Button, Space, Drawer, Descriptions, Tag, DatePicker, message } from 'antd';
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageContainer, TablePro, StatusTag } from '@/components/common';
import {
  getOperationLogList,
  getLoginLogList,
  type OperationLog,
  type OperationLogListParams,
  type LoginLog,
  type LoginLogListParams,
} from '@/services/api/system';
import { formatDateTime } from '@/utils/format';

const { RangePicker } = DatePicker;

const moduleOptions = [
  { label: '用户管理', value: 'user' },
  { label: '角色管理', value: 'role' },
  { label: '场所管理', value: 'place' },
  { label: '预约管理', value: 'reservation' },
  { label: '告警管理', value: 'alarm' },
  { label: '巡检管理', value: 'inspection' },
  { label: '系统管理', value: 'system' },
];

const actionTypeOptions = [
  { label: '新增', value: 'create' },
  { label: '编辑', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '查询', value: 'query' },
  { label: '导出', value: 'export' },
  { label: '登录', value: 'login' },
  { label: '其他', value: 'other' },
];

const statusOptions = [
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
];

const LogAudit = () => {
  const [activeTab, setActiveTab] = useState('operation');
  const [opSearchParams, setOpSearchParams] = useState<OperationLogListParams>({} as OperationLogListParams);
  const [loginSearchParams, setLoginSearchParams] = useState<LoginLogListParams>({} as LoginLogListParams);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [currentDetail, setCurrentDetail] = useState<OperationLog | null>(null);

  const handleViewDetail = (record: OperationLog) => {
    setCurrentDetail(record);
    setDetailDrawerOpen(true);
  };

  const handleExport = () => {
    message.success('日志导出任务已提交，请稍后在下载中心查看');
  };

  const opColumns = [
    { title: '操作人', dataIndex: 'realName', key: 'realName', width: 100 },
    { title: '操作模块', dataIndex: 'module', key: 'module', width: 120 },
    { title: '操作内容', dataIndex: 'operation', key: 'operation', width: 180, ellipsis: true },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 130 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <StatusTag status={status === 'success' ? 'success' : 'danger'} text={status === 'success' ? '成功' : '失败'} />
      ),
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (v: number) => (v ? `${v}ms` : '-'),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: OperationLog) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  const loginColumns = [
    { title: '用户名', dataIndex: 'username', key: 'username', width: 120 },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 130 },
    { title: '归属地', dataIndex: 'location', key: 'location', width: 120 },
    { title: '设备', dataIndex: 'device', key: 'device', width: 120, ellipsis: true },
    { title: '浏览器', dataIndex: 'browser', key: 'browser', width: 120, ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <StatusTag status={status === 'success' ? 'success' : 'danger'} text={status === 'success' ? '成功' : '失败'} />
      ),
    },
    {
      title: '失败原因',
      dataIndex: 'failReason',
      key: 'failReason',
      width: 140,
      render: (v: string) => v || '-',
    },
    {
      title: '时间',
      dataIndex: 'loginTime',
      key: 'loginTime',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
  ];

  return (
    <PageContainer
      title="日志审计"
      subTitle="系统操作日志与登录日志查看"
      extra={
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          导出日志
        </Button>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'operation',
            label: '操作日志',
            children: (
              <TablePro<OperationLog>
                rowKey="id"
                columns={opColumns}
                request={async (params) => {
                  const res = await getOperationLogList(params as OperationLogListParams);
                  return {
                    list: res.data?.list || [],
                    total: res.data?.total || 0,
                  };
                }}
                params={opSearchParams}
                showExport
                onExport={handleExport}
                toolbarExtra={
                  <Space wrap>
                    <Input
                      placeholder="操作人"
                      allowClear
                      style={{ width: 120 }}
                      onChange={(e) => setOpSearchParams({ ...opSearchParams, realName: e.target.value || undefined } as OperationLogListParams)}
                    />
                    <Select
                      placeholder="操作模块"
                      allowClear
                      style={{ width: 130 }}
                      options={moduleOptions}
                      onChange={(v) => setOpSearchParams({ ...opSearchParams, module: v })}
                    />
                    <Select
                      placeholder="操作类型"
                      allowClear
                      style={{ width: 120 }}
                      options={actionTypeOptions}
                      onChange={(v) => setOpSearchParams({ ...opSearchParams, operation: v } as OperationLogListParams)}
                    />
                    <Select
                      placeholder="状态"
                      allowClear
                      style={{ width: 100 }}
                      options={statusOptions}
                      onChange={(v) => setOpSearchParams({ ...opSearchParams, status: v })}
                    />
                    <RangePicker
                      placeholder={['开始日期', '结束日期']}
                      style={{ width: 240 }}
                      onChange={(dates) => {
                        if (dates && dates[0] && dates[1]) {
                          setOpSearchParams({
                            ...opSearchParams,
                            startDate: dayjs(dates[0]).format('YYYY-MM-DD'),
                            endDate: dayjs(dates[1]).format('YYYY-MM-DD'),
                          });
                        } else {
                          const { startDate, endDate, ...rest } = opSearchParams;
                          setOpSearchParams(rest as OperationLogListParams);
                        }
                      }}
                    />
                  </Space>
                }
              />
            ),
          },
          {
            key: 'login',
            label: '登录日志',
            children: (
              <TablePro<LoginLog>
                rowKey="id"
                columns={loginColumns}
                request={async (params) => {
                  const res = await getLoginLogList(params as LoginLogListParams);
                  return {
                    list: res.data?.list || [],
                    total: res.data?.total || 0,
                  };
                }}
                params={loginSearchParams}
                showExport
                onExport={handleExport}
                toolbarExtra={
                  <Space wrap>
                    <Input
                      placeholder="用户名"
                      allowClear
                      style={{ width: 120 }}
                      onChange={(e) => setLoginSearchParams({ ...loginSearchParams, username: e.target.value || undefined })}
                    />
                    <Select
                      placeholder="状态"
                      allowClear
                      style={{ width: 100 }}
                      options={statusOptions}
                      onChange={(v) => setLoginSearchParams({ ...loginSearchParams, status: v })}
                    />
                    <RangePicker
                      placeholder={['开始日期', '结束日期']}
                      style={{ width: 240 }}
                      onChange={(dates) => {
                        if (dates && dates[0] && dates[1]) {
                          setLoginSearchParams({
                            ...loginSearchParams,
                            startDate: dayjs(dates[0]).format('YYYY-MM-DD'),
                            endDate: dayjs(dates[1]).format('YYYY-MM-DD'),
                          });
                        } else {
                          const { startDate, endDate, ...rest } = loginSearchParams;
                          setLoginSearchParams(rest as LoginLogListParams);
                        }
                      }}
                    />
                  </Space>
                }
              />
            ),
          },
        ]}
      />

      <Drawer
        title="日志详情"
        open={detailDrawerOpen}
        onClose={() => { setDetailDrawerOpen(false); setCurrentDetail(null); }}
        width={520}
        destroyOnClose
      >
        {currentDetail && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="操作人">{currentDetail.realName}</Descriptions.Item>
            <Descriptions.Item label="用户名">{currentDetail.username}</Descriptions.Item>
            <Descriptions.Item label="操作模块">{currentDetail.module}</Descriptions.Item>
            <Descriptions.Item label="操作内容">{currentDetail.operation}</Descriptions.Item>
            <Descriptions.Item label="请求方法">
              <Tag>{currentDetail.method}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="请求参数">
              <div style={{ maxHeight: 120, overflow: 'auto', wordBreak: 'break-all', fontSize: 12, color: '#666' }}>
                {currentDetail.params || '-'}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="IP地址">{currentDetail.ip}</Descriptions.Item>
            <Descriptions.Item label="归属地">{currentDetail.location || '-'}</Descriptions.Item>
            <Descriptions.Item label="浏览器UA">
              <div style={{ maxHeight: 80, overflow: 'auto', wordBreak: 'break-all', fontSize: 12, color: '#666' }}>
                {currentDetail.userAgent || '-'}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <StatusTag
                status={currentDetail.status === 'success' ? 'success' : 'danger'}
                text={currentDetail.status === 'success' ? '成功' : '失败'}
              />
            </Descriptions.Item>
            <Descriptions.Item label="耗时">
              {currentDetail.duration ? `${currentDetail.duration}ms` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="操作时间">{formatDateTime(currentDetail.createdAt)}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default LogAudit;
