# may-89190

本项目是本地 Web 全栈业务系统，包含独立前端、后端 API 和 SQLite 数据库。

- 前端地址：http://127.0.0.1:49190/
- 后端地址：http://127.0.0.1:59190
- 健康检查：http://127.0.0.1:59190/api/health
- SQLite 文件：backend/src/db/app.sqlite

启动示例：

```sh
python3 backend/server.py > backend.log 2>&1 &
python3 -m http.server 49190 --bind 127.0.0.1 --directory frontend > frontend.log 2>&1 &
```
