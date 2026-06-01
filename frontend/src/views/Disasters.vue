<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">灾情上报</h2>
      <el-button type="primary" @click="showAddDialog = true" :icon="Plus">
        新增上报
      </el-button>
    </div>

    <div class="filter-bar">
      <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px;">
        <el-option label="待处理" value="pending" />
        <el-option label="处理中" value="processing" />
        <el-option label="已完成" value="completed" />
      </el-select>
      <el-select v-model="filters.report_type" placeholder="灾情类型" clearable style="width: 140px;">
        <el-option label="人员伤亡" value="casualty" />
        <el-option label="建筑损毁" value="building" />
        <el-option label="道路中断" value="road" />
        <el-option label="通信故障" value="communication" />
        <el-option label="综合灾情" value="comprehensive" />
      </el-select>
      <el-input v-model="filters.location" placeholder="搜索地点" clearable style="width: 200px;" />
      <el-button type="primary" @click="loadList" :icon="Search">查询</el-button>
      <el-button @click="resetFilters" :icon="Refresh">重置</el-button>
    </div>

    <el-table :data="list" v-loading="loading" size="small">
      <el-table-column prop="report_no" label="上报编号" width="180" />
      <el-table-column prop="report_type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag size="small">{{ getTypeLabel(row.report_type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="地点" min-width="140" />
      <el-table-column label="伤亡情况" width="180">
        <template #default="{ row }">
          <span v-if="row.deaths" class="risk-high">死亡{{ row.deaths }}</span>
          <span v-if="row.injuries" style="margin-left: 8px;">伤{{ row.injuries }}</span>
          <span v-if="row.missing" style="margin-left: 8px;">失踪{{ row.missing }}</span>
          <span v-if="row.trapped" style="margin-left: 8px;">被困{{ row.trapped }}</span>
          <span v-if="!row.deaths && !row.injuries && !row.missing && !row.trapped">--</span>
        </template>
      </el-table-column>
      <el-table-column label="建筑损毁" width="120">
        <template #default="{ row }">
          <span v-if="row.buildings_destroyed">倒塌{{ row.buildings_destroyed }}</span>
          <span v-if="row.buildings_damaged" style="margin-left: 4px;">损坏{{ row.buildings_damaged }}</span>
          <span v-if="!row.buildings_destroyed && !row.buildings_damaged">--</span>
        </template>
      </el-table-column>
      <el-table-column prop="communication_status" label="通信" width="100" />
      <el-table-column prop="reporter_unit" label="上报单位" min-width="120" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <span :class="`status-tag status-${row.status}`">{{ getStatusLabel(row.status) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="上报时间" width="160">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="viewDetail(row)">详情</el-button>
          <el-button link type="primary" size="small" @click="editReport(row)">处理</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top: 16px; justify-content: flex-end;"
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      @current-change="loadList"
      @size-change="loadList" />
  </div>

  <el-dialog v-model="showAddDialog" title="灾情上报" width="700px">
    <el-form :model="reportForm" label-width="110px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="灾情类型" required>
            <el-select v-model="reportForm.report_type" style="width: 100%;">
              <el-option label="人员伤亡" value="casualty" />
              <el-option label="建筑损毁" value="building" />
              <el-option label="道路中断" value="road" />
              <el-option label="通信故障" value="communication" />
              <el-option label="综合灾情" value="comprehensive" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="地点" required>
            <el-input v-model="reportForm.location" placeholder="如：汶川县映秀镇" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="死亡人数">
            <el-input-number v-model="reportForm.deaths" :min="0" style="width: 100%;" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="受伤人数">
            <el-input-number v-model="reportForm.injuries" :min="0" style="width: 100%;" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="被困人数">
            <el-input-number v-model="reportForm.trapped" :min="0" style="width: 100%;" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="房屋倒塌">
            <el-input-number v-model="reportForm.buildings_destroyed" :min="0" style="width: 100%;" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="房屋损坏">
            <el-input-number v-model="reportForm.buildings_damaged" :min="0" style="width: 100%;" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="通信状态">
            <el-select v-model="reportForm.communication_status" style="width: 100%;">
              <el-option label="正常" value="normal" />
              <el-option label="中断" value="down" />
              <el-option label="部分中断" value="partial" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="电力状态">
            <el-select v-model="reportForm.power_supply" style="width: 100%;">
              <el-option label="正常" value="normal" />
              <el-option label="中断" value="down" />
              <el-option label="部分中断" value="partial" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="上报单位" required>
            <el-input v-model="reportForm.reporter_unit" placeholder="如：映秀镇政府" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="上报人">
            <el-input v-model="reportForm.reporter_name" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="现场照片">
            <el-upload
              action="#"
              :auto-upload="false"
              :show-file-list="true"
              :on-change="handlePhotoChange"
              accept="image/*">
              <el-button :icon="Upload">选择照片</el-button>
            </el-upload>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="情况描述">
            <el-input v-model="reportForm.description" type="textarea" :rows="3" placeholder="请详细描述灾情情况" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="showAddDialog = false">取消</el-button>
      <el-button type="primary" @click="submitReport">提交上报</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="showDetailDialog" title="灾情详情" width="700px">
    <div v-if="currentReport">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="上报编号">{{ currentReport.report_no }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ getTypeLabel(currentReport.report_type) }}</el-descriptions-item>
        <el-descriptions-item label="地点" :span="2">{{ currentReport.location }}</el-descriptions-item>
        <el-descriptions-item label="死亡">{{ currentReport.deaths || 0 }}人</el-descriptions-item>
        <el-descriptions-item label="受伤">{{ currentReport.injuries || 0 }}人</el-descriptions-item>
        <el-descriptions-item label="失踪">{{ currentReport.missing || 0 }}人</el-descriptions-item>
        <el-descriptions-item label="被困">{{ currentReport.trapped || 0 }}人</el-descriptions-item>
        <el-descriptions-item label="房屋倒塌">{{ currentReport.buildings_destroyed || 0 }}栋</el-descriptions-item>
        <el-descriptions-item label="房屋损坏">{{ currentReport.buildings_damaged || 0 }}栋</el-descriptions-item>
        <el-descriptions-item label="通信">{{ currentReport.communication_status || '--' }}</el-descriptions-item>
        <el-descriptions-item label="电力">{{ currentReport.power_supply || '--' }}</el-descriptions-item>
        <el-descriptions-item label="上报单位">{{ currentReport.reporter_unit }}</el-descriptions-item>
        <el-descriptions-item label="上报人">{{ currentReport.reporter_name || '--' }}</el-descriptions-item>
        <el-descriptions-item label="上报时间" :span="2">{{ formatTime(currentReport.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="当前状态" :span="2">
          <span :class="`status-tag status-${currentReport.status}`" style="font-size: 16px; padding: 4px 12px;">{{ getStatusLabel(currentReport.status) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="情况描述" :span="2">{{ currentReport.description || '暂无' }}</el-descriptions-item>
        <el-descriptions-item v-if="currentReport.photo_path" label="现场照片" :span="2">
          <img :src="currentReport.photo_path" style="max-width: 500px; border-radius: 4px;" />
        </el-descriptions-item>
      </el-descriptions>

      <div style="margin-top: 20px;">
        <h4 class="section-title">📋 处理流转记录</h4>
        <el-timeline>
          <el-timeline-item :timestamp="formatTime(currentReport.created_at)" placement="top" type="primary">
            <el-card shadow="hover" size="small">
              <div style="font-weight: bold;">📝 灾情上报</div>
              <div style="color: #666; margin-top: 4px;">
                {{ currentReport.reporter_unit }}（{{ currentReport.reporter_name || '匿名' }}）提交灾情报告
              </div>
            </el-card>
          </el-timeline-item>
          <el-timeline-item v-if="currentReport.status !== 'pending'" :timestamp="formatTime(currentReport.updated_at)" placement="top" type="success">
            <el-card shadow="hover" size="small">
              <div style="font-weight: bold;">⚡ 开始处理</div>
              <div style="color: #666; margin-top: 4px;">
                指挥中心已受理，正在调度救援力量
              </div>
            </el-card>
          </el-timeline-item>
          <el-timeline-item v-if="currentReport.status === 'completed'" :timestamp="formatTime(currentReport.updated_at)" placement="top" type="warning">
            <el-card shadow="hover" size="small">
              <div style="font-weight: bold;">✅ 处置完成</div>
              <div style="color: #666; margin-top: 4px;">
                灾情已得到有效控制，救援任务完成
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>

      <div style="margin-top: 20px; text-align: right;">
        <el-button type="primary" @click="editReport(currentReport); showDetailDialog = false;">
          进行处理
        </el-button>
      </div>
    </div>
  </el-dialog>

  <el-dialog v-model="showEditDialog" title="处理灾情" width="500px">
    <el-form :model="editForm" label-width="100px" v-if="currentReport">
      <el-form-item label="处理状态">
        <el-select v-model="editForm.status" style="width: 100%;">
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已完成" value="completed" />
        </el-select>
      </el-form-item>
      <el-form-item label="伤亡更新">
        <el-row :gutter="8">
          <el-col :span="6">亡<el-input-number v-model="editForm.deaths" :min="0" style="width: 80px;" /></el-col>
          <el-col :span="6">伤<el-input-number v-model="editForm.injuries" :min="0" style="width: 80px;" /></el-col>
          <el-col :span="6">困<el-input-number v-model="editForm.trapped" :min="0" style="width: 80px;" /></el-col>
        </el-row>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="editForm.description" type="textarea" :rows="3" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showEditDialog = false">取消</el-button>
      <el-button type="primary" @click="saveEdit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, Refresh, Upload } from '@element-plus/icons-vue'
import { api } from '@/api'

const loading = ref(false)
const list = ref([])
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const showEditDialog = ref(false)
const currentReport = ref(null)
const selectedPhoto = ref(null)

const filters = reactive({
  status: '',
  report_type: '',
  location: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const reportForm = reactive({
  report_type: 'comprehensive',
  location: '',
  latitude: null,
  longitude: null,
  deaths: 0,
  injuries: 0,
  missing: 0,
  trapped: 0,
  buildings_destroyed: 0,
  buildings_damaged: 0,
  roads_blocked: '',
  communication_status: '',
  water_supply: '',
  power_supply: '',
  reporter_unit: '',
  reporter_name: '',
  reporter_phone: '',
  description: ''
})

const editForm = reactive({
  status: 'pending',
  deaths: 0,
  injuries: 0,
  trapped: 0,
  description: ''
})

const formatTime = (t) => t ? new Date(t).toLocaleString('zh-CN') : '--'
const getTypeLabel = (t) => ({ casualty: '人员伤亡', building: '建筑损毁', road: '道路中断', communication: '通信故障', comprehensive: '综合灾情' }[t] || t)
const getStatusLabel = (s) => ({ pending: '待处理', processing: '处理中', completed: '已完成', cancelled: '已取消' }[s] || s)

const handlePhotoChange = (file) => {
  selectedPhoto.value = file.raw
}

const loadList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filters
    }
    const res = await api.disasters.list(params)
    list.value = res.list
    pagination.total = res.total
  } catch (err) {
    console.error('加载列表失败:', err)
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.status = ''
  filters.report_type = ''
  filters.location = ''
  pagination.page = 1
  loadList()
}

const resetReportForm = () => {
  reportForm.report_type = 'comprehensive'
  reportForm.location = ''
  reportForm.latitude = null
  reportForm.longitude = null
  reportForm.deaths = 0
  reportForm.injuries = 0
  reportForm.missing = 0
  reportForm.trapped = 0
  reportForm.buildings_destroyed = 0
  reportForm.buildings_damaged = 0
  reportForm.roads_blocked = ''
  reportForm.communication_status = ''
  reportForm.water_supply = ''
  reportForm.power_supply = ''
  reportForm.reporter_unit = ''
  reportForm.reporter_name = ''
  reportForm.reporter_phone = ''
  reportForm.description = ''
  selectedPhoto.value = null
}

const submitReport = async () => {
  if (!reportForm.report_type || !reportForm.location || !reportForm.reporter_unit) {
    ElMessage.warning('请填写必填项：灾情类型、地点、上报单位')
    return
  }
  try {
    const data = { ...reportForm }
    if (selectedPhoto.value) {
      data.photo = selectedPhoto.value
    }
    await api.disasters.create(data)
    ElMessage.success('上报成功，已生成待处理记录')
    showAddDialog.value = false
    resetReportForm()
    loadList()
  } catch (err) {
    console.error('上报失败:', err)
    ElMessage.error(err.message || '上报失败，请检查网络或稍后重试')
  }
}

const viewDetail = async (row) => {
  try {
    currentReport.value = await api.disasters.get(row.id)
    showDetailDialog.value = true
  } catch (err) {
    console.error('加载详情失败:', err)
  }
}

const editReport = (row) => {
  currentReport.value = row
  editForm.status = row.status
  editForm.deaths = row.deaths
  editForm.injuries = row.injuries
  editForm.trapped = row.trapped
  editForm.description = ''
  showEditDialog.value = true
}

const saveEdit = async () => {
  try {
    await api.disasters.update(currentReport.value.id, editForm)
    ElMessage.success('更新成功')
    showEditDialog.value = false
    loadList()
  } catch (err) {
    console.error('更新失败:', err)
  }
}

onMounted(() => {
  loadList()
})
</script>
