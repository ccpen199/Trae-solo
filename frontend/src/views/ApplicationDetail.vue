<template>
  <div v-if="app">
    <div class="page-card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2 class="page-title" style="margin:0">{{ app.app_name }} <span class="muted">({{ app.app_code }})</span></h2>
          <div class="muted" style="margin-top:4px">
            责任人：{{ app.owner || '-' }} | 分类：{{ app.category || '-' }} | 状态：{{ app.status }} |
            <el-button link type="primary" @click="$router.push('/applications')">← 返回列表</el-button>
          </div>
        </div>
      </div>
    </div>

    <el-tabs v-model="tab">
      <el-tab-pane label="环境" name="env">
        <div class="page-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3 class="page-title" style="margin:0">环境列表</h3>
            <el-button type="primary" size="small" @click="envDialog = true">新增环境</el-button>
          </div>
          <el-divider />
          <el-table :data="app.environments" size="small" stripe>
            <el-table-column prop="env_name" label="环境名" width="140" />
            <el-table-column prop="env_type" label="类型" width="100">
              <template #default="{ row }"><el-tag size="small">{{ row.env_type }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="base_url" label="Base URL" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status }}</el-tag></template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button link type="danger" @click="removeEnv(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="配置" name="config">
        <div class="page-card">
          <el-table :data="app.configs" size="small" stripe>
            <el-table-column prop="config_key" label="键" width="160" />
            <el-table-column prop="config_value" label="值" show-overflow-tooltip />
            <el-table-column prop="category" label="分类" width="100" />
            <el-table-column prop="value_type" label="类型" width="80" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="version_no" label="版本" width="70" />
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="版本" name="version">
        <div class="page-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3 class="page-title" style="margin:0">版本历史</h3>
            <el-button type="primary" size="small" @click="verDialog = true">新增版本</el-button>
          </div>
          <el-divider />
          <el-table :data="app.versions" size="small" stripe>
            <el-table-column prop="version" label="版本号" width="140" />
            <el-table-column prop="changelog" label="变更说明" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }"><el-tag size="small">{{ row.status }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="published_by" label="发布人" width="120" />
            <el-table-column prop="published_at" label="发布时间" width="180" />
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="密钥" name="secret">
        <div class="page-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3 class="page-title" style="margin:0">密钥管理</h3>
            <el-button type="primary" size="small" @click="secDialog = true">新增密钥</el-button>
          </div>
          <el-divider />
          <el-table :data="app.secrets" size="small" stripe>
            <el-table-column prop="key_name" label="键名" width="200" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="expiry" label="有效期" width="180" />
            <el-table-column prop="created_by" label="创建人" width="120" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button link type="danger" @click="removeSecret(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="envDialog" title="新增环境" width="460px">
      <el-form :model="envForm" label-width="80px">
        <el-form-item label="环境名"><el-input v-model="envForm.env_name" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="envForm.env_type" style="width:100%">
            <el-option label="dev" value="dev" /><el-option label="staging" value="staging" /><el-option label="prod" value="prod" />
          </el-select>
        </el-form-item>
        <el-form-item label="Base URL"><el-input v-model="envForm.base_url" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="envForm.status"><el-option label="active" value="active" /><el-option label="inactive" value="inactive" /></el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="envDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEnv">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="verDialog" title="新增版本" width="460px">
      <el-form :model="verForm" label-width="80px">
        <el-form-item label="版本号"><el-input v-model="verForm.version" placeholder="如 1.2.3" /></el-form-item>
        <el-form-item label="变更说明"><el-input v-model="verForm.changelog" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="制品"><el-input v-model="verForm.artifact" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="verForm.status"><el-option label="draft" value="draft" /><el-option label="published" value="published" /></el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="verDialog = false">取消</el-button>
        <el-button type="primary" @click="saveVer">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="secDialog" title="新增密钥" width="460px">
      <el-form :model="secForm" label-width="80px">
        <el-form-item label="环境"><el-select v-model="secForm.env_id" style="width:100%" clearable>
          <el-option v-for="e in app.environments" :key="e.id" :label="e.env_name" :value="e.id" />
        </el-select></el-form-item>
        <el-form-item label="键名"><el-input v-model="secForm.key_name" /></el-form-item>
        <el-form-item label="值"><el-input v-model="secForm.value" type="password" show-password /></el-form-item>
        <el-form-item label="描述"><el-input v-model="secForm.description" /></el-form-item>
        <el-form-item label="有效期"><el-input v-model="secForm.expiry" placeholder="YYYY-MM-DD" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="secDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSec">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { AppAPI } from '../api'

const route = useRoute()
const app = ref(null)
const tab = ref('env')
const envDialog = ref(false)
const verDialog = ref(false)
const secDialog = ref(false)
const envForm = ref({ env_name: '', env_type: 'dev', base_url: '', status: 'active' })
const verForm = ref({ version: '', changelog: '', artifact: '', status: 'draft' })
const secForm = ref({ env_id: null, key_name: '', value: '', description: '', expiry: '' })

async function load() {
  const res = await AppAPI.get(route.params.id)
  if (res?.code === 0) app.value = res.data
}
onMounted(load)

async function saveEnv() {
  if (!envForm.value.env_name) return ElMessage.warning('环境名必填')
  const res = await AppAPI.createEnv(route.params.id, envForm.value)
  if (res?.code === 0) { ElMessage.success('新增成功'); envDialog.value = false; load() }
}
async function removeEnv(row) {
  try { await ElMessageBox.confirm(`确定删除环境 ${row.env_name}？`, '提示', { type: 'warning' })
    const res = await AppAPI.removeEnv(row.id)
    if (res?.code === 0) { ElMessage.success('删除成功'); load() }
  } catch (e) {}
}
async function saveVer() {
  if (!verForm.value.version) return ElMessage.warning('版本号必填')
  const res = await AppAPI.createVersion(route.params.id, verForm.value)
  if (res?.code === 0) { ElMessage.success('新增成功'); verDialog.value = false; load() }
}
async function saveSec() {
  if (!secForm.value.key_name || !secForm.value.value) return ElMessage.warning('键名和值必填')
  const res = await AppAPI.createSecret(route.params.id, secForm.value)
  if (res?.code === 0) { ElMessage.success('新增成功'); secDialog.value = false; load() }
}
async function removeSecret(row) {
  try { await ElMessageBox.confirm('确定删除此密钥？', '提示', { type: 'warning' })
    const res = await AppAPI.removeSecret(row.id)
    if (res?.code === 0) { ElMessage.success('删除成功'); load() }
  } catch (e) {}
}
</script>
