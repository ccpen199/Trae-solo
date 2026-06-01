#!/usr/bin/env python3
from __future__ import annotations

import os
import sqlite3
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS

PROJECT_DIR = Path(__file__).resolve().parents[1]
ORDER_ID = "may-63474"


def load_env() -> dict[str, str]:
    env = dict(os.environ)
    env_path = PROJECT_DIR / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            env.setdefault(key.strip(), value.strip().strip('"').strip("'"))
    return env


ENV = load_env()
HOST = ENV.get("HOST", "127.0.0.1")
PORT = int(ENV.get("BACKEND_PORT", "53474"))
FRONTEND_PORT = ENV.get("FRONTEND_PORT", "43474")
DATABASE_PATH = Path(ENV.get("DATABASE_PATH", "./data/app.sqlite"))
if not DATABASE_PATH.is_absolute():
    DATABASE_PATH = PROJECT_DIR / DATABASE_PATH

app = Flask(__name__)
CORS(app, origins=[f"http://127.0.0.1:{FRONTEND_PORT}"])


def connect_db() -> sqlite3.Connection:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def row_to_dict(row: sqlite3.Row | None) -> dict | None:
    if row is None:
        return None
    return dict(row)


def rows_to_list(rows: list[sqlite3.Row]) -> list[dict]:
    return [dict(r) for r in rows]


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    module_id INTEGER,
    status TEXT DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS requirements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS page_requirements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL,
    requirement_id INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id INTEGER NOT NULL,
    version_number INTEGER NOT NULL,
    image_url TEXT DEFAULT '',
    description TEXT DEFAULT '',
    change_type TEXT DEFAULT 'update',
    created_by TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    version_id INTEGER,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'scheduled',
    scheduled_at TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS review_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    role TEXT DEFAULT 'reviewer'
);

CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,
    version_id INTEGER,
    x REAL DEFAULT 0,
    y REAL DEFAULT 0,
    width REAL DEFAULT 0,
    height REAL DEFAULT 0,
    content TEXT NOT NULL,
    issue_type TEXT DEFAULT 'other',
    priority TEXT DEFAULT 'medium',
    assignee TEXT DEFAULT '',
    status TEXT DEFAULT 'open',
    parent_id INTEGER,
    created_by TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS resolutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comment_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    note TEXT DEFAULT '',
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fix_confirmations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resolution_id INTEGER NOT NULL,
    reviewer TEXT NOT NULL,
    confirmed INTEGER DEFAULT 0,
    note TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"""


def init_db() -> None:
    with connect_db() as conn:
        conn.executescript(SCHEMA_SQL)
        
        try:
            conn.execute("ALTER TABLE pages ADD COLUMN description TEXT DEFAULT ''")
        except sqlite3.OperationalError:
            pass
        
        count = conn.execute("SELECT COUNT(*) FROM projects").fetchone()[0]
        if count == 0:
            _seed_data(conn)
        conn.commit()


def _seed_data(conn: sqlite3.Connection) -> None:
    conn.execute("INSERT INTO modules (name, sort_order) VALUES ('用户端', 1)")
    conn.execute("INSERT INTO modules (name, sort_order) VALUES ('管理后台', 2)")

    conn.execute(
        "INSERT INTO projects (name, description, module_id) VALUES ('首页改版', '对首页进行全面改版设计', 1)"
    )
    conn.execute(
        "INSERT INTO projects (name, description, module_id) VALUES ('订单流程优化', '优化订单创建和支付流程', 2)"
    )

    for pid in (1, 2):
        conn.execute(
            "INSERT INTO pages (project_id, name, sort_order) VALUES (?, '页面A', 1)",
            (pid,),
        )
        conn.execute(
            "INSERT INTO pages (project_id, name, sort_order) VALUES (?, '页面B', 2)",
            (pid,),
        )

    for page_id in range(1, 5):
        conn.execute(
            "INSERT INTO versions (page_id, version_number, image_url, description, change_type, created_by) VALUES (?, 1, '/images/v1.png', '初版设计', 'create', '设计师A')",
            (page_id,),
        )
        conn.execute(
            "INSERT INTO versions (page_id, version_number, image_url, description, change_type, created_by) VALUES (?, 2, '/images/v2.png', '修改后版本', 'update', '设计师A')",
            (page_id,),
        )

    for pid in (1, 2):
        conn.execute(
            "INSERT INTO requirements (project_id, title, description, status) VALUES (?, '需求1', '详细需求描述1', 'pending')",
            (pid,),
        )
        conn.execute(
            "INSERT INTO requirements (project_id, title, description, status) VALUES (?, '需求2', '详细需求描述2', 'approved')",
            (pid,),
        )

    conn.execute(
        "INSERT INTO reviews (project_id, version_id, title, status, scheduled_at) VALUES (1, 1, '首页改版评审', 'completed', '2025-01-15T10:00:00')"
    )
    conn.execute(
        "INSERT INTO reviews (project_id, version_id, title, status, scheduled_at) VALUES (2, 3, '订单流程评审', 'scheduled', '2025-01-20T14:00:00')"
    )

    conn.execute(
        "INSERT INTO review_participants (review_id, user_name, role) VALUES (1, '张三', 'reviewer')"
    )
    conn.execute(
        "INSERT INTO review_participants (review_id, user_name, role) VALUES (1, '李四', 'designer')"
    )
    conn.execute(
        "INSERT INTO review_participants (review_id, user_name, role) VALUES (2, '王五', 'reviewer')"
    )
    conn.execute(
        "INSERT INTO review_participants (review_id, user_name, role) VALUES (2, '赵六', 'reviewer')"
    )

    comments_data = [
        (1, 1, 100.0, 200.0, 80.0, 60.0, "按钮间距不一致", "layout", "high", "设计师A", "open"),
        (1, 1, 150.0, 300.0, 120.0, 40.0, "字体大小偏小", "typography", "medium", "设计师A", "open"),
        (1, 2, 200.0, 100.0, 60.0, 60.0, "配色与品牌不符", "color", "high", "设计师B", "resolved"),
        (1, 2, 50.0, 400.0, 200.0, 80.0, "图标风格不统一", "icon", "low", "", "open"),
        (2, 3, 120.0, 180.0, 90.0, 50.0, "流程步骤过多", "ux", "high", "产品经理", "open"),
        (2, 3, 300.0, 250.0, 100.0, 70.0, "缺少返回按钮", "layout", "medium", "设计师A", "open"),
        (2, 4, 80.0, 350.0, 150.0, 60.0, "文字表述不清", "content", "low", "", "open"),
    ]
    for c in comments_data:
        conn.execute(
            "INSERT INTO comments (review_id, version_id, x, y, width, height, content, issue_type, priority, assignee, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            c,
        )

    conn.execute(
        "INSERT INTO resolutions (comment_id, action, note, created_by) VALUES (3, 'adopted', '已调整配色方案', '张三')"
    )
    conn.execute(
        "INSERT INTO resolutions (comment_id, action, note, created_by) VALUES (1, 'fixed', '已修复间距问题', '设计师A')"
    )

    conn.execute(
        "INSERT INTO fix_confirmations (resolution_id, reviewer, confirmed, note) VALUES (2, '张三', 1, '确认已修复')"
    )


# ─── Health ───────────────────────────────────────────────────────────────────

@app.route("/api/health")
def health():
    db_ok = False
    try:
        with connect_db() as conn:
            conn.execute("SELECT 1")
        db_ok = True
    except Exception:
        pass
    return jsonify(
        ok=True,
        status="ok",
        sqlite={"ok": db_ok, "path": str(DATABASE_PATH)},
        order=ORDER_ID,
    )


# ─── Modules ──────────────────────────────────────────────────────────────────

@app.route("/api/modules", methods=["GET"])
def list_modules():
    with connect_db() as conn:
        rows = conn.execute("SELECT * FROM modules ORDER BY sort_order, id").fetchall()
    return jsonify(ok=True, data=rows_to_list(rows))


@app.route("/api/modules", methods=["POST"])
def create_module():
    data = request.get_json(force=True)
    name = data.get("name", "")
    sort_order = data.get("sort_order", 0)
    if not name:
        return jsonify(ok=False, error="name is required"), 400
    with connect_db() as conn:
        cur = conn.execute(
            "INSERT INTO modules (name, sort_order) VALUES (?, ?)",
            (name, sort_order),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM modules WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(ok=True, data=row_to_dict(row)), 201


@app.route("/api/modules/<int:mid>", methods=["PUT"])
def update_module(mid):
    data = request.get_json(force=True)
    with connect_db() as conn:
        sets, vals = [], []
        for k in ("name", "sort_order"):
            if k in data:
                sets.append(f"{k} = ?")
                vals.append(data[k])
        if not sets:
            return jsonify(ok=False, error="no fields to update"), 400
        vals.append(mid)
        conn.execute(f"UPDATE modules SET {', '.join(sets)} WHERE id = ?", vals)
        conn.commit()
        row = conn.execute("SELECT * FROM modules WHERE id = ?", (mid,)).fetchone()
    return jsonify(ok=True, data=row_to_dict(row))


@app.route("/api/modules/<int:mid>", methods=["DELETE"])
def delete_module(mid):
    with connect_db() as conn:
        conn.execute("DELETE FROM modules WHERE id = ?", (mid,))
        conn.commit()
    return jsonify(ok=True)


# ─── Projects ─────────────────────────────────────────────────────────────────

@app.route("/api/projects", methods=["GET"])
def list_projects():
    with connect_db() as conn:
        rows = conn.execute(
            """
            SELECT p.*, m.name AS module_name
            FROM projects p
            LEFT JOIN modules m ON p.module_id = m.id
            ORDER BY p.id
            """
        ).fetchall()
        result = []
        for row in rows:
            d = row_to_dict(row)
            pid = row["id"]
            d["pages_count"] = conn.execute(
                "SELECT COUNT(*) AS cnt FROM pages WHERE project_id = ?", (pid,)
            ).fetchone()["cnt"]
            d["versions_count"] = conn.execute(
                "SELECT COUNT(*) AS cnt FROM versions v JOIN pages p ON v.page_id = p.id WHERE p.project_id = ?",
                (pid,),
            ).fetchone()["cnt"]
            d["requirements_count"] = conn.execute(
                "SELECT COUNT(*) AS cnt FROM requirements WHERE project_id = ?", (pid,)
            ).fetchone()["cnt"]
            result.append(d)
    return jsonify(ok=True, data=result)


@app.route("/api/projects", methods=["POST"])
def create_project():
    data = request.get_json(force=True)
    name = data.get("name", "")
    description = data.get("description", "")
    module_id = data.get("module_id")
    pages = data.get("pages", [])
    requirements = data.get("requirements", [])
    review_data = data.get("review", None)
    
    if not name:
        return jsonify(ok=False, error="name is required"), 400
    
    with connect_db() as conn:
        cur = conn.execute(
            "INSERT INTO projects (name, description, module_id) VALUES (?, ?, ?)",
            (name, description, module_id),
        )
        project_id = cur.lastrowid
        
        page_id_map = {}
        for page in pages:
            p_cur = conn.execute(
                "INSERT INTO pages (project_id, name, description) VALUES (?, ?, ?)",
                (project_id, page.get("name", ""), page.get("description", "")),
            )
            page_id = p_cur.lastrowid
            page_id_map[page.get("temp_id")] = page_id
            
            conn.execute(
                """
                INSERT INTO versions (page_id, version_number, description, change_type, created_by)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    page_id,
                    page.get("version_number", 1),
                    page.get("version_description", ""),
                    page.get("change_type", "create"),
                    page.get("created_by", ""),
                ),
            )
        
        req_id_map = {}
        for req in requirements:
            r_cur = conn.execute(
                "INSERT INTO requirements (project_id, title, description, priority, status) VALUES (?, ?, ?, ?, ?)",
                (project_id, req.get("title", ""), req.get("description", ""), req.get("priority", "medium"), req.get("status", "pending")),
            )
            req_id = r_cur.lastrowid
            req_id_map[req.get("temp_id")] = req_id
            
            linked_pages = req.get("linked_pages", [])
            for temp_page_id in linked_pages:
                real_page_id = page_id_map.get(temp_page_id)
                if real_page_id:
                    conn.execute(
                        "INSERT INTO page_requirements (page_id, requirement_id) VALUES (?, ?)",
                        (real_page_id, req_id),
                    )
        
        if review_data:
            version_id = None
            if review_data.get("version_id"):
                version_id = page_id_map.get(review_data.get("version_id"))
            
            rv_cur = conn.execute(
                """
                INSERT INTO reviews (project_id, version_id, title, scheduled_at, status)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    project_id,
                    version_id,
                    review_data.get("title", f"{name} - 第一轮评审"),
                    review_data.get("scheduled_at"),
                    review_data.get("status", "scheduled"),
                ),
            )
            review_id = rv_cur.lastrowid
            
            participants = review_data.get("participants", [])
            for p in participants:
                conn.execute(
                    "INSERT INTO review_participants (review_id, user_name, role) VALUES (?, ?, ?)",
                    (review_id, p.get("user_name", ""), p.get("role", "reviewer")),
                )
        
        conn.commit()
        
        row = conn.execute(
            """
            SELECT p.*, m.name AS module_name
            FROM projects p
            LEFT JOIN modules m ON p.module_id = m.id
            WHERE p.id = ?
            """,
            (project_id,),
        ).fetchone()
        
        result = row_to_dict(row)
        result["pages_count"] = len(pages)
        result["versions_count"] = len(pages)
        result["requirements_count"] = len(requirements)
    
    return jsonify(ok=True, data=result), 201


@app.route("/api/projects/<int:pid>", methods=["GET"])
def get_project(pid):
    with connect_db() as conn:
        row = conn.execute(
            """
            SELECT p.*, m.name AS module_name
            FROM projects p
            LEFT JOIN modules m ON p.module_id = m.id
            WHERE p.id = ?
            """,
            (pid,),
        ).fetchone()
        if row is None:
            return jsonify(ok=False, error="not found"), 404
        result = row_to_dict(row)
        result["pages_count"] = conn.execute(
            "SELECT COUNT(*) FROM pages WHERE project_id = ?", (pid,)
        ).fetchone()[0]
        result["versions_count"] = conn.execute(
            """
            SELECT COUNT(*) FROM versions v
            JOIN pages p ON v.page_id = p.id
            WHERE p.project_id = ?
            """,
            (pid,),
        ).fetchone()[0]
        result["requirements_count"] = conn.execute(
            "SELECT COUNT(*) FROM requirements WHERE project_id = ?", (pid,)
        ).fetchone()[0]
    return jsonify(ok=True, data=result)


@app.route("/api/projects/<int:pid>", methods=["PUT"])
def update_project(pid):
    data = request.get_json(force=True)
    with connect_db() as conn:
        sets, vals = [], []
        for k in ("name", "description", "module_id", "status"):
            if k in data:
                sets.append(f"{k} = ?")
                vals.append(data[k])
        if not sets:
            return jsonify(ok=False, error="no fields to update"), 400
        sets.append("updated_at = datetime('now')")
        vals.append(pid)
        conn.execute(f"UPDATE projects SET {', '.join(sets)} WHERE id = ?", vals)
        conn.commit()
        row = conn.execute(
            """
            SELECT p.*, m.name AS module_name
            FROM projects p
            LEFT JOIN modules m ON p.module_id = m.id
            WHERE p.id = ?
            """,
            (pid,),
        ).fetchone()
    return jsonify(ok=True, data=row_to_dict(row))


@app.route("/api/projects/<int:pid>", methods=["DELETE"])
def delete_project(pid):
    with connect_db() as conn:
        conn.execute("DELETE FROM projects WHERE id = ?", (pid,))
        conn.commit()
    return jsonify(ok=True)


@app.route("/api/projects/<int:pid>/archive", methods=["PUT"])
def archive_project(pid):
    with connect_db() as conn:
        conn.execute(
            "UPDATE projects SET status = 'archived', updated_at = datetime('now') WHERE id = ?",
            (pid,),
        )
        conn.commit()
        row = conn.execute(
            """
            SELECT p.*, m.name AS module_name
            FROM projects p
            LEFT JOIN modules m ON p.module_id = m.id
            WHERE p.id = ?
            """,
            (pid,),
        ).fetchone()
    return jsonify(ok=True, data=row_to_dict(row))


# ─── Pages ────────────────────────────────────────────────────────────────────

@app.route("/api/projects/<int:pid>/pages", methods=["GET"])
def list_pages(pid):
    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM pages WHERE project_id = ? ORDER BY sort_order, id",
            (pid,),
        ).fetchall()
    return jsonify(ok=True, data=rows_to_list(rows))


@app.route("/api/projects/<int:pid>/pages", methods=["POST"])
def create_page(pid):
    data = request.get_json(force=True)
    name = data.get("name", "")
    description = data.get("description", "")
    sort_order = data.get("sort_order", 0)
    initial_version = data.get("initial_version", None)
    
    if not name:
        return jsonify(ok=False, error="name is required"), 400
    with connect_db() as conn:
        cur = conn.execute(
            "INSERT INTO pages (project_id, name, description, sort_order) VALUES (?, ?, ?, ?)",
            (pid, name, description, sort_order),
        )
        page_id = cur.lastrowid
        
        if initial_version:
            conn.execute(
                """
                INSERT INTO versions (page_id, version_number, description, change_type, created_by, image_url)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    page_id,
                    initial_version.get("version_number", 1),
                    initial_version.get("description", ""),
                    initial_version.get("change_type", "create"),
                    initial_version.get("created_by", ""),
                    initial_version.get("image_url", ""),
                ),
            )
        
        conn.commit()
        row = conn.execute("SELECT * FROM pages WHERE id = ?", (page_id,)).fetchone()
    
    return jsonify(ok=True, data=row_to_dict(row)), 201


@app.route("/api/pages/<int:page_id>", methods=["PUT"])
def update_page(page_id):
    data = request.get_json(force=True)
    with connect_db() as conn:
        sets, vals = [], []
        for k in ("name", "sort_order"):
            if k in data:
                sets.append(f"{k} = ?")
                vals.append(data[k])
        if not sets:
            return jsonify(ok=False, error="no fields to update"), 400
        vals.append(page_id)
        conn.execute(f"UPDATE pages SET {', '.join(sets)} WHERE id = ?", vals)
        conn.commit()
        row = conn.execute("SELECT * FROM pages WHERE id = ?", (page_id,)).fetchone()
    return jsonify(ok=True, data=row_to_dict(row))


@app.route("/api/pages/<int:page_id>", methods=["DELETE"])
def delete_page(page_id):
    with connect_db() as conn:
        conn.execute("DELETE FROM pages WHERE id = ?", (page_id,))
        conn.commit()
    return jsonify(ok=True)


# ─── Versions ─────────────────────────────────────────────────────────────────

@app.route("/api/pages/<int:page_id>/versions", methods=["GET"])
def list_versions(page_id):
    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM versions WHERE page_id = ? ORDER BY version_number DESC",
            (page_id,),
        ).fetchall()
    return jsonify(ok=True, data=rows_to_list(rows))


@app.route("/api/pages/<int:page_id>/versions", methods=["POST"])
def create_version(page_id):
    data = request.get_json(force=True)
    image_url = data.get("image_url", "")
    description = data.get("description", "")
    change_type = data.get("change_type", "update")
    created_by = data.get("created_by", "")
    with connect_db() as conn:
        max_v = conn.execute(
            "SELECT MAX(version_number) FROM versions WHERE page_id = ?",
            (page_id,),
        ).fetchone()[0]
        version_number = (max_v or 0) + 1
        cur = conn.execute(
            "INSERT INTO versions (page_id, version_number, image_url, description, change_type, created_by) VALUES (?, ?, ?, ?, ?, ?)",
            (page_id, version_number, image_url, description, change_type, created_by),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM versions WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(ok=True, data=row_to_dict(row)), 201


@app.route("/api/versions/<int:vid>", methods=["GET"])
def get_version(vid):
    with connect_db() as conn:
        row = conn.execute("SELECT * FROM versions WHERE id = ?", (vid,)).fetchone()
    if row is None:
        return jsonify(ok=False, error="not found"), 404
    return jsonify(ok=True, data=row_to_dict(row))


@app.route("/api/versions/<int:vid>", methods=["DELETE"])
def delete_version(vid):
    with connect_db() as conn:
        conn.execute("DELETE FROM versions WHERE id = ?", (vid,))
        conn.commit()
    return jsonify(ok=True)


# ─── Requirements ─────────────────────────────────────────────────────────────

@app.route("/api/projects/<int:pid>/requirements", methods=["GET"])
def list_requirements(pid):
    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM requirements WHERE project_id = ? ORDER BY id",
            (pid,),
        ).fetchall()
    return jsonify(ok=True, data=rows_to_list(rows))


@app.route("/api/projects/<int:pid>/requirements", methods=["POST"])
def create_requirement(pid):
    data = request.get_json(force=True)
    title = data.get("title", "")
    description = data.get("description", "")
    status = data.get("status", "pending")
    if not title:
        return jsonify(ok=False, error="title is required"), 400
    with connect_db() as conn:
        cur = conn.execute(
            "INSERT INTO requirements (project_id, title, description, status) VALUES (?, ?, ?, ?)",
            (pid, title, description, status),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM requirements WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(ok=True, data=row_to_dict(row)), 201


@app.route("/api/requirements/<int:rid>", methods=["PUT"])
def update_requirement(rid):
    data = request.get_json(force=True)
    with connect_db() as conn:
        sets, vals = [], []
        for k in ("title", "description", "status"):
            if k in data:
                sets.append(f"{k} = ?")
                vals.append(data[k])
        if not sets:
            return jsonify(ok=False, error="no fields to update"), 400
        vals.append(rid)
        conn.execute(f"UPDATE requirements SET {', '.join(sets)} WHERE id = ?", vals)
        conn.commit()
        row = conn.execute("SELECT * FROM requirements WHERE id = ?", (rid,)).fetchone()
    return jsonify(ok=True, data=row_to_dict(row))


@app.route("/api/requirements/<int:rid>", methods=["DELETE"])
def delete_requirement(rid):
    with connect_db() as conn:
        conn.execute("DELETE FROM requirements WHERE id = ?", (rid,))
        conn.commit()
    return jsonify(ok=True)


@app.route("/api/pages/<int:page_id>/requirements", methods=["POST"])
def link_requirement(page_id):
    data = request.get_json(force=True)
    requirement_id = data.get("requirement_id")
    if requirement_id is None:
        return jsonify(ok=False, error="requirement_id is required"), 400
    with connect_db() as conn:
        cur = conn.execute(
            "INSERT INTO page_requirements (page_id, requirement_id) VALUES (?, ?)",
            (page_id, requirement_id),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM page_requirements WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
    return jsonify(ok=True, data=row_to_dict(row)), 201


@app.route("/api/pages/<int:page_id>/requirements/<int:rid>", methods=["DELETE"])
def unlink_requirement(page_id, rid):
    with connect_db() as conn:
        conn.execute(
            "DELETE FROM page_requirements WHERE page_id = ? AND requirement_id = ?",
            (page_id, rid),
        )
        conn.commit()
    return jsonify(ok=True)


# ─── Reviews ──────────────────────────────────────────────────────────────────

@app.route("/api/reviews", methods=["GET"])
def list_all_reviews():
    status = request.args.get("status")
    sql = """
        SELECT r.*, p.name AS project_name
        FROM reviews r
        LEFT JOIN projects p ON r.project_id = p.id
    """
    params = []
    if status:
        sql += " WHERE r.status = ?"
        params.append(status)
    sql += " ORDER BY r.created_at DESC"
    with connect_db() as conn:
        rows = conn.execute(sql, params).fetchall()
        result = []
        for row in rows:
            d = row_to_dict(row)
            participants = conn.execute(
                "SELECT * FROM review_participants WHERE review_id = ?",
                (row["id"],),
            ).fetchall()
            d["participants"] = rows_to_list(participants)
            comment_count = conn.execute(
                "SELECT COUNT(*) AS cnt FROM comments WHERE review_id = ?",
                (row["id"],),
            ).fetchone()
            d["comment_count"] = comment_count["cnt"]
            open_count = conn.execute(
                "SELECT COUNT(*) AS cnt FROM comments WHERE review_id = ? AND status = 'open'",
                (row["id"],),
            ).fetchone()
            d["open_comment_count"] = open_count["cnt"]
            result.append(d)
    return jsonify(ok=True, data=result)


@app.route("/api/projects/<int:pid>/reviews", methods=["GET"])
def list_reviews(pid):
    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM reviews WHERE project_id = ? ORDER BY id",
            (pid,),
        ).fetchall()
    return jsonify(ok=True, data=rows_to_list(rows))


@app.route("/api/projects/<int:pid>/reviews", methods=["POST"])
def create_review(pid):
    data = request.get_json(force=True)
    version_id = data.get("version_id")
    title = data.get("title", "")
    scheduled_at = data.get("scheduled_at", "")
    participants = data.get("participants", [])
    if not title:
        return jsonify(ok=False, error="title is required"), 400
    with connect_db() as conn:
        cur = conn.execute(
            "INSERT INTO reviews (project_id, version_id, title, scheduled_at) VALUES (?, ?, ?, ?)",
            (pid, version_id, title, scheduled_at),
        )
        review_id = cur.lastrowid
        for p in participants:
            conn.execute(
                "INSERT INTO review_participants (review_id, user_name, role) VALUES (?, ?, ?)",
                (review_id, p.get("user_name", ""), p.get("role", "reviewer")),
            )
        conn.commit()
        row = conn.execute("SELECT * FROM reviews WHERE id = ?", (review_id,)).fetchone()
        result = row_to_dict(row)
        result["participants"] = rows_to_list(
            conn.execute(
                "SELECT * FROM review_participants WHERE review_id = ?", (review_id,)
            ).fetchall()
        )
    return jsonify(ok=True, data=result), 201


@app.route("/api/reviews/<int:review_id>", methods=["GET"])
def get_review(review_id):
    with connect_db() as conn:
        row = conn.execute(
            """
            SELECT r.*, p.name AS project_name
            FROM reviews r
            LEFT JOIN projects p ON r.project_id = p.id
            WHERE r.id = ?
            """,
            (review_id,),
        ).fetchone()
        if row is None:
            return jsonify(ok=False, error="not found"), 404
        result = row_to_dict(row)
        result["participants"] = rows_to_list(
            conn.execute(
                "SELECT * FROM review_participants WHERE review_id = ?", (review_id,)
            ).fetchall()
        )
        result["comments_count"] = conn.execute(
            "SELECT COUNT(*) FROM comments WHERE review_id = ?", (review_id,)
        ).fetchone()[0]
    return jsonify(ok=True, data=result)


@app.route("/api/reviews/<int:review_id>", methods=["PUT"])
def update_review(review_id):
    data = request.get_json(force=True)
    with connect_db() as conn:
        sets, vals = [], []
        for k in ("title", "status", "scheduled_at"):
            if k in data:
                sets.append(f"{k} = ?")
                vals.append(data[k])
        if not sets:
            return jsonify(ok=False, error="no fields to update"), 400
        vals.append(review_id)
        conn.execute(f"UPDATE reviews SET {', '.join(sets)} WHERE id = ?", vals)
        conn.commit()
        row = conn.execute("SELECT * FROM reviews WHERE id = ?", (review_id,)).fetchone()
    return jsonify(ok=True, data=row_to_dict(row))


@app.route("/api/reviews/<int:review_id>/participants", methods=["POST"])
def add_participant(review_id):
    data = request.get_json(force=True)
    user_name = data.get("user_name", "")
    role = data.get("role", "reviewer")
    if not user_name:
        return jsonify(ok=False, error="user_name is required"), 400
    with connect_db() as conn:
        cur = conn.execute(
            "INSERT INTO review_participants (review_id, user_name, role) VALUES (?, ?, ?)",
            (review_id, user_name, role),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM review_participants WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
    return jsonify(ok=True, data=row_to_dict(row)), 201


@app.route("/api/reviews/<int:review_id>/participants/<int:participant_id>", methods=["DELETE"])
def remove_participant(review_id, participant_id):
    with connect_db() as conn:
        conn.execute(
            "DELETE FROM review_participants WHERE id = ? AND review_id = ?",
            (participant_id, review_id),
        )
        conn.commit()
    return jsonify(ok=True)


# ─── Comments ─────────────────────────────────────────────────────────────────

@app.route("/api/reviews/<int:review_id>/comments", methods=["GET"])
def list_comments(review_id):
    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM comments WHERE review_id = ? ORDER BY id",
            (review_id,),
        ).fetchall()
    return jsonify(ok=True, data=rows_to_list(rows))


@app.route("/api/reviews/<int:review_id>/comments", methods=["POST"])
def create_comment(review_id):
    data = request.get_json(force=True)
    content = data.get("content", "")
    if not content:
        return jsonify(ok=False, error="content is required"), 400
    with connect_db() as conn:
        cur = conn.execute(
            """
            INSERT INTO comments (review_id, version_id, x, y, width, height, content,
                                  issue_type, priority, assignee, parent_id, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                review_id,
                data.get("version_id"),
                data.get("x", 0),
                data.get("y", 0),
                data.get("width", 0),
                data.get("height", 0),
                content,
                data.get("issue_type", "other"),
                data.get("priority", "medium"),
                data.get("assignee", ""),
                data.get("parent_id"),
                data.get("created_by", ""),
            ),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM comments WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(ok=True, data=row_to_dict(row)), 201


@app.route("/api/comments/<int:comment_id>", methods=["PUT"])
def update_comment(comment_id):
    data = request.get_json(force=True)
    with connect_db() as conn:
        sets, vals = [], []
        for k in ("status", "assignee", "content", "issue_type", "priority", "x", "y", "width", "height"):
            if k in data:
                sets.append(f"{k} = ?")
                vals.append(data[k])
        if not sets:
            return jsonify(ok=False, error="no fields to update"), 400
        sets.append("updated_at = datetime('now')")
        vals.append(comment_id)
        conn.execute(f"UPDATE comments SET {', '.join(sets)} WHERE id = ?", vals)
        conn.commit()
        row = conn.execute("SELECT * FROM comments WHERE id = ?", (comment_id,)).fetchone()
    return jsonify(ok=True, data=row_to_dict(row))


@app.route("/api/comments/<int:comment_id>", methods=["DELETE"])
def delete_comment(comment_id):
    with connect_db() as conn:
        conn.execute("DELETE FROM comments WHERE id = ?", (comment_id,))
        conn.commit()
    return jsonify(ok=True)


# ─── Resolutions ──────────────────────────────────────────────────────────────

@app.route("/api/comments/<int:comment_id>/resolutions", methods=["GET"])
def list_resolutions(comment_id):
    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM resolutions WHERE comment_id = ? ORDER BY id",
            (comment_id,),
        ).fetchall()
    return jsonify(ok=True, data=rows_to_list(rows))


@app.route("/api/comments/<int:comment_id>/resolutions", methods=["POST"])
def create_resolution(comment_id):
    data = request.get_json(force=True)
    action = data.get("action", "")
    note = data.get("note", "")
    created_by = data.get("created_by", "")
    if not action:
        return jsonify(ok=False, error="action is required"), 400
    if not created_by:
        return jsonify(ok=False, error="created_by is required"), 400
    with connect_db() as conn:
        cur = conn.execute(
            "INSERT INTO resolutions (comment_id, action, note, created_by) VALUES (?, ?, ?, ?)",
            (comment_id, action, note, created_by),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM resolutions WHERE id = ?", (cur.lastrowid,)).fetchone()
    return jsonify(ok=True, data=row_to_dict(row)), 201


@app.route("/api/resolutions/<int:resolution_id>/confirm", methods=["POST"])
def confirm_resolution(resolution_id):
    data = request.get_json(force=True)
    reviewer = data.get("reviewer", "")
    confirmed = data.get("confirmed", 0)
    note = data.get("note", "")
    if not reviewer:
        return jsonify(ok=False, error="reviewer is required"), 400
    with connect_db() as conn:
        cur = conn.execute(
            "INSERT INTO fix_confirmations (resolution_id, reviewer, confirmed, note) VALUES (?, ?, ?, ?)",
            (resolution_id, reviewer, confirmed, note),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM fix_confirmations WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
    return jsonify(ok=True, data=row_to_dict(row)), 201


@app.route("/api/resolutions/<int:resolution_id>/confirmations", methods=["GET"])
def list_confirmations(resolution_id):
    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM fix_confirmations WHERE resolution_id = ? ORDER BY id",
            (resolution_id,),
        ).fetchall()
    return jsonify(ok=True, data=rows_to_list(rows))


# ─── Version Diff ─────────────────────────────────────────────────────────────

@app.route("/api/versions/<int:vid>/diff/<int:other_id>")
def version_diff(vid, other_id):
    with connect_db() as conn:
        va = conn.execute("SELECT * FROM versions WHERE id = ?", (vid,)).fetchone()
        vb = conn.execute("SELECT * FROM versions WHERE id = ?", (other_id,)).fetchone()
        if va is None or vb is None:
            return jsonify(ok=False, error="version not found"), 404
        comments_a = rows_to_list(
            conn.execute(
                "SELECT * FROM comments WHERE version_id = ? AND status != 'resolved'",
                (vid,),
            ).fetchall()
        )
        comments_b = rows_to_list(
            conn.execute(
                "SELECT * FROM comments WHERE version_id = ? AND status != 'resolved'",
                (other_id,),
            ).fetchall()
        )
    return jsonify(
        ok=True,
        data={
            "version_a": row_to_dict(va),
            "version_b": row_to_dict(vb),
            "comments_a": comments_a,
            "comments_b": comments_b,
        },
    )


# ─── Reports ──────────────────────────────────────────────────────────────────

@app.route("/api/projects/<int:pid>/reports/summary")
def project_summary(pid):
    with connect_db() as conn:
        proj = conn.execute("SELECT * FROM projects WHERE id = ?", (pid,)).fetchone()
        if proj is None:
            return jsonify(ok=False, error="not found"), 404

        issue_distribution = rows_to_list(
            conn.execute(
                """
                SELECT issue_type, COUNT(*) AS count
                FROM comments
                WHERE review_id IN (SELECT id FROM reviews WHERE project_id = ?)
                GROUP BY issue_type
                """,
                (pid,),
            ).fetchall()
        )

        priority_distribution = rows_to_list(
            conn.execute(
                """
                SELECT priority, COUNT(*) AS count
                FROM comments
                WHERE review_id IN (SELECT id FROM reviews WHERE project_id = ?)
                GROUP BY priority
                """,
                (pid,),
            ).fetchall()
        )

        status_distribution = rows_to_list(
            conn.execute(
                """
                SELECT status, COUNT(*) AS count
                FROM comments
                WHERE review_id IN (SELECT id FROM reviews WHERE project_id = ?)
                GROUP BY status
                """,
                (pid,),
            ).fetchall()
        )

        resolution_actions = rows_to_list(
            conn.execute(
                """
                SELECT r.action, COUNT(*) AS count
                FROM resolutions r
                JOIN comments c ON r.comment_id = c.id
                WHERE c.review_id IN (SELECT id FROM reviews WHERE project_id = ?)
                GROUP BY r.action
                """,
                (pid,),
            ).fetchall()
        )

        avg_resp_row = conn.execute(
            """
            SELECT AVG(
                CAST((julianday(r.created_at) - julianday(c.created_at)) * 24 * 60 AS REAL)
            ) AS avg_minutes
            FROM resolutions r
            JOIN comments c ON r.comment_id = c.id
            WHERE c.review_id IN (SELECT id FROM reviews WHERE project_id = ?)
            AND r.id = (
                SELECT MIN(r2.id) FROM resolutions r2 WHERE r2.comment_id = c.id
            )
            """,
            (pid,),
        ).fetchone()
        response_stats = {"avg_minutes": round(avg_resp_row["avg_minutes"] or 0, 2)}

        rework_count = conn.execute(
            """
            SELECT COUNT(*) FROM comments c
            WHERE c.review_id IN (SELECT id FROM reviews WHERE project_id = ?)
            AND c.status = 'open'
            AND EXISTS (
                SELECT 1 FROM resolutions r
                WHERE r.comment_id = c.id AND r.action = 'fixed'
            )
            """,
            (pid,),
        ).fetchone()[0]

        version_count = conn.execute(
            """
            SELECT COUNT(*) FROM versions v
            JOIN pages p ON v.page_id = p.id
            WHERE p.project_id = ?
            """,
            (pid,),
        ).fetchone()[0]

        review_count = conn.execute(
            "SELECT COUNT(*) FROM reviews WHERE project_id = ?", (pid,)
        ).fetchone()[0]

        total_req = conn.execute(
            "SELECT COUNT(*) FROM requirements WHERE project_id = ?", (pid,)
        ).fetchone()[0]
        linked_req = conn.execute(
            """
            SELECT COUNT(DISTINCT r.id) FROM requirements r
            JOIN page_requirements pr ON r.id = pr.requirement_id
            JOIN pages p ON pr.page_id = p.id
            WHERE r.project_id = ? AND p.project_id = ?
            """,
            (pid, pid),
        ).fetchone()[0]

        recent_comments = rows_to_list(
            conn.execute(
                """
                SELECT * FROM comments
                WHERE review_id IN (SELECT id FROM reviews WHERE project_id = ?)
                ORDER BY created_at DESC LIMIT 5
                """,
                (pid,),
            ).fetchall()
        )

        version_quality = rows_to_list(
            conn.execute(
                """
                SELECT 
                    v.id AS version_id,
                    v.version_number,
                    v.change_type,
                    v.created_at,
                    p.name AS page_name,
                    (SELECT COUNT(*) FROM comments c WHERE c.version_id = v.id) AS issue_count
                FROM versions v
                JOIN pages p ON v.page_id = p.id
                WHERE p.project_id = ?
                ORDER BY v.created_at DESC
                LIMIT 10
                """,
                (pid,),
            ).fetchall()
        )

        fix_confirmations = rows_to_list(
            conn.execute(
                """
                SELECT 
                    fc.id,
                    fc.resolution_id,
                    fc.reviewer,
                    fc.confirmed,
                    fc.created_at AS confirmed_at,
                    fc.note,
                    c.content AS comment_content,
                    r.created_by AS fixed_by,
                    fc.reviewer AS confirmed_by
                FROM fix_confirmations fc
                JOIN resolutions r ON fc.resolution_id = r.id
                JOIN comments c ON r.comment_id = c.id
                WHERE c.review_id IN (SELECT id FROM reviews WHERE project_id = ?)
                ORDER BY fc.created_at DESC
                LIMIT 10
                """,
                (pid,),
            ).fetchall()
        )

    return jsonify(
        ok=True,
        data={
            "issue_distribution": issue_distribution,
            "priority_distribution": priority_distribution,
            "status_distribution": status_distribution,
            "resolution_actions": resolution_actions,
            "response_stats": response_stats,
            "rework_count": rework_count,
            "version_count": version_count,
            "review_count": review_count,
            "requirement_coverage": {
                "total": total_req,
                "linked": linked_req,
                "unlinked": total_req - linked_req,
            },
            "recent_comments": recent_comments,
            "version_quality": version_quality,
            "fix_confirmations": fix_confirmations,
        },
    )


# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    print(f"{ORDER_ID} backend listening on http://{HOST}:{PORT}", flush=True)
    app.run(host=HOST, port=PORT, debug=True)
