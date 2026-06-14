<template>
  <div class="transfer-order-container">
    <el-card class="header-card" shadow="never">
      <div class="card-header-wrapper">
        <span class="card-title">跨省转移联单管理</span>
        <span class="card-subtitle">危险废物跨省转移联单审核与管理</span>
      </div>

      <div class="filter-bar">
        <div class="filter-left">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索联单编号、废弃物名称"
            clearable
            style="width: 280px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 140px">
            <el-option label="全部状态" value="" />
            <el-option label="待审核" value="pending" />
            <el-option label="已批准" value="approved" />
            <el-option label="转移中" value="transferring" />
            <el-option label="已完成" value="completed" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
          <el-select v-model="provinceFilter" placeholder="省份筛选" style="width: 140px">
            <el-option label="全部省份" value="" />
            <el-option label="江苏省" value="江苏" />
            <el-option label="浙江省" value="浙江" />
            <el-option label="广东省" value="广东" />
            <el-option label="山东省" value="山东" />
            <el-option label="上海市" value="上海" />
            <el-option label="安徽省" value="安徽" />
          </el-select>
        </div>
        <div class="filter-right">
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="filteredList" style="width: 100%" stripe>
        <el-table-column prop="orderNo" label="联单编号" width="170" />
        <el-table-column prop="wasteName" label="废弃物名称" min-width="150" />
        <el-table-column prop="hazardousCode" label="危废代码" width="110" />
        <el-table-column prop="weight" label="重量（吨）" width="100" />
        <el-table-column label="移出省份" width="100">
          <template #default="scope">
            <el-tag type="warning" effect="light" size="small">{{ scope.row.fromProvince }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="接收省份" width="100">
          <template #default="scope">
            <el-tag type="success" effect="light" size="small">{{ scope.row.toProvince }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="transporter" label="运输单位" min-width="160" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="statusTypeMap[scope.row.status]" effect="light" size="small">
              {{ statusTextMap[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button type="primary" link size="small" @click="handleDetail(scope.row)">
                查看详情
              </el-button>
              <el-button
                v-if="scope.row.status === 'pending'"
                type="success"
                link
                size="small"
                @click="handleAudit(scope.row)"
              >
                审核
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="转移联单详情" width="760px">
      <div v-if="currentItem" class="detail-content">
        <div class="detail-section">
          <div class="section-title">
            <el-icon><Document /></el-icon>
            联单基本信息
          </div>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="联单编号">{{ currentItem.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusTypeMap[currentItem.status]" effect="light">
                {{ statusTextMap[currentItem.status] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ currentItem.submitTime }}</el-descriptions-item>
            <el-descriptions-item label="预计转移时间">{{ currentItem.planTime }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <div class="section-title">
            <el-icon><Warning /></el-icon>
            废弃物信息
          </div>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="废弃物名称">{{ currentItem.wasteName }}</el-descriptions-item>
            <el-descriptions-item label="危废代码">
              <el-tag type="danger" effect="light">{{ currentItem.hazardousCode }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="重量">{{ currentItem.weight }} 吨</el-descriptions-item>
            <el-descriptions-item label="形态">{{ currentItem.form }}</el-descriptions-item>
            <el-descriptions-item label="危险特性" :span="2">{{ currentItem.characteristic }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <div class="section-title">
            <el-icon><Location /></el-icon>
            转移信息
          </div>
          <div class="transfer-info-row">
            <div class="transfer-card from">
              <div class="transfer-label">移出地</div>
              <div class="transfer-province">{{ currentItem.fromProvince }}</div>
              <div class="transfer-enterprise">{{ currentItem.fromEnterprise }}</div>
              <div class="transfer-contact">{{ currentItem.fromContact }} · {{ currentItem.fromPhone }}</div>
            </div>
            <div class="transfer-arrow">
              <el-icon :size="32"><Right /></el-icon>
            </div>
            <div class="transfer-card to">
              <div class="transfer-label">接收地</div>
              <div class="transfer-province">{{ currentItem.toProvince }}</div>
              <div class="transfer-enterprise">{{ currentItem.toEnterprise }}</div>
              <div class="transfer-contact">{{ currentItem.toContact }} · {{ currentItem.toPhone }}</div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-title">
            <el-icon><Van /></el-icon>
            运输信息
          </div>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="运输单位">{{ currentItem.transporter }}</el-descriptions-item>
            <el-descriptions-item label="运输方式">{{ currentItem.transportType }}</el-descriptions-item>
            <el-descriptions-item label="车辆牌号">{{ currentItem.vehicleNo }}</el-descriptions-item>
            <el-descriptions-item label="驾驶员">{{ currentItem.driver }}</el-descriptions-item>
            <el-descriptions-item label="预计路线" :span="2">{{ currentItem.route }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div v-if="currentItem.auditRecords && currentItem.auditRecords.length > 0" class="detail-section">
          <div class="section-title">
            <el-icon><Clock /></el-icon>
            审核记录
          </div>
          <el-timeline>
            <el-timeline-item
              v-for="(record, index) in currentItem.auditRecords"
              :key="index"
              :timestamp="record.time"
              :type="record.type"
            >
              <div class="audit-record">
                <span class="record-action">{{ record.action }}</span>
                <span class="record-operator">{{ record.operator }}</span>
                <p v-if="record.opinion" class="record-opinion">{{ record.opinion }}</p>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div class="detail-section">
          <div class="section-title">
            <el-icon><Paperclip /></el-icon>
            附件材料
          </div>
          <div class="attachments">
            <div
              v-for="(file, index) in currentItem.attachments"
              :key="index"
              class="attachment-item"
            >
              <el-icon class="file-icon"><Document /></el-icon>
              <span class="file-name">{{ file.name }}</span>
              <el-button type="primary" link size="small">下载</el-button>
            </div>
          </div>
        </div>

        <div v-if="currentItem.status === 'pending'" class="audit-form-section">
          <div class="section-title">
            <el-icon><Edit /></el-icon>
            审核意见
          </div>
          <el-input
            v-model="auditForm.opinion"
            type="textarea"
            :rows="3"
            placeholder="请输入审核意见"
            maxlength="500"
            show-word-limit
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          v-if="currentItem?.status === 'pending'"
          type="danger"
          @click="confirmReject"
        >
          拒绝
        </el-button>
        <el-button
          v-if="currentItem?.status === 'pending'"
          type="success"
          @click="confirmApprove"
        >
          批准
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Document, Warning, Location, Van, Clock, Paperclip, Edit, Right
} from '@element-plus/icons-vue'

const searchKeyword = ref('')
const statusFilter = ref('')
const provinceFilter = ref('')
const detailDialogVisible = ref(false)
const currentItem = ref(null)

const statusTypeMap = {
  pending: 'warning',
  approved: 'primary',
  transferring: 'success',
  completed: 'success',
  rejected: 'danger'
}

const statusTextMap = {
  pending: '待审核',
  approved: '已批准',
  transferring: '转移中',
  completed: '已完成',
  rejected: '已拒绝'
}

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  status: '',
  province: ''
})

const auditForm = reactive({
  opinion: ''
})

const transferList = ref([
  {
    id: 1,
    orderNo: 'ZY20240614001',
    wasteName: '废矿物油',
    hazardousCode: 'HW08',
    weight: 15.5,
    form: '液态',
    characteristic: '易燃性、毒性',
    fromProvince: '江苏省',
    fromEnterprise: '苏州钢铁集团',
    fromContact: '王经理',
    fromPhone: '138****1234',
    toProvince: '浙江省',
    toEnterprise: '杭州环保科技',
    toContact: '李总',
    toPhone: '139****5678',
    transporter: '安捷危险品运输',
    transportType: '公路运输',
    vehicleNo: '苏A·D12345',
    driver: '张师傅',
    route: '苏州 → 嘉兴 → 杭州',
    submitTime: '2024-06-14 09:30:25',
    planTime: '2024-06-18',
    status: 'pending',
    auditRecords: [
      { action: '提交申请', operator: '王经理', time: '2024-06-14 09:30:25', type: 'primary', opinion: '申请跨省转移废矿物油' }
    ],
    attachments: [
      { name: '危废经营许可证.pdf' },
      { name: '运输资质证明.pdf' },
      { name: '转移方案.docx' }
    ]
  },
  {
    id: 2,
    orderNo: 'ZY20240614002',
    wasteName: '电镀污泥',
    hazardousCode: 'HW17',
    weight: 8.2,
    form: '固态',
    characteristic: '毒性',
    fromProvince: '上海市',
    fromEnterprise: '上海电镀厂',
    fromContact: '陈工',
    fromPhone: '137****9012',
    toProvince: '江苏省',
    toEnterprise: '南通危废处理中心',
    toContact: '周主任',
    toPhone: '136****3456',
    transporter: '申联危化运输',
    transportType: '公路运输',
    vehicleNo: '沪B·E67890',
    driver: '刘师傅',
    route: '上海 → 南通',
    submitTime: '2024-06-14 10:15:42',
    planTime: '2024-06-20',
    status: 'approved',
    auditRecords: [
      { action: '提交申请', operator: '陈工', time: '2024-06-14 10:15:42', type: 'primary', opinion: '申请跨省转移电镀污泥' },
      { action: '审核通过', operator: '管理员', time: '2024-06-14 14:30:00', type: 'success', opinion: '材料齐全，同意转移' }
    ],
    attachments: [
      { name: '危废经营许可证.pdf' },
      { name: '环评报告.pdf' }
    ]
  },
  {
    id: 3,
    orderNo: 'ZY20240613003',
    wasteName: '废铅酸蓄电池',
    hazardousCode: 'HW49',
    weight: 25.0,
    form: '固态',
    characteristic: '毒性',
    fromProvince: '安徽省',
    fromEnterprise: '合肥新能源公司',
    fromContact: '赵经理',
    fromPhone: '135****7890',
    toProvince: '浙江省',
    toEnterprise: '宁波再生资源',
    toContact: '孙总',
    toPhone: '134****1122',
    transporter: '皖通危险品物流',
    transportType: '公路运输',
    vehicleNo: '皖A·F54321',
    driver: '黄师傅',
    route: '合肥 → 芜湖 → 杭州 → 宁波',
    submitTime: '2024-06-13 14:20:10',
    planTime: '2024-06-16',
    status: 'transferring',
    auditRecords: [
      { action: '提交申请', operator: '赵经理', time: '2024-06-13 14:20:10', type: 'primary', opinion: '申请跨省转移废蓄电池' },
      { action: '审核通过', operator: '管理员', time: '2024-06-13 16:00:00', type: 'success', opinion: '同意转移' },
      { action: '开始转移', operator: '黄师傅', time: '2024-06-15 08:30:00', type: 'success', opinion: '货物已装车出发' }
    ],
    attachments: [
      { name: '危废经营许可证.pdf' },
      { name: '运输路线方案.pdf' },
      { name: '应急预案.docx' }
    ]
  },
  {
    id: 4,
    orderNo: 'ZY20240612004',
    wasteName: '废有机溶剂',
    hazardousCode: 'HW42',
    weight: 5.6,
    form: '液态',
    characteristic: '毒性、易燃性',
    fromProvince: '山东省',
    fromEnterprise: '青岛化工园',
    fromContact: '吴主任',
    fromPhone: '133****3344',
    toProvince: '江苏省',
    toEnterprise: '苏州溶剂回收公司',
    toContact: '郑经理',
    toPhone: '132****5566',
    transporter: '鲁东危化运输',
    transportType: '公路运输',
    vehicleNo: '鲁B·G98765',
    driver: '马师傅',
    route: '青岛 → 日照 → 连云港 → 苏州',
    submitTime: '2024-06-12 08:30:00',
    planTime: '2024-06-14',
    status: 'completed',
    auditRecords: [
      { action: '提交申请', operator: '吴主任', time: '2024-06-12 08:30:00', type: 'primary', opinion: '申请跨省转移废有机溶剂' },
      { action: '审核通过', operator: '管理员', time: '2024-06-12 10:00:00', type: 'success', opinion: '材料齐全，同意' },
      { action: '开始转移', operator: '马师傅', time: '2024-06-13 07:00:00', type: 'success', opinion: '出发' },
      { action: '完成转移', operator: '郑经理', time: '2024-06-13 18:00:00', type: 'success', opinion: '货物已安全送达' }
    ],
    attachments: [
      { name: '危废经营许可证.pdf' },
      { name: '接收证明.pdf' }
    ]
  },
  {
    id: 5,
    orderNo: 'ZY20240611005',
    wasteName: '废油漆渣',
    hazardousCode: 'HW12',
    weight: 3.2,
    form: '固态',
    characteristic: '毒性、易燃性',
    fromProvince: '广东省',
    fromEnterprise: '佛山家具厂',
    fromContact: '林厂长',
    fromPhone: '131****7788',
    toProvince: '广东省',
    toEnterprise: '广州危废处理站',
    toContact: '何站长',
    toPhone: '130****9900',
    transporter: '粤发环保运输',
    transportType: '公路运输',
    vehicleNo: '粤A·H13579',
    driver: '廖师傅',
    route: '佛山 → 广州',
    submitTime: '2024-06-11 13:50:00',
    planTime: '2024-06-15',
    status: 'rejected',
    auditRecords: [
      { action: '提交申请', operator: '林厂长', time: '2024-06-11 13:50:00', type: 'primary', opinion: '申请省内转移废油漆渣' },
      { action: '审核拒绝', operator: '管理员', time: '2024-06-11 16:00:00', type: 'danger', opinion: '资质材料不全，缺少环评批复' }
    ],
    attachments: [
      { name: '营业执照.pdf' }
    ]
  },
  {
    id: 6,
    orderNo: 'ZY20240610006',
    wasteName: '废酸液',
    hazardousCode: 'HW34',
    weight: 12.0,
    form: '液态',
    characteristic: '腐蚀性',
    fromProvince: '江苏省',
    fromEnterprise: '南京钢铁厂',
    fromContact: '徐经理',
    fromPhone: '159****1234',
    toProvince: '山东省',
    toEnterprise: '济南酸再生公司',
    toContact: '高总',
    toPhone: '158****5678',
    transporter: '苏鲁化工物流',
    transportType: '公路运输',
    vehicleNo: '苏A·J24680',
    driver: '郭师傅',
    route: '南京 → 徐州 → 济南',
    submitTime: '2024-06-10 11:20:00',
    planTime: '2024-06-13',
    status: 'completed',
    auditRecords: [
      { action: '提交申请', operator: '徐经理', time: '2024-06-10 11:20:00', type: 'primary', opinion: '' },
      { action: '审核通过', operator: '管理员', time: '2024-06-10 14:00:00', type: 'success', opinion: '同意' },
      { action: '开始转移', operator: '郭师傅', time: '2024-06-12 06:00:00', type: 'success', opinion: '' },
      { action: '完成转移', operator: '高总', time: '2024-06-12 16:00:00', type: 'success', opinion: '货物验收合格' }
    ],
    attachments: [
      { name: '危废经营许可证.pdf' },
      { name: '运输合同.pdf' }
    ]
  }
])

const total = ref(32)

const filteredList = computed(() => {
  let list = transferList.value
  
  if (statusFilter.value) {
    list = list.filter(item => item.status === statusFilter.value)
  }
  
  if (provinceFilter.value) {
    list = list.filter(item =>
      item.fromProvince.includes(provinceFilter.value) ||
      item.toProvince.includes(provinceFilter.value)
    )
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(item =>
      item.orderNo.toLowerCase().includes(keyword) ||
      item.wasteName.toLowerCase().includes(keyword)
    )
  }
  
  return list
})

const handleSearch = () => {
  queryParams.keyword = searchKeyword.value
  queryParams.status = statusFilter.value
  queryParams.province = provinceFilter.value
  queryParams.page = 1
}

const handleReset = () => {
  searchKeyword.value = ''
  statusFilter.value = ''
  provinceFilter.value = ''
  queryParams.page = 1
}

const handleDetail = (row) => {
  currentItem.value = row
  auditForm.opinion = ''
  detailDialogVisible.value = true
}

const handleAudit = (row) => {
  currentItem.value = row
  auditForm.opinion = ''
  detailDialogVisible.value = true
}

const confirmApprove = async () => {
  try {
    await ElMessageBox.confirm(
      '确定批准该跨省转移联单吗？',
      '批准确认',
      {
        confirmButtonText: '确认批准',
        cancelButtonText: '取消',
        type: 'success'
      }
    )
    const item = transferList.value.find(item => item.id === currentItem.value.id)
    if (item) {
      item.status = 'approved'
      item.auditRecords.push({
        action: '审核通过',
        operator: '管理员',
        time: new Date().toLocaleString(),
        type: 'success',
        opinion: auditForm.opinion || '材料齐全，同意转移'
      })
    }
    if (currentItem.value) currentItem.value.status = 'approved'
    detailDialogVisible.value = false
    ElMessage.success('已批准转移联单')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const confirmReject = async () => {
  if (!auditForm.opinion.trim()) {
    ElMessage.warning('请填写拒绝意见')
    return
  }
  try {
    await ElMessageBox.confirm(
      '确定拒绝该跨省转移联单吗？',
      '拒绝确认',
      {
        confirmButtonText: '确认拒绝',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const item = transferList.value.find(item => item.id === currentItem.value.id)
    if (item) {
      item.status = 'rejected'
      item.auditRecords.push({
        action: '审核拒绝',
        operator: '管理员',
        time: new Date().toLocaleString(),
        type: 'danger',
        opinion: auditForm.opinion
      })
    }
    if (currentItem.value) currentItem.value.status = 'rejected'
    detailDialogVisible.value = false
    ElMessage.success('已拒绝转移联单')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const handleSizeChange = (val) => {
  queryParams.pageSize = val
  queryParams.page = 1
}

const handleCurrentChange = (val) => {
  queryParams.page = val
}
</script>

<style scoped>
.transfer-order-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-card {
  border-radius: 12px;
}

.header-card :deep(.el-card__body) {
  padding: 20px 24px 0;
}

.card-header-wrapper {
  margin-bottom: 16px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  display: block;
  margin-bottom: 4px;
}

.card-subtitle {
  font-size: 13px;
  color: #909399;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
}

.filter-left {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-right {
  display: flex;
  gap: 10px;
}

.table-card {
  border-radius: 12px;
}

.table-card :deep(.el-card__body) {
  padding: 16px 20px 20px;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  padding-bottom: 16px;
  border-bottom: 1px dashed #e0e0e0;
}

.detail-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid #409eff;
}

.section-title .el-icon {
  color: #409eff;
}

.transfer-info-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.transfer-card {
  flex: 1;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
}

.transfer-card.from {
  background: #fff7e6;
  border-color: #ffd591;
}

.transfer-card.to {
  background: #f0f9ff;
  border-color: #91d5ff;
}

.transfer-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.transfer-province {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.transfer-enterprise {
  font-size: 14px;
  color: #606266;
  margin-bottom: 6px;
}

.transfer-contact {
  font-size: 12px;
  color: #909399;
}

.transfer-arrow {
  color: #c0c4cc;
  flex-shrink: 0;
}

.audit-record {
  padding: 4px 0;
}

.record-action {
  font-weight: 600;
  color: #303133;
  margin-right: 12px;
}

.record-operator {
  font-size: 13px;
  color: #909399;
}

.record-opinion {
  margin: 6px 0 0 0;
  font-size: 13px;
  color: #606266;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.attachments {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #f5f7fa;
  border-radius: 6px;
}

.file-icon {
  color: #409eff;
  font-size: 18px;
}

.file-name {
  flex: 1;
  font-size: 14px;
  color: #606266;
}

.audit-form-section {
  padding-top: 4px;
}
</style>
