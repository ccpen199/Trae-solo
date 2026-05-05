<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <el-icon size="40" color="#409EFF"><Document /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.cardCount }}</div>
              <div class="stat-label">名片总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <el-icon size="40" color="#67C23A"><FolderOpened /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.groupCount }}</div>
              <div class="stat-label">分组数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <el-icon size="40" color="#E6A23C"><User /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.contactCount }}</div>
              <div class="stat-label">联系人</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <el-icon size="40" color="#F56C6C"><View /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.viewCount }}</div>
              <div class="stat-label">访问记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近访问</span>
              <router-link to="/cards">查看全部</router-link>
            </div>
          </template>
          <el-table :data="recentCards" style="width: 100%">
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="companyName" label="公司" />
            <el-table-column prop="positionName" label="职位" />
            <el-table-column prop="mobile" label="手机" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" link @click="goToCard(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <router-link to="/cards" class="quick-action">
              <el-icon size="24"><Plus /></el-icon>
              <span>新增名片</span>
            </router-link>
            <router-link to="/groups" class="quick-action">
              <el-icon size="24"><FolderAdd /></el-icon>
              <span>新增分组</span>
            </router-link>
            <router-link to="/profile" class="quick-action">
              <el-icon size="24"><Setting /></el-icon>
              <span>个人设置</span>
            </router-link>
          </div>
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>使用提示</span>
            </div>
          </template>
          <ul class="tips-list">
            <li>点击"新增名片"录入新的联系人信息</li>
            <li>可以将多张同一名片关联到同一人物</li>
            <li>使用分组功能按业务、客户等组织联系人</li>
            <li>访问日志会记录所有查看操作</li>
          </ul>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { cardApi, groupApi } from '@/api'

const router = useRouter()

const stats = ref({
  cardCount: 0,
  groupCount: 0,
  contactCount: 0,
  viewCount: 0
})

const recentCards = ref([])

const loadStats = async () => {
  try {
    const [cardsResult, groupsResult] = await Promise.all([
      cardApi.list({ page: 0, size: 1 }),
      groupApi.list()
    ])
    stats.value.cardCount = cardsResult.data?.totalElements || 0
    stats.value.groupCount = groupsResult.data?.length || 0
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const loadRecentCards = async () => {
  try {
    const result = await cardApi.list({ page: 0, size: 5 })
    recentCards.value = result.data?.content || []
  } catch (error) {
    console.error('加载最近名片失败:', error)
  }
}

const goToCard = (row) => {
  router.push(`/cards/${row.id}`)
}

onMounted(() => {
  loadStats()
  loadRecentCards()
})
</script>

<style scoped>
.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header a {
  color: #409EFF;
  text-decoration: none;
  font-size: 14px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  background: #f5f7fa;
  border-radius: 6px;
  text-decoration: none;
  color: #303133;
  transition: all 0.3s;
}

.quick-action:hover {
  background: #ecf5ff;
  color: #409EFF;
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tips-list li {
  padding: 8px 0;
  color: #606266;
  font-size: 14px;
  border-bottom: 1px dashed #ebeef5;
}

.tips-list li:last-child {
  border-bottom: none;
}
</style>
