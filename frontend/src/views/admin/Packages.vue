<template>
  <div class="packages-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>企业用户专属服务包配置</span>
          <el-button type="primary" @click="addDialogVisible = true">
            <el-icon><Plus /></el-icon>
            新增服务包
          </el-button>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="8" v-for="pkg in packages" :key="pkg.id">
          <el-card class="package-card" shadow="hover">
            <div class="package-header">
              <h3>{{ pkg.name }}</h3>
              <el-tag type="success">企业专属</el-tag>
            </div>
            <p class="package-desc">{{ pkg.description }}</p>
            <div class="package-info">
              <div>
                <span class="label">适用行业:</span>
                <span>{{ pkg.target_industry }}</span>
              </div>
              <div>
                <span class="label">服务权益:</span>
                <span>{{ pkg.benefits }}</span>
              </div>
              <div>
                <span class="label">使用人数:</span>
                <span class="count">{{ pkg.user_count || 0 }} 人</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-empty v-if="packages.length === 0" description="暂无服务包" />
    </el-card>

    <el-dialog v-model="addDialogVisible" title="新增服务包" width="600px">
      <el-form :model="packageForm" label-width="100px">
        <el-form-item label="服务包名称">
          <el-input v-model="packageForm.name" placeholder="请输入服务包名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="packageForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="目标行业">
          <el-input v-model="packageForm.targetIndustry" placeholder="例如：全行业、制造业等" />
        </el-form-item>
        <el-form-item label="包含事项">
          <el-select v-model="packageForm.itemIds" multiple placeholder="请选择包含的事项" style="width: 100%;">
            <el-option 
              v-for="item in itemOptions" 
              :key="item.id" 
              :label="item.name" 
              :value="item.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="服务权益">
          <el-input v-model="packageForm.benefits" type="textarea" :rows="2" placeholder="请输入服务权益说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePackage" :loading="submitting">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/utils/api';

const packages = ref<any[]>([]);
const itemOptions = ref<any[]>([]);
const addDialogVisible = ref(false);
const submitting = ref(false);

const packageForm = reactive({
  name: '',
  description: '',
  targetIndustry: '',
  itemIds: [] as number[],
  benefits: ''
});

const loadPackages = async () => {
  try {
    const res = await api.get('/admin/packages');
    if (res.code === 200) {
      packages.value = res.data;
    }
  } catch (error) {
    console.error('加载服务包失败', error);
  }
};

const loadItems = async () => {
  try {
    const res = await api.get('/items', { params: { pageSize: 100 } });
    if (res.code === 200) {
      itemOptions.value = res.data.list;
    }
  } catch (error) {
    console.error('加载事项列表失败', error);
  }
};

const savePackage = async () => {
  submitting.value = true;
  try {
    const res = await api.post('/admin/packages', packageForm);
    if (res.code === 200) {
      ElMessage.success('服务包创建成功');
      addDialogVisible.value = false;
      loadPackages();
    }
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadPackages();
  loadItems();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.package-card {
  margin-bottom: 20px;
}

.package-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.package-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1e293b;
}

.package-desc {
  color: #64748b;
  margin-bottom: 16px;
}

.package-info {
  font-size: 13px;
}

.package-info > div {
  margin-bottom: 8px;
  display: flex;
}

.package-info .label {
  color: #94a3b8;
  width: 70px;
  flex-shrink: 0;
}

.package-info .count {
  color: #1e40af;
  font-weight: 600;
}
</style>
