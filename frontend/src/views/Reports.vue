<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">招商报表</div>
    </div>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409eff">
              <el-icon><office-building /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.rooms?.total || 0 }}</div>
              <div class="stat-label">总房源数</div>
              <div class="stat-sub">入驻率 {{ overview.rooms?.occupancyRate || 0 }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67c23a">
              <el-icon><scale /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.area?.total || 0 }}㎡</div>
              <div class="stat-label">总面积</div>
              <div class="stat-sub">已租 {{ overview.area?.rented || 0 }}㎡</div>
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
              <div class="stat-value">{{ overview.leads?.total || 0 }}</div>
              <div class="stat-label">总线索数</div>
              <div class="stat-sub">转化率 {{ overview.leads?.conversionRate || 0 }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #f56c6c">
              <el-icon><money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.finance?.monthlyRent || 0 }}</div>
              <div class="stat-label">月租金收入</div>
              <div class="stat-sub">在租合同 {{ overview.contracts?.active || 0 }}份</div>
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
            <el-table-column label="房间入驻率" width="120">
              <template #default="{ row }">
                <el-progress :percentage="row.room_occupancy_rate || 0" :stroke-width="12" />
              </template>
            </el-table-column>
            <el-table-column prop="total_area" label="总面积" width="100">
              <template #default="{ row }">{{ row.total_area }}㎡</template>
            </el-table-column>
            <el-table-column prop="rented_area" label="已租面积" width="100">
              <template #default="{ row }">{{ row.rented_area }}㎡</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">线索来源分析</span>
          </template>
          <el-table :data="sourceData" style="width: 100%">
            <el-table-column prop="name" label="来源渠道" />
            <el-table-column prop="count" label="线索数" width="80" />
            <el-table-column prop="converted" label="已转化" width="80" />
            <el-table-column label="转化率" width="100">
              <template #default="{ row }">
                <span :style="{ color: row.conversion_rate >= 30 ? '#67c23a' : '#e6a23c' }">{{ row.conversion_rate }}%</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">月度签约趋势</span>
          </template>
          <el-table :data="monthlyData" style="width: 100%">
            <el-table-column prop="month" label="月份" width="120" />
            <el-table-column prop="count" label="签约数" width="100" />
            <el-table-column prop="total_rent" label="总租金" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">行业分析</span>
          </template>
          <el-table :data="industryData" style="width: 100%">
            <el-table-column prop="name" label="行业" />
            <el-table-column prop="lead_count" label="线索数" width="80" />
            <el-table-column prop="contract_count" label="合同数" width="80" />
            <el-table-column prop="total_rent" label="总租金" width="120" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { OfficeBuilding, Scale, User, Money } from '@element-plus/icons-vue'
import { reports } from '@/api'

const overview = ref({})
const buildingData = ref([])
const sourceData = ref([])
const monthlyData = ref([])
const industryData = ref([])

async function loadData() {
  const [overviewRes, buildingRes, sourceRes, monthlyRes, industryRes] = await Promise.all([
    reports.overview(),
    reports.buildingOccupancy(),
    reports.leadSource(),
    reports.monthlyContracts(),
    reports.industryAnalysis()
  ])
  overview.value = overviewRes
  buildingData.value = buildingRes
  sourceData.value = sourceRes
  monthlyData.value = monthlyRes
  industryData.value = industryRes
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
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.stat-sub {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
}

.card-title {
  font-weight: 600;
  font-size: 16px;
}
</style>
