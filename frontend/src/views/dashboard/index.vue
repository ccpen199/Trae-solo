<template>
  <div>
    <h2 style="margin-bottom: 20px;">管理看板</h2>
    
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="dashboard-card info">
          <div class="card-value">{{ stats.enterpriseCount || 0 }}</div>
          <div class="card-label">企业总数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="dashboard-card normal">
          <div class="card-value">{{ stats.compliantCount || 0 }}</div>
          <div class="card-label">合规企业</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="dashboard-card warning">
          <div class="card-value">{{ stats.warningCount || 0 }}</div>
          <div class="card-label">预警企业</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="dashboard-card danger">
          <div class="card-value">{{ stats.violationCount || 0 }}</div>
          <div class="card-label">超标事件</div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>实时监测热力分布</span>
          </template>
          <div class="map-container">
            <div class="map-placeholder" v-if="heatmapData.length === 0">
              <el-icon size="48" class="placeholder-icon"><MapLocation /></el-icon>
              <div class="placeholder-text">等待热力图数据...</div>
            </div>
            <div v-else style="padding: 20px;">
              <el-table :data="heatmapData" size="small">
                <el-table-column prop="enterpriseName" label="企业名称" width="180" />
                <el-table-column prop="type" label="监测类型" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getMonitorTypeTag(row.type)" size="small">
                      {{ getMonitorTypeName(row.type) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="value" label="监测值" width="100" />
                <el-table-column prop="threshold" label="阈值" width="100" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 'normal' ? 'success' : 'danger'" size="small">
                      {{ row.status === 'normal' ? '正常' : '超标' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="updatedAt" label="更新时间" />
              </el-table>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>事件状态统计</span>
          </template>
          <div style="padding: 10px;">
            <el-table :data="violationStats" size="small">
              <el-table-column prop="status" label="状态">
                <template #default="{ row }">
                  <span :class="['status-tag', row.status]">{{ getStatusName(row.status) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="count" label="数量" width="80" />
              <el-table-column prop="percentage" label="占比">
                <template #default="{ row }">
                  <el-progress :percentage="row.percentage" :stroke-width="12" size="small" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>
            <span>最新超标事件</span>
          </template>
          <div v-if="recentViolations.length === 0" style="text-align: center; padding: 40px; color: #909399;">
            暂无超标事件
          </div>
          <div v-else>
            <div 
              v-for="item in recentViolations" 
              :key="item.id" 
              style="padding: 12px 0; border-bottom: 1px solid #ebeef5; cursor: pointer;"
              @click="viewViolation(item)"
            >
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 500; font-size: 14px;">{{ item.eventCode }}</span>
                <el-tag :type="item.status === 'pending_response' ? 'warning' : 'danger'" size="small">
                  {{ getStatusName(item.status) }}
                </el-tag>
              </div>
              <div style="font-size: 12px; color: #606266; margin-top: 4px;">
                {{ item.enterpriseName || '未知企业' }}
              </div>
              <div style="font-size: 12px; color: #909399; margin-top: 4px;">
                {{ formatTime(item.createdAt) }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>企业合规排名</span>
          </template>
          <el-table :data="rankingData" size="small">
            <el-table-column prop="rank" label="排名" width="70" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.rank <= 3" :type="row.rank === 1 ? 'danger' : row.rank === 2 ? 'warning' : 'success'">
                  {{ row.rank }}
                </el-tag>
                <span v-else>{{ row.rank }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="企业名称" />
            <el-table-column prop="creditScore" label="信用分" width="100">
              <template #default="{ row }">
                <span :style="{ color: row.creditScore >= 80 ? '#67c23a' : row.creditScore >= 60 ? '#e6a23c' : '#f56c6c' }">
                  {{ row.creditScore }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="complianceStatus" label="合规状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.complianceStatus === 'compliant' ? 'success' : 'warning'" size="small">
                  {{ row.complianceStatus === 'compliant' ? '合规' : '预警' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>行业分布</span>
          </template>
          <el-table :data="industryStats" size="small">
            <el-table-column prop="industryType" label="行业类型" />
            <el-table-column prop="count" label="企业数量" width="100" />
            <el-table-column prop="percentage" label="占比">
              <template #default="{ row }">
                <el-progress :percentage="row.percentage" :stroke-width="12" size="small" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getHeatMapData } from '@/api/monitor';
import { getStatistics, getViolations } from '@/api/violation';
import { getRanking, getIndustryStats, getComplianceStats } from '@/api/enterprise';
import dayjs from 'dayjs';

const router = useRouter();

const stats = ref({
  enterpriseCount: 0,
  compliantCount: 0,
  warningCount: 0,
  violationCount: 0,
});

const heatmapData = ref([]);
const violationStats = ref([]);
const recentViolations = ref([]);
const rankingData = ref([]);
const industryStats = ref([]);

const getMonitorTypeTag = (type) => {
  const tags = {
    air: 'primary',
    water: 'success',
    noise: 'warning',
    soil: 'danger',
  };
  return tags[type] || 'info';
};

const getMonitorTypeName = (type) => {
  const names = {
    air: '空气',
    water: '水质',
    noise: '噪声',
    soil: '土壤',
  };
  return names[type] || type;
};

const getStatusName = (status) => {
  const names = {
    pending_response: '待响应',
    waiting_inspection: '待核查',
    under_treatment: '治理中',
    under_review: '审核中',
    compliant: '合规',
    closed: '已结案',
    warning: '预警',
    violation: '超标',
  };
  return names[status] || status;
};

const formatTime = (time) => {
  if (!time) return '-';
  return dayjs(time).format('YYYY-MM-DD HH:mm');
};

const viewViolation = (item) => {
  router.push('/violation');
};

const loadDashboardData = async () => {
  try {
    const [heatmapRes, violationStatsRes, rankingRes, industryRes, complianceRes] = await Promise.all([
      getHeatMapData().catch(() => ({ data: [] })),
      getStatistics().catch(() => ({ data: {} })),
      getRanking({ limit: 10 }).catch(() => ({ data: [] })),
      getIndustryStats().catch(() => ({ data: [] })),
      getComplianceStats().catch(() => ({ data: {} })),
    ]);

    heatmapData.value = heatmapRes.data || [];

    if (violationStatsRes.data) {
      stats.value.violationCount = violationStatsRes.data.total || 0;
      
      const statuses = ['pending_response', 'waiting_inspection', 'under_treatment', 'under_review', 'compliant'];
      violationStats.value = statuses.map(s => ({
        status: s,
        count: violationStatsRes.data[s] || 0,
        percentage: violationStatsRes.data.total > 0 
          ? Math.round((violationStatsRes.data[s] || 0) / violationStatsRes.data.total * 100) 
          : 0,
      }));
    }

    rankingData.value = rankingRes.data || [];

    industryStats.value = industryRes.data || [];

    if (complianceRes.data) {
      stats.value.compliantCount = complianceRes.data.compliant || 0;
      stats.value.warningCount = complianceRes.data.warning || 0;
      stats.value.enterpriseCount = (complianceRes.data.compliant || 0) + (complianceRes.data.warning || 0) + (complianceRes.data.violation || 0);
    }

    const recentRes = await getViolations({ limit: 5, sort: '-createdAt' }).catch(() => ({ data: [] }));
    recentViolations.value = recentRes.data || [];

  } catch (error) {
    console.error('加载看板数据失败:', error);
    
    stats.value = {
      enterpriseCount: 4,
      compliantCount: 3,
      warningCount: 1,
      violationCount: 0,
    };
    
    violationStats.value = [
      { status: 'pending_response', count: 0, percentage: 0 },
      { status: 'waiting_inspection', count: 0, percentage: 0 },
      { status: 'under_treatment', count: 0, percentage: 0 },
      { status: 'under_review', count: 0, percentage: 0 },
      { status: 'compliant', count: 0, percentage: 0 },
    ];
  }
};

onMounted(() => {
  loadDashboardData();
});
</script>
