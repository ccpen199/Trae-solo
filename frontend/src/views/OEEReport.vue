<template>
  <div class="oee-report">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>OEE 效率报表</span>
          <el-button type="primary" @click="loadData">刷新</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="20" class="summary-row">
        <el-col :span="6">
          <div class="stat-card">
            <div class="label">综合 OEE</div>
            <div class="value" :class="getOEEClass(oeeData.oee)">{{ oeeData.oee }}%</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="label">可用率</div>
            <div class="value" :class="getOEEClass(oeeData.availability)">{{ oeeData.availability }}%</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="label">性能率</div>
            <div class="value" :class="getOEEClass(oeeData.performance)">{{ oeeData.performance }}%</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="label">良品率</div>
            <div class="value" :class="getOEEClass(oeeData.quality)">{{ oeeData.quality }}%</div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>按设备统计</span>
            </template>
            <el-table :data="oeeByDevice" style="width: 100%">
              <el-table-column prop="device_code" label="设备编码" width="120" />
              <el-table-column prop="device_name" label="设备名称" />
              <el-table-column label="OEE" width="100">
                <template #default="{ row }">
                  <el-tag :type="getOEEType(row.oee_data.oee)">{{ row.oee_data.oee }}%</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="可用率" width="100">
                <template #default="{ row }">{{ row.oee_data.availability }}%</template>
              </el-table-column>
              <el-table-column label="性能率" width="100">
                <template #default="{ row }">{{ row.oee_data.performance }}%</template>
              </el-table-column>
              <el-table-column label="良品率" width="100">
                <template #default="{ row }">{{ row.oee_data.quality }}%</template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>按班次统计</span>
            </template>
            <el-table :data="oeeByShift" style="width: 100%">
              <el-table-column prop="shift_name" label="班次" width="150" />
              <el-table-column label="OEE" width="100">
                <template #default="{ row }">
                  <el-tag :type="getOEEType(row.oee_data.oee)">{{ row.oee_data.oee }}%</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="可用率" width="100">
                <template #default="{ row }">{{ row.oee_data.availability }}%</template>
              </el-table-column>
              <el-table-column label="性能率" width="100">
                <template #default="{ row }">{{ row.oee_data.performance }}%</template>
              </el-table-column>
              <el-table-column label="良品率" width="100">
                <template #default="{ row }">{{ row.oee_data.quality }}%</template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>停机事件明细</span>
            </template>
            <el-table :data="downtimeEvents" style="width: 100%" max-height="400">
              <el-table-column label="设备" width="180">
                <template #default="{ row }">
                  <div v-if="row.device">
                    <el-tag size="small" type="info">{{ row.device.code }}</el-tag>
                    <span style="margin-left: 5px;">{{ row.device.name }}</span>
                  </div>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="shift.name" label="班次" width="100">
                <template #default="{ row }">{{ row.shift?.name || '-' }}</template>
              </el-table-column>
              <el-table-column prop="record_type" label="类型" width="120">
                <template #default="{ row }">
                  <el-tag :type="getTypeClass(row.record_type)">{{ row.record_type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="downtime_reason" label="停机原因" />
              <el-table-column prop="duration_minutes" label="时长(分钟)" width="120" />
              <el-table-column prop="start_time" label="开始时间" width="180">
                <template #default="{ row }">{{ formatTime(row.start_time) }}</template>
              </el-table-column>
              <el-table-column prop="operator" label="操作员" width="100" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getOEE, getOEEByDevice, getOEEByShift, getDowntimeEvents } from '../api'

const dateRange = ref([])
const filterForm = ref({})
const oeeData = ref({
  availability: 0,
  performance: 0,
  quality: 0,
  oee: 0,
  planned_production_time: 0,
  run_time: 0,
  planned_downtime: 0,
  unplanned_downtime: 0,
  total_output: 0,
  good_quantity: 0
})
const oeeByDevice = ref([])
const oeeByShift = ref([])
const downtimeEvents = ref([])

const getOEEClass = (value) => {
  if (value >= 85) return 'oee-high'
  if (value >= 60) return 'oee-medium'
  return 'oee-low'
}

const getOEEType = (value) => {
  if (value >= 85) return 'success'
  if (value >= 60) return 'warning'
  return 'danger'
}

const getTypeClass = (type) => {
  const types = {
    '故障停机': 'danger',
    '待料': 'warning',
    '换线': 'info',
    '计划停机': '',
    '保养': 'success'
  }
  return types[type] || 'info'
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const loadData = async () => {
  try {
    const params = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0].toISOString()
      params.end_date = dateRange.value[1].toISOString()
    }
    
    const [oeeRes, deviceRes, shiftRes, downtimeRes] = await Promise.all([
      getOEE(params),
      getOEEByDevice(params),
      getOEEByShift(params),
      getDowntimeEvents(params)
    ])
    
    oeeData.value = oeeRes.data
    oeeByDevice.value = deviceRes.data
    oeeByShift.value = shiftRes.data
    downtimeEvents.value = downtimeRes.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-form {
  margin-bottom: 20px;
}

.summary-row {
  margin-bottom: 20px;
}
</style>
