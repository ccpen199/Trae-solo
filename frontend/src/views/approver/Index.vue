<template>
  <div class="approver-index">
    <el-card>
      <template #header>
        <h2>审批端</h2>
      </template>

      <div class="action-buttons">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card class="action-card" shadow="hover" @click="$router.push('/approver/applications')">
              <el-icon :size="40" color="#409eff"><DocumentChecked /></el-icon>
              <h4>申请审批</h4>
              <p>审核申请材料和提出补正</p>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="action-card" shadow="hover">
              <el-icon :size="40" color="#e6a23c"><Warning /></el-icon>
              <h4>补正管理</h4>
              <p>查看和跟踪补正事项</p>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="action-card" shadow="hover">
              <el-icon :size="40" color="#909399"><Setting /></el-icon>
              <h4>系统管理</h4>
              <p>事项和材料类型配置</p>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { DocumentChecked, Warning, Setting } from '@element-plus/icons-vue'
</script>

<style scoped>
.action-buttons {
  margin-bottom: 20px;
}

.action-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.action-card:hover {
  transform: translateY(-5px);
}

.action-card h4 {
  margin: 15px 0 10px;
  font-size: 16px;
}

.action-card p {
  color: #909399;
  font-size: 13px;
  margin: 0;
}
</style>
