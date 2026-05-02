<template>
  <div class="dashboard">
    <el-card shadow="hover" class="welcome-card">
      <template #header>
        <div class="card-header">
          <h3>召回管理中心</h3>
          <el-button type="danger" @click="createRecall">发起召回</el-button>
        </div>
      </template>
      <div class="welcome-content">
        <p>这里是农产品召回管理中心，支持批次召回、终端定位和下架处理。</p>
      </div>
    </el-card>
    
    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="48" class="stat-icon"><Warning /></el-icon>
            <div class="stat-info">
              <h4>活跃召回</h4>
              <p class="stat-number">{{ stats.activeRecalls || 0 }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="48" class="stat-icon"><Box /></el-icon>
            <div class="stat-info">
              <h4>受影响批次</h4>
              <p class="stat-number">{{ stats.affectedBatches || 0 }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="48" class="stat-icon"><Location /></el-icon>
            <div class="stat-info">
              <h4>终端定位</h4>
              <p class="stat-number">{{ stats.locateTerminals || 0 }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="recent-activity">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <h3>最近召回记录</h3>
          </template>
          <el-table :data="recentRecalls" style="width: 100%">
            <el-table-column prop="recall_code" label="召回编号" width="180" />
            <el-table-column prop="batch_code" label="批次号" />
            <el-table-column prop="reason" label="召回原因" />
            <el-table-column prop="level" label="召回等级" width="120">
              <template #default="scope">
                <el-tag :type="scope.row.level === 'serious' ? 'danger' : scope.row.level === 'major' ? 'warning' : 'info'">
                  {{ scope.row.level_text }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120" />
            <el-table-column prop="created_at" label="创建时间" width="180" />
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button size="small" type="primary" @click="viewRecall(scope.row.uid)">
                  查看
                </el-button>
                <el-button size="small" type="danger" @click="locateTerminals(scope.row.batch_uid)">
                  定位
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Warning, Box, Location } from '@element-plus/icons-vue'

const router = useRouter()

const stats = ref({
  activeRecalls: 0,
  affectedBatches: 0,
  locateTerminals: 0
})

const recentRecalls = ref([])

onMounted(async () => {
  // 模拟数据
  stats.value = {
    activeRecalls: 2,
    affectedBatches: 5,
    locateTerminals: 8
  }
  
  recentRecalls.value = [
    {
      uid: '1',
      recall_code: 'RC-2026-001',
      batch_code: 'FA-PR-26-ABC123',
      reason: '农残超标',
      level: 'serious',
      level_text: '严重',
      status: '处理中',
      batch_uid: 'batch_1',
      created_at: '2026-04-25 10:00:00'
    },
    {
      uid: '2',
      recall_code: 'RC-2026-002',
      batch_code: 'FA-PR-26-DEF456',
      reason: '重金属超标',
      level: 'major',
      level_text: '重要',
      status: '已完成',
      batch_uid: 'batch_2',
      created_at: '2026-04-20 14:30:00'
    }
  ]
})

const createRecall = () => {
  router.push('/recall/create')
}

const viewRecall = (recallUid) => {
  router.push(`/recall/detail/${recallUid}`)
}

const locateTerminals = (batchUid) => {
  console.log('定位终端:', batchUid)
}
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.welcome-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.welcome-content p {
  font-size: 16px;
  color: #606266;
  line-height: 1.5;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  color: #f56c6c;
}

.stat-info h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
  font-weight: normal;
}

.stat-number {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.recent-activity {
  margin-top: 20px;
}

.recent-activity h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}
</style>
