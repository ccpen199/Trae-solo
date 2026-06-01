<template>
  <div class="talent-search">
    <el-card class="search-card">
      <template #header>
        <div class="header">
          <h2>
            <el-icon><Search /></el-icon>
            智能人才寻源
          </h2>
          <el-tag type="info">
            已索引 {{ resumeCount }} 份简历
          </el-tag>
        </div>
      </template>
      <div class="search-area">
        <el-input
          v-model="query"
          placeholder="输入模糊需求，如：懂大模型微调的Python工程师、有高并发经验的后端、带过团队的技术负责人..."
          size="large"
          @keyup.enter="doSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button type="primary" @click="doSearch" :loading="loading">
              <el-icon><MagicStick /></el-icon>
              AI搜索
            </el-button>
          </template>
        </el-input>
        <div class="quick-tags">
          <span class="label">快速搜索：</span>
          <el-tag
            v-for="tag in quickTags"
            :key="tag"
            class="quick-tag"
            @click="query = tag; doSearch()"
            effect="plain"
            :round="true"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>
    </el-card>

    <div v-if="parsedQuery" class="parsed-query-card">
      <el-card shadow="hover">
        <div class="parsed-header">
          <el-icon color="#667eea"><MagicStick /></el-icon>
          <span>AI需求解析结果</span>
        </div>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="岗位方向">
            {{ parsedQuery.position_type || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="资历级别">
            {{ parsedQuery.seniority || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="核心关键词">
            <el-tag v-for="kw in parsedQuery.keywords || []" :key="kw" size="small" type="danger" effect="light">{{ kw }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="扩展技能要求" :span="3">
            <el-tag
              v-for="skill in parsedQuery.required_skills || []"
              :key="skill"
              size="small"
              type="primary"
              effect="light"
            >
              {{ skill }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>

    <div v-if="searchSummary" class="summary-card">
      <el-card shadow="hover">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="summary-stat">
              <div class="summary-value">{{ searchSummary.total_matched || 0 }}</div>
              <div class="summary-label">匹配候选人</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="summary-stat">
              <div class="summary-value text-green">{{ searchSummary.high_match || 0 }}</div>
              <div class="summary-label">高度匹配</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="summary-stat">
              <div class="summary-value text-orange">{{ searchSummary.medium_match || 0 }}</div>
              <div class="summary-label">中度匹配</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="summary-stat">
              <div class="summary-value text-red">{{ searchSummary.low_match || 0 }}</div>
              <div class="summary-label">低度匹配</div>
            </div>
          </el-col>
        </el-row>
        <div v-if="searchSummary.top_skills?.length" class="top-skills-row">
          <span class="top-skills-label">热门技能：</span>
          <el-tag v-for="sk in searchSummary.top_skills" :key="sk" size="small" effect="plain">{{ sk }}</el-tag>
        </div>
      </el-card>
    </div>

    <div v-if="results.length > 0" class="results-area">
      <el-card>
        <template #header>
          <div class="results-header">
            <h3>
              <el-icon><UserFilled /></el-icon>
              候选人列表 ({{ results.length }} 人)
            </h3>
            <el-radio-group v-model="sortBy" size="small">
              <el-radio-button value="match_score">匹配度优先</el-radio-button>
              <el-radio-button value="overall_score">综合评分优先</el-radio-button>
              <el-radio-button value="experience">工作经验优先</el-radio-button>
            </el-radio-group>
          </div>
        </template>

        <div class="candidates-list">
          <el-card
            v-for="candidate in sortedResults"
            :key="candidate.resume_id"
            shadow="hover"
            class="candidate-card"
            :class="{ active: selectedId === candidate.resume_id }"
            @click="selectCandidate(candidate)"
          >
            <div class="candidate-header">
              <el-avatar :size="56" :style="{ background: getAvatarColor(candidate.resume_id) }">
                {{ candidate.candidate_name?.charAt(0) || '?' }}
              </el-avatar>
              <div class="candidate-info">
                <div class="name-row">
                  <h4>{{ candidate.candidate_name }}</h4>
                  <el-tag
                    size="small"
                    :type="candidate.match_score >= 80 ? 'success' : candidate.match_score >= 50 ? 'warning' : 'danger'"
                  >
                    {{ candidate.match_score }}% 匹配
                  </el-tag>
                  <el-tag size="small" effect="light">综合 {{ candidate.overall_score }}</el-tag>
                  <el-tag
                    v-if="candidate.screening_recommendation"
                    size="small"
                    :type="candidate.screening_recommendation === '强烈推荐面试' ? 'success' : candidate.screening_recommendation === '可以考虑' ? 'warning' : 'info'"
                    effect="dark"
                  >
                    {{ candidate.screening_recommendation }}
                  </el-tag>
                </div>
                <p class="position-text">{{ candidate.years_of_experience || 0 }}年经验 · {{ (candidate.education || []).join('、') || '学历未知' }}</p>
                <p class="summary-text">{{ candidate.brief_summary }}</p>
              </div>
            </div>

            <div class="skills-section">
              <div class="skills-group" v-if="candidate.skills_match?.length">
                <span class="skills-label">匹配技能：</span>
                <el-tag v-for="skill in candidate.skills_match" :key="skill" size="small" type="primary" effect="light">{{ skill }}</el-tag>
              </div>
              <div class="skills-group" v-if="candidate.missing_skills?.length">
                <span class="skills-label missing">缺失技能：</span>
                <el-tag v-for="skill in candidate.missing_skills.slice(0, 6)" :key="skill" size="small" type="info" effect="plain">{{ skill }}</el-tag>
                <span v-if="candidate.missing_skills.length > 6" class="more-count">+{{ candidate.missing_skills.length - 6 }}</span>
              </div>
            </div>

            <el-collapse-transition>
              <div v-show="selectedId === candidate.resume_id" class="candidate-detail">
                <el-divider />

                <el-row :gutter="16">
                  <el-col :span="12">
                    <div class="detail-block">
                      <h5><el-icon><CircleCheck /></el-icon> 匹配优势</h5>
                      <ul class="detail-list">
                        <li v-for="(s, idx) in candidate.strengths || []" :key="idx">{{ s }}</li>
                      </ul>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="detail-block">
                      <h5><el-icon><Warning /></el-icon> 不足之处</h5>
                      <ul class="detail-list">
                        <li v-for="(w, idx) in candidate.weaknesses || []" :key="idx">{{ w }}</li>
                      </ul>
                    </div>
                  </el-col>
                </el-row>

                <div class="detail-block" v-if="candidate.highlight_projects?.length">
                  <h5><el-icon><SetUp /></el-icon> 相关项目经验</h5>
                  <el-tag v-for="proj in candidate.highlight_projects" :key="proj" effect="plain" size="large" class="project-tag">{{ proj }}</el-tag>
                </div>

                <el-descriptions :column="2" border size="small" class="detail-desc">
                  <el-descriptions-item label="曾就职公司">
                    {{ (candidate.previous_companies || []).join(' → ') || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="教育背景">
                    {{ (candidate.education || []).join('、') || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="AI生成风险">
                    <el-progress
                      :percentage="Math.round((candidate.ai_generated_score || 0) * 100)"
                      :color="candidate.ai_generated_score > 0.7 ? '#f56c6c' : candidate.ai_generated_score > 0.4 ? '#e6a23c' : '#67c23a'"
                      :stroke-width="14"
                      :format="(p) => p + '%'"
                    />
                  </el-descriptions-item>
                  <el-descriptions-item label="反作弊标记">
                    <el-tag v-if="!candidate.anticheat_flags?.length" type="success" size="small">无异常</el-tag>
                    <el-tag v-for="flag in candidate.anticheat_flags || []" :key="flag" type="warning" size="small">{{ flag }}</el-tag>
                  </el-descriptions-item>
                </el-descriptions>

                <div class="briefing-section" v-if="briefings[candidate.resume_id]">
                  <h5><el-icon><Document /></el-icon> 候选人简报</h5>
                  <el-card shadow="never" class="briefing-card">
                    <div v-html="briefings[candidate.resume_id]"></div>
                  </el-card>
                </div>

                <div class="detail-actions">
                  <el-button size="small" type="primary" @click.stop="$router.push(`/resume/${candidate.resume_id}`)">
                    <el-icon><View /></el-icon>
                    查看完整简历
                  </el-button>
                  <el-button size="small" type="success" @click.stop="generateBriefing(candidate)">
                    <el-icon><Document /></el-icon>
                    {{ briefings[candidate.resume_id] ? '刷新简报' : '生成候选人简报' }}
                  </el-button>
                </div>
              </div>
            </el-collapse-transition>
          </el-card>
        </div>
      </el-card>
    </div>

    <el-empty v-else-if="searchDone && !loading" description="输入搜索需求，AI将智能匹配最佳候选人" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { searchTalent, listResumes } from '../../api'

const query = ref('')
const loading = ref(false)
const searchDone = ref(false)
const results = ref([])
const parsedQuery = ref(null)
const searchSummary = ref(null)
const resumeCount = ref(0)
const selectedId = ref(null)
const sortBy = ref('match_score')
const briefings = reactive({})

const quickTags = [
  '懂大模型微调的Python工程师',
  '有高并发经验的后端工程师',
  '带过团队的技术负责人',
  '熟悉RAG系统的大模型工程师',
  '云原生方向的架构师'
]

const avatarColors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a']
const getAvatarColor = (id) => avatarColors[(id || 0) % avatarColors.length]

const sortedResults = computed(() => {
  return [...results.value].sort((a, b) => {
    if (sortBy.value === 'match_score') return b.match_score - a.match_score
    if (sortBy.value === 'overall_score') return b.overall_score - a.overall_score
    if (sortBy.value === 'experience') return (b.years_of_experience || 0) - (a.years_of_experience || 0)
    return 0
  })
})

const selectCandidate = (candidate) => {
  selectedId.value = selectedId.value === candidate.resume_id ? null : candidate.resume_id
}

const generateBriefing = (candidate) => {
  const skillsMatch = (candidate.skills_match || []).join('、')
  const missingSkills = (candidate.missing_skills || []).slice(0, 5).join('、')
  const projects = (candidate.highlight_projects || []).map(p => `<li>${p}</li>`).join('')
  const strengths = (candidate.strengths || []).map(s => `<li>${s}</li>`).join('')
  const weaknesses = (candidate.weaknesses || []).map(w => `<li>${w}</li>`).join('')

  briefings[candidate.resume_id] = `
    <div class="briefing-content">
      <h4>${candidate.candidate_name} - 候选人简报</h4>
      <p><strong>匹配度：</strong>${candidate.match_score}% | <strong>推荐：</strong>${candidate.screening_recommendation || '待评估'}</p>
      <p><strong>摘要：</strong>${candidate.brief_summary}</p>
      <p><strong>工作年限：</strong>${candidate.years_of_experience || 0}年 | <strong>教育：</strong>${(candidate.education || []).join('、')}</p>
      <p><strong>曾就职：</strong>${(candidate.previous_companies || []).join(' → ')}</p>
      <p><strong>匹配技能：</strong>${skillsMatch || '无'}</p>
      <p><strong>缺失技能：</strong>${missingSkills || '无'}</p>
      <div><strong>优势：</strong><ul>${strengths || '<li>暂无</li>'}</ul></div>
      <div><strong>不足：</strong><ul>${weaknesses || '<li>暂无</li>'}</ul></div>
      <div><strong>相关项目：</strong><ul>${projects || '<li>暂无</li>'}</ul></div>
      <p><strong>AI生成风险：</strong>${Math.round((candidate.ai_generated_score || 0) * 100)}%</p>
    </div>
  `
  ElMessage.success(`候选人简报已生成：${candidate.candidate_name}`)
}

const doSearch = async () => {
  if (!query.value.trim()) {
    ElMessage.warning('请输入搜索需求')
    return
  }
  loading.value = true
  searchDone.value = true
  selectedId.value = null
  Object.keys(briefings).forEach(k => delete briefings[k])
  try {
    const data = await searchTalent({ query: query.value, limit: 10 })
    parsedQuery.value = data.query_parsed
    results.value = data.candidates || []
    searchSummary.value = data.search_summary || null
    if (results.value.length === 0) {
      ElMessage.warning('未找到匹配的候选人，请尝试其他关键词')
    } else {
      ElMessage.success(`找到 ${results.value.length} 位匹配候选人`)
    }
  } catch (e) {
    ElMessage.error('搜索失败，请重试')
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const resumes = await listResumes(1)
    resumeCount.value = Array.isArray(resumes) ? resumes.length : 0
  } catch (e) {
    console.error(e)
  }
})
</script>

<style scoped>
.talent-search h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.talent-search h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-card {
  margin-bottom: 20px;
}

.search-area {
  max-width: 1000px;
  margin: 0 auto;
}

.quick-tags {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.quick-tags .label {
  color: #909399;
  font-size: 13px;
}

.quick-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.quick-tag:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.parsed-query-card {
  margin-bottom: 20px;
}

.parsed-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #667eea;
  font-weight: 600;
  margin-bottom: 16px;
}

.summary-card {
  margin-bottom: 20px;
}

.summary-stat {
  text-align: center;
  padding: 12px 0;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
}

.summary-value.text-green { color: #67c23a; }
.summary-value.text-orange { color: #e6a23c; }
.summary-value.text-red { color: #f56c6c; }

.summary-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.top-skills-row {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.top-skills-label {
  color: #909399;
  font-size: 13px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.candidates-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.candidate-card {
  cursor: pointer;
  transition: all 0.3s;
}

.candidate-card:hover {
  border-color: #667eea;
}

.candidate-card.active {
  border-color: #667eea;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
}

.candidate-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.candidate-info {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.name-row h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.position-text {
  margin: 0 0 6px 0;
  color: #606266;
  font-size: 14px;
}

.summary-text {
  margin: 0;
  color: #909399;
  font-size: 13px;
  line-height: 1.6;
}

.skills-section {
  margin-top: 12px;
}

.skills-group {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.skills-label {
  color: #67c23a;
  font-size: 13px;
  font-weight: 600;
  min-width: 70px;
  line-height: 24px;
}

.skills-label.missing {
  color: #f56c6c;
}

.more-count {
  color: #909399;
  font-size: 12px;
  line-height: 24px;
}

.candidate-detail {
  margin-top: 16px;
}

.detail-block {
  margin-bottom: 16px;
}

.detail-block h5 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  display: flex;
  align-items: center;
  gap: 6px;
}

.detail-list {
  margin: 0;
  padding-left: 18px;
}

.detail-list li {
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
}

.project-tag {
  margin: 0 8px 8px 0;
}

.detail-desc {
  margin-bottom: 16px;
}

.briefing-section {
  margin-bottom: 16px;
}

.briefing-section h5 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  display: flex;
  align-items: center;
  gap: 6px;
}

.briefing-card {
  background: #fafafa;
}

.detail-actions {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>
