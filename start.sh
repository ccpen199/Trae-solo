
cd /Users/chen/Documents/trae_projects/local_projects/may-987/backend
nohup node src/server.js > backend.log 2>&1 &
echo "Backend started on port 9871"
sleep 2
cd /Users/chen/Documents/trae_projects/local_projects/may-987/frontend
nohup npx vite > frontend.log 2>&1 &
echo "Frontend started on port 9872"
sleep 2
echo "=== Service Status ==="
lsof -i :9871 -i :9872 -P 2>/dev/null
