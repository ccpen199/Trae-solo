<template>
  <div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px">
      <h2>塔吊档案管理</h2>
      <el-button type="primary" @click="openDialog()">新增设备</el-button>
    </div>

    <el-card>
      <el-table :data="cranes" border>
        <el-table-column prop="device_code" label="设备编号" width="120" />
        <el-table-column prop="install_location" label="安装位置" width="150" />
        <el-table-column prop="record_info" label="备案信息" width="150" />
        <el-table-column prop="driver_name" label="司机" width="100" />
        <el-table-column prop="maintenance_unit" label="维保单位" width="150" />
        <el-table-column prop="test_valid_until" label="检测有效期" width="130">
          <template #default="{ row }">
            <el-tag :type="isExpired(row.test_valid_until) ? 'danger' : ''" size="small">
              {{ row.test_valid_until }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="removeCrane(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑设备' : '新增设备'" width="600px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="设备编号" required>
          <el-input v-model="form.device_code" />
        </el-form-item>
        <el-form-item label="安装位置" required>
          <el-input v-model="form.install_location" />
        </el-form-item>
        <el-form-item label="备案信息">
          <el-input v-model="form.record_info" />
        </el-form-item>
        <el-form-item label="司机">
          <el-input v-model="form.driver_name" />
        </el-form-item>
        <el-form-item label="司机电话">
          <el-input v-model="form.driver_phone" />
        </el-form-item>
        <el-form-item label="维保单位">
          <el-input v-model="form.maintenance_unit" />
        </el-form-item>
        <el-form-item label="维保电话">
          <el-input v-model="form.maintenance_phone" />
        </el-form-item>
        <el-form-item label="检测有效期">
          <el-date-picker v-model="form.test_valid_until" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="设备状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="正常" value="normal" />
            <el-option label="异常" value="warning" />
            <el-option label="离线" value="offline" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCrane">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="设备详情" width="700px">
      <el-descriptions :column="2" border v-if="currentCrane">
        <el-descriptions-item label="设备编号">{{ currentCrane.device_code }}</el-descriptions-item>
        <el-descriptions-item label="安装位置">{{ currentCrane.install_location }}</el-descriptions-item>
        <el-descriptions-item label="备案信息">{{ currentCrane.record_info }}</el-descriptions-item>
        <el-descriptions-item label="司机">{{ currentCrane.driver_name }}</el-descriptions-item>
        <el-descriptions-item label="司机电话">{{ currentCrane.driver_phone }}</el-descriptions-item>
        <el-descriptions-item label="维保单位">{{ currentCrane.maintenance_unit }}</el-descriptions-item>
        <el-descriptions-item label="维保电话">{{ currentCrane.maintenance_phone }}</el-descriptions-item>
        <el-descriptions-item label="检测有效期">
          <el-tag :type="isExpired(currentCrane.test_valid_until) ? 'danger' : ''">
            {{ currentCrane.test_valid_until }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态" :span="2">
          <el-tag :type="getStatusType(currentCrane.status)">
            {{ getStatusText(currentCrane.status) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 20px">
        <h4>关联预警</h4>
        <el-table :data="craneAlerts" size="small">
          <el-table-column prop="alert_type" label="类型" />
          <el-table-column prop="alert_level" label="级别" />
          <el-table-column prop="message" label="信息" />
          <el-table-column prop="status" label="状态" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCranes, createCrane, updateCrane, deleteCrane, getAlerts } from '../api'

const cranes = ref([])
const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const currentCrane = ref(null)
const craneAlerts = ref([])
const form = ref({
  device_code: '',
  install_location: '',
  record_info: '',
  driver_name: '',
  driver_phone: '',
  maintenance_unit: '',
  maintenance_phone: '',
  test_valid_until: '',
  status: 'normal'
})

const loadCranes = async () => {
  const res = await getCranes()
  cranes.value = res.data
}

const isExpired = (date) => {
  if (!date) return false
  return new Date(date) < new Date()
}

const getStatusType = (status) => {
  const map = { normal: 'success', warning: 'warning', offline: 'danger' }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = { normal: '正常', warning: '异常', offline: '离线' }
  return map[status] || status
}

const openDialog = (row = null) => {
  isEdit.value = !!row
  if (row) {
    form.value = { ...row }
  } else {
    form.value = {
      device_code: '',
      install_location: '',
      record_info: '',
      driver_name: '',
      driver_phone: '',
      maintenance_unit: '',
      maintenance_phone: '',
      test_valid_until: '',
      status: 'normal'
    }
  }
  dialogVisible.value = true
}

const saveCrane = async () => {
  if (isEdit.value) {
    await updateCrane(form.value.id, form.value)
    ElMessage.success('更新成功')
  } else {
    await createCrane(form.value)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  loadCranes()
}

const removeCrane = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该设备吗？', '提示', { type: 'warning' })
    await deleteCrane(row.id)
    ElMessage.success('删除成功')
    loadCranes()
  } catch {}
}

const viewDetail = async (row) => {
  currentCrane.value = row
  const res = await getAlerts({ crane_id: row.id })
  craneAlerts.value = res.data
  detailVisible.value = true
}

onMounted(loadCranes)
</script>
