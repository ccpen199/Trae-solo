<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">作业指导书详情</span>
      <div>
        <el-button @click="$router.back()">返回</el-button>
        <el-button v-if="sop?.status === 'draft'" type="primary" @click="$router.push('/sops/' + sop.id + '/edit')">编辑</el-button>
        <el-button v-if="sop?.status === 'draft'" type="success" @click="submitReview">提交审核</el-button>
        <el-button v-if="sop?.status === 'pending_review' && isLeader" type="primary" @click="showApproveDialog">审核通过</el-button>
        <el-button v-if="sop?.status === 'pending_review' && isLeader" type="danger" @click="rejectSOP">驳回</el-button>
      </div>
    </div>
    
    <el-card v-if="sop">
      <template #header>
        <div class="card-header">
          <div>
            <span style="font-size: 18px; font-weight: 600;">{{ sop.title }}</span>
            <el-tag :type="statusType(sop.status)" size="large" style="margin-left: 12px;">{{ statusText(sop.status) }}</el-tag>
            <el-tag type="info" size="large" style="margin-left: 8px;">版本 {{ sop.version }}</el-tag>
          </div>
          <div>
            <el-button link type="primary" @click="printSOP">
              <el-icon><Printer /></el-icon>打印
            </el-button>
          </div>
        </div>
      </template>
      
      <el-descriptions :column="4" border>
        <el-descriptions-item label="产品">
          {{ sop.product_name }}
          <template #label>
            <span style="display: flex; align-items: center; gap: 4px;">
              <el-icon><Box /></el-icon>产品
            </span>
          </template>
        </el-descriptions-item>
        <el-descriptions-item label="工序">
          {{ sop.process_name }}
          <template #label>
            <span style="display: flex; align-items: center; gap: 4px;">
              <el-icon><Setting /></el-icon>工序
            </span>
          </template>
        </el-descriptions-item>
        <el-descriptions-item label="适用设备">
          <el-tag type="warning">{{ sop.equipment }}</el-tag>
          <template #label>
            <span style="display: flex; align-items: center; gap: 4px;">
              <el-icon><Tools /></el-icon>适用设备
            </span>
          </template>
        </el-descriptions-item>
        <el-descriptions-item label="适用岗位">
          <el-tag type="info">{{ sop.position }}</el-tag>
          <template #label>
            <span style="display: flex; align-items: center; gap: 4px;">
              <el-icon><User /></el-icon>适用岗位
            </span>
          </template>
        </el-descriptions-item>
        <el-descriptions-item label="生效日期">
          {{ sop.effective_date || '未设置' }}
          <template #label>
            <span style="display: flex; align-items: center; gap: 4px;">
              <el-icon><Calendar /></el-icon>生效日期
            </span>
          </template>
        </el-descriptions-item>
        <el-descriptions-item label="失效日期">
          {{ sop.expiry_date || '永久有效' }}
          <template #label>
            <span style="display: flex; align-items: center; gap: 4px;">
              <el-icon><Clock /></el-icon>失效日期
            </span>
          </template>
        </el-descriptions-item>
        <el-descriptions-item label="创建人">
          {{ sop.creator_name || '-' }}
          <template #label>
            <span style="display: flex; align-items: center; gap: 4px;">
              <el-icon><UserFilled /></el-icon>创建人
            </span>
          </template>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(sop.created_at) }}
          <template #label>
            <span style="display: flex; align-items: center; gap: 4px;">
              <el-icon><Time /></el-icon>创建时间
            </span>
          </template>
        </el-descriptions-item>
      </el-descriptions>
      
      <el-divider content-position="left">
        <span style="font-size: 16px; font-weight: 600;">作业步骤 ({{ sop.steps?.length || 0 }} 步)</span>
      </el-divider>
      
      <div v-for="(step, index) in sop.steps" :key="step.id" class="step-detail-card" :class="{ mandatory: step.is_mandatory }">
        <div class="step-number">
          <span>{{ index + 1 }}</span>
        </div>
        
        <div class="step-content">
          <div class="step-title-row">
            <h3>{{ step.title }}</h3>
            <el-tag v-if="step.is_mandatory" type="danger" effect="dark">
              <el-icon><WarningFilled /></el-icon>关键步骤（强制确认，不可跳步）
            </el-tag>
          </div>
          
          <div class="step-description">
            <div class="section-label">
              <el-icon><DocumentCopy /></el-icon>操作说明
            </div>
            <p>{{ step.description }}</p>
          </div>
          
          <el-row :gutter="24" v-if="step.image_url || step.video_url">
            <el-col :span="12" v-if="step.image_url">
              <div class="media-section">
                <div class="section-label">
                  <el-icon><Picture /></el-icon>参考图片
                </div>
                <div class="image-container" @click="previewImage(step.image_url)">
                  <img :src="step.image_url" class="step-image" @error="handleImageError" />
                  <div class="image-overlay">
                    <el-icon size="32"><ZoomIn /></el-icon>
                    <span>点击放大</span>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="12" v-if="step.video_url">
              <div class="media-section">
                <div class="section-label">
                  <el-icon><VideoPlay /></el-icon>操作视频
                </div>
                <video :src="step.video_url" controls class="step-video" />
              </div>
            </el-col>
          </el-row>
          
          <el-row :gutter="24" style="margin-top: 16px;">
            <el-col :span="12" v-if="step.attention">
              <el-alert type="warning" show-icon>
                <template #title>
                  <span style="font-weight: 600;">
                    <el-icon><Warning /></el-icon> 注意事项
                  </span>
                </template>
                <p style="margin: 8px 0 0 0; white-space: pre-line;">{{ step.attention }}</p>
              </el-alert>
            </el-col>
            <el-col :span="12" v-if="step.quality_standard">
              <el-alert type="success" show-icon>
                <template #title>
                  <span style="font-weight: 600;">
                    <el-icon><CircleCheck /></el-icon> 质量标准
                  </span>
                </template>
                <p style="margin: 8px 0 0 0; white-space: pre-line;">{{ step.quality_standard }}</p>
              </el-alert>
            </el-col>
          </el-row>
          
          <el-row :gutter="24" style="margin-top: 16px;">
            <el-col :span="24" v-if="step.key_params">
              <div class="params-section">
                <div class="section-label">
                  <el-icon><DataLine /></el-icon>关键参数记录
                </div>
                <el-tag v-for="param in parseParams(step.key_params)" :key="param" type="info" style="margin: 4px;">
                  {{ param }}
                </el-tag>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
      
      <el-empty v-if="!sop.steps?.length" description="暂无作业步骤" />
    </el-card>
    
    <el-dialog v-model="imagePreviewVisible" title="图片预览" width="90%">
      <img :src="previewImageUrl" style="width: 100%;" />
    </el-dialog>
    
    <el-dialog v-model="approveDialogVisible" title="审核通过" width="500px">
      <el-form :model="approveForm" label-width="100px">
        <el-form-item label="生效日期" required>
          <el-date-picker
            v-model="approveForm.effective_date"
            type="date"
            placeholder="选择生效日期"
            style="width: 100%;"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="失效日期">
          <el-date-picker
            v-model="approveForm.expiry_date"
            type="date"
            placeholder="选择失效日期（可选）"
            style="width: 100%;"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input v-model="approveForm.comment" type="textarea" :rows="3" placeholder="请输入审核意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmApprove">确认通过</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '../stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const sop = ref(null);
const imagePreviewVisible = ref(false);
const previewImageUrl = ref('');
const approveDialogVisible = ref(false);
const approveForm = ref({
  effective_date: new Date().toISOString().split('T')[0],
  expiry_date: '',
  comment: ''
});

const isLeader = computed(() => userStore.currentUser?.role === 'leader');

const statusType = (status) => {
  const types = { draft: 'info', pending_review: 'warning', approved: 'success' };
  return types[status] || 'info';
};

const statusText = (status) => {
  const texts = { draft: '草稿', pending_review: '待审核', approved: '已发布' };
  return texts[status] || status;
};

const formatDate = (date) => new Date(date).toLocaleString();

const parseParams = (paramsStr) => {
  if (!paramsStr) return [];
  return paramsStr.split(/[,，、]/).map(p => p.trim()).filter(p => p);
};

const previewImage = (url) => {
  previewImageUrl.value = url;
  imagePreviewVisible.value = true;
};

const handleImageError = (e) => {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect fill="%23f5f7fa" width="400" height="200"/><text fill="%23909399" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".3em">图片加载失败</text></svg>';
};

const printSOP = () => {
  window.print();
};

const submitReview = async () => {
  try {
    await ElMessageBox.confirm('确定提交审核吗？提交后将进入待审核状态。', '提示', { type: 'warning' });
    await api.post(`/sops/${sop.value.id}/submit`);
    ElMessage.success('已提交审核');
    loadSOP();
  } catch (e) {
    if (e !== 'cancel') console.error(e);
  }
};

const showApproveDialog = () => {
  approveForm.value = {
    effective_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    comment: ''
  };
  approveDialogVisible.value = true;
};

const confirmApprove = async () => {
  if (!approveForm.value.effective_date) {
    ElMessage.warning('请选择生效日期');
    return;
  }
  
  try {
    await api.post(`/sops/${sop.value.id}/approve`, {
      reviewer_id: userStore.currentUser.id,
      effective_date: approveForm.value.effective_date,
      expiry_date: approveForm.value.expiry_date
    });
    ElMessage.success('审核通过，已发布');
    approveDialogVisible.value = false;
    loadSOP();
  } catch (e) {
    console.error(e);
  }
};

const rejectSOP = async () => {
  try {
    const { value: comment } = await ElMessageBox.prompt('请输入驳回原因', '驳回', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请输入驳回原因...'
    });
    
    await api.post(`/sops/${sop.value.id}/reject`);
    ElMessage.success('已驳回');
    loadSOP();
  } catch (e) {
    if (e !== 'cancel') console.error(e);
  }
};

const loadSOP = async () => {
  try {
    const res = await api.get(`/sops/${route.params.id}`);
    sop.value = res.data;
  } catch (e) {
    console.error(e);
  }
};

onMounted(loadSOP);
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-detail-card {
  display: flex;
  gap: 20px;
  padding: 24px;
  margin-bottom: 20px;
  background: #fff;
  border: 1px solid #EBEEF5;
  border-radius: 12px;
  transition: all 0.3s;
}

.step-detail-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.step-detail-card.mandatory {
  border-left: 4px solid #F56C6C;
  background: linear-gradient(to right, rgba(245, 108, 108, 0.05), #fff);
}

.step-number {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #409EFF;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  flex-shrink: 0;
}

.step-detail-card.mandatory .step-number {
  background: #F56C6C;
}

.step-content {
  flex: 1;
}

.step-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.step-title-row h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
}

.step-description {
  margin-bottom: 16px;
  padding: 12px;
  background: #F5F7FA;
  border-radius: 8px;
}

.step-description p {
  margin: 0;
  color: #303133;
  line-height: 1.8;
}

.media-section {
  padding: 12px;
  background: #FAFAFA;
  border-radius: 8px;
}

.image-container {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
}

.step-image {
  width: 100%;
  max-height: 250px;
  object-fit: contain;
  background: #fff;
  display: block;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-container:hover .image-overlay {
  opacity: 1;
}

.step-video {
  width: 100%;
  max-height: 250px;
  border-radius: 8px;
  background: #000;
}

.params-section {
  padding: 12px;
  background: #ECF5FF;
  border-radius: 8px;
}
</style>
