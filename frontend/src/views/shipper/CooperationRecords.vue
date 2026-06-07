<template>
  <div class="cooperation-page">
    <el-card shadow="hover">
      <template #header>
        <span class="card-title">合作记录</span>
      </template>

      <el-table :data="records" v-loading="loading" stripe>
        <el-table-column label="司机信息" min-width="200">
          <template #default="{ row }">
            <div class="driver-info">
              <el-avatar :size="44">{{ row.driver_name?.charAt(0) }}</el-avatar>
              <div class="driver-detail">
                <div class="driver-name">{{ row.driver_name }}</div>
                <div class="driver-phone">{{ row.driver_phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="运单信息" min-width="200">
          <template #default="{ row }">
            <div class="waybill-info">
              <div class="waybill-id">运单号: {{ row.waybill_id }}</div>
              <div class="waybill-cargo">{{ row.cargo_name }}</div>
              <div class="waybill-route">
                {{ row.departure_city }} → {{ row.destination_city }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="运费(元)" width="120">
          <template #default="{ row }">
            <span class="price">¥{{ row.price?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="completed_at" label="完成时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.completed_at) }}
          </template>
        </el-table-column>
        <el-table-column label="评价" width="180">
          <template #default="{ row }">
            <div class="rating-box" v-if="row.rating">
              <el-rate v-model="row.rating" disabled :max="5" />
            </div>
            <span v-else class="no-rating">暂无评价</span>
          </template>
        </el-table-column>
        <el-table-column label="评价内容" min-width="180">
          <template #default="{ row }">
            <span v-if="row.comment" class="comment">{{ row.comment }}</span>
            <span v-else class="no-comment">暂无评价内容</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewWaybill(row.waybill_id)">运单详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && records.length === 0" description="暂无合作记录" />

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchRecords"
          @current-change="fetchRecords"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { shipperApi } from '../../api/index'

const router = useRouter()
const loading = ref(false)

const pagination = reactive({
  page: 1,
  page_size: 10,
  total: 0
})

const records = ref([])

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

function viewWaybill(id) {
  router.push(`/waybill/${id}`)
}

async function fetchRecords() {
  loading.value = true
  try {
    const res = await shipperApi.getCooperationRecords({
      page: pagination.page,
      page_size: pagination.page_size
    })
    const data = res.data || {}
    records.value = data.list || data || []
    pagination.total = data.total || records.value.length
  } catch (e) {
    ElMessage.error('获取合作记录失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRecords()
})
</script>

<style scoped>
.cooperation-page {
  padding: 0;
}
.card-title {
  font-weight: 600;
  font-size: 16px;
}
.driver-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.driver-detail {
  flex: 1;
}
.driver-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}
.driver-phone {
  font-size: 13px;
  color: #909399;
  margin-top: 2px;
}
.waybill-info {
  line-height: 1.6;
}
.waybill-id {
  font-size: 13px;
  color: #909399;
}
.waybill-cargo {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}
.waybill-route {
  font-size: 13px;
  color: #606266;
}
.price {
  font-size: 16px;
  font-weight: 600;
  color: #f56c6c;
}
.rating-box {
  display: flex;
  align-items: center;
}
.no-rating,
.no-comment {
  color: #c0c4cc;
  font-size: 13px;
}
.comment {
  font-size: 13px;
  color: #606266;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
