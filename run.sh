#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "========================================"
echo " 宁夏城市服务总入口后端系统 - 启动脚本"
echo "========================================"
echo ""

case "${1:-dev}" in
  dev)
    echo "[模式] 开发模式启动"
    echo ""
    if [ ! -d node_modules ]; then
      echo "[步骤1] 安装依赖..."
      npm install
    else
      echo "[步骤1] 依赖已安装，跳过"
    fi
    if [ ! -f .env ]; then
      echo "[步骤2] 从.env.example创建.env..."
      cp .env.example .env
    else
      echo "[步骤2] .env已存在，跳过"
    fi
    echo "[步骤3] 启动开发服务器 (nest start --watch)"
    echo ""
    npm run start:dev
    ;;

  build)
    echo "[模式] 生产构建"
    echo ""
    echo "[步骤1] 安装依赖..."
    npm install --include=dev
    echo "[步骤2] 编译TypeScript..."
    npm run build
    echo "[步骤3] 构建完成！输出目录: dist/"
    echo ""
    echo "运行生产模式: ./run.sh start"
    ;;

  start)
    echo "[模式] 生产模式启动"
    echo ""
    if [ ! -d dist ]; then
      echo "dist目录不存在，先执行构建..."
      npm run build
    fi
    echo "[启动] node dist/main.js"
    echo ""
    export NODE_ENV=production
    node dist/main.js
    ;;

  init-data)
    echo "[模式] 初始化数据库数据"
    echo ""
    if [ ! -d node_modules ]; then
      echo "[步骤1] 安装依赖..."
      npm install
    fi
    echo "[步骤2] 运行初始化脚本..."
    echo ""
    npx ts-node -r tsconfig-paths/register scripts/init-data.ts
    ;;

  migration-run)
    echo "[模式] 运行数据库迁移"
    echo ""
    npm run migration:run
    ;;

  migration-generate)
    echo "[模式] 生成迁移文件 (名称: ${2:-Migration})"
    echo ""
    npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js \
      migration:generate src/database/migrations/${2:-Migration} \
      -d src/database/data-source.ts
    ;;

  test)
    echo "[模式] 运行单元测试"
    echo ""
    npm run test
    ;;

  lint)
    echo "[模式] 代码检查"
    echo ""
    npm run lint
    ;;

  clean)
    echo "[模式] 清理构建产物"
    echo ""
    rm -rf dist node_modules
    echo "已清理: dist/, node_modules/"
    ;;

  status)
    echo "[模式] 检查服务状态"
    echo ""
    PORT="${PORT:-3000}"
    if lsof -i :$PORT >/dev/null 2>&1; then
      PID=$(lsof -ti :$PORT | head -1)
      CWD=$(ps -p $PID -o cwd= 2>/dev/null || echo "unknown")
      CMDLINE=$(ps -p $PID -o command= 2>/dev/null || echo "unknown")
      if echo "$CWD" | grep -q "$PROJECT_DIR" || echo "$CMDLINE" | grep -q "nx-city-service"; then
        echo "✅ 服务正在运行 (PID: $PID, 端口: $PORT)"
        echo "   CWD: $CWD"
        echo "   CMD: $CMDLINE"
      else
        echo "⚠️  端口 $PORT 被占用 (PID: $PID)，但非本项目进程"
        echo "   CWD: $CWD"
        echo "   CMD: $CMDLINE"
      fi
    else
      echo "❌ 服务未运行 (端口 $PORT 空闲)"
    fi
    ;;

  stop)
    echo "[模式] 停止本项目服务"
    echo ""
    PORT="${PORT:-3000}"
    if lsof -i :$PORT >/dev/null 2>&1; then
      PIDS=$(lsof -ti :$PORT)
      for PID in $PIDS; do
        CWD=$(ps -p $PID -o cwd= 2>/dev/null || echo "")
        CMDLINE=$(ps -p $PID -o command= 2>/dev/null || echo "")
        if echo "$CWD" | grep -q "$PROJECT_DIR" || echo "$CMDLINE" | grep -q "nx-city-service\|nest start\|dist/main.js"; then
          echo "终止进程 PID=$PID (属于本项目)"
          kill -TERM $PID 2>/dev/null || true
          sleep 1
          if kill -0 $PID 2>/dev/null; then
            kill -KILL $PID 2>/dev/null || true
          fi
        else
          echo "⚠️  端口 $PORT 进程 PID=$PID 不属于本项目，跳过"
          echo "   CWD: $CWD"
        fi
      done
      echo "完成"
    else
      echo "端口 $PORT 没有本项目服务在运行"
    fi
    ;;

  restart)
    echo "[模式] 重启服务 (开发模式)"
    echo ""
    $0 stop
    sleep 2
    $0 dev
    ;;

  logs)
    echo "[模式] 查看日志 (Ctrl+C 退出)"
    echo ""
    LOG_DIR="${LOG_DIR:-./logs}"
    mkdir -p "$LOG_DIR"
    if [ -f "$LOG_DIR/app-$(date +%Y-%m-%d).log" ]; then
      tail -f "$LOG_DIR/app-$(date +%Y-%m-%d).log"
    else
      echo "今日日志文件不存在，监听error.log..."
      tail -f "$LOG_DIR/error.log" 2>/dev/null || (echo "日志目录为空"; ls -la "$LOG_DIR")
    fi
    ;;

  doctor)
    echo "[模式] 环境自检"
    echo ""
    echo "[Node]"
    node --version
    echo "[NPM]"
    npm --version
    echo "[PostgreSQL 连接]"
    if command -v psql >/dev/null 2>&1; then
      echo "  psql CLI: 已安装"
    else
      echo "  psql CLI: 未安装 (生产环境通常不需要，只需要TCP可达)"
    fi
    echo "[Redis 连接]"
    if command -v redis-cli >/dev/null 2>&1; then
      echo "  redis-cli CLI: 已安装"
    else
      echo "  redis-cli CLI: 未安装 (生产环境通常不需要，只需要TCP可达)"
    fi
    echo "[端口 $PORT]"
    if lsof -i :${PORT:-3000} >/dev/null 2>&1; then
      echo "  端口 ${PORT:-3000}: 被占用"
    else
      echo "  端口 ${PORT:-3000}: 可用"
    fi
    echo "[目录权限]"
    for dir in logs uploads; do
      mkdir -p "$dir" 2>/dev/null
      if [ -w "$dir" ]; then
        echo "  $dir/: 可写"
      else
        echo "  $dir/: 不可写 ⚠️"
      fi
    done
    ;;

  help|-h|--help)
    cat <<EOF
用法: $0 [命令] [参数]

命令:
  dev                 开发模式启动 (默认)
  build               生产构建
  start               生产模式启动 (需先 build)
  stop                停止本项目服务 (仅终止归属本项目的进程)
  restart             重启 (开发模式)
  status              检查服务状态
  logs                查看日志
  init-data           初始化数据库数据
  migration-run       执行数据库迁移
  migration-generate 生成迁移文件
  test                运行单元测试
  lint                代码检查
  clean               清理构建产物
  doctor              环境自检
  help                显示此帮助

示例:
  $0 dev
  $0 build && $0 start
  $0 init-data
  $0 migration-generate AddUserTable
  $0 status
  $0 logs
EOF
    ;;

  *)
    echo "未知命令: $1"
    echo ""
    $0 help
    exit 1
    ;;
esac
