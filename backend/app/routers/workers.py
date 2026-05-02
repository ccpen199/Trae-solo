from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import User, UserRole, TaskStatus, Wallet, Transaction
from app.schemas import (
    TaskUnitResponse, WalletResponse, TransactionResponse,
    AppealCreate, AppealResponse
)
from app.auth import get_current_user, require_roles, create_audit_log
from app.engines import TaskDistributionEngine, SmartSettlementEngine, AuditWorkflowEngine

router = APIRouter(prefix="/workers", tags=["接单员"])


@router.get("/tasks/available", response_model=List[TaskUnitResponse])
def get_available_tasks(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(require_roles(UserRole.WORKER)),
    db: Session = Depends(get_db)
):
    """
    获取可领取任务列表
    """
    engine = TaskDistributionEngine(db)
    tasks = engine.get_available_tasks(
        worker_id=current_user.id,
        limit=limit,
        offset=offset
    )
    return tasks


@router.post("/tasks/{task_id}/assign")
def assign_task(
    task_id: int,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.WORKER)),
    db: Session = Depends(get_db)
):
    """
    领取任务
    """
    engine = TaskDistributionEngine(db)
    success, message = engine.assign_task(
        worker_id=current_user.id,
        task_unit_id=task_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="task_assigned",
        resource="task_unit",
        resource_id=task_id,
        details=f"领取任务: {task_id}",
        ip_address=request.client.host if request.client else None
    )

    return {"success": True, "message": message}


@router.post("/tasks/{task_id}/release")
def release_task(
    task_id: int,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.WORKER)),
    db: Session = Depends(get_db)
):
    """
    释放任务（放弃领取）
    """
    engine = TaskDistributionEngine(db)
    success, message = engine.release_task(
        worker_id=current_user.id,
        task_unit_id=task_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="task_released",
        resource="task_unit",
        resource_id=task_id,
        details=f"释放任务: {task_id}",
        ip_address=request.client.host if request.client else None
    )

    return {"success": True, "message": message}


@router.get("/tasks/assigned", response_model=List[TaskUnitResponse])
def get_assigned_tasks(
    status: Optional[TaskStatus] = None,
    current_user: User = Depends(require_roles(UserRole.WORKER)),
    db: Session = Depends(get_db)
):
    """
    获取已领取的任务列表
    """
    engine = TaskDistributionEngine(db)
    tasks = engine.get_assigned_tasks(
        worker_id=current_user.id,
        status=status
    )
    return tasks


@router.get("/wallet", response_model=WalletResponse)
def get_wallet(
    current_user: User = Depends(require_roles(UserRole.WORKER)),
    db: Session = Depends(get_db)
):
    """
    获取钱包信息
    """
    engine = SmartSettlementEngine(db)
    wallet = engine.get_worker_wallet(worker_id=current_user.id)
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="钱包不存在"
        )
    return wallet


@router.get("/transactions", response_model=List[TransactionResponse])
def get_transactions(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(require_roles(UserRole.WORKER)),
    db: Session = Depends(get_db)
):
    """
    获取交易历史
    """
    engine = SmartSettlementEngine(db)
    transactions = engine.get_transaction_history(
        worker_id=current_user.id,
        limit=limit,
        offset=offset
    )
    return transactions


@router.post("/appeals", response_model=AppealResponse)
def submit_appeal(
    appeal_data: AppealCreate,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.WORKER)),
    db: Session = Depends(get_db)
):
    """
    提交申诉
    """
    engine = AuditWorkflowEngine(db)
    success, message, appeal = engine.submit_appeal(
        requester_id=current_user.id,
        task_unit_id=appeal_data.task_unit_id,
        reason=appeal_data.reason,
        evidence=appeal_data.evidence
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="appeal_submitted",
        resource="appeal",
        resource_id=appeal.id if appeal else None,
        details=f"提交申诉: 任务ID {appeal_data.task_unit_id}",
        ip_address=request.client.host if request.client else None
    )

    return appeal
