<template>
  <div class="resume-list">
    <el-card>
      <template #header>
        <div class="header">
          <h2>简历管理</h2>
          <el-button type="primary" @click="$router.push('/resume')">
            <el-icon><Plus /></el-icon>
            上传新简历
          </el-button>
        </div>
      </template>

      <div v-for="resume in resumes" :key="resume.id" class="resume-row">
        <el-card shadow="hover" class="resume-card" @click="$router.push(`/resume/${resume.id}`)">
          <el-row :gutter="20" align="middle">
            <el-col :span="4">
              <div class="resume-name">
                <el-avatar :size="48" :style="{ background: getColor(resume.id) }">
                  {{ (resume.parsed_data?.name || '?').charAt(0) }}
                </el-avatar>
                <div class="name-info">
                  <h4>{{ resume.parsed_data?.name || resume.file_name }}</h4>
                  <span class="exp-text">{{ resume.parsed_data?.years_of_experience || 0 }}年经验</span>
                </div>
              </div>
            </el-col>

            <el-col :span="5">
              <div class="info-block">
                <div class="info-label">技术栈</div>
                <div class="tags-row">
                  <el-tag v-for="skill in (resume.skills || []).slice(0, 4)" :key="skill" size="small">{{ skill }}</el-tag>
                  <span v-if="resume.skills?.length > 4" class="more">+{{ resume.skills.length - 4 }}</span>
                </div>
              </div>
            </el-col>

            <el-col :span="4">
              <div class="info-block">
                <div class="info-label">软技能</div>
                <div class="tags-row" v-if="resume.soft_skills?.length">
                  <el-tag v-for="sk in resume.soft_skills.slice(0, 3)" :key="sk" size="small" type="warning" effect="light">{{ sk }}</el-tag>
                  <span v-if="resume.soft_skills.length > 3" class="more">+{{ resume.soft_skills.length - 3 }}</span>
                </div>
                <span v-else class="empty-text">-</span>
              </div>
            </el-col>

            <el-col :span="5">
              <div class="info-block">
                <div class="info-label">项目经验</div>
                <div v-if="resume.projects?.length" class="projects-mini">
                  <div v-for="proj in resume.projects.slice(0, 2)" :key="proj.name" class="proj-mini-item">
                    <el-icon size="12"><SetUp /></el-icon>
                    {{ proj.name }}
                  </div>
                </div>
                <span v-else class="empty-text">-</span>
              </div>
            </el-col>

            <el-col :span="2">
              <div class="info-block center">
                <div class="info-label">综合评分</div>
                <el-progress
                  type="circle"
                  :percentage="resume.overall_score || 0"
                  :width="44"
                  :color="getScoreColor(resume.overall_score)"
                />
              </div>
            </el-col>

            <el-col :span="2">
              <div class="info-block center">
                <div class="info-label">AI生成风险</div>
                <el-tag
                  :type="resume.ai_generated_score > 0.7 ? 'danger' : resume.ai_generated_score > 0.4 ? 'warning' : 'success'"
                  size="small"
                >
                  {{ Math.round(resume.ai_generated_score * 100) }}%
                </el-tag>
              </div>
            </el-col>

            <el-col :span="2">
              <div class="info-block center">
                <div class="info-label">状态</div>
                <div>
                  <el-tag :type="resume.is_valid ? 'success' : 'danger'" size="small">
                    {{ resume.is_valid ? '有效' : '风险' }}
                  </el-tag>
                  <el-badge v-if="resume.anticheat_flags?.length" :value="resume.anticheat_flags.length" class="flag-badge" type="warning" />
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </div>

      <el-empty v-if="!loading && !resumes.length" description="暂无简历数据" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listResumes } from '../../api'

const resumes = ref([])
const loading = ref(false)

const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a']
const getColor = (id) => colors[(id || 0) % colors.length]

const getScoreColor = (score) => {
  if (score >= 70) return '#67c23a'
  if (score >= 50) return '#e6a23c'
  return '#f56c6c'
}

onMounted(async () => {
  loading.value = true
  try {
    resumes.value = await listResumes(1)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.resume-row {
  margin-bottom: 12px;
}

.resume-card {
  cursor: pointer;
  transition: all 0.2s;
}

.resume-card:hover {
  border-color: #667eea;
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.1);
}

.resume-name {
  display: flex;
  align-items: center;
  gap: 12px;
}

.name-info h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

.exp-text {
  font-size: 12px;
  color: #909399;
}

.info-block {
  min-height: 48px;
}

.info-block.center {
  text-align: center;
}

.info-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.more {
  color: #909399;
  font-size: 12px;
}

.projects-mini {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.proj-mini-item {
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-text {
  color: #c0c4cc;
  font-size: 13px;
}

.flag-badge {
  margin-left: 4px;
}
</style>
