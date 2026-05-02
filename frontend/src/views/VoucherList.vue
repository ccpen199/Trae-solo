<template>
  <div class="voucher-list-page">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <span class="page-title">凭证列表</span>
          <el-button type="primary" @click="$router.push('/vouchers/create')">
            <el-icon><Plus /></el-icon>
            新建凭证
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="filters" class="search-form">
        <el-form-item label="凭证状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 150px;">
            <el-option label="草稿" value="draft" />
            <el-option label="待审核" value="pending_review" />
            <el-option label="审核中" value="under_review" />
            <el-option label="审核通过" value="review_passed" />
            <el-option label="审核驳回" value="review_rejected" />
            <el-option label="待生成账簿" value="pending_ledger" />
            <el-option label="账簿已生成" value="ledger_generated" />
            <el-option label="待出报表" value="pending_report" />
            <el-option label="报表已生成" value="report_generated" />
            <el-option label="待月末结账" value="pending_closure" />
            <el-option label="已关闭" value="closed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="会计期间">
          <el-date-picker
            v-model="filters.period"
            type="month"
            placeholder="选择月份"
            value-format="YYYY-MM"
            style="width: 150px;"
          />
        </el-form-item>
        <el-form-item label="凭证类型">
          <el-select v-model="filters.voucher_type" placeholder="全部类型" clearable style="width: 150px;">
            <el-option label="收款凭证" value="收款凭证" />
            <el-option label="付款凭证" value="付款凭证" />
            <el-option label="转账凭证" value="转账凭证" />
            <el-option label="记账凭证" value="记账凭证" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="凭证编号/创建人" clearable style="width: 200px;" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="vouchers" v-loading="loading" style="width: 100%;" @row-click="viewVoucher">
        <el-table-column prop="voucher_no" label="凭证编号" width="180" fixed />
        <el-table-column prop="voucher_type" label="凭证类型" width="120" />
        <el-table-column prop="voucher_date" label="凭证日期" width="120" />
        <el-table-column prop="period" label="会计期间" width="120" />
        <el-table-column prop="creator_name" label="创建人" width="100" />
        <el-table-column prop="total_debit" label="借方总额" width="120">
          <template #default="{ row }">
            ¥{{ row.total_debit?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="total_credit" label="贷方总额" width="120">
          <template #default="{ row }">
            ¥{{ row.total_credit?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <span :class="['status-tag', `status-${row.status}`]">
              {{ row.statusLabel }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="viewVoucher(row.id)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        style="margin-top: 20px; justify-content: flex-end;"
        @size-change="loadVouchers"
        @current-change="loadVouchers"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()

const loading = ref(false)
const vouchers = ref([])

const filters = reactive({
  status: '',
  period: '',
  voucher_type: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

async function loadVouchers() {
  loading.value = true
  try {
    const params = {
      limit: pagination.pageSize,
      offset: (pagination.page - 1) * pagination.pageSize
    }
    if (filters.status) params.status = filters.status
    if (filters.period) params.period = filters.period
    if (filters.voucher_type) params.voucher_type = filters.voucher_type
    if (filters.keyword) params.keyword = filters.keyword

    const result = await api.getVouchers(params)
    if (result.success) {
      vouchers.value = result.data
      pagination.total = result.data.length
    }
  } catch (error) {
    console.error('加载凭证列表失败:', error)
  } finally {
    loading.value = false
  }
}

function search() {
  pagination.page = 1
  loadVouchers()
}

function reset() {
  filters.status = ''
  filters.period = ''
  filters.voucher_type = ''
  filters.keyword = ''
  pagination.page = 1
  loadVouchers()
}

function viewVoucher(id) {
  router.push(`/vouchers/${id}`)
}

onMounted(() => {
  loadVouchers()
})
</script>

<style scoped>
.search-form {
  margin-bottom: 20px;
}
</style>
