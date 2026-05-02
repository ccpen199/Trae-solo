from app.routers.auth import router as auth_router
from app.routers.tasks import router as tasks_router
from app.routers.workers import router as workers_router
from app.routers.experts import router as experts_router
from app.routers.admin import router as admin_router
from app.routers.statistics import router as statistics_router

__all__ = [
    "auth_router",
    "tasks_router",
    "workers_router",
    "experts_router",
    "admin_router",
    "statistics_router"
]
