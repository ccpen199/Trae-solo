<template>
  <div class="admin-items-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>事项管理</span>
          <el-button type="primary" @click="addDialogVisible = true">
            <el-icon><Plus /></el-icon>
            新增事项
          </el-button>
        </div>
      </template>

      <el-table :data="items" v-loading="loading">
        <el-table-column prop="national_code" label="国家编码" width="120" />
        <el-table-column prop="local_code" label="本地编码" width="120" />
        <el-table-column prop="name" label="事项名称" min-width="200" />
        <el-table-column prop="department" label="所属部门" width="140" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="processing_time" label="承诺时限" width="100">
          <template #default="{ row }">
            {{ row.processing_time }} 工作日
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'danger'" size="small">
              {{ row.status ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="editItem(row)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end;"
        @current-change="loadItems"
      />
    </el-card>

    <el-dialog v-model="addDialogVisible" title="新增事项" width="600px">
      <el-form :model="itemForm" label-width="100px">
        <el-form-item label="国家编码">
          <el-input v-model="itemForm.nationalCode" placeholder="请输入国家事项编码" />
        </el-form-item>
        <el-form-item label="本地编码">
          <el-input v-model="itemForm.localCode" placeholder="请输入本地事项编码" />
        </el-form-item>
        <el-form-item label="事项名称">
          <el-input v-model="itemForm.name" placeholder="请输入事项名称" />
        </el-form-item>
        <el-form-item label="所属部门">
          <el-input v-model="itemForm.department" placeholder="请输入所属部门" />
        </el-form-item>
        <el-form-item label="事项分类">
          <el-input v-model="itemForm.category" placeholder="请输入事项分类" />
        </el-form-item>
        <el-form-item label="承诺时限">
          <el-input-number v-model="itemForm.processingTime" :min="1" />
          <span style="margin-left: 8px;">工作日</span>
        </el-form-item>
        <el-form-item label="办理说明">
          <el-input v-model="itemForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveItem" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/utils/api';

const loading = ref(false);
const submitting = ref(false);
const items = ref<any[]>([]);
const addDialogVisible = ref(false);

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const itemForm = reactive({
  nationalCode: '',
  localCode: '',
  name: '',
  department: '',
  category: '',
  processingTime: 5,
  description: ''
});

const loadItems = async () => {
  loading.value = true;
  try {
    const res = await api.get('/items', { params: pagination });
    if (res.code === 200) {
      items.value = res.data.list;
      pagination.total = res.data.total;
    }
  } finally {
    loading.value = false;
  }
};

const saveItem = async () => {
  submitting.value = true;
  try {
    const res = await api.post('/items', itemForm);
    if (res.code === 200) {
      ElMessage.success('创建成功');
      addDialogVisible.value = false;
      loadItems();
    }
  } finally {
    submitting.value = false;
  }
};

const editItem = (row: any) => {
  ElMessage.info('编辑功能开发中');
};

onMounted(() => {
  loadItems();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
