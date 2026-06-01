<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">隐患看板</h2>
    </div>

    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
              <div style="font-size: 14px; color: #909399; margin-bottom: 8px">检查对象总数</div>
              <div style="font-size: 32px; font-weight: 600; color: #303133">{{ stats.totalUnits || 0 }}</div>
            </div>
            <el-icon size="40" color="#409EFF"><OfficeBuilding /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
              <div style="font-size: 14px; color: #909399; margin-bottom: 8px">待处理隐患</div>
              <div style="font-size: 32px; font-weight: 600; color: #e6a23c">{{ stats.pendingHazards || 0 }}</div>
            </div>
            <el-icon size="40" color="#e6a23c"><Warning /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
              <div style="font-size: 14px; color: #909399; margin-bottom: 8px">待复查</div>
              <div style="font-size: 32px; font-weight: 600; color: #409EFF">{{ stats.recheckingHazards || 0 }}</div>
            </div>
            <el-icon size="40" color="#409EFF"><Clock /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
              <div style="font-size: 14px; color: #909399; margin-bottom: 8px">逾期整改</div>
              <div style="font-size: 32px; font-weight: 600; color: #f56c6c">{{ stats.overdueRectifications || 0 }}</div>
            </div>
            <el-icon size="40" color="#f56c6c"><BellFilled /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span style="font-weight: 600">高风险单位</span>
          </template>
          <el-table :data="highRiskUnits" size="small">
            <el-table-column prop="name" label="单位名称" />
            <el-table-column prop="address" label="地址" show-overflow-tooltip />
            <el-table-column prop="responsible_person" label="责任人" />
            <el-table-column label="风险等级">
              <template #default="{ row }">
                <span class="risk-high">高风险</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span style="font-weight: 600">最近检查记录</span>
          </template>
          <el-table :data="stats.recentRecords || []" size="small">
            <el-table-column prop="unit_name" label="检查单位" />
            <el-table-column prop="inspection_date" label="检查日期" />
            <el-table-column prop="inspector" label="检查人" />
            <el-table-column label="状态">
              <template #default="{ row }">
                <el-tag :type="row.overall_status === 'pass' ? 'success' : 'warning'" size="small">
                  {{ row.overall_status === 'pass' ? '合格' : '有隐患' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <span style="font-weight: 600">逾期整改提醒</span>
        <el-tag type="danger" size="small" style="margin-left: 10px">{{ overdueList.length }} 项</el-tag>
      </template>
      <el-table :data="overdueList" size="small">
        <el-table-column prop="unit_name" label="责任单位" />
        <el-table-column prop="hazard_type" label="隐患类型" />
        <el-table-column prop="hazard_description" label="隐患描述" show-overflow-tooltip />
        <el-table-column prop="responsible_person" label="整改责任人" />
        <el-table-column prop="deadline" label="整改期限" />
        <el-table-column label="逾期天数">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600">{{ row.days_overdue }} 天</span>
          </template>
        </el-table-column>
        <el-table-column label="升级级别">
          <template #default="{ row }">
            <el-tag v-if="row.escalation_level >= 3" type="danger" size="small">严重</el-tag>
            <el-tag v-else-if="row.escalation_level >= 2" type="warning" size="small">重要</el-tag>
            <el-tag v-else type="info" size="small">一般</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const stats = ref({})
const highRiskUnits = ref([])
const overdueList = ref([])

const loadData = async () => {
  try {
    const [statsData, unitsData, overdueData] = await Promise.all([
      api.getDashboardStats(),
      api.getUnits({ risk_level: 'high' }),
      api.getOverdueRectifications()
    ])
    stats.value = statsData
    highRiskUnits.value = unitsData.slice(0, 5)
    overdueList.value = overdueData
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>
