<template>
  <div class="batch-detail">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>批次详情</h3>
          <el-button @click="goBack">返回列表</el-button>
        </div>
      </template>

      <div v-if="loading" class="loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <div v-else-if="batch" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="批次号">{{ batch.batch_code }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ batch.product_name }}</el-descriptions-item>
          <el-descriptions-item label="农场名称">{{ batch.farm_name }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(batch.status)">{{ batch.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预计数量">{{ batch.estimated_quantity }} {{ batch.unit }}</el-descriptions-item>
          <el-descriptions-item label="实际数量">{{ batch.actual_quantity || '-' }} {{ batch.unit }}</el-descriptions-item>
          <el-descriptions-item label="农场位置" :span="2">{{ batch.farm_location || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(batch.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(batch.updated_at) }}</el-descriptions-item>
        </el-descriptions>

        <div class="section">
          <h4>农事记录</h4>
          <div class="farming-actions">
            <el-button type="primary" @click="showAddRecordDialog = true">添加农事记录</el-button>
            <el-button type="success" @click="showPhotoDialog = true">拍照存证</el-button>
          </div>

          <el-table :data="farmingRecords" style="width: 100%" stripe>
            <el-table-column prop="operation_time" label="操作时间" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.operation_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="operation_type" label="操作类型" width="120" />
            <el-table-column prop="operation_name" label="操作名称" />
            <el-table-column prop="operator_name" label="操作人" width="100" />
            <el-table-column label="照片" width="80">
              <template #default="scope">
                <el-tag v-if="scope.row.photo_urls && Object.keys(scope.row.photo_urls).length > 0" type="success">有</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button size="small" type="primary" @click="viewFarmingRecord(scope.row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="farmingRecords.length === 0" class="empty-tip">
            暂无农事记录
          </div>
        </div>
      </div>

      <div v-else class="empty-tip">
        未找到批次信息
      </div>
    </el-card>

    <el-dialog v-model="showAddRecordDialog" title="添加农事记录" width="600px">
      <el-form :model="newRecord" label-width="120px">
        <el-form-item label="批次UID" required>
          <el-input v-model="newRecord.batch_uid" disabled />
        </el-form-item>
        <el-form-item label="操作类型" required>
          <el-select v-model="newRecord.operation_type" placeholder="请选择操作类型">
            <el-option label="种植" value="planting" />
            <el-option label="灌溉" value="irrigation" />
            <el-option label="施肥" value="fertilization" />
            <el-option label="施药" value="pesticide_application" />
            <el-option label="除草" value="weed_control" />
            <el-option label="采收" value="harvest" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作名称" required>
          <el-input v-model="newRecord.operation_name" placeholder="请输入操作名称" />
        </el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker v-model="newRecord.operation_time" type="datetime" placeholder="选择操作时间" />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="newRecord.operator_name" placeholder="请输入操作人姓名" />
        </el-form-item>
        <el-form-item label="经度">
          <el-input v-model.number="newRecord.longitude" type="number" placeholder="地理位置经度" />
        </el-form-item>
        <el-form-item label="纬度">
          <el-input v-model.number="newRecord.latitude" type="number" placeholder="地理位置纬度" />
        </el-form-item>
        <el-form-item label="设备">
          <el-input v-model="newRecord.equipment_used" placeholder="使用的设备" />
        </el-form-item>
        <el-form-item label="用药名称">
          <el-input v-model="newRecord.pesticide_name" placeholder="农药名称" />
        </el-form-item>
        <el-form-item label="用药剂量">
          <el-input v-model.number="newRecord.pesticide_dosage" type="number" placeholder="剂量">
            <template #append>
              <el-input v-model="newRecord.pesticide_unit" style="width: 60px" placeholder="单位" />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="用肥名称">
          <el-input v-model="newRecord.fertilizer_name" placeholder="肥料名称" />
        </el-form-item>
        <el-form-item label="用肥剂量">
          <el-input v-model.number="newRecord.fertilizer_dosage" type="number" placeholder="剂量">
            <template #append>
              <el-input v-model="newRecord.fertilizer_unit" style="width: 60px" placeholder="单位" />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="newRecord.notes" type="textarea" rows="3" placeholder="其他备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddRecordDialog = false">取消</el-button>
        <el-button type="primary" @click="addFarmingRecord" :loading="submitting">确认添加</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPhotoDialog" title="拍照存证" width="500px">
      <div class="photo-capture">
        <p>当前位置信息：</p>
        <el-form label-width="80px">
          <el-form-item label="经度">
            <el-input v-model.number="photoData.longitude" type="number" placeholder="经度" />
          </el-form-item>
          <el-form-item label="纬度">
            <el-input v-model.number="photoData.latitude" type="number" placeholder="纬度" />
          </el-form-item>
          <el-form-item label="位置描述">
            <el-input v-model="photoData.location_description" placeholder="位置描述" />
          </el-form-item>
          <el-form-item label="照片描述">
            <el-input v-model="photoData.description" type="textarea" rows="3" placeholder="照片描述" />
          </el-form-item>
        </el-form>
        <div class="photo-upload">
          <el-upload
            ref="photoUpload"
            :auto-upload="false"
            :limit="1"
            accept="image/*"
            :on-change="handlePhotoChange"
          >
            <el-button type="primary">选择照片</el-button>
          </el-upload>
          <p class="photo-tip">照片将自动添加时间戳和地理位置信息</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPhotoDialog = false">取消</el-button>
        <el-button type="primary" @click="submitPhoto" :loading="photoSubmitting">提交照片</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRecordDetailDialog" title="农事记录详情" width="600px">
      <div v-if="selectedRecord">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="操作类型">{{ selectedRecord.operation_type }}</el-descriptions-item>
          <el-descriptions-item label="操作名称">{{ selectedRecord.operation_name }}</el-descriptions-item>
          <el-descriptions-item label="操作时间" :span="2">{{ formatDate(selectedRecord.operation_time) }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ selectedRecord.operator_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设备">{{ selectedRecord.equipment_used || '-' }}</el-descriptions-item>
          <el-descriptions-item label="经度">{{ selectedRecord.longitude || '-' }}</el-descriptions-item>
          <el-descriptions-item label="纬度">{{ selectedRecord.latitude || '-' }}</el-descriptions-item>
          <el-descriptions-item label="位置描述" :span="2">{{ selectedRecord.location_description || '-' }}</el-descriptions-item>
          <el-descriptions-item label="农药名称">{{ selectedRecord.pesticide_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="农药剂量">{{ selectedRecord.pesticide_dosage ? `${selectedRecord.pesticide_dosage} ${selectedRecord.pesticide_unit || ''}` : '-' }}</el-descriptions-item>
          <el-descriptions-item label="肥料名称">{{ selectedRecord.fertilizer_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="肥料剂量">{{ selectedRecord.fertilizer_dosage ? `${selectedRecord.fertilizer_dosage} ${selectedRecord.fertilizer_unit || ''}` : '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ selectedRecord.notes || '-' }}</el-descriptions-item>
          <el-descriptions-item label="数字时间戳" :span="2">
            <el-tooltip :content="selectedRecord.digital_timestamp">
              <span class="timestamp">{{ selectedRecord.digital_timestamp }}</span>
            </el-tooltip>
          </el-descriptions-item>
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
        <el-button @click="showRecordDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { batchApi, farmingApi } from '../../services/api'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const batch = ref(null)
const farmingRecords = ref([])
const showAddRecordDialog = ref(false)
const showPhotoDialog = ref(false)
const showRecordDetailDialog = ref(false)
const submitting = ref(false)
const photoSubmitting = ref(false)
const selectedRecord = ref(null)
const photoUpload = ref(null)

const newRecord = ref({
  batch_uid: route.params.id,
  operation_type: '',
  operation_name: '',
  operator_uid: 'farmer_123',
  operator_name: '',
  operation_time: null,
  latitude: null,
  longitude: null,
  equipment_used: '',
  pesticide_name: '',
  pesticide_dosage: null,
  pesticide_unit: 'kg',
  fertilizer_name: '',
  fertilizer_dosage: null,
  fertilizer_unit: 'kg',
  notes: ''
})

const photoData = ref({
  latitude: null,
  longitude: null,
  location_description: '',
  description: '',
  photoFile: null
})

onMounted(async () => {
  await loadBatchDetail()
  await loadFarmingRecords()
})

const loadBatchDetail = async () => {
  try {
    loading.value = true
    const batchUid = route.params.id
    const response = await batchApi.getById(batchUid)
    batch.value = response.data
  } catch (error) {
    console.error('加载批次详情失败:', error)
    ElMessage.error('加载批次详情失败')
  } finally {
    loading.value = false
  }
}

const loadFarmingRecords = async () => {
  try {
    const batchUid = route.params.id
    const response = await farmingApi.getByBatch(batchUid, {})
    farmingRecords.value = response.data
  } catch (error) {
    console.error('加载农事记录失败:', error)
  }
}

const goBack = () => {
  router.push('/farmer/batches')
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

const addFarmingRecord = async () => {
  if (!newRecord.value.operation_type || !newRecord.value.operation_name) {
    ElMessage.warning('请填写必填项')
    return
  }

  try {
    submitting.value = true
    const recordData = {
      batch_uid: newRecord.value.batch_uid,
      operation_type: newRecord.value.operation_type,
      operation_name: newRecord.value.operation_name,
      operator_uid: newRecord.value.operator_uid,
      operator_name: newRecord.value.operator_name || '农户',
      operation_time: newRecord.value.operation_time || new Date().toISOString(),
      latitude: newRecord.value.latitude,
      longitude: newRecord.value.longitude,
      equipment_used: newRecord.value.equipment_used,
      pesticide_name: newRecord.value.pesticide_name,
      pesticide_dosage: newRecord.value.pesticide_dosage,
      pesticide_unit: newRecord.value.pesticide_unit,
      fertilizer_name: newRecord.value.fertilizer_name,
      fertilizer_dosage: newRecord.value.fertilizer_dosage,
      fertilizer_unit: newRecord.value.fertilizer_unit,
      notes: newRecord.value.notes
    }

    await farmingApi.create(recordData)
    ElMessage.success('农事记录添加成功')
    showAddRecordDialog.value = false
    await loadFarmingRecords()

    newRecord.value = {
      batch_uid: route.params.id,
      operation_type: '',
      operation_name: '',
      operator_uid: 'farmer_123',
      operator_name: '',
      operation_time: null,
      latitude: null,
      longitude: null,
      equipment_used: '',
      pesticide_name: '',
      pesticide_dosage: null,
      pesticide_unit: 'kg',
      fertilizer_name: '',
      fertilizer_dosage: null,
      fertilizer_unit: 'kg',
      notes: ''
    }
  } catch (error) {
    console.error('添加农事记录失败:', error)
    ElMessage.error('添加农事记录失败')
  } finally {
    submitting.value = false
  }
}

const handlePhotoChange = (file) => {
  photoData.value.photoFile = file.raw
}

const submitPhoto = async () => {
  if (!photoData.value.photoFile) {
    ElMessage.warning('请选择照片')
    return
  }

  try {
    photoSubmitting.value = true

    const formData = new FormData()
    formData.append('photo', photoData.value.photoFile)
    formData.append('latitude', photoData.value.latitude || 0)
    formData.append('longitude', photoData.value.longitude || 0)
    formData.append('location_description', photoData.value.location_description)
    formData.append('description', photoData.value.description)

    const lastRecord = farmingRecords.value.length > 0 ? farmingRecords.value[0] : null
    if (lastRecord) {
      await farmingApi.addPhoto(lastRecord.uid, '', photoData.value.description)
      ElMessage.success('照片已添加到最新农事记录')
    } else {
      const recordData = {
        batch_uid: route.params.id,
        operation_type: 'other',
        operation_name: '拍照存证',
        operator_uid: 'farmer_123',
        operator_name: '农户',
        operation_time: new Date().toISOString(),
        latitude: photoData.value.latitude,
        longitude: photoData.value.longitude,
        location_description: photoData.value.location_description,
        notes: photoData.value.description
      }
      await farmingApi.create(recordData)
      ElMessage.success('拍照存证已保存')
    }

    showPhotoDialog.value = false
    await loadFarmingRecords()
  } catch (error) {
    console.error('提交照片失败:', error)
    ElMessage.error('提交照片失败')
  } finally {
    photoSubmitting.value = false
  }
}

const viewFarmingRecord = (record) => {
  selectedRecord.value = record
  showRecordDetailDialog.value = true
}
</script>

<style scoped>
.batch-detail {
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

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px;
  color: #909399;
}

.section {
  margin-top: 30px;
}

.section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
}

.farming-actions {
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
}

.empty-tip {
  padding: 40px;
  text-align: center;
  color: #909399;
  font-size: 16px;
}

.photo-capture {
  padding: 10px 0;
}

.photo-upload {
  margin-top: 20px;
}

.photo-tip {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
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