<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <h2>车辆档案</h2>
      <el-button type="primary" @click="showAddDialog = true">新增车辆</el-button>
    </div>

    <el-card>
      <el-table :data="vehicles" style="width: 100%">
        <el-table-column prop="vin" label="VIN码" width="180" />
        <el-table-column prop="plate_number" label="车牌号" width="120" />
        <el-table-column prop="brand" label="品牌" width="100" />
        <el-table-column prop="model" label="型号" width="100" />
        <el-table-column prop="year" label="年份" width="80" />
        <el-table-column prop="color" label="颜色" width="80" />
        <el-table-column prop="current_valuation" label="评估价" width="100">
          <template #default="scope">¥{{ scope.row.current_valuation || 0 }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="viewDetail(scope.row)">详情</el-button>
            <el-button size="small" @click="editDocs(scope.row)">资料</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" title="新增车辆" width="600px">
      <el-form :model="vehicleForm" label-width="100px">
        <el-form-item label="VIN码" required>
          <el-input v-model="vehicleForm.vin" />
        </el-form-item>
        <el-form-item label="车牌号">
          <el-input v-model="vehicleForm.plate_number" />
        </el-form-item>
        <el-form-item label="品牌">
          <el-input v-model="vehicleForm.brand" />
        </el-form-item>
        <el-form-item label="型号">
          <el-input v-model="vehicleForm.model" />
        </el-form-item>
        <el-form-item label="年份">
          <el-input-number v-model="vehicleForm.year" :min="2000" :max="2030" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-input v-model="vehicleForm.color" />
        </el-form-item>
        <el-form-item label="里程(km)">
          <el-input-number v-model="vehicleForm.mileage" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addVehicle">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDocsDialog" title="资料上传" width="600px">
      <el-form :model="docsForm" label-width="120px">
        <el-form-item label="车况照片">
          <el-input v-model="docsForm.photos" type="textarea" placeholder="输入照片URL或描述" />
        </el-form-item>
        <el-form-item label="权属资料">
          <el-input v-model="docsForm.ownership_docs" type="textarea" placeholder="输入行驶证/登记证信息" />
        </el-form-item>
        <el-form-item label="保险资料">
          <el-input v-model="docsForm.insurance_docs" type="textarea" placeholder="输入保险信息" />
        </el-form-item>
        <el-form-item label="抵押登记材料">
          <el-input v-model="docsForm.mortgage_docs" type="textarea" placeholder="输入抵押材料信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDocsDialog = false">取消</el-button>
        <el-button type="primary" @click="saveDocs">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="车辆详情" width="800px">
      <el-descriptions :column="2" border v-if="selectedVehicle">
        <el-descriptions-item label="VIN码">{{ selectedVehicle.vin }}</el-descriptions-item>
        <el-descriptions-item label="车牌号">{{ selectedVehicle.plate_number }}</el-descriptions-item>
        <el-descriptions-item label="品牌">{{ selectedVehicle.brand }}</el-descriptions-item>
        <el-descriptions-item label="型号">{{ selectedVehicle.model }}</el-descriptions-item>
        <el-descriptions-item label="年份">{{ selectedVehicle.year }}</el-descriptions-item>
        <el-descriptions-item label="颜色">{{ selectedVehicle.color }}</el-descriptions-item>
        <el-descriptions-item label="当前评估价">¥{{ selectedVehicle.current_valuation || 0 }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(selectedVehicle.status)">{{ getStatusText(selectedVehicle.status) }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const vehicles = ref([])
const showAddDialog = ref(false)
const showDocsDialog = ref(false)
const showDetailDialog = ref(false)
const selectedVehicle = ref(null)

const vehicleForm = ref({
  vin: '',
  plate_number: '',
  brand: '',
  model: '',
  year: 2024,
  color: '',
  mileage: 0
})

const docsForm = ref({
  photos: '',
  ownership_docs: '',
  insurance_docs: '',
  mortgage_docs: ''
})

const loadVehicles = async () => {
  try {
    const res = await api.get('/vehicles')
    if (res.data.success) {
      vehicles.value = res.data.data
    }
  } catch (e) {
    console.error(e)
  }
}

const addVehicle = async () => {
  if (!vehicleForm.value.vin) {
    ElMessage.error('VIN码不能为空')
    return
  }
  try {
    const res = await api.post('/vehicles', vehicleForm.value)
    if (res.data.success) {
      ElMessage.success('添加成功')
      showAddDialog.value = false
      loadVehicles()
      vehicleForm.value = { vin: '', plate_number: '', brand: '', model: '', year: 2024, color: '', mileage: 0 }
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '添加失败')
  }
}

const editDocs = (row) => {
  selectedVehicle.value = row
  docsForm.value = {
    photos: row.photos || '',
    ownership_docs: row.ownership_docs || '',
    insurance_docs: row.insurance_docs || '',
    mortgage_docs: row.mortgage_docs || ''
  }
  showDocsDialog.value = true
}

const saveDocs = async () => {
  try {
    const res = await api.put(`/vehicles/${selectedVehicle.value.id}/docs`, docsForm.value)
    if (res.data.success) {
      ElMessage.success('资料更新成功')
      showDocsDialog.value = false
      loadVehicles()
    }
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const viewDetail = (row) => {
  selectedVehicle.value = row
  showDetailDialog.value = true
}

const getStatusType = (status) => {
  const map = { pending: 'info', valuated: '', mortgaged: 'success', released: '' }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = { pending: '待完善', valuated: '已评估', mortgaged: '抵押中', released: '已解押' }
  return map[status] || status
}

onMounted(() => {
  loadVehicles()
})
</script>
