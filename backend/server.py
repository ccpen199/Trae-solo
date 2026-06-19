from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone, timedelta
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs


ROOT = Path(__file__).resolve().parents[1]


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    env_path = ROOT / ".env"
    if env_path.exists():
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            env[key.strip()] = value.strip()
    return env


ENV = load_env()
HOST = ENV.get("BACKEND_HOST", ENV.get("HOST", "127.0.0.1"))
PORT = int(ENV.get("BACKEND_PORT", ENV.get("PORT", "59232")))
DB_PATH = ROOT / ENV.get("SQLITE_PATH", "data/app.sqlite3")


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS service_status (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                order_id TEXT NOT NULL,
                status TEXT NOT NULL,
                frontend_port INTEGER NOT NULL,
                backend_port INTEGER NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                label TEXT NOT NULL,
                value INTEGER NOT NULL,
                trend TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS work_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                owner TEXT NOT NULL,
                state TEXT NOT NULL,
                due_time TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS eval_units (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                name TEXT NOT NULL,
                city TEXT NOT NULL,
                score REAL NOT NULL,
                rank INTEGER NOT NULL,
                reviews INTEGER NOT NULL,
                tags TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS eval_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                unit_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                summary TEXT NOT NULL,
                score REAL NOT NULL,
                author TEXT NOT NULL,
                collected_at TEXT NOT NULL,
                sources TEXT NOT NULL,
                deep_read_url TEXT NOT NULL,
                FOREIGN KEY (unit_id) REFERENCES eval_units(id)
            );

            CREATE TABLE IF NOT EXISTS city_rankings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                city TEXT NOT NULL,
                avg_score REAL NOT NULL,
                unit_count INTEGER NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS reviewers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                title TEXT NOT NULL,
                license TEXT NOT NULL,
                submitted_at TEXT NOT NULL,
                status TEXT NOT NULL,
                experience TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS report_quality (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER NOT NULL,
                reviewer TEXT NOT NULL,
                quality_score REAL NOT NULL,
                accuracy REAL NOT NULL,
                depth REAL NOT NULL,
                timeliness REAL NOT NULL,
                comment TEXT NOT NULL,
                scored_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS brand_applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_name TEXT NOT NULL,
                category TEXT NOT NULL,
                contact_person TEXT NOT NULL,
                contact_phone TEXT NOT NULL,
                license_no TEXT NOT NULL,
                submitted_at TEXT NOT NULL,
                status TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS public_opinion (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                source TEXT NOT NULL,
                sentiment TEXT NOT NULL,
                volume INTEGER NOT NULL,
                related_brand TEXT NOT NULL,
                published_at TEXT NOT NULL,
                trend TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS appeals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                appellant TEXT NOT NULL,
                report_id INTEGER NOT NULL,
                reason TEXT NOT NULL,
                evidence TEXT NOT NULL,
                submitted_at TEXT NOT NULL,
                status TEXT NOT NULL,
                handler TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS report_traceability (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER NOT NULL,
                data_point TEXT NOT NULL,
                source_type TEXT NOT NULL,
                source_url TEXT NOT NULL,
                collected_at TEXT NOT NULL,
                confidence REAL NOT NULL,
                collector TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS dynamic_weights (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                dimension TEXT NOT NULL,
                current_weight REAL NOT NULL,
                prev_weight REAL NOT NULL,
                reason TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS competitor_matrix (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                brand_a TEXT NOT NULL,
                brand_b TEXT NOT NULL,
                score_a REAL NOT NULL,
                score_b REAL NOT NULL,
                diff_score REAL NOT NULL,
                analysis TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS review_flows (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id INTEGER NOT NULL,
                stage TEXT NOT NULL,
                handler TEXT NOT NULL,
                action TEXT NOT NULL,
                comment TEXT NOT NULL,
                created_at TEXT NOT NULL,
                status TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS schedule_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                planned INTEGER NOT NULL,
                completed INTEGER NOT NULL,
                delayed INTEGER NOT NULL,
                reviewers_count INTEGER NOT NULL,
                category TEXT NOT NULL
            );
            """
        )
        conn.execute(
            """
            INSERT INTO service_status (id, order_id, status, frontend_port, backend_port, updated_at)
            VALUES (1, 'may-89232', 'running', 49232, 59232, ?)
            ON CONFLICT(id) DO UPDATE SET
                status = excluded.status,
                frontend_port = excluded.frontend_port,
                backend_port = excluded.backend_port,
                updated_at = excluded.updated_at
            """,
            (datetime.now(timezone.utc).isoformat(),),
        )
        metric_count = conn.execute("SELECT COUNT(*) FROM metrics").fetchone()[0]
        if metric_count == 0:
            conn.executemany(
                "INSERT INTO metrics (label, value, trend) VALUES (?, ?, ?)",
                [
                    ("评测单元总数", 1284, "+62 本周"),
                    ("在审评测员", 36, "+8 待审"),
                    ("品牌入驻申请", 124, "+23 本月"),
                    ("申诉处理率", 97, "percent"),
                ],
            )
        item_count = conn.execute("SELECT COUNT(*) FROM work_items").fetchone()[0]
        if item_count == 0:
            conn.executemany(
                "INSERT INTO work_items (title, owner, state, due_time) VALUES (?, ?, ?, ?)",
                [
                    ("Port binding check", "service-repair", "done", "09:20"),
                    ("Backend health endpoint", "api", "done", "09:24"),
                    ("Frontend API render", "web", "done", "09:28"),
                    ("Browser smoke path", "runtime", "ready", "next check"),
                ],
            )

        eu_count = conn.execute("SELECT COUNT(*) FROM eval_units").fetchone()[0]
        if eu_count == 0:
            categories = {
                "消费品": [
                    ("精选优品生活馆", "上海", 92.5, 1, 342, "品质保障,物流快,售后好"),
                    ("臻选好物旗舰店", "北京", 90.8, 2, 298, "正品保证,价格实惠"),
                    ("万家生活超市", "广州", 88.3, 3, 256, "品类齐全,性价比高"),
                    ("品质生活精选", "深圳", 87.1, 4, 221, "高端定位,品牌直供"),
                    ("惠民百货商城", "成都", 85.6, 5, 198, "社区服务,便民实惠"),
                ],
                "教育机构": [
                    ("博雅国际教育", "北京", 94.2, 1, 486, "师资雄厚,升学率高"),
                    ("启智教育培训", "上海", 91.8, 2, 412, "教学创新,口碑好"),
                    ("鸿儒书院", "杭州", 89.5, 3, 378, "小班教学,个性化"),
                    ("未来之星教育", "深圳", 88.1, 4, 345, "科技赋能,互动教学"),
                    ("明德学府", "南京", 86.7, 5, 302, "严谨治学,口碑佳"),
                ],
                "医美服务": [
                    ("华美医学美容", "上海", 93.8, 1, 523, "名医团队,设备先进"),
                    ("艺星医美连锁", "北京", 91.5, 2, 467, "连锁品牌,服务标准"),
                    ("美莱医疗美容", "广州", 89.7, 3, 421, "项目齐全,性价比高"),
                    ("丽都整形美容", "成都", 87.9, 4, 389, "西南旗舰,技术精湛"),
                    ("壹加壹医疗美容", "武汉", 85.4, 5, 345, "华中区域,口碑品牌"),
                ],
                "旅游景点": [
                    ("西湖风景名胜区", "杭州", 95.3, 1, 1256, "5A景区,世界遗产"),
                    ("故宫博物院", "北京", 94.8, 2, 1189, "历史文化,国家象征"),
                    ("张家界国家森林公园", "张家界", 92.1, 3, 967, "自然风光,地质奇观"),
                    ("九寨沟风景区", "阿坝", 90.7, 4, 876, "童话世界,水景之王"),
                    ("黄山风景区", "黄山", 89.5, 5, 823, "奇松怪石,温泉云海"),
                ],
            }
            now = datetime.now(timezone.utc).isoformat()
            for cat, units in categories.items():
                for name, city, score, rank, reviews, tags in units:
                    conn.execute(
                        "INSERT INTO eval_units (category, name, city, score, rank, reviews, tags, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        (cat, name, city, score, rank, reviews, tags, now),
                    )

        rep_count = conn.execute("SELECT COUNT(*) FROM eval_reports").fetchone()[0]
        if rep_count == 0:
            reports_data = [
                (1, "精选优品生活馆2026年Q2深度评测报告", "该机构在品控体系、物流时效和售后响应方面表现突出，综合评分位居消费品类目上海地区首位。", 92.5, "评测员A-001", (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(), "用户评价(45%),实地走访(30%),数据抓取(25%)", "/reports/consumer-001"),
                (2, "臻选好物旗舰店供应链透明化评估", "供应链溯源体系完善，正品率达99.2%，价格策略具备竞争力。", 90.8, "评测员A-002", (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(), "用户评价(40%),资质核验(35%),价格监测(25%)", "/reports/consumer-002"),
                (6, "博雅国际教育师资力量与升学率核查", "师资团队硕博占比87%，近三年一本升学率稳定在92%以上。", 94.2, "评测员E-001", (datetime.now(timezone.utc) - timedelta(days=4)).isoformat(), "官方数据(50%),家长访谈(30%),实地考察(20%)", "/reports/edu-001"),
                (7, "启智教育培训创新模式深度分析", "项目式学习与AI辅助教学结合，学员满意度达96%。", 91.8, "评测员E-002", (datetime.now(timezone.utc) - timedelta(days=6)).isoformat(), "学员问卷(45%),课堂观察(35%),成绩追踪(20%)", "/reports/edu-002"),
                (11, "华美医学美容医疗安全与效果回访", "近万台手术零事故，术后3个月客户满意度达94.8%。", 93.8, "评测员M-001", (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(), "客户回访(50%),病历核查(30%),资质审核(20%)", "/reports/medical-001"),
                (12, "艺星医美连锁标准化服务评估", "全国23城连锁，服务流程标准化覆盖率100%。", 91.5, "评测员M-002", (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(), "神秘顾客(40%),服务档案(35%),投诉分析(25%)", "/reports/medical-002"),
                (16, "西湖风景名胜区游客体验与保护监测", "年接待量超2800万人次，文物保护与旅游体验平衡良好。", 95.3, "评测员T-001", (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(), "游客问卷(40%),现场监测(35%),投诉处理(25%)", "/reports/travel-001"),
                (17, "故宫博物院文化传承与数字化报告", "数字文物库开放超800万件藏品，年在线访问超10亿次。", 94.8, "评测员T-002", (datetime.now(timezone.utc) - timedelta(days=8)).isoformat(), "线上数据(45%),实地调研(30%),专家评审(25%)", "/reports/travel-002"),
            ]
            conn.executemany(
                "INSERT INTO eval_reports (unit_id, title, summary, score, author, collected_at, sources, deep_read_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                reports_data,
            )

        cr_count = conn.execute("SELECT COUNT(*) FROM city_rankings").fetchone()[0]
        if cr_count == 0:
            now = datetime.now(timezone.utc).isoformat()
            rank_data = [
                ("消费品", "上海", 90.2, 186, now),
                ("消费品", "北京", 89.1, 172, now),
                ("消费品", "广州", 87.5, 158, now),
                ("消费品", "深圳", 86.8, 145, now),
                ("消费品", "成都", 84.3, 128, now),
                ("教育机构", "北京", 91.5, 134, now),
                ("教育机构", "上海", 90.2, 128, now),
                ("教育机构", "杭州", 88.6, 102, now),
                ("教育机构", "南京", 86.9, 96, now),
                ("教育机构", "武汉", 85.2, 89, now),
                ("医美服务", "上海", 92.1, 145, now),
                ("医美服务", "北京", 90.8, 138, now),
                ("医美服务", "广州", 88.7, 125, now),
                ("医美服务", "成都", 86.5, 108, now),
                ("医美服务", "武汉", 84.9, 92, now),
                ("旅游景点", "杭州", 93.8, 256, now),
                ("旅游景点", "北京", 92.5, 278, now),
                ("旅游景点", "张家界", 90.3, 134, now),
                ("旅游景点", "黄山", 88.9, 156, now),
                ("旅游景点", "阿坝", 89.7, 112, now),
            ]
            conn.executemany(
                "INSERT INTO city_rankings (category, city, avg_score, unit_count, updated_at) VALUES (?, ?, ?, ?, ?)",
                rank_data,
            )

        rv_count = conn.execute("SELECT COUNT(*) FROM reviewers").fetchone()[0]
        if rv_count == 0:
            reviewer_data = [
                ("张明远", "消费品评测高级师", "RC-2024-0876", (datetime.now(timezone.utc) - timedelta(days=12)).isoformat(), "approved", "消费品行业10年经验，曾任某大型零售集团质检总监"),
                ("李思琪", "教育行业评测师", "RC-2025-1102", (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(), "pending", "教育学硕士，曾任某知名教育集团教研主管"),
                ("王博文", "医美合规评测专家", "RC-2025-1156", (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(), "pending", "整形外科主治医师，持执业医师资格证"),
                ("陈雨欣", "旅游服务评测师", "RC-2025-1189", (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(), "reviewing", "旅游管理专业，5A级景区运营经验6年"),
                ("刘志强", "消费品评测师", "RC-2025-1201", (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(), "reviewing", "前第三方检测机构高级工程师"),
                ("赵雅婷", "教育心理评测师", "RC-2025-1215", (datetime.now(timezone.utc) - timedelta(hours=18)).isoformat(), "pending", "心理学博士，国家二级心理咨询师"),
            ]
            conn.executemany(
                "INSERT INTO reviewers (name, title, license, submitted_at, status, experience) VALUES (?, ?, ?, ?, ?, ?)",
                reviewer_data,
            )

        rq_count = conn.execute("SELECT COUNT(*) FROM report_quality").fetchone()[0]
        if rq_count == 0:
            qs_data = [
                (1, "质检-张主任", 94.5, 96.0, 93.0, 94.5, "数据来源可靠，分析深度足够，时效性良好", (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()),
                (2, "质检-李主任", 91.2, 92.0, 90.0, 91.5, "整体质量良好，实地走访样本可扩充", (datetime.now(timezone.utc) - timedelta(days=4)).isoformat()),
                (6, "质检-王主任", 96.8, 98.0, 96.0, 96.5, "数据翔实，分析透彻，为标杆报告", (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()),
                (7, "质检-赵主任", 89.5, 90.0, 88.5, 90.0, "建议增加家长样本深度访谈内容", (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()),
                (11, "质检-刘主任", 93.2, 94.0, 92.5, 93.0, "客户回访样本量充足，数据可信度高", (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()),
                (16, "质检-孙主任", 95.8, 97.0, 95.0, 95.5, "监测维度全面，保护与体验平衡分析到位", (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat()),
            ]
            conn.executemany(
                "INSERT INTO report_quality (report_id, reviewer, quality_score, accuracy, depth, timeliness, comment, scored_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                qs_data,
            )

        ba_count = conn.execute("SELECT COUNT(*) FROM brand_applications").fetchone()[0]
        if ba_count == 0:
            now = datetime.now(timezone.utc)
            app_data = [
                ("诗丽雅护肤", "消费品", "王经理", "138****5678", "XK16-108-6789", (now - timedelta(days=8)).isoformat(), "approved"),
                ("智学堂在线教育", "教育机构", "李校长", "139****1234", "教民11010870001234", (now - timedelta(days=5)).isoformat(), "reviewing"),
                ("颜如玉医美连锁", "医美服务", "陈总", "137****9012", "PDY123456-7-510107", (now - timedelta(days=3)).isoformat(), "reviewing"),
                ("仙踪林主题酒店", "旅游景点", "张运营", "136****3456", "91330100MA2H1K2N3P", (now - timedelta(days=2)).isoformat(), "pending"),
                ("鲜生达食品", "消费品", "吴经理", "135****7890", "SC10231011200012", (now - timedelta(days=1)).isoformat(), "pending"),
                ("乐博机器人教育", "教育机构", "周总监", "188****2345", "教民11010570005678", (now - timedelta(hours=20)).isoformat(), "pending"),
                ("臻颜医疗美容", "医美服务", "郑总", "186****6789", "PDY765432-1-440305", (now - timedelta(hours=10)).isoformat(), "reviewing"),
            ]
            conn.executemany(
                "INSERT INTO brand_applications (brand_name, category, contact_person, contact_phone, license_no, submitted_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                app_data,
            )

        po_count = conn.execute("SELECT COUNT(*) FROM public_opinion").fetchone()[0]
        if po_count == 0:
            now = datetime.now(timezone.utc)
            op_data = [
                ("精选优品虚假发货问题", "微博", "negative", 456, "精选优品生活馆", (now - timedelta(hours=6)).isoformat(), "rising"),
                ("博雅国际教育升学率造假传闻", "知乎", "negative", 234, "博雅国际教育", (now - timedelta(hours=12)).isoformat(), "stable"),
                ("华美医美手术效果获好评", "小红书", "positive", 892, "华美医学美容", (now - timedelta(hours=4)).isoformat(), "rising"),
                ("西湖景区限流措施获点赞", "抖音", "positive", 1256, "西湖风景名胜区", (now - timedelta(hours=2)).isoformat(), "rising"),
                ("艺星医美服务态度投诉", "大众点评", "negative", 123, "艺星医美连锁", (now - timedelta(days=1)).isoformat(), "declining"),
                ("启智教育AI教学模式热议", "微信公众号", "neutral", 567, "启智教育培训", (now - timedelta(hours=8)).isoformat(), "stable"),
                ("故宫数字文创产品爆火", "B站", "positive", 2341, "故宫博物院", (now - timedelta(hours=1)).isoformat(), "rising"),
                ("张家界景区交通优化建议", "马蜂窝", "neutral", 345, "张家界国家森林公园", (now - timedelta(days=2)).isoformat(), "stable"),
            ]
            conn.executemany(
                "INSERT INTO public_opinion (title, source, sentiment, volume, related_brand, published_at, trend) VALUES (?, ?, ?, ?, ?, ?, ?)",
                op_data,
            )

        ap_count = conn.execute("SELECT COUNT(*) FROM appeals").fetchone()[0]
        if ap_count == 0:
            now = datetime.now(timezone.utc)
            appeal_data = [
                ("臻选好物旗舰店", 2, "报告中价格数据已过期，最新促销未计入", "提供6月最新促销截图及官方价格表", (now - timedelta(days=4)).isoformat(), "resolved", "审核员-王"),
                ("美莱医疗美容", 13, "对资质审核部分描述有异议，许可范围描述不准确", "提供医疗机构执业许可最新副本扫描件", (now - timedelta(days=2)).isoformat(), "reviewing", "审核员-李"),
                ("惠民百货商城", 5, "关于售后响应时间数据采样时段有偏", "提供近3个月全量工单数据", (now - timedelta(days=1)).isoformat(), "pending", "审核员-张"),
                ("明德学府", 10, "师资构成统计中部分教师职称已晋升", "提供最新师资名册及职称证书", (now - timedelta(hours=16)).isoformat(), "pending", "待分配"),
            ]
            conn.executemany(
                "INSERT INTO appeals (appellant, report_id, reason, evidence, submitted_at, status, handler) VALUES (?, ?, ?, ?, ?, ?, ?)",
                appeal_data,
            )

        rt_count = conn.execute("SELECT COUNT(*) FROM report_traceability").fetchone()[0]
        if rt_count == 0:
            now = datetime.now(timezone.utc)
            trace_data = [
                (1, "总体评分92.5", "用户评价", "https://review.example.com/12345", (now - timedelta(days=5, hours=3)).isoformat(), 0.94, "爬虫系统A"),
                (1, "物流评分91.2", "实地走访", "内部走访记录#2026-0612-001", (now - timedelta(days=5, hours=6)).isoformat(), 0.98, "评测员A-001"),
                (1, "售后评分93.8", "数据抓取", "https://complaint.example.com/api/records", (now - timedelta(days=4, hours=2)).isoformat(), 0.91, "API对接"),
                (6, "升学率92%", "官方数据", "北京市教委年度统计公报", (now - timedelta(days=6, hours=4)).isoformat(), 0.99, "数据采集团队"),
                (6, "师资占比87%", "实地考察", "人事档案现场核验记录", (now - timedelta(days=6, hours=8)).isoformat(), 0.97, "评测员E-001"),
                (6, "家长满意度95%", "家长访谈", "CATI问卷系统#2026-E001", (now - timedelta(days=5, hours=10)).isoformat(), 0.93, "第三方调研"),
                (11, "术后满意度94.8%", "客户回访", "CRM回访记录系统", (now - timedelta(days=3, hours=5)).isoformat(), 0.95, "电话回访组"),
                (11, "零事故记录", "病历核查", "HIS系统手术记录导出", (now - timedelta(days=3, hours=8)).isoformat(), 0.99, "医疗审核组"),
                (16, "游客满意度96%", "游客问卷", "现场拦截问卷N=2380", (now - timedelta(days=2, hours=4)).isoformat(), 0.92, "问卷团队"),
                (16, "投诉处理时长", "投诉处理", "景区投诉管理系统", (now - timedelta(days=2, hours=6)).isoformat(), 0.96, "系统对接"),
            ]
            conn.executemany(
                "INSERT INTO report_traceability (report_id, data_point, source_type, source_url, collected_at, confidence, collector) VALUES (?, ?, ?, ?, ?, ?, ?)",
                trace_data,
            )

        dw_count = conn.execute("SELECT COUNT(*) FROM dynamic_weights").fetchone()[0]
        if dw_count == 0:
            now = datetime.now(timezone.utc).isoformat()
            weight_data = [
                ("消费品", "品质保障", 0.30, 0.28, "618大促期间品质投诉占比上升", now),
                ("消费品", "价格优势", 0.25, 0.27, "竞品价格战趋缓，权重适度回调", now),
                ("消费品", "物流时效", 0.20, 0.20, "物流稳定性保持稳定，权重不变", now),
                ("消费品", "售后服务", 0.25, 0.25, "售后响应速度持续成为用户关注焦点", now),
                ("教育机构", "师资力量", 0.35, 0.32, "家长对师资背景关注度持续攀升", now),
                ("教育机构", "教学成果", 0.30, 0.30, "升学与成绩指标权重维持高位", now),
                ("教育机构", "教学环境", 0.18, 0.20, "硬件投入进入稳定期，权重微调下降", now),
                ("教育机构", "服务体验", 0.17, 0.18, "家校沟通服务重要性略有上升", now),
                ("医美服务", "医疗安全", 0.40, 0.38, "合规监管趋严，安全权重提升", now),
                ("医美服务", "效果满意度", 0.30, 0.30, "效果回访是核心指标", now),
                ("医美服务", "医师资质", 0.18, 0.20, "无证行医事件频发，资质核查加强", now),
                ("医美服务", "价格透明", 0.12, 0.12, "隐形消费投诉下降，权重维持", now),
                ("旅游景点", "景观品质", 0.35, 0.35, "核心资源吸引力权重稳定", now),
                ("旅游景点", "服务体验", 0.28, 0.30, "服务类投诉占比上升，权重上调", now),
                ("旅游景点", "交通便利", 0.18, 0.17, "高铁网络完善，交通权重略降", now),
                ("旅游景点", "配套设施", 0.19, 0.18, "配套整体达标率提升", now),
            ]
            conn.executemany(
                "INSERT INTO dynamic_weights (category, dimension, current_weight, prev_weight, reason, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                weight_data,
            )

        cm_count = conn.execute("SELECT COUNT(*) FROM competitor_matrix").fetchone()[0]
        if cm_count == 0:
            now = datetime.now(timezone.utc).isoformat()
            matrix_data = [
                ("消费品", "精选优品生活馆", "臻选好物旗舰店", 92.5, 90.8, 1.7, "精选优品在物流和售后上领先，臻选好物在价格上更具优势", now),
                ("消费品", "万家生活超市", "品质生活精选", 88.3, 87.1, 1.2, "万家胜在品类齐全和社区覆盖，品质定位高端用户口碑好", now),
                ("教育机构", "博雅国际教育", "启智教育培训", 94.2, 91.8, 2.4, "博雅传统学科教育优势明显，启智在创新教学和科技运用上得分更高", now),
                ("教育机构", "鸿儒书院", "未来之星教育", 89.5, 88.1, 1.4, "鸿儒书院在人文底蕴和传统教学见长，未来之星科技赋能更具特色", now),
                ("医美服务", "华美医学美容", "艺星医美连锁", 93.8, 91.5, 2.3, "华美名医团队和手术安全指标领先，艺星品牌连锁标准化服务更强", now),
                ("医美服务", "美莱医疗美容", "丽都整形美容", 89.7, 87.9, 1.8, "美莱项目齐全性价比高，丽都在西南区域品牌影响力深厚", now),
                ("旅游景点", "西湖风景名胜区", "故宫博物院", 95.3, 94.8, 0.5, "两者代表中国自然与人文巅峰，西湖游客体验更优，故宫文化价值更高", now),
                ("旅游景点", "张家界国家森林公园", "黄山风景区", 92.1, 89.5, 2.6, "张家界地质景观独特性强，黄山综合配套和文化底蕴更深厚", now),
            ]
            conn.executemany(
                "INSERT INTO competitor_matrix (category, brand_a, brand_b, score_a, score_b, diff_score, analysis, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                matrix_data,
            )

        rf_count = conn.execute("SELECT COUNT(*) FROM review_flows").fetchone()[0]
        if rf_count == 0:
            now = datetime.now(timezone.utc)
            flow_data = [
                (1, "初稿提交", "评测员A-001", "submit", "完成初稿撰写，提交进入初审", (now - timedelta(days=10)).isoformat(), "approved"),
                (1, "内容初审", "审核员-张", "approve", "事实核查通过，数据来源可靠", (now - timedelta(days=8)).isoformat(), "approved"),
                (1, "质量评分", "质检-张主任", "score", "综合质量94.5分，进入终审", (now - timedelta(days=6)).isoformat(), "approved"),
                (1, "终审发布", "主编-陈", "publish", "批准发布，进入公开列表", (now - timedelta(days=3)).isoformat(), "approved"),
                (2, "初稿提交", "评测员A-002", "submit", "完成供应链评估报告初稿", (now - timedelta(days=12)).isoformat(), "approved"),
                (2, "内容初审", "审核员-李", "approve", "资质核验通过，补充建议已备注", (now - timedelta(days=10)).isoformat(), "approved"),
                (2, "申诉处理中", "臻选好物旗舰店", "appeal", "对价格数据时效提出异议", (now - timedelta(days=4)).isoformat(), "resolved"),
                (2, "修正复审", "审核员-王", "re-review", "申诉内容已修正，通过复审", (now - timedelta(days=2)).isoformat(), "approved"),
                (2, "终审发布", "主编-陈", "publish", "终审通过，已发布", (now - timedelta(days=1)).isoformat(), "approved"),
                (6, "初稿提交", "评测员E-001", "submit", "博雅教育师资核查报告完成", (now - timedelta(days=8)).isoformat(), "approved"),
                (6, "内容初审", "审核员-王", "approve", "官方数据交叉验证通过", (now - timedelta(days=6)).isoformat(), "approved"),
                (6, "质量评分", "质检-王主任", "score", "质量评分96.8，标杆报告推荐", (now - timedelta(days=4)).isoformat(), "approved"),
                (6, "终审发布", "主编-陈", "publish", "已发布", (now - timedelta(days=2)).isoformat(), "approved"),
                (7, "初稿提交", "评测员E-002", "submit", "启智教育创新模式分析初稿", (now - timedelta(days=9)).isoformat(), "approved"),
                (7, "内容初审", "审核员-张", "revision", "建议增加家长访谈样本", (now - timedelta(days=7)).isoformat(), "pending"),
                (7, "修改补件", "评测员E-002", "resubmit", "已补充15份家长深度访谈", (now - timedelta(days=3)).isoformat(), "pending"),
                (11, "初稿提交", "评测员M-001", "submit", "华美医美安全效果回访报告", (now - timedelta(days=5)).isoformat(), "approved"),
                (11, "医疗合规审核", "医疗法务组", "approve", "医疗资质与数据合规性确认", (now - timedelta(days=3)).isoformat(), "approved"),
                (11, "终审待处理", "主编-陈", "pending", "等待主编终审", (now - timedelta(days=1)).isoformat(), "pending"),
            ]
            conn.executemany(
                "INSERT INTO review_flows (report_id, stage, handler, action, comment, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                flow_data,
            )

        ss_count = conn.execute("SELECT COUNT(*) FROM schedule_stats").fetchone()[0]
        if ss_count == 0:
            now = datetime.now(timezone.utc).date()
            stat_data = []
            for i in range(14):
                d = now - timedelta(days=13 - i)
                for cat in ["消费品", "教育机构", "医美服务", "旅游景点"]:
                    planned = 8 if cat in ["消费品", "旅游景点"] else 6
                    completed = planned - (0 if i < 7 else (1 if i % 3 == 0 else 0))
                    delayed = 0 if i < 7 else (1 if i % 4 == 0 else 0)
                    reviewers = 5 if cat in ["消费品", "旅游景点"] else 4
                    stat_data.append((d.isoformat(), planned, completed, delayed, reviewers, cat))
            conn.executemany(
                "INSERT INTO schedule_stats (date, planned, completed, delayed, reviewers_count, category) VALUES (?, ?, ?, ?, ?, ?)",
                stat_data,
            )

        conn.commit()


def rows(query: str, params: tuple = ()) -> list[dict[str, object]]:
    with connect() as conn:
        return [dict(row) for row in conn.execute(query, params).fetchall()]


def row(query: str, params: tuple = ()) -> dict[str, object]:
    with connect() as conn:
        result = conn.execute(query, params).fetchone()
        return dict(result) if result else {}


class Handler(BaseHTTPRequestHandler):
    server_version = "may-89232-api/1.0"

    def log_message(self, fmt: str, *args: object) -> None:
        print(f"{self.address_string()} - {fmt % args}", flush=True)

    def _send_json(self, payload: dict[str, object], status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status.value)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self._send_json({"ok": True})

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)

        if parsed.path == "/api/health":
            status = row("SELECT * FROM service_status WHERE id = 1")
            self._send_json(
                {
                    "ok": True,
                    "service": "may-89232",
                    "status": status.get("status", "running"),
                    "database": str(DB_PATH.relative_to(ROOT)),
                    "updatedAt": datetime.now(timezone.utc).isoformat(),
                }
            )
            return

        if parsed.path == "/api/dashboard":
            self._send_json(
                {
                    "ok": True,
                    "status": row("SELECT * FROM service_status WHERE id = 1"),
                    "metrics": rows("SELECT label, value, trend FROM metrics ORDER BY id"),
                    "items": rows("SELECT title, owner, state, due_time AS dueTime FROM work_items ORDER BY id"),
                }
            )
            return

        if parsed.path == "/api/overview":
            eval_by_cat = rows("SELECT category, COUNT(*) AS count, ROUND(AVG(score), 1) AS avg_score FROM eval_units GROUP BY category")
            reviewer_stats = {
                "total": row("SELECT COUNT(*) AS total FROM reviewers")["total"],
                "pending": row("SELECT COUNT(*) AS pending FROM reviewers WHERE status = 'pending'")["pending"],
                "approved": row("SELECT COUNT(*) AS approved FROM reviewers WHERE status = 'approved'")["approved"],
            }
            appeal_stats = {
                "total": row("SELECT COUNT(*) AS total FROM appeals")["total"],
                "pending": row("SELECT COUNT(*) AS pending FROM appeals WHERE status = 'pending'")["pending"],
                "reviewing": row("SELECT COUNT(*) AS reviewing FROM appeals WHERE status = 'reviewing'")["reviewing"],
            }
            brand_stats = {
                "total": row("SELECT COUNT(*) AS total FROM brand_applications")["total"],
                "pending": row("SELECT COUNT(*) AS pending FROM brand_applications WHERE status = 'pending'")["pending"],
                "reviewing": row("SELECT COUNT(*) AS reviewing FROM brand_applications WHERE status = 'reviewing'")["reviewing"],
                "approved": row("SELECT COUNT(*) AS approved FROM brand_applications WHERE status = 'approved'")["approved"],
            }
            report_count = row("SELECT COUNT(*) AS total FROM eval_reports")["total"]
            today_sch = rows(
                "SELECT category, SUM(planned) AS planned, SUM(completed) AS completed, SUM(delayed) AS delayed FROM schedule_stats WHERE date = DATE('now') GROUP BY category"
            )
            self._send_json({
                "ok": True,
                "evalByCategory": eval_by_cat,
                "reviewerStats": reviewer_stats,
                "appealStats": appeal_stats,
                "brandStats": brand_stats,
                "reportCount": report_count,
                "todaySchedule": today_sch,
            })
            return

        if parsed.path == "/api/eval-units":
            category = qs.get("category", [None])[0]
            keyword = qs.get("keyword", [""])[0].strip()
            city = qs.get("city", [None])[0]
            query = "SELECT * FROM eval_units WHERE 1=1"
            params: list = []
            if category:
                query += " AND category = ?"
                params.append(category)
            if city:
                query += " AND city = ?"
                params.append(city)
            if keyword:
                query += " AND (name LIKE ? OR tags LIKE ?)"
                params.extend([f"%{keyword}%", f"%{keyword}%"])
            query += " ORDER BY score DESC LIMIT 50"
            self._send_json({"ok": True, "data": rows(query, tuple(params))})
            return

        if parsed.path == "/api/city-rankings":
            category = qs.get("category", [None])[0]
            query = "SELECT * FROM city_rankings"
            params: tuple = ()
            if category:
                query += " WHERE category = ?"
                params = (category,)
            query += " ORDER BY avg_score DESC LIMIT 50"
            self._send_json({"ok": True, "data": rows(query, params)})
            return

        if parsed.path == "/api/eval-reports":
            unit_id = qs.get("unit_id", [None])[0]
            query = "SELECT er.*, eu.name AS unit_name, eu.category AS unit_category FROM eval_reports er LEFT JOIN eval_units eu ON er.unit_id = eu.id"
            params: tuple = ()
            if unit_id:
                query += " WHERE er.unit_id = ?"
                params = (int(unit_id),)
            query += " ORDER BY er.collected_at DESC LIMIT 30"
            self._send_json({"ok": True, "data": rows(query, params)})
            return

        if parsed.path.startswith("/api/eval-reports/"):
            report_id = parsed.path.rsplit("/", 1)[1]
            report = row(
                "SELECT er.*, eu.name AS unit_name, eu.category AS unit_category, eu.city AS unit_city FROM eval_reports er LEFT JOIN eval_units eu ON er.unit_id = eu.id WHERE er.id = ?",
                (int(report_id),),
            )
            quality = rows("SELECT * FROM report_quality WHERE report_id = ? ORDER BY scored_at DESC", (int(report_id),))
            flows = rows("SELECT * FROM review_flows WHERE report_id = ? ORDER BY created_at ASC", (int(report_id),))
            traces = rows("SELECT * FROM report_traceability WHERE report_id = ? ORDER BY collected_at ASC", (int(report_id),))
            self._send_json({"ok": True, "report": report, "quality": quality, "flows": flows, "traces": traces})
            return

        if parsed.path == "/api/reviewers":
            status = qs.get("status", [None])[0]
            query = "SELECT * FROM reviewers"
            params: tuple = ()
            if status:
                query += " WHERE status = ?"
                params = (status,)
            query += " ORDER BY submitted_at DESC"
            self._send_json({"ok": True, "data": rows(query, params)})
            return

        if parsed.path == "/api/report-quality":
            self._send_json({"ok": True, "data": rows("SELECT rq.*, er.title AS report_title FROM report_quality rq LEFT JOIN eval_reports er ON rq.report_id = er.id ORDER BY rq.scored_at DESC LIMIT 50")})
            return

        if parsed.path == "/api/brand-applications":
            status = qs.get("status", [None])[0]
            query = "SELECT * FROM brand_applications"
            params: tuple = ()
            if status:
                query += " WHERE status = ?"
                params = (status,)
            query += " ORDER BY submitted_at DESC"
            self._send_json({"ok": True, "data": rows(query, params)})
            return

        if parsed.path == "/api/public-opinion":
            sentiment = qs.get("sentiment", [None])[0]
            query = "SELECT * FROM public_opinion"
            params: tuple = ()
            if sentiment:
                query += " WHERE sentiment = ?"
                params = (sentiment,)
            query += " ORDER BY published_at DESC LIMIT 50"
            self._send_json({"ok": True, "data": rows(query, params)})
            return

        if parsed.path == "/api/appeals":
            status = qs.get("status", [None])[0]
            query = "SELECT a.*, er.title AS report_title FROM appeals a LEFT JOIN eval_reports er ON a.report_id = er.id"
            params: tuple = ()
            if status:
                query += " WHERE a.status = ?"
                params = (status,)
            query += " ORDER BY a.submitted_at DESC"
            self._send_json({"ok": True, "data": rows(query, params)})
            return

        if parsed.path == "/api/dynamic-weights":
            category = qs.get("category", [None])[0]
            query = "SELECT * FROM dynamic_weights"
            params: tuple = ()
            if category:
                query += " WHERE category = ?"
                params = (category,)
            query += " ORDER BY category, current_weight DESC"
            self._send_json({"ok": True, "data": rows(query, params)})
            return

        if parsed.path == "/api/competitor-matrix":
            category = qs.get("category", [None])[0]
            query = "SELECT * FROM competitor_matrix"
            params: tuple = ()
            if category:
                query += " WHERE category = ?"
                params = (category,)
            query += " ORDER BY diff_score DESC LIMIT 20"
            self._send_json({"ok": True, "data": rows(query, params)})
            return

        if parsed.path == "/api/schedule-stats":
            category = qs.get("category", [None])[0]
            query = "SELECT * FROM schedule_stats"
            params: tuple = ()
            if category:
                query += " WHERE category = ?"
                params = (category,)
            query += " ORDER BY date DESC LIMIT 60"
            self._send_json({"ok": True, "data": rows(query, params)})
            return

        if parsed.path == "/api/review-flows":
            status = qs.get("status", [None])[0]
            query = "SELECT rf.*, er.title AS report_title FROM review_flows rf LEFT JOIN eval_reports er ON rf.report_id = er.id"
            params: tuple = ()
            if status:
                query += " WHERE rf.status = ?"
                params = (status,)
            query += " ORDER BY rf.created_at DESC LIMIT 50"
            self._send_json({"ok": True, "data": rows(query, params)})
            return

        self._send_json({"ok": False, "error": "Not found"}, HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length > 0 else b"{}"
        try:
            body = json.loads(raw.decode("utf-8")) if raw else {}
        except (json.JSONDecodeError, UnicodeDecodeError):
            body = {}

        if parsed.path == "/api/reviewers/approve":
            rid = body.get("id")
            if not rid:
                self._send_json({"ok": False, "error": "missing id"}, HTTPStatus.BAD_REQUEST)
                return
            with connect() as conn:
                conn.execute("UPDATE reviewers SET status = 'approved' WHERE id = ?", (int(rid),))
                conn.commit()
            self._send_json({"ok": True})
            return

        if parsed.path == "/api/reviewers/reject":
            rid = body.get("id")
            if not rid:
                self._send_json({"ok": False, "error": "missing id"}, HTTPStatus.BAD_REQUEST)
                return
            with connect() as conn:
                conn.execute("UPDATE reviewers SET status = 'rejected' WHERE id = ?", (int(rid),))
                conn.commit()
            self._send_json({"ok": True})
            return

        if parsed.path == "/api/brands/approve":
            bid = body.get("id")
            if not bid:
                self._send_json({"ok": False, "error": "missing id"}, HTTPStatus.BAD_REQUEST)
                return
            with connect() as conn:
                conn.execute("UPDATE brand_applications SET status = 'approved' WHERE id = ?", (int(bid),))
                conn.commit()
            self._send_json({"ok": True})
            return

        if parsed.path == "/api/brands/reject":
            bid = body.get("id")
            if not bid:
                self._send_json({"ok": False, "error": "missing id"}, HTTPStatus.BAD_REQUEST)
                return
            with connect() as conn:
                conn.execute("UPDATE brand_applications SET status = 'rejected' WHERE id = ?", (int(bid),))
                conn.commit()
            self._send_json({"ok": True})
            return

        if parsed.path == "/api/appeals/resolve":
            aid = body.get("id")
            comment = body.get("comment", "")
            if not aid:
                self._send_json({"ok": False, "error": "missing id"}, HTTPStatus.BAD_REQUEST)
                return
            with connect() as conn:
                conn.execute("UPDATE appeals SET status = 'resolved' WHERE id = ?", (int(aid),))
                conn.execute(
                    "INSERT INTO review_flows (report_id, stage, handler, action, comment, created_at, status) VALUES (?, '申诉处理', '系统', 'resolve', ?, ?, 'approved')",
                    (int(body.get("report_id", 0)), comment, datetime.now(timezone.utc).isoformat()),
                )
                conn.commit()
            self._send_json({"ok": True})
            return

        self._send_json({"ok": False, "error": "Not found"}, HTTPStatus.NOT_FOUND)


def main() -> None:
    init_db()
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"may-89232 API listening on http://{HOST}:{PORT}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
