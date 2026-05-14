<template>
  <div class="page-container">
    <div class="card" style="max-width: 800px; margin: 0 auto;">
      <h2 style="margin-bottom: 24px;">发布文章</h2>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
      >
        <el-form-item label="文章标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入文章标题"
            maxlength="100"
            show-word-limit
            :disabled="loading"
          />
        </el-form-item>

        <el-form-item label="摘要">
          <el-input
            v-model="form.summary"
            type="textarea"
            :rows="2"
            placeholder="文章摘要（可选）"
            :disabled="loading"
          />
        </el-form-item>

        <el-form-item label="封面图 URL（可选）">
          <el-input
            v-model="form.cover"
            placeholder="输入图片 URL"
            :disabled="loading"
          />
        </el-form-item>

        <el-form-item label="文章内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="15"
            placeholder="请输入文章内容"
            :disabled="loading"
          />
        </el-form-item>

        <el-form-item label="分类">
          <el-select
            v-model="form.categoryId"
            placeholder="选择分类（可选）"
            clearable
            style="width: 200px;"
            :disabled="loading"
          >
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标签">
          <el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入标签，回车添加（可选）"
            :disabled="loading"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleSubmit"
          >
            发布文章
          </el-button>
          <el-button @click="router.back()">
            取消
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElForm } from 'element-plus';
import { articleApi, categoryApi } from '@/api';

const router = useRouter();

const formRef = ref(null);
const loading = ref(false);

const categories = ref([]);
const availableTags = ['产品设计', '需求分析', '用户增长', 'UI/UX', '数据分析', '竞品分析', '职业发展', '求职面试'];

const form = reactive({
  title: '',
  summary: '',
  content: '',
  categoryId: null,
  tags: []
});

const rules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { min: 5, max: 100, message: '标题长度在 5-100 个字符之间', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' },
    { min: 20, message: '文章内容至少 20 个字符', trigger: 'blur' }
  ]
};

const fetchCategories = async () => {
  try {
    const res = await categoryApi.getList();
    categories.value = res.data?.list || [];
  } catch (error) {
    console.error('Fetch categories error:', error);
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    
    loading.value = true;
    
    const res = await articleApi.create({
      title: form.title,
      summary: form.summary,
      cover: form.cover,
      content: form.content,
      categoryId: form.categoryId,
      tags: form.tags
    });
    
    ElMessage.success('文章发布成功');
    router.push(`/articles/${res.data.article.id}`);
  } catch (error) {
    console.error('Submit error:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchCategories();
});
</script>
