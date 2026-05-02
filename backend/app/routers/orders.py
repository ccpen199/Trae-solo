from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date

from app import get_db
from app.models import User, MainOrder, OrderStatus, ActionType, OrderDetail
from app.services import OrderService, UserService
from app.state_machine import StateMachine
from app.routers.auth import get_current_active_user

router = APIRouter(prefix="/orders", tags=["订单"])


class OrderCreateRequest(BaseModel):
    total_amount: float
    expected_completion_date: str
    core_enterprise_id: Optional[str] = None
    financial_institution_id: Optional[str] = None
    description: Optional[str] = None
    attachments: Optional[str] = None
    priority: int = 0
    details: Optional[List[dict]] = None
    trade_order: Optional[dict] = None


class OrderActionRequest(BaseModel):
    action: str
    comment: Optional[str] = None
    rejection_reason: Optional[str] = None
    supplement_request: Optional[str] = None
    assigned_to: Optional[str] = None
    credit_score: Optional[int] = 60
    amount: Optional[float] = None
    principal_amount: Optional[float] = None
    interest_amount: Optional[float] = 0
    penalty_amount: Optional[float] = 0
    reason: Optional[str] = None


def order_to_dict(order: MainOrder) -> dict:
    result = {
        "id": order.id,
        "order_no": order.order_no,
        "status": order.status.value if order.status else None,
        "supplier_id": order.supplier_id,
        "core_enterprise_id": order.core_enterprise_id,
        "financial_institution_id": order.financial_institution_id,
        "receivable_id": order.receivable_id,
        "trade_order_id": order.trade_order_id,
        "confirmation_id": order.confirmation_id,
        "credit_id": order.credit_id,
        "loan_id": order.loan_id,
        "repayment_id": order.repayment_id,
        "total_amount": float(order.total_amount) if order.total_amount else 0,
        "expected_completion_date": order.expected_completion_date.isoformat() if order.expected_completion_date else None,
        "priority": order.priority,
        "creator_id": order.creator_id,
        "assignee_id": order.assignee_id,
        "is_locked": order.is_locked,
        "locked_by": order.locked_by,
        "locked_at": order.locked_at.isoformat() if order.locked_at else None,
        "lock_reason": order.lock_reason,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None,
        "completed_at": order.completed_at.isoformat() if order.completed_at else None,
    }
    
    if order.supplier_org:
        result["supplier_org"] = {
            "id": order.supplier_org.id,
            "name": order.supplier_org.name
        }
    
    if order.core_org:
        result["core_org"] = {
            "id": order.core_org.id,
            "name": order.core_org.name
        }
    
    if order.creator:
        result["creator"] = {
            "id": order.creator.id,
            "name": order.creator.name
        }
    
    if order.assignee:
        result["assignee"] = {
            "id": order.assignee.id,
            "name": order.assignee.name
        }
    
    if order.details:
        result["details"] = [
            {
                "id": d.id,
                "item_name": d.item_name,
                "item_code": d.item_code,
                "quantity": float(d.quantity) if d.quantity else 0,
                "unit_price": float(d.unit_price) if d.unit_price else 0,
                "amount": float(d.amount) if d.amount else 0,
                "unit": d.unit,
                "description": d.description
            }
            for d in order.details
        ]
    
    if order.audit_logs:
        result["audit_logs"] = [
            {
                "id": log.id,
                "action": log.action.value if log.action else None,
                "module": log.module,
                "from_status": log.from_status,
                "to_status": log.to_status,
                "message": log.message,
                "detail": log.detail,
                "user": {
                    "id": log.user.id,
                    "name": log.user.name
                } if log.user else None,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            for log in sorted(order.audit_logs, key=lambda x: x.created_at)
        ]
    
    return result


@router.post("")
async def create_order(
    request: OrderCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        order_service = OrderService(db)
        
        data = request.model_dump()
        
        order, details = order_service.create_asset_registration(data, current_user)
        
        return {
            "success": True,
            "data": order_to_dict(order)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/submit")
async def submit_order(
    order_id: str,
    comment: Optional[str] = Body(None, embed=True),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    order = db.query(MainOrder).filter(MainOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    order_service = OrderService(db)
    try:
        order = order_service.submit_asset_registration(order, current_user, comment)
        return {
            "success": True,
            "data": order_to_dict(order)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/action")
async def execute_action(
    order_id: str,
    request: OrderActionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    order = db.query(MainOrder).filter(MainOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    order_service = OrderService(db)
    state_machine = StateMachine(db)
    
    try:
        action = request.action
        
        if action == "approve":
            if order.status == OrderStatus.PENDING_CONFIRMATION:
                order = order_service.confirm_order(
                    order, current_user, "approve",
                    comment=request.comment
                )
            elif order.status == OrderStatus.PENDING_RISK_ASSESSMENT:
                order = order_service.risk_assessment(
                    order, current_user, "approve",
                    data={
                        "credit_score": request.credit_score,
                        "comment": request.comment
                    }
                )
        
        elif action == "return":
            if order.status == OrderStatus.PENDING_CONFIRMATION:
                order = order_service.confirm_order(
                    order, current_user, "return",
                    rejection_reason=request.rejection_reason
                )
            elif order.status == OrderStatus.PENDING_LOAN:
                raise HTTPException(status_code=400, detail="放款阶段退回功能暂未实现")
        
        elif action == "reject":
            if order.status == OrderStatus.PENDING_CONFIRMATION:
                order = order_service.confirm_order(
                    order, current_user, "reject",
                    rejection_reason=request.rejection_reason
                )
            elif order.status == OrderStatus.PENDING_RISK_ASSESSMENT:
                order = order_service.risk_assessment(
                    order, current_user, "reject",
                    data={
                        "credit_score": request.credit_score,
                        "rejection_reason": request.rejection_reason,
                        "comment": request.comment
                    }
                )
        
        elif action == "supplement":
            order = order_service.risk_assessment(
                order, current_user, "supplement",
                data={
                    "credit_score": request.credit_score,
                    "supplement_request": request.supplement_request,
                    "comment": request.comment
                }
            )
        
        elif action == "reassign":
            order = order_service.risk_assessment(
                order, current_user, "reassign",
                data={
                    "assigned_to": request.assigned_to,
                    "comment": request.comment
                }
            )
        
        elif action == "loan":
            order = order_service.disburse_loan(
                order, current_user,
                data={
                    "amount": request.amount or float(order.total_amount),
                    "comment": request.comment
                }
            )
        
        elif action == "repay":
            order = order_service.process_repayment(
                order, current_user,
                data={
                    "principal_amount": request.principal_amount or float(order.total_amount),
                    "interest_amount": request.interest_amount or 0,
                    "penalty_amount": request.penalty_amount or 0,
                    "comment": request.comment
                }
            )
        
        elif action == "lock":
            order = order_service.lock_order(order, current_user, request.reason)
        
        elif action == "unlock":
            order = order_service.unlock_order(order, current_user)
        
        elif action == "retry":
            order = order_service.retry_order(order, current_user, request.comment)
        
        elif action == "close":
            order = order_service.close_order(order, current_user, request.comment)
        
        elif action == "cancel":
            order = order_service.cancel_order(order, current_user, request.comment)
        
        else:
            raise HTTPException(status_code=400, detail=f"未知操作: {action}")
        
        return {
            "success": True,
            "data": order_to_dict(order)
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
async def list_orders(
    status: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    order_service = OrderService(db)
    orders = order_service.get_orders_for_user(
        current_user, status=status, limit=limit, offset=offset
    )
    
    return {
        "success": True,
        "data": [order_to_dict(order) for order in orders],
        "total": len(orders),
        "limit": limit,
        "offset": offset
    }


@router.get("/counts")
async def get_order_counts(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    order_service = OrderService(db)
    counts = order_service.get_order_count_by_status(current_user)
    
    return {
        "success": True,
        "data": counts
    }


@router.get("/{order_id}")
async def get_order(
    order_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    order = db.query(MainOrder).filter(MainOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    return {
        "success": True,
        "data": order_to_dict(order)
    }


@router.get("/{order_id}/allowed-actions")
async def get_allowed_actions(
    order_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    order = db.query(MainOrder).filter(MainOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    state_machine = StateMachine(db)
    actions = state_machine.get_allowed_actions(order, current_user)
    
    action_labels = {
        "submit": "提交",
        "approve": "通过",
        "reject": "拒绝",
        "return": "退回",
        "supplement": "补充资料",
        "reassign": "转派",
        "loan": "放款",
        "repay": "回款核销",
        "lock": "锁定",
        "unlock": "解锁",
        "retry": "重试",
        "close": "关闭",
        "cancel": "撤销"
    }
    
    result = []
    for action in actions:
        result.append({
            "action": action["action"],
            "label": action_labels.get(action["action"], action["action"]),
            "from_status": action["from_status"],
            "to_status": action["to_status"]
        })
    
    return {
        "success": True,
        "data": result
    }
