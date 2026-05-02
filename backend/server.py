import sys
sys.path.insert(0, '.')

from main import app
import uvicorn

if __name__ == "__main__":
    print("Backend starting on http://127.0.0.1:51120")
    uvicorn.run(app, host="127.0.0.1", port=51120, log_level="info")
