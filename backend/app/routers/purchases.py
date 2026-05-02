from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import (
    PurchaseOrder, PurchaseItem, Budget, ApprovalNode, User,
    PurchaseStatus, ApprovalAction, Message, MessageStatus
)
from app.auth import get_current_user
from app.services import (
    PurchaseOrderService, ApprovalRuleEngine, PurchaseStateMachine,
    BudgetRuleEngine, create_message, generate_order_no
)

router = APIRouter(prefix="/api/purchases", tags=["采购申请"])


class PurchaseItemRequest(BaseModel):
    product_id: int
    quantity: float
    unit_price: Optional[float] = None


class PurchaseCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    budget_id: Optional[int] = None
    items: List[PurchaseItemRequest]
    expected_completion_date: Optional[datetime] = None
    responsible_user_id: Optional[int] = None


class PurchaseItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_code: Optional[str]
    specification: Optional[str]
    unit: Optional[str]
    quantity: float
    unit_price: float
    tax_rate: float
    amount: float
    tax_amount: float
    amount_with_tax: float
    received_quantity: float
    status: str
    
    class Config:
        from_attributes = True


class PurchaseResponse(BaseModel):
    id: int
    order_no: str
    title: str
    description: Optional[str]
    created_by: Optional[int]
    creator_name: Optional[str]
    responsible_user_id: Optional[int]
    responsible_name: Optional[str]
    department: Optional[str]
    budget_id: Optional[int]
    total_amount: float
    tax_amount: float
    total_amount_with_tax: float
    status: str
    current_approval_node: Optional[str]
    expected_completion_date: Optional[datetime]
    is_locked: bool
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime]
    approved_at: Optional[datetime]
    items: List[PurchaseItemResponse] = []
    
    class Config:
        from_attributes = True


class ApprovalActionRequest(BaseModel):
    action: str
    opinion: Optional[str] = None


@router.get("/", response_model=List[PurchaseResponse])
def get_purchases(
    status: Optional[str] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(PurchaseOrder)
    
    if status:
        query = query.filter(PurchaseOrder.status == status)
    
    if keyword:
        query = query.filter(
            (PurchaseOrder.order_no.like(f"%{keyword}%")) |
            (PurchaseOrder.title.like(f"%{keyword}%"))
        )
    
    orders = query.order_by(PurchaseOrder.created_at.desc()).all()
    
    result = []
    for order in orders:
        creator_name = None
        if order.creator:
            creator_name = order.creator.real_name
        
        responsible_name = None
        if order.responsible_user:
            responsible_name = order.responsible_user.real_name
        
        items = [PurchaseItemResponse.from_orm(item) for item in order.items]
        
        result.append(PurchaseResponse(
            id=order.id,
            order_no=order.order_no,
            title=order.title,
            description=order.description,
            created_by=order.created_by,
            creator_name=creator_name,
            responsible_user_id=order.responsible_user_id,
            responsible_name=responsible_name,
            department=order.department,
            budget_id=order.budget_id,
            total_amount=order.total_amount,
            tax_amount=order.tax_amount,
            total_amount_with_tax=order.total_amount_with_tax,
            status=order.status.value if order.status else "",
            current_approval_node=order.current_approval_node,
            expected_completion_date=order.expected_completion_date,
            is_locked=order.is_locked,
            created_at=order.created_at,
            updated_at=order.updated_at,
            submitted_at=order.submitted_at,
            approved_at=order.approved_at,
            items=items
        ))
    
    return result


@router.get("/my", response_model=List[PurchaseResponse])
def get_my_purchases(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(PurchaseOrder).filter(
        PurchaseOrder.created_by == current_user.id
    )
    
    if status:
        query = query.filter(PurchaseOrder.status == status)
    
    orders = query.order_by(PurchaseOrder.created_at.desc()).all()
    
    result = []
    for order in orders:
        creator_name = None
        if order.creator:
            creator_name = order.creator.real_name
        
        responsible_name = None
        if order.responsible_user:
            responsible_name = order.responsible_user.real_name
        
        items = [PurchaseItemResponse.from_orm(item) for item in order.items]
        
        result.append(PurchaseResponse(
            id=order.id,
            order_no=order.order_no,
            title=order.title,
            description=order.description,
            created_by=order.created_by,
            creator_name=creator_name,
            responsible_user_id=order.responsible_user_id,
            responsible_name=responsible_name,
            department=order.department,
            budget_id=order.budget_id,
            total_amount=order.total_amount,
            tax_amount=order.tax_amount,
            total_amount_with_tax=order.total_amount_with_tax,
            status=order.status.value if order.status else "",
            current_approval_node=order.current_approval_node,
            expected_completion_date=order.expected_completion_date,
            is_locked=order.is_locked,
            created_at=order.created_at,
            updated_at=order.updated_at,
            submitted_at=order.submitted_at,
            approved_at=order.approved_at,
            items=items
        ))
    
    return result


@router.get("/{order_id}", response_model=PurchaseResponse)
def get_purchase(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    creator_name = None
    if order.creator:
        creator_name = order.creator.real_name
    
    responsible_name = None
    if order.responsible_user:
        responsible_name = order.responsible_user.real_name
    
    items = [PurchaseItemResponse.from_orm(item) for item in order.items]
    
    return PurchaseResponse(
        id=order.id,
        order_no=order.order_no,
        title=order.title,
        description=order.description,
        created_by=order.created_by,
        creator_name=creator_name,
        responsible_user_id=order.responsible_user_id,
        responsible_name=responsible_name,
        department=order.department,
        budget_id=order.budget_id,
        total_amount=order.total_amount,
        tax_amount=order.tax_amount,
        total_amount_with_tax=order.total_amount_with_tax,
        status=order.status.value if order.status else "",
        current_approval_node=order.current_approval_node,
        expected_completion_date=order.expected_completion_date,
        is_locked=order.is_locked,
        created_at=order.created_at,
        updated_at=order.updated_at,
        submitted_at=order.submitted_at,
        approved_at=order.approved_at,
        items=items
    )


@router.post("/")
def create_purchase(
    request: PurchaseCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items_data = [
        {
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit_price": item.unit_price
        }
        for item in request.items
    ]
    
    result = PurchaseOrderService.create_draft(
        db=db,
        user=current_user,
        title=request.title,
        description=request.description,
        budget_id=request.budget_id,
        items=items_data,
        expected_completion_date=request.expected_completion_date,
        responsible_user_id=request.responsible_user_id
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result


@router.post("/{order_id}/submit")
def submit_purchase(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    if order.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="无权限操作此订单")
    
    result = PurchaseOrderService.submit_order(db=db, order=order, user=current_user)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    if "next_step" in result:
        approval_result = PurchaseOrderService.start_approval(db=db, order=order, user=current_user)
        result["approval"] = approval_result
    
    return result


@router.post("/{order_id}/approval")
def process_approval(
    order_id: int,
    request: ApprovalActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    try:
        action = ApprovalAction(request.action)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"无效的审批动作: {request.action}")
    
    result = PurchaseOrderService.process_approval(
        db=db,
        order=order,
        user=current_user,
        action=action,
        opinion=request.opinion
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    messages = db.query(Message).filter(
        Message.purchase_order_id == order_id,
        Message.user_id == current_user.id,
        Message.status != MessageStatus.DONE
    ).all()
    for msg in messages:
        msg.status = MessageStatus.DONE
        msg.done_at = datetime.utcnow()
    db.commit()
    
    return result


@router.get("/{order_id}/timeline")
def get_order_timeline(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    
    timeline = []
    
    for log in order.operation_logs:
        operator_name = None
        if log.operator:
            operator_name = log.operator.real_name
        
        timeline.append({
            "time": log.created_at.isoformat(),
            "operator": operator_name,
            "operation": log.operation,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "remark": log.remark,
            "type": "log"
        })
    
    for approval in order.approval_records:
        approver_name = None
        if approval.approver:
            approver_name = approval.approver.real_name
        
        timeline.append({
            "time": approval.created_at.isoformat(),
            "operator": approver_name,
            "operation": f"审批{approval.action.value}",
            "node": approval.node_name,
            "opinion": approval.opinion,
            "type": "approval"
        })
    
    timeline.sort(key=lambda x: x["time"])
    
    return {"order_no": order.order_no, "timeline": timeline}


@router.post("/init-budget")
def init_budget_data(db: Session = Depends(get_db)):
    existing = db.query(Budget).first()
    if existing:
        return {"message": "预算数据已初始化"}
    
    budgets = [
        Budget(
            code="BUD2024001",
            name="技术部年度办公设备预算",
            department="技术部",
            fiscal_year=2024,
            category="办公设备",
            total_amount=500000.00,
            used_amount=0.00,
            reserved_amount=0.00,
            available_amount=500000.00
        ),
        Budget(
            code="BUD2024002",
            name="行政部日常办公用品预算",
            department="行政部",
            fiscal_year=2024,
            category="办公用品",
            total_amount=100000.00,
            used_amount=0.00,
            reserved_amount=0.00,
            available_amount=100000.00
        )
    ]
    
    db.add_all(budgets)
    db.commit()
    
    return {"message": "预算测试数据初始化完成", "budgets_count": len(budgets)}


@router.get("/budgets/list")
def get_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    budgets = db.query(Budget).filter(Budget.is_active == True).all()
    
    result = []
    for budget in budgets:
        result.append({
            "id": budget.id,
            "code": budget.code,
            "name": budget.name,
            "department": budget.department,
            "fiscal_year": budget.fiscal_year,
            "category": budget.category,
            "total_amount": budget.total_amount,
            "used_amount": budget.used_amount,
            "reserved_amount": budget.reserved_amount,
            "available_amount": budget.total_amount - budget.used_amount - budget.reserved_amount,
            "is_active": budget.is_active
        })
    
    return result


@router.post("/init-approval-nodes")
def init_approval_nodes(db: Session = Depends(get_db)):
    existing = db.query(ApprovalNode).first()
    if existing:
        return {"message": "审批节点数据已初始化"}
    
    nodes = [
        ApprovalNode(
            node_code="NODE001",
            node_name="部门经理审批",
            approval_role="approver",
            min_amount=0.00,
            max_amount=50000.00,
            order_index=1
        ),
        ApprovalNode(
            node_code="NODE002",
            node_name="财务审批",
            approval_role="finance",
            min_amount=50000.00,
            max_amount=None,
            order_index=2
        )
    ]
    
    db.add_all(nodes)
    db.commit()
    
    return {"message": "审批节点数据初始化完成", "nodes_count": len(nodes)}
