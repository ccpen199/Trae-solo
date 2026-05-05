import React from 'react'
import CrudList from '../../components/CrudList/CrudList'

const ClaimManagement: React.FC = () => {
  const statusMap: { [key: number]: { text: string; color: string } } = {
    0: { text: '待审核', color: 'warning' },
    1: { text: '审核中', color: 'processing' },
    2: { text: '已通过', color: 'success' },
    3: { text: '已驳回', color: 'error' },
  }

  const columns = [
    { title: '索赔编号', dataIndex: 'claimNo', required: true, width: 150 },
    { title: '运输委托', dataIndex: 'orderNo', width: 150 },
    { title: '索赔类型', dataIndex: 'claimType', width: 100 },
    { title: '索赔金额', dataIndex: 'claimAmount', width: 120 },
    { title: '索赔描述', dataIndex: 'description', width: 200 },
    { title: '提交人', dataIndex: 'submitterName', width: 100 },
    { title: '提交时间', dataIndex: 'submittedAt', width: 160 },
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
      title="索赔管理"
      apiPath="/claims"
      columns={columns}
    />
  )
}

export default ClaimManagement
