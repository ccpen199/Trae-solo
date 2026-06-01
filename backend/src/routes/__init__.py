from .auth import router as auth_router
from .bill import router as bill_router
from .message import router as message_router
from .wealth import router as wealth_router
from .loan import router as loan_router
from .user import router as user_router
from .admin import router as admin_router

__all__ = [
    "auth_router",
    "bill_router",
    "message_router",
    "wealth_router",
    "loan_router",
    "user_router",
    "admin_router"
]
