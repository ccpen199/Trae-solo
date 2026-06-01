<template>
  <div class="page-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409eff">
              <el-icon><office-building /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalRooms || 0 }}</div>
              <div class="stat-label">总房源数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67c23a">
              <el-icon><key /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.availableRooms || 0 }}</div>
              <div class="stat-label">可租房源</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #e6a23c">
              <el-icon><user /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalLeads || 0 }}</div>
              <div class="stat-label">客户线索</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #f56c6c">
              <el-icon><document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.activeContracts || 0 }}</div>
              <div class="stat-label">在租合同</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">楼宇入驻情况</span>
          </template>
          <el-table :data="buildingData" style="width: 100%">
            <el-table-column prop="name" label="楼宇名称" />
            <el-table-column prop="total_rooms" label="总房源" width="80" />
            <el-table-column prop="rented_rooms" label="已出租" width="80" />
            <el-table-column label="入驻率" width="120">
              <template #default="{ row }">
                <el-progress :percentage="row.room_occupancy_rate || 0" :stroke-width="12" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">线索来源统计</span>
          </template>
          <el-table :data="sourceData" style="width: 100%">
            <el-table-column prop="name" label="来源渠道" />
            <el-table-column prop="count" label="线索数" width="80" />
            <el-table-column prop="converted" label="已转化" width="80" />
            <el-table-column prop="conversion_rate" label="转化率" width="100">
              <template #default="{ row }">
                <span>{{ row.conversion_rate }}%</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">快速操作</span>
          </template>
          <el-space wrap>
            <el-button type="primary" @click="$router.push('/buildings')">
              <el-icon><plus /></el-icon>
              新增楼宇
            </el-button>
            <el-button type="success" @click="$router.push('/rooms')">
              <el-icon><plus /></el-icon>
              新增房源
            </el-button>
            <el-button type="warning" @click="$router.push('/leads')">
              <el-icon><plus /></el-icon>
              新增线索
            </el-button>
            <el-button type="danger" @click="$router.push('/contracts')">
              <el-icon><plus /></el-icon>
              新增合同
            </el-button>
          </el-space>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { OfficeBuilding, Key, User, Document, Plus } from '@element-plus/icons-vue'
import { dashboard, reports } from '@/api'

const stats = ref({})
const buildingData = ref([])
const sourceData = ref([])

async function loadData() {
  try {
    const [statsRes, buildingRes, sourceRes] = await Promise.all([
      dashboard.stats(),
      reports.buildingOccupancy(),
      reports.leadSource()
    ])
    stats.value = statsRes
    buildingData.value = buildingRes
    sourceData.value = sourceRes
  } catch (e) {
    console.error('Load data failed:', e)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stat-card {
  cursor: pointer;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.card-title {
  font-weight: 600;
  font-size: 16px;
}
</style>
