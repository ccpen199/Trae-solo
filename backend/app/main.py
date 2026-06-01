from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import auth, categories, news, comments, users

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Campus News API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(categories.router, prefix=settings.API_V1_STR)
app.include_router(news.router, prefix=settings.API_V1_STR)
app.include_router(comments.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {"message": "Campus News API", "version": "1.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.BACKEND_PORT)
