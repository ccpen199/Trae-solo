from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import get_db
from app.models import User, RoleType
from app.services import UserService
from app.routers.auth import get_current_active_user

router = APIRouter(prefix="/users", tags=["用户"])


@router.get("/organizations")
async def list_organizations(
    org_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    
    if org_type:
        orgs = user_service.get_organizations_by_type(org_type)
    else:
        orgs = user_service.get_organizations_by_type("supplier")
        orgs += user_service.get_organizations_by_type("core_enterprise")
        orgs += user_service.get_organizations_by_type("financial_institution")
    
    return {
        "success": True,
        "data": [user_service.org_to_dict(org) for org in orgs]
    }


@router.get("/by-role")
async def list_users_by_role(
    role: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    users = user_service.get_users_by_role(role)
    
    return {
        "success": True,
        "data": [user_service.user_to_dict(u) for u in users]
    }


@router.get("/messages")
async def get_user_messages(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    messages = user_service.get_user_messages(current_user, status, limit)
    
    return {
        "success": True,
        "data": messages
    }


@router.get("/messages/pending-count")
async def get_pending_message_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    count = user_service.get_pending_message_count(current_user)
    
    return {
        "success": True,
        "data": {"count": count}
    }


@router.post("/messages/{message_id}/read")
async def mark_message_read(
    message_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    message = user_service.mark_message_read(message_id, current_user)
    
    if not message:
        raise HTTPException(status_code=404, detail="消息不存在")
    
    return {
        "success": True,
        "data": user_service._message_to_dict(message)
    }


@router.post("/messages/{message_id}/processed")
async def mark_message_processed(
    message_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    message = user_service.mark_message_processed(message_id, current_user)
    
    if not message:
        raise HTTPException(status_code=404, detail="消息不存在")
    
    return {
        "success": True,
        "data": user_service._message_to_dict(message)
    }


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_service = UserService(db)
    user = user_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    return {
        "success": True,
        "data": user_service.user_to_dict(user)
    }
