(function() {
  'use strict';

  const API_BASE = (window.APP_CONFIG && window.APP_CONFIG.useProxy) ? '' : (window.APP_CONFIG && window.APP_CONFIG.backendUrl || 'http://127.0.0.1:53466');
  const PAGE_CONFIG = {
    dashboard: { title: '运营看板', sub: '实时掌握领养进展与运营数据' },
    pets: { title: '宠物档案', sub: '管理和查看所有宠物的完整信息' },
    apply: { title: '领养申请', sub: '提交申请并追踪审核进度' },
    review: { title: '审核管理', sub: '处理各阶段的领养申请' },
    follow: { title: '回访任务', sub: '管理试养和领养后的回访计划' }
  };

  var currentPage = 'dashboard';
  var petsCache = { list: [], total: 0 };
  var applicationsCache = { list: [], total: 0 };
  var currentAppId = null;
  var currentFollowUpId = null;

  function $(id) { return document.getElementById(id); }
  function setText(id, text) { var el = $(id); if (el) el.textContent = text; }
  function setHTML(id, html) { var el = $(id); if (el) el.innerHTML = html; }
  function getCategoryName(cat) { var m = { health: '健康原因', housing: '居住原因', finance: '经济原因', behavior: '行为问题', other: '其他原因' }; return m[cat] || cat; }
  function getResourceName(t) { var m = { 猫粮: '猫粮', 狗粮: '狗粮', 猫砂: '猫砂', 志愿者: '志愿者', 医疗基金: '医疗基金', 寄养家庭: '寄养家庭', 猫笼: '猫笼' }; return m[t] || t; }
  function getStatusLabel(s) { var m = { available: '待领养', trial: '试养中', adopted: '已领养', returned: '已退养' }; return m[s] || s; }
  function getStatusText(s) { var m = { open: '待领取', assigned: '已分配', in_progress: '进行中', completed: '已完成' }; return m[s] || s; }
  function getStageLabel(s) { var m = { initial_screening: '初筛', interview: '面谈', home_visit: '家访', trial: '试养期', adopted: '已领养' }; return m[s] || s; }
  function getFollowTypeLabel(t) { var m = { trial: '试养回访', post_adoption: '领养回访', medical: '医疗复查' }; return m[t] || t; }

  function apiRequest(path, options) {
    var url = API_BASE + path;
    var opts = Object.assign({ headers: { 'Content-Type': 'application/json' } }, options || {});
    return fetch(url, opts).then(function(res) {
      return res.json().then(function(payload) {
        if (!res.ok || payload.success === false) throw new Error(payload.message || '请求失败');
        return payload.data;
      });
    });
  }

  function updateServiceStatus(status, text) {
    var el = $('serviceStatus');
    if (!el) return;
    el.textContent = text;
    el.className = 'status ' + status;
  }

  function loadHealth() {
    return apiRequest('/api/health').then(function(data) {
      updateServiceStatus('ok', data.status === 'healthy' ? '后端正常' : '后端可用');
      return data;
    }).catch(function(err) {
      updateServiceStatus('bad', '后端异常');
      console.error('健康检查失败:', err);
      throw err;
    });
  }

  function loadDashboard() {
    return Promise.all([
      apiRequest('/api/dashboard/stats'),
      apiRequest('/api/dashboard/return-reasons'),
      apiRequest('/api/volunteer/tasks'),
      apiRequest('/api/dashboard/resource-gaps'),
      apiRequest('/api/applications')
    ]).then(function(results) {
      var stats = results[0];
      var reasons = results[1];
      var tasks = results[2];
      var gaps = results[3];
      var apps = results[4];

      setText('availablePets', stats.availablePets);
      setText('pendingApplications', stats.pendingApplications);
      setText('adoptedCount', stats.adoptedCount);
      setText('successRate', stats.successRate + '%');
      setText('pendingFollowUps', stats.pendingFollowUps);
      setText('trialCount', stats.trialCount);

      var maxCount = Math.max.apply(null, reasons.categories.map(function(r) { return r.count; }).concat([1]));
      var reasonsHtml = reasons.categories.map(function(r) {
        var pct = (r.count / maxCount) * 100;
        return '<div class="reason-bar"><div class="reason-label">' + getCategoryName(r.category) + '</div><div class="reason-track"><div class="reason-fill" style="width:' + pct + '%"></div></div><div class="reason-count">' + r.count + '</div></div>';
      }).join('');
      setHTML('returnReasons', reasonsHtml);

      var pendingTasks = tasks.filter(function(t) { return ['open', 'assigned', 'in_progress'].indexOf(t.status) >= 0; });
      setText('taskCount', pendingTasks.length + ' 项');

      var tasksHtml = pendingTasks.slice(0, 5).map(function(t) {
        return '<div class="task-item priority-' + (t.priority || 'medium') + '"><div class="task-content"><div class="task-title">' + t.title + '</div><div class="task-desc">' + (t.description || '') + '</div><div class="task-meta"><span>截止: ' + (t.due_date || '-') + '</span><span>状态: ' + getStatusText(t.status) + '</span></div></div></div>';
      }).join('');
      setHTML('taskList', tasksHtml || '<div style="color:#64748b;text-align:center;padding:20px;">暂无待处理任务</div>');

      var gapsHtml = gaps.map(function(g) {
        var pct = Math.min((g.current_level / g.needed_level) * 100, 100);
        return '<div class="resource-card"><div class="resource-header"><span class="resource-name">' + g.organization + ' - ' + getResourceName(g.resource_type) + '</span><span class="resource-urgency ' + g.urgency + '">' + (g.urgency === 'high' ? '紧急' : g.urgency === 'medium' ? '中等' : '低') + '</span></div><div class="resource-bar"><div class="resource-bar-fill" style="width:' + pct + '%"></div></div><div class="resource-numbers"><span>现有: ' + g.current_level + g.unit + '</span><span class="resource-gap">缺 ' + g.gap + g.unit + '</span></div></div>';
      }).join('');
      setHTML('resourceGaps', gapsHtml);

      var appsHtml = (apps.list || []).slice(0, 4).map(function(a) {
        return '<div class="app-item"><div class="app-header"><span class="app-pet">' + a.pet_name + '</span><span class="status-tag">' + a.status + '</span></div><div class="app-applicant">申请人: ' + a.applicant_name + '</div><div class="app-time">' + ((a.created_at || '').split(' ')[0] || '-') + '</div></div>';
      }).join('');
      setHTML('recentApplications', appsHtml || '<div style="color:#64748b;text-align:center;padding:20px;">暂无申请</div>');

      return results;
    }).catch(function(err) {
      console.error('加载看板数据失败:', err);
      setHTML('returnReasons', '<p style="color:#ef4444;">加载失败: ' + err.message + '</p>');
      setHTML('taskList', '<p style="color:#ef4444;">加载失败: ' + err.message + '</p>');
      setHTML('resourceGaps', '<p style="color:#ef4444;grid-column:1/-1;">加载失败: ' + err.message + '</p>');
      setHTML('recentApplications', '<p style="color:#ef4444;">加载失败: ' + err.message + '</p>');
      throw err;
    });
  }

  function loadPetFilters() {
    return apiRequest('/api/pets/filters').then(function(data) {
      var orgFilter = $('orgFilter');
      if (orgFilter) {
        orgFilter.innerHTML = '<option value="">全部机构</option>' + (data.organizations || []).map(function(o) { return '<option value="' + o.organization + '">' + o.organization + '</option>'; }).join('');
      }
      return data;
    });
  }

  function loadPets() {
    var params = new URLSearchParams();
    var sf = $('speciesFilter'); var stf = $('statusFilter'); var of = $('orgFilter'); var ki = $('keyword');
    if (sf && sf.value) params.set('species', sf.value);
    if (stf && stf.value) params.set('status', stf.value);
    if (of && of.value) params.set('organization', of.value);
    if (ki && ki.value.trim()) params.set('keyword', ki.value.trim());

    return apiRequest('/api/pets?' + params.toString()).then(function(data) {
      petsCache = { list: data.list || [], total: data.total || 0 };
      setText('petCount', '共 ' + petsCache.total + ' 份档案');

      var petSelect = $('petSelect');
      if (petSelect) {
        var available = petsCache.list.filter(function(p) { return p.status === 'available'; });
        petSelect.innerHTML = '<option value="">请选择宠物</option>' + available.map(function(p) { return '<option value="' + p.id + '">' + p.name + ' · ' + p.breed + '</option>'; }).join('');
      }

      var gridHtml = petsCache.list.map(function(p) {
        var tagsHtml = (p.personality_tags || []).map(function(t) { return '<em>' + t + '</em>'; }).join('');
        return '<article class="pet-card" data-pet-id="' + p.id + '"><img src="' + p.image_url + '" alt="' + p.name + '" onerror="this.src=\'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=400&q=80\'"><div class="pet-card-body"><div class="card-title"><strong>' + p.name + '</strong><span class="status-tag ' + p.status + '">' + getStatusLabel(p.status) + '</span></div><p class="pet-meta">' + p.breed + ' · ' + p.age + '岁 · ' + (p.gender === 'female' ? '女孩' : p.gender === 'male' ? '男孩' : '未知') + '</p><p class="pet-health">' + p.health_status + ' / ' + p.vaccination_status + ' / ' + p.neutered_status + '</p><div class="tags">' + tagsHtml + '</div><p class="pet-org">🏠 ' + p.organization + '</p></div></article>';
      }).join('');
      setHTML('petGrid', gridHtml || '<div style="color:#64748b;text-align:center;padding:40px;grid-column:1/-1;">暂无宠物档案</div>');

      var cards = document.querySelectorAll('.pet-card');
      for (var i = 0; i < cards.length; i++) {
        (function(card) {
          card.addEventListener('click', function() {
            var pid = parseInt(card.getAttribute('data-pet-id'), 10);
            openPetDetail(pid);
          });
        })(cards[i]);
      }
      return data;
    }).catch(function(err) {
      console.error('加载宠物列表失败:', err);
      setHTML('petGrid', '<div style="color:#ef4444;text-align:center;padding:40px;grid-column:1/-1;">加载失败，请刷新重试: ' + err.message + '</div>');
      throw err;
    });
  }

  function openPetDetail(petId) {
    return apiRequest('/api/pets/' + petId).then(function(data) {
      var pet = data.pet;
      setText('petDetailTitle', pet.name + ' 的档案');

      var tagsHtml = (pet.personality_tags || []).map(function(t) { return '<em>' + t + '</em>'; }).join('');
      var appsHtml = (data.applications || []).length ? data.applications.map(function(a) {
        return '<div class="timeline-item"><div class="timeline-date">' + ((a.created_at || '').split(' ')[0] || '-') + '</div><div class="timeline-content"><strong>' + a.applicant_name + ' 提交申请</strong><span>状态: ' + a.status + '</span></div></div>';
      }).join('') : '<div style="color:#64748b;padding:12px;">暂无申请记录</div>';

      setHTML('petDetailBody', '<div class="pet-detail-header"><div class="pet-detail-images"><img src="' + pet.image_url + '" alt="' + pet.name + '" onerror="this.src=\'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=400&q=80\'"></div><div class="pet-detail-info"><h3>' + pet.name + '</h3><div class="pet-detail-tags"><span class="status-tag ' + pet.status + '">' + getStatusLabel(pet.status) + '</span></div><div class="pet-detail-meta"><div class="pet-detail-item"><div class="pet-detail-label">品种</div><div class="pet-detail-value">' + pet.breed + '</div></div><div class="pet-detail-item"><div class="pet-detail-label">年龄</div><div class="pet-detail-value">' + pet.age + '岁</div></div><div class="pet-detail-item"><div class="pet-detail-label">性别</div><div class="pet-detail-value">' + (pet.gender === 'female' ? '女孩' : pet.gender === 'male' ? '男孩' : '未知') + '</div></div><div class="pet-detail-item"><div class="pet-detail-label">救助机构</div><div class="pet-detail-value">' + pet.organization + '</div></div></div><div class="pet-detail-meta"><div class="pet-detail-item"><div class="pet-detail-label">健康状态</div><div class="pet-detail-value">' + pet.health_status + '</div></div><div class="pet-detail-item"><div class="pet-detail-label">疫苗状态</div><div class="pet-detail-value">' + pet.vaccination_status + '</div></div><div class="pet-detail-item"><div class="pet-detail-label">绝育状态</div><div class="pet-detail-value">' + pet.neutered_status + '</div></div><div class="pet-detail-item"><div class="pet-detail-label">救助日期</div><div class="pet-detail-value">' + (pet.rescue_date || '-') + '</div></div></div><div class="tags">' + tagsHtml + '</div></div></div><div class="pet-detail-story"><strong>🐾 救助故事</strong><p style="margin:8px 0 0 0;">' + (pet.rescue_story || '暂无') + '</p></div><div class="pet-detail-section"><h4>📋 相关申请记录</h4><div class="timeline">' + appsHtml + '</div></div>');

      var modal = $('petDetailModal');
      if (modal) modal.classList.add('active');
      return data;
    }).catch(function(err) {
      alert('加载宠物详情失败: ' + err.message);
      throw err;
    });
  }

  function submitApplication(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var fd = new FormData(form);
    var payload = {
      pet_id: parseInt(fd.get('pet_id'), 10),
      applicant_name: fd.get('applicant_name'),
      contact_phone: fd.get('contact_phone'),
      home_condition: fd.get('home_condition'),
      pet_experience: fd.get('pet_experience'),
      living_environment: fd.get('living_environment'),
      agreement_signed: form.querySelector('input[name="agreement_signed"]').checked
    };
    var msgEl = $('formMessage');
    return apiRequest('/api/applications', { method: 'POST', body: JSON.stringify(payload) }).then(function(result) {
      if (msgEl) {
        msgEl.textContent = '✅ 申请已提交！申请编号 #' + result.id + '，等待平台初筛';
        msgEl.className = 'form-message success';
      }
      form.reset();
      return Promise.all([loadMyApplications(), loadDashboard()]);
    }).catch(function(err) {
      if (msgEl) {
        msgEl.textContent = '❌ ' + err.message;
        msgEl.className = 'form-message error';
      }
      throw err;
    });
  }

  function loadMyApplications() {
    return apiRequest('/api/applications').then(function(data) {
      applicationsCache = { list: data.list || [], total: data.total || 0 };
      var stages = ['initial_screening', 'interview', 'home_visit', 'trial', 'adopted'];
      var html = applicationsCache.list.map(function(a) {
        var ci = stages.indexOf(a.current_stage);
        var stageHtml = stages.map(function(s) {
          var si = stages.indexOf(s);
          var cls = '';
          if (si < ci || a.current_stage === 'adopted') cls = 'completed';
          else if (a.current_stage === s) cls = 'active';
          return '<div class="stage-item ' + cls + '">' + getStageLabel(s) + '</div>';
        }).join('');
        var supplementHtml = a.status === '初筛中' && a.current_stage === 'initial_screening' ? '<div class="supplement-section"><strong style="font-size:14px;">📝 补充资料</strong><textarea id="supplement-' + a.id + '" placeholder="如有需要补充的信息，请在此填写...">' + (a.supplementary_info || '') + '</textarea><button data-supplement-id="' + a.id + '" style="margin-top:8px;" class="btn-small">提交补充</button></div>' : '';
        var rejectHtml = a.reject_reason ? '<div style="margin-top:12px;padding:10px;background:#fee2e2;border-radius:6px;color:#991b1b;font-size:13px;"><strong>拒绝原因:</strong> ' + a.reject_reason + '</div>' : '';
        var created = (a.created_at || '').split(' ')[0] || '-';
        var updated = (a.updated_at || '').split(' ')[0] || '-';
        return '<div class="my-app-card"><div class="my-app-header"><div><strong style="font-size:16px;">' + a.pet_name + '</strong><span style="color:#64748b;margin-left:8px;">申请 #' + a.id + '</span></div><span class="status-tag">' + a.status + '</span></div><div class="my-app-stages">' + stageHtml + '</div><div class="my-app-info"><div>申请人: ' + a.applicant_name + '</div><div>联系电话: ' + a.contact_phone + '</div><div>提交时间: ' + created + '</div><div>更新时间: ' + updated + '</div></div>' + supplementHtml + rejectHtml + '</div>';
      }).join('');
      setHTML('myApplications', html || '<div style="color:#64748b;text-align:center;padding:40px;">暂无申请记录</div>');

      var supplementBtns = document.querySelectorAll('[data-supplement-id]');
      for (var i = 0; i < supplementBtns.length; i++) {
        (function(btn) {
          btn.addEventListener('click', function() {
            var id = parseInt(btn.getAttribute('data-supplement-id'), 10);
            submitSupplement(id);
          });
        })(supplementBtns[i]);
      }
      return data;
    }).catch(function(err) {
      console.error('加载申请列表失败:', err);
      setHTML('myApplications', '<div style="color:#ef4444;text-align:center;padding:40px;">加载失败: ' + err.message + '</div>');
      throw err;
    });
  }

  function submitSupplement(appId) {
    var textarea = document.getElementById('supplement-' + appId);
    if (!textarea) return Promise.reject(new Error('找不到补充资料文本框'));
    return apiRequest('/api/applications/' + appId, { method: 'PUT', body: JSON.stringify({ supplementary_info: textarea.value }) }).then(function() {
      alert('资料补充成功！');
      return loadMyApplications();
    }).catch(function(err) {
      alert('补充失败: ' + err.message);
      throw err;
    });
  }

  function loadReviews() {
    var sf = $('reviewStageFilter');
    var stage = sf ? sf.value : '';
    return apiRequest('/api/reviews/pending' + (stage ? '?stage=' + stage : '')).then(function(data) {
      var html = data.map(function(a) {
        var supplementHtml = a.supplementary_info ? '<div style="margin-bottom:16px;padding:12px;background:#fef3c7;border-radius:8px;"><strong>补充资料:</strong> ' + a.supplementary_info + '</div>' : '';
        return '<div class="review-card"><div class="review-header"><div class="review-pet">' + a.pet_name + '</div><div class="review-stage">' + getStageLabel(a.current_stage) + '</div></div><div class="review-applicant">申请人: ' + a.applicant_name + ' · ' + a.contact_phone + ' · 申请 #' + a.id + '</div><div class="review-details"><div class="review-detail-item"><div class="review-detail-label">家庭条件</div><div>' + (a.home_condition || '-') + '</div></div><div class="review-detail-item"><div class="review-detail-label">养宠经验</div><div>' + (a.pet_experience || '-') + '</div></div><div class="review-detail-item"><div class="review-detail-label">居住环境</div><div>' + (a.living_environment || '-') + '</div></div></div>' + supplementHtml + '<div class="review-actions"><button class="btn-pass" data-review="' + a.id + '" data-stage="' + a.current_stage + '" data-action="pass">通过</button><button class="btn-reject" data-review="' + a.id + '" data-stage="' + a.current_stage + '" data-action="reject">拒绝</button></div></div>';
      }).join('');
      setHTML('reviewList', html || '<div style="color:#64748b;text-align:center;padding:40px;">暂无待审核申请</div>');

      var passBtns = document.querySelectorAll('[data-action="pass"]');
      var rejectBtns = document.querySelectorAll('[data-action="reject"]');
      var bindBtn = function(btn) {
        btn.addEventListener('click', function() {
          var id = parseInt(btn.getAttribute('data-review'), 10);
          var stage = btn.getAttribute('data-stage');
          var action = btn.getAttribute('data-action');
          openReviewModal(id, stage, action);
        });
      };
      for (var i = 0; i < passBtns.length; i++) bindBtn(passBtns[i]);
      for (var j = 0; j < rejectBtns.length; j++) bindBtn(rejectBtns[j]);
      return data;
    }).catch(function(err) {
      console.error('加载审核列表失败:', err);
      setHTML('reviewList', '<div style="color:#ef4444;text-align:center;padding:40px;">加载失败: ' + err.message + '</div>');
      throw err;
    });
  }

  function getNextStage(stage) {
    var order = ['initial_screening', 'interview', 'home_visit', 'trial', 'adopted'];
    var idx = order.indexOf(stage);
    return idx < order.length - 1 ? order[idx + 1] : 'adopted';
  }

  function getNextStageStatus(stage) {
    var m = { initial_screening: '初筛通过，待面谈', interview: '面谈通过，待家访', home_visit: '家访通过，待试养', trial: '已领养' };
    return m[stage] || '待审核';
  }

  function openReviewModal(appId, stage, action) {
    currentAppId = appId;
    var isPass = action === 'pass';
    var nextStage = getNextStage(stage);
    setText('reviewModalTitle', isPass ? '通过' + getStageLabel(stage) + '审核' : '拒绝申请');
    var bodyHtml = '<div style="margin-bottom:16px;"><strong>审核人</strong><input id="reviewerName" value="平台审核员" style="width:100%;margin-top:8px;"></div>';
    if (isPass) {
      bodyHtml += '<div style="margin-bottom:16px;"><strong>下一步:</strong> 将进入 ' + getStageLabel(nextStage) + ' 阶段</div>';
    } else {
      bodyHtml += '<div style="margin-bottom:16px;"><strong>拒绝原因 <span style="color:#ef4444;">*</span></strong><textarea id="rejectReason" required placeholder="请填写拒绝原因..." style="width:100%;margin-top:8px;min-height:80px;"></textarea></div>';
    }
    bodyHtml += '<div style="margin-bottom:16px;"><strong>审核备注</strong><textarea id="reviewNotes" placeholder="可选，填写审核意见..." style="width:100%;margin-top:8px;min-height:60px;"></textarea></div>';
    bodyHtml += '<div style="display:flex;gap:12px;justify-content:flex-end;"><button class="btn-secondary" data-close-modal="reviewModal">取消</button><button class="' + (isPass ? 'btn-primary' : 'btn-reject') + '" id="submitReviewBtn" data-stage="' + stage + '" data-action="' + action + '">确认' + (isPass ? '通过' : '拒绝') + '</button></div>';
    setHTML('reviewModalBody', bodyHtml);

    var closeBtns = document.querySelectorAll('[data-close-modal]');
    for (var i = 0; i < closeBtns.length; i++) {
      (function(btn) {
        btn.addEventListener('click', function() { closeModal(btn.getAttribute('data-close-modal')); });
      })(closeBtns[i]);
    }

    var submitBtn = $('submitReviewBtn');
    if (submitBtn) {
      submitBtn.addEventListener('click', function() {
        var s = submitBtn.getAttribute('data-stage');
        var a = submitBtn.getAttribute('data-action');
        submitReview(s, a);
      });
    }

    var modal = $('reviewModal');
    if (modal) modal.classList.add('active');
  }

  function submitReview(stage, action) {
    var reviewer = $('reviewerName') ? $('reviewerName').value : '平台审核员';
    var notes = $('reviewNotes') ? $('reviewNotes').value : '';
    var rejectReason = $('rejectReason') ? $('rejectReason').value : '';
    if (action === 'reject' && !rejectReason) { alert('请填写拒绝原因'); return Promise.reject(new Error('缺少拒绝原因')); }
    return apiRequest('/api/applications/' + currentAppId + '/review', {
      method: 'POST',
      body: JSON.stringify({
        stage: stage, result: action, reviewer: reviewer, notes: notes,
        reject_reason: rejectReason,
        new_status: action === 'pass' ? getNextStageStatus(stage) : '已拒绝'
      })
    }).then(function() {
      closeModal('reviewModal');
      alert('审核完成！');
      return Promise.all([loadReviews(), loadDashboard()]);
    }).catch(function(err) {
      alert('审核失败: ' + err.message);
      throw err;
    });
  }

  function loadFollowUps() {
    return apiRequest('/api/follow-ups').then(function(data) {
      var html = data.map(function(f) {
        var statusLabel = f.status === 'planned' ? '待执行' : f.status === 'in_progress' ? '进行中' : f.status === 'abnormal' ? '异常' : '已完成';
        var feedbackHtml = f.feedback ? '<div class="follow-feedback"><strong>反馈:</strong> ' + f.feedback + '</div>' : '';
        var alertHtml = f.abnormal_alert ? '<div class="abnormal-alert">⚠️ ' + f.abnormal_alert + '</div>' : '';
        var actionsHtml = '';
        if (f.status !== 'completed') {
          actionsHtml = '<button class="btn-small" data-follow-up="' + f.id + '" data-follow-action="detail">查看详情</button><button class="btn-small" data-follow-up="' + f.id + '" data-follow-action="feedback">提交反馈</button>';
        } else {
          actionsHtml = '<button class="btn-small" data-follow-up="' + f.id + '" data-follow-action="detail">查看详情</button>';
        }
        return '<div class="follow-card"><div class="follow-header"><div class="follow-pet">' + f.pet_name + '</div><div class="follow-type ' + f.type + '">' + getFollowTypeLabel(f.type) + '</div></div><div class="follow-info"><div class="follow-info-item"><strong>计划日期</strong><span>' + f.scheduled_date + '</span></div><div class="follow-info-item"><strong>领养人</strong><span>' + (f.adopter_name || '-') + '</span></div><div class="follow-info-item"><strong>状态</strong><span>' + statusLabel + '</span></div></div>' + feedbackHtml + alertHtml + '<div class="follow-actions">' + actionsHtml + '</div></div>';
      }).join('');
      setHTML('followUpList', html || '<div style="color:#64748b;text-align:center;padding:40px;">暂无回访计划</div>');

      var detailBtns = document.querySelectorAll('[data-follow-action="detail"]');
      var feedbackBtns = document.querySelectorAll('[data-follow-action="feedback"]');
      var bindFollow = function(btn) {
        btn.addEventListener('click', function() {
          var id = parseInt(btn.getAttribute('data-follow-up'), 10);
          var action = btn.getAttribute('data-follow-action');
          if (action === 'detail') openFollowUpDetail(id);
          else openFollowUpFeedback(id);
        });
      };
      for (var i = 0; i < detailBtns.length; i++) bindFollow(detailBtns[i]);
      for (var j = 0; j < feedbackBtns.length; j++) bindFollow(feedbackBtns[j]);
      return data;
    }).catch(function(err) {
      console.error('加载回访列表失败:', err);
      setHTML('followUpList', '<div style="color:#ef4444;text-align:center;padding:40px;">加载失败: ' + err.message + '</div>');
      throw err;
    });
  }

  function openFollowUpDetail(followUpId) {
    return apiRequest('/api/follow-ups/' + followUpId).then(function(f) {
      currentFollowUpId = followUpId;
      setText('followUpModalTitle', f.pet_name + ' - 回访详情');
      var bodyHtml = '<div style="margin-bottom:20px;"><strong style="font-size:16px;">基本信息</strong><div class="health-grid" style="margin-top:12px;"><div class="health-item"><div class="health-label">回访类型</div><div class="health-value">' + getFollowTypeLabel(f.type) + '</div></div><div class="health-item"><div class="health-label">计划日期</div><div class="health-value">' + f.scheduled_date + '</div></div><div class="health-item"><div class="health-label">领养人</div><div class="health-value">' + (f.adopter_name || '-') + '</div></div><div class="health-item"><div class="health-label">志愿者</div><div class="health-value">' + (f.volunteer_name || '-') + '</div></div></div></div>';

      if (f.health_status || f.appetite_status || f.weight) {
        bodyHtml += '<div style="margin-bottom:20px;"><strong style="font-size:16px;">健康记录</strong><div class="health-grid" style="margin-top:12px;"><div class="health-item"><div class="health-label">健康状态</div><div class="health-value">' + (f.health_status || '-') + '</div></div><div class="health-item"><div class="health-label">食欲</div><div class="health-value">' + (f.appetite_status || '-') + '</div></div><div class="health-item"><div class="health-label">体重</div><div class="health-value">' + (f.weight || '-') + '</div></div><div class="health-item"><div class="health-label">完成日期</div><div class="health-value">' + (f.completed_date || '-') + '</div></div></div></div>';
      }

      if (f.feedback) {
        bodyHtml += '<div style="margin-bottom:20px;"><strong style="font-size:16px;">回访反馈</strong><div style="margin-top:12px;padding:16px;background:#f8fafc;border-radius:8px;">' + f.feedback + '</div></div>';
      }

      if (f.abnormal_alert) {
        bodyHtml += '<div class="abnormal-alert">⚠️ <strong>异常提醒:</strong> ' + f.abnormal_alert + '</div>';
      }

      if (f.status !== 'completed') {
        bodyHtml += '<div style="margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;"><strong style="font-size:16px;">退养处理</strong><p style="color:#64748b;margin:8px 0 16px 0;">如试养不顺利，可在此申请退养，宠物将重新进入待领养状态</p><div style="margin-bottom:12px;"><select id="returnCategory" style="width:100%;margin-bottom:8px;"><option value="">请选择退养原因类型</option><option value="health">健康原因</option><option value="housing">居住原因</option><option value="finance">经济原因</option><option value="behavior">行为问题</option><option value="other">其他原因</option></select><input id="returnReason" placeholder="请详细说明原因..." style="width:100%;"></div><button class="btn-reject" id="handleReturnBtn">申请退养</button></div>';
      }

      bodyHtml += '<div style="margin-top:20px;display:flex;gap:12px;justify-content:flex-end;"><button class="btn-secondary" data-close-modal="followUpModal">关闭</button></div>';
      setHTML('followUpModalBody', bodyHtml);

      var closeBtns = document.querySelectorAll('[data-close-modal]');
      for (var i = 0; i < closeBtns.length; i++) {
        (function(btn) {
          btn.addEventListener('click', function() { closeModal(btn.getAttribute('data-close-modal')); });
        })(closeBtns[i]);
      }

      var returnBtn = $('handleReturnBtn');
      if (returnBtn) returnBtn.addEventListener('click', handleReturn);

      var modal = $('followUpModal');
      if (modal) modal.classList.add('active');
      return f;
    }).catch(function(err) {
      alert('加载回访详情失败: ' + err.message);
      throw err;
    });
  }

  function openFollowUpFeedback(followUpId) {
    currentFollowUpId = followUpId;
    setText('followUpModalTitle', '提交回访反馈');
    setHTML('followUpModalBody', '<div style="margin-bottom:16px;"><strong>健康状态</strong><select id="feedbackHealth" style="width:100%;margin-top:8px;"><option value="良好">良好</option><option value="正常">正常</option><option value="轻微不适">轻微不适</option><option value="需要就医">需要就医</option></select></div><div style="margin-bottom:16px;"><strong>食欲情况</strong><select id="feedbackAppetite" style="width:100%;margin-top:8px;"><option value="良好">良好</option><option value="正常">正常</option><option value="较差">较差</option><option value="拒食">拒食</option></select></div><div style="margin-bottom:16px;"><strong>体重 (kg)</strong><input id="feedbackWeight" placeholder="例如: 2.5" style="width:100%;margin-top:8px;"></div><div style="margin-bottom:16px;"><strong>异常提醒</strong><input id="feedbackAlert" placeholder="如有异常情况请在此说明" style="width:100%;margin-top:8px;"></div><div style="margin-bottom:16px;"><strong>反馈内容 <span style="color:#ef4444;">*</span></strong><textarea id="feedbackContent" placeholder="请详细描述回访情况..." style="width:100%;margin-top:8px;min-height:100px;" required></textarea></div><div style="display:flex;gap:12px;justify-content:flex-end;"><button class="btn-secondary" data-close-modal="followUpModal">取消</button><button class="btn-primary" id="submitFeedbackBtn">提交反馈</button></div>');

    var closeBtns = document.querySelectorAll('[data-close-modal]');
    for (var i = 0; i < closeBtns.length; i++) {
      (function(btn) {
        btn.addEventListener('click', function() { closeModal(btn.getAttribute('data-close-modal')); });
      })(closeBtns[i]);
    }

    var submitBtn = $('submitFeedbackBtn');
    if (submitBtn) submitBtn.addEventListener('click', submitFeedback);

    var modal = $('followUpModal');
    if (modal) modal.classList.add('active');
  }

  function submitFeedback() {
    var content = $('feedbackContent') ? $('feedbackContent').value : '';
    if (!content) { alert('请填写反馈内容'); return Promise.reject(new Error('缺少反馈内容')); }
    var body = { feedback: content, status: 'completed' };
    if ($('feedbackHealth')) body.health_status = $('feedbackHealth').value;
    if ($('feedbackAppetite')) body.appetite_status = $('feedbackAppetite').value;
    if ($('feedbackWeight')) body.weight = $('feedbackWeight').value;
    if ($('feedbackAlert')) body.abnormal_alert = $('feedbackAlert').value;
    return apiRequest('/api/follow-ups/' + currentFollowUpId + '/feedback', { method: 'POST', body: JSON.stringify(body) }).then(function() {
      closeModal('followUpModal');
      alert('反馈提交成功！');
      return Promise.all([loadFollowUps(), loadDashboard()]);
    }).catch(function(err) {
      alert('提交失败: ' + err.message);
      throw err;
    });
  }

  function handleReturn() {
    var category = $('returnCategory') ? $('returnCategory').value : '';
    var reason = $('returnReason') ? $('returnReason').value : '';
    if (!category || !reason) { alert('请选择原因类型并填写说明'); return Promise.reject(new Error('缺少退养原因')); }
    if (!confirm('确认申请退养？宠物将重新进入待领养状态，此操作不可撤销。')) return Promise.reject(new Error('用户取消'));
    return apiRequest('/api/follow-ups/' + currentFollowUpId + '/return', {
      method: 'POST',
      body: JSON.stringify({ reason_category: category, reason: getCategoryName(category), description: reason })
    }).then(function() {
      closeModal('followUpModal');
      alert('退养处理完成，宠物已重新进入待领养状态');
      return Promise.all([loadFollowUps(), loadDashboard(), loadPets()]);
    }).catch(function(err) {
      if (err.message !== '用户取消') alert('退养处理失败: ' + err.message);
      throw err;
    });
  }

  function closeModal(modalId) {
    var modal = $(modalId);
    if (modal) modal.classList.remove('active');
  }

  function switchPage(pageName) {
    currentPage = pageName;
    var navLinks = document.querySelectorAll('.nav-link');
    for (var i = 0; i < navLinks.length; i++) {
      navLinks[i].classList.toggle('active', navLinks[i].getAttribute('data-page') === pageName);
    }

    var pages = document.querySelectorAll('.page-content');
    for (var j = 0; j < pages.length; j++) {
      pages[j].classList.toggle('active', pages[j].id === 'page-' + pageName);
    }

    var cfg = PAGE_CONFIG[pageName];
    if (cfg) {
      setText('pageTitle', cfg.title);
      setText('pageSubtitle', cfg.sub);
    }

    if (pageName === 'dashboard') { return loadDashboard(); }
    if (pageName === 'pets') { return Promise.all([loadPetFilters(), loadPets()]); }
    if (pageName === 'apply') { return Promise.all([loadPets(), loadMyApplications()]); }
    if (pageName === 'review') { return loadReviews(); }
    if (pageName === 'follow') { return loadFollowUps(); }
    return Promise.resolve();
  }

  function init() {
    var navLinks = document.querySelectorAll('.nav-link');
    for (var i = 0; i < navLinks.length; i++) {
      (function(link) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          switchPage(link.getAttribute('data-page'));
        });
      })(navLinks[i]);
    }

    var refreshBtn = $('refreshAllBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', function() {
      switchPage(currentPage);
    });

    ['speciesFilter', 'statusFilter', 'orgFilter'].forEach(function(id) {
      var el = $(id);
      if (el) el.addEventListener('change', loadPets);
    });

    var keywordInput = $('keyword');
    if (keywordInput) keywordInput.addEventListener('input', function() {
      clearTimeout(window.petTimer);
      window.petTimer = setTimeout(loadPets, 300);
    });

    var reviewStageFilter = $('reviewStageFilter');
    if (reviewStageFilter) reviewStageFilter.addEventListener('change', loadReviews);

    var applyForm = $('applyForm');
    if (applyForm) applyForm.addEventListener('submit', submitApplication);

    var loadMyAppsBtn = $('loadMyApps');
    if (loadMyAppsBtn) loadMyAppsBtn.addEventListener('click', loadMyApplications);

    var closeBtns = document.querySelectorAll('.modal-close');
    for (var k = 0; k < closeBtns.length; k++) {
      (function(btn) {
        btn.addEventListener('click', function(e) {
          closeModal(e.target.closest('.modal').id);
        });
      })(closeBtns[k]);
    }

    var modals = document.querySelectorAll('.modal');
    for (var m = 0; m < modals.length; m++) {
      (function(modal) {
        modal.addEventListener('click', function(e) {
          if (e.target === modal) closeModal(modal.id);
        });
      })(modals[m]);
    }

    loadHealth().then(function() {
      switchPage('dashboard');
    }).catch(function(err) {
      console.error('初始化失败:', err);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
