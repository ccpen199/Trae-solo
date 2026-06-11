import http from "node:http";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = process.env.PROJECT_DIR || path.resolve(__dirname, "../..");
const envPath = path.join(projectDir, ".env");

if (existsSync(envPath)) {
  const envText = readFileSync(envPath, "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    process.env[key] = rest.join("=");
  }
}

const host = process.env.BIND_HOST || "127.0.0.1";
const port = Number(process.env.BACKEND_PORT || 59101);
const dbPath = path.join(projectDir, "data", "app.sqlite");
const sqliteBin = process.env.SQLITE_BIN || "sqlite3";

const sceneFallback = [
  {
    id: 101,
    code: "newborn_one_stop",
    name: "新生儿一件事",
    description: "出生医学证明、户口登记、医保参保和社保卡申领联办。",
    icon: "Baby",
    serviceIds: [3],
    workflow: ["实名认证", "统一表单", "跨部门提交", "进度跟踪"]
  },
  {
    id: 102,
    code: "retirement_one_stop",
    name: "退休一件事",
    description: "养老待遇核定、医保关系确认和公积金提取协同办理。",
    icon: "BadgeCheck",
    serviceIds: [1],
    workflow: ["资格校验", "材料复用", "部门流转", "结果通知"]
  },
  {
    id: 103,
    code: "business_start",
    name: "企业开办一件事",
    description: "企业登记、公章刻制、税务确认和社保开户一次提交。",
    icon: "Building2",
    serviceIds: [1, 3],
    workflow: ["企业认证", "事项编排", "并联审批", "统一反馈"]
  }
];

function esc(value) {
  return String(value ?? "").replaceAll("'", "''");
}

function jsonParse(value, fallback) {
  if (value == null || value === "") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function runSql(sql) {
  if (!existsSync(dbPath)) return [];
  const output = execFileSync(sqliteBin, ["-json", dbPath, sql], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  }).trim();
  return output ? JSON.parse(output) : [];
}

function execSql(sql) {
  execFileSync(sqliteBin, [dbPath, sql], { encoding: "utf8", maxBuffer: 1024 * 1024 });
}

function api(data, message = "ok", code = 0) {
  return { ok: code === 0, code, message, data, timestamp: new Date().toISOString() };
}

function getServices(url) {
  const search = (url.searchParams.get("search") || url.searchParams.get("q") || "").trim();
  const category = (url.searchParams.get("category") || "").trim();
  let sql = `
    select s.id, s.code, s.name, s.description, s.service_type as serviceType,
           s.access_protocol as accessProtocol, s.icon, s.is_online as isOnline,
           s.is_hot as isHot, s.region, s.required_cert_types as requiredCertTypes,
           s.processing_time as processingTime, s.fee_description as feeDescription,
           c.id as categoryId, c.name as categoryName, c.code as categoryCode
    from services s
    left join service_categories c on c.id = s.category_id
    where 1=1
  `;
  if (search) {
    const q = esc(`%${search}%`);
    sql += ` and (s.name like '${q}' or s.description like '${q}' or c.name like '${q}' or s.service_type like '${q}')`;
  }
  if (category && category !== "全部") {
    const c = esc(category);
    sql += ` and (c.name = '${c}' or c.code = '${c}' or s.service_type = '${c}')`;
  }
  sql += " order by s.is_hot desc, s.sort_order asc, s.id asc";
  return runSql(sql).map((item) => ({
    ...item,
    isOnline: Boolean(item.isOnline),
    isHot: Boolean(item.isHot),
    requiredCertTypes: jsonParse(item.requiredCertTypes, [])
  }));
}

function getApplications(limit = 20) {
  return runSql(`
    select r.id, r.request_no as requestNo, r.status, r.region, r.request_data as requestData,
           r.created_at as createdAt, r.updated_at as updatedAt,
           s.id as serviceId, s.name as serviceName, u.real_name as userName
    from service_requests r
    left join services s on s.id = r.service_id
    left join users u on u.id = r.user_id
    order by r.id desc
    limit ${Number(limit) || 20}
  `).map((item) => ({ ...item, requestData: jsonParse(item.requestData, {}) }));
}

function getProfile() {
  const user = runSql("select id, username, real_name as realName, phone, district, address, is_admin as isAdmin from users where id = 2 limit 1")[0]
    || runSql("select id, username, real_name as realName, phone, district, address, is_admin as isAdmin from users limit 1")[0]
    || { id: 1, username: "demo", realName: "演示用户", phone: "13800138000", district: "天宁区", isAdmin: 0 };
  const certificates = runSql(`select id, cert_type as certType, cert_name as certName, issuer, status from certificates where user_id = ${Number(user.id)} order by id`);
  const requests = getApplications(12);
  const feedbacks = runSql(`select id, type, title, status, created_at as createdAt from feedbacks where user_id = ${Number(user.id)} order by id desc limit 10`);
  return {
    user: { ...user, isAdmin: Boolean(user.isAdmin), isVerified: true },
    certificates,
    applications: requests,
    feedbacks,
    stats: {
      certificates: certificates.length,
      applications: requests.length,
      feedbacks: feedbacks.length
    }
  };
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy();
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve(Object.fromEntries(new URLSearchParams(body)));
      }
    });
  });
}

function getAllowedOrigin(req) {
  const origin = req.headers.origin;
  if (origin && /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) {
    return origin;
  }
  return process.env.CORS_ORIGIN || "*";
}

function send(req, res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": getAllowedOrigin(req),
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function notFound(req, res) {
  send(req, res, 404, api(null, "not found", 404));
}

async function handle(req, res) {
  if (req.method === "OPTIONS") return send(req, res, 204, {});

  const url = new URL(req.url || "/", `http://${host}:${port}`);
  const pathname = decodeURIComponent(url.pathname);

  try {
    if (pathname === "/api/health") {
      const counts = Object.fromEntries(runSql(`
        select 'users' as name, count(*) as count from users
        union all select 'services', count(*) from services
        union all select 'requests', count(*) from service_requests
        union all select 'feedbacks', count(*) from feedbacks
      `).map((row) => [row.name, row.count]));
      return send(req, res, 200, {
        ok: true,
        status: "ok",
        project: "may-89101",
        db: dbPath,
        counts,
        time: new Date().toISOString()
      });
    }

    if (pathname === "/api") {
      return send(req, res, 200, api({
        project: "may-89101",
        health: "/api/health",
        endpoints: {
          services: "/api/services",
          scenes: "/api/scenes",
          profile: "/api/profile",
          admin: "/api/admin/summary"
        }
      }));
    }

    if (pathname === "/api/auth/login" && req.method === "POST") {
      const body = await readBody(req);
      const phone = esc(body.phone || body.username || "13800138001");
      const user = runSql(`select id, username, real_name as realName, phone, district, is_admin as isAdmin from users where phone = '${phone}' or username = '${phone}' limit 1`)[0]
        || getProfile().user;
      return send(req, res, 200, api({ token: "local-demo-token", user, expiresAt: new Date(Date.now() + 86400000).toISOString() }));
    }

    if (["/api/profile", "/api/auth/me", "/api/users/profile", "/api/user/profile"].includes(pathname)) {
      const profile = getProfile();
      return send(req, res, 200, api({ ...profile, data: profile, user: profile.user }));
    }

    if (pathname === "/api/categories") {
      return send(req, res, 200, api(runSql("select id, code, name, description, icon, sort_order as sortOrder from service_categories order by sort_order, id")));
    }

    if (pathname === "/api/services" || pathname === "/api/search" || pathname === "/api/teachers" || pathname === "/api/courses" || pathname === "/api/bookings") {
      return send(req, res, 200, api(getServices(url)));
    }

    const serviceMatch = pathname.match(/^\/api\/services\/(\d+)$/);
    if (serviceMatch) {
      const service = getServices(new URL(`/api/services?search=`, `http://${host}`)).find((item) => item.id === Number(serviceMatch[1]));
      return service ? send(req, res, 200, api(service)) : notFound(req, res);
    }

    if (pathname === "/api/applications" || pathname === "/api/service-requests" || pathname === "/api/orders") {
      if (req.method === "POST") {
        const body = await readBody(req);
        const serviceId = Number(body.serviceId || body.service_id || 1);
        const userId = Number(body.userId || 2);
        const requestNo = `CZ${Date.now()}`;
        const region = esc(body.region || "常州市");
        const requestData = esc(JSON.stringify(body));
        execSql(`
          insert into service_requests (user_id, service_id, request_no, status, request_data, region, created_at, updated_at)
          values (${userId}, ${serviceId}, '${requestNo}', 'processing', '${requestData}', '${region}', datetime('now'), datetime('now'))
        `);
        const created = getApplications(1)[0];
        return send(req, res, 200, api(created, "submitted"));
      }
      return send(req, res, 200, api(getApplications(Number(url.searchParams.get("limit") || 20))));
    }

    if (pathname === "/api/scenes") {
      const scenes = runSql("select id, code, name, description, icon, service_ids as serviceIds, workflow_config as workflowConfig from scene_templates order by sort_order, id")
        .map((item) => ({
          ...item,
          serviceIds: jsonParse(item.serviceIds, []),
          workflowConfig: jsonParse(item.workflowConfig, {})
        }));
      return send(req, res, 200, api(scenes.length ? scenes : sceneFallback));
    }

    if (pathname === "/api/feedback") {
      if (req.method === "POST") {
        const body = await readBody(req);
        const userId = Number(body.userId || 2);
        const type = esc(body.type || "suggestion");
        const title = esc(body.title || "服务建议");
        const content = esc(body.content || body.description || "希望优化公共服务办理体验。");
        const contact = esc(body.contact || "13800138001");
        const region = esc(body.region || "常州市");
        execSql(`
          insert into feedbacks (user_id, type, title, content, contact, status, region, created_at, updated_at)
          values (${userId}, '${type}', '${title}', '${content}', '${contact}', 'pending', '${region}', datetime('now'), datetime('now'))
        `);
      }
      return send(req, res, 200, api(runSql("select id, type, title, content, contact, status, region, handle_result as handleResult, created_at as createdAt from feedbacks order by id desc limit 30")));
    }

    if (pathname === "/api/bus" || pathname === "/api/bus/routes") {
      const routes = runSql("select id, route_no as routeNo, route_name as routeName, start_station as startStation, end_station as endStation, first_bus as firstBus, last_bus as lastBus, price, stations from bus_routes order by id")
        .map((item) => ({ ...item, stations: jsonParse(item.stations, []) }));
      return send(req, res, 200, api(routes));
    }

    if (pathname === "/api/venues") {
      return send(req, res, 200, api(runSql("select id, name, type, address, district, capacity, open_time as openTime, close_time as closeTime, facilities, description from venues order by id")));
    }

    if (pathname === "/api/venues/bookings" && req.method === "POST") {
      const body = await readBody(req);
      const userId = Number(body.userId || 2);
      const venueId = Number(body.venueId || body.venue_id || 1);
      const bookingDate = esc(body.bookingDate || new Date().toISOString().slice(0, 10));
      const timeSlot = esc(body.timeSlot || "09:00-10:00");
      const peopleCount = Number(body.peopleCount || 1);
      execSql(`
        insert into venue_bookings (user_id, venue_id, booking_date, time_slot, people_count, status, created_at)
        values (${userId}, ${venueId}, '${bookingDate}', '${timeSlot}', ${peopleCount}, 'confirmed', datetime('now'))
      `);
      return send(req, res, 200, api({ venueId, bookingDate, timeSlot, status: "confirmed" }, "booked"));
    }

    if (pathname === "/api/certificates") {
      return send(req, res, 200, api(runSql("select id, user_id as userId, cert_type as certType, cert_number as certNumber, cert_name as certName, issuer, issue_date as issueDate, expire_date as expireDate, status from certificates order by id")));
    }

    if (pathname === "/api/community/repairs") {
      return send(req, res, 200, api(runSql("select id, title, description, repair_type as repairType, address, contact, status, created_at as createdAt from community_repairs order by id desc limit 20")));
    }

    if (pathname === "/api/community/help") {
      return send(req, res, 200, api(runSql("select id, title, description, help_type as helpType, address, contact, status, created_at as createdAt from neighborhood_help order by id desc limit 20")));
    }

    if (pathname === "/api/admin/summary" || pathname === "/api/admin/dashboard" || pathname === "/api/admin/stats") {
      const counts = Object.fromEntries(runSql(`
        select 'users' as name, count(*) as count from users
        union all select 'services', count(*) from services
        union all select 'applications', count(*) from service_requests
        union all select 'feedbacks', count(*) from feedbacks
        union all select 'venues', count(*) from venues
        union all select 'busRoutes', count(*) from bus_routes
      `).map((row) => [row.name, row.count]));
      const modules = ["统一用户中心", "电子证照库", "办事大厅", "场景服务", "市民反馈", "后台管理"];
      const feedbacks = runSql("select id, title, type, status, region, created_at as createdAt from feedbacks order by id desc limit 8");
      return send(req, res, 200, api({ counts, modules, feedbacks, availability: 99.6, todayRequests: counts.applications || 0 }));
    }

    if (pathname === "/api/analytics/heatmap" || pathname === "/api/monitor/status") {
      const data = runSql("select service_id as serviceId, region, request_count as requestCount, stat_date as statDate from service_heatmap order by id desc limit 30");
      return send(req, res, 200, api(data.length ? data : [
        { region: "天宁区", requestCount: 128, status: "online" },
        { region: "新北区", requestCount: 96, status: "online" },
        { region: "武进区", requestCount: 88, status: "online" },
        { region: "钟楼区", requestCount: 72, status: "warning" }
      ]));
    }

    if (pathname === "/") {
      return send(req, res, 200, api({ project: "may-89101", api: "/api", health: "/api/health" }));
    }

    return notFound(req, res);
  } catch (error) {
    console.error(error);
    return send(req, res, 500, api({ error: String(error.message || error) }, "server error", 500));
  }
}

http.createServer(handle).listen(port, host, () => {
  console.log(`may-89101 backend listening on http://${host}:${port}`);
  console.log(`sqlite database: ${dbPath}`);
});
