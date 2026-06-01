const backendUrl = window.APP_CONFIG?.backendUrl || "http://127.0.0.1:55476";

const byId = (id) => document.getElementById(id);
let selectedBoardId = null;
let currentTool = "select";
let currentColor = "#fff9c4";
let currentView = "canvas";
let dragNoteEl = null;
let dragOffset = { x: 0, y: 0 };

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setHealth(text, state) {
  const el = byId("health");
  if (el) {
    el.textContent = text;
    el.dataset.state = state;
  }
}

async function api(path, options = {}) {
  try {
    const response = await fetch(`${backendUrl}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      throw new Error(data?.error || `${response.status} ${response.statusText}`);
    }
    return data;
  } catch (error) {
    if (error.message === "Failed to fetch") {
      throw new Error(`无法连接到后端服务 (${backendUrl})，请检查后端是否启动`);
    }
    throw error;
  }
}

function openModal(title, bodyHtml, onConfirm, hideConfirm = false) {
  byId("modalTitle").textContent = title;
  byId("modalBody").innerHTML = bodyHtml;
  
  if (hideConfirm) {
    byId("modalFooter").innerHTML = `
      <button type="button" class="btn-secondary" id="modalCloseBtn">关闭</button>
    `;
    byId("modalCloseBtn").onclick = closeModal;
  } else {
    byId("modalFooter").innerHTML = `
      <button type="button" class="btn-secondary" id="modalCancel">取消</button>
      <button type="button" class="btn-primary" id="modalConfirm">确定</button>
    `;
    byId("modalCancel").onclick = closeModal;
    byId("modalConfirm").onclick = () => {
      if (onConfirm) onConfirm();
    };
  }
  
  byId("modalOverlay").style.display = "flex";
}

function closeModal() {
  byId("modalOverlay").style.display = "none";
}

byId("modalClose").onclick = closeModal;
byId("modalOverlay").onclick = (e) => {
  if (e.target.id === "modalOverlay") closeModal();
};

function renderBoardList(boards) {
  const host = byId("boardList");
  if (!host) return;
  host.innerHTML = "";

  for (const board of boards) {
    const item = document.createElement("div");
    item.className = "board-item" + (board.id === selectedBoardId ? " active" : "");
    item.innerHTML = `
      <div class="board-item-title">${escapeHtml(board.title)}</div>
      <div class="board-item-meta">${getStatusText(board.status)} · ${escapeHtml(board.theme || "无主题")}</div>
    `;
    item.onclick = () => selectBoard(board.id);
    host.appendChild(item);
  }

  if (boards.length === 0) {
    host.innerHTML = '<p style="color: var(--text-secondary); font-size: 13px; margin: 0;">暂无白板，点击上方"新建"创建</p>';
  }
}

function getStatusText(status) {
  const map = {
    setup: "准备中",
    brainstorm: "头脑风暴",
    organize: "整理归类",
    vote: "投票筛选",
    output: "产出整理",
    review: "复盘总结"
  };
  return map[status] || status;
}

function showBoardTools() {
  byId("boardTools").style.display = "block";
  byId("boardSettings").style.display = "block";
  byId("viewTabs").style.display = "flex";
  byId("emptyState").style.display = "none";
}

function hideBoardTools() {
  byId("boardTools").style.display = "none";
  byId("boardSettings").style.display = "none";
  byId("viewTabs").style.display = "none";
  byId("emptyState").style.display = "flex";
  byId("canvasContainer").style.display = "none";
  byId("outputContainer").style.display = "none";
  byId("reviewContainer").style.display = "none";
}

function switchView(view) {
  currentView = view;
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
  byId("canvasContainer").style.display = view === "canvas" ? "flex" : "none";
  byId("outputContainer").style.display = view === "output" ? "flex" : "none";
  byId("reviewContainer").style.display = view === "review" ? "block" : "none";
  
  if (view === "canvas") {
    loadCanvas();
  } else if (view === "output") {
    loadOutput();
  } else if (view === "review") {
    loadReview();
  }
}

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.onclick = () => switchView(btn.dataset.view);
});

async function selectBoard(boardId) {
  selectedBoardId = boardId;
  showBoardTools();
  await refreshBoardList();
  await loadBoardData();
  switchView("canvas");
}

async function loadBoardData() {
  if (!selectedBoardId) return;
  
  try {
    const [boardRes, statsRes] = await Promise.all([
      api(`/api/boards/${selectedBoardId}`),
      api(`/api/boards/${selectedBoardId}/stats`),
    ]);

    const board = boardRes.data;
    const stats = statsRes.data;
    
    byId("currentBoardTitle").textContent = board.title;
    byId("currentBoardStatus").textContent = getStatusText(board.status);
    byId("anonymousMode").checked = board.is_anonymous === 1;
    byId("hostLock").checked = board.host_lock === 1;
    byId("boardStatus").value = board.status;
  } catch (error) {
    console.error(error);
    setHealth(error.message, "error");
  }
}

function renderNotes(notes) {
  const canvas = byId("canvas");
  const existingNotes = canvas.querySelectorAll(".note");
  existingNotes.forEach(n => n.remove());

  for (const note of notes) {
    if (note.status === "merged") continue;
    const el = document.createElement("div");
    el.className = "note";
    el.dataset.id = note.id;
    el.style.left = note.x + "px";
    el.style.top = note.y + "px";
    el.style.backgroundColor = note.color;
    el.innerHTML = `
      <div class="note-content" contenteditable="true">${escapeHtml(note.content || "点击编辑")}</div>
      <div class="note-footer">
        <span class="note-meta">${note.is_anonymous ? "匿名" : escapeHtml(note.created_by || "未知")}</span>
        <div class="note-votes">
          <button class="vote-btn" data-note-id="${note.id}" title="点赞">👍</button>
          <span>${note.votes_count || 0}</span>
        </div>
      </div>
    `;
    
    el.addEventListener("mousedown", (e) => startDragNote(e, note, el));
    el.querySelector(".vote-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      voteNote(note.id);
    });
    
    const contentEl = el.querySelector(".note-content");
    contentEl.addEventListener("blur", () => {
      updateNoteContent(note.id, contentEl.textContent);
    });
    
    canvas.appendChild(el);
  }
}

function renderGroups(groups) {
  const canvas = byId("canvas");
  const existingGroups = canvas.querySelectorAll(".note-group");
  existingGroups.forEach(g => g.remove());

  for (const group of groups) {
    const el = document.createElement("div");
    el.className = "note-group";
    el.dataset.id = group.id;
    el.style.left = group.x + "px";
    el.style.top = group.y + "px";
    el.style.width = group.width + "px";
    el.style.height = group.height + "px";
    el.style.backgroundColor = group.color + "40";
    el.innerHTML = `
      <div class="note-group-header" contenteditable="true">${escapeHtml(group.title || "分组")}</div>
    `;
    canvas.appendChild(el);
  }
}

function renderConnections(connections) {
  const svg = byId("connectionsSvg");
  svg.innerHTML = "";
  
  for (const conn of connections) {
    const fromNote = document.querySelector(`.note[data-id="${conn.from_note_id}"]`);
    const toNote = document.querySelector(`.note[data-id="${conn.to_note_id}"]`);
    if (!fromNote || !toNote) continue;
    
    const fromRect = fromNote.getBoundingClientRect();
    const toRect = toNote.getBoundingClientRect();
    const canvasRect = byId("canvas").getBoundingClientRect();
    
    const x1 = fromRect.left - canvasRect.left + fromRect.width / 2 + byId("canvas").scrollLeft;
    const y1 = fromRect.top - canvasRect.top + fromRect.height / 2 + byId("canvas").scrollTop;
    const x2 = toRect.left - canvasRect.left + toRect.width / 2 + byId("canvas").scrollLeft;
    const y2 = toRect.top - canvasRect.top + toRect.height / 2 + byId("canvas").scrollTop;
    
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", conn.color || "#666");
    line.setAttribute("stroke-width", "2");
    svg.appendChild(line);
  }
}

function startDragNote(e, note, el) {
  if (currentTool !== "select" && currentTool !== "note") return;
  e.preventDefault();
  dragNoteEl = el;
  dragNoteEl.classList.add("selected");
  
  const rect = el.getBoundingClientRect();
  const canvasRect = byId("canvas").getBoundingClientRect();
  dragOffset = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
  
  document.addEventListener("mousemove", onDragNote);
  document.addEventListener("mouseup", stopDragNote);
}

function onDragNote(e) {
  if (!dragNoteEl) return;
  const canvasRect = byId("canvas").getBoundingClientRect();
  const x = e.clientX - canvasRect.left - dragOffset.x + byId("canvas").scrollLeft;
  const y = e.clientY - canvasRect.top - dragOffset.y + byId("canvas").scrollTop;
  
  dragNoteEl.style.left = Math.max(0, x) + "px";
  dragNoteEl.style.top = Math.max(0, y) + "px";
}

function stopDragNote() {
  if (dragNoteEl) {
    const noteId = dragNoteEl.dataset.id;
    const x = parseInt(dragNoteEl.style.left);
    const y = parseInt(dragNoteEl.style.top);
    updateNotePosition(noteId, x, y);
    dragNoteEl.classList.remove("selected");
  }
  dragNoteEl = null;
  document.removeEventListener("mousemove", onDragNote);
  document.removeEventListener("mouseup", stopDragNote);
}

async function updateNotePosition(noteId, x, y) {
  try {
    await api(`/api/boards/${selectedBoardId}/notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify({ x, y })
    });
    renderConnections(await getConnections());
  } catch (error) {
    console.error("Failed to update note position:", error);
  }
}

async function updateNoteContent(noteId, content) {
  try {
    await api(`/api/boards/${selectedBoardId}/notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify({ content })
    });
  } catch (error) {
    console.error("Failed to update note content:", error);
  }
}

async function voteNote(noteId) {
  try {
    await api(`/api/boards/${selectedBoardId}/notes/${noteId}/vote`, {
      method: "POST",
      body: JSON.stringify({ user_id: "current_user" })
    });
    loadCanvas();
  } catch (error) {
    console.error("Failed to vote:", error);
  }
}

async function getConnections() {
  const res = await api(`/api/boards/${selectedBoardId}/connections`);
  return res.data;
}

async function loadCanvas() {
  if (!selectedBoardId) return;
  
  try {
    const [notesRes, groupsRes, connectionsRes] = await Promise.all([
      api(`/api/boards/${selectedBoardId}/notes`),
      api(`/api/boards/${selectedBoardId}/groups`),
      api(`/api/boards/${selectedBoardId}/connections`),
    ]);
    
    renderGroups(groupsRes.data);
    renderNotes(notesRes.data);
    renderConnections(connectionsRes.data);
  } catch (error) {
    console.error(error);
  }
}

async function loadOutput() {
  if (!selectedBoardId) return;
  
  try {
    const [notesRes, actionsRes] = await Promise.all([
      api(`/api/boards/${selectedBoardId}/notes`),
      api(`/api/boards/${selectedBoardId}/actions`),
    ]);
    
    const notes = notesRes.data.filter(n => n.status !== "merged");
    const actions = actionsRes.data;
    
    const opportunities = notes.filter(n => n.note_type === "opportunity" || n.note_type === "idea");
    const problems = notes.filter(n => n.note_type === "problem");
    const needs = notes.filter(n => n.note_type === "need");
    
    renderOutputList("opportunitiesList", opportunities);
    renderOutputList("problemsList", problems);
    renderOutputList("needsList", needs);
    renderActionList(actions);
  } catch (error) {
    console.error(error);
  }
}

function renderOutputList(containerId, items) {
  const host = byId(containerId);
  host.innerHTML = items.map(item => `
    <div class="output-item">
      <div class="output-item-title">${escapeHtml(item.content || "无内容")}</div>
      <div class="output-item-meta">
        <span>${escapeHtml(item.created_by || "未知")}</span>
        <span>👍 ${item.votes_count || 0}</span>
      </div>
    </div>
  `).join("") || '<p style="color: var(--text-secondary); font-size: 12px; margin: 0;">暂无</p>';
}

function renderActionList(actions) {
  const host = byId("actionsList");
  host.innerHTML = actions.map(action => `
    <div class="output-item">
      <div class="output-item-title">${escapeHtml(action.title)}</div>
      <div class="output-item-meta">
        <span>${escapeHtml(action.assignee || "未指派")}</span>
        <span>${getStatusBadge(action.status)}</span>
      </div>
    </div>
  `).join("") || '<p style="color: var(--text-secondary); font-size: 12px; margin: 0;">暂无行动项</p>';
}

function getStatusBadge(status) {
  const map = {
    pending: '<span style="color: #92400e; background: #fef3c7; padding: 2px 8px; border-radius: 999px; font-size: 11px;">待处理</span>',
    in_progress: '<span style="color: #1e40af; background: #dbeafe; padding: 2px 8px; border-radius: 999px; font-size: 11px;">进行中</span>',
    completed: '<span style="color: #166534; background: #dcfce7; padding: 2px 8px; border-radius: 999px; font-size: 11px;">已完成</span>',
    cancelled: '<span style="color: #991b1b; background: #fee2e2; padding: 2px 8px; border-radius: 999px; font-size: 11px;">已取消</span>'
  };
  return map[status] || status;
}

async function loadReview() {
  if (!selectedBoardId) return;
  
  try {
    const reviewRes = await api(`/api/boards/${selectedBoardId}/review`);
    const data = reviewRes.data;
    
    byId("statParticipants").textContent = data.participants.length;
    byId("statNotes").textContent = data.notes.length;
    byId("statVotes").textContent = data.notes.reduce((sum, n) => sum + (n.votes_count || 0), 0);
    byId("statActions").textContent = data.actions.length;
    
    const topNotes = data.top_notes && data.top_notes.length > 0 ? data.top_notes : 
                     data.notes.sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0)).slice(0, 5);
    
    byId("topNotesList").innerHTML = topNotes.length > 0 ? topNotes.map((note, i) => `
      <div class="ranked-item">
        <span class="rank-number">${i + 1}</span>
        <span class="rank-content">${escapeHtml(note.content || "无内容")}</span>
        <span class="rank-votes">👍 ${note.votes_count || 0}</span>
      </div>
    `).join("") : '<p style="color: var(--text-secondary); font-size: 12px; margin: 0;">暂无便签</p>';
    
    const participationEntries = Object.entries(data.participation || {});
    byId("participationStats").innerHTML = participationEntries.length > 0 ? participationEntries.map(([name, count]) => `
      <div class="participation-item">
        <span>${escapeHtml(name)}</span>
        <span>${count} 个便签</span>
      </div>
    `).join("") : '<p style="color: var(--text-secondary); font-size: 12px; margin: 0;">暂无数据</p>';
    
    const completed = data.actions.filter(a => a.status === "completed").length;
    const pending = data.actions.filter(a => a.status === "pending").length;
    const inProgress = data.actions.filter(a => a.status === "in_progress").length;
    const progress = data.actions.length > 0 ? Math.round((completed / data.actions.length) * 100) : 0;
    
    byId("taskProgress").innerHTML = `
      <div class="progress-item">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>总体进度</span>
          <span>${completed}/${data.actions.length}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
      </div>
      <div class="progress-item" style="margin-top: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>已完成</span>
          <span>${completed}</span>
        </div>
      </div>
      <div class="progress-item" style="margin-top: 8px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>进行中</span>
          <span>${inProgress}</span>
        </div>
      </div>
      <div class="progress-item" style="margin-top: 8px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>待处理</span>
          <span>${pending}</span>
        </div>
      </div>
    `;
  } catch (error) {
    console.error(error);
    byId("statParticipants").textContent = "0";
    byId("statNotes").textContent = "0";
    byId("statVotes").textContent = "0";
    byId("statActions").textContent = "0";
    byId("topNotesList").innerHTML = '<p style="color: var(--text-secondary); font-size: 12px; margin: 0;">加载失败</p>';
    byId("participationStats").innerHTML = '<p style="color: var(--text-secondary); font-size: 12px; margin: 0;">加载失败</p>';
    byId("taskProgress").innerHTML = '<p style="color: var(--text-secondary); font-size: 12px; margin: 0;">加载失败</p>';
  }
}

async function refreshBoardList() {
  try {
    const res = await api("/api/boards");
    renderBoardList(res.data);
    return res.data;
  } catch (error) {
    console.error(error);
    setHealth(error.message, "error");
    throw error;
  }
}

async function createBoard() {
  openModal(
    "创建新白板",
    `
      <div class="form-group">
        <label>白板标题 *</label>
        <input type="text" id="newBoardTitle" placeholder="输入白板标题" value="产品创新头脑风暴" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>模板</label>
          <select id="newBoardTemplate">
            <option value="blank">空白模板</option>
            <option value="brainstorm">标准头脑风暴</option>
            <option value="retro">团队复盘</option>
            <option value="planning">项目规划</option>
            <option value="ideation">创意发散</option>
          </select>
        </div>
        <div class="form-group">
          <label>会议时间</label>
          <input type="datetime-local" id="newBoardTime" />
        </div>
      </div>
      <div class="form-group">
        <label>主题</label>
        <input type="text" id="newBoardTheme" placeholder="本次头脑风暴的主题" value="Q3 产品功能规划" />
      </div>
      <div class="form-group">
        <label>产出目标</label>
        <textarea id="newBoardGoal" placeholder="希望达成的目标和产出">确定下季度重点功能方向，输出至少 10 个可落地的创意点和 5 个行动项</textarea>
      </div>
      <div class="form-group">
        <label>参与人（用逗号分隔）</label>
        <input type="text" id="newBoardParticipants" placeholder="张三, 李四, 王五" value="产品经理, 设计师, 开发工程师, 运营" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>权限设置</label>
          <select id="newBoardPermission">
            <option value="public">公开（所有人可编辑）</option>
            <option value="readonly">只读</option>
            <option value="private">仅主持人可编辑</option>
          </select>
        </div>
        <div class="form-group">
          <label>创建者</label>
          <input type="text" id="newBoardCreator" value="主持人" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>
            <input type="checkbox" id="newBoardAnonymous" /> 匿名模式
          </label>
        </div>
        <div class="form-group">
          <label>限时（分钟）</label>
          <input type="number" id="newBoardTimeLimit" placeholder="不限制" min="1" />
        </div>
      </div>
    `,
    async () => {
      const title = byId("newBoardTitle").value.trim();
      if (!title) {
        alert("请输入白板标题");
        return;
      }
      
      const theme = byId("newBoardTheme").value;
      const template = byId("newBoardTemplate").value;
      const outputGoal = byId("newBoardGoal").value;
      const meetingTime = byId("newBoardTime").value;
      const createdBy = byId("newBoardCreator").value || "主持人";
      const isAnonymous = byId("newBoardAnonymous").checked;
      const timeLimit = byId("newBoardTimeLimit").value;
      const participants = byId("newBoardParticipants").value;
      
      try {
        setHealth("创建中...", "pending");
        const res = await api("/api/boards", {
          method: "POST",
          body: JSON.stringify({
            title,
            theme,
            template,
            output_goal: outputGoal,
            meeting_time: meetingTime,
            created_by: createdBy,
            is_anonymous: isAnonymous ? 1 : 0,
            time_limit: timeLimit ? parseInt(timeLimit) : null
          })
        });
        
        const boardId = res.data.id;
        
        if (participants && participants.trim()) {
          const names = participants.split(/[,，]/).map(s => s.trim()).filter(s => s);
          for (const name of names) {
            try {
              await api(`/api/boards/${boardId}/participants`, {
                method: "POST",
                body: JSON.stringify({ display_name: name, role: "participant" })
              });
            } catch (e) {
              console.error("Failed to add participant:", name, e);
            }
          }
        }
        
        setHealth("创建示例数据...", "pending");
        await seedSampleData(boardId, createdBy);
        
        setHealth("API 已连接", "ok");
        closeModal();
        await selectBoard(boardId);
      } catch (error) {
        console.error(error);
        setHealth(error.message, "error");
        alert("创建失败: " + error.message);
      }
    }
  );
}

async function seedSampleData(boardId, creator) {
  try {
    const notes = [
      { content: "优化首页加载速度，提升用户体验", color: "#fff9c4", note_type: "idea", x: 80, y: 80, votes: 3 },
      { content: "增加 AI 智能推荐功能", color: "#ffecb3", note_type: "idea", x: 300, y: 80, votes: 5 },
      { content: "支持深色模式切换", color: "#dcedc8", note_type: "idea", x: 520, y: 80, votes: 2 },
      { content: "移动端适配问题较多", color: "#ffecb3", note_type: "problem", x: 80, y: 220, votes: 4 },
      { content: "用户反馈搜索功能不好用", color: "#f8bbd9", note_type: "problem", x: 300, y: 220, votes: 6 },
      { content: "缺少数据导出功能", color: "#b3e5fc", note_type: "need", x: 520, y: 220, votes: 3 },
      { content: "开发专属小程序版本", color: "#fff9c4", note_type: "opportunity", x: 80, y: 360, votes: 7 },
      { content: "接入第三方登录（微信/企业微信）", color: "#dcedc8", note_type: "need", x: 300, y: 360, votes: 4 },
    ];
    
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      await api(`/api/boards/${boardId}/notes`, {
        method: "POST",
        body: JSON.stringify({
          content: n.content,
          color: n.color,
          note_type: n.note_type,
          x: n.x,
          y: n.y,
          created_by: i < 4 ? "产品经理" : i < 6 ? "设计师" : "开发工程师"
        })
      });
    }
    
    await api(`/api/boards/${boardId}/groups`, {
      method: "POST",
      body: JSON.stringify({
        title: "功能优化",
        color: "#e3f2fd",
        x: 50,
        y: 50,
        width: 230,
        height: 280,
        created_by: creator
      })
    });
    
    await api(`/api/boards/${boardId}/groups`, {
      method: "POST",
      body: JSON.stringify({
        title: "问题收集",
        color: "#ffebee",
        x: 290,
        y: 50,
        width: 230,
        height: 280,
        created_by: creator
      })
    });
    
    await api(`/api/boards/${boardId}/groups`, {
      method: "POST",
      body: JSON.stringify({
        title: "新机会",
        color: "#e8f5e9",
        x: 530,
        y: 50,
        width: 230,
        height: 280,
        created_by: creator
      })
    });
    
    const actions = [
      { title: "完成首页性能优化", assignee: "开发工程师", status: "in_progress", priority: "high", due_date: "2026-06-15" },
      { title: "输出 AI 功能需求文档", assignee: "产品经理", status: "pending", priority: "high", due_date: "2026-06-10" },
      { title: "完成深色模式设计稿", assignee: "设计师", status: "completed", priority: "medium", due_date: "2026-06-05" },
      { title: "用户调研搜索体验", assignee: "运营", status: "pending", priority: "medium", due_date: "2026-06-20" }
    ];
    
    for (const a of actions) {
      await api(`/api/boards/${boardId}/actions`, {
        method: "POST",
        body: JSON.stringify({
          ...a,
          item_type: "action",
          created_by: creator
        })
      });
    }
    
    const allNotes = await api(`/api/boards/${boardId}/notes`);
    for (const note of allNotes.data.slice(0, 5)) {
      await api(`/api/boards/${boardId}/notes/${note.id}/vote`, {
        method: "POST",
        body: JSON.stringify({ user_id: "voter_" + Math.random() })
      });
    }
    
  } catch (error) {
    console.error("Failed to seed sample data:", error);
  }
}

async function addNote() {
  if (!selectedBoardId) return;
  try {
    await api(`/api/boards/${selectedBoardId}/notes`, {
      method: "POST",
      body: JSON.stringify({
        content: "新便签",
        color: currentColor,
        x: 150 + Math.random() * 300,
        y: 150 + Math.random() * 200,
        created_by: "当前用户",
        note_type: "idea"
      })
    });
    loadCanvas();
  } catch (error) {
    console.error(error);
  }
}

async function addGroup() {
  if (!selectedBoardId) return;
  try {
    await api(`/api/boards/${selectedBoardId}/groups`, {
      method: "POST",
      body: JSON.stringify({
        title: "新分组",
        x: 300 + Math.random() * 100,
        y: 100 + Math.random() * 100,
        created_by: "当前用户"
      })
    });
    loadCanvas();
  } catch (error) {
    console.error(error);
  }
}

async function addAction() {
  if (!selectedBoardId) return;
  openModal(
    "新增行动项",
    `
      <div class="form-group">
        <label>标题 *</label>
        <input type="text" id="newActionTitle" placeholder="行动项标题" />
      </div>
      <div class="form-group">
        <label>描述</label>
        <textarea id="newActionDesc" placeholder="详细描述"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>负责人</label>
          <input type="text" id="newActionAssignee" placeholder="指派给谁" />
        </div>
        <div class="form-group">
          <label>截止日期</label>
          <input type="date" id="newActionDue" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>类型</label>
          <select id="newActionType">
            <option value="action">行动项</option>
            <option value="opportunity">机会点</option>
            <option value="problem">问题</option>
            <option value="need">需求</option>
          </select>
        </div>
        <div class="form-group">
          <label>优先级</label>
          <select id="newActionPriority">
            <option value="low">低</option>
            <option value="medium" selected>中</option>
            <option value="high">高</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>状态</label>
        <select id="newActionStatus">
          <option value="pending" selected>待处理</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
        </select>
      </div>
    `,
    async () => {
      const title = byId("newActionTitle").value.trim();
      if (!title) {
        alert("请输入行动项标题");
        return;
      }
      try {
        await api(`/api/boards/${selectedBoardId}/actions`, {
          method: "POST",
          body: JSON.stringify({
            title: title,
            description: byId("newActionDesc").value,
            assignee: byId("newActionAssignee").value,
            due_date: byId("newActionDue").value,
            item_type: byId("newActionType").value,
            priority: byId("newActionPriority").value,
            status: byId("newActionStatus").value,
            created_by: "当前用户"
          })
        });
        closeModal();
        loadOutput();
      } catch (error) {
        console.error(error);
        alert("创建失败: " + error.message);
      }
    }
  );
}

byId("createBoardBtn").onclick = createBoard;
byId("createBoardEmptyBtn").onclick = createBoard;
byId("addNoteBtn").onclick = addNote;
byId("addGroupBtn").onclick = addGroup;
byId("addActionBtn").onclick = addAction;
byId("viewHistoryBtn").onclick = async () => {
  if (!selectedBoardId) return;
  try {
    const res = await api(`/api/boards/${selectedBoardId}/history`);
    const history = res.data.slice(0, 30);
    openModal(
      "操作历史（最近 30 条）",
      `<div style="max-height: 500px; overflow-y: auto;">
        ${history.length > 0 ? history.map(h => `
          <div style="padding: 10px 0; border-bottom: 1px solid var(--border);">
            <div style="font-weight: 500; color: var(--primary);">${escapeHtml(h.operation)}</div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
              ${escapeHtml(h.created_by || "系统")} · ${h.created_at}
            </div>
            ${h.data ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 4px; background: var(--bg-secondary); padding: 6px; border-radius: 4px; word-break: break-all;">${escapeHtml(h.data)}</div>` : ''}
          </div>
        `).join("") : '<p style="color: var(--text-secondary);">暂无操作记录</p>'}
      </div>`,
      null,
      true
    );
  } catch (error) {
    console.error(error);
    alert("加载失败: " + error.message);
  }
};

document.querySelectorAll(".tool-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tool-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentTool = btn.dataset.tool;
    
    if (currentTool === "note") {
      addNote();
      setTimeout(() => {
        document.querySelector('.tool-btn[data-tool="select"]').click();
      }, 100);
    } else if (currentTool === "group") {
      addGroup();
      setTimeout(() => {
        document.querySelector('.tool-btn[data-tool="select"]').click();
      }, 100);
    }
  };
});

document.querySelectorAll(".color-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".color-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentColor = btn.dataset.color;
  };
});

byId("boardStatus").onchange = async () => {
  if (!selectedBoardId) return;
  try {
    await api(`/api/boards/${selectedBoardId}`, {
      method: "PUT",
      body: JSON.stringify({ status: byId("boardStatus").value })
    });
    loadBoardData();
  } catch (error) {
    console.error(error);
  }
};

byId("anonymousMode").onchange = async () => {
  if (!selectedBoardId) return;
  try {
    await api(`/api/boards/${selectedBoardId}`, {
      method: "PUT",
      body: JSON.stringify({ is_anonymous: byId("anonymousMode").checked ? 1 : 0 })
    });
  } catch (error) {
    console.error(error);
  }
};

byId("hostLock").onchange = async () => {
  if (!selectedBoardId) return;
  try {
    await api(`/api/boards/${selectedBoardId}`, {
      method: "PUT",
      body: JSON.stringify({ host_lock: byId("hostLock").checked ? 1 : 0 })
    });
  } catch (error) {
    console.error(error);
  }
};

byId("refreshButton").onclick = refresh;

async function seedIfEmpty() {
  try {
    const res = await api("/api/boards");
    if (res.data.length === 0) {
      setHealth("正在创建示例数据...", "pending");
      await createSampleBoard();
      setHealth("API 已连接", "ok");
    }
  } catch (error) {
    console.error("Seed error:", error);
  }
}

async function createSampleBoard() {
  try {
    const boardRes = await api("/api/boards", {
      method: "POST",
      body: JSON.stringify({
        title: "产品创新头脑风暴（示例）",
        theme: "Q3 产品功能规划",
        template: "brainstorm",
        output_goal: "确定下季度重点功能方向，输出至少 10 个可落地的创意点和 5 个行动项",
        meeting_time: "",
        created_by: "主持人",
        is_anonymous: 0
      })
    });
    
    const boardId = boardRes.data.id;
    
    const participants = ["产品经理", "设计师", "开发工程师", "运营"];
    for (const name of participants) {
      await api(`/api/boards/${boardId}/participants`, {
        method: "POST",
        body: JSON.stringify({ display_name: name, role: "participant" })
      });
    }
    
    await seedSampleData(boardId, "主持人");
    
    return boardId;
  } catch (error) {
    console.error("Failed to create sample board:", error);
    throw error;
  }
}

async function init() {
  setHealth("连接中...", "pending");
  try {
    await api("/api/health");
    setHealth("API 已连接", "ok");
    
    const boards = await refreshBoardList();
    
    if (boards.length === 0) {
      await seedIfEmpty();
      await refreshBoardList();
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const boardId = urlParams.get("board");
    if (boardId) {
      await selectBoard(parseInt(boardId));
    }
  } catch (error) {
    console.error(error);
    setHealth(error.message, "error");
  }
}

async function refresh() {
  setHealth("刷新中...", "pending");
  try {
    await api("/api/health");
    setHealth("API 已连接", "ok");
    await refreshBoardList();
    if (selectedBoardId) {
      await loadBoardData();
      if (currentView === "canvas") await loadCanvas();
      else if (currentView === "output") await loadOutput();
      else if (currentView === "review") await loadReview();
    }
  } catch (error) {
    console.error(error);
    setHealth(error.message, "error");
  }
}

init();
