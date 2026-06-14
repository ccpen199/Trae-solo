<template>
  <div class="mobile-container">
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2>📂 离线档案</h2>
        <p style="color: #909399;">已下载的重点企业档案，离线可查看</p>
      </div>
      <el-button type="primary" @click="syncOffline">
        <el-icon><Refresh /></el-icon>
        同步
      </el-button>
    </div>

    <el-empty v-if="list.length === 0 && !loading" description="暂无离线档案，请到企业详情页下载">
      <template #image>
        <el-icon :size="64" color="#909399"><FolderOpened /></el-icon>
      </template>
      <el-button type="primary" @click="$router.push('/search')">去查询企业</el-button>
    </el-empty>

    <div v-else>
      <div v-for="item in list" :key="item.id" style="margin-bottom: 16px;">
        <el-card class="card-shadow">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1;">
              <h3 style="margin-bottom: 8px;">{{ item.enterprise_name }}</h3>
              <div style="color: #909399; font-size: 13px; margin-bottom: 4px;">
                {{ item.archive_data?.enterprise?.unified_social_credit }}
              </div>
              <div style="color: #909399; font-size: 12px; margin-bottom: 12px;">
                下载时间：{{ item.downloaded_at }}
              </div>
              
              <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                <el-tag size="small" :type="getRiskType(item.archive_data?.enterprise?.risk_level)">
                  {{ item.archive_data?.enterprise?.risk_level }}
                </el-tag>
                <el-tag size="small" type="primary">
                  健康度 {{ item.archive_data?.enterprise?.total_score }} 分
                </el-tag>
              </div>

              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 12px; margin-bottom: 12px;">
                <div style="text-align: center; padding: 8px; background: #f5f7fa; border-radius: 4px;">
                  <div style="color: #606266;">司法记录</div>
                  <div style="font-weight: bold; color: #f56c6c;">{{ item.archive_data?.judicial?.length || 0 }}</div>
                </div>
                <div style="text-align: center; padding: 8px; background: #f5f7fa; border-radius: 4px;">
                  <div style="color: #606266;">招投标</div>
                  <div style="font-weight: bold; color: #409eff;">{{ item.archive_data?.bidding?.length || 0 }}</div>
                </div>
                <div style="text-align: center; padding: 8px; background: #f5f7fa; border-radius: 4px;">
                  <div style="color: #606266;">资质证书</div>
                  <div style="font-weight: bold; color: #67c23a;">{{ item.archive_data?.qualification?.length || 0 }}</div>
                </div>
              </div>

              <div v-if="item.qr_code" style="text-align: center; margin-bottom: 12px;">
                <img :src="item.qr_code" style="width: 80px; height: 80px;" />
                <div style="font-size: 12px; color: #909399; margin-top: 4px;">企业资质码</div>
              </div>

              <div style="display: flex; gap: 8px;">
                <el-button size="small" type="primary" @click="viewArchive(item)">查看详情</el-button>
                <el-button size="small" @click="showQR(item)">二维码</el-button>
                <el-button size="small" type="danger" @click="deleteArchive(item)">删除</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[5, 10, 20]"
          layout="prev, pager, next"
          background
          @current-change="loadList"
        />
      </div>
    </div>

    <el-dialog v-model="detailDialogVisible" title="档案详情" width="90%">
      <div v-if="currentArchive">
        <el-alert
          :title="`${currentArchive.archive_data?.enterprise?.name} - 综合健康度 ${currentArchive.archive_data?.enterprise?.total_score} 分`"
          :type="currentArchive.archive_data?.enterprise?.risk_level === '高风险' ? 'error' : currentArchive.archive_data?.enterprise?.risk_level === '中风险' ? 'warning' : 'success'"
          show-icon
          style="margin-bottom: 20px;"
        />

        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="企业名称">{{ currentArchive.archive_data?.enterprise?.name }}</el-descriptions-item>
              <el-descriptions-item label="统一社会信用代码">{{ currentArchive.archive_data?.enterprise?.unified_social_credit }}</el-descriptions-item>
              <el-descriptions-item label="法定代表人">{{ currentArchive.archive_data?.enterprise?.legal_representative }}</el-descriptions-item>
              <el-descriptions-item label="注册资本">{{ currentArchive.archive_data?.enterprise?.registered_capital }}</el-descriptions-item>
              <el-descriptions-item label="成立日期">{{ currentArchive.archive_data?.enterprise?.establishment_date }}</el-descriptions-item>
              <el-descriptions-item label="地址">{{ currentArchive.archive_data?.enterprise?.address }}</el-descriptions-item>
              <el-descriptions-item label="经营范围">{{ currentArchive.archive_data?.enterprise?.business_scope }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          
          <el-tab-pane label="司法记录" name="judicial">
            <div v-if="currentArchive.archive_data?.judicial?.length > 0">
              <div v-for="(j, idx) in currentArchive.archive_data.judicial" :key="j.id" style="padding: 12px; border-bottom: 1px solid #f0f0f0;">
                <div style="font-weight: bold;">[{{ j.case_type }}] {{ j.case_reason }}</div>
                <div style="color: #606266; font-size: 12px;">{{ j.court }} | {{ j.filing_date }}</div>
                <div v-if="j.amount" style="color: #f56c6c;">涉及金额：¥{{ j.amount.toLocaleString() }}</div>
              </div>
            </div>
            <div v-else style="text-align: center; color: #909399; padding: 20px;">暂无司法记录</div>
          </el-tab-pane>
          
          <el-tab-pane label="资质信息" name="qualification">
            <el-table :data="currentArchive.archive_data?.qualification || []" v-if="currentArchive.archive_data?.qualification?.length > 0" size="small">
              <el-table-column label="资质">
                <template #default="scope">{{ scope.row.qualification_type }} - {{ scope.row.qualification_level }}</template>
              </el-table-column>
              <el-table-column prop="certificate_number" label="证书编号" />
              <el-table-column label="有效期">
                <template #default="scope">{{ scope.row.issue_date }} 至 {{ scope.row.expiry_date }}</template>
              </el-table-column>
            </el-table>
            <div v-else style="text-align: center; color: #909399; padding: 20px;">暂无资质信息</div>
          </el-tab-pane>
          
          <el-tab-pane label="人员信息" name="personnel">
            <el-table :data="currentArchive.archive_data?.personnel || []" v-if="currentArchive.archive_data?.personnel?.length > 0" size="small">
              <el-table-column prop="name" label="姓名" />
              <el-table-column prop="position" label="职位" />
              <el-table-column prop="qualification_certificates" label="资质" />
            </el-table>
            <div v-else style="text-align: center; color: #909399; padding: 20px;">暂无人员信息</div>
          </el-tab-pane>
          
          <el-tab-pane label="信用记录" name="credit">
            <div v-if="currentArchive.archive_data?.credit?.length > 0">
              <div v-for="c in currentArchive.archive_data.credit" :key="c.id" style="padding: 12px; border-bottom: 1px solid #f0f0f0;">
                <div style="font-weight: bold;">[{{ c.credit_type }}] {{ c.credit_level }}</div>
                <div style="color: #606266;">{{ c.description }}</div>
                <div style="color: #909399; font-size: 12px;">{{ c.effective_date }} 至 {{ c.display_deadline }}</div>
              </div>
            </div>
            <div v-else style="text-align: center; color: #909399; padding: 20px;">暂无信用记录</div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <el-dialog v-model="qrDialogVisible" title="企业资质二维码" width="400px">
      <div style="text-align: center;">
        <img v-if="currentArchive?.qr_code" :src="currentArchive.qr_code" style="width: 250px; height: 250px;" />
        <p style="margin-top: 16px; color: #606266;">扫描二维码快速调取企业资质信息</p>
        <p style="font-size: 12px; color: #909399;">{{ currentArchive?.enterprise_name }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { mobileApi } from '@/utils/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, FolderOpened } from '@element-plus/icons-vue';

const loading = ref(false);
const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const detailDialogVisible = ref(false);
const qrDialogVisible = ref(false);
const currentArchive = ref(null);
const activeTab = ref('basic');

const getRiskType = (level) => {
  if (level === '高风险') return 'danger';
  if (level === '中风险') return 'warning';
  return 'success';
};

const loadList = async () => {
  loading.value = true;
  try {
    const data = await mobileApi.offlineList({ page: page.value, pageSize: pageSize.value, userId: 1 });
    list.value = data.list;
    total.value = data.total;
  } catch (err) {
    console.error('Load offline list failed:', err);
  } finally {
    loading.value = false;
  }
};

const syncOffline = async () => {
  try {
    await loadList();
    ElMessage.success('同步成功');
  } catch (err) {
    console.error('Sync failed:', err);
  }
};

const viewArchive = (item) => {
  currentArchive.value = item;
  detailDialogVisible.value = true;
};

const showQR = (item) => {
  currentArchive.value = item;
  qrDialogVisible.value = true;
};

const deleteArchive = async (item) => {
  try {
    await ElMessageBox.confirm('确定要删除这个离线档案吗？', '确认删除', { type: 'warning' });
    await mobileApi.deleteOffline(item.id);
    ElMessage.success('删除成功');
    loadList();
  } catch (err) {
    if (err !== 'cancel') {
      console.error('Delete archive failed:', err);
    }
  }
};

onMounted(loadList);
</script>
