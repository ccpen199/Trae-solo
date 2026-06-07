<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">信用分评估</h2>
      <p class="page-subtitle">商家信用分动态评估与排名</p>
    </div>

    <el-card class="card-shadow">
      <el-table :data="creditList" style="width: 100%;">
        <el-table-column prop="rank" label="排名" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.rank <= 3" :type="getRankType(row.rank)" size="small">{{ row.rank }}</el-tag>
            <span v-else>{{ row.rank }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="company_name" label="商家名称" />
        <el-table-column prop="category" label="类别" />
        <el-table-column prop="credit_score" label="信用分" width="120">
          <template #default="{ row }">
            <span class="credit-score" :class="getScoreClass(row.credit_score)">
              {{ row.credit_score }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="评分明细" width="300">
          <template #default="{ row }">
            <el-popover placement="top" width="250" trigger="hover">
              <template #reference>
                <el-link type="primary">查看明细</el-link>
              </template>
              <div class="score-detail">
                <div class="detail-item">
                  <span>综合评分</span>
                  <el-progress :percentage="row.rating_score" :stroke-width="8" />
                </div>
                <div class="detail-item">
                  <span>评价数量</span>
                  <el-progress :percentage="row.review_count_score" :stroke-width="8" color="#67C23A" />
                </div>
                <div class="detail-item">
                  <span>差评率</span>
                  <el-progress :percentage="row.negative_rate_score" :stroke-width="8" color="#E6A23C" />
                </div>
                <div class="detail-item">
                  <span>差评响应SLA</span>
                  <el-progress :percentage="row.response_sla_score" :stroke-width="8" color="#F56C6C" />
                </div>
              </div>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column prop="last_updated" label="更新时间" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

const creditList = ref([])

function getRankType(rank) {
  const types = ['success', 'warning', 'info']
  return types[rank - 1] || 'info'
}

function getScoreClass(score) {
  if (score >= 90) return 'score-excellent'
  if (score >= 80) return 'score-good'
  if (score >= 60) return 'score-normal'
  return 'score-bad'
}

async function loadCreditData() {
  try {
    const res = await api.get('/admin/credit-scores')
    creditList.value = res.data
  } catch (e) {
    creditList.value = [
      { rank: 1, company_name: '罗曼婚礼策划', category: '婚礼策划', credit_score: 95, last_updated: '2024-01-15', rating_score: 95, review_count_score: 88, negative_rate_score: 92, response_sla_score: 98 },
      { rank: 2, company_name: '唯爱婚纱摄影', category: '婚纱摄影', credit_score: 92, last_updated: '2024-01-15', rating_score: 90, review_count_score: 95, negative_rate_score: 88, response_sla_score: 94 },
      { rank: 3, company_name: '喜来登宴会厅', category: '婚宴酒店', credit_score: 89, last_updated: '2024-01-15', rating_score: 88, review_count_score: 90, negative_rate_score: 85, response_sla_score: 92 },
      { rank: 4, company_name: '花漾花艺', category: '婚礼花艺', credit_score: 85, last_updated: '2024-01-15', rating_score: 86, review_count_score: 82, negative_rate_score: 88, response_sla_score: 84 },
      { rank: 5, company_name: '梦幻彩妆工作室', category: '化妆造型', credit_score: 78, last_updated: '2024-01-15', rating_score: 80, review_count_score: 75, negative_rate_score: 82, response_sla_score: 76 }
    ]
  }
}

onMounted(() => {
  loadCreditData()
})
</script>

<style scoped lang="scss">
.credit-score {
  font-weight: 600;
  font-size: 16px;
  
  &.score-excellent { color: #67C23A; }
  &.score-good { color: #409EFF; }
  &.score-normal { color: #E6A23C; }
  &.score-bad { color: #F56C6C; }
}

.score-detail {
  .detail-item {
    margin-bottom: 12px;
    
    span {
      display: block;
      margin-bottom: 4px;
      font-size: 12px;
      color: #606266;
    }
  }
}
</style>
