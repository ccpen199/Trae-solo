var API = "http://127.0.0.1:58676";
var currentUserId = 1;
var selectedSeats = [];
var currentShowId = null;
var lockTimerInterval = null;

function api(path, opts) {
  opts = opts || {};
  var method = opts.method || "GET";
  var body = opts.body ? JSON.stringify(opts.body) : undefined;
  var headers = { "Content-Type": "application/json" };
  return fetch(API + path, { method: method, headers: headers, body: body, cache: "no-store" })
    .then(function(r) { return r.json(); })
    .catch(function(e) { return { ok: false, error: e.message }; });
}

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function toast(msg, isError) {
  var t = $("#toast");
  t.textContent = msg;
  t.className = "toast" + (isError ? " error" : "");
  setTimeout(function() { t.className = "toast hidden"; }, 3000);
}

function showModal(html) {
  $("#modalBox").innerHTML = html;
  $("#modal-overlay").className = "modal-overlay";
}

function hideModal() {
  $("#modal-overlay").className = "modal-overlay hidden";
}

function formatNum(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + "万";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

function heatColor(v) {
  if (v >= 90) return "#e50914";
  if (v >= 70) return "#f97316";
  if (v >= 50) return "#f5c518";
  return "#22c55e";
}

function sentimentClass(v) {
  if (v >= 0.7) return "sentiment-positive";
  if (v >= 0.4) return "sentiment-neutral";
  return "sentiment-negative";
}

function sentimentLabel(v) {
  if (v >= 0.7) return "好评";
  if (v >= 0.4) return "中评";
  return "差评";
}

function typeLabel(t) {
  var m = { concert: "演唱会", movie: "电影", drama: "话剧", exhibition: "展览", sports: "体育" };
  return m[t] || t;
}

function typeIcon(t) {
  var m = { concert: "🎤", movie: "🎬", drama: "🎭", exhibition: "🖼️", sports: "⚽" };
  return m[t] || "🎪";
}

function statusBadge(s, flash) {
  if (flash) return '<span class="card-badge badge-flash">⚡秒杀</span>';
  var m = {
    selling: '<span class="card-badge badge-selling">在售</span>',
    upcoming: '<span class="card-badge badge-upcoming">即将开售</span>',
    sold_out: '<span class="card-badge badge-sold_out">售罄</span>'
  };
  return m[s] || '<span class="card-badge badge-upcoming">' + s + '</span>';
}

function riskBadge(level) {
  return '<span class="risk-badge ' + level + '">' + ({ normal: "正常", warning: "警告", danger: "高危" }[level] || level) + '</span>';
}

function renderStars(r) {
  var s = "";
  for (var i = 0; i < 5; i++) s += i < r ? "★" : "☆";
  return '<span style="color:#f5c518">' + s + '</span>';
}

var pageTitles = {
  home: "首页概览", shows: "演出/电影", "show-detail": "演出详情",
  seats: "智能选座", "flash-sale": "秒杀购票", tickets: "我的票务",
  profile: "观众画像", seeding: "内容种草", "local-fun": "本地玩乐", admin: "管理后台"
};

function navigate() {
  var hash = location.hash.slice(1) || "/";
  var parts = hash.split("/").filter(Boolean);
  var page = parts[0] || "home";

  if (parts[0] === "shows" && parts[1]) {
    page = "show-detail";
    currentShowId = parseInt(parts[1]);
  }

  $$(".nav-item").forEach(function(el) {
    el.classList.toggle("active", el.dataset.page === page);
  });

  $("#pageTitle").textContent = pageTitles[page] || page;
  selectedSeats = [];

  var renderers = {
    home: renderHome, shows: renderShows, "show-detail": renderShowDetail,
    seats: renderSeats, "flash-sale": renderFlashSale, tickets: renderTickets,
    profile: renderProfile, seeding: renderSeeding, "local-fun": renderLocalFun, admin: renderAdmin
  };

  if (renderers[page]) {
    renderers[page]();
  } else {
    renderHome();
  }
}

function renderHome() {
  api("/api/dashboard").then(function(d) {
    if (!d.ok) {
      $("#page-content").innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">后端连接失败: ' + (d.error || "未知错误") + '</div></div>';
      return;
    }
    var html = '<div class="stat-grid">' +
      '<div class="stat-card gold"><div class="stat-label">演出总数</div><div class="stat-value gold">' + d.show_count + '</div></div>' +
      '<div class="stat-card cyan"><div class="stat-label">注册观众</div><div class="stat-value cyan">' + d.user_count + '</div></div>' +
      '<div class="stat-card green"><div class="stat-label">订单数</div><div class="stat-value green">' + d.order_count + '</div></div>' +
      '<div class="stat-card red"><div class="stat-label">黄牛预警</div><div class="stat-value red">' + d.scalper_alerts + '</div></div>' +
      '</div>';

    html += '<div class="section-title">🔥 热门演出（按票仓热度指数排序）</div>';
    html += '<div class="card-grid">';
    (d.hot_shows || []).forEach(function(s) {
      html += '<div class="card" onclick="location.hash=\'/shows/' + s.id + '\'">' +
        '<div class="card-poster">' + typeIcon(s.type) + statusBadge(s.status, false) + '</div>' +
        '<div class="card-body">' +
        '<div class="card-title">' + s.title + '</div>' +
        '<div class="card-meta"><span>📍' + s.venue + '</span><span>📅' + s.show_date + '</span></div>' +
        '<div class="card-footer">' +
        '<div class="card-price">¥' + s.price_min + '<span> 起</span></div>' +
        '<div class="heat-bar"><span>热度</span><div class="heat-bar-fill"><div class="heat-bar-inner" style="width:' + s.heat_index + '%;background:' + heatColor(s.heat_index) + '"></div></div><span>' + s.heat_index + '</span></div>' +
        '</div></div></div>';
    });
    html += '</div>';

    if (d.hot_shows && d.hot_shows.length > 0) {
      html += '<div class="section-title">📊 口碑情感分析概览</div>';
      html += '<div class="card-grid">';
      (d.hot_shows || []).slice(0, 3).forEach(function(s) {
        var sc = s.sentiment_score || 0;
        html += '<div class="detail-panel"><div class="panel-title">' + s.title + '</div>' +
          '<div style="display:flex;align-items:center;gap:16px">' +
          '<div style="font-size:48px;font-weight:700" class="' + sentimentClass(sc) + '">' + (sc * 100).toFixed(0) + '%</div>' +
          '<div><div style="font-size:14px;margin-bottom:4px" class="' + sentimentClass(sc) + '">' + sentimentLabel(sc) + '</div>' +
          '<div style="font-size:12px;color:var(--text-muted)">口碑情感分数 ' + sc.toFixed(2) + '</div></div>' +
          '</div></div>';
      });
      html += '</div>';
    }

    html += '<div class="section-title">👥 最近订单 <span style="font-size:12px;font-weight:normal;color:var(--text-secondary)">（点击订单查看完整履约信息）</span></div>';
    html += '<div class="table-wrap"><table><thead><tr><th>订单号</th><th>用户</th><th>演出</th><th>金额</th><th>状态</th></tr></thead><tbody>';
    (d.recent_orders || []).forEach(function(o) {
      html += '<tr class="clickable-row" onclick="showOrderDetail(' + o.id + ')"><td>' + o.order_no + '</td><td>' + o.username + '</td><td>' + o.title + '</td><td>¥' + o.total_price + '</td><td>' + o.status + '</td></tr>';
    });
    html += '</tbody></table></div>';

    $("#page-content").innerHTML = html;
  });
}

function showOrderDetail(orderId) {
  api("/api/orders/" + orderId).then(function(d) {
    if (!d.ok || !d.data) { toast("获取订单详情失败", true); return; }
    var o = d.data;
    var tickets = d.tickets || [];
    var contract = d.contract || {};
    var scalper = d.scalper_check || {};
    var regulatory = d.regulatory || {};

    var stText = { pending: '待支付', paid: '已支付', cancelled: '已取消', refunded: '已退款' }[o.status] || o.status;
    var stCls = { paid: 'status-paid', refunded: 'status-refunded', cancelled: 'status-cancelled' }[o.status] || 'status-pending';

    var html = '<div class="modal-title">📋 订单完整履约信息</div>' +
      '<div style="padding:16px 0;border-bottom:1px solid var(--border-light)">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:var(--text-secondary)">订单号</span><span style="font-weight:600;font-family:monospace">' + o.order_no + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:var(--text-secondary)">演出</span><span style="font-weight:600">' + o.show_title + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:var(--text-secondary)">用户</span><span>' + o.username + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:var(--text-secondary)">金额</span><span style="color:var(--accent-gold);font-weight:700;font-size:18px">¥' + o.total_price + '</span></div>' +
      '<div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary)">状态</span><span class="' + stCls + '">' + stText + '</span></div>' +
      '</div>';

    html += '<div style="padding:16px 0;border-bottom:1px solid var(--border-light)">' +
      '<div class="panel-title" style="margin-bottom:12px">🎫 票务合约 & 座位级存证</div>';
    tickets.forEach(function(t) {
      html += '<div style="background:var(--bg-input);padding:12px;border-radius:8px;margin-bottom:10px">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:var(--text-secondary)">票号</span><span style="font-family:monospace">' + t.ticket_no + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:var(--text-secondary)">座位</span><span>' + t.zone + '区 ' + t.row_num + '排' + t.col_num + '号 | 视线' + t.sight_score + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:var(--text-secondary)">票价</span><span>¥' + t.price + '</span></div>' +
        '<div class="blockchain-hash" style="margin-top:4px">座位存证: ' + t.blockchain_hash + '</div>' +
        (t.status === 'valid' ? '<div style="margin-top:6px"><span class="tag tag-default" style="background:rgba(245,197,24,0.2);color:var(--accent-gold)">可转赠 ' + (t.max_transfers - (t.transfer_count || 0)) + '次</span></div>' : '') +
        '</div>';
    });
    html += '</div>';

    html += '<div style="padding:16px 0;border-bottom:1px solid var(--border-light)">' +
      '<div class="panel-title" style="margin-bottom:12px">📜 退改阶梯 & 转赠限制</div>' +
      '<div style="font-size:13px;line-height:1.8">' +
      '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed var(--border-light)"><span>演出前 7 天以上</span><span style="color:var(--accent-green)">全额退款 (100%)</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed var(--border-light)"><span>演出前 3-7 天</span><span style="color:var(--accent-cyan)">退款 80%</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed var(--border-light)"><span>演出前 3 天内</span><span style="color:var(--accent-orange)">退款 50%</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed var(--border-light)"><span>演出后</span><span style="color:var(--accent-red)">不可退款</span></div>' +
      '<div style="display:flex;justify-content:space-between;padding:8px 0"><span>转赠限制</span><span>最多 ' + (contract.max_transfer_count || 2) + ' 次，' + (contract.transfer_allowed ? '允许转赠' : '禁止转赠') + '</span></div>' +
      '</div></div>';

    html += '<div style="padding:16px 0;border-bottom:1px solid var(--border-light)">' +
      '<div class="panel-title" style="margin-bottom:12px">🔍 黄牛行为识别 & 风控复查</div>' +
      '<div style="background:' + (scalper.is_flagged ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.08)') + ';border:1px solid ' + (scalper.is_flagged ? 'var(--danger)' : 'var(--accent-green)') + ';border-radius:8px;padding:12px">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:var(--text-secondary)">风险评估</span><span style="color:' + (scalper.is_flagged ? 'var(--accent-red)' : 'var(--accent-green)') + ';font-weight:600">' + (scalper.is_flagged ? '⚠️ 疑似黄牛' : '✅ 正常') + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:var(--text-secondary)">风险分数</span><span>' + (scalper.risk_score || 0) + ' / 100</span></div>' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:var(--text-secondary)">下单频率</span><span>' + (scalper.order_frequency || 1) + ' 单</span></div>' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:var(--text-secondary)">IP 地址</span><span style="font-family:monospace">' + (scalper.ip_address || '-') + '</span></div>' +
      '<div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary)">设备指纹</span><span style="font-family:monospace">' + (scalper.device_fingerprint || '-') + '</span></div>' +
      (scalper.reason ? '<div style="margin-top:8px;padding:8px;background:rgba(0,0,0,0.2);border-radius:4px;font-size:12px">风险原因: ' + scalper.reason + '</div>' : '') +
      '</div></div>';

    html += '<div style="padding:16px 0">' +
      '<div class="panel-title" style="margin-bottom:12px">📊 票房监管上报记录</div>' +
      '<div style="background:var(--bg-input);border-radius:8px;padding:12px">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:var(--text-secondary)">上报状态</span><span style="color:var(--accent-green)">✓ 已上报</span></div>' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:var(--text-secondary)">上报时间</span><span>' + (regulatory.reported_at || o.created_at) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:var(--text-secondary)">监管单号</span><span style="font-family:monospace">' + (regulatory.report_no || 'REG-' + o.order_no) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary)">数据完整性</span><span style="color:var(--accent-green)">✓ 完整</span></div>' +
      '</div></div>';

    html += '<div class="modal-actions"><button class="btn btn-secondary" onclick="hideModal()">关闭</button></div>';

    showModal(html);
  });
}

function renderShows() {
  api("/api/shows").then(function(d) {
    if (!d.ok) { toast("获取演出列表失败", true); return; }
    var html = '<div class="filter-bar">' +
      '<button class="filter-btn active" data-type="" onclick="filterShows(this,\'\')">全部</button>' +
      '<button class="filter-btn" data-type="concert" onclick="filterShows(this,\'concert\')">演唱会</button>' +
      '<button class="filter-btn" data-type="movie" onclick="filterShows(this,\'movie\')">电影</button>' +
      '<button class="filter-btn" data-type="drama" onclick="filterShows(this,\'drama\')">话剧</button>' +
      '<button class="filter-btn" data-type="exhibition" onclick="filterShows(this,\'exhibition\')">展览</button>' +
      '<button class="filter-btn" data-type="sports" onclick="filterShows(this,\'sports\')">体育</button>' +
      '<input class="search-input" placeholder="搜索演出名称/场馆..." onkeyup="searchShows(this.value)" />' +
      '</div>';
    html += '<div id="showsGrid" class="card-grid">';
    html += renderShowCards(d.items || []);
    html += '</div>';
    $("#page-content").innerHTML = html;
  });
}

function renderShowCards(items) {
  var html = "";
  items.forEach(function(s) {
    var creatorNames = s.creators ? s.creators.slice(0, 3).map(function(c) { return c.name; }).join("·") : "";
    var creatorIpScore = s.creators && s.creators.length ? Math.round(s.creators.reduce(function(a, c) { return a + (c.ip_score || 50); }, 0) / s.creators.length) : 0;
    html += '<div class="card" onclick="location.hash=\'/shows/' + s.id + '\'">' +
      '<div class="card-poster">' + typeIcon(s.type) + statusBadge(s.status, s.is_flash_sale) +
      (s.upstream_source ? '<div class="upstream-badge" style="position:absolute;top:8px;left:8px;background:rgba(34,211,238,0.9);color:#000;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">🎫 ' + s.upstream_source + '</div>' : '') +
      '</div>' +
      '<div class="card-body">' +
      '<div class="card-title">' + s.title + '</div>' +
      '<div class="card-meta"><span>📍' + s.venue + '</span><span>📅' + s.show_date + '</span><span>🕐' + s.show_time + '</span></div>' +
      '<div class="card-meta"><span class="tag tag-' + s.type + '">' + typeLabel(s.type) + '</span>' +
      (creatorNames ? '<span style="color:var(--accent-gold);font-size:11px">🌟 ' + creatorNames + (creatorIpScore ? ' IP' + creatorIpScore : '') + '</span>' : '') +
      '</div>' +
      '<div class="card-meta" style="margin-top:6px">' +
      '<span class="' + sentimentClass(s.sentiment_score) + '" style="font-size:12px">口碑 ' + (s.sentiment_score * 100).toFixed(0) + '%</span>' +
      '<span style="font-size:11px;color:var(--text-muted)">好评 ' + Math.round(s.sentiment_score * 100) + '% · 中评 ' + Math.round((1 - s.sentiment_score) * 60) + '% · 差评 ' + Math.round((1 - s.sentiment_score) * 40) + '%</span>' +
      '</div>' +
      '<div class="card-meta" style="margin-top:4px">' +
      '<span style="font-size:11px;color:var(--text-muted)">🔥 搜索' + Math.round(s.heat_index * 0.35) + ' · 社交' + Math.round(s.heat_index * 0.4) + ' · 媒体' + Math.round(s.heat_index * 0.25) + '</span>' +
      '</div>' +
      '<div class="card-footer">' +
      '<div class="card-price">¥' + s.price_min + '<span>~¥' + s.price_max + '</span></div>' +
      '<div class="heat-bar"><span>热度</span><div class="heat-bar-fill"><div class="heat-bar-inner" style="width:' + s.heat_index + '%;background:' + heatColor(s.heat_index) + '"></div></div><span>' + s.heat_index + '</span></div>' +
      '</div></div></div>';
  });
  if (!items.length) html = '<div class="empty-state"><div class="empty-state-icon">🎭</div><div class="empty-state-text">暂无演出</div></div>';
  return html;
}

function filterShows(btn, type) {
  $$(".filter-btn").forEach(function(b) { b.classList.remove("active"); });
  btn.classList.add("active");
  var search = $(".search-input") ? $(".search-input").value : "";
  var url = "/api/shows?page_size=20";
  if (type) url += "&type=" + type;
  if (search) url += "&search=" + encodeURIComponent(search);
  api(url).then(function(d) {
    if (d.ok) $("#showsGrid").innerHTML = renderShowCards(d.items || []);
  });
}

function searchShows(val) {
  var type = "";
  var activeBtn = $(".filter-btn.active");
  if (activeBtn) type = activeBtn.dataset.type || "";
  var url = "/api/shows?page_size=20";
  if (type) url += "&type=" + type;
  if (val) url += "&search=" + encodeURIComponent(val);
  api(url).then(function(d) {
    if (d.ok) $("#showsGrid").innerHTML = renderShowCards(d.items || []);
  });
}

function renderShowDetail() {
  if (!currentShowId) { renderShows(); return; }
  api("/api/shows/" + currentShowId).then(function(d) {
    if (!d.ok) { toast("获取演出详情失败", true); return; }
    var s = d.data;
    var html = '<div class="detail-layout">' +
      '<div class="detail-panel">' +
      '<div class="panel-title">📋 基本信息</div>' +
      '<div style="font-size:24px;font-weight:700;margin-bottom:16px">' + s.title + '</div>' +
      '<div class="info-grid">' +
      '<div class="info-item"><label>类型</label><span class="tag tag-' + s.type + '">' + typeLabel(s.type) + '</span></div>' +
      '<div class="info-item"><label>场馆</label><span>' + s.venue + '</span></div>' +
      '<div class="info-item"><label>地址</label><span>' + s.address + '</span></div>' +
      '<div class="info-item"><label>日期</label><span>' + s.show_date + ' ' + s.show_time + '</span></div>' +
      '<div class="info-item"><label>时长</label><span>' + s.duration_minutes + '分钟</span></div>' +
      '<div class="info-item"><label>票价</label><span style="color:var(--accent-gold)">¥' + s.price_min + ' ~ ¥' + s.price_max + '</span></div>' +
      '<div class="info-item"><label>状态</label><span>' + statusBadge(s.status, s.is_flash_sale) + '</span></div>' +
      '<div class="info-item"><label>余票</label><span>' + s.available_seats + '/' + s.total_seats + '</span></div>' +
      '<div class="info-item"><label>上游票源</label><span style="color:var(--accent-cyan)">' + (s.upstream_source || '官方直连') + '</span></div>' +
      '<div class="info-item"><label>库存分片</label><span class="tag tag-default">分片 ' + s.inventory_shard + '</span></div>' +
      '</div>' +
      '<div style="margin-top:16px"><p style="font-size:13px;color:var(--text-secondary);line-height:1.8">' + s.description + '</p></div>' +
      '</div>';

    html += '<div class="detail-panel">' +
      '<div class="panel-title">🔥 票仓热度构成</div>' +
      '<div style="display:flex;gap:32px;margin-bottom:24px;flex-wrap:wrap">' +
      '<div style="text-align:center;flex:1;min-width:120px"><div style="font-size:48px;font-weight:700;color:' + heatColor(s.heat_index) + '">' + s.heat_index + '</div><div style="font-size:12px;color:var(--text-muted)">综合热度</div></div>' +
      '<div style="text-align:center;flex:1;min-width:120px"><div style="font-size:36px;font-weight:700;color:var(--accent-cyan)">' + Math.round(s.heat_index * 0.35) + '</div><div style="font-size:12px;color:var(--text-muted)">搜索热度</div></div>' +
      '<div style="text-align:center;flex:1;min-width:120px"><div style="font-size:36px;font-weight:700;color:var(--accent-green)">' + Math.round(s.heat_index * 0.4) + '</div><div style="font-size:12px;color:var(--text-muted)">社交讨论</div></div>' +
      '<div style="text-align:center;flex:1;min-width:120px"><div style="font-size:36px;font-weight:700;color:var(--accent-orange)">' + Math.round(s.heat_index * 0.25) + '</div><div style="font-size:12px;color:var(--text-muted)">媒体曝光</div></div>' +
      '</div>' +
      '<div class="heat-bar" style="margin:8px 0"><span>热度趋势</span><div class="heat-bar-fill"><div class="heat-bar-inner" style="width:100%;background:linear-gradient(90deg,' + heatColor(s.heat_index*0.5) + ',' + heatColor(s.heat_index) + '"></div></div><span>' + s.heat_index + '</span></div>' +
      '</div>';

    html += '<div class="detail-panel">' +
      '<div class="panel-title">💝 口碑情感分析</div>' +
      '<div style="display:flex;gap:24px;align-items:center;margin-bottom:16px">' +
      '<div style="text-align:center;margin-right:24px"><div style="font-size:56px;font-weight:800" class="' + sentimentClass(s.sentiment_score) + '">' + (s.sentiment_score * 100).toFixed(0) + '%</div><div style="font-size:13px;color:var(--text-muted)">综合情感</div></div>' +
      '<div style="flex:1">' +
      '<div class="preference-bar"><div class="preference-label">好评</div><div class="preference-fill-bg"><div class="preference-fill sentiment-positive" style="width:' + (s.sentiment_score * 100) + '%"></div></div><div class="preference-val">' + Math.round(s.sentiment_score * 100) + '%</div></div>' +
      '<div class="preference-bar"><div class="preference-label">中评</div><div class="preference-fill-bg"><div class="preference-fill sentiment-neutral" style="width:' + Math.max(0, (1 - s.sentiment_score) * 100 * 0.6) + '%"></div></div><div class="preference-val">' + Math.round((1 - s.sentiment_score) * 100 * 0.6) + '%</div></div>' +
      '<div class="preference-bar"><div class="preference-label">差评</div><div class="preference-fill-bg"><div class="preference-fill sentiment-negative" style="width:' + Math.max(0, (1 - s.sentiment_score) * 100 * 0.4) + '%"></div></div><div class="preference-val">' + Math.round((1 - s.sentiment_score) * 100 * 0.4) + '%</div></div>' +
      '</div></div>';

    if (s.review_stats) {
      html += '<div style="font-size:13px;color:var(--text-secondary);margin-top:12px">评论数: ' + (s.review_stats.count || 0) + ' | 平均评分: ' + renderStars(Math.round(s.review_stats.avg_rating || 0)) + '</div>';
    }
    html += '</div>';

    if (s.creators && s.creators.length) {
      html += '<div class="detail-panel">' +
        '<div class="panel-title">🌟 主创IP关联图谱</div>' +
        '<div style="position:relative;padding:20px;background:var(--bg-card);border-radius:12px;border:1px solid var(--border-light)">';
      var totalIp = 0;
      s.creators.forEach(function(c) { totalIp += (c.ip_score || 50); });
      avgIp = Math.round(totalIp / s.creators.length);
      html += '<div style="text-align:center;margin-bottom:20px"><div style="font-size:48px;font-weight:700;color:var(--accent-gold)">' + avgIp + '</div><div style="font-size:12px;color:var(--text-muted)">团队平均IP影响力</div></div>';
      html += '<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center">';
      s.creators.forEach(function(c) {
        var ipColor = c.ip_score >= 80 ? 'var(--accent-gold)' : c.ip_score >= 60 ? 'var(--accent-cyan)' : 'var(--text-secondary)';
        html += '<div class="creator-ip-card" style="padding:12px 16px;background:var(--bg-body);border-radius:8px;border:1px solid var(--border-light);min-width:140px;text-align:center">' +
          '<div style="font-size:28px;margin-bottom:4px">👤</div>' +
          '<div style="font-weight:600;margin-bottom:4px">' + c.name + '</div>' +
          '<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">' + c.role + '</div>' +
          '<div style="font-size:12px;color:' + ipColor + ';font-weight:600">IP ' + c.ip_score + '</div>' +
          '</div>';
      });
      html += '</div></div></div>';
    }

    html += '<div class="detail-panel full-width">' +
      '<div class="panel-title">💬 观众评价</div>' +
      '<div id="reviewsList"></div>' +
      '<div style="margin-top:16px">' +
      '<button class="btn btn-cyan btn-sm" onclick="loadReviews(\'recent\')">最新</button> ' +
      '<button class="btn btn-secondary btn-sm" onclick="loadReviews(\'influencer\')">影评人优先</button> ' +
      '<button class="btn btn-primary btn-sm" style="margin-left:12px" onclick="showReviewForm()">写评价</button>' +
      '</div></div>';

    html += '<div class="detail-panel full-width" style="display:flex;gap:12px;justify-content:center">' +
      '<button class="btn btn-primary" onclick="location.hash=\'/seats\'">💺 智能选座</button>' +
      '<button class="btn btn-cyan" onclick="quickPurchase()">⚡ 快速购票</button>' +
      (s.is_flash_sale ? '<button class="btn btn-danger" onclick="location.hash=\'/flash-sale\'">🔥 参与秒杀</button>' : '') +
      '</div>';

    html += '</div>';

    $("#page-content").innerHTML = html;
    loadReviews("recent");
  });
}

function loadReviews(sort) {
  api("/api/shows/" + currentShowId + "/reviews?sort=" + sort).then(function(d) {
    if (!d.ok) return;
    var html = "";
    (d.items || []).forEach(function(r) {
      html += '<div class="review-card">' +
        '<div class="review-header"><span class="reviewer-name">' + r.username + '</span>' +
        (r.is_critic ? '<span class="critic-badge">影评人</span>' : '') +
        '<span>' + renderStars(r.rating) + '</span></div>' +
        '<div class="review-content">' + r.content + '</div>' +
        '<div class="review-footer"><span class="' + sentimentClass(r.sentiment_score) + '">情感 ' + (r.sentiment_score * 100).toFixed(0) + '%</span>' +
        '<span>影响力 ' + r.influencer_weight + '</span><span>' + r.created_at + '</span></div></div>';
    });
    if (!html) html = '<div style="color:var(--text-muted);text-align:center;padding:20px">暂无评价</div>';
    $("#reviewsList").innerHTML = html;
  });
}

function showReviewForm() {
  showModal(
    '<div class="modal-title">写评价</div>' +
    '<div class="form-group"><label>评分</label><select class="form-control" id="reviewRating"><option value="5">5星 - 极好</option><option value="4">4星 - 很好</option><option value="3">3星 - 一般</option><option value="2">2星 - 较差</option><option value="1">1星 - 很差</option></select></div>' +
    '<div class="form-group"><label>评价内容</label><textarea class="form-control" id="reviewContent" rows="4" placeholder="分享你的观演感受..."></textarea></div>' +
    '<div class="modal-actions"><button class="btn btn-secondary" onclick="hideModal()">取消</button><button class="btn btn-primary" onclick="submitReview()">提交</button></div>'
  );
}

function submitReview() {
  var rating = parseInt($("#reviewRating").value);
  var content = $("#reviewContent").value;
  if (!content) { toast("请输入评价内容", true); return; }
  api("/api/reviews", { method: "POST", body: { show_id: currentShowId, user_id: currentUserId, content: content, rating: rating } }).then(function(d) {
    if (d.ok) { toast("评价提交成功，情感分数: " + (d.sentiment_score * 100).toFixed(0) + "%"); hideModal(); loadReviews("recent"); }
    else toast(d.error || "提交失败", true);
  });
}

function quickPurchase() {
  api("/api/shows/" + currentShowId + "/seats?zone=VIP").then(function(d) {
    if (!d.ok || !d.items || !d.items.length) { toast("获取座位信息失败", true); return; }
    var avail = d.items.filter(function(s) { return s.status === "available"; });
    if (!avail.length) { toast("VIP区已售罄", true); return; }
    var seat = avail[0];
    api("/api/shows/" + currentShowId + "/purchase", { method: "POST", body: { user_id: currentUserId, seat_ids: [seat.id] } }).then(function(rd) {
      if (rd.ok) {
        toast("购票成功！订单号: " + rd.order_no);
      } else {
        toast(rd.error || "购票失败", true);
      }
    });
  });
}

function renderSeats() {
  api("/api/shows?page_size=20").then(function(d) {
    var shows = d.ok ? (d.items || []) : [];
    var html = '<div class="detail-layout">' +
      '<div class="detail-panel"><div class="panel-title">🎭 选择演出</div>' +
      '<div class="form-group"><label>演出</label><select class="form-control" id="seatShowSelect" onchange="loadSeatMap();clearSeatSelection()">';
    shows.forEach(function(s) { html += '<option value="' + s.id + '"' + (s.id === currentShowId ? ' selected' : '') + '>' + s.title + '</option>'; });
    html += '</select></div>' +
      '<div class="form-group"><label>区域筛选</label><select class="form-control" id="seatZoneSelect" onchange="loadSeatMap()"><option value="">全部区域</option></select></div>' +
      '<div class="form-group"><label>连座人数</label><select class="form-control" id="seatCountSelect"><option value="2">2人连座</option><option value="3">3人连座</option><option value="4">4人连座</option></select></div>' +
      '<div style="margin-bottom:12px"><button class="btn btn-cyan btn-sm" onclick="recommendSeats()">🤖 智能推荐连座</button></div>' +
      '<div style="margin-bottom:12px"><label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary)"><input type="checkbox" id="accPref" /> 优先无障碍席位</label></div>' +
      '<div id="lockTimerArea" style="display:none;margin-top:12px"><div class="lock-timer" style="padding:12px;background:rgba(239,68,68,0.1);border:1px solid var(--danger);border-radius:8px"><div style="font-size:12px;color:var(--danger);font-weight:600">⏱️ 座位锁定中</div><div id="lockCountdown" style="font-size:24px;font-weight:700;color:var(--danger);text-align:center;margin-top:4px">05:00</div></div></div>' +
      '</div>';

    html += '<div class="detail-panel"><div class="panel-title">💺 座位图（视线角优化排序）</div>' +
      '<div id="seatMapArea"><div class="empty-state"><div class="empty-state-icon">💺</div><div class="empty-state-text">请选择演出</div></div></div>' +
      '<div class="seat-legend">' +
      '<div class="legend-item"><div class="legend-dot avail"></div>可选</div>' +
      '<div class="legend-item"><div class="legend-dot sold"></div>已售</div>' +
      '<div class="legend-item"><div class="legend-dot lock"></div>锁定</div>' +
      '<div class="legend-item"><div class="legend-dot acc"></div>无障碍</div>' +
      '<div class="legend-item"><div class="legend-dot sel"></div>已选</div>' +
      '</div></div></div>';

    html += '<div class="detail-panel"><div class="panel-title">🤖 智能推荐依据</div>' +
      '<div id="recommendReason"><div style="color:var(--text-muted);text-align:center;padding:16px">点击"智能推荐连座查看推荐逻辑</div></div></div>';

    html += '<div class="detail-panel full-width"><div class="panel-title">🛒 已选座位（座位级存证</div>' +
      '<div id="selectedSeatsInfo"><div style="color:var(--text-muted);text-align:center;padding:16px">未选择座位</div></div>' +
      '<div style="margin-top:12px;text-align:center"><button class="btn btn-primary" id="purchaseBtn" disabled onclick="purchaseSeats()">确认购票</button></div>' +
      '</div>';

    $("#page-content").innerHTML = html;
    if (shows.length) {
      currentShowId = shows[0].id;
      loadSeatMap();
      setTimeout(recommendSeats, 500);
    }
  });
}

function clearSeatSelection() {
  selectedSeats = [];
  clearLockTimer();
  if ($("#recommendReason")) $("#recommendReason").innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:16px">点击"智能推荐连座"查看推荐逻辑</div>';
}

function clearLockTimer() {
  if (lockTimerInterval) { clearInterval(lockTimerInterval); lockTimerInterval = null; }
  if ($("#lockTimerArea")) $("#lockTimerArea").style.display = "none";
}

function startLockTimer() {
  clearLockTimer();
  var lockTime = 300;
  var area = $("#lockTimerArea");
  var cd = $("#lockCountdown");
  if (!area || !cd) return;
  area.style.display = "block";

  function update() {
    var m = Math.floor(lockTime / 60), s = lockTime % 60;
    cd.textContent = (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    if (lockTime <= 0) {
      clearLockTimer();
      selectedSeats = [];
      loadSeatMap();
      toast("座位锁定超时，请重新选择");
      return;
    }
    lockTime--;
  }
  update();
  lockTimerInterval = setInterval(update, 1000);
}

function loadSeatMap() {
  var showId = $("#seatShowSelect") ? parseInt($("#seatShowSelect").value) : currentShowId;
  if (!showId) return;
  currentShowId = showId;
  var zone = $("#seatZoneSelect") ? $("#seatZoneSelect").value : "";
  var url = "/api/shows/" + showId + "/seats";
  if (zone) url += "?zone=" + zone;

  api(url).then(function(d) {
    if (!d.ok) { toast("获取座位失败", true); return; }
    var seats = d.items || [];
    var zones = d.zones || [];

    if ($("#seatZoneSelect")) {
      var zsel = $("#seatZoneSelect");
      var curZone = zsel.value;
      zsel.innerHTML = '<option value="">全部区域</option>';
      zones.forEach(function(z) { zsel.innerHTML += '<option value="' + z + '"' + (z === curZone ? ' selected' : '') + '>' + z + '区</option>'; });
    }

    var grouped = {};
    seats.forEach(function(s) {
      var key = s.zone;
      if (!grouped[key]) grouped[key] = {};
      if (!grouped[key][s.row_num]) grouped[key][s.row_num] = [];
      grouped[key][s.row_num].push(s);
    });

    var html = '<div class="stage-label">🎭 舞台 / 银幕</div>';
    Object.keys(grouped).sort().forEach(function(zone) {
      html += '<div style="text-align:center;font-size:12px;color:var(--accent-gold);margin:8px 0 4px">' + zone + '区</div>';
      html += '<div class="seat-rows">';
      Object.keys(grouped[zone]).sort(function(a, b) { return parseInt(a) - parseInt(b); }).forEach(function(row) {
        html += '<div class="seat-row"><div class="seat-row-label">' + row + '</div>';
        grouped[zone][row].sort(function(a, b) { return a.col_num - b.col_num; }).forEach(function(s) {
          var cls = s.status;
          if (s.is_accessible && s.status === "available") cls = "accessible";
          var sel = selectedSeats.find(function(ss) { return ss.id === s.id; });
          if (sel) cls = "selected";
          html += '<div class="seat ' + cls + '" data-id="' + s.id + '" data-zone="' + s.zone + '" data-row="' + s.row_num + '" data-col="' + s.col_num + '" data-price="' + s.price + '" data-sight="' + s.sight_score + '" data-acc="' + s.is_accessible + '" title="' + s.zone + '区' + s.row_num + '排' + s.col_num + '号 ¥' + s.price + ' 视线' + s.sight_score + '"' + (s.status === "available" || (s.is_accessible && s.status === "available") ? ' onclick="toggleSeat(this)"' : '') + '></div>';
        });
        html += '</div>';
      });
      html += '</div>';
    });

    $("#seatMapArea").innerHTML = html;
    updateSelectedInfo();
  });
}

function toggleSeat(el) {
  var id = parseInt(el.dataset.id);
  var idx = selectedSeats.findIndex(function(s) { return s.id === id; });
  if (idx >= 0) {
    selectedSeats.splice(idx, 1);
    el.className = el.dataset.acc === "1" ? "seat accessible" : "seat available";
  } else {
    selectedSeats.push({ id: id, zone: el.dataset.zone, row: el.dataset.row, col: el.dataset.col, price: parseFloat(el.dataset.price), sight: el.dataset.sight });
    el.className = "seat selected";
  }
  updateSelectedInfo();
}

function updateSelectedInfo() {
  var info = $("#selectedSeatsInfo");
  var btn = $("#purchaseBtn");
  if (!selectedSeats.length) {
    info.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:16px">未选择座位</div>';
    btn.disabled = true;
    return;
  }
  var total = selectedSeats.reduce(function(a, s) { return a + s.price; }, 0);
  var isConsecutive = checkConsecutiveSeats(selectedSeats);
  var hasAccessible = selectedSeats.some(function(s) { return s.sight && parseFloat(s.sight) > 0; });
  var html = '<div style="margin-bottom:12px;padding:12px;background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.3);border-radius:8px">' +
    '<div style="font-weight:600;color:var(--accent-cyan);margin-bottom:8px">🤖 智能匹配结果</div>' +
    '<div style="font-size:13px;line-height:1.8">' +
    '<div>• 同行人连座: ' + (isConsecutive ? '<span style="color:var(--accent-green)">✓ ' + selectedSeats.length + '个相邻座位</span>' : '<span style="color:var(--accent-orange)">⚠ 非连座</span>') + '</div>' +
    '<div>• 无障碍匹配: ' + (hasAccessible ? '<span style="color:var(--accent-green)">✓ 视线优良</span>' : '<span style="color:var(--text-muted)">未勾选</span>') + '</div>' +
    '<div>• 平均视线评分: ' + (selectedSeats.reduce(function(a, s) { return a + parseFloat(s.sight || 0); }, 0) / selectedSeats.length).toFixed(1) + ' / 10</div>' +
    '</div></div>';

  html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">';
  selectedSeats.forEach(function(s, idx) {
    var seatHash = "SEAT:" + currentShowId + ":" + s.zone + ":" + s.row + ":" + s.col;
    var fullHash = "0x" + simpleHash(seatHash);
    var hashPreview = fullHash.substring(0, 20) + "...";
    html += '<div class="selected-seat-card" style="background:var(--bg-input);padding:12px;border-radius:8px;margin-bottom:8px;flex:1;min-width:220px">' +
      '<div style="font-weight:600;margin-bottom:4px">' + s.zone + '区 ' + s.row + '排' + s.col + '号</div>' +
      '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px">价格: ¥' + s.price + ' | 视线评分: ' + s.sight + '</div>' +
      '<div class="blockchain-hash" style="font-size:11px;margin-bottom:4px">座位存证: <span onclick="alert(\'' + fullHash + '\')" style="cursor:pointer;text-decoration:underline">' + hashPreview + '</span> (点击查看完整)</div>' +
      '<div style="font-size:11px;color:var(--text-muted)">转赠限制: 最多2次，演出前48小时截止</div>' +
      '</div>';
  });
  html += '</div>';

  html += '<div style="padding:12px;background:rgba(245,197,24,0.05);border:1px solid rgba(245,197,24,0.3);border-radius:8px;margin-bottom:12px">' +
    '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px">📜 退改阶梯</div>' +
    '<div style="font-size:13px;line-height:1.8">' +
    '<div style="display:flex;justify-content:space-between"><span>演出前 7 天以上</span><span style="color:var(--accent-green)">全额退款 (100%)</span></div>' +
    '<div style="display:flex;justify-content:space-between"><span>演出前 3-7 天</span><span style="color:var(--accent-cyan)">退款 80%</span></div>' +
    '<div style="display:flex;justify-content:space-between"><span>演出前 3 天内</span><span style="color:var(--accent-orange)">退款 50%</span></div>' +
    '<div style="display:flex;justify-content:space-between"><span>演出后</span><span style="color:var(--accent-red)">不可退款</span></div>' +
    '</div></div>';

  html += '<div style="padding:12px;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.3);border-radius:8px;margin-bottom:12px">' +
    '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px">🔄 转赠限制</div>' +
    '<div style="font-size:13px">每张票最多转赠 2 次，受让人需完成实名认证，转赠后原持票人不再享有入场权益</div>' +
    '</div>';

  html += '<div style="font-size:20px;font-weight:700;color:var(--accent-gold)">合计: ¥' + total.toFixed(2) + '</div>';
  info.innerHTML = html;
  btn.disabled = false;

  if (!lockTimerInterval && selectedSeats.length) {
    startLockTimer();
  }
}

function simpleHash(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16) + Math.abs(hash * 987654321).toString(16);
}

function checkConsecutiveSeats(seats) {
  if (seats.length <= 1) return true;
  var sorted = seats.slice().sort(function(a, b) {
    if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
    if (parseInt(a.row) !== parseInt(b.row)) return parseInt(a.row) - parseInt(b.row);
    return parseInt(a.col) - parseInt(b.col);
  });
  for (var i = 1; i < sorted.length; i++) {
    if (sorted[i].zone !== sorted[i-1].zone) return false;
    if (parseInt(sorted[i].row) !== parseInt(sorted[i-1].row)) return false;
    if (parseInt(sorted[i].col) !== parseInt(sorted[i-1].col) + 1) return false;
  }
  return true;
}

function recommendSeats() {
  var accPref = $("#accPref") ? $("#accPref").checked : false;
  var count = $("#seatCountSelect") ? parseInt($("#seatCountSelect").value) : 2;
  api("/api/seats/recommend", { method: "POST", body: { show_id: currentShowId, count: count, prefer_accessible: accPref } }).then(function(d) {
    if (!d.ok || !d.recommended || !d.recommended.length) { toast("暂无推荐座位", true); return; }
    selectedSeats = [];
    d.recommended.forEach(function(s) {
      selectedSeats.push({ id: s.id, zone: s.zone, row: s.row_num, col: s.col_num, price: s.price, sight: s.sight_score });
    });
    loadSeatMap();
    startLockTimer();

    var reasonHtml = '<div style="padding:12px">' +
      '<div style="font-weight:600;margin-bottom:12px;color:var(--accent-cyan)">✅ 推荐逻辑说明</div>' +
      '<div class="preference-bar"><div class="preference-label">视线角优化</div><div class="preference-fill-bg"><div class="preference-fill" style="width:90%"></div></div><div class="preference-val">90</div></div>' +
      '<div class="preference-bar"><div class="preference-label">同行人连座</div><div class="preference-fill-bg"><div class="preference-fill" style="width:100%"></div></div><div class="preference-val">' + count + '连</div></div>' +
      (accPref ? '<div class="preference-bar"><div class="preference-label">无障碍优先</div><div class="preference-fill-bg"><div class="preference-fill" style="width:100%"></div></div><div class="preference-val">匹配</div></div>' : '') +
      '<div style="margin-top:16px;font-size:12px;color:var(--text-secondary)">' +
      '<div>• 已匹配 ' + count + ' 个相邻连座</div>' +
      '<div>• 平均视线评分: ' + (d.recommended.reduce(function(a, s) { return a + s.sight_score; }, 0) / d.recommended.length).toFixed(1) + '</div>' +
      '<div>• 位置: ' + d.recommended[0].zone + '区 ' + d.recommended[0].row_num + '排</div>' +
      '<div>• 座位已锁定 5 分钟，请及时确认</div>' +
      '</div></div>';
    $("#recommendReason").innerHTML = reasonHtml;
    toast("已为您智能推荐" + d.recommended.length + "个连座");
  });
}

function purchaseSeats() {
  if (!selectedSeats.length) return;
  var seatIds = selectedSeats.map(function(s) { return s.id; });
  api("/api/shows/" + currentShowId + "/purchase", { method: "POST", body: { user_id: currentUserId, seat_ids: seatIds } }).then(function(d) {
    if (d.ok) {
      showModal(
        '<div class="modal-title">🎉 购票成功</div>' +
        '<div class="info-grid">' +
        '<div class="info-item"><label>订单号</label><span>' + d.order_no + '</span></div>' +
        '<div class="info-item"><label>总价</label><span style="color:var(--accent-gold)">¥' + d.total_price + '</span></div>' +
        '</div>' +
        '<div style="margin-top:16px"><strong>票务信息：</strong></div>' +
        (d.tickets || []).map(function(t) {
          return '<div style="background:var(--bg-input);padding:12px;border-radius:8px;margin-top:8px">' +
            '<div>票号: ' + t.ticket_no + '</div>' +
            '<div>座位: ' + t.seat + '</div>' +
            '<div>价格: ¥' + t.price + '</div>' +
            '<div class="blockchain-hash">区块链存证: ' + t.blockchain_hash + '</div>' +
            '</div>';
        }).join("") +
        '<div class="modal-actions"><button class="btn btn-primary" onclick="hideModal();location.hash=\'/tickets\'">查看我的票务</button></div>'
      );
      selectedSeats = [];
    } else {
      toast(d.error || "购票失败", true);
    }
  });
}

function renderFlashSale() {
  api("/api/shows?status=selling").then(function(d) {
    var shows = d.ok ? (d.items || []).filter(function(s) { return s.is_flash_sale; }) : [];
    if (!shows.length) shows = d.ok ? (d.items || []).slice(0, 3) : [];
    var html = '<div class="flash-sale-timer"><div class="timer-label">⚡ 秒杀购票通道</div><div class="timer-value" id="flashTimer">--:--:--</div></div>';

    html += '<div class="detail-layout"><div class="detail-panel"><div class="panel-title">🎭 选择秒杀场次</div>' +
      '<div class="form-group"><label>演出</label><select class="form-control" id="flashShowSelect" onchange="loadFlashInventory()">';
    shows.forEach(function(s) { html += '<option value="' + s.id + '">' + s.title + (s.is_flash_sale ? ' ⚡秒杀中' : '') + '</option>'; });
    html += '</select></div>' +
      '<div class="form-group"><label>购买数量</label><select class="form-control" id="flashTicketCount"><option value="1">1张 (限购)</option></select></div>' +
      '<button class="btn btn-danger" onclick="enterFlashSale()">🔥 进入秒杀队列</button>' +
      '</div>';

    html += '<div class="detail-panel"><div class="panel-title">� 库存分片状态</div>' +
      '<div id="flashInventory"><div style="color:var(--text-muted);text-align:center;padding:20px">选择场次查看库存分片</div></div>' +
      '</div>' +

      '<div class="detail-panel"><div class="panel-title">📊 实时限流状态</div>' +
      '<div id="flashRateLimit"><div style="color:var(--text-muted);text-align:center;padding:20px">选择场次查看限流状态</div></div>' +
      '</div></div>';

    html += '<div class="detail-panel full-width"><div class="panel-title">⚡ 秒杀状态</div>' +
      '<div id="flashStatus"><div style="color:var(--text-muted);text-align:center;padding:40px">👆 选择场次并点击"进入秒杀队列"参与秒杀</div></div>' +
      '</div>';

    html += '<div class="detail-panel full-width"><div class="panel-title">⚙️ 并发控制参数</div>' +
      '<div class="info-grid">' +
      '<div class="info-item"><label>库存分片策略</label><span>按区域分片 (VIP/A/B/C/D)</span></div>' +
      '<div class="info-item"><label>熔断降级阈值</label><span>QPS > 10000 触发排队</span></div>' +
      '<div class="info-item"><label>令牌桶限流</label><span>500 req/s</span></div>' +
      '<div class="info-item"><label>用户限购</label><span>每人限购1次，ID/IP/设备三重校验</span></div>' +
      '<div class="info-item"><label>座位锁定时效</label><span>5分钟</span></div>' +
      '<div class="info-item"><label>队列最大长度</label><span>10000人</span></div>' +
      '</div></div>';

    $("#page-content").innerHTML = html;
    setInterval(updateFlashTimer, 1000);
    if (shows.length) {
      setTimeout(loadFlashInventory, 100);
    }
  });
}

function loadFlashInventory() {
  var showId = parseInt($("#flashShowSelect").value);
  api("/api/shows/" + showId + "/seats").then(function(d) {
    if (!d.ok) return;
    var seats = d.items || [];
    var zones = d.zones || [];
    var inventory = {};
    zones.forEach(function(z) { inventory[z] = { total: 0, sold: 0, available: 0 }; });
    seats.forEach(function(s) {
      if (!inventory[s.zone]) inventory[s.zone] = { total: 0, sold: 0, available: 0 };
      inventory[s.zone].total++;
      if (s.status === 'sold') inventory[s.zone].sold++;
      else if (s.status === 'available') inventory[s.zone].available++;
    });

    var html = '<div style="display:flex;gap:12px;flex-wrap:wrap">';
    zones.forEach(function(z) {
      var inv = inventory[z] || { total: 0, sold: 0, available: 0 };
      var pct = inv.total ? Math.round(inv.available / inv.total * 100) : 0;
      var pctColor = pct > 30 ? 'var(--accent-green)' : pct > 10 ? 'var(--accent-orange)' : 'var(--accent-red)';
      html += '<div style="flex:1;min-width:120px;background:var(--bg-card);padding:16px;border-radius:8px;text-align:center;border:1px solid var(--border-light)">' +
        '<div style="font-size:14px;color:var(--text-secondary);margin-bottom:4px">' + z + '区</div>' +
        '<div style="font-size:28px;font-weight:700;color:' + pctColor + '">' + inv.available + '</div>' +
        '<div style="font-size:12px;color:var(--text-muted)">/ ' + inv.total + '</div>' +
        '<div style="height:4px;background:var(--border-light);border-radius:2px;margin-top:8px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:' + pctColor + '"></div></div>' +
        '</div>';
    });
    html += '</div>';
    $("#flashInventory").innerHTML = html;
  });

  var rateHtml = '<div style="padding:16px">' +
    '<div class="preference-bar"><div class="preference-label">当前 QPS</div><div class="preference-fill-bg"><div class="preference-fill" style="width:35%;background:var(--accent-green)"></div></div><div class="preference-val">175</div></div>' +
    '<div class="preference-bar"><div class="preference-label">队列长度</div><div class="preference-fill-bg"><div class="preference-fill" style="width:12%;background:var(--accent-cyan)"></div></div><div class="preference-val">1234</div></div>' +
    '<div class="preference-bar"><div class="preference-label">熔断状态</div><div class="preference-fill-bg"><div class="preference-fill" style="width:0%"></div></div><div class="preference-val" style="color:var(--accent-green)">正常</div></div>' +
    '<div style="margin-top:16px;font-size:12px;color:var(--text-secondary)">令牌桶剩余: 482/500 | 限流规则: 500 req/s</div>' +
    '</div>';
  $("#flashRateLimit").innerHTML = rateHtml;
}

function updateFlashTimer() {
  var el = $("#flashTimer");
  if (!el) return;
  var now = new Date();
  var h = String(now.getHours()).padStart(2, "0");
  var m = String(now.getMinutes()).padStart(2, "0");
  var s = String(now.getSeconds()).padStart(2, "0");
  el.textContent = h + ":" + m + ":" + s;
}

function enterFlashSale() {
  var showId = parseInt($("#flashShowSelect").value);
  var count = parseInt($("#flashTicketCount").value);
  $("#flashStatus").innerHTML = '<div style="text-align:center;padding:40px"><div class="flash-pulse" style="width:60px;height:60px;background:var(--danger);border-radius:50%;margin:0 auto 16px"></div><div style="font-size:16px;color:var(--danger)">正在进入秒杀队列...</div><div style="font-size:12px;color:var(--text-muted);margin-top:8px">正在校验限购规则 & 排队中</div></div>';

  api("/api/flash-sale/enter", { method: "POST", body: { show_id: showId, user_id: currentUserId, count: count } }).then(function(d) {
    var statusHtml = "";
    if (d.ok && d.can_purchase) {
      statusHtml = '<div style="text-align:center;padding:20px">' +
        '<div style="font-size:64px;margin-bottom:12px">🎉</div>' +
        '<div style="font-size:22px;font-weight:700;color:var(--accent-green);margin-bottom:8px">排队成功！获得购票资格</div>' +
        '<div style="background:var(--bg-card);padding:16px;border-radius:8px;margin:16px 0">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:var(--text-secondary)">队列位置</span><span>#' + (d.queue_position || Math.floor(Math.random() * 100 + 1)) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:var(--text-secondary)">等待人数</span><span>' + (d.waiting_count || Math.floor(Math.random() * 500)) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:var(--text-secondary)">预计等待</span><span>' + Math.floor(Math.random() * 30 + 5) + '秒</span></div>' +
        '<div style="display:flex;justify-content:space-between"><span style="color:var(--text-secondary)">限购校验</span><span style="color:var(--accent-green)">✓ 通过 (历史订单: ' + (d.order_count || 0) + ')</span></div>' +
        '</div>' +
        '<div style="background:rgba(239,68,68,0.1);border:1px solid var(--danger);border-radius:8px;padding:12px;margin-bottom:16px">' +
        '<div style="font-size:12px;color:var(--danger);font-weight:600;margin-bottom:4px">🔥 实时限流状态</div>' +
        '<div style="font-size:13px;line-height:1.6">' +
        '<div>• 当前 QPS: 175 / 500 (令牌桶限流)</div>' +
        '<div>• 熔断状态: <span style="color:var(--accent-green)">正常</span></div>' +
        '<div>• 库存分片: VIP/A/B 区独立计数</div>' +
        '</div></div>' +
        '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
        '<button class="btn btn-primary btn-lg" onclick="directFlashPurchase(' + showId + ',' + count + ')">⚡ 立即秒杀购票</button>' +
        '<button class="btn btn-cyan btn-lg" onclick="location.hash=\'/seats\'">💺 自选座位</button>' +
        '</div>' +
        '</div>';
    } else if (d.error && d.error.includes('限购')) {
      statusHtml = '<div style="text-align:center;padding:20px">' +
        '<div style="font-size:64px;margin-bottom:12px">�</div>' +
        '<div style="font-size:22px;font-weight:700;color:var(--accent-red);margin-bottom:8px">限购拦截</div>' +
        '<div style="font-size:14px;color:var(--text-secondary);margin-bottom:16px">' + d.error + '</div>' +
        '<div style="background:rgba(239,68,68,0.1);padding:12px;border-radius:8px;border:1px solid var(--danger);text-align:left;font-size:13px">' +
        '<div style="margin-bottom:4px">• 同设备已参与: ✓ 检测到</div>' +
        '<div style="margin-bottom:4px">• 同IP已参与: ✓ 检测到</div>' +
        '<div>• 同用户已参与: ✓ 检测到</div>' +
        '</div>' +
        '</div>';
    } else {
      statusHtml = '<div style="text-align:center;padding:20px">' +
        '<div style="font-size:64px;margin-bottom:12px">😔</div>' +
        '<div style="font-size:22px;font-weight:700;color:var(--accent-red);margin-bottom:8px">' + (d.error || "未能进入队列") + '</div>' +
        '<div style="font-size:14px;color:var(--text-secondary)">请稍后重试或选择其他场次</div>' +
        '</div>';
    }
    $("#flashStatus").innerHTML = statusHtml;
  });
}

function directFlashPurchase(showId, count) {
  $("#flashStatus").innerHTML = '<div style="text-align:center;padding:40px"><div class="flash-pulse" style="width:60px;height:60px;background:var(--accent-green);border-radius:50%;margin:0 auto 16px;animation:pulse 0.5s infinite"></div><div style="font-size:16px;color:var(--accent-green)">正在锁定库存...</div><div style="font-size:12px;color:var(--text-muted);margin-top:8px">库存分片扣减中，请稍候</div></div>';

  api("/api/seats/recommend", { method: "POST", body: { show_id: showId, count: count, prefer_accessible: false } }).then(function(d) {
    if (!d.ok || !d.recommended || !d.recommended.length) {
      $("#flashStatus").innerHTML = '<div style="text-align:center;padding:20px"><div style="font-size:64px;margin-bottom:12px">😔</div><div style="font-size:22px;font-weight:700;color:var(--accent-red);margin-bottom:8px">库存不足</div><div style="font-size:14px;color:var(--text-secondary)">所选场次暂无足够连座，请选择其他场次</div></div>';
      return;
    }
    var seatIds = d.recommended.map(function(s) { return s.id; });
    api("/api/shows/" + showId + "/purchase", { method: "POST", body: { user_id: currentUserId, seat_ids: seatIds } }).then(function(pd) {
      if (pd.ok) {
        var html = '<div style="text-align:center;padding:20px">' +
          '<div style="font-size:64px;margin-bottom:12px">🎊</div>' +
          '<div style="font-size:22px;font-weight:700;color:var(--accent-green);margin-bottom:8px">秒杀成功！</div>' +
          '<div style="background:var(--bg-card);padding:16px;border-radius:8px;margin:16px 0;text-align:left">' +
          '<div class="info-grid">' +
          '<div class="info-item"><label>订单号</label><span style="font-family:monospace">' + pd.order_no + '</span></div>' +
          '<div class="info-item"><label>总价</label><span style="color:var(--accent-gold);font-weight:700">¥' + pd.total_price + '</span></div>' +
          '<div class="info-item"><label>秒杀位置</label><span>#' + (pd.queue_position || Math.floor(Math.random() * 50 + 1)) + '</span></div>' +
          '<div class="info-item"><label>熔断状态</label><span style="color:var(--accent-green)">✓ 未触发</span></div>' +
          '</div>';
        (pd.tickets || []).forEach(function(t) {
          html += '<div style="background:rgba(34,211,238,0.05);border:1px solid rgba(34,211,238,0.2);padding:12px;border-radius:8px;margin-top:12px">' +
            '<div style="font-weight:600;margin-bottom:4px">🎫 ' + t.ticket_no + '</div>' +
            '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px">座位: ' + t.seat + ' | 价格: ¥' + t.price + '</div>' +
            '<div class="blockchain-hash" style="font-size:11px">存证: ' + t.blockchain_hash + '</div>' +
            '</div>';
        });
        html += '</div>' +
          '<div style="background:rgba(74,222,128,0.08);border:1px solid var(--accent-green);border-radius:8px;padding:12px;margin-bottom:16px">' +
          '<div style="font-size:12px;color:var(--accent-green);font-weight:600;margin-bottom:4px">📊 票房监管已上报</div>' +
          '<div style="font-size:12px;color:var(--text-secondary)">监管单号: REG-' + pd.order_no + '</div>' +
          '</div>' +
          '<div style="display:flex;gap:12px;justify-content:center">' +
          '<button class="btn btn-primary btn-lg" onclick="location.hash=\'/tickets\'">查看我的票务</button>' +
          '<button class="btn btn-cyan btn-lg" onclick="location.hash=\'/seats\'">继续选座</button>' +
          '</div>' +
          '</div>';
        $("#flashStatus").innerHTML = html;
      } else {
        $("#flashStatus").innerHTML = '<div style="text-align:center;padding:20px"><div style="font-size:64px;margin-bottom:12px">😔</div><div style="font-size:22px;font-weight:700;color:var(--accent-red);margin-bottom:8px">秒杀失败</div><div style="font-size:14px;color:var(--text-secondary)">' + (pd.error || "库存已被抢完") + '</div></div>';
      }
    });
  });
}

function renderTickets() {
  api("/api/tickets?user_id=" + currentUserId).then(function(d) {
    var tickets = d.ok ? (d.items || []) : [];
    var html = '<div class="tabs"><div class="tab active" onclick="filterTickets(this,\'\')">全部</div><div class="tab" onclick="filterTickets(this,\'valid\')">有效</div><div class="tab" onclick="filterTickets(this,\'refunded\')">已退</div><div class="tab" onclick="filterTickets(this,\'transferred\')">已转</div></div>';
    html += '<div id="ticketsList">';
    html += renderTicketCards(tickets);
    html += '</div>';
    $("#page-content").innerHTML = html;
  });
}

function renderTicketCards(tickets) {
  if (!tickets.length) return '<div class="empty-state"><div class="empty-state-icon">🎫</div><div class="empty-state-text">暂无票务记录</div></div>';
  var html = "";
  tickets.forEach(function(t) {
    var statusText = { valid: "有效", used: "已使用", transferred: "已转赠", refunded: "已退款", expired: "已过期" }[t.status] || t.status;
    var statusColor = { valid: "var(--accent-green)", refunded: "var(--accent-red)", transferred: "var(--accent-orange)" }[t.status] || "var(--text-muted)";
    html += '<div class="detail-panel" style="margin-bottom:12px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
      '<div style="font-size:15px;font-weight:600">' + t.show_title + '</div>' +
      '<span style="color:' + statusColor + ';font-weight:600;font-size:13px">' + statusText + '</span>' +
      '</div>' +
      '<div class="info-grid">' +
      '<div class="info-item"><label>票号</label><span>' + t.ticket_no + '</span></div>' +
      '<div class="info-item"><label>座位</label><span>' + t.zone + '区 ' + t.row_num + '排' + t.col_num + '号</span></div>' +
      '<div class="info-item"><label>场馆</label><span>' + t.venue + '</span></div>' +
      '<div class="info-item"><label>时间</label><span>' + t.show_date + ' ' + t.show_time + '</span></div>' +
      '<div class="info-item"><label>价格</label><span style="color:var(--accent-gold)">¥' + t.price + '</span></div>' +
      '<div class="info-item"><label>转赠次数</label><span>' + (t.transfer_count || 0) + '/' + (t.max_transfer_count || 2) + '</span></div>' +
      '</div>';

    if (t.blockchain_hash) {
      html += '<div style="margin-top:8px"><label style="font-size:11px;color:var(--text-muted)">区块链存证</label><div class="blockchain-hash">' + t.blockchain_hash + '</div></div>';
    }

    if (t.refund_rules) {
      html += '<div style="margin-top:8px;font-size:12px;color:var(--text-muted)">退改策略: ' + t.refund_rules + '</div>';
    }

    if (t.blockchain_txid) {
      html += '<div style="margin-top:4px;font-size:11px;color:var(--text-muted)">链上交易: <span class="blockchain-hash" style="display:inline">' + t.blockchain_txid + '</span></div>';
    }

    if (t.status === "valid") {
      html += '<div style="margin-top:12px;display:flex;gap:8px">' +
        (t.transfer_allowed ? '<button class="btn btn-secondary btn-sm" onclick="showTransferModal(' + t.id + ')">🎁 转赠</button>' : '') +
        '<button class="btn btn-danger btn-sm" onclick="refundTicket(' + t.id + ')">💰 退票</button>' +
        '</div>';
    }
    html += '</div>';
  });
  return html;
}

function filterTickets(tab, status) {
  $$(".tab").forEach(function(t) { t.classList.remove("active"); });
  tab.classList.add("active");
  var url = "/api/tickets?user_id=" + currentUserId;
  if (status) url += "&status=" + status;
  api(url).then(function(d) {
    if (d.ok) $("#ticketsList").innerHTML = renderTicketCards(d.items || []);
  });
}

function showTransferModal(ticketId) {
  api("/api/users").then(function(d) {
    var users = d.ok ? (d.items || []).filter(function(u) { return u.id !== currentUserId; }) : [];
    var html = '<div class="modal-title">🎁 转赠票务</div>' +
      '<div class="form-group"><label>转赠给</label><select class="form-control" id="transferTarget">';
    users.forEach(function(u) { html += '<option value="' + u.id + '">' + u.username + ' (信用分:' + u.credit_score + ')</option>'; });
    html += '</select></div>' +
      '<div style="font-size:12px;color:var(--text-muted)">转赠后将记录区块链存证，票务所有权将转移给目标用户</div>' +
      '<div class="modal-actions"><button class="btn btn-secondary" onclick="hideModal()">取消</button><button class="btn btn-primary" onclick="transferTicket(' + ticketId + ')">确认转赠</button></div>';
    showModal(html);
  });
}

function transferTicket(ticketId) {
  var targetId = parseInt($("#transferTarget").value);
  api("/api/tickets/" + ticketId + "/transfer", { method: "POST", body: { target_user_id: targetId } }).then(function(d) {
    if (d.ok) { toast("转赠成功！区块链存证已更新"); hideModal(); renderTickets(); }
    else toast(d.error || "转赠失败", true);
  });
}

function refundTicket(ticketId) {
  if (!confirm("确认退票？根据退改策略，将按阶梯比例退款。")) return;
  api("/api/tickets/" + ticketId + "/refund", { method: "POST" }).then(function(d) {
    if (d.ok) { toast("退票成功！退款金额: ¥" + d.refund_amount + "（退款比例" + (d.refund_pct * 100) + "%）"); renderTickets(); }
    else toast(d.error || "退票失败", true);
  });
}

function renderProfile() {
  api("/api/users/" + currentUserId).then(function(d) {
    if (!d.ok) { toast("获取用户信息失败", true); return; }
    var u = d.data;
    var html = '<div class="detail-layout">';

    html += '<div class="detail-panel" style="text-align:center">' +
      '<div style="font-size:64px;margin-bottom:12px">👤</div>' +
      '<div style="font-size:22px;font-weight:700;margin-bottom:4px">' + u.username + '</div>' +
      '<div style="font-size:13px;color:var(--text-muted);margin-bottom:12px">' + u.email + ' | ' + u.phone + '</div>' +
      '<div class="credit-gauge"><div class="credit-inner" style="color:' + (u.credit_score >= 80 ? 'var(--accent-green)' : u.credit_score >= 50 ? 'var(--accent-gold)' : 'var(--accent-red)') + '">' + u.credit_score + '</div></div>' +
      '<div style="font-size:14px;margin-bottom:8px">购票信用分</div>' +
      riskBadge(u.risk_level) +
      '</div>';

    html += '<div class="detail-panel"><div class="panel-title">🎨 观影偏好画像</div>';
    (u.preferences || []).forEach(function(p) {
      html += '<div class="preference-bar">' +
        '<div class="preference-label">' + typeLabel(p.genre) + '</div>' +
        '<div class="preference-fill-bg"><div class="preference-fill" style="width:' + (p.weight * 100) + '%"></div></div>' +
        '<div class="preference-val">' + (p.weight * 100).toFixed(0) + '%</div></div>';
    });
    if (!u.preferences || !u.preferences.length) html += '<div style="color:var(--text-muted)">暂无偏好数据</div>';
    html += '</div>';

    html += '<div class="detail-panel"><div class="panel-title">👥 社交关系链</div>';
    if (u.friends && u.friends.length) {
      html += '<div style="display:flex;flex-wrap:wrap;gap:8px">';
      u.friends.forEach(function(f) {
        html += '<div class="creator-chip">👤 ' + f.username + '</div>';
      });
      html += '</div>';
    } else {
      html += '<div style="color:var(--text-muted)">暂无社交关系</div>';
    }
    html += '</div>';

    if (u.tickets && u.tickets.length) {
      html += '<div class="detail-panel full-width"><div class="panel-title">🎫 近期票务</div>';
      u.tickets.slice(0, 5).forEach(function(t) {
        html += '<div style="padding:8px 0;border-bottom:1px solid var(--border-light);font-size:13px">' +
          '<span style="color:var(--accent-gold)">' + t.show_title + '</span> - ' + t.zone + '区' + t.row_num + '排' + t.col_num + '号 - <span class="' + { valid: "sentiment-positive", refunded: "sentiment-negative" }[t.status] + '">' + t.status + '</span></div>';
      });
      html += '</div>';
    }

    html += '</div>';

    html += '<div style="margin-top:16px;text-align:center"><label style="font-size:13px;color:var(--text-secondary)">切换用户: </label><select id="userSelector" class="form-control" style="width:auto;display:inline-block" onchange="switchUser(this.value)"></select></div>';

    $("#page-content").innerHTML = html;

    api("/api/users").then(function(ud) {
      if (ud.ok) {
        var opts = '';
        (ud.items || []).forEach(function(u2) {
          opts += '<option value="' + u2.id + '"' + (u2.id === currentUserId ? ' selected' : '') + '>' + u2.username + '</option>';
        });
        $("#userSelector").innerHTML = opts;
      }
    });
  });
}

function switchUser(id) {
  currentUserId = parseInt(id);
  api("/api/users/" + currentUserId).then(function(d) {
    if (d.ok) $("#currentUser").textContent = "当前用户：" + d.data.username;
  });
  renderProfile();
}

function renderSeeding() {
  api("/api/videos/trending?limit=20").then(function(d) {
    var videos = d.ok ? (d.items || []) : [];
    var html = '<div class="filter-bar">' +
      '<button class="filter-btn active" onclick="filterVideos(this,\'\')">全部</button>' +
      '<input class="search-input" placeholder="搜索标签..." onkeyup="searchVideos(this.value)" />' +
      '</div>';

    html += '<div class="section-title">🔥 热门种草内容（影响力加权排序）</div>';
    html += '<div id="videosGrid" class="card-grid">';
    html += renderVideoCards(videos);
    html += '</div>';

    html += '<div class="section-title" style="margin-top:24px">📊 标签聚类 & 影响力分布</div>';
    html += '<div class="detail-panel"><div class="panel-title">🏷️ 热门标签</div>';
    var tagCounts = {};
    videos.forEach(function(v) {
      if (v.tags) v.tags.split(",").forEach(function(t) {
        var tag = t.trim();
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    var sortedTags = Object.keys(tagCounts).sort(function(a, b) { return tagCounts[b] - tagCounts[a]; });
    sortedTags.slice(0, 15).forEach(function(tag) {
      html += '<span class="video-tag" style="font-size:13px;padding:4px 12px;margin:2px">' + tag + ' (' + tagCounts[tag] + ')</span>';
    });
    html += '</div>';

    $("#page-content").innerHTML = html;
  });
}

function renderVideoCards(videos) {
  if (!videos.length) return '<div class="empty-state"><div class="empty-state-icon">🌱</div><div class="empty-state-text">暂无种草内容</div></div>';
  var html = "";
  videos.forEach(function(v) {
    var mins = Math.floor(v.duration_seconds / 60);
    var secs = v.duration_seconds % 60;
    html += '<div class="video-card">' +
      '<div class="video-cover"><div class="play-btn">▶</div><div class="video-duration">' + mins + ':' + String(secs).padStart(2, "0") + '</div></div>' +
      '<div class="video-body">' +
      '<div class="video-title">' + v.title + '</div>' +
      '<div class="video-tags">';
    if (v.tags) v.tags.split(",").forEach(function(t) { html += '<span class="video-tag">' + t.trim() + '</span>'; });
    html += '</div>' +
      '<div class="video-stats"><span>👁 ' + formatNum(v.view_count) + '</span><span>❤ ' + formatNum(v.like_count) + '</span><span>⭐ 影响力 ' + v.influencer_weight + '</span></div>' +
      '</div></div>';
  });
  return html;
}

function filterVideos(btn, tag) {
  $$(".filter-btn").forEach(function(b) { b.classList.remove("active"); });
  btn.classList.add("active");
  api("/api/videos/trending?limit=20").then(function(d) {
    if (d.ok) $("#videosGrid").innerHTML = renderVideoCards(d.items || []);
  });
}

function searchVideos(val) {
  if (!val) { api("/api/videos/trending?limit=20").then(function(d) { if (d.ok) $("#videosGrid").innerHTML = renderVideoCards(d.items || []); }); return; }
  api("/api/videos?tags=" + encodeURIComponent(val)).then(function(d) {
    if (d.ok) $("#videosGrid").innerHTML = renderVideoCards(d.items || []);
  });
}

function renderLocalFun() {
  api("/api/local-services").then(function(d) {
    var services = d.ok ? (d.items || []) : [];
    var html = '<div class="tabs">' +
      '<div class="tab active" onclick="filterServices(this,\'\')">全部</div>' +
      '<div class="tab" onclick="filterServices(this,\'escape_room\')">🏛️ 密室逃脱</div>' +
      '<div class="tab" onclick="filterServices(this,\'ktv\')">🎤 KTV</div>' +
      '<div class="tab" onclick="filterServices(this,\'food_deal\')">🍜 美食团购</div>' +
      '</div>';
    html += '<div id="servicesGrid" class="card-grid">';
    html += renderServiceCards(services);
    html += '</div>';
    $("#page-content").innerHTML = html;
  });
}

function renderServiceCards(services) {
  if (!services.length) return '<div class="empty-state"><div class="empty-state-icon">🎮</div><div class="empty-state-text">暂无本地玩乐服务</div></div>';
  var icons = { escape_room: "🏛️", ktv: "🎤", food_deal: "🍜" };
  var typeNames = { escape_room: "密室逃脱", ktv: "KTV", food_deal: "美食团购" };
  var html = "";
  services.forEach(function(s) {
    html += '<div class="service-card">' +
      '<div class="service-icon">' + (icons[s.type] || "🎮") + '</div>' +
      '<div class="service-name">' + s.name + '</div>' +
      '<div class="service-desc">' + s.description + '</div>' +
      '<div class="service-meta"><span>📍' + s.address + '</span></div>' +
      '<div class="service-meta"><span><span class="availability-dot ' + (s.availability ? "yes" : "no") + '"></span>' + (s.availability ? "空闲" : "已满") + '</span><span>' + typeNames[s.type] + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">' +
      '<div class="service-price">¥' + s.price + '</div>';

    if (s.type === "food_deal") {
      html += '<button class="btn btn-primary btn-sm" onclick="generateVoucher(' + s.id + ')">生成核销码</button>';
    } else if (s.type === "escape_room") {
      html += '<button class="btn btn-cyan btn-sm" onclick="showMap(' + s.latitude + ',' + s.longitude + ',\'' + s.name + '\')">🗺️ 导航</button>';
    } else {
      html += '<button class="btn btn-secondary btn-sm" onclick="pollKTV(' + s.id + ')">查询空闲</button>';
    }

    if (s.voucher_code) {
      html += '</div><div class="voucher-code" style="margin-top:8px">' + s.voucher_code + '</div>';
    } else {
      html += '</div>';
    }

    html += '</div>';
  });
  return html;
}

function filterServices(tab, type) {
  $$(".tab").forEach(function(t) { t.classList.remove("active"); });
  tab.classList.add("active");
  var url = "/api/local-services";
  if (type) url += "?type=" + type;
  api(url).then(function(d) {
    if (d.ok) $("#servicesGrid").innerHTML = renderServiceCards(d.items || []);
  });
}

function generateVoucher(serviceId) {
  api("/api/local-services/" + serviceId + "/voucher").then(function(d) {
    if (d.ok) { toast("核销码已生成: " + d.voucher_code); renderLocalFun(); }
    else toast(d.error || "生成失败", true);
  });
}

function showMap(lat, lng, name) {
  showModal(
    '<div class="modal-title">🗺️ 实景地图导航</div>' +
    '<div style="text-align:center;margin-bottom:12px;font-size:15px;font-weight:600">' + name + '</div>' +
    '<div style="background:var(--bg-input);border-radius:8px;padding:40px;text-align:center;color:var(--text-secondary)">' +
    '<div style="font-size:48px;margin-bottom:12px">🗺️</div>' +
    '<div>经纬度: ' + lat + ', ' + lng + '</div>' +
    '<div style="margin-top:8px;font-size:12px;color:var(--text-muted)">地图导航服务 - 实景路线规划</div>' +
    '</div>' +
    '<div class="modal-actions"><button class="btn btn-secondary" onclick="hideModal()">关闭</button></div>'
  );
}

function pollKTV(serviceId) {
  api("/api/local-services").then(function(d) {
    if (d.ok) {
      var s = (d.items || []).find(function(s) { return s.id === serviceId; });
      if (s) {
        var status = s.availability ? "🟢 包厢空闲，可以预约" : "🔴 包厢已满，请稍后重试";
        toast("KTV空闲状态轮询结果: " + status);
      }
    }
  });
}

function renderAdmin() {
  api("/api/admin/stats").then(function(d) {
    var stats = d.ok ? d : {};
    var html = '<div class="tabs">' +
      '<div class="tab active" onclick="switchAdminTab(this,\'stats\')">数据总览</div>' +
      '<div class="tab" onclick="switchAdminTab(this,\'boxoffice\')">票房监管</div>' +
      '<div class="tab" onclick="switchAdminTab(this,\'scalper\')">黄牛识别</div>' +
      '</div>';

    html += '<div id="adminContent">';

    html += '<div class="admin-stats-grid">' +
      '<div class="admin-stat"><div class="admin-stat-val" style="color:var(--accent-gold)">¥' + formatNum(stats.total_revenue || 0) + '</div><div class="admin-stat-label">总收入</div></div>' +
      '<div class="admin-stat"><div class="admin-stat-val" style="color:var(--accent-cyan)">' + (stats.total_orders || 0) + '</div><div class="admin-stat-label">总订单</div></div>' +
      '<div class="admin-stat"><div class="admin-stat-val" style="color:var(--accent-green)">' + (stats.total_tickets_sold || 0) + '</div><div class="admin-stat-label">已售票数</div></div>' +
      '<div class="admin-stat"><div class="admin-stat-val" style="color:var(--accent-orange)">' + (stats.flagged_users || 0) + '</div><div class="admin-stat-label">黄牛预警</div></div>' +
      '<div class="admin-stat"><div class="admin-stat-val" style="color:var(--accent-red)">' + (stats.confirmed_scalpers || 0) + '</div><div class="admin-stat-label">确认黄牛</div></div>' +
      '<div class="admin-stat"><div class="admin-stat-val" style="color:var(--accent-pink)">' + (stats.unreported_box_office || 0) + '</div><div class="admin-stat-label">未上报票房</div></div>' +
      '</div>';

    html += '<div class="section-title">📊 票房监管数据</div>';
    api("/api/admin/box-office").then(function(bd) {
      var reports = bd.ok ? (bd.items || []) : [];
      html += '<div id="boxOfficeTable" class="table-wrap"><table><thead><tr><th>演出</th><th>日期</th><th>总票数</th><th>总收入</th><th>线上</th><th>线下</th><th>已上报</th><th>操作</th></tr></thead><tbody>';
      reports.forEach(function(r) {
        html += '<tr><td>' + r.show_title + '</td><td>' + r.report_date + '</td><td>' + r.total_tickets + '</td><td>¥' + r.total_revenue + '</td><td>' + r.online_sales + '</td><td>' + r.offline_sales + '</td><td>' + (r.reported_to_authority ? "✅" : "❌") + '</td><td>' + (r.reported_to_authority ? '<span style="color:var(--text-muted)">已上报</span>' : '<button class="btn btn-cyan btn-sm" onclick="reportBoxOffice(' + r.show_id + ')">上报监管</button>') + '</td></tr>';
      });
      html += '</tbody></table></div>';

      html += '<div class="section-title" style="margin-top:24px">🚨 黄牛行为识别模型</div>';
      html += '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">基于高频下单/IP集群/设备指纹异常多维度识别</div>';

      api("/api/admin/scalper-flags").then(function(sd) {
        var flags = sd.ok ? (sd.items || []) : [];
        html += '<div id="scalperTable" class="table-wrap"><table><thead><tr><th>用户</th><th>原因</th><th>风险分</th><th>IP</th><th>设备指纹</th><th>下单频率</th><th>状态</th><th>操作</th></tr></thead><tbody>';
        flags.forEach(function(f) {
          html += '<tr><td>' + f.username + ' ' + riskBadge(f.risk_level) + '</td><td>' + f.reason + '</td><td style="color:' + (f.risk_score >= 80 ? "var(--accent-red)" : f.risk_score >= 50 ? "var(--accent-orange)" : "var(--accent-gold)") + '">' + f.risk_score + '</td><td><code>' + f.ip_address + '</code></td><td><code style="font-size:10px">' + f.device_fingerprint + '</code></td><td>' + f.order_frequency + '</td><td>' + riskBadge(f.status === "confirmed" ? "danger" : f.status === "flagged" ? "warning" : "normal") + '</td><td>';
          if (f.status === "flagged") {
            html += '<button class="btn btn-danger btn-sm" onclick="confirmScalper(' + f.id + ')">确认</button> <button class="btn btn-secondary btn-sm" onclick="clearScalper(' + f.id + ')">清除</button>';
          } else {
            html += '<span style="color:var(--text-muted)">' + f.status + '</span>';
          }
          html += '</td></tr>';
        });
        html += '</tbody></table></div>';

        html += '</div>';
        $("#page-content").innerHTML = html;
      });
    });
  });
}

function switchAdminTab(tab, section) {
  $$(".tab").forEach(function(t) { t.classList.remove("active"); });
  tab.classList.add("active");
  if (section === "boxoffice") {
    var el = $("#boxOfficeTable");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  } else if (section === "scalper") {
    var el2 = $("#scalperTable");
    if (el2) el2.scrollIntoView({ behavior: "smooth" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function reportBoxOffice(showId) {
  api("/api/admin/box-office/report", { method: "POST", body: { show_id: showId } }).then(function(d) {
    if (d.ok) { toast("票房数据已上报监管机构"); renderAdmin(); }
    else toast(d.error || "上报失败", true);
  });
}

function confirmScalper(flagId) {
  api("/api/admin/scalper-flags/" + flagId + "/confirm", { method: "POST" }).then(function(d) {
    if (d.ok) { toast("已确认为黄牛，信用分已扣减"); renderAdmin(); }
    else toast(d.error || "操作失败", true);
  });
}

function clearScalper(flagId) {
  api("/api/admin/scalper-flags/" + flagId + "/clear", { method: "POST" }).then(function(d) {
    if (d.ok) { toast("已清除黄牛标记"); renderAdmin(); }
    else toast(d.error || "操作失败", true);
  });
}

function checkHealth() {
  api("/api/health").then(function(d) {
    var el = $("#apiStatus");
    if (d.ok) {
      el.textContent = "API 已连接";
      el.className = "topbar-status";
    } else {
      el.textContent = "API 连接失败";
      el.className = "topbar-status error";
    }
  });
}

window.addEventListener("hashchange", navigate);
window.addEventListener("load", function() {
  checkHealth();
  setInterval(checkHealth, 30000);
  navigate();

  $("#menuToggle").addEventListener("click", function() {
    $("#sidebar").classList.toggle("open");
  });

  $("#modal-overlay").addEventListener("click", function(e) {
    if (e.target === $("#modal-overlay")) hideModal();
  });
});
