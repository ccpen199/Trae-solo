import multiprocessing
import time
import requests

def run_server():
    import uvicorn
    from main import app
    uvicorn.run(app, host="127.0.0.1", port=111201, log_level="warning")

if __name__ == "__main__":
    server_process = multiprocessing.Process(target=run_server)
    server_process.daemon = True
    server_process.start()
    
    print("Starting backend server...")
    time.sleep(3)
    
    try:
        response = requests.get("http://127.0.0.1:111201/health")
        print(f"Health check: {response.status_code} - {response.json()}")
        
        response = requests.get("http://127.0.0.1:111201/api/auth/login?username=supplier&password=123456")
        print(f"Login test: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Token received: {len(data.get('access_token',''))} chars")
            print(f"User: {data.get('user', {}).get('name')}")
        
        print("\nBackend is running at: http://127.0.0.1:111201")
        print("Press Ctrl+C to stop...")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping server...")
    except Exception as e:
        print(f"Error: {e}")
