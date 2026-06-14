import React from 'react';
import { Table, Card, Space, Button, Tooltip } from 'antd';
import { ReloadOutlined, SettingOutlined, DownloadOutlined, FullscreenOutlined } from '@ant-design/icons';
import { useState, useMemo } from 'react';
import type { TableProps } from 'antd';
import { cn } from '@/lib/utils';
import useTable, { UseTableParams } from '@/hooks/useTable';

export type TableProColumn<RecordType extends object = any> = TableProps<RecordType>['columns'][number] & {
  hideInTable?: boolean;
  width?: number;
  ellipsis?: boolean;
  copyable?: boolean;
};

export interface TableProProps<RecordType extends object = any> extends Omit<TableProps<RecordType>, 'columns' | 'dataSource' | 'loading' | 'pagination'> {
  columns: TableProColumn<RecordType>[];
  request?: UseTableParams<RecordType>['request'];
  params?: Record<string, any>;
  manual?: boolean;
  showToolbar?: boolean;
  toolbarExtra?: React.ReactNode;
  showReload?: boolean;
  showSettings?: boolean;
  showExport?: boolean;
  showFullscreen?: boolean;
  onExport?: () => void;
  cardClassName?: string;
  tableClassName?: string;
  rowKey?: string;
}

function TablePro<RecordType extends object = any>(props: TableProProps<RecordType>) {
  const {
    columns,
    request,
    params = {},
    manual = false,
    showToolbar = true,
    toolbarExtra,
    showReload = true,
    showSettings = true,
    showExport = false,
    showFullscreen = false,
    onExport,
    cardClassName,
    tableClassName,
    rowKey = 'id',
    ...rest
  } = props;

  const [columnSettings, setColumnSettings] = useState<Record<string, { visible: boolean; width?: number }>>({});
  const [fullscreen, setFullscreen] = useState(false);

  const tableColumns = useMemo(() => {
    return columns
      .filter(col => !col.hideInTable)
      .filter(col => !('dataIndex' in col) || columnSettings[col.dataIndex as string]?.visible !== false)
      .map(col => ({
        ...col,
        ...('dataIndex' in col ? { width: columnSettings[col.dataIndex as string]?.width || col.width } : {}),
      }));
  }, [columns, columnSettings]);

  const { data, loading, pagination, refresh, setParams } = useTable<RecordType>({
    request,
    params,
    manual,
  });

  const handlePageChange = (page: number, pageSize: number) => {
    setParams({ ...params, page, pageSize });
  };

  const handleRefresh = () => {
    refresh();
  };

  const handleFullscreen = () => {
    setFullscreen(!fullscreen);
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const toolbar = (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">{toolbarExtra}</div>
      <Space>
        {showExport && (
          <Tooltip title="导出">
            <Button icon={<DownloadOutlined />} onClick={onExport} />
          </Tooltip>
        )}
        {showReload && (
          <Tooltip title="刷新">
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading} />
          </Tooltip>
        )}
        {showFullscreen && (
          <Tooltip title="全屏">
            <Button icon={<FullscreenOutlined />} onClick={handleFullscreen} />
          </Tooltip>
        )}
        {showSettings && (
          <Tooltip title="列设置">
            <Button icon={<SettingOutlined />} />
          </Tooltip>
        )}
      </Space>
    </div>
  );

  return (
    <Card
      className={cn(
        'shadow-none border border-neutral-100 dark:border-neutral-700',
        fullscreen && 'fixed inset-4 z-50 overflow-auto',
        cardClassName
      )}
      bodyStyle={{ padding: '16px' }}
    >
      {showToolbar && toolbar}
      <Table<RecordType>
        rowKey={rowKey}
        columns={tableColumns as TableProps<RecordType>['columns']}
        dataSource={data as RecordType[]}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: handlePageChange,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        scroll={{ x: 'max-content' }}
        className={cn(tableClassName)}
        {...rest}
      />
    </Card>
  );
}

export default TablePro;
