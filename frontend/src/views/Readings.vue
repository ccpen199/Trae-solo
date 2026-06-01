<template>
  <div class="readings">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>抄表录入</span>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            录入抄表
          </el-button>
        </div>
      </template>

      <el-table :data="readings" border stripe>
        <el-table-column prop="meter_no" label="表号" width="140" />
        <el-table-column prop="meter_name" label="表名称" width="160" />
        <el-table-column label="能源类型" width="100">
          <template #default="{ row }">
            <el-tag>{{ energyTypeMap[row.energy_type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enterprise_name" label="企业" width="160" />
        <el-table-column prop="reading_date" label="抄表日期" width="120" />
        <el-table-column prop="reading_value" label="读数" width="120" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'normal'" type="success">正常</el-tag>
            <el-tag v-else-if="row.status === 'pending_review'" type="warning">待复核</el-tag>
            <el-tag v-else type="danger">已驳回</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="anomaly_type" label="异常类型" width="120">
          <template #default="{ row }">
            <span v-if="row.anomaly_type === 'decrease'" style="color: #f56c6c;">读数倒挂</span>
            <span v-else-if="row.anomaly_type === 'spike'" style="color: #e6a23c;">读数突增</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="addVisible" title="录入抄表数据" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="选择表计" required>
          <el-select v-model="form.meter_id" placeholder="请选择表计" style="width: 100%;" filterable>
            <el-option 
              v-for="m in meters" 
              :key="m.id" 
              :label="`${m.meter_no} - ${m.meter_name}`" 
              :value="m.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="抄表日期" required>
          <el-date-picker 
            v-model="form.reading_date" 
            type="date" 
            value-format="YYYY-MM-DD" 
            style="width: 100%;" 
          />
        </el-form-item>
        <el-form-item label="读数" required>
          <el-input-number v-model="form.reading_value" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="录入方式">
          <el-radio-group v-model="form.reading_type">
            <el-radio value="manual">人工录入</el-radio>
            <el-radio value="import">导入</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMeterReadings, addMeterReadings, getMeters, energyTypeMap } from '../api'

const readings = ref([])
const meters = ref([])
const addVisible = ref(false)

const form = ref({
  meter_id: null,
  reading_date: '',
  reading_value: 0,
  reading_type: 'manual'
})

const loadReadings = async () => {
  try {
    const res = await getMeterReadings({})
    readings.value = res.data
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const showAddDialog = () => {
  form.value = {
    meter_id: null,
    reading_date: new Date().toISOString().split('T')[0],
    reading_value: 0,
    reading_type: 'manual'
  }
  addVisible.value = true
}

const handleAdd = async () => {
  if (!form.value.meter_id || !form.value.reading_date || form.value.reading_value < 0) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    const res = await addMeterReadings(form.value)
    const result = res.data[0]
    if (result.anomaly) {
      ElMessage.warning(`已录入，存在异常：${result.anomaly.message}，待复核`)
    } else {
      ElMessage.success('录入成功')
    }
    addVisible.value = false
    loadReadings()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '录入失败')
  }
}

onMounted(async () => {
  await loadReadings()
  const mRes = await getMeters({})
  meters.value = mRes.data
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
