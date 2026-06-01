<template>
  <div class="certificates">
    <el-row :gutter="20">
      <el-col :span="8" v-for="cert in certificates" :key="cert.id">
        <el-card class="cert-card" shadow="hover">
          <div class="cert-header">
            <el-icon size="48" color="#67c23a"><Medal /></el-icon>
          </div>
          <div class="cert-body">
            <h3 class="cert-title">{{ cert.course_title }}</h3>
            <p class="cert-no">证书编号：{{ cert.certificate_no }}</p>
            <p class="cert-date">颁发日期：{{ formatDate(cert.issued_at) }}</p>
          </div>
          <div class="cert-footer">
            <el-tag type="success" size="small">已通过</el-tag>
            <el-button type="primary" link size="small">查看详情</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="certificates.length === 0" description="暂无证书" style="margin-top: 60px;" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElIcon } from 'element-plus'
import { Medal } from '@element-plus/icons-vue'
import api from '@/utils/api'

const certificates = ref([])

async function loadCertificates() {
  certificates.value = await api.get('/admin/certificates')
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('zh-CN')
}

onMounted(loadCertificates)
</script>

<style scoped>
.cert-card {
  text-align: center;
  transition: all 0.3s;
}

.cert-card:hover {
  transform: translateY(-4px);
}

.cert-header {
  padding: 30px 0 20px;
}

.cert-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #303133;
}

.cert-no, .cert-date {
  font-size: 13px;
  color: #909399;
  margin: 6px 0;
}

.cert-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  margin-top: 16px;
}
</style>
