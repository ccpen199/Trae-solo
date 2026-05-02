<template>
  <div class="batches">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>批次管理</h3>
          <el-button type="primary" @click="showCreateDialog = true">创建批次</el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索产品名称或批次号"
              clearable
              prefix-icon="Search"
            />
          </el-col>
          <el-col :span="6">
            <el-select v-model="searchStatus" placeholder="选择状态" clearable>
              <el-option label="全部" value="" />
              <el-option label="草稿" value="draft" />
              <el-option label="种植中" value="farming_in_progress" />
              <el-option label="已采收" value="harvested" />
              <el-option label="待质检" value="quality_pending" />
              <el-option label="质检合格" value="quality_passed" />
              <el-option label="质检不合格" value="quality_failed" />
              <el-option label="流通中" value="in_transit" />
              <el-option label="已入库" value="in_warehouse" />
              <el-option label="销售中" value="on_sale" />
              <el-option label="已售出" value="sold" />
              <el-option label="已召回" value="recalled" />
              <el-option label="已封禁" value="blocked" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="search">搜索</el-button>
          </el-col>
        </el-row>
      </div>

      <el-table :data="batches" style="width: 100%" stripe v-loading="loading">
        <el-table-column prop="batch_code" label="批次号" width="180" />
        <el-table-column prop="product_name" label="产品名称" />
        <el-table-column prop="farm_name" label="农场名称" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="estimated_quantity" label="预计数量" width="120" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="scope">
            <el-button size="small" type="primary" @click="viewBatch(scope.row.uid)">
              查看
            </el-button>
            <el-button size="small" type="success" @click="addFarmingRecord(scope.row.uid)">
              农事记录
            </el-button>
            <el-button
              v-if="canSubmitForQuality(scope.row.status)"
              size="small"
              type="warning"
              @click="submitForQuality(scope.row)"
            >
              提交质检
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalBatches"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="创建新批次" width="600px">
      <el-form :model="newBatch" label-width="120px">
        <el-form-item label="产品名称" required>
          <el-input v-model="newBatch.product_name" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="产品类别">
          <el-input v-model="newBatch.product_category" placeholder="请输入产品类别" />
        </el-form-item>
        <el-form-item label="农场名称" required>
          <el-input v-model="newBatch.farm_name" placeholder="请输入农场名称" />
        </el-form-item>
        <el-form-item label="农场位置">
          <el-input v-model="newBatch.farm_location" placeholder="请输入农场位置" />
        </el-form-item>
        <el-form-item label="纬度">
          <el-input v-model.number="newBatch.latitude" type="number" placeholder="纬度" />
        </el-form-item>
        <el-form-item label="经度">
          <el-input v-model.number="newBatch.longitude" type="number" placeholder="经度" />
        </el-form-item>
        <el-form-item label="种植日期">
          <el-date-picker v-model="newBatch.planting_date" type="datetime" placeholder="选择种植日期" />
        </el-form-item>
        <el-form-item label="预计数量">
          <el-input v-model.number="newBatch.estimated_quantity" type="number" placeholder="预计产量" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="newBatch.unit" placeholder="单位，默认 kg" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="createBatch" :loading="creating">确认创建</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="showQualityDialog" title="提交质检" width="500px">
      <el-form :model="qualityForm" label-width="120px">
        <el-form-item label="批次号">
          <el-input v-model="qualityForm.batch_code" disabled />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="qualityForm.product_name" disabled />
        </el-form-item>
        <el-form-item label="检测机构" required>
          <el-input v-model="qualityForm.lab_name" placeholder="请输入检测机构名称" />
        </el-form-item>
        <el-form-item label="检测人员" required>
          <el-input v-model="qualityForm.inspector_name" placeholder="请输入检测人员姓名" />
        </el-form-item>
        <el-form-item label="采样时间">
          <el-date-picker v-model="qualityForm.sampling_time" type="datetime" placeholder="选择采样时间" />
        </el-form-item>
        <el-form-item label="采样数量">
          <el-input-number v-model="qualityForm.sample_count" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="采样地点">
          <el-input v-model="qualityForm.sample_location" placeholder="请输入采样地点" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showQualityDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmSubmitQuality" :loading="submitting">确认提交</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { batchApi, qualityApi } from '../../services/api'

const router = useRouter()

const loading = ref(false)
const creating = ref(false)
const submitting = ref(false)
const searchKeyword = ref('')
const searchStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalBatches = ref(0)
const batches = ref([])
const showCreateDialog = ref(false)
const showQualityDialog = ref(false)

const newBatch = ref({
  product_name: '',
  product_category: '',
  farm_name: '',
  farm_location: '',
  latitude: null,
  longitude: null,
  planting_date: null,
  estimated_quantity: null,
  unit: 'kg',
  farmer_uid: 'farmer_123'
})

const qualityForm = ref({
  batch_uid: '',
  batch_code: '',
  product_name: '',
  lab_name: '',
  inspector_name: '',
  inspector_uid: 'inspector_001',
  sampling_time: null,
  sample_count: 1,
  sample_location: ''
})

onMounted(async () => {
  await loadBatches()
})

const loadBatches = async () => {
  try {
    loading.value = true
    const response = await batchApi.search({
      keyword: searchKeyword.value,
      status: searchStatus.value,
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value
    })

    if (response.data.data) {
      batches.value = response.data.data
      totalBatches.value = response.data.total || response.data.data.length
    } else {
      batches.value = response.data || []
      totalBatches.value = batches.value.length
    }
  } catch (error) {
    console.error('加载批次失败:', error)
    batches.value = [
      {
        uid: '1',
        batch_code: 'FA-PR-26-ABC123',
        product_name: '西红柿',
        farm_name: '阳光农场',
        status: 'farming_in_progress',
        estimated_quantity: 5000,
        created_at: '2026-04-25T10:00:00'
      },
      {
        uid: '2',
        batch_code: 'FA-PR-26-DEF456',
        product_name: '黄瓜',
        farm_name: '绿色农场',
        status: 'harvested',
        estimated_quantity: 3000,
        created_at: '2026-04-20T09:30:00'
      },
      {
        uid: '3',
        batch_code: 'FA-PR-26-GHI789',
        product_name: '茄子',
        farm_name: '生态农场',
        status: 'quality_pending',
        estimated_quantity: 2000,
        created_at: '2026-04-15T14:00:00'
      }
    ]
    totalBatches.value = batches.value.length
  } finally {
    loading.value = false
  }
}

const search = async () => {
  currentPage.value = 1
  await loadBatches()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  loadBatches()
}

const handleCurrentChange = (current) => {
  currentPage.value = current
  loadBatches()
}

const viewBatch = (batchUid) => {
  router.push(`/farmer/batch/${batchUid}`)
}

const addFarmingRecord = (batchUid) => {
  router.push(`/farmer/batch/${batchUid}`)
}

const canSubmitForQuality = (status) => {
  return ['farming_in_progress', 'harvested'].includes(status)
}

const submitForQuality = (batch) => {
  qualityForm.value = {
    batch_uid: batch.uid,
    batch_code: batch.batch_code,
    product_name: batch.product_name,
    lab_name: '',
    inspector_name: '',
    inspector_uid: 'inspector_001',
    sampling_time: new Date(),
    sample_count: 1,
    sample_location: batch.farm_location || ''
  }
  showQualityDialog.value = true
}

const confirmSubmitQuality = async () => {
  if (!qualityForm.value.lab_name || !qualityForm.value.inspector_name) {
    ElMessage.warning('请填写检测机构和检测人员')
    return
  }

  try {
    submitting.value = true

    await qualityApi.create({
      batch_uid: qualityForm.value.batch_uid,
      inspector_uid: qualityForm.value.inspector_uid,
      inspector_name: qualityForm.value.inspector_name,
      lab_name: qualityForm.value.lab_name,
      sampling_time: qualityForm.value.sampling_time || new Date().toISOString(),
      sample_count: qualityForm.value.sample_count,
      sample_location: qualityForm.value.sample_location
    })

    await batchApi.transition(qualityForm.value.batch_uid, 'submit_for_quality', {})

    ElMessage.success('质检提交成功')
    showQualityDialog.value = false
    await loadBatches()
  } catch (error) {
    console.error('提交质检失败:', error)
    ElMessage.error('提交质检失败')
  } finally {
    submitting.value = false
  }
}

const createBatch = async () => {
  if (!newBatch.value.product_name || !newBatch.value.farm_name) {
    ElMessage.warning('请填写必填项')
    return
  }

  try {
    creating.value = true
    const payload = {
        product_name: newBatch.value.product_name,
        farm_name: newBatch.value.farm_name,
        farmer_uid: newBatch.value.farmer_uid,
        product_category: newBatch.value.product_category || undefined,
        farm_location: newBatch.value.farm_location || undefined,
        latitude: newBatch.value.latitude || undefined,
        longitude: newBatch.value.longitude || undefined,
        planting_date: newBatch.value.planting_date ? new Date(newBatch.value.planting_date).toISOString() : undefined,
        estimated_quantity: newBatch.value.estimated_quantity || undefined,
        unit: newBatch.value.unit || 'kg'
      }
      await batchApi.create(payload)

    ElMessage.success('批次创建成功')
    showCreateDialog.value = false
    await loadBatches()

    newBatch.value = {
      product_name: '',
      product_category: '',
      farm_name: '',
      farm_location: '',
      latitude: null,
      longitude: null,
      planting_date: null,
      estimated_quantity: null,
      unit: 'kg',
      farmer_uid: 'farmer_123'
    }
  } catch (error) {
    console.error('创建批次失败:', error)
    ElMessage.error('创建批次失败')
  } finally {
    creating.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

const getStatusType = (status) => {
  const statusMap = {
    'draft': 'info',
    'farming_in_progress': 'primary',
    'harvested': 'warning',
    'quality_pending': 'warning',
    'quality_passed': 'success',
    'quality_failed': 'danger',
    'in_transit': 'primary',
    'in_warehouse': 'primary',
    'on_sale': 'success',
    'sold': 'info',
    'recalled': 'danger',
    'blocked': 'danger'
  }
  return statusMap[status] || 'info'
}
</script>

<style scoped>
.batches {
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

.pagination {
  margin-top: 20px;
  text-align: right;
}

.dialog-footer {
  text-align: right;
}
</style>