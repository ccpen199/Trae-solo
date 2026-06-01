<template>
  <div class="resume-upload">
    <el-row :gutter="20">
      <el-col :span="10">
        <el-card>
          <template #header>
            <h2>简历智能解析</h2>
          </template>
          <el-upload
            class="upload-area"
            drag
            :auto-upload="false"
            :show-file-list="false"
            accept=".pdf,.png,.jpg,.jpeg,.txt"
            :on-change="handleFileChange"
            :disabled="loading"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 PDF、PNG、JPG、TXT 格式，单个文件不超过 10MB
              </div>
            </template>
          </el-upload>

          <div v-if="selectedFile" class="file-info">
            <el-alert
              v-if="loading"
              type="info"
              :closable="false"
              class="loading-alert"
            >
              <template #title>
                <el-icon class="is-loading"><Loading /></el-icon>
                正在解析简历，请稍候...
              </template>
            </el-alert>
            <p>
              <el-icon><Document /></el-icon>
              已选择: {{ selectedFile.name }}
            </p>
            <el-button
              type="primary"
              @click="uploadResume"
              :disabled="loading"
              class="upload-btn"
            >
              开始解析
            </el-button>
          </div>
        </el-card>

        <el-card class="features-card">
          <template #header>
            <span>解析能力说明</span>
          </template>
          <ul>
            <li>
              <el-icon color="#67C23A"><CircleCheck /></el-icon>
              <span>PDF/图片OCR识别</span>
            </li>
            <li>
              <el-icon color="#67C23A"><CircleCheck /></el-icon>
              <span>提取技术栈和软技能</span>
            </li>
            <li>
              <el-icon color="#67C23A"><CircleCheck /></el-icon>
              <span>项目经验智能识别</span>
            </li>
            <li>
              <el-icon color="#67C23A"><CircleCheck /></el-icon>
              <span>竞争力雷达图</span>
            </li>
            <li>
              <el-icon color="#67C23A"><CircleCheck /></el-icon>
              <span>AI生成内容检测</span>
            </li>
            <li>
              <el-icon color="#67C23A"><CircleCheck /></el-icon>
              <span>简历注水识别</span>
            </li>
          </ul>
        </el-card>
      </el-col>

      <el-col :span="14">
        <div v-if="result" class="result-container">
          <el-card class="result-card">
            <template #header>
              <div class="result-header">
                <h3>
                  <el-icon><User /></el-icon>
                  解析结果
                </h3>
                <el-tag v-if="result.is_valid" type="success">简历有效</el-tag>
                <el-tag v-else type="danger">存在风险</el-tag>
              </div>
            </template>

            <el-descriptions :column="2" border>
              <el-descriptions-item label="姓名">
                {{ result.parsed_data?.name || '未知' }}
              </el-descriptions-item>
              <el-descriptions-item label="工作年限">
                {{ result.parsed_data?.years_of_experience || 0 }} 年
              </el-descriptions-item>
              <el-descriptions-item label="电话">
                {{ result.parsed_data?.phone || '未知' }}
              </el-descriptions-item>
              <el-descriptions-item label="邮箱">
                {{ result.parsed_data?.email || '未知' }}
              </el-descriptions-item>
              <el-descriptions-item label="教育背景">
                <div v-for="edu in result.parsed_data?.education || []" :key="edu">
                  {{ edu }}
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="AI生成风险">
                <el-progress
                  :percentage="Math.round(result.ai_generated_score * 100)"
                  :color="result.ai_generated_score > 0.7 ? '#f56c6c' : result.ai_generated_score > 0.4 ? '#e6a23c' : '#67c23a'"
                />
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-card>
                <template #header>
                  <h4>
                    <el-icon><TrendCharts /></el-icon>
                    竞争力雷达图
                  </h4>
                </template>
                <v-chart class="radar-chart" :option="radarOption" autoresize />
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <template #header>
                  <h4>
                    <el-icon><Collection /></el-icon>
                    技术栈 ({{ result.skills?.length || 0 }})
                  </h4>
                </template>
                <div class="skills-list">
                  <el-tag
                    v-for="skill in result.skills"
                    :key="skill"
                    class="skill-tag"
                    size="large"
                  >
                    {{ skill }}
                  </el-tag>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <el-card>
            <template #header>
              <h4>
                <el-icon><SetUp /></el-icon>
                项目经验 ({{ result.projects?.length || 0 }})
              </h4>
            </template>
            <el-timeline>
              <el-timeline-item
                v-for="(project, index) in result.projects"
                :key="index"
                :timestamp="project.duration"
                placement="top"
              >
                <el-card shadow="hover" class="project-card">
                  <div class="project-header">
                    <h5>{{ project.name }}</h5>
                    <el-tag size="small">{{ project.role }}</el-tag>
                  </div>
                  <p class="project-desc">{{ project.description }}</p>
                  <div class="project-tech">
                    <el-tag
                      v-for="tech in project.tech_stack"
                      :key="tech"
                      size="small"
                      type="info"
                    >
                      {{ tech }}
                    </el-tag>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-card>

          <el-card v-if="result.anticheat_flags?.length > 0">
            <template #header>
              <h4>
                <el-icon color="#f56c6c"><Warning /></el-icon>
                反作弊检测结果
              </h4>
            </template>
            <el-alert
              v-for="(flag, index) in result.anticheat_flags"
              :key="index"
              :type="flag.severity === 'high' ? 'error' : flag.severity === 'medium' ? 'warning' : 'info'"
              :title="flag.message"
              :closable="false"
              class="anticheat-alert"
            />
          </el-card>
        </div>

        <el-card v-else class="empty-state">
          <el-empty description="上传简历后将显示解析结果">
            <el-button type="primary" @click="$router.push('/resume/list')">查看历史简历</el-button>
          </el-empty>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { parseResume } from '../../api'

const selectedFile = ref(null)
const loading = ref(false)
const result = ref(null)

const radarOption = computed(() => {
  if (!result.value?.radar_data?.dimensions) return {}
  const dims = result.value.radar_data.dimensions
  return {
    tooltip: {},
    radar: {
      indicator: dims.map(d => ({ name: d.name, max: 100 }))
    },
    series: [{
      type: 'radar',
      data: [{
        value: dims.map(d => d.score),
        name: '竞争力',
        areaStyle: {
          color: 'rgba(102, 126, 234, 0.3)'
        },
        lineStyle: { color: '#667eea' },
        itemStyle: { color: '#667eea' }
      }]
    }]
  }
})

const handleFileChange = (file) => {
  selectedFile.value = file.raw
  result.value = null
}

const uploadResume = async () => {
  if (!selectedFile.value) return

  loading.value = true
  try {
    const data = await parseResume(selectedFile.value)
    result.value = data
    ElMessage.success('简历解析完成！')
  } catch (e) {
    ElMessage.error('解析失败，请重试')
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.resume-upload h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.upload-area {
  margin-bottom: 20px;
}

.upload-area :deep(.el-upload-dragger) {
  padding: 40px 20px;
}

.file-info {
  margin-top: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.file-info p {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #606266;
}

.upload-btn {
  width: 100%;
}

.loading-alert {
  margin-bottom: 12px;
}

.features-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.features-card li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.features-card li:last-child {
  border-bottom: none;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-card {
  margin-bottom: 20px;
}

.radar-chart {
  height: 300px;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-tag {
  margin-bottom: 8px;
}

.project-card {
  margin-bottom: 16px;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.project-header h5 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.project-desc {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
}

.project-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.anticheat-alert {
  margin-bottom: 10px;
}

.empty-state {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
