from app.routers.batch import router as batch_router
from app.routers.farming import router as farming_router
from app.routers.quality import router as quality_router
from app.routers.flow import router as flow_router
from app.routers.consumer import router as consumer_router
from app.routers.recall import router as recall_router
from app.routers.compensation import router as compensation_router
from app.routers.acceptance import router as acceptance_router
from app.routers.health import router as health_router

__all__ = [
    "batch_router",
    "farming_router",
    "quality_router",
    "flow_router",
    "consumer_router",
    "recall_router",
    "compensation_router",
    "acceptance_router",
    "health_router",
]
