<template>
  <div class="farming-records">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>农事记录管理</h3>
        </div>
      </template>

      <div class="search-bar">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-select v-model="filterBatchUid" placeholder="选择批次" clearable @change="loadRecords">
              <el-option
                v-for="batch in batches"
                :key="batch.uid"
                :label="`${batch.batch_code} - ${batch.product_name}`"
                :value="batch.uid"
              />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="filterOperationType" placeholder="选择操作类型" clearable @change="loadRecords">
              <el-option label="种植" value="planting" />
              <el-option label="灌溉" value="irrigation" />
              <el-option label="施肥" value="fertilization" />
              <el-option label="施药" value="pesticide_application" />
              <el-option label="除草" value="weed_control" />
              <el-option label="采收" value="harvest" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="loadRecords">搜索</el-button>
          </el-col>
        </el-row>
      </div>

      <el-table :data="records" style="width: 100%" stripe v-loading="loading">
        <el-table-column prop="batch_code" label="批次号" width="180" />
        <el-table-column prop="product_name" label="产品名称" width="120" />
        <el-table-column prop="operation_type" label="操作类型" width="120">
          <template #default="scope">
            <el-tag>{{ getOperationTypeName(scope.row.operation_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operation_name" label="操作名称" />
        <el-table-column prop="operation_time" label="操作时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.operation_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="operator_name" label="操作人" width="100" />
        <el-table-column label="照片" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.photo_urls && Object.keys(scope.row.photo_urls).length > 0" type="success">有</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="scope">
            <el-button size="small" type="primary" @click="viewRecord(scope.row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="records.length === 0 && !loading" class="empty-tip">
        暂无农事记录
      </div>

      <div class="pagination" v-if="totalRecords > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalRecords"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="showDetailDialog" title="农事记录详情" width="600px">
      <div v-if="selectedRecord">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="批次号">{{ selectedRecord.batch_code || selectedRecord.batch_uid }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ selectedRecord.product_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">{{ getOperationTypeName(selectedRecord.operation_type) }}</el-descriptions-item>
          <el-descriptions-item label="操作名称">{{ selectedRecord.operation_name }}</el-descriptions-item>
          <el-descriptions-item label="操作时间" :span="2">{{ formatDate(selectedRecord.operation_time) }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ selectedRecord.operator_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设备">{{ selectedRecord.equipment_used || '-' }}</el-descriptions-item>
          <el-descriptions-item label="经度">{{ selectedRecord.longitude || '-' }}</el-descriptions-item>
          <el-descriptions-item label="纬度">{{ selectedRecord.latitude || '-' }}</el-descriptions-item>
          <el-descriptions-item label="位置描述" :span="2">{{ selectedRecord.location_description || '-' }}</el-descriptions-item>
          <el-descriptions-item label="农药名称">{{ selectedRecord.pesticide_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="农药剂量">
            {{ selectedRecord.pesticide_dosage ? `${selectedRecord.pesticide_dosage} ${selectedRecord.pesticide_unit || ''}` : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="肥料名称">{{ selectedRecord.fertilizer_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="肥料剂量">
            {{ selectedRecord.fertilizer_dosage ? `${selectedRecord.fertilizer_dosage} ${selectedRecord.fertilizer_unit || ''}` : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ selectedRecord.notes || '-' }}</el-descriptions-item>
          <el-descriptions-item label="数字时间戳" :span="2">
            <el-tooltip :content="selectedRecord.digital_timestamp">
              <span class="timestamp">{{ selectedRecord.digital_timestamp }}</span>
            </el-tooltip>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ formatDate(selectedRecord.created_at) }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="selectedRecord.photo_urls && Object.keys(selectedRecord.photo_urls).length > 0" class="photo-list">
          <h4>照片</h4>
          <div class="photo-items">
            <el-image
              v-for="(url, key) in selectedRecord.photo_urls"
              :key="key"
              :src="url"
              fit="cover"
              class="photo-item"
              :preview-src-list="Object.values(selectedRecord.photo_urls)"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { farmingApi, batchApi } from '../../services/api'

const loading = ref(false)
const records = ref([])
const batches = ref([])
const showDetailDialog = ref(false)
const selectedRecord = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)
const totalRecords = ref(0)
const filterBatchUid = ref('')
const filterOperationType = ref('')

const operationTypeNames = {
  'planting': '种植',
  'irrigation': '灌溉',
  'fertilization': '施肥',
  'pesticide_application': '施药',
  'weed_control': '除草',
  'harvest': '采收',
  'other': '其他'
}

onMounted(async () => {
  await loadBatches()
  await loadRecords()
})

const loadBatches = async () => {
  try {
    const response = await batchApi.search({})
    batches.value = response.data.data || response.data || []
  } catch (error) {
    console.error('加载批次列表失败:', error)
  }
}

const loadRecords = async () => {
  try {
    loading.value = true
    const params = {
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value
    }

    if (filterBatchUid.value) {
      const response = await farmingApi.getByBatch(filterBatchUid.value, params)
      records.value = response.data
      totalRecords.value = response.data.length
    } else {
      records.value = []
      totalRecords.value = 0
    }
  } catch (error) {
    console.error('加载农事记录失败:', error)
    ElMessage.error('加载农事记录失败')
  } finally {
    loading.value = false
  }
}

const getOperationTypeName = (type) => {
  return operationTypeNames[type] || type || '未知'
}

const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

const handleSizeChange = (size) => {
  pageSize.value = size
  loadRecords()
}

const handleCurrentChange = (current) => {
  currentPage.value = current
  loadRecords()
}

const viewRecord = (record) => {
  selectedRecord.value = record
  showDetailDialog.value = true
}
</script>

<style scoped>
.farming-records {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.search-bar {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.empty-tip {
  padding: 40px;
  text-align: center;
  color: #909399;
  font-size: 16px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.photo-list {
  margin-top: 20px;
}

.photo-list h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #303133;
}

.photo-items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.photo-item {
  width: 100px;
  height: 100px;
  border-radius: 4px;
}

.timestamp {
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
}
</style>