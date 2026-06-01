<template>
  <div class="course-list">
    <div class="filter-bar">
      <el-radio-group v-model="filterType" @change="loadCourses">
        <el-radio-button value="all">全部课程</el-radio-button>
        <el-radio-button value="required">必修课程</el-radio-button>
        <el-radio-button value="elective">选修课程</el-radio-button>
      </el-radio-group>
      <el-input v-model="searchKeyword" placeholder="搜索课程" style="width: 240px" clearable @input="loadCourses">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
    </div>
    
    <el-row :gutter="20">
      <el-col :span="8" v-for="course in courses" :key="course.id">
        <el-card class="course-card" shadow="hover">
          <div class="course-cover">
            <el-icon><VideoPlay /></el-icon>
            <el-tag v-if="course.is_required" type="danger" size="small" class="tag-required">必修</el-tag>
          </div>
          <div class="course-info">
            <h3 class="course-title">{{ course.title }}</h3>
            <p class="course-desc">{{ course.description || '暂无描述' }}</p>
            <div class="course-meta">
              <span><el-icon><User /></el-icon> {{ course.instructor_name }}</span>
              <span><el-icon><Clock /></el-icon> {{ course.duration }}分钟</span>
              <span><el-icon><Star /></el-icon> {{ course.credits }}学分</span>
            </div>
            <div class="course-footer">
              <span class="live-time">{{ formatDate(course.live_time) }}</span>
              <el-button type="primary" size="small" @click="$router.push(`/courses/${course.id}`)">查看详情</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElIcon } from 'element-plus'
import { Search, VideoPlay, User, Clock, Star } from '@element-plus/icons-vue'
import api from '@/utils/api'

const courses = ref([])
const filterType = ref('all')
const searchKeyword = ref('')

async function loadCourses() {
  let data = await api.get('/courses')
  
  if (filterType.value === 'required') {
    data = data.filter(c => c.is_required)
  } else if (filterType.value === 'elective') {
    data = data.filter(c => !c.is_required)
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    data = data.filter(c => 
      c.title.toLowerCase().includes(keyword) ||
      c.description?.toLowerCase().includes(keyword)
    )
  }
  
  courses.value = data
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('zh-CN')
}

onMounted(loadCourses)
</script>

<style scoped>
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.course-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.course-card:hover {
  transform: translateY(-4px);
}

.course-cover {
  height: 160px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 4px 4px 0 0;
  margin: -20px -20px 20px;
}

.course-cover .el-icon {
  font-size: 64px;
  color: #fff;
  opacity: 0.8;
}

.tag-required {
  position: absolute;
  top: 12px;
  right: 12px;
}

.course-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-desc {
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
  height: 36px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.course-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #606266;
  margin-bottom: 12px;
}

.course-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.live-time {
  font-size: 12px;
  color: #909399;
}
</style>
