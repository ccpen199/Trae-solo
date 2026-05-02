import uvicorn
from main import app

if __name__ == "__main__":
    print("Starting supply chain finance platform backend...")
    print(f"Port: 111201")
    uvicorn.run(app, host="127.0.0.1", port=111201)
