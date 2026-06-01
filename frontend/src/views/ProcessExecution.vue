<template>
  <div class="page-container">
    <div class="page-header">
      <el-button @click="$router.back()">返回</el-button>
      <span class="page-title">工序执行 - {{ order?.order_no }}</span>
      <div>
        <el-tag type="info">{{ userStore.currentUser?.name }}</el-tag>
      </div>
    </div>
    
    <el-card v-if="order">
      <el-descriptions :column="4" border size="small">
        <el-descriptions-item label="工单号">
          <span style="font-weight: 600;">{{ order.order_no }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="产品">{{ order.product_name }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ order.quantity }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(order.status)" size="large">{{ statusText(order.status) }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      
      <el-divider content-position="left">工序流程</el-divider>
      
      <el-steps :active="currentProcessIndex" finish-status="success" align-center style="margin-bottom: 24px;">
        <el-step v-for="(p, index) in order.processes" :key="p.id" :title="p.process_name" :status="getProcessStatus(p.status)">
          <template #icon>
            <el-icon v-if="p.status === 'completed'" color="#67C23A"><CircleCheck /></el-icon>
            <el-icon v-else-if="p.status === 'in_progress'" color="#E6A23C"><Loading /></el-icon>
            <el-icon v-else><Clock /></el-icon>
          </template>
        </el-step>
      </el-steps>
      
      <div v-if="currentProcess">
        <div class="process-header">
          <div>
            <h3>
              <el-icon size="24"><Setting /></el-icon>
              {{ currentProcess.process_name }}
            </h3>
            <div class="process-meta">
              <el-tag type="warning">设备: {{ currentProcess.equipment || '未指定' }}</el-tag>
              <el-tag type="info">岗位: {{ currentProcess.position || '未指定' }}</el-tag>
              <el-tag v-if="sop" type="success">
                <el-icon><Document /></el-icon>
                SOP版本: {{ sop.version }} - {{ sop.title }}
              </el-tag>
              <el-tag v-else type="danger">
                <el-icon><Warning /></el-icon>
                无可用SOP
              </el-tag>
            </div>
          </div>
          <div>
            <el-button v-if="currentProcess.status === 'pending'" type="primary" size="large" @click="startProcess">
              <el-icon><VideoPlay /></el-icon>开始工序
            </el-button>
            <el-button v-if="currentProcess.status === 'in_progress'" type="success" size="large" @click="completeProcess" :disabled="!canComplete">
              <el-icon><CircleCheck /></el-icon>完成工序
            </el-button>
          </div>
        </div>
        
        <div v-if="currentProcess.status === 'in_progress' && sop">
          <el-alert v-if="!canComplete" type="warning" style="margin-bottom: 16px;">
            <template #title>还有关键步骤未完成确认，请先完成所有关键步骤的执行确认</template>
          </el-alert>
          
          <el-divider content-position="left">
            <span style="font-size: 16px; font-weight: 600;">作业指导书 (SOP)</span>
          </el-divider>
          
          <div v-for="(step, index) in sop.steps" :key="step.id" class="execution-step-card" :class="{ 
            completed: isStepCompleted(step.id), 
            mandatory: step.is_mandatory,
            'current-step': currentStepIndex === index && !isStepCompleted(step.id)
          }">
            <div class="step-indicator">
              <div class="step-badge" :class="{ completed: isStepCompleted(step.id) }">
                <el-icon v-if="isStepCompleted(step.id)" size="20"><Check /></el-icon>
                <span v-else>{{ index + 1 }}</span>
              </div>
            </div>
            
            <div class="step-main">
              <div class="step-title-bar">
                <h4>{{ step.title }}</h4>
                <el-tag v-if="step.is_mandatory" type="danger" effect="dark">
                  <el-icon><Lock /></el-icon>关键步骤（强制确认）
                </el-tag>
                <el-tag v-if="isStepCompleted(step.id)" type="success" size="small">已执行</el-tag>
              </div>
              
              <div class="step-desc">
                <el-icon><DocumentCopy /></el-icon>
                <span>{{ step.description }}</span>
              </div>
              
              <el-row :gutter="20" v-if="step.image_url || step.video_url" style="margin: 16px 0;">
                <el-col :span="step.video_url ? 12 : 24" v-if="step.image_url">
                  <div class="media-card">
                    <div class="media-title">
                      <el-icon><Picture /></el-icon>参考图片
                    </div>
                    <div class="image-wrapper" @click="showImagePreview(step.image_url)">
                      <img :src="step.image_url" class="step-image" @error="handleImageError($event)" />
                      <div class="image-tip">
                        <el-icon><ZoomIn /></el-icon>点击放大查看
                      </div>
                    </div>
                  </div>
                </el-col>
                <el-col :span="step.image_url ? 12 : 24" v-if="step.video_url">
                  <div class="media-card">
                    <div class="media-title">
                      <el-icon><VideoPlay /></el-icon>操作视频
                    </div>
                    <video :src="step.video_url" controls class="step-video" />
                  </div>
                </el-col>
              </el-row>
              
              <el-row :gutter="20" v-if="step.attention || step.quality_standard" style="margin: 16px 0;">
                <el-col :span="step.quality_standard ? 12 : 24" v-if="step.attention">
                  <el-alert type="warning" show-icon>
                    <template #title>
                      <strong><el-icon><Warning /></el-icon> 安全注意事项</strong>
                    </template>
                    <p style="margin: 8px 0 0 0; white-space: pre-line;">{{ step.attention }}</p>
                  </el-alert>
                </el-col>
                <el-col :span="step.attention ? 12 : 24" v-if="step.quality_standard">
                  <el-alert type="success" show-icon>
                    <template #title>
                      <strong><el-icon><CircleCheck /></el-icon> 质量标准</strong>
                    </template>
                    <p style="margin: 8px 0 0 0; white-space: pre-line;">{{ step.quality_standard }}</p>
                  </el-alert>
                </el-col>
              </el-row>
              
              <el-row :gutter="20" v-if="step.key_params" style="margin: 16px 0;">
                <el-col :span="24">
                  <div class="params-card">
                    <div class="params-title">
                      <el-icon><DataLine /></el-icon>需要记录的关键参数
                    </div>
                    <el-tag v-for="param in parseParams(step.key_params)" :key="param" type="info" style="margin: 4px;">
                      {{ param }}
                    </el-tag>
                  </div>
                </el-col>
              </el-row>
              
              <div class="step-action" v-if="!isStepCompleted(step.id)">
                <el-button type="primary" size="large" @click="showConfirmDialog(step, index)">
                  <el-icon><SuccessFilled /></el-icon>确认执行此步骤
                </el-button>
              </div>
              
              <div class="step-action completed" v-else>
                <el-tag type="success" size="large">
                  <el-icon><CircleCheck /></el-icon>
                  此步骤已完成执行确认
                </el-tag>
              </div>
            </div>
          </div>
        </div>
        
        <el-alert v-else-if="currentProcess.status === 'in_progress' && !sop" type="error" style="margin: 20px 0;">
          <template #title>未找到此工序的有效作业指导书（SOP）</template>
          请联系工艺工程师创建并发布对应工序的SOP版本
        </el-alert>
      </div>
      
      <el-divider content-position="left" style="margin-top: 30px;">
        <span style="font-size: 16px; font-weight: 600;">执行记录</span>
      </el-divider>
      
      <el-table :data="executionRecords" border>
        <el-table-column prop="step_order" label="步骤" width="80" align="center" />
        <el-table-column prop="step_title" label="步骤名称" />
        <el-table-column prop="operator_name" label="操作员" width="100" />
        <el-table-column prop="executed_at" label="执行时间" width="180">
          <template #default="{ row }">{{ formatDate(row.executed_at) }}</template>
        </el-table-column>
        <el-table-column prop="key_params_value" label="参数记录" />
        <el-table-column prop="exception_note" label="异常备注" />
        <el-table-column label="跳步" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.is_skipped" type="danger" size="small">是</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="skip_reason" label="跳步原因" width="150" />
      </el-table>
    </el-card>
    
    <el-dialog v-model="confirmDialogVisible" :title="'执行确认: ' + currentStep?.title" width="600px" :close-on-click-modal="false">
      <el-alert v-if="currentStep?.is_mandatory" type="warning" style="margin-bottom: 16px;">
        <template #title>此为关键步骤，必须执行确认，不可跳步</template>
      </el-alert>
      
      <el-form :model="confirmForm" label-width="100px">
        <el-form-item v-if="currentStep?.key_params" label="关键参数" required>
          <el-input 
            v-model="confirmForm.key_params_value" 
            type="textarea" 
            :rows="3" 
            :placeholder="'请输入关键参数: ' + currentStep?.key_params"
          />
        </el-form-item>
        <el-form-item label="异常备注">
          <el-input v-model="confirmForm.exception_note" type="textarea" :rows="2" placeholder="如有异常情况请在此备注" />
        </el-form-item>
        <el-form-item v-if="!currentStep?.is_mandatory">
          <el-checkbox v-model="confirmForm.is_skipped" style="color: #F56C6C;">
            <el-icon><Warning /></el-icon>跳步执行（不推荐）
          </el-checkbox>
        </el-form-item>
        <el-form-item v-if="confirmForm.is_skipped && !currentStep?.is_mandatory" label="跳步原因" required>
          <el-input v-model="confirmForm.skip_reason" type="textarea" :rows="2" placeholder="请说明跳步原因" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="primary" size="large" @click="confirmStep">
          <el-icon><Check /></el-icon>确认执行
        </el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="imagePreviewVisible" title="图片预览" width="80%">
      <img :src="previewImageUrl" style="width: 100%;" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '../stores/user';

const route = useRoute();
const userStore = useUserStore();

const order = ref(null);
const sop = ref(null);
const executionRecords = ref([]);
const confirmDialogVisible = ref(false);
const imagePreviewVisible = ref(false);
const previewImageUrl = ref('');
const currentStep = ref(null);
const currentStepIndex = ref(-1);
const confirmForm = ref({
  key_params_value: '',
  exception_note: '',
  is_skipped: false,
  skip_reason: ''
});

const statusType = (status) => {
  const types = { pending: 'info', in_progress: 'warning', completed: 'success' };
  return types[status] || 'info';
};

const statusText = (status) => {
  const texts = { pending: '待执行', in_progress: '执行中', completed: '已完成' };
  return texts[status] || status;
};

const formatDate = (date) => new Date(date).toLocaleString();

const getProcessStatus = (status) => {
  if (status === 'completed') return 'success';
  if (status === 'in_progress') return 'process';
  return 'wait';
};

const parseParams = (paramsStr) => {
  if (!paramsStr) return [];
  return paramsStr.split(/[,，、]/).map(p => p.trim()).filter(p => p);
};

const currentProcessIndex = computed(() => {
  if (!order.value?.processes) return 0;
  return order.value.processes.findIndex(p => p.status !== 'completed');
});

const currentProcess = computed(() => {
  if (!order.value?.processes) return null;
  return order.value.processes[currentProcessIndex.value] || order.value.processes[order.value.processes.length - 1];
});

const canComplete = computed(() => {
  if (!sop.value?.steps) return true;
  const mandatorySteps = sop.value.steps.filter(s => s.is_mandatory);
  return mandatorySteps.every(s => isStepCompleted(s.id));
});

const isStepCompleted = (stepId) => {
  return executionRecords.value.some(r => r.sop_step_id === stepId);
};

const showImagePreview = (url) => {
  previewImageUrl.value = url;
  imagePreviewVisible.value = true;
};

const handleImageError = (e) => {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect fill="%23f5f7fa" width="400" height="250"/><text fill="%23909399" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".3em">图片加载失败</text></svg>';
};

const showConfirmDialog = (step, index) => {
  currentStep.value = step;
  currentStepIndex.value = index;
  confirmForm.value = {
    key_params_value: '',
    exception_note: '',
    is_skipped: false,
    skip_reason: ''
  };
  confirmDialogVisible.value = true;
};

const confirmStep = async () => {
  if (!currentProcess.value) return;
  
  if (confirmForm.value.is_skipped && !confirmForm.value.skip_reason) {
    ElMessage.warning('请填写跳步原因');
    return;
  }
  
  if (currentStep.value?.key_params && !confirmForm.value.key_params_value) {
    ElMessage.warning('请填写关键参数');
    return;
  }
  
  try {
    await api.post(`/work-orders/${currentProcess.value.id}/step-execute`, {
      sop_step_id: currentStep.value.id,
      operator_id: userStore.currentUser.id,
      ...confirmForm.value
    });
    ElMessage.success('执行确认已记录');
    confirmDialogVisible.value = false;
    loadExecutionRecords();
  } catch (e) {
    console.error(e);
  }
};

const startProcess = async () => {
  try {
    await ElMessageBox.confirm('确定开始此工序吗？开始后将自动加载最新版SOP', '提示', { type: 'warning' });
    await api.post(`/work-orders/${route.params.orderId}/start`, {
      process_id: currentProcess.value.process_id,
      operator_id: userStore.currentUser.id
    });
    ElMessage.success('工序已开始');
    loadOrder();
  } catch (e) {
    if (e !== 'cancel') console.error(e);
  }
};

const completeProcess = async () => {
  try {
    await ElMessageBox.confirm('确定完成此工序吗？完成后将进入下一工序', '提示', { type: 'warning' });
    const nextIndex = currentProcessIndex.value + 1;
    const nextProcess = order.value.processes[nextIndex];
    
    await api.post(`/work-orders/${route.params.orderId}/complete`, {
      process_id: currentProcess.value.process_id,
      next_process_id: nextProcess?.process_id || null
    });
    ElMessage.success('工序已完成');
    loadOrder();
  } catch (e) {
    if (e !== 'cancel') console.error(e);
  }
};

const loadSOP = async () => {
  if (!order.value || !currentProcess.value) return;
  
  try {
    const res = await api.get('/sops/active', {
      params: {
        product_id: order.value.product_id,
        process_id: currentProcess.value.process_id
      }
    });
    sop.value = res.data;
  } catch (e) {
    sop.value = null;
  }
};

const loadExecutionRecords = async () => {
  if (!currentProcess.value) return;
  
  try {
    const res = await api.get(`/work-orders/${currentProcess.value.id}/execution-records`);
    executionRecords.value = res.data;
  } catch (e) {
    executionRecords.value = [];
  }
};

const loadOrder = async () => {
  try {
    const res = await api.get(`/work-orders/${route.params.orderId}`);
    order.value = res.data;
    await loadSOP();
    await loadExecutionRecords();
  } catch (e) {
    console.error(e);
  }
};

onMounted(loadOrder);
</script>

<style scoped>
.process-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-radius: 12px;
  margin-bottom: 20px;
}

.process-header h3 {
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
}

.process-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.execution-step-card {
  display: flex;
  gap: 20px;
  padding: 24px;
  margin-bottom: 20px;
  background: #fff;
  border: 2px solid #EBEEF5;
  border-radius: 12px;
  transition: all 0.3s;
}

.execution-step-card.current-step {
  border-color: #409EFF;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.execution-step-card.completed {
  border-color: #67C23A;
  background: rgba(103, 194, 58, 0.05);
}

.execution-step-card.mandatory:not(.completed) {
  border-left: 4px solid #F56C6C;
}

.step-indicator {
  flex-shrink: 0;
}

.step-badge {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #409EFF;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}

.step-badge.completed {
  background: #67C23A;
}

.execution-step-card.mandatory:not(.completed) .step-badge {
  background: #F56C6C;
}

.step-main {
  flex: 1;
}

.step-title-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.step-title-bar h4 {
  margin: 0;
  font-size: 18px;
}

.step-desc {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: #F5F7FA;
  border-radius: 8px;
  margin-bottom: 8px;
  color: #303133;
  line-height: 1.6;
}

.media-card {
  background: #FAFAFA;
  border-radius: 8px;
  padding: 16px;
}

.media-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #606266;
}

.image-wrapper {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
}

.step-image {
  width: 100%;
  max-height: 280px;
  object-fit: contain;
  background: #fff;
  display: block;
}

.image-tip {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
}

.step-video {
  width: 100%;
  max-height: 280px;
  border-radius: 8px;
  background: #000;
}

.params-card {
  padding: 16px;
  background: #ECF5FF;
  border-radius: 8px;
}

.params-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #409EFF;
}

.step-action {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed #DCDFE6;
  display: flex;
  justify-content: center;
}

.step-action.completed {
  border: none;
  padding-top: 0;
}
</style>
