from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models import (
    User, UserRole, TaskUnit, TaskStatus,
    SettlementRecord, Transaction, Wallet
)
from app.schemas import StatisticsResponse
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/statistics", tags=["统计"])


@router.get("/overview", response_model=StatisticsResponse)
def get_statistics_overview(
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.PUBLISHER)),
    db: Session = Depends(get_db)
):
    """
    获取统计概览
    """
    total_tasks = db.query(func.count(TaskUnit.id)).scalar() or 0

    pending_tasks = db.query(func.count(TaskUnit.id)).filter(
        TaskUnit.status == TaskStatus.PENDING
    ).scalar() or 0

    in_progress_tasks = db.query(func.count(TaskUnit.id)).filter(
        TaskUnit.status == TaskStatus.IN_PROGRESS
    ).scalar() or 0

    completed_tasks = db.query(func.count(TaskUnit.id)).filter(
        TaskUnit.status.in_([
            TaskStatus.QUALIFIED,
            TaskStatus.SETTLED,
            TaskStatus.DISQUALIFIED
        ])
    ).scalar() or 0

    settled_tasks = db.query(func.count(TaskUnit.id)).filter(
        TaskUnit.status == TaskStatus.SETTLED
    ).scalar() or 0

    total_reward = db.query(func.sum(TaskUnit.reward)).scalar() or 0.0

    total_settled = db.query(func.sum(SettlementRecord.amount)).scalar() or 0.0

    total_users = db.query(func.count(User.id)).scalar() or 0

    total_workers = db.query(func.count(User.id)).filter(
        User.role == UserRole.WORKER
    ).scalar() or 0

    total_experts = db.query(func.count(User.id)).filter(
        User.role == UserRole.EXPERT
    ).scalar() or 0

    return StatisticsResponse(
        total_tasks=total_tasks,
        pending_tasks=pending_tasks,
        in_progress_tasks=in_progress_tasks,
        completed_tasks=completed_tasks,
        settled_tasks=settled_tasks,
        total_reward=total_reward,
        total_settled=total_settled,
        total_users=total_users,
        total_workers=total_workers,
        total_experts=total_experts
    )


@router.get("/tasks-by-status")
def get_tasks_by_status(
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.PUBLISHER)),
    db: Session = Depends(get_db)
):
    """
    按状态统计任务数量
    """
    results = db.query(
        TaskUnit.status,
        func.count(TaskUnit.id).label("count")
    ).group_by(TaskUnit.status).all()

    return [
        {"status": r.status.value, "count": r.count}
        for r in results
    ]


@router.get("/daily-tasks")
def get_daily_tasks(
    days: int = 7,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.PUBLISHER)),
    db: Session = Depends(get_db)
):
    """
    获取每日任务统计
    """
    from sqlalchemy import Date, cast

    start_date = datetime.utcnow() - timedelta(days=days)

    results = db.query(
        cast(TaskUnit.created_at, Date).label("date"),
        func.count(TaskUnit.id).label("created_count")
    ).filter(
        TaskUnit.created_at >= start_date
    ).group_by(
        cast(TaskUnit.created_at, Date)
    ).order_by(
        cast(TaskUnit.created_at, Date)
    ).all()

    settled_results = db.query(
        cast(SettlementRecord.settled_at, Date).label("date"),
        func.count(SettlementRecord.id).label("settled_count"),
        func.sum(SettlementRecord.amount).label("settled_amount")
    ).filter(
        SettlementRecord.settled_at >= start_date
    ).group_by(
        cast(SettlementRecord.settled_at, Date)
    ).order_by(
        cast(SettlementRecord.settled_at, Date)
    ).all()

    settled_map = {
        str(r.date): {"count": r.settled_count, "amount": r.settled_amount}
        for r in settled_results
    }

    daily_stats = []
    for r in results:
        date_str = str(r.date)
        settled = settled_map.get(date_str, {"count": 0, "amount": 0.0})
        daily_stats.append({
            "date": date_str,
            "created_count": r.created_count,
            "settled_count": settled["count"],
            "settled_amount": settled["amount"] or 0.0
        })

    return daily_stats


@router.get("/top-workers")
def get_top_workers(
    limit: int = 10,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """
    获取Top接单员统计
    """
    results = db.query(
        User.id,
        User.username,
        User.real_name,
        User.level,
        func.count(SettlementRecord.id).label("settlement_count"),
        func.sum(SettlementRecord.amount).label("total_earnings")
    ).join(
        SettlementRecord, User.id == SettlementRecord.worker_id
    ).group_by(
        User.id
    ).order_by(
        func.sum(SettlementRecord.amount).desc()
    ).limit(limit).all()

    return [
        {
            "user_id": r.id,
            "username": r.username,
            "real_name": r.real_name,
            "level": r.level,
            "settlement_count": r.settlement_count,
            "total_earnings": r.total_earnings or 0.0
        }
        for r in results
    ]


@router.get("/worker-stats/{worker_id}")
def get_worker_stats(
    worker_id: int,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.WORKER)),
    db: Session = Depends(get_db)
):
    """
    获取接单员个人统计
    """
    if current_user.role == UserRole.WORKER and current_user.id != worker_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权查看其他用户的统计"
        )

    worker = db.query(User).filter(User.id == worker_id).first()
    if not worker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    from app.models import TaskAssignment

    total_tasks = db.query(func.count(TaskAssignment.id)).filter(
        TaskAssignment.worker_id == worker_id
    ).scalar() or 0

    wallet = db.query(Wallet).filter(Wallet.user_id == worker_id).first()

    total_earnings = db.query(func.sum(SettlementRecord.amount)).filter(
        SettlementRecord.worker_id == worker_id
    ).scalar() or 0.0

    settlement_count = db.query(func.count(SettlementRecord.id)).filter(
        SettlementRecord.worker_id == worker_id
    ).scalar() or 0

    return {
        "worker_id": worker_id,
        "username": worker.username,
        "level": worker.level,
        "total_tasks": total_tasks,
        "settlement_count": settlement_count,
        "total_earnings": total_earnings,
        "wallet_balance": wallet.balance if wallet else 0.0
    }
