<template>
  <div class="anticheat-admin">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-label">今日检测简历</div>
            <div class="stat-value">{{ stats.today_scanned }}</div>
            <div class="stat-trend">扫描中...</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card danger">
          <div class="stat-content">
            <div class="stat-label">高风险简历</div>
            <div class="stat-value">{{ stats.high_risk }}</div>
            <div class="stat-trend danger">AI生成嫌疑</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card warning">
          <div class="stat-content">
            <div class="stat-label">中风险简历</div>
            <div class="stat-value">{{ stats.medium_risk }}</div>
            <div class="stat-trend warning">项目注水嫌疑</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card info">
          <div class="stat-content">
            <div class="stat-label">限流企业</div>
            <div class="stat-value">{{ stats.spam_limited }}</div>
            <div class="stat-trend info">刷屏行为</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" class="anticheat-tabs">
      <el-tab-pane label="AI内容检测" name="ai_detect">
        <el-card>
          <template #header>
            <div class="tab-header">
              <span>AI生成内容检测 (GLTR-like算法)</span>
              <el-tag size="small" type="warning">基于词频分布统计 + 困惑度分析</el-tag>
            </div>
          </template>
          <el-table :data="aiDetectLogs" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column label="简历" width="200">
              <template #default="{ row }">
                <span>{{ row.resume_name }}</span>
              </template>
            </el-table-column>
            <el-table-column label="AI生成概率" width="150">
              <template #default="{ row }">
                <el-progress
                  :percentage="Math.round(row.ai_score * 100)"
                  :color="row.ai_score > 0.7 ? '#f56c6c' : row.ai_score > 0.4 ? '#e6a23c' : '#67c23a'"
                />
              </template>
            </el-table-column>
            <el-table-column prop="detection_method" label="检测方法" width="180" />
            <el-table-column label="风险等级" width="120">
              <template #default="{ row }">
                <el-tag :type="row.severity === 'high' ? 'danger' : row.severity === 'medium' ? 'warning' : 'success'" size="small">
                  {{ row.severity === 'high' ? '高风险' : row.severity === 'medium' ? '中风险' : '低风险' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="检测时间" width="180" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" link @click="showDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="简历注水检测" name="duplicate">
        <el-card>
          <template #header>
            <div class="tab-header">
              <span>项目重复检测 (同一项目在不同公司重复出现)</span>
              <el-tag size="small" type="danger">严重: {{ duplicateLogs.filter(l => l.severity === 'high').length }} 项</el-tag>
            </div>
          </template>
          <el-table :data="duplicateLogs" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column label="简历" width="200">
              <template #default="{ row }">
                <span>{{ row.resume_name }}</span>
              </template>
            </el-table-column>
            <el-table-column label="重复项目" width="250">
              <template #default="{ row }">
                <el-tag type="danger" size="small" effect="plain">
                  {{ row.details?.project_name }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="涉及公司">
              <template #default="{ row }">
                <div class="companies-list">
                  <el-tag
                    v-for="(c, idx) in row.details?.companies"
                    :key="idx"
                    size="small"
                    type="warning"
                  >
                    {{ c }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="风险等级" width="120">
              <template #default="{ row }">
                <el-tag type="danger" size="small">高风险</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="检测时间" width="180" />
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="企业刷屏监控" name="spam">
        <el-card>
          <template #header>
            <div class="tab-header">
              <span>消息刷屏监控 (单日发送相同消息超50次自动限流)</span>
              <div>
                <el-tag size="small" type="danger" style="margin-right: 8px;">
                  已限流: {{ spamLogs.filter(l => l.action === 'limit').length }} 家
                </el-tag>
                <el-tag size="small" type="warning">
                  预警中: {{ spamLogs.filter(l => l.action === 'warn').length }} 家
                </el-tag>
              </div>
            </div>
          </template>
          <el-table :data="spamLogs" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column label="企业" width="200">
              <template #default="{ row }">
                <span>{{ row.company_name }}</span>
              </template>
            </el-table-column>
            <el-table-column label="消息内容" min-width="300">
              <template #default="{ row }">
                <div class="message-content">
                  <el-tooltip :content="row.message_content">
                    <span>{{ row.message_content?.slice(0, 50) }}...</span>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="发送次数" width="120">
              <template #default="{ row }">
                <el-tag :type="row.count > 50 ? 'danger' : row.count > 30 ? 'warning' : 'info'" size="small">
                  {{ row.count }} 次
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="处理措施" width="120">
              <template #default="{ row }">
                <el-tag :type="row.action === 'limit' ? 'danger' : 'warning'" size="small">
                  {{ row.action === 'limit' ? '已限流' : '已警告' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="检测时间" width="180" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button
                  v-if="row.action === 'limit'"
                  type="success"
                  link
                  size="small"
                  @click="removeLimit(row)"
                >
                  解除限流
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="检测日志" name="logs">
        <el-card>
          <template #header>
            <div class="tab-header">
              <span>全量反作弊日志</span>
              <el-select v-model="logFilter" size="small" placeholder="筛选类型">
                <el-option label="全部" value="all" />
                <el-option label="AI检测" value="ai_content" />
                <el-option label="项目重复" value="duplicate_project" />
                <el-option label="内容夸大" value="exaggeration" />
                <el-option label="刷屏" value="spam" />
              </el-select>
            </div>
          </template>
          <el-table :data="filteredLogs" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column label="类型" width="150">
              <template #default="{ row }">
                <el-tag :type="getLogTypeTag(row.detection_type)" size="small">
                  {{ getLogTypeText(row.detection_type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="检测说明" />
            <el-table-column label="风险等级" width="120">
              <template #default="{ row }">
                <el-tag
                  :type="row.severity === 'high' ? 'danger' : row.severity === 'medium' ? 'warning' : 'info'"
                  size="small"
                >
                  {{ row.severity === 'high' ? '高' : row.severity === 'medium' ? '中' : '低' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="时间" width="180" />
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="detailVisible"
      title="AI内容检测详情"
      width="700px"
    >
      <div v-if="currentDetail" class="detail-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="简历名称">
            {{ currentDetail.resume_name }}
          </el-descriptions-item>
          <el-descriptions-item label="AI生成概率">
            <el-tag :type="currentDetail.ai_score > 0.7 ? 'danger' : 'warning'" size="small">
              {{ Math.round(currentDetail.ai_score * 100) }}%
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="检测方法">
            {{ currentDetail.detection_method }}
          </el-descriptions-item>
          <el-descriptions-item label="困惑度">
            {{ currentDetail.details?.perplexity || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="熵值">
            {{ currentDetail.details?.entropy || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="重复句式">
            {{ currentDetail.details?.repeated_phrases || 0 }} 处
          </el-descriptions-item>
        </el-descriptions>

        <h4 class="section-title">可疑片段标记</h4>
        <div class="suspicious-text">
          <span
            v-for="(segment, idx) in currentDetail.details?.segments || []"
            :key="idx"
            class="text-segment"
            :class="{
              'high-risk': segment.risk > 0.7,
              'medium-risk': segment.risk > 0.4 && segment.risk <= 0.7
            }"
          >
            {{ segment.text }}
            <el-tooltip :content="`风险: ${Math.round(segment.risk * 100)}%`">
              <el-tag size="small" :type="segment.risk > 0.7 ? 'danger' : 'warning'">
                {{ Math.round(segment.risk * 100) }}%
              </el-tag>
            </el-tooltip>
          </span>
        </div>

        <h4 class="section-title">处理建议</h4>
        <el-alert
          v-if="currentDetail.ai_score > 0.7"
          type="error"
          title="高风险：疑似AI生成"
          description="建议人工复核，要求候选人提供项目证明材料或进行技术笔试验证。"
          :closable="false"
        />
        <el-alert
          v-else-if="currentDetail.ai_score > 0.4"
          type="warning"
          title="中风险：部分内容可疑"
          description="建议进一步核实项目细节，重点关注描述模糊的部分。"
          :closable="false"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listAnticheatLogs } from '../../api'

const loading = ref(false)
const activeTab = ref('ai_detect')
const logFilter = ref('all')
const detailVisible = ref(false)
const currentDetail = ref(null)

const stats = reactive({
  today_scanned: 128,
  high_risk: 8,
  medium_risk: 15,
  spam_limited: 3
})

const aiDetectLogs = ref([
  { id: 1, resume_name: '张三_高级工程师.pdf', ai_score: 0.85, detection_method: 'GLTR + Perplexity', severity: 'high', created_at: '2024-01-15 10:30:00',
    details: { perplexity: 1.2, entropy: 0.8, repeated_phrases: 5,
      segments: [
        { text: '精通微服务架构设计', risk: 0.92 },
        { text: '带领团队完成项目', risk: 0.78 },
        { text: '具有丰富的经验', risk: 0.85 }
      ]
    }
  },
  { id: 2, resume_name: '李四_后端工程师.pdf', ai_score: 0.55, detection_method: 'GLTR + Perplexity', severity: 'medium', created_at: '2024-01-15 09:15:00',
    details: { perplexity: 2.1, entropy: 1.5, repeated_phrases: 2,
      segments: [
        { text: '熟悉各种前端框架', risk: 0.55 },
        { text: '参与过多个项目', risk: 0.48 }
      ]
    }
  },
  { id: 3, resume_name: '王五_算法工程师.pdf', ai_score: 0.25, detection_method: 'GLTR + Perplexity', severity: 'low', created_at: '2024-01-15 08:45:00',
    details: { perplexity: 4.2, entropy: 3.1, repeated_phrases: 0, segments: [] }
  }
])

const duplicateLogs = ref([
  { id: 1, resume_name: '张三_高级工程师.pdf', severity: 'high', created_at: '2024-01-15 10:30:00',
    details: { project_name: '智能客服系统', companies: ['字节跳动', '阿里巴巴', '腾讯科技'] }
  },
  { id: 2, resume_name: '赵六_技术专家.pdf', severity: 'high', created_at: '2024-01-14 16:20:00',
    details: { project_name: '分布式订单系统', companies: ['美团', '京东'] }
  }
])

const spamLogs = ref([
  { id: 1, company_name: 'XX科技有限公司', message_content: '您好，我们正在招聘高级工程师，请问您是否在看新机会？我们提供...', count: 68, action: 'limit', created_at: '2024-01-15 11:00:00' },
  { id: 2, company_name: 'YY招聘服务中心', message_content: '我们有一个非常匹配的职位想推荐给您...', count: 42, action: 'warn', created_at: '2024-01-15 10:30:00' },
  { id: 3, company_name: 'ZZ猎头公司', message_content: '急聘！年薪50万起的架构师职位，感兴趣请回复...', count: 55, action: 'limit', created_at: '2024-01-15 09:45:00' }
])

const allLogs = ref([])

const filteredLogs = computed(() => {
  if (logFilter.value === 'all') return allLogs.value
  return allLogs.value.filter(l => l.detection_type === logFilter.value)
})

const getLogTypeTag = (type) => {
  const map = { ai_content: 'primary', duplicate_project: 'danger', exaggeration: 'warning', spam: 'info' }
  return map[type] || 'info'
}

const getLogTypeText = (type) => {
  const map = { ai_content: 'AI内容检测', duplicate_project: '项目重复', exaggeration: '内容夸大', spam: '刷屏行为' }
  return map[type] || type
}

const showDetail = (row) => {
  currentDetail.value = row
  detailVisible.value = true
}

const removeLimit = async (row) => {
  try {
    await ElMessageBox.confirm(`确认解除对 [${row.company_name}] 的限流吗？`, '确认操作', { type: 'warning' })
    row.action = 'warn'
    stats.spam_limited = Math.max(0, stats.spam_limited - 1)
    ElMessage.success('已解除限流')
  } catch (e) {}
}

const loadLogs = async () => {
  loading.value = true
  try {
    const logs = await listAnticheatLogs(1, 50)
    allLogs.value = [
      ...aiDetectLogs.value.map(l => ({ ...l, detection_type: 'ai_content', message: `AI内容检测: ${l.resume_name} - ${Math.round(l.ai_score * 100)}%嫌疑` })),
      ...duplicateLogs.value.map(l => ({ ...l, detection_type: 'duplicate_project', message: `项目重复: ${l.resume_name} - ${l.details?.project_name}` })),
      ...spamLogs.value.map(l => ({ ...l, detection_type: 'spam', message: `刷屏行为: ${l.company_name} - ${l.count}次重复消息` })),
      ...logs
    ]
  } catch (e) {
    console.error(e)
    allLogs.value = [
      ...aiDetectLogs.value.map(l => ({ ...l, detection_type: 'ai_content', message: `AI内容检测: ${l.resume_name}` })),
      ...duplicateLogs.value.map(l => ({ ...l, detection_type: 'duplicate_project', message: `项目重复: ${l.resume_name}` })),
      ...spamLogs.value.map(l => ({ ...l, detection_type: 'spam', message: `刷屏行为: ${l.company_name}` }))
    ]
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.anticheat-admin h4 {
  margin: 16px 0 12px 0;
  font-size: 14px;
  font-weight: 600;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-card.danger {
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
}

.stat-card.warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card.info {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-content {
  text-align: center;
  color: white;
}

.stat-label {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 6px;
}

.stat-trend {
  font-size: 12px;
  opacity: 0.85;
}

.anticheat-tabs {
  margin-top: 20px;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.companies-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.message-content {
  color: #606266;
  font-size: 13px;
}

.section-title {
  margin-top: 20px !important;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.suspicious-text {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  line-height: 2;
}

.text-segment {
  display: inline-block;
  padding: 2px 4px;
  margin: 0 2px;
  border-radius: 4px;
  position: relative;
}

.text-segment.high-risk {
  background: #fef0f0;
  border-bottom: 2px solid #f56c6c;
}

.text-segment.medium-risk {
  background: #fdf6ec;
  border-bottom: 2px solid #e6a23c;
}

.text-segment .el-tag {
  margin-left: 4px;
}
</style>
