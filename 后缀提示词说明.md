预备说明：本提示词不是业务需求本体，而是在正式首轮项目提示词之前单独发送的项目落地准备指令。收到本提示词后，请先建立后续项目的运行、端口、启动、验收和进程隔离约定；正式业务范围以后续首轮提示词为准，不要把本提示词当作业务功能清单。

网址探测准备要求：正式生成项目时，必须把可探测地址写清楚并落到项目 `.env` 中，至少包含 `FRONTEND_PORT`、`BACKEND_PORT`、单服务项目的 `APP_PORT`、`FRONTEND_URL`、`BACKEND_URL`、`API_BASE_URL` 或 `VITE_API_URL`。这些值必须和实际前端启动端口、后端监听端口、CORS、代理和回调地址保持一致，便于后续自动化按不同序号精准探测前端网址和后端健康接口。

落地要求：统一实现为浏览器 Web 全栈业务系统，不要做独立 App、移动端安装包、小程序壳、桌面客户端或纯前端静态页面；必须包含 Web 前端、后端 API、SQLite 数据库和必要的管理/运营视图，所有核心动作都要落库并可复查。

组件约束：不要生成容器化配置或非必要外部服务，数据库默认优先使用 SQLite 文件数据库（例如 data/app.sqlite）以最快打通完整业务链路；如果业务确实强依赖 MySQL、PostgreSQL、Redis、消息队列或对象存储等特定组件，可以引入，但必须说明依赖原因、配置入口、启动方式和本地降级方案。

端口约束：必须使用确定端口公式，禁止使用 3000、5173、8000、8080 等常见默认端口，也禁止让 Vite/Next/后端框架自动挑选随机端口。设项目目录数字为 N，tail4 为 N 的后四位数字并按 4 位补零；默认 FRONTEND_PORT=40000+tail4，BACKEND_PORT=50000+tail4，单服务项目使用 APP_PORT=FRONTEND_PORT。示例：may-979 使用 40979/50979，may-1257 使用 41257/51257，may-4861 使用 44861/54861，may-4875 使用 44875/54875。端口必须统一写入 .env，并同步到前端启动命令、后端监听地址、CORS、代理、回调地址和 API_BASE_URL，所有服务只监听 127.0.0.1。启动前必须检查端口占用（例如 lsof -ti tcp:$FRONTEND_PORT 和 lsof -ti tcp:$BACKEND_PORT）；如果端口已被其他项目占用，不能退回默认端口、不能杀掉别的项目进程，必须按同一项目备用槽位递增并写回 .env：第 1 备用槽位为 FRONTEND_PORT=41000+tail4、BACKEND_PORT=51000+tail4，之后依次使用 42000/52000、43000/53000、44000/54000、45000/55000 加 tail4。若所有槽位仍被占用，启动必须失败并打印占用 PID、端口和处理建议，而不是静默换端口。Vite 必须启用 strictPort，Next 必须显式传入 -p，后端必须显式绑定配置端口。

验收约束：完成代码后必须实际启动后端和前端，打印访问地址，并通过关键页面操作和接口请求验证主业务链路已调通。

前后端启动方式统一使用后台启动，关闭终端不影响程序运行，只有手动关闭对应端口进程才算完成关闭。

不要提问我问题，遇到脚本问题、执行问题、权限问题等都允许你自行解决。

执行过程中，项目内的删除动作不需要经过我同意，可直接处理。

按照需求功能的顺序，每一轮都优先考虑搭建核心功能，再逐步考虑其他功能。

热更新约束：前端开发态默认使用 Vite/Next HMR 或等价热更新完成预览；普通页面、样式、文案、表单校验和局部业务逻辑修改后，不得因为这类改动重启整个项目，只允许浏览器刷新或等待热更新生效。后端如果支持 watch，也优先热重载；只有当依赖安装、.env、端口、代理、CORS、后端监听地址、启动脚本、构建配置等会影响进程启动或绑定地址的变更发生时，才允许定点重启当前项目对应前后端进程。

进程隔离约束：启动、重启和释放端口时，只能处理当前项目目录对应的前后端进程；必须先确认 PID 的命令行和 cwd 都属于当前项目，才能终止。禁止使用 `pkill -f "vite"`、`pkill -f vite`、`killall node`、`pkill node`、`killall vite`、`killall python` 等全局清理命令；如果无法确认归属，就改用当前项目备用端口并同步写回 .env，绝不能误杀别的项目服务。

启动稳定性约束：完成前不能只以终端输出 `VITE ready`、`Server running` 或 Trae 任务显示完成作为成功依据。前后端后台启动后必须等待至少 5 秒，再分别用 `lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN` 和 `lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN` 确认端口仍在监听；用 `ps -o stat= -p $PID` 确认进程状态不是 `T` 停止态、不是 `Z` 僵尸态，也不是已退出；再用 `curl --max-time 5` 访问前端首页确认返回 HTTP 200，并请求后端健康接口或一个真实业务 API 确认返回 2xx/3xx 或可解释的业务响应。若前端端口无监听、连接超时、进程处于停止态，或只有后端存活前端不存在，都不算完成，必须修复当前项目的启动脚本或按进程隔离约束重新定点启动当前项目。前后端日志应分别写入 `frontend.log` 和 `backend.log`，但历史日志里的 ready 文案不能替代当前端口和进程存活校验。

命令规避约束：如果需要启动、重启、验收或排障，优先使用下面这组命令模板，不要手工拆行拼接，也不要把 `lsof`、`ps`、`curl` 拆成一半再补一半。先取当前项目的固定端口，再做定点核查：

```sh

PROJECT_DIR="$(pwd)"

FRONTEND_PORT=xxxxx

BACKEND_PORT=yyyyy

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)

backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

ps -p "$frontend_pid" -o pid=,ppid=,stat=,cwd=,command=

ps -p "$backend_pid" -o pid=,ppid=,stat=,cwd=,command=

curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/

curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health

```

如果要终止进程，必须先确认 `cwd` 和 `command` 都属于 `PROJECT_DIR`，再只杀当前 PID：

```sh

pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t | head -n1)

cwd=$(ps -o cwd= -p "$pid" | xargs)

cmd=$(ps -o command= -p "$pid")

case "$cwd" in

"$PROJECT_DIR"/*) kill "$pid" ;;

*) echo "skip kill: cwd=$cwd cmd=$cmd" ;;

esac

```

若端口占用但归属不明，不允许继续 kill，直接换同项目备用槽位并写回 .env。前端页面打开后如果浏览器控制台出现 `SyntaxError`、`import`/`export` 不匹配、`Uncaught` 或接口 `500`，都必须算失败并继续修，不得只看日志里的 `ready` 文案。

固定命令模板约束：如果要检查端口、确认进程归属、启动、重启或停止当前项目，优先直接复制下面整段命令，不要拆成多行后再手工补，不要把 `lsof` 的 `-nP`、`-iTCP`、`-sTCP:LISTEN` 拆断，也不要只执行半句。若终端出现 `zsh: command not found: -nP`，说明命令被拆断了，必须整段重试。

```sh

PROJECT_DIR="$(pwd)"

FRONTEND_PORT=xxxxx

BACKEND_PORT=yyyyy

frontend_pid=$(lsof -nP -iTCP:$FRONTEND_PORT -sTCP:LISTEN -t | head -n1)

backend_pid=$(lsof -nP -iTCP:$BACKEND_PORT -sTCP:LISTEN -t | head -n1)

ps -p "$frontend_pid" -o pid=,ppid=,stat=,cwd=,command=

ps -p "$backend_pid" -o pid=,ppid=,stat=,cwd=,command=

curl -I --max-time 5 http://127.0.0.1:$FRONTEND_PORT/

curl -sS --max-time 5 http://127.0.0.1:$BACKEND_PORT/api/health

```

如果要停止进程，只能先确认 `cwd` 和 `command` 都属于 `PROJECT_DIR`，再只杀当前 PID：

```sh

pid=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t | head -n1)

cwd=$(ps -o cwd= -p "$pid" | xargs)

cmd=$(ps -o command= -p "$pid")

case "$cwd" in

"$PROJECT_DIR"/*) kill "$pid" ;;

*) echo "skip kill: cwd=$cwd cmd=$cmd" ;;

esac

```

如果浏览器能打开首页但控制台出现 `SyntaxError`、`import`/`export` 不匹配、`Uncaught`，或者后端 `curl` 返回 500，仍然算失败，不要只看日志里的 `ready`
