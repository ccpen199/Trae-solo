import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const ExceptionRecordManagement: React.FC = () => {
  const statusMap: { [key: number]: { text: string; color: string } } = {
    0: { text: '待处理', color: 'warning' },
    1: { text: '处理中', color: 'processing' },
    2: { text: '已处理', color: 'success' },
  }

  const columns = [
    { title: '异常编号', dataIndex: 'exceptionNo', required: true, width: 150 },
    { title: '运输委托', dataIndex: 'orderNo', width: 150 },
    { title: '异常类型', dataIndex: 'exceptionType', width: 100 },
    { title: '异常描述', dataIndex: 'description', width: 200 },
    { title: '发生时间', dataIndex: 'occurredAt', width: 160 },
    { title: '上报人', dataIndex: 'reporterName', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      type: 'status' as const,
      width: 100,
      statusMap,
    },
  ]

  return (
    <CrudList
      title="异常记录管理"
      apiPath="/exception-records"
      columns={columns}
    />
  )
}

export default ExceptionRecordManagement
