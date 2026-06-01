<template>
  <div class="review">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>异常复核</span>
          <el-tag type="warning" size="large">待处理: {{ pendingCount }}</el-tag>
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
        <el-table-column prop="reading_value" label="当前读数" width="120" />
        <el-table-column label="异常类型" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.anomaly_type === 'decrease'" type="danger">读数倒挂</el-tag>
            <el-tag v-else-if="row.anomaly_type === 'spike'" type="warning">读数突增</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="录入时间" width="180">
          <template #default="{ row }">
            {{ row.created_at?.substring(0, 19) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleApprove(row)">
              通过
            </el-button>
            <el-button type="danger" size="small" @click="handleReject(row)">
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMeterReadings, reviewReading, energyTypeMap } from '../api'

const readings = ref([])

const pendingCount = computed(() => readings.value.length)

const loadReadings = async () => {
  try {
    const res = await getMeterReadings({ status: 'pending_review' })
    readings.value = res.data
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const handleApprove = async (row) => {
  try {
    await ElMessageBox.confirm('确认通过该抄表记录？', '提示', { type: 'info' })
    await reviewReading(row.id, { status: 'normal', reviewed_by: '管理员' })
    ElMessage.success('已通过')
    loadReadings()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const handleReject = async (row) => {
  try {
    await ElMessageBox.confirm('确认驳回该抄表记录？', '提示', { type: 'warning' })
    await reviewReading(row.id, { status: 'rejected', reviewed_by: '管理员' })
    ElMessage.success('已驳回')
    loadReadings()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

onMounted(() => {
  loadReadings()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
