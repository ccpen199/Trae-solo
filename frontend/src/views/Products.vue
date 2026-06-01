<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">产品管理</span>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>新建产品
      </el-button>
    </div>
    
    <el-card>
      <el-table :data="products" border>
        <el-table-column prop="code" label="产品编号" width="120" />
        <el-table-column prop="name" label="产品名称" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link size="small" @click="editProduct(row)">编辑</el-button>
            <el-button link size="small" type="danger" @click="deleteProduct(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑产品' : '新建产品'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="产品编号" required>
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="产品名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
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

const products = ref([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const form = ref({ code: '', name: '', description: '' });

const formatDate = (date) => new Date(date).toLocaleString();

const loadProducts = async () => {
  try {
    const res = await api.get('/products');
    products.value = res.data;
  } catch (e) {
    console.error(e);
  }
};

const showAddDialog = () => {
  isEdit.value = false;
  form.value = { code: '', name: '', description: '' };
  dialogVisible.value = true;
};

const editProduct = (row) => {
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
      await api.put(`/products/${form.value.id}`, form.value);
      ElMessage.success('更新成功');
    } else {
      await api.post('/products', form.value);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    loadProducts();
  } catch (e) {
    console.error(e);
  }
};

const deleteProduct = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除此产品吗？', '提示', { type: 'warning' });
    await api.delete(`/products/${id}`);
    ElMessage.success('删除成功');
    loadProducts();
  } catch (e) {
    if (e !== 'cancel') console.error(e);
  }
};

onMounted(loadProducts);
</script>
