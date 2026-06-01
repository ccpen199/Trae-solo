import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AgentProfile, CustomerProfile, EmailTemplate, VariableField } from '../types';
import { useAuthStore } from '../store/authStore';

export default function EmailGeneration() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [variables, setVariables] = useState<VariableField[]>([]);
  const [formData, setFormData] = useState({
    agent_id: 1,
    customer_id: 1,
    template_id: 1,
    variableValues: {} as Record<string, string>,
  });
  const [preview, setPreview] = useState<{ subject: string; content: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedId, setGeneratedId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const template = templates.find((t) => t.id === formData.template_id);
    if (template) {
      let subject = template.subject;
      let content = template.content.replace(/\\n/g, '\n');

      for (const [key, value] of Object.entries(formData.variableValues)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, value || '');
        content = content.replace(regex, value || '');
      }

      setPreview({ subject, content });
    }
  }, [formData.template_id, formData.variableValues, templates]);

  const loadData = async () => {
    try {
      const [agentsRes, customersRes, templatesRes, variablesRes] = await Promise.all([
        api.get('/agents?status=active'),
        api.get('/customers?status=active'),
        api.get('/templates?status=approved'),
        api.get('/variables?status=active'),
      ]);

      setAgents(agentsRes.data.data || []);
      setCustomers(customersRes.data.data || []);
      setTemplates(templatesRes.data.data || []);
      setVariables(variablesRes.data || []);

      if (agentsRes.data.data?.length > 0) {
        setFormData((prev) => ({ ...prev, agent_id: agentsRes.data.data[0].id }));
      }
      if (customersRes.data.data?.length > 0) {
        setFormData((prev) => ({ ...prev, customer_id: customersRes.data.data[0].id }));
      }
      if (templatesRes.data.data?.length > 0) {
        setFormData((prev) => ({ ...prev, template_id: templatesRes.data.data[0].id }));
      }
    } catch (err) {
      console.error('Load data error:', err);
    }
  };

  const handleVariableChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      variableValues: { ...prev.variableValues, [key]: value },
    }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await api.post('/email-generations', {
        agent_id: formData.agent_id,
        customer_id: formData.customer_id,
        template_id: formData.template_id,
        variables: formData.variableValues,
      });

      setGeneratedId(res.data.id);
      setSuccess(res.data.message);

      const detailRes = await api.get(`/email-generations/${res.data.id}`);
      setPreview({
        subject: detailRes.data.subject,
        content: detailRes.data.content,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || '生成邮件失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!generatedId) return;
    try {
      await api.post(`/email-generations/${generatedId}/approve`);
      setSuccess('邮件已审核通过');
    } catch (err: any) {
      setError(err.response?.data?.error || '审核失败');
    }
  };

  const handleSend = async () => {
    if (!generatedId) return;
    setLoading(true);
    try {
      await api.post(`/email-generations/${generatedId}/send`);
      setSuccess('邮件发送成功！');
      setTimeout(() => navigate('/emails'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || '发送失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">生成销售邮件</h1>

      <div className="grid-2">
        <div className="card">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-group">
            <label>选择 Agent</label>
            <select
              value={formData.agent_id}
              onChange={(e) => setFormData({ ...formData, agent_id: parseInt(e.target.value) })}
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>选择客户</label>
            <select
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: parseInt(e.target.value) })}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.company} {c.is_sensitive ? '(敏感)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>选择模板</label>
            <select
              value={formData.template_id}
              onChange={(e) => setFormData({ ...formData, template_id: parseInt(e.target.value) })}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <h3 style={{ margin: '20px 0 16px', fontSize: 16 }}>变量填充</h3>
          {variables.map((v) => (
            <div key={v.id} className="form-group">
              <label>
                {v.name} {Boolean(v.required) && <span style={{ color: 'red' }}>*</span>}
              </label>
              <input
                type="text"
                value={formData.variableValues[v.key] || ''}
                onChange={(e) => handleVariableChange(v.key, e.target.value)}
                placeholder={v.description}
              />
            </div>
          ))}

          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
              {loading ? '生成中...' : '生成邮件'}
            </button>
            {generatedId && user?.permissions?.includes('email:approve') && (
              <button className="btn btn-success" onClick={handleApprove}>
                审核通过
              </button>
            )}
            {generatedId && (
              <button className="btn btn-success" onClick={handleSend} disabled={loading}>
                发送邮件
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>邮件预览</h3>
          {preview ? (
            <div>
              <div className="form-group">
                <label>主题</label>
                <div style={{ padding: '8px 0', fontWeight: 500 }}>{preview.subject}</div>
              </div>
              <div className="form-group">
                <label>内容</label>
                <div className="preview-box" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {preview.content}
                </div>
              </div>
            </div>
          ) : (
            <div className="loading">填写变量后点击「生成邮件」预览内容</div>
          )}
        </div>
      </div>
    </div>
  );
}
