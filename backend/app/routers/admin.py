from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date

from app.database import get_db
from app.models import (
    User, UserRole, TaskUnit, TaskStatus,
    Appeal, AppealStatus, AuditLog, OperationTrace,
    AntiCheatingRecord, SettlementRecord
)
from app.schemas import (
    AppealResponse, AppealResolve, AuditLogResponse,
    OperationTraceResponse, AntiCheatingResponse, SettlementResponse,
    UserResponse
)
from app.auth import get_current_user, require_roles, create_audit_log
from app.engines import AuditWorkflowEngine, SmartSettlementEngine, AntiCheatingEngine

router = APIRouter(prefix="/admin", tags=["管理员"])


@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    role: Optional[UserRole] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    获取所有用户列表
    """
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()


@router.put("/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: int,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    启用/禁用用户
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    if user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无法操作管理员账户"
        )

    user.is_active = not user.is_active
    db.commit()

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="user_status_toggled",
        resource="user",
        resource_id=user.id,
        details=f"切换用户状态: {user.username}, 新状态: {'启用' if user.is_active else '禁用'}",
        ip_address=request.client.host if request.client else None
    )

    return {
        "success": True,
        "user_id": user.id,
        "is_active": user.is_active
    }


@router.get("/appeals/pending", response_model=List[AppealResponse])
def get_pending_appeals(
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    获取待处理申诉列表
    """
    engine = AuditWorkflowEngine(db)
    return engine.get_pending_appeals()


@router.post("/appeals/{appeal_id}/resolve", response_model=AppealResponse)
def resolve_appeal(
    appeal_id: int,
    resolve_data: AppealResolve,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    处理申诉（终审）
    """
    engine = AuditWorkflowEngine(db)
    success, message = engine.resolve_appeal(
        admin_id=current_user.id,
        appeal_id=appeal_id,
        status=resolve_data.status,
        comments=resolve_data.comments
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    appeal = db.query(Appeal).filter(Appeal.id == appeal_id).first()

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="appeal_resolved",
        resource="appeal",
        resource_id=appeal_id,
        details=f"处理申诉: {appeal_id}, 结果: {resolve_data.status.value}",
        ip_address=request.client.host if request.client else None
    )

    return appeal


@router.post("/tasks/sample-review")
def sample_and_assign_reviews(
    request: Request,
    sampling_rate: float = 0.3,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    抽样并分配专家审核
    """
    engine = AuditWorkflowEngine(db)
    count, task_ids = engine.sample_and_assign_experts(
        sampling_rate=sampling_rate
    )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="review_sampling",
        resource="task_unit",
        details=f"抽样审核: 抽样率 {sampling_rate}, 已分配 {count} 个任务",
        ip_address=request.client.host if request.client else None
    )

    return {
        "success": True,
        "sampled_count": count,
        "task_ids": task_ids
    }


@router.post("/tasks/settle-qualified")
def settle_qualified_tasks(
    request: Request,
    limit: int = 100,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    批量结算合格任务
    """
    engine = SmartSettlementEngine(db)
    success_count, errors = engine.batch_settle_qualified_tasks(limit=limit)

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="batch_settlement",
        resource="settlement",
        details=f"批量结算: 成功 {success_count} 个任务",
        ip_address=request.client.host if request.client else None
    )

    return {
        "success": True,
        "settled_count": success_count,
        "errors": errors
    }


@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    获取审计日志
    """
    query = db.query(AuditLog)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    return query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/tasks/{task_id}/traces", response_model=List[OperationTraceResponse])
def get_task_traces(
    task_id: int,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    获取任务全轨迹快照
    """
    engine = AuditWorkflowEngine(db)
    return engine.get_task_traces(task_unit_id=task_id)


@router.get("/flagged-tasks", response_model=List[AntiCheatingResponse])
def get_flagged_tasks(
    limit: int = 100,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    获取被标记为作弊风险的任务
    """
    return db.query(AntiCheatingRecord).filter(
        AntiCheatingRecord.is_flagged == True
    ).order_by(AntiCheatingRecord.checked_at.desc()).limit(limit).all()


@router.post("/flagged-tasks/{task_id}/validate")
def validate_flagged_task(
    task_id: int,
    is_valid: bool,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    验证被标记的任务
    """
    engine = AntiCheatingEngine(db)
    success, message = engine.validate_after_review(
        task_unit_id=task_id,
        is_valid=is_valid
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="flagged_task_validated",
        resource="task_unit",
        resource_id=task_id,
        details=f"验证标记任务: {task_id}, 结果: {'有效' if is_valid else '无效'}",
        ip_address=request.client.host if request.client else None
    )

    return {
        "success": True,
        "task_id": task_id,
        "is_valid": is_valid
    }


@router.get("/financial-report")
def get_financial_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    获取财务报表
    """
    engine = SmartSettlementEngine(db)

    start_dt = None
    end_dt = None
    if start_date:
        start_dt = datetime.fromisoformat(start_date)
    if end_date:
        end_dt = datetime.fromisoformat(end_date)

    return engine.generate_financial_report(
        start_date=start_dt,
        end_date=end_dt
    )


@router.get("/settlements", response_model=List[SettlementResponse])
def get_settlements(
    worker_id: Optional[int] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    获取结算记录列表
    """
    query = db.query(SettlementRecord)
    if worker_id:
        query = query.filter(SettlementRecord.worker_id == worker_id)
    return query.order_by(SettlementRecord.settled_at.desc()).offset(offset).limit(limit).all()
