<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">工序管理</span>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>新建工序
      </el-button>
    </div>
    
    <el-card>
      <el-table :data="processes" border>
        <el-table-column prop="code" label="工序编号" width="120" />
        <el-table-column prop="name" label="工序名称" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="equipment" label="设备" width="120" />
        <el-table-column prop="position" label="岗位" width="120" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link size="small" @click="editProcess(row)">编辑</el-button>
            <el-button link size="small" type="danger" @click="deleteProcess(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑工序' : '新建工序'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="工序编号" required>
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="工序名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="设备">
          <el-input v-model="form.equipment" />
        </el-form-item>
        <el-form-item label="岗位">
          <el-input v-model="form.position" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';

const processes = ref([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = ref({ code: '', name: '', description: '', equipment: '', position: '' });

const formatDate = (date) => new Date(date).toLocaleString();

const loadProcesses = async () => {
  try {
    const res = await api.get('/processes');
    processes.value = res.data;
  } catch (e) {
    console.error(e);
  }
};

const showAddDialog = () => {
  isEdit.value = false;
  form.value = { code: '', name: '', description: '', equipment: '', position: '' };
  dialogVisible.value = true;
};

const editProcess = (row) => {
  isEdit.value = true;
  form.value = { ...row };
  dialogVisible.value = true;
};

const save = async () => {
  if (!form.value.code || !form.value.name) {
    ElMessage.warning('请填写必填项');
    return;
  }
  
  try {
    if (isEdit.value) {
      await api.put(`/processes/${form.value.id}`, form.value);
      ElMessage.success('更新成功');
    } else {
      await api.post('/processes', form.value);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    loadProcesses();
  } catch (e) {
    console.error(e);
  }
};

const deleteProcess = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除此工序吗？', '提示', { type: 'warning' });
    await api.delete(`/processes/${id}`);
    ElMessage.success('删除成功');
    loadProcesses();
  } catch (e) {
    if (e !== 'cancel') console.error(e);
  }
};

onMounted(loadProcesses);
</script>
