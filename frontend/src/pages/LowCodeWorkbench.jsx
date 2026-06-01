import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import FormDesigner from '../components/FormDesigner';
import DataModelEditor from '../components/DataModelEditor';
import FormRenderer from '../components/FormRenderer';

function LowCodeWorkbench() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('forms');
  const [forms, setForms] = useState([]);
  const [models, setModels] = useState([]);
  const [flows, setFlows] = useState([]);
  const [pages, setPages] = useState([]);
  const [designingForm, setDesigningForm] = useState(null);
  const [editingModel, setEditingModel] = useState(null);
  const [previewForm, setPreviewForm] = useState(null);
  const [showFormData, setShowFormData] = useState(false);
  const [formDataList, setFormDataList] = useState([]);
  const [application, setApplication] = useState(null);

  useEffect(() => {
    loadAppDetail();
    loadForms();
    loadModels();
    loadFlows();
    loadPages();
  }, [appId]);

  const loadAppDetail = async () => {
    try {
      const res = await api.get(`/applications/${appId}`);
      setApplication(res.data);
    } catch (err) {
      console.error('加载应用失败', err);
    }
  };

  const loadForms = async () => {
    try {
      const res = await api.get(`/lowcode/apps/${appId}/forms`);
      setForms(res.data);
    } catch (err) {
      console.error('加载表单失败', err);
    }
  };

  const loadModels = async () => {
    try {
      const res = await api.get(`/lowcode/apps/${appId}/models`);
      setModels(res.data);
    } catch (err) {
      console.error('加载模型失败', err);
    }
  };

  const loadFlows = async () => {
    try {
      const res = await api.get(`/lowcode/apps/${appId}/flows`);
      setFlows(res.data);
    } catch (err) {
      console.error('加载流程失败', err);
    }
  };

  const loadPages = async () => {
    try {
      const res = await api.get(`/lowcode/apps/${appId}/pages`);
      setPages(res.data);
    } catch (err) {
      console.error('加载页面失败', err);
    }
  };

  const handleDeleteForm = async (formId) => {
    if (!confirm('确定删除此表单？')) return;
    try {
      await api.delete(`/lowcode/apps/${appId}/forms/${formId}`);
      loadForms();
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleDeleteModel = async (modelId) => {
    if (!confirm('确定删除此数据模型？')) return;
    try {
      await api.delete(`/lowcode/apps/${appId}/models/${modelId}`);
      loadModels();
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleLoadFormData = async (formId) => {
    try {
      const res = await api.get(`/lowcode/forms/${formId}/data`);
      setFormDataList(res.data.list);
      setShowFormData(true);
      setPreviewForm(formId);
    } catch (err) {
      console.error('加载表单数据失败', err);
    }
  };

  if (designingForm !== null) {
    return (
      <div style={{ padding: 16 }}>
        <FormDesigner
          appId={appId}
          formId={designingForm}
          onSave={() => { setDesigningForm(null); loadForms(); }}
          onBack={() => setDesigningForm(null)}
        />
      </div>
    );
  }

  if (editingModel !== null) {
    return (
      <div style={{ padding: 16 }}>
        <DataModelEditor
          appId={appId}
          modelId={editingModel}
          onSave={() => { setEditingModel(null); loadModels(); }}
          onBack={() => setEditingModel(null)}
        />
      </div>
    );
  }

  if (previewForm !== null && !showFormData) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <button className="btn btn-default" onClick={() => setPreviewForm(null)}>← 返回</button>
        </div>
        <FormRenderer
          appId={appId}
          formId={previewForm}
          onSubmit={() => setPreviewForm(null)}
        />
      </div>
    );
  }

  if (showFormData && previewForm) {
    const form = forms.find(f => f.id === previewForm);
    return (
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <button className="btn btn-default" onClick={() => { setShowFormData(false); setPreviewForm(null); }}>← 返回</button>
          <h2 style={{ margin: 0 }}>{form?.form_name} - 数据列表</h2>
        </div>
        <div className="card">
          {formDataList.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p>暂无数据</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>数据预览</th>
                  <th>提交人</th>
                  <th>提交时间</th>
                </tr>
              </thead>
              <tbody>
                {formDataList.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {JSON.stringify(item.form_data)}
                    </td>
                    <td>{item.creator_name}</td>
                    <td>{item.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn btn-default" onClick={() => navigate('/applications')}>← 返回应用列表</button>
          <h2 style={{ margin: 0 }}>
            🛠️ 低代码工作台 - {application?.app_name || appId}
          </h2>
        </div>
      </div>

      <div className="form-builder-tabs">
        <div
          className={`form-builder-tab ${activeTab === 'forms' ? 'active' : ''}`}
          onClick={() => setActiveTab('forms')}
        >
          📝 表单管理 ({forms.length})
        </div>
        <div
          className={`form-builder-tab ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => setActiveTab('models')}
        >
          📊 数据模型 ({models.length})
        </div>
        <div
          className={`form-builder-tab ${activeTab === 'flows' ? 'active' : ''}`}
          onClick={() => setActiveTab('flows')}
        >
          🔄 流程设计 ({flows.length})
        </div>
        <div
          className={`form-builder-tab ${activeTab === 'pages' ? 'active' : ''}`}
          onClick={() => setActiveTab('pages')}
        >
          📄 页面配置 ({pages.length})
        </div>
      </div>

      {activeTab === 'forms' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>表单列表</h3>
            <button className="btn btn-primary" onClick={() => setDesigningForm(0)}>+ 新建表单</button>
          </div>
          {forms.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <p>暂无表单，点击右上角创建第一个表单</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>表单名称</th>
                  <th>表单编码</th>
                  <th>状态</th>
                  <th>版本</th>
                  <th>创建人</th>
                  <th>更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((form) => (
                  <tr key={form.id}>
                    <td>{form.form_name}</td>
                    <td>{form.form_code}</td>
                    <td>
                      <span className={`status-badge status-${form.status}`}>
                        {form.status === 'published' ? '已发布' : '草稿'}
                      </span>
                    </td>
                    <td>v{form.version}</td>
                    <td>{form.creator_name}</td>
                    <td>{form.updated_at}</td>
                    <td>
                      <button className="btn btn-default" style={{ marginRight: 8 }} onClick={() => setDesigningForm(form.id)}>编辑</button>
                      <button className="btn btn-primary" style={{ marginRight: 8 }} onClick={() => setPreviewForm(form.id)}>预览</button>
                      <button className="btn btn-success" style={{ marginRight: 8 }} onClick={() => handleLoadFormData(form.id)}>数据</button>
                      <button className="btn btn-danger" onClick={() => handleDeleteForm(form.id)}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'models' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>数据模型</h3>
            <button className="btn btn-primary" onClick={() => setEditingModel(0)}>+ 新建模型</button>
          </div>
          {models.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <p>暂无数据模型，点击右上角创建第一个模型</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>模型名称</th>
                  <th>模型编码</th>
                  <th>字段数</th>
                  <th>状态</th>
                  <th>版本</th>
                  <th>创建人</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.id}>
                    <td>{model.model_name}</td>
                    <td>{model.model_code}</td>
                    <td>{model.fields?.length || 0} 个字段</td>
                    <td>
                      <span className={`status-badge status-${model.status}`}>
                        {model.status === 'published' ? '已发布' : '草稿'}
                      </span>
                    </td>
                    <td>v{model.version}</td>
                    <td>{model.creator_name}</td>
                    <td>
                      <button className="btn btn-default" style={{ marginRight: 8 }} onClick={() => setEditingModel(model.id)}>编辑</button>
                      <button className="btn btn-danger" onClick={() => handleDeleteModel(model.id)}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'flows' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>流程设计</h3>
            <button className="btn btn-primary" onClick={() => alert('流程设计器开发中...')}>+ 新建流程</button>
          </div>
          <div className="empty-state">
            <div className="empty-state-icon">🔄</div>
            <p>流程设计器开发中，敬请期待</p>
          </div>
        </div>
      )}

      {activeTab === 'pages' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>页面配置</h3>
            <button className="btn btn-primary" onClick={() => alert('页面配置开发中...')}>+ 新建页面</button>
          </div>
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <p>页面配置开发中，敬请期待</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default LowCodeWorkbench;
