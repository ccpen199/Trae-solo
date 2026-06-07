<template>
  <div class="cargo-pool">
    <el-card>
      <template #header>
        <div class="card-header">
          <span><el-icon><Goods /></el-icon> 货源接单池</span>
          <el-button type="primary" @click="loadData" :loading="loading">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
      </template>
      <el-form :inline="true" class="search-form">
        <el-form-item label="城市">
          <el-input v-model="searchForm.city" placeholder="出发/到达城市" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="车型">
          <el-select v-model="searchForm.vehicle_type" placeholder="车辆类型" clearable style="width: 150px">
            <el-option label="平板车" value="平板车" />
            <el-option label="高栏车" value="高栏车" />
            <el-option label="厢式车" value="厢式车" />
            <el-option label="冷藏车" value="冷藏车" />
            <el-option label="自卸车" value="自卸车" />
            <el-option label="半挂车" value="半挂车" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData" :loading="loading">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon> 重置
          </el-button>
        </el-form-item>
      </el-form>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="cargo_name" label="货源名称" min-width="150" />
        <el-table-column label="路线" min-width="200">
          <template #default="{ row }">
            <div class="route">
              <span class="city">{{ row.start_city }}</span>
              <el-icon class="arrow"><Right /></el-icon>
              <span class="city">{{ row.end_city }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="distance" label="距离(km)" width="100">
          <template #default="{ row }">{{ row.distance || '-' }}</template>
        </el-table-column>
        <el-table-column label="建议价格" width="130">
          <template #default="{ row }">
            <span class="price">¥{{ row.min_price || 0 }} - {{ row.max_price || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="loading_time" label="装货时间" width="180">
          <template #default="{ row }">
            <el-icon><Clock /></el-icon> {{ formatDate(row.loading_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="vehicle_type_required" label="车型要求" width="120" />
        <el-table-column prop="company_name" label="货主" min-width="150">
          <template #default="{ row }">{{ row.company_name || row.shipper_name }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openBidDialog(row)">
              <el-icon><Money /></el-icon> 报价
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
        class="pagination"
      />
    </el-card>

    <el-dialog v-model="bidDialogVisible" title="提交报价" width="500px">
      <el-descriptions :column="1" size="small" border class="bid-info">
        <el-descriptions-item label="货源">
          <span class="cargo-name">{{ currentCargo?.cargo_name }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="路线">
          {{ currentCargo?.start_city }} → {{ currentCargo?.end_city }}
        </el-descriptions-item>
        <el-descriptions-item label="建议价格">
          ¥{{ currentCargo?.min_price || 0 }} - {{ currentCargo?.max_price || 0 }}
        </el-descriptions-item>
      </el-descriptions>
      <el-form :model="bidForm" :rules="bidRules" ref="bidFormRef" label-width="100px" class="bid-form">
        <el-form-item label="报价金额" prop="bid_price">
          <el-input-number v-model="bidForm.bid_price" :min="currentCargo?.min_price || 0" :max="currentCargo?.max_price || 999999" :step="10" style="width: 100%" />
          <div class="price-tip" v-if="currentCargo">报价范围: ¥{{ currentCargo.min_price || 0 }} - {{ currentCargo.max_price || 0 }}</div>
        </el-form-item>
        <el-form-item label="留言" prop="message">
          <el-input v-model="bidForm.message" type="textarea" :rows="3" placeholder="请输入留言（选填）" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bidDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBid" :loading="bidLoading">提交报价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Goods, Refresh, Search, Right, Clock, Money } from '@element-plus/icons-vue'
import { driverApi } from '../../api'

const loading = ref(false)
const bidLoading = ref(false)
const tableData = ref([])
const bidDialogVisible = ref(false)
const bidFormRef = ref()
const currentCargo = ref(null)

const searchForm = reactive({
  city: '',
  vehicle_type: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const bidForm = reactive({
  bid_price: null,
  message: ''
})

const bidRules = {
  bid_price: [{ required: true, message: '请输入报价金额', trigger: 'blur' }]
}

function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

async function loadData() {
  loading.value = true
  try {
    const res = await driverApi.getCargoPool({
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

function resetSearch() {
  searchForm.city = ''
  searchForm.vehicle_type = ''
  pagination.page = 1
  loadData()
}

function openBidDialog(row) {
  currentCargo.value = row
  bidForm.bid_price = row.min_price || null
  bidForm.message = ''
  bidDialogVisible.value = true
}

async function submitBid() {
  if (!bidFormRef.value || !currentCargo.value) return
  try {
    await bidFormRef.value.validate()
    bidLoading.value = true
    await driverApi.placeBid(currentCargo.value.id, bidForm)
    ElMessage.success('报价已发送，等待货主确认')
    bidDialogVisible.value = false
    loadData()
  } catch (err) {
    console.error(err)
  } finally {
    bidLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.cargo-pool {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}
.search-form {
  margin-bottom: 20px;
}
.route {
  display: flex;
  align-items: center;
  gap: 8px;
}
.city {
  font-weight: 500;
}
.arrow {
  color: #409eff;
}
.price {
  color: #f56c6c;
  font-weight: 600;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.bid-info {
  margin-bottom: 20px;
}
.cargo-name {
  font-weight: 600;
  color: #303133;
}
.price-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}
.bid-form {
  margin-top: 20px;
}
</style>
