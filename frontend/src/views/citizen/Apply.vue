<template>
  <div class="citizen-apply">
    <div class="card">
      <div class="card-header">
        <h2>办理事项</h2>
      </div>
      <div class="card-body">
        <div v-if="!currentApplicant" class="alert alert-warning">
          <strong>请先确认身份</strong> 请先返回群众端首页完成身份确认
        </div>

        <div v-if="currentApplicant">
          <h3>可办理的事项</h3>
          <div class="service-list">
            <div
              v-for="item in serviceItems"
              :key="item.id"
              class="service-item"
              :class="{ active: selectedService === item.id }"
              @click="selectService(item)"
            >
              <div class="service-info">
                <h4>{{ item.name }}</h4>
                <p class="dept">{{ item.department }}</p>
                <p class="desc">{{ item.description }}</p>
              </div>
              <div class="service-action">
                <span class="arrow">→</span>
              </div>
            </div>
          </div>

          <div v-if="reusableMaterials.length > 0" class="material-analysis">
            <h3>材料复用分析</h3>
            <div v-if="reuseCount > 0" class="alert alert-success">
              发现 {{ reuseCount }} 份可复用材料，将为您减少重复提交
            </div>
            
            <table class="material-table">
              <thead>
                <tr>
                  <th>材料名称</th>
                  <th>使用方式</th>
                  <th>复用依据</th>
                  <th>关联文件</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mat in reusableMaterials" :key="mat.material_type_id">
                  <td>{{ mat.name }}</td>
                  <td>
                    <span :class="'tag tag-' + getUsageType(mat)">
                      {{ getUsageText(mat) }}
                    </span>
                  </td>
                  <td>
                    <span v-if="mat.can_reuse">{{ mat.reuse_reason }}</span>
                    <span v-else-if="mat.need_update">{{ mat.reuse_reason }}</span>
                    <span class="text-gray">需新提交</span>
                  </td>
                  <td>
                    <span v-if="mat.material_file_name">{{ mat.material_file_name }}</span>
                    <span class="text-gray">-</span>
                  </td>
                  <td>
                    <div v-if="!mat.can_reuse">
                      <label class="file-upload">
                        <input type="file" @change="(e) => handleFileChange(mat, e)" accept=".pdf,.jpg,.jpeg,.png" />
                        <span class="btn btn-small btn-primary">上传</span>
                      </label>
                    </div>
                    <span v-else class="text-success">已复用</span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="submit-section">
              <button class="btn btn-primary btn-large" @click="submitApplication">
                提交申请
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api'

const serviceItems = ref([])
const selectedService = ref(null)
const reusableMaterials = ref([])
const uploadedFiles = ref({})
const currentApplicant = ref(null)

const getCurrentApplicant = () => {
  const saved = localStorage.getItem('currentApplicant')
  if (saved) {
    currentApplicant.value = JSON.parse(saved)
  }
  return currentApplicant.value
}

const loadServiceItems = async () => {
  try {
    const res = await api.getServiceItems()
    serviceItems.value = res.data
  } catch (err) {
    alert('加载事项列表失败：' + err.message)
  }
}

const selectService = async (item) => {
  const applicant = getCurrentApplicant()
  if (!applicant) {
    alert('请先在群众端首页确认身份')
    return
  }

  selectedService.value = item.id

  try {
    const res = await api.checkReusableMaterials({
      applicant_id: applicant.id,
      service_item_id: item.id
    })
    reusableMaterials.value = res.data
  } catch (err) {
    alert('材料分析失败：' + err.message)
  }
}

const handleFileChange = (row, e) => {
  if (e.target.files && e.target.files[0]) {
    uploadedFiles.value[row.material_type_id] = e.target.files[0]
  }
}

const submitApplication = async () => {
  const applicant = getCurrentApplicant()
  if (!applicant) {
    alert('请先确认身份')
    return
  }

  const needsUpload = reusableMaterials.value.filter(m => !m.can_reuse && !uploadedFiles.value[m.material_type_id])
  if (needsUpload.length > 0) {
    alert('请上传所有必需的新材料')
    return
  }

  try {
    const materials = []
    
    for (const mat of reusableMaterials.value) {
      if (mat.can_reuse) {
        materials.push({
          material_id: mat.material_id,
          material_type_id: mat.material_type_id,
          usage_type: mat.usage_type,
          reuse_reason: mat.reuse_reason
        })
      } else if (uploadedFiles.value[mat.material_type_id]) {
        const formData = new FormData()
        formData.append('file', uploadedFiles.value[mat.material_type_id])
        formData.append('applicant_id', applicant.id)
        formData.append('material_type_id', mat.material_type_id)
        formData.append('source_service_item_id', selectedService.value)
        formData.append('source', 'apply')
        
        const uploadRes = await api.uploadMaterial(formData)
        materials.push({
          material_id: uploadRes.data.id,
          material_type_id: mat.material_type_id,
          usage_type: 'new',
          reuse_reason: ''
        })
      }
    }

    await api.createApplication({
      applicant_id: applicant.id,
      service_item_id: selectedService.value,
      materials
    })

    alert('申请提交成功！')
    reusableMaterials.value = []
    selectedService.value = null
  } catch (err) {
    alert('提交失败：' + err.message)
  }
}

const reuseCount = computed(() => 
  reusableMaterials.value.filter(m => m.can_reuse).length
)

const getUsageType = (row) => {
  if (row.usage_type === 'reuse') return 'success'
  if (row.usage_type === 'renew' || row.usage_type === 'resign') return 'warning'
  return 'info'
}

const getUsageText = (row) => {
  const map = {
    reuse: '可复用',
    renew: '需更新',
    resign: '需重签',
    new: '新提交'
  }
  return map[row.usage_type] || row.usage_type
}

onMounted(() => {
  getCurrentApplicant()
  loadServiceItems()
})
</script>

<style scoped>
.citizen-apply {
  padding: 20px;
}
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  overflow: hidden;
}
.card-header {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}
.card-header h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}
.card-body {
  padding: 20px;
}
.alert {
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 20px;
}
.alert-warning {
  background: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #faecd8;
}
.alert-success {
  background: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}
h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  color: #303133;
}
.service-list {
  display: grid;
  gap: 15px;
  margin-bottom: 30px;
}
.service-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}
.service-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
}
.service-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}
.service-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}
.service-info .dept {
  margin: 0 0 4px 0;
  color: #909399;
  font-size: 13px;
}
.service-info .desc {
  margin: 0;
  color: #606266;
  font-size: 14px;
}
.arrow {
  font-size: 24px;
  color: #c0c4cc;
}
.material-analysis {
  padding-top: 30px;
  border-top: 1px solid #ebeef5;
}
.material-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}
.material-table th,
.material-table td {
  padding: 12px;
  border: 1px solid #ebeef5;
  text-align: left;
}
.material-table th {
  background: #f5f7fa;
  font-weight: 600;
  color: #606266;
}
.tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}
.tag-success {
  background: #f0f9eb;
  color: #67c23a;
}
.tag-warning {
  background: #fdf6ec;
  color: #e6a23c;
}
.tag-info {
  background: #f4f4f5;
  color: #909399;
}
.text-gray {
  color: #909399;
}
.text-success {
  color: #67c23a;
}
.file-upload {
  position: relative;
  display: inline-block;
}
.file-upload input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}
.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}
.btn-large {
  padding: 12px 32px;
  font-size: 16px;
}
.btn-primary {
  background: #409eff;
  color: white;
}
.btn-primary:hover {
  background: #66b1ff;
}
.submit-section {
  margin-top: 30px;
  text-align: center;
}
</style>
