from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from app.api import api_router

load_dotenv()

app = FastAPI(title="Hiyou 电影服务 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:45853"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Hiyou 电影服务 API", "version": "1.0"}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 44853))
    uvicorn.run(app, host="0.0.0.0", port=port)
