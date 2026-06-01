import React, { useState, useEffect } from 'react';
import { questionnairesAPI } from '../api.js';

function Questionnaires() {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    category: '环境',
    question_text: '',
    weight: 1,
    scoring_rule: '',
    max_score: 10,
    requires_evidence: true
  });

  useEffect(() => {
    loadQuestionnaires();
  }, []);

  const loadQuestionnaires = async () => {
    try {
      const res = await questionnairesAPI.getAll();
      setQuestionnaires(res.data);
    } catch (error) {
      console.error('加载问卷失败:', error);
    }
  };

  const loadQuestions = async (questionnaireId) => {
    try {
      const res = await questionnairesAPI.getQuestions(questionnaireId);
      setQuestions(res.data);
      setSelectedQuestionnaire(questionnaires.find(q => q.id === questionnaireId));
    } catch (error) {
      console.error('加载问题失败:', error);
    }
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    try {
      if (editingQuestion) {
        await questionnairesAPI.updateQuestion(editingQuestion.id, questionForm);
      } else {
        await questionnairesAPI.createQuestion(selectedQuestionnaire.id, questionForm);
      }
      setShowQuestionModal(false);
      loadQuestions(selectedQuestionnaire.id);
      resetQuestionForm();
    } catch (error) {
      console.error('保存问题失败:', error);
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setQuestionForm(question);
    setShowQuestionModal(true);
  };

  const handleDeleteQuestion = async (id) => {
    if (confirm('确定删除该问题吗？')) {
      try {
        await questionnairesAPI.deleteQuestion(id);
        loadQuestions(selectedQuestionnaire.id);
      } catch (error) {
        console.error('删除失败:', error);
      }
    }
  };

  const resetQuestionForm = () => {
    setEditingQuestion(null);
    setQuestionForm({
      category: '环境',
      question_text: '',
      weight: 1,
      scoring_rule: '',
      max_score: 10,
      requires_evidence: true
    });
  };

  const groupedQuestions = questions.reduce((acc, q) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(q);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <h1>问卷配置</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '20px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>问卷列表</h3>
          {questionnaires.map(q => (
            <div key={q.id}
              style={{
                padding: '12px',
                marginBottom: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                background: selectedQuestionnaire?.id === q.id ? '#dbeafe' : '#f9fafb',
                border: selectedQuestionnaire?.id === q.id ? '1px solid #3b82f6' : '1px solid #e5e7eb'
              }}
              onClick={() => loadQuestions(q.id)}>
              <div style={{ fontWeight: 500 }}>{q.name}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{q.version}</div>
            </div>
          ))}
        </div>

        <div>
          {selectedQuestionnaire ? (
            <>
              <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3>{selectedQuestionnaire.name}</h3>
                    <div style={{ color: '#6b7280' }}>{selectedQuestionnaire.description}</div>
                  </div>
                  <button className="btn btn-primary" onClick={() => { resetQuestionForm(); setShowQuestionModal(true); }}>
                    + 新增问题
                  </button>
                </div>
              </div>

              {Object.entries(groupedQuestions).map(([category, categoryQuestions]) => (
                <div key={category} className="card" style={{ marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '16px', color: '#3b82f6' }}>{category}</h4>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>问题</th>
                        <th>权重</th>
                        <th>满分</th>
                        <th>需证据</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryQuestions.map(q => (
                        <tr key={q.id}>
                          <td>{q.question_text}</td>
                          <td>{q.weight}</td>
                          <td>{q.max_score}</td>
                          <td>{q.requires_evidence ? '是' : '否'}</td>
                          <td>
                            <button className="btn btn-default" style={{ padding: '4px 8px', fontSize: '12px', marginRight: '4px' }}
                              onClick={() => handleEditQuestion(q)}>
                              编辑
                            </button>
                            <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '12px' }}
                              onClick={() => handleDeleteQuestion(q.id)}>
                              删除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              请从左侧选择一个问卷查看详情
            </div>
          )}
        </div>
      </div>

      {showQuestionModal && (
        <div className="modal-overlay" onClick={() => setShowQuestionModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingQuestion ? '编辑问题' : '新增问题'}</h3>
              <button className="close-btn" onClick={() => setShowQuestionModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveQuestion}>
              <div className="modal-body">
                <div className="form-group">
                  <label>类别</label>
                  <select className="form-control"
                    value={questionForm.category}
                    onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}>
                    <option value="环境">环境</option>
                    <option value="劳工">劳工</option>
                    <option value="安全">安全</option>
                    <option value="治理">治理</option>
                    <option value="碳排">碳排</option>
                    <option value="合规">合规</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>问题内容 *</label>
                  <textarea className="form-control" rows="3" required
                    value={questionForm.question_text}
                    onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>权重</label>
                    <input type="number" className="form-control" min="0.5" step="0.5"
                      value={questionForm.weight}
                      onChange={(e) => setQuestionForm({ ...questionForm, weight: parseFloat(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label>满分</label>
                    <input type="number" className="form-control" min="1"
                      value={questionForm.max_score}
                      onChange={(e) => setQuestionForm({ ...questionForm, max_score: parseInt(e.target.value) })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>评分规则</label>
                  <textarea className="form-control" rows="2"
                    value={questionForm.scoring_rule}
                    onChange={(e) => setQuestionForm({ ...questionForm, scoring_rule: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>
                    <input type="checkbox"
                      checked={questionForm.requires_evidence}
                      onChange={(e) => setQuestionForm({ ...questionForm, requires_evidence: e.target.checked })} />
                    &nbsp;需要证据支持
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowQuestionModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Questionnaires;
