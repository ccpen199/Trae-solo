<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">备婚攻略</h2>
      <p class="page-subtitle">专业备婚指南，助您轻松筹备</p>
    </div>

    <el-row :gutter="20">
      <el-col :span="8" v-for="guide in guides" :key="guide.id">
        <el-card class="guide-card card-shadow" @click="viewGuide(guide)">
          <div class="guide-stage">{{ guide.stage }}</div>
          <h3 class="guide-title">{{ guide.title }}</h3>
          <p class="guide-content">{{ guide.content }}</p>
          <div class="guide-footer flex-between">
            <span><el-icon><View /></el-icon> {{ guide.view_count }} 浏览</span>
            <el-link type="primary">查看详情</el-link>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showDetail" :title="currentGuide?.title" width="600px">
      <div class="guide-detail">
        <div class="detail-section">
          <h4>阶段检查点</h4>
          <el-timeline>
            <el-timeline-item v-for="(point, idx) in currentGuide?.check_points" :key="idx" :type="'success'">
              {{ point }}
            </el-timeline-item>
          </el-timeline>
        </div>
        <div class="detail-section" v-if="currentGuide?.risk_tips?.length">
          <h4>风险提示</h4>
          <el-alert
            v-for="(tip, idx) in currentGuide?.risk_tips"
            :key="idx"
            :title="tip"
            type="warning"
            :closable="false"
            style="margin-bottom: 10px;"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

const guides = ref([])
const showDetail = ref(false)
const currentGuide = ref(null)

async function loadGuides() {
  try {
    const res = await api.get('/guides')
    guides.value = res.data
  } catch (e) {
    console.error(e)
  }
}

function viewGuide(guide) {
  currentGuide.value = guide
  showDetail.value = true
}

onMounted(() => {
  loadGuides()
})
</script>

<style scoped lang="scss">
.guide-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
  
  .guide-stage {
    display: inline-block;
    padding: 4px 12px;
    background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
    color: #fff;
    border-radius: 4px;
    font-size: 12px;
    margin-bottom: 12px;
  }
  
  .guide-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
  }
  
  .guide-content {
    font-size: 14px;
    color: #606266;
    margin-bottom: 12px;
    line-height: 1.6;
  }
  
  .guide-footer {
    padding-top: 12px;
    border-top: 1px solid #ebeef5;
    font-size: 12px;
    color: #909399;
    
    .el-icon {
      vertical-align: middle;
      margin-right: 4px;
    }
  }
}

.guide-detail {
  .detail-section {
    margin-bottom: 24px;
    
    h4 {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
    }
  }
}
</style>
