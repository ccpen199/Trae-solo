from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from fastapi import Depends, APIRouter, Query
from sqlalchemy.orm import Session
from app.database import get_db, User, AuditLog, Notification
from app.routers.auth import get_current_user, get_current_admin_user
from app.services.audit_service import audit_service, notification_service, report_service

router = APIRouter(prefix="/api/common", tags=["通用接口"])


@router.get("/audit/timeline")
def get_audit_timeline(
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    action: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    start_dt = None
    if start_time:
        start_dt = datetime.fromisoformat(start_time)
    
    end_dt = None
    if end_time:
        end_dt = datetime.fromisoformat(end_time)
    
    user_id = None if current_user.role == "admin" else current_user.id
    
    logs, total = audit_service.query(
        db,
        user_id=user_id,
        resource_type=resource_type,
        resource_id=resource_id,
        action=action,
        start_time=start_dt,
        end_time=end_dt,
        limit=page_size,
        offset=(page - 1) * page_size
    )
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "data": [{
            "id": log.id,
            "action": log.action,
            "action_display": audit_service._get_action_display(log.action),
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        } for log in logs]
    }


@router.get("/notifications")
def get_notifications(
    is_read: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifications, total = notification_service.get_user_notifications(
        db,
        user_id=current_user.id,
        is_read=is_read,
        limit=page_size,
        offset=(page - 1) * page_size
    )
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "data": [{
            "id": n.id,
            "title": n.title,
            "content": n.content,
            "notification_type": n.notification_type,
            "resource_type": n.resource_type,
            "resource_id": n.resource_id,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        } for n in notifications]
    }


@router.get("/notifications/unread-count")
def get_unread_notification_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = notification_service.get_unread_count(db, current_user.id)
    return {"count": count}


@router.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notification = notification_service.mark_read(db, notification_id, current_user.id)
    if not notification:
        return {"message": "通知不存在或无权限"}
    return {"message": "已标记为已读", "id": notification_id}


@router.post("/notifications/mark-all-read")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = notification_service.mark_all_read(db, current_user.id)
    return {"message": f"已标记 {count} 条通知为已读", "count": count}


@router.get("/dashboard/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.database import FormDefinition, FormSubmission
    
    stats = {}
    
    if current_user.role == "admin":
        stats["total_forms"] = db.query(FormDefinition).count()
        stats["published_forms"] = db.query(FormDefinition).filter(
            FormDefinition.status == "published"
        ).count()
        stats["total_submissions"] = db.query(FormSubmission).count()
        stats["pending_submissions"] = db.query(FormSubmission).filter(
            FormSubmission.status == "submitted"
        ).count()
    else:
        stats["my_forms"] = db.query(FormDefinition).filter(
            FormDefinition.creator_id == current_user.id
        ).count()
        stats["my_published_forms"] = db.query(FormDefinition).filter(
            FormDefinition.creator_id == current_user.id,
            FormDefinition.status == "published"
        ).count()
        stats["my_submissions"] = db.query(FormSubmission).filter(
            FormSubmission.user_id == current_user.id
        ).count()
    
    stats["unread_notifications"] = notification_service.get_unread_count(
        db, current_user.id
    )
    
    return stats


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/users")
def list_users(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()
    return [{
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "role": u.role,
        "is_active": u.is_active,
        "created_at": u.created_at.isoformat() if u.created_at else None
    } for u in users]
