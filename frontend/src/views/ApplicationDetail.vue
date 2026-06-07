<template>
  <div class="app-detail-page">
    <el-page-header @back="$router.back()" content="办件详情" style="margin-bottom: 20px;" />
    
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card v-loading="loading">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
              <el-tag :type="getStatusType(application?.status)" size="large">{{ getStatusText(application?.status) }}</el-tag>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="办件编号">{{ application?.application_no }}</el-descriptions-item>
            <el-descriptions-item label="事项名称">{{ application?.item_name }}</el-descriptions-item>
            <el-descriptions-item label="办理部门">{{ application?.department }}</el-descriptions-item>
            <el-descriptions-item label="承诺时限">{{ application?.processing_time }} 个工作日</el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ application?.submit_time }}</el-descriptions-item>
            <el-descriptions-item label="受理时间">{{ application?.accept_time || '待受理' }}</el-descriptions-item>
            <el-descriptions-item label="办结时间">{{ application?.complete_time || '办理中' }}</el-descriptions-item>
            <el-descriptions-item label="实际用时">{{ application?.processing_days ? application.processing_days + ' 个工作日' : '计算中' }}</el-descriptions-item>
            <el-descriptions-item label="当前节点">{{ application?.current_node }}</el-descriptions-item>
            <el-descriptions-item label="催办状态">
              <el-tag v-if="application?.reminder_sent" type="danger" size="small">已催办</el-tag>
              <el-tag v-else type="info" size="small">未催办</el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <el-alert v-if="supplementDeadline" :closable="false" type="warning" style="margin-top: 16px;" show-icon>
            <template #title>
              <span style="font-weight: 600;">补正材料时限: {{ supplementDeadline }}</span>
              <span v-if="supplementCountdown" style="margin-left: 12px; color: #dc2626;">剩余 {{ supplementCountdown }}</span>
            </template>
          </el-alert>

          <div v-if="parallelNodes.length" style="margin-top: 16px;">
            <el-alert type="info" :closable="false" show-icon>
              <template #title><span style="font-weight: 600;">并联审批节点</span></template>
              <div style="margin-top: 8px; display: flex; gap: 12px; flex-wrap: wrap;">
                <el-tag v-for="pn in parallelNodes" :key="pn.node" type="warning" size="large">
                  {{ pn.node }} ({{ pn.dept }})
                </el-tag>
              </div>
            </el-alert>
          </div>

          <el-divider content-position="left">办理流程</el-divider>
          
          <el-steps :active="currentStepIndex" finish-status="success" direction="vertical">
            <el-step 
              v-for="(node, idx) in application?.nodes || []" 
              :key="idx"
              :title="node.node_name"
              :description="stepDescription(node)"
              :status="getNodeStatus(node.status)"
            />
          </el-steps>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>材料清单</span>
          </template>
          <div v-if="application?.materials?.length">
            <div v-for="(mat, idx) in application.materials" :key="idx" class="material-item">
              <div>
                <div class="material-name">{{ mat.material_name }}</div>
                <div v-if="mat.ocr_result" class="ocr-result">
                  <el-tag v-for="(val, key) in parseOcrResult(mat.ocr_result)" :key="key" size="small" type="info" style="margin: 2px;">{{ key }}: {{ val }}</el-tag>
                </div>
              </div>
              <div>
                <el-tag :type="mat.review_status === 'passed' ? 'success' : 'warning'" size="small">
                  {{ mat.review_status === 'passed' ? '已通过' : '待审核' }}
                </el-tag>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无材料" :image-size="80" />
        </el-card>

        <el-card style="margin-top: 20px;" v-if="application?.status === 'completed' && !application?.rating">
          <template #header>
            <span>服务评价</span>
          </template>
          <el-form :model="evaluateForm" label-width="80px">
            <el-form-item label="评分">
              <el-rate v-model="evaluateForm.rating" show-score text-color="#ff9900" />
            </el-form-item>
            <el-form-item label="评价">
              <el-input v-model="evaluateForm.comment" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitEvaluate" :loading="submitting">提交评价</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import api from '@/utils/api';

const route = useRoute();
const loading = ref(false);
const submitting = ref(false);
const application = ref<any>(null);

const evaluateForm = reactive({ rating: 5, comment: '' });

const currentStepIndex = computed(() => {
  if (!application.value?.nodes) return 0;
  const idx = application.value.nodes.findIndex((n: any) => n.status !== 'completed');
  return idx === -1 ? application.value.nodes.length : idx;
});

const parallelNodes = computed(() => {
  if (!application.value?.parallel_nodes) return [];
  try {
    const parsed = typeof application.value.parallel_nodes === 'string' ? JSON.parse(application.value.parallel_nodes) : application.value.parallel_nodes;
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
});

const supplementDeadline = computed(() => {
  const dl = application.value?.supplement_deadline;
  if (!dl || dl === 'NULL') return null;
  return dl;
});

const supplementCountdown = computed(() => {
  if (!supplementDeadline.value) return null;
  try {
    const deadline = new Date(supplementDeadline.value as string);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    if (diff <= 0) return '已超期';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}天${hours}小时`;
  } catch { return null; }
});

const getStatusType = (status: string) => {
  const map: Record<string, string> = { pending: 'warning', processing: 'primary', completed: 'success', rejected: 'danger' };
  return map[status] || 'info';
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = { pending: '待受理', processing: '办理中', completed: '已办结', rejected: '已驳回' };
  return map[status] || status;
};

const getNodeStatus = (status: string) => {
  return status === 'completed' ? 'success' : status === 'processing' ? 'process' : 'wait';
};

const stepDescription = (node: any) => {
  let desc = node.department || '';
  if (node.handler) desc += ` - ${node.handler}`;
  if (node.status === 'completed') desc += ' (已完成)';
  else if (node.status === 'processing') desc += ' (进行中)';
  if (node.comment) desc += ` | ${node.comment}`;
  return desc;
};

const parseOcrResult = (result: any) => {
  if (!result) return {};
  try {
    return typeof result === 'string' ? JSON.parse(result) : result;
  } catch { return {}; }
};

const loadApplication = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/applications/${route.params.id}`);
    if (res.code === 200) {
      application.value = res.data;
    }
  } finally {
    loading.value = false;
  }
};

const submitEvaluate = async () => {
  submitting.value = true;
  try {
    const res = await api.post(`/applications/${route.params.id}/evaluate`, evaluateForm);
    if (res.code === 200) {
      ElMessage.success('评价提交成功');
      application.value.rating = evaluateForm.rating;
    }
  } finally {
    submitting.value = false;
  }
};

onMounted(() => { loadApplication(); });
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.material-item { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
.material-item:last-child { border-bottom: none; }
.material-name { font-size: 14px; font-weight: 500; }
.ocr-result { margin-top: 4px; }
</style>
