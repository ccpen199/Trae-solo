import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api.js';
import JobCard from '../components/JobCard.jsx';

const COMMON_SKILLS = ['电工', '焊工', '叉车司机', '搬运工', '包装工', '厨师', '服务员', '保安', '快递员', '家政', '装修工', '木工', '水电工', '司机', '仓管员', '质检员', '普工', '技工', '销售', '客服'];

const WORK_TYPES = ['全职', '兼职', '临时工', '日结', '钟点工'];

function JobListPage({ user }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    salaryMin: '',
    salaryMax: '',
    skills: [],
    workType: '',
    availableDate: '',
    commuteRadius: ''
  });
  const [sortBy, setSortBy] = useState('match');
  const [skillInput, setSkillInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    fetchJobs();
  }, [pagination.page, sortBy, filters]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortBy,
        ...filters
      });
      if (filters.skills.length > 0) {
        filters.skills.forEach(s => params.append('skills', s));
      }
      const res = await api.get(`/jobs?${params}`);
      setJobs(res.data.jobs);
      setPagination(p => ({ ...p, total: res.data.total }));
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    fetchJobs();
  };

  const handleReset = () => {
    setFilters({
      keyword: '',
      location: '',
      salaryMin: '',
      salaryMax: '',
      skills: [],
      workType: '',
      availableDate: '',
      commuteRadius: ''
    });
    setSortBy('match');
    setPagination(p => ({ ...p, page: 1 }));
  };

  const addSkill = () => {
    if (skillInput.trim() && !filters.skills.includes(skillInput.trim())) {
      setFilters({ ...filters, skills: [...filters.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setFilters({ ...filters, skills: filters.skills.filter(s => s !== skill) });
  };

  const addCommonSkill = (skill) => {
    if (!filters.skills.includes(skill)) {
      setFilters({ ...filters, skills: [...filters.skills, skill] });
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const renderSortButton = (value, label) => (
    <button
      type="button"
      className={`btn btn-sm ${sortBy === value ? 'btn-primary' : 'btn-outline'}`}
      onClick={() => { setSortBy(value); setPagination(p => ({ ...p, page: 1 })); }}
      style={{ marginRight: '8px' }}
    >
      {label}
    </button>
  );

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <h1 className="page-title">搜索结果与岗位筛选</h1>

      <div className="card mb-24">
        <form onSubmit={handleSearch}>
          <div className="grid grid-4 mb-16">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                type="text"
                className="form-input"
                placeholder="请输入搜索岗位关键词"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                type="text"
                className="form-input"
                placeholder="工作地点"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select
                className="form-select"
                value={filters.salaryMin}
                onChange={(e) => setFilters({ ...filters, salaryMin: e.target.value })}
              >
                <option value="">薪资不限</option>
                <option value="3000">3000以上</option>
                <option value="5000">5000以上</option>
                <option value="8000">8000以上</option>
                <option value="10000">10000以上</option>
                <option value="15000">15000以上</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>智能匹配</button>
              <button type="button" className="btn btn-outline" onClick={handleReset}>重置</button>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-link"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{ padding: 0, marginBottom: '16px' }}
          >
            {showAdvanced ? '收起高级筛选 ▲' : '展开高级筛选 ▼'}
          </button>

          {showAdvanced && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <div className="grid grid-2 mb-16">
                <div className="form-group">
                  <label className="form-label">期望薪资上限（元/月）</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="如：15000"
                    value={filters.salaryMax}
                    onChange={(e) => setFilters({ ...filters, salaryMax: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">用工类型</label>
                  <select
                    className="form-select"
                    value={filters.workType}
                    onChange={(e) => setFilters({ ...filters, workType: e.target.value })}
                  >
                    <option value="">全部类型</option>
                    {WORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">可到岗时间</label>
                  <input
                    type="date"
                    className="form-input"
                    value={filters.availableDate}
                    onChange={(e) => setFilters({ ...filters, availableDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">通勤半径（公里）</label>
                  <select
                    className="form-select"
                    value={filters.commuteRadius}
                    onChange={(e) => setFilters({ ...filters, commuteRadius: e.target.value })}
                  >
                    <option value="">不限</option>
                    <option value="5">5公里内</option>
                    <option value="10">10公里内</option>
                    <option value="20">20公里内</option>
                    <option value="30">30公里内</option>
                    <option value="50">50公里内</option>
                    <option value="100">100公里内</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">技能标签</label>
                <div className="flex gap-8 mb-8">
                  <input
                    type="text"
                    className="form-input"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="输入技能后按回车添加"
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="btn btn-outline" onClick={addSkill}>添加</button>
                </div>
                <div className="mb-8">
                  {filters.skills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="tag tag-primary" 
                      style={{ cursor: 'pointer', marginRight: '6px', marginBottom: '6px' }} 
                      onClick={() => removeSkill(skill)}
                    >
                      {skill} ×
                    </span>
                  ))}
                </div>
                <div className="text-secondary text-sm mb-8">常用技能：</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {COMMON_SKILLS.filter(s => !filters.skills.includes(s)).slice(0, 12).map(skill => (
                    <span
                      key={skill}
                      className="tag tag-outline"
                      style={{ cursor: 'pointer' }}
                      onClick={() => addCommonSkill(skill)}
                    >
                      + {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      <div className="card mb-16" style={{ padding: '16px 20px' }}>
        <div className="flex flex-between flex-center">
          <div>
            <span className="text-secondary">查询结果：共找到 <strong style={{ color: 'var(--text-color)' }}>{pagination.total}</strong> 个岗位</span>
            {user && user.role === 'jobseeker' && sortBy === 'match' && (
              <span className="text-success ml-16" style={{ fontSize: '14px' }}>✓ 已按您的偏好智能匹配排序</span>
            )}
          </div>
          <div>
            <span className="text-secondary text-sm mr-8">排序：</span>
            {user && user.role === 'jobseeker' && renderSortButton('match', '智能匹配')}
            {renderSortButton('newest', '最新发布')}
            {renderSortButton('salary', '薪资最高')}
            {renderSortButton('rating', '企业评分')}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : jobs.length === 0 ? (
        <div className="card text-center" style={{ padding: '60px' }}>
          <p className="text-secondary mb-16">暂无匹配的岗位</p>
          <p className="text-secondary text-sm mb-24">试试调整筛选条件或放宽搜索范围</p>
          <button className="btn btn-primary" onClick={handleReset}>重置筛选条件</button>
        </div>
      ) : (
        <>
          {jobs[0]?.matchScore && (
            <div className="card mb-16" style={{ padding: '16px 20px', background: '#f6ffed', borderColor: '#b7eb8f' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🎯</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#389e0d' }}>智能匹配已启用</div>
                  <div className="text-sm" style={{ color: '#52c41a' }}>
                    基于您的技能标签、期望薪资、工作地点和可到岗时间，综合企业评分进行多维度加权匹配
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {jobs.map(job => (
            <JobCard key={job.id} job={job} user={user} />
          ))}

          {totalPages > 1 && (
            <div className="flex flex-center" style={{ justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
              >
                上一页
              </button>
              <span className="text-secondary">第 {pagination.page} / {totalPages} 页</span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === totalPages}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default JobListPage;
