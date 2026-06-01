<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <h2>维保计划管理</h2>
      <div style="display: flex; gap: 10px">
        <el-select v-model="filterStatus" placeholder="筛选状态" clearable style="width: 150px" @change="loadMaintenance">
          <el-option label="待执行" value="pending" />
          <el-option label="进行中" value="processing" />
          <el-option label="已完成" value="completed" />
          <el-option label="已逾期" value="overdue" />
        </el-select>
        <el-button type="primary" @click="openDialog()">新增维保计划</el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="maintenanceList" border>
        <el-table-column prop="device_code" label="设备编号" width="120" />
        <el-table-column prop="install_location" label="安装位置" width="150" />
        <el-table-column prop="plan_date" label="计划日期" width="120">
          <template #default="{ row }">
            <el-tag :type="isOverdue(row.plan_date, row.status) ? 'danger' : ''" size="small">
              {{ row.plan_date }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="check_items" label="检查项目" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="completed_at" label="完成时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-button v-if="row.status !== 'completed'" size="small" type="primary" @click="openEdit(row)">执行/编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '执行维保' : '新增维保计划'" width="700px">
      <el-form :model="form" label-width="120px">
        <el-form-item v-if="!isEdit" label="设备" required>
          <el-select v-model="form.crane_id" style="width: 100%">
            <el-option v-for="c in cranes" :key="c.id" :label="c.device_code + ' - ' + c.install_location" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划日期" required>
          <el-date-picker v-model="form.plan_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="检查项目">
          <el-input type="textarea" v-model="form.check_items" :rows="2" placeholder="如：钢丝绳,制动器,限位装置" />
        </el-form-item>
        <el-form-item label="发现问题">
          <el-input type="textarea" v-model="form.found_problems" :rows="3" />
        </el-form-item>
        <el-form-item label="整改照片">
          <el-input type="textarea" v-model="form.rectify_photos" :rows="2" placeholder="输入图片URL或描述" />
        </el-form-item>
        <el-form-item label="复验结果">
          <el-input type="textarea" v-model="form.recheck_result" :rows="3" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="待执行" value="pending" />
            <el-option label="进行中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已逾期" value="overdue" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveMaintenance">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="维保详情" width="700px">
      <el-descriptions :column="2" border v-if="currentItem">
        <el-descriptions-item label="设备编号">{{ currentItem.device_code }}</el-descriptions-item>
        <el-descriptions-item label="安装位置">{{ currentItem.install_location }}</el-descriptions-item>
        <el-descriptions-item label="计划日期">{{ currentItem.plan_date }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentItem.status)">{{ getStatusText(currentItem.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="检查项目" :span="2">{{ currentItem.check_items || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发现问题" :span="2">{{ currentItem.found_problems || '-' }}</el-descriptions-item>
        <el-descriptions-item label="整改照片" :span="2">{{ currentItem.rectify_photos || '-' }}</el-descriptions-item>
        <el-descriptions-item label="复验结果" :span="2">{{ currentItem.recheck_result || '-' }}</el-descriptions-item>
        <el-descriptions-item label="完成时间" :span="2">{{ currentItem.completed_at || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMaintenance, createMaintenance, updateMaintenance, getCranes } from '../api'

const maintenanceList = ref([])
const cranes = ref([])
const filterStatus = ref(null)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const currentItem = ref(null)
const editId = ref(null)
const form = ref({
  crane_id: null,
  plan_date: '',
  check_items: '',
  found_problems: '',
  rectify_photos: '',
  recheck_result: '',
  status: 'pending'
})

const getStatusType = (status) => {
  const map = { pending: 'warning', processing: 'primary', completed: 'success', overdue: 'danger' }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = { pending: '待执行', processing: '进行中', completed: '已完成', overdue: '已逾期' }
  return map[status] || status
}

const isOverdue = (date, status) => {
  if (status === 'completed') return false
  return new Date(date) < new Date(new Date().toDateString())
}

const loadMaintenance = async () => {
  const params = {}
  if (filterStatus.value) params.status = filterStatus.value
  const res = await getMaintenance(params)
  maintenanceList.value = res.data
}

const openDialog = () => {
  isEdit.value = false
  editId.value = null
  form.value = {
    crane_id: null,
    plan_date: '',
    check_items: '',
    found_problems: '',
    rectify_photos: '',
    recheck_result: '',
    status: 'pending'
  }
  dialogVisible.value = true
}

const openEdit = (row) => {
  isEdit.value = true
  editId.value = row.id
  form.value = { ...row }
  dialogVisible.value = true
}

const saveMaintenance = async () => {
  if (isEdit.value) {
    await updateMaintenance(editId.value, form.value)
    ElMessage.success('更新成功')
  } else {
    await createMaintenance(form.value)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  loadMaintenance()
}

const viewDetail = (row) => {
  currentItem.value = row
  detailVisible.value = true
}

onMounted(async () => {
  const craneRes = await getCranes()
  cranes.value = craneRes.data
  loadMaintenance()
})
</script>
