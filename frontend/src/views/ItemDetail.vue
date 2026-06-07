<template>
  <div class="item-detail-page">
    <el-page-header @back="$router.back()" content="事项详情" style="margin-bottom: 20px;" />
    
    <el-card v-loading="loading">
      <template #header>
        <div class="header">
          <h2>{{ item?.name }}</h2>
          <div>
            <el-tag type="primary" style="margin-right: 8px;">{{ item?.department }}</el-tag>
            <el-tag type="success">{{ item?.category }}</el-tag>
          </div>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="国家事项编码">
          <span v-if="item?.national_code" style="color: #10b981; font-weight: 600;">{{ item?.national_code }}</span>
          <el-tag v-else type="danger">未映射</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="本地编码">{{ item?.local_code }}</el-descriptions-item>
        <el-descriptions-item label="事项分类">{{ item?.category }}</el-descriptions-item>
        <el-descriptions-item label="办理颗粒度">{{ item?.granularity }}</el-descriptions-item>
        <el-descriptions-item label="承诺时限">{{ item?.processing_time }} 个工作日</el-descriptions-item>
        <el-descriptions-item label="收费标准">{{ item?.charging_standard || '免费' }}</el-descriptions-item>
        <el-descriptions-item label="标准化映射">
          <el-tag v-if="item?.national_code" type="success">已映射国家事项库</el-tag>
          <el-tag v-else type="warning">待映射</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="办理说明" :span="2">{{ item?.description || '暂无说明' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">办理条件判定树</el-divider>
      <div v-if="conditionTree" class="condition-tree">
        <ConditionNode :node="conditionTree" :level="0" />
      </div>
      <el-empty v-else description="暂无办理条件" :image-size="80" />

      <el-divider content-position="left">所需材料清单</el-divider>
      <el-table :data="item?.materials || []" v-if="item?.materials?.length" border>
        <el-table-column prop="name" label="材料名称" min-width="180">
          <template #default="{ row }">
            <span>{{ row.name }}</span>
            <el-tag v-if="row.name.includes('电子营业执照')" type="warning" size="small" style="margin-left: 4px;">自动调用</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="format_requirements" label="格式要求" min-width="200" />
        <el-table-column label="是否必填" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.required ? 'danger' : 'info'" size="small">
              {{ row.required ? '必填' : '选填' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="OCR识别" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.ocr_enabled" type="success" size="small">支持</el-tag>
            <el-tag v-else type="info" size="small">-</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="OCR识别字段" min-width="180">
          <template #default="{ row }">
            <template v-if="row.ocr_enabled && row.ocr_fields">
              <el-tag v-for="field in parseOcrFields(row.ocr_fields)" :key="field" size="small" style="margin: 2px 4px 2px 0;">{{ field }}</el-tag>
            </template>
            <span v-else style="color: #94a3b8;">-</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无材料要求" :image-size="80" />

      <div v-if="ocrRules" style="margin-top: 16px;">
        <el-alert type="info" :closable="false" show-icon>
          <template #title>
            <span style="font-weight: 600;">OCR智能识别规则</span>
          </template>
          <div style="margin-top: 8px;">
            <span>识别字段: </span>
            <el-tag v-for="f in ocrRules.fields || []" :key="f" size="small" style="margin-right: 4px;">{{ f }}</el-tag>
          </div>
          <div v-if="ocrRules.rules?.length" style="margin-top: 8px;">
            <span>校验规则: </span>
            <span v-for="(r, i) in ocrRules.rules" :key="i" style="margin-right: 12px; color: #64748b; font-size: 13px;">
              {{ r.field }}: {{ r.message }}
            </span>
          </div>
        </el-alert>
      </div>

      <div class="actions">
        <el-button type="primary" size="large" @click="handleApply">
          <el-icon><Edit /></el-icon>
          立即办理
        </el-button>
      </div>
    </el-card>

    <el-dialog v-model="applyDialogVisible" title="提交申请" width="600px">
      <el-form :model="applyForm" label-width="100px">
        <el-form-item label="上传材料">
          <el-upload
            :auto-upload="false"
            :on-change="handleFileChange"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              选择文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">支持 PDF、JPG、PNG 格式，单个文件不超过 10MB</div>
            </template>
          </el-upload>
          <div v-if="selectedFiles.length > 0" style="margin-top: 12px;">
            <div v-for="(file, idx) in selectedFiles" :key="idx" class="file-item">
              <span>{{ file.name }}</span>
              <el-tag v-if="file.preReview?.passed" type="success">预审通过</el-tag>
              <el-tag v-else type="danger">预审不通过: {{ file.preReview?.issues?.join(', ') }}</el-tag>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="applyForm.remark" type="textarea" :rows="3" placeholder="请填写备注信息（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApplication" :loading="submitting">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, defineComponent, h } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElTag } from 'element-plus';
import api from '@/utils/api';

const ConditionNode = defineComponent({
  name: 'ConditionNode',
  props: { node: { type: Object, required: true }, level: { type: Number, default: 0 } },
  setup(props) {
    return () => {
      const n = props.node;
      const indent = { marginLeft: `${props.level * 24}px` };
      if (n.type === 'and' || n.type === 'or') {
        const tag = n.type === 'and' ? { type: 'primary', text: '且(AND)' } : { type: 'warning', text: '或(OR)' };
        return h('div', { style: indent }, [
          h('div', { style: 'display:flex;align-items:center;margin:8px 0;' }, [
            h(ElTag, { type: tag.type as any, size: 'small', style: 'margin-right:8px;' }, () => tag.text),
            h('span', { style: 'font-weight:500;color:#334155;' }, n.label || '')
          ]),
          ...(n.children || []).map((c: any, i: number) =>
            h(ConditionNode, { node: c, level: props.level + 1, key: i })
          )
        ]);
      }
      return h('div', { style: { ...indent, display: 'flex', alignItems: 'center', padding: '4px 0' } }, [
        h(ElTag, { type: 'success', size: 'small', style: 'margin-right:8px;' }, () => '条件'),
        h('span', { style: 'color:#475569;' }, n.label || '')
      ]);
    };
  }
});

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const submitting = ref(false);
const item = ref<any>(null);
const applyDialogVisible = ref(false);
const selectedFiles = ref<any[]>([]);

const applyForm = reactive({ remark: '' });

const conditionTree = computed(() => {
  if (!item.value?.condition_tree) return null;
  try {
    const parsed = typeof item.value.condition_tree === 'string' ? JSON.parse(item.value.condition_tree) : item.value.condition_tree;
    return parsed.root || parsed;
  } catch { return null; }
});

const ocrRules = computed(() => {
  if (!item.value?.ocr_rules) return null;
  try {
    return typeof item.value.ocr_rules === 'string' ? JSON.parse(item.value.ocr_rules) : item.value.ocr_rules;
  } catch { return null; }
});

const parseOcrFields = (fields: any) => {
  if (!fields) return [];
  try {
    return typeof fields === 'string' ? JSON.parse(fields) : fields;
  } catch { return []; }
};

const loadItem = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/items/${route.params.id}`);
    if (res.code === 200) {
      item.value = res.data;
    }
  } finally {
    loading.value = false;
  }
};

const handleApply = () => { applyDialogVisible.value = true; };

const handleFileChange = async (file: any) => {
  try {
    const res = await api.post('/applications/material/pre-review', {
      filename: file.name,
      fileSize: file.size,
      fileType: file.raw?.type || 'application/octet-stream'
    });
    if (res.code === 200) {
      file.preReview = res.data;
      selectedFiles.value.push(file);
      if (!res.data.passed) {
        ElMessage.warning(`材料预审不通过: ${res.data.issues.join(', ')}`);
      }
    }
  } catch (error) {
    console.error('预审失败', error);
  }
};

const submitApplication = async () => {
  submitting.value = true;
  try {
    const materials = selectedFiles.value.map((f: any) => ({ name: f.name, url: f.name }));
    const res = await api.post('/applications', { itemId: item.value.id, itemName: item.value.name, materials });
    if (res.code === 200) {
      ElMessage.success(`申请提交成功！办件编号: ${res.data.applicationNo}`);
      applyDialogVisible.value = false;
      router.push('/applications');
    }
  } finally {
    submitting.value = false;
  }
};

onMounted(() => { loadItem(); });
</script>

<style scoped>
.header { display: flex; justify-content: space-between; align-items: center; }
.header h2 { margin: 0; }
.condition-tree { background: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0; }
.actions { margin-top: 24px; text-align: center; }
.file-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8fafc; border-radius: 4px; margin-bottom: 8px; }
</style>
