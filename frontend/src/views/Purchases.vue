<template>
  <div class="card-container">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h3>采购申请</h3>
      <el-button type="primary" @click="$router.push('/purchases/create')">
        <el-icon><Plus /></el-icon>
        新建申请
      </el-button>
    </div>

    <el-form :inline="true" class="search-form">
      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 150px;">
          <el-option label="草稿" value="draft" />
          <el-option label="已提交" value="submitted" />
          <el-option label="待审批" value="pending_approval" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词">
        <el-input v-model="searchForm.keyword" placeholder="订单号/标题" clearable style="width: 200px;" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadPurchases">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="purchases" v-loading="loading" stripe @row-click="viewDetail" style="cursor: pointer;">
      <el-table-column prop="order_no" label="订单号" width="200" />
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="creator_name" label="申请人" width="100" />
      <el-table-column prop="total_amount_with_tax" label="总金额" width="120">
        <template #default="{ row }">
          ¥{{ row.total_amount_with_tax?.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ getStatusName(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="text" size="small" @click.stop="viewDetail(row)">查看</el-button>
          <el-button 
            v-if="row.status === 'draft' && row.created_by === userInfo?.id" 
            type="text" 
            size="small" 
            @click.stop="submitPurchase(row)"
          >
            提交
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const loading = ref(false)
const purchases = ref([])

const searchForm = reactive({
  status: '',
  keyword: ''
})

const statusMap = {
  draft: { name: '草稿', type: 'info' },
  submitted: { name: '已提交', type: 'warning' },
  pending_approval: { name: '待审批', type: 'warning' },
  approved: { name: '已通过', type: 'success' },
  rejected: { name: '已驳回', type: 'danger' },
  pending_order: { name: '待下单', type: 'primary' },
  ordered: { name: '已下单', type: 'primary' },
  receiving: { name: '收货中', type: 'warning' },
  received: { name: '已收货', type: 'success' },
  pending_settlement: { name: '待结算', type: 'warning' },
  settled: { name: '已结算', type: 'success' },
  archived: { name: '已归档', type: 'info' },
  cancelled: { name: '已取消', type: 'info' }
}

const getStatusName = (status) => statusMap[status]?.name || status
const getStatusType = (status) => statusMap[status]?.type || 'info'

const formatDate = (date) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const loadPurchases = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.keyword) params.keyword = searchForm.keyword
    
    purchases.value = await request.get('/purchases/', { params })
  } catch (error) {
    console.error('加载采购申请失败:', error)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.status = ''
  searchForm.keyword = ''
  loadPurchases()
}

const viewDetail = (row) => {
  router.push(`/purchases/${row.id}`)
}

const submitPurchase = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要提交采购申请 "${row.title}" 吗？提交后将进入审批流程。`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await request.post(`/purchases/${row.id}/submit`)
    ElMessage.success('提交成功')
    loadPurchases()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('提交失败:', error)
    }
  }
}

onMounted(() => {
  loadPurchases()
})
</script>
