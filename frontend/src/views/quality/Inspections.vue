<template>
  <div class="inspections">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>质检记录管理</h3>
        </div>
      </template>

      <div class="search-bar">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-select v-model="filterStatus" placeholder="选择状态" clearable @change="loadInspections">
              <el-option label="全部" value="" />
              <el-option label="待检测" value="pending" />
              <el-option label="检测中" value="testing" />
              <el-option label="合格" value="passed" />
              <el-option label="不合格" value="failed" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索批次号"
              clearable
              @keyup.enter="loadInspections"
            />
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="loadInspections">搜索</el-button>
          </el-col>
        </el-row>
      </div>

      <el-table :data="inspections" style="width: 100%" stripe v-loading="loading">
        <el-table-column prop="inspection_code" label="质检编号" width="180" />
        <el-table-column prop="batch_code" label="批次号" width="180" />
        <el-table-column prop="lab_name" label="检测机构" />
        <el-table-column prop="inspector_name" label="检测人员" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sample_count" label="采样数" width="80" />
        <el-table-column prop="sampling_time" label="采样时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.sampling_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" type="primary" @click="viewInspection(scope.row)">查看</el-button>
            <el-button
              v-if="scope.row.status === 'pending'"
              size="small"
              type="success"
              @click="startTesting(scope.row)"
            >
              开始检测
            </el-button>
            <el-button
              v-if="scope.row.status === 'testing'"
              size="small"
              type="warning"
              @click="showSubmitDialog(scope.row)"
            >
              提交结果
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="inspections.length === 0 && !loading" class="empty-tip">
        暂无质检记录
      </div>

      <div class="pagination" v-if="totalInspections > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalInspections"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="showDetailDialog" title="质检详情" width="700px">
      <div v-if="selectedInspection">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="质检编号">{{ selectedInspection.inspection_code }}</el-descriptions-item>
          <el-descriptions-item label="批次号">{{ selectedInspection.batch_code || selectedInspection.batch_uid }}</el-descriptions-item>
          <el-descriptions-item label="检测机构">{{ selectedInspection.lab_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="检测人员">{{ selectedInspection.inspector_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedInspection.status)">{{ getStatusText(selectedInspection.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="采样数量">{{ selectedInspection.sample_count }}</el-descriptions-item>
          <el-descriptions-item label="采样时间" :span="2">{{ formatDate(selectedInspection.sampling_time) }}</el-descriptions-item>
          <el-descriptions-item label="采样地点" :span="2">{{ selectedInspection.sample_location || '-' }}</el-descriptions-item>
          <el-descriptions-item label="检测开始时间" :span="2">{{ formatDate(selectedInspection.testing_start_time) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="检测结束时间" :span="2">{{ formatDate(selectedInspection.testing_end_time) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="检测结果" :span="2">
            <el-tag v-if="selectedInspection.overall_result === true" type="success">合格</el-tag>
            <el-tag v-else-if="selectedInspection.overall_result === false" type="danger">不合格</el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="结果描述" :span="2">{{ selectedInspection.result_description || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="selectedInspection.pesticide_results && Object.keys(selectedInspection.pesticide_results).length > 0" class="result-section">
          <h4>农药残留检测结果</h4>
          <el-table :data="formatResults(selectedInspection.pesticide_results)" border size="small">
            <el-table-column prop="name" label="检测项目" />
            <el-table-column prop="value" label="检测值" width="100" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="limit" label="国标限量" width="100" />
            <el-table-column prop="status" label="判定" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'pass' ? 'success' : 'danger'" size="small">
                  {{ scope.row.status === 'pass' ? '合格' : '不合格' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="selectedInspection.heavy_metal_results && Object.keys(selectedInspection.heavy_metal_results).length > 0" class="result-section">
          <h4>重金属检测结果</h4>
          <el-table :data="formatResults(selectedInspection.heavy_metal_results)" border size="small">
            <el-table-column prop="name" label="检测项目" />
            <el-table-column prop="value" label="检测值" width="100" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="limit" label="国标限量" width="100" />
            <el-table-column prop="status" label="判定" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'pass' ? 'success' : 'danger'" size="small">
                  {{ scope.row.status === 'pass' ? '合格' : '不合格' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showSubmitDialogVisible" title="提交检测结果" width="700px">
      <el-form :model="submitForm" label-width="120px">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="质检编号">{{ submitForm.inspection_code }}</el-descriptions-item>
          <el-descriptions-item label="批次号">{{ submitForm.batch_code }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin: 20px 0 10px;">农药残留检测 (mg/kg)</h4>
        <el-row :gutter="20">
          <el-col :span="12" v-for="item in pesticideItems" :key="item">
            <el-form-item :label="item">
              <el-input-number v-model="submitForm.pesticide_results[item]" :min="0" :precision="4" placeholder="0.0000" />
            </el-form-item>
          </el-col>
        </el-row>

        <h4 style="margin: 20px 0 10px;">重金属检测 (mg/kg)</h4>
        <el-row :gutter="20">
          <el-col :span="12" v-for="item in heavyMetalItems" :key="item">
            <el-form-item :label="item">
              <el-input-number v-model="submitForm.heavy_metal_results[item]" :min="0" :precision="4" placeholder="0.0000" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="结果描述">
          <el-input v-model="submitForm.result_description" type="textarea" rows="3" placeholder="请输入检测结果描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSubmitDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSubmitResults" :loading="submitting">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { qualityApi } from '../../services/api'

const loading = ref(false)
const submitting = ref(false)
const inspections = ref([])
const totalInspections = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const filterStatus = ref('')
const searchKeyword = ref('')
const showDetailDialog = ref(false)
const showSubmitDialogVisible = ref(false)
const selectedInspection = ref(null)

const submitForm = ref({
  inspection_uid: '',
  inspection_code: '',
  batch_code: '',
  pesticide_results: {},
  heavy_metal_results: {},
  result_description: ''
})

const pesticideItems = [
  '甲胺磷', '克百威', '氧乐果', '水胺硫磷', '毒死蜱',
  '百菌清', '多菌灵', '吡虫啉', '阿维菌素'
]

const heavyMetalItems = ['铅', '镉', '砷', '汞']

const pesticideLimits = {
  '甲胺磷': 0.05,
  '克百威': 0.02,
  '氧乐果': 0.02,
  '水胺硫磷': 0.05,
  '毒死蜱': 0.5,
  '百菌清': 5.0,
  '多菌灵': 3.0,
  '吡虫啉': 0.5,
  '阿维菌素': 0.05
}

const heavyMetalLimits = {
  '铅': 0.3,
  '镉': 0.05,
  '砷': 0.5,
  '汞': 0.01
}

onMounted(async () => {
  await loadInspections()
})

const loadInspections = async () => {
  try {
    loading.value = true
    inspections.value = [
      {
        uid: '1',
        inspection_code: 'QI-2026-001',
        batch_code: 'FA-PR-26-ABC123',
        batch_uid: 'batch_1',
        lab_name: '农产品质量检测中心',
        inspector_name: '张检测',
        status: 'testing',
        sample_count: 5,
        sampling_time: '2026-04-25T10:00:00',
        testing_start_time: '2026-04-25T14:00:00',
        testing_end_time: null,
        overall_result: null,
        pesticide_results: null,
        heavy_metal_results: null,
        result_description: null
      },
      {
        uid: '2',
        inspection_code: 'QI-2026-002',
        batch_code: 'FA-PR-26-DEF456',
        batch_uid: 'batch_2',
        lab_name: '食品安全检测实验室',
        inspector_name: '李检测',
        status: 'passed',
        sample_count: 3,
        sampling_time: '2026-04-20T09:00:00',
        testing_start_time: '2026-04-20T10:00:00',
        testing_end_time: '2026-04-20T18:00:00',
        overall_result: true,
        pesticide_results: { '甲胺磷': 0.01, '克百威': 0.005 },
        heavy_metal_results: { '铅': 0.1, '镉': 0.01 },
        result_description: '所有检测项目均合格'
      },
      {
        uid: '3',
        inspection_code: 'QI-2026-003',
        batch_code: 'FA-PR-26-GHI789',
        batch_uid: 'batch_3',
        lab_name: '农产品质量检测中心',
        inspector_name: '王检测',
        status: 'pending',
        sample_count: 4,
        sampling_time: '2026-04-27T08:00:00',
        testing_start_time: null,
        testing_end_time: null,
        overall_result: null,
        pesticide_results: null,
        heavy_metal_results: null,
        result_description: null
      }
    ]
    totalInspections.value = inspections.value.length
  } catch (error) {
    console.error('加载质检记录失败:', error)
    ElMessage.error('加载质检记录失败')
  } finally {
    loading.value = false
  }
}

const formatResults = (results) => {
  if (!results || typeof results !== 'object') return []

  const items = []
  const limits = { ...pesticideLimits, ...heavyMetalLimits }

  for (const [key, value] of Object.entries(results)) {
    const limit = limits[key] || 0
    const numValue = parseFloat(value) || 0
    items.push({
      name: key,
      value: numValue,
      unit: 'mg/kg',
      limit: limit,
      status: numValue <= limit ? 'pass' : 'fail'
    })
  }
  return items
}

const getStatusType = (status) => {
  const statusMap = {
    'pending': 'info',
    'testing': 'warning',
    'passed': 'success',
    'failed': 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    'pending': '待检测',
    'testing': '检测中',
    'passed': '合格',
    'failed': '不合格'
  }
  return statusMap[status] || status
}

const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

const handleSizeChange = (size) => {
  pageSize.value = size
  loadInspections()
}

const handleCurrentChange = (current) => {
  currentPage.value = current
  loadInspections()
}

const viewInspection = (inspection) => {
  selectedInspection.value = inspection
  showDetailDialog.value = true
}

const startTesting = async (inspection) => {
  try {
    await qualityApi.startTesting(inspection.uid)
    ElMessage.success('已开始检测')
    await loadInspections()
  } catch (error) {
    console.error('开始检测失败:', error)
    ElMessage.error('开始检测失败')
  }
}

const showSubmitDialog = (inspection) => {
  submitForm.value = {
    inspection_uid: inspection.uid,
    inspection_code: inspection.inspection_code,
    batch_code: inspection.batch_code || inspection.batch_uid,
    pesticide_results: {},
    heavy_metal_results: {},
    result_description: ''
  }

  pesticideItems.forEach(item => {
    submitForm.value.pesticide_results[item] = null
  })

  heavyMetalItems.forEach(item => {
    submitForm.value.heavy_metal_results[item] = null
  })

  showSubmitDialogVisible.value = true
}

const confirmSubmitResults = async () => {
  try {
    submitting.value = true

    const pesticideResults = {}
    const heavyMetalResults = {}

    for (const [key, value] of Object.entries(submitForm.value.pesticide_results)) {
      if (value !== null && value !== undefined) {
        pesticideResults[key] = value
      }
    }

    for (const [key, value] of Object.entries(submitForm.value.heavy_metal_results)) {
      if (value !== null && value !== undefined) {
        heavyMetalResults[key] = value
      }
    }

    await qualityApi.submitResults(submitForm.value.inspection_uid, {
      pesticide_results: Object.keys(pesticideResults).length > 0 ? pesticideResults : null,
      heavy_metal_results: Object.keys(heavyMetalResults).length > 0 ? heavyMetalResults : null,
      result_description: submitForm.value.result_description
    })

    ElMessage.success('检测结果提交成功')
    showSubmitDialogVisible.value = false
    await loadInspections()
  } catch (error) {
    console.error('提交检测结果失败:', error)
    ElMessage.error('提交检测结果失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.inspections {
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

.result-section {
  margin-top: 20px;
}

.result-section h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #303133;
}
</style>