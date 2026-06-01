<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">{{ isEdit ? '编辑' : '新建' }}作业指导书</span>
      <div>
        <el-button @click="$router.back()">取消</el-button>
        <el-button type="primary" @click="save">保存草稿</el-button>
        <el-button type="success" @click="saveAndSubmit">保存并提交审核</el-button>
      </div>
    </div>
    
    <el-card>
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
          <el-tag :type="statusType(form.status)" size="small">{{ statusText(form.status) }}</el-tag>
        </div>
      </template>
      
      <el-form :model="form" label-width="120px">
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="产品" required>
              <el-select v-model="form.product_id" placeholder="选择产品" style="width: 100%;" @change="onProductChange">
                <el-option v-for="p in products" :key="p.id" :label="`${p.code} - ${p.name}`" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="工序" required>
              <el-select v-model="form.process_id" placeholder="选择工序" style="width: 100%;" @change="onProcessChange">
                <el-option v-for="p in processes" :key="p.id" :label="`${p.code} - ${p.name}`" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="版本号" required>
              <el-input v-model="form.version" placeholder="例如：V1.0" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="24">
          <el-col :span="16">
            <el-form-item label="指导书标题" required>
              <el-input v-model="form.title" placeholder="作业指导书标题" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="适用岗位">
              <el-tag v-if="selectedProcess?.position" type="info">{{ selectedProcess?.position }}</el-tag>
              <span v-else style="color: #909399;">请先选择工序</span>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="适用设备">
              <el-tag v-if="selectedProcess?.equipment" type="warning">{{ selectedProcess?.equipment }}</el-tag>
              <span v-else style="color: #909399;">请先选择工序</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生效日期">
              <el-date-picker
                v-model="form.effective_date"
                type="date"
                placeholder="选择生效日期"
                style="width: 100%;"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
    
    <el-card style="margin-top: 20px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>作业步骤 ({{ form.steps.length }} 步)</span>
          <el-button type="primary" size="small" @click="addStep">
            <el-icon><Plus /></el-icon>添加步骤
          </el-button>
        </div>
      </template>
      
      <div v-for="(step, index) in form.steps" :key="index" class="step-card" :class="{ mandatory: step.is_mandatory }">
        <div class="step-header">
          <div class="step-title-bar">
            <el-tag :type="step.is_mandatory ? 'danger' : 'primary'" size="large">
              步骤 {{ index + 1 }}
            </el-tag>
            <el-input 
              v-model="step.title" 
              placeholder="输入步骤名称" 
              size="large"
              style="width: 300px; margin-left: 12px;"
            />
            <el-checkbox v-model="step.is_mandatory" style="margin-left: 16px;">
              <span style="color: #F56C6C;">关键步骤(强制确认，不可跳步)</span>
            </el-checkbox>
          </div>
          <div class="step-actions">
            <el-button link size="small" @click="moveStep(index, -1)" :disabled="index === 0">
              <el-icon><ArrowUp /></el-icon>上移
            </el-button>
            <el-button link size="small" @click="moveStep(index, 1)" :disabled="index === form.steps.length - 1">
              <el-icon><ArrowDown /></el-icon>下移
            </el-button>
            <el-button link type="danger" size="small" @click="removeStep(index)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </div>
        </div>
        
        <div class="step-media-grid" style="margin-top: 16px;">
          <div class="form-field">
            <div class="field-label">操作说明</div>
            <el-input v-model="step.description" type="textarea" :rows="3" placeholder="详细描述该步骤的操作方法和流程" />
          </div>
          <div class="form-field">
            <div class="field-label">关键参数</div>
            <el-input v-model="step.key_params" type="textarea" :rows="3" placeholder="该步骤需要记录的关键参数，多个参数用逗号分隔&#10;例如：扭矩值、温度、压力、尺寸公差等" />
          </div>
        </div>
        
        <el-divider content-position="left" style="margin: 16px 0;">
          <span style="font-size: 14px; font-weight: 600;">图文视频指导</span>
        </el-divider>
        
        <div class="step-media-grid">
          <div class="form-field">
            <div class="field-label">参考图片</div>
            <el-input v-model="step.image_url" placeholder="输入图片URL，支持JPG、PNG、GIF等" clearable>
              <template #append>
                <el-button @click="previewImage(step)" :disabled="!step.image_url">预览</el-button>
              </template>
            </el-input>
            <div v-if="step.image_url" class="media-preview">
              <img :src="step.image_url" @error="handleImageError($event)" @load="handleImageLoad" class="step-img-preview" />
            </div>
            <div v-else class="media-placeholder">
              <el-icon size="48" color="#C0C4CC"><Picture /></el-icon>
              <p style="color: #909399; margin-top: 8px;">暂无图片</p>
            </div>
          </div>
          <div class="form-field">
            <div class="field-label">操作视频</div>
            <el-input v-model="step.video_url" placeholder="输入视频URL，支持MP4等" clearable>
              <template #append>
                <el-button @click="previewVideo(step)" :disabled="!step.video_url">播放</el-button>
              </template>
            </el-input>
            <div v-if="step.video_url" class="media-preview">
              <video :src="step.video_url" controls class="step-video-preview" />
            </div>
            <div v-else class="media-placeholder">
              <el-icon size="48" color="#C0C4CC"><VideoPlay /></el-icon>
              <p style="color: #909399; margin-top: 8px;">暂无视频</p>
            </div>
          </div>
        </div>
        
        <el-divider content-position="left" style="margin: 16px 0;">
          <span style="font-size: 14px; font-weight: 600;">质量与安全</span>
        </el-divider>
        
        <div class="step-media-grid">
          <div class="form-field">
            <div class="field-label">注意事项</div>
            <el-input v-model="step.attention" type="textarea" :rows="3" placeholder="操作中的安全注意事项、风险提示等" />
          </div>
          <div class="form-field">
            <div class="field-label">质量标准</div>
            <el-input v-model="step.quality_standard" type="textarea" :rows="3" placeholder="该步骤的质量检验标准、验收要求等" />
          </div>
        </div>
      </div>
      
      <el-empty v-if="form.steps.length === 0" description="暂无步骤，点击上方按钮添加" />
    </el-card>
    
    <el-dialog v-model="imagePreviewVisible" title="图片预览" width="800px">
      <img :src="previewImageUrl" style="width: 100%;" @error="handlePreviewImageError" />
    </el-dialog>
    
    <el-dialog v-model="videoPreviewVisible" title="视频预览" width="900px">
      <video :src="previewVideoUrl" controls style="width: 100%;" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const isEdit = computed(() => !!route.params.id);
const products = ref([]);
const processes = ref([]);
const imagePreviewVisible = ref(false);
const videoPreviewVisible = ref(false);
const previewImageUrl = ref('');
const previewVideoUrl = ref('');

const form = ref({
  product_id: '',
  process_id: '',
  version: '',
  title: '',
  status: 'draft',
  effective_date: '',
  steps: []
});

const selectedProcess = computed(() => {
  if (!form.value.process_id) return null;
  return processes.value.find(p => p.id === form.value.process_id);
});

const statusType = (status) => {
  const types = { draft: 'info', pending_review: 'warning', approved: 'success' };
  return types[status] || 'info';
};

const statusText = (status) => {
  const texts = { draft: '草稿', pending_review: '待审核', approved: '已发布' };
  return texts[status] || status;
};

const onProductChange = () => {
};

const onProcessChange = () => {
};

const addStep = () => {
  form.value.steps.push({
    title: '',
    description: '',
    image_url: '',
    video_url: '',
    attention: '',
    quality_standard: '',
    key_params: '',
    is_mandatory: false
  });
};

const removeStep = (index) => {
  form.value.steps.splice(index, 1);
};

const moveStep = (index, direction) => {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= form.value.steps.length) return;
  const temp = form.value.steps[index];
  form.value.steps[index] = form.value.steps[newIndex];
  form.value.steps[newIndex] = temp;
};

const previewImage = (step) => {
  previewImageUrl.value = step.image_url;
  imagePreviewVisible.value = true;
};

const previewVideo = (step) => {
  previewVideoUrl.value = step.video_url;
  videoPreviewVisible.value = true;
};

const handleImageError = (e) => {
  e.target.style.display = 'none';
  e.target.parentElement.innerHTML = '<p style="color: #F56C6C; padding: 20px; text-align: center;">图片加载失败，请检查URL</p>';
};

const handleImageLoad = () => {
};

const handlePreviewImageError = () => {
  ElMessage.error('图片加载失败');
};

const loadSOP = async () => {
  const res = await api.get(`/sops/${route.params.id}`);
  form.value = {
    product_id: res.data.product_id,
    process_id: res.data.process_id,
    version: res.data.version,
    title: res.data.title,
    status: res.data.status,
    effective_date: res.data.effective_date,
    steps: res.data.steps.map(s => ({ ...s, is_mandatory: !!s.is_mandatory }))
  };
};

const loadOptions = async () => {
  const [pRes, proRes] = await Promise.all([api.get('/products'), api.get('/processes')]);
  products.value = pRes.data;
  processes.value = proRes.data;
};

const validateForm = () => {
  if (!form.value.product_id) {
    ElMessage.warning('请选择产品');
    return false;
  }
  if (!form.value.process_id) {
    ElMessage.warning('请选择工序');
    return false;
  }
  if (!form.value.version) {
    ElMessage.warning('请填写版本号');
    return false;
  }
  if (!form.value.title) {
    ElMessage.warning('请填写指导书标题');
    return false;
  }
  if (form.value.steps.length === 0) {
    ElMessage.warning('请至少添加一个作业步骤');
    return false;
  }
  for (let i = 0; i < form.value.steps.length; i++) {
    const step = form.value.steps[i];
    if (!step.title) {
      ElMessage.warning(`步骤 ${i + 1} 请填写步骤名称`);
      return false;
    }
    if (!step.description) {
      ElMessage.warning(`步骤 ${i + 1} 请填写操作说明`);
      return false;
    }
  }
  return true;
};

const save = async (submitForReview = false) => {
  if (!validateForm()) return;
  
  try {
    const data = { ...form.value, created_by: userStore.currentUser.id };
    
    if (isEdit.value) {
      await api.put(`/sops/${route.params.id}`, data);
      if (submitForReview) {
        await api.post(`/sops/${route.params.id}/submit`);
        ElMessage.success('已保存并提交审核');
      } else {
        ElMessage.success('保存成功');
      }
    } else {
      const res = await api.post('/sops', data);
      if (submitForReview) {
        await api.post(`/sops/${res.data.id}/submit`);
        ElMessage.success('已保存并提交审核');
      } else {
        ElMessage.success('创建成功');
      }
    }
    router.push('/sops');
  } catch (e) {
    console.error(e);
  }
};

const saveAndSubmit = async () => {
  await save(true);
};

onMounted(() => {
  loadOptions();
  if (isEdit.value) {
    loadSOP();
  }
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #EBEEF5;
}

.step-title-bar {
  display: flex;
  align-items: center;
}

.step-actions {
  display: flex;
  gap: 8px;
}

.step-card {
  padding: 16px;
  margin-bottom: 16px;
  border: 2px solid #EBEEF5;
  border-radius: 8px;
  background: #fff;
}

.step-card.mandatory {
  border-left: 4px solid #F56C6C;
}

.step-card .el-input {
  width: 100% !important;
}

.step-media-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 768px) {
  .step-media-grid {
    grid-template-columns: 1fr;
  }
}

.media-preview {
  margin-top: 12px;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  padding: 8px;
  background: #FAFAFA;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-placeholder {
  margin-top: 12px;
  border: 2px dashed #DCDFE6;
  border-radius: 8px;
  padding: 20px;
  background: #FAFAFA;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.step-img-preview {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
}

.step-video-preview {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
}

.form-field {
  margin-bottom: 16px;
}

.field-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.field-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
