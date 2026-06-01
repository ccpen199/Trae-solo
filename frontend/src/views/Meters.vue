<template>
  <div class="meters">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>表计档案</span>
          <div class="header-actions">
            <el-select v-model="filter.energy_type" placeholder="能源类型" clearable style="width: 120px; margin-right: 10px;">
              <el-option label="电" value="electricity" />
              <el-option label="水" value="water" />
              <el-option label="气" value="gas" />
              <el-option label="空调" value="cooling" />
            </el-select>
            <el-select v-model="filter.is_public" placeholder="表类型" clearable style="width: 120px; margin-right: 10px;">
              <el-option label="公共表" :value="1" />
              <el-option label="企业表" :value="0" />
            </el-select>
            <el-button type="primary" @click="showAddDialog">
              <el-icon><Plus /></el-icon>
              新增表计
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="meters" border stripe>
        <el-table-column prop="meter_no" label="表号" width="140" />
        <el-table-column prop="meter_name" label="表名称" width="160" />
        <el-table-column label="能源类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getEnergyTagType(row.energy_type)">
              {{ energyTypeMap[row.energy_type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="building_name" label="楼栋" width="120" />
        <el-table-column prop="enterprise_name" label="所属企业" width="160" />
        <el-table-column prop="multiplier" label="倍率" width="100" />
        <el-table-column label="是否公共" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_public ? 'warning' : 'info'">
              {{ row.is_public ? '公共' : '企业' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="showChangeDialog(row)">
              换表
            </el-button>
            <el-button type="info" link size="small" @click="showHistory(row)">
              历史
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="addVisible" title="新增表计" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="表号" required>
          <el-input v-model="form.meter_no" placeholder="请输入表号" />
        </el-form-item>
        <el-form-item label="表名称">
          <el-input v-model="form.meter_name" placeholder="请输入表名称" />
        </el-form-item>
        <el-form-item label="能源类型" required>
          <el-select v-model="form.energy_type" placeholder="请选择" style="width: 100%;">
            <el-option label="电" value="electricity" />
            <el-option label="水" value="water" />
            <el-option label="气" value="gas" />
            <el-option label="空调" value="cooling" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属楼栋">
          <el-select v-model="form.building_id" placeholder="请选择" style="width: 100%;">
            <el-option v-for="b in buildings" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属企业">
          <el-select v-model="form.enterprise_id" placeholder="请选择（公共表可不选）" style="width: 100%;" clearable>
            <el-option v-for="e in enterprises" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="倍率">
          <el-input-number v-model="form.multiplier" :min="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="公共表">
          <el-switch v-model="form.is_public" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="changeVisible" title="换表登记" width="500px">
      <el-form :model="changeForm" label-width="120px">
        <el-form-item label="原表号">
          <el-input :value="currentMeter?.meter_no" disabled />
        </el-form-item>
        <el-form-item label="新表号" required>
          <el-input v-model="changeForm.new_meter_no" placeholder="请输入新表号" />
        </el-form-item>
        <el-form-item label="旧表止数" required>
          <el-input-number v-model="changeForm.old_final_reading" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="新表底数" required>
          <el-input-number v-model="changeForm.new_initial_reading" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="换表日期" required>
          <el-date-picker v-model="changeForm.change_date" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="换表原因">
          <el-input v-model="changeForm.reason" type="textarea" :rows="3" placeholder="请输入换表原因" />
        </el-form-item>
        <el-form-item label="经办人">
          <el-input v-model="changeForm.operator" placeholder="请输入经办人" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="changeVisible = false">取消</el-button>
        <el-button type="primary" @click="handleChange">确认换表</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="historyVisible" title="换表历史" width="600px">
      <el-table :data="changeHistory" border stripe>
        <el-table-column prop="old_meter_no" label="旧表号" />
        <el-table-column prop="new_meter_no" label="新表号" />
        <el-table-column prop="old_final_reading" label="旧表止数" />
        <el-table-column prop="new_initial_reading" label="新表底数" />
        <el-table-column prop="change_date" label="换表日期" />
        <el-table-column prop="reason" label="原因" />
        <el-table-column prop="operator" label="经办人" />
      </el-table>
      <template #footer>
        <el-button @click="historyVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { getMeters, addMeter, changeMeter, getMeterChanges, getBuildings, getEnterprises, energyTypeMap } from '../api'

const meters = ref([])
const buildings = ref([])
const enterprises = ref([])
const addVisible = ref(false)
const changeVisible = ref(false)
const historyVisible = ref(false)
const currentMeter = ref(null)
const changeHistory = ref([])

const filter = reactive({
  energy_type: '',
  is_public: ''
})

const form = ref({
  meter_no: '',
  meter_name: '',
  energy_type: '',
  building_id: null,
  enterprise_id: null,
  multiplier: 1,
  is_public: 0
})

const changeForm = ref({
  new_meter_no: '',
  old_final_reading: 0,
  new_initial_reading: 0,
  change_date: '',
  reason: '',
  operator: ''
})

const getEnergyTagType = (type) => {
  const map = { electricity: 'primary', water: 'success', gas: 'warning', cooling: 'danger' }
  return map[type] || 'info'
}

const loadMeters = async () => {
  try {
    const params = {}
    if (filter.energy_type) params.energy_type = filter.energy_type
    if (filter.is_public !== '') params.is_public = filter.is_public
    const res = await getMeters(params)
    meters.value = res.data
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const showAddDialog = () => {
  form.value = {
    meter_no: '',
    meter_name: '',
    energy_type: '',
    building_id: null,
    enterprise_id: null,
    multiplier: 1,
    is_public: 0
  }
  addVisible.value = true
}

const handleAdd = async () => {
  if (!form.value.meter_no || !form.value.energy_type) {
    ElMessage.warning('请填写必填项')
    return
  }
  try {
    await addMeter(form.value)
    ElMessage.success('新增成功')
    addVisible.value = false
    loadMeters()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '新增失败')
  }
}

const showChangeDialog = (row) => {
  currentMeter.value = row
  changeForm.value = {
    new_meter_no: '',
    old_final_reading: 0,
    new_initial_reading: 0,
    change_date: new Date().toISOString().split('T')[0],
    reason: '',
    operator: ''
  }
  changeVisible.value = true
}

const handleChange = async () => {
  if (!changeForm.value.new_meter_no || !changeForm.value.change_date) {
    ElMessage.warning('请填写必填项')
    return
  }
  try {
    await changeMeter(currentMeter.value.id, changeForm.value)
    ElMessage.success('换表成功')
    changeVisible.value = false
    loadMeters()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '换表失败')
  }
}

const showHistory = async (row) => {
  try {
    const res = await getMeterChanges(row.id)
    changeHistory.value = res.data
    historyVisible.value = true
  } catch (e) {
    ElMessage.error('加载历史失败')
  }
}

onMounted(async () => {
  await loadMeters()
  const [bRes, eRes] = await Promise.all([getBuildings(), getEnterprises()])
  buildings.value = bRes.data
  enterprises.value = eRes.data
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-actions {
  display: flex;
  align-items: center;
}
</style>
