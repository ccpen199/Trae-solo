import React from 'react'
import { Table, Card, Space, Typography, Empty } from 'antd'
import { useMediaQuery } from 'antd/es/hooks/useMediaQuery'

const { Text } = Typography

/**
 * 响应式表格组件
 * 桌面端显示完整表格，移动端转为卡片列表展示
 *
 * @param {Object} props
 * @param {Array} props.columns - 列配置，同 antd Table columns
 * @param {Array} props.dataSource - 数据源
 * @param {string} [props.mobileTitleKey] - 移动端卡片标题对应的 dataIndex
 * @param {string} [props.mobileSubtitleKey] - 移动端卡片副标题对应的 dataIndex
 * @param {Function} [props.mobileCardRender] - 自定义移动端卡片渲染
 * @param {Function} [props.onRowClick] - 行点击事件
 * @param {Object} [props.tableProps] - 透传给 antd Table 的属性
 * @param {boolean} [props.loading] - 加载状态
 * @param {string} [props.rowKey] - 行 key
 */

const ResponsiveTable = ({
  columns,
  dataSource,
  mobileTitleKey,
  mobileSubtitleKey,
  mobileCardRender,
  onRowClick,
  tableProps = {},
  loading = false,
  rowKey = 'id'
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)')

  if (isMobile) {
    if (!dataSource?.length && !loading) {
      return <Empty description="暂无数据" />
    }

    return (
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {dataSource?.map((record, index) => {
          const key = record[rowKey] || index

          if (mobileCardRender) {
            return (
              <div
                key={key}
                onClick={() => onRowClick?.(record)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {mobileCardRender(record, index)}
              </div>
            )
          }

          const titleField = columns.find(
            (col) => col.dataIndex === mobileTitleKey
          )
          const subtitleField = columns.find(
            (col) => col.dataIndex === mobileSubtitleKey
          )

          return (
            <Card
              key={key}
              size="small"
              hoverable={!!onRowClick}
              onClick={() => onRowClick?.(record)}
              style={{ borderRadius: 8 }}
              styles={{ body: {  padding: 12 } }}
            >
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {(titleField || mobileTitleKey) && (
                  <div>
                    <Text strong style={{ fontSize: 15 }}>
                      {record[mobileTitleKey]}
                    </Text>
                  </div>
                )}

                {(subtitleField || mobileSubtitleKey) && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {record[mobileSubtitleKey]}
                  </Text>
                )}

                <Space size={[8, 8]} wrap>
                  {columns
                    .filter(
                      (col) =>
                        col.dataIndex !== mobileTitleKey &&
                        col.dataIndex !== mobileSubtitleKey &&
                        !col.hiddenInMobile
                    )
                    .map((col) => {
                      const value = record[col.dataIndex]
                      const renderValue = col.render
                        ? col.render(value, record, index)
                        : value

                      if (value === undefined || value === null || value === '') {
                        return null
                      }

                      return (
                        <div
                          key={col.dataIndex}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            fontSize: 12
                          }}
                        >
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {col.title}
                          </Text>
                          <Text>{renderValue}</Text>
                        </div>
                      )
                    })}
                </Space>
              </Space>
            </Card>
          )
        })}
      </Space>
    )
  }

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey={rowKey}
      loading={loading}
      pagination={{
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `共 ${total} 条`,
        ...tableProps.pagination
      }}
      scroll={{ x: 800 }}
      onRow={(record) => ({
        onClick: () => onRowClick?.(record)
      })}
      {...tableProps}
    />
  )
}

export default ResponsiveTable
