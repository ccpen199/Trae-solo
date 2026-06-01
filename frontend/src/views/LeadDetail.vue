<template>
  <div class="page-container">
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 16px">
        <el-button @click="$router.back()">
          <el-icon><arrow-left /></el-icon>
          返回
        </el-button>
        <div class="page-title">{{ lead.company_name || '线索详情' }}</div>
      </div>
      <el-space>
        <el-button type="primary" @click="openViewingDialog()">新增带看</el-button>
        <el-button type="success" @click="openQuoteDialog()">新增报价</el-button>
        <el-button type="warning" @click="openContractDialog()">签约</el-button>
      </el-space>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header><span>基本信息</span></template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="企业名称">{{ lead.company_name }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ lead.contact_person }}</el-descriptions-item>
            <el-descriptions-item label="电话">{{ lead.phone }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ lead.email }}</el-descriptions-item>
            <el-descriptions-item label="企业规模">{{ lead.company_scale }}</el-descriptions-item>
            <el-descriptions-item label="行业">{{ lead.industry }}</el-descriptions-item>
            <el-descriptions-item label="需求面积">{{ lead.required_area }}㎡</el-descriptions-item>
            <el-descriptions-item label="预算">{{ lead.budget }}元/月</el-descriptions-item>
            <el-descriptions-item label="来源渠道">{{ lead.source_channel }}</el-descriptions-item>
            <el-descriptions-item label="跟进负责人">{{ lead.follow_person }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header><span>跟进记录</span></template>
          <el-timeline>
            <el-timeline-item
              v-for="item in lead.followUps || []"
              :key="item.id"
              :timestamp="item.follow_time"
            >
              <div>
                <strong>{{ typeLabels[item.follow_type] || item.follow_type }}</strong>
                <span style="margin-left: 12px; color: #909399">{{ item.follow_person }}</span>
              </div>
              <p style="margin-top: 8px">{{ item.content }}</p>
              <p v-if="item.feedback" style="color: #606266; margin-top: 4px">反馈：{{ item.feedback }}</p>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header><span>带看记录</span></template>
          <el-table :data="lead.viewings || []" size="small">
            <el-table-column prop="viewing_time" label="带看时间" width="160" />
            <el-table-column prop="contact_person" label="联系人" width="100" />
            <el-table-column prop="satisfaction_level" label="满意度" width="80" />
            <el-table-column prop="feedback" label="反馈" show-overflow-tooltip />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header><span>报价方案</span></template>
          <el-table :data="lead.quotes || []" size="small">
            <el-table-column prop="version" label="版本" width="60" />
            <el-table-column prop="final_price" label="最终报价" width="100">
              <template #default="{ row }">{{ row.final_price }}元/月</template>
            </el-table-column>
            <el-table-column prop="expire_date" label="有效期至" width="120" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.is_locked ? 'success' : 'info'" size="small">
                  {{ row.is_locked ? '已锁定' : '草稿' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button size="small" link v-if="!row.is_locked" @click="lockQuote(row)">锁定</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { leads, quotes } from '@/api'

const route = useRoute()
const lead = ref({})

const typeLabels = {
  phone: '电话',
  wechat: '微信',
  meeting: '面谈',
  email: '邮件'
}

async function loadLead() {
  const data = await leads.get(route.params.id)
  lead.value = data
}

async function lockQuote(row) {
  await quotes.lock(row.id)
  ElMessage.success('报价已锁定')
  loadLead()
}

function openViewingDialog() {
  ElMessage.info('请在带看管理页面创建')
}

function openQuoteDialog() {
  ElMessage.info('请在报价管理页面创建')
}

function openContractDialog() {
  ElMessage.info('请在合同管理页面创建')
}

onMounted(() => {
  loadLead()
})
</script>
