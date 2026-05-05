<template>
  <div class="container" style="max-width: 600px; padding-top: 32px;">
    <div class="page-header">
      <h1 class="page-title">创建联盟</h1>
    </div>
    <div class="card" style="padding: 32px;">
      <form @submit.prevent="handleCreate">
        <div class="form-group">
          <label class="form-label">联盟名称 <span style="color: #ff4757;">*</span></label>
          <input
            v-model="form.name"
            type="text"
            class="form-input"
            placeholder="请输入联盟名称（2-20个字符）"
            required
          />
        </div>
        <div class="form-group">
          <label class="form-label">联盟描述</label>
          <textarea
            v-model="form.description"
            class="form-textarea"
            placeholder="请输入联盟描述（最多200个字符）"
            rows="4"
          ></textarea>
        </div>
        <div style="margin-top: 32px;">
          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 16px;" :disabled="loading">
            {{ loading ? '创建中...' : '创建联盟' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api';

const router = useRouter();

const form = ref({
  name: '',
  description: '',
});
const loading = ref(false);

const handleCreate = async () => {
  if (!form.value.name) {
    alert('请输入联盟名称');
    return;
  }

  if (form.value.name.length < 2 || form.value.name.length > 20) {
    alert('联盟名称长度应为2-20个字符');
    return;
  }

  loading.value = true;
  try {
    const union = await api.createUnion({
      name: form.value.name,
      description: form.value.description || undefined,
    });
    alert('创建联盟成功！');
    router.push(`/union/${union.id}`);
  } catch (error: any) {
    alert(error.response?.data?.message || '创建失败');
  } finally {
    loading.value = false;
  }
};
</script>
