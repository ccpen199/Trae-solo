from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models import (
    User, PurchaseOrder, PurchaseItem, Product, Budget,
    ApprovalNode, ApprovalRecord, Message, OperationLog,
    PurchaseStatus, ApprovalAction, MessageType, MessageStatus, UserRole
)


def generate_order_no(prefix: str = "PO") -> str:
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    import random
    suffix = str(random.randint(1000, 9999))
    return f"{prefix}{timestamp}{suffix}"


def create_message(
    db: Session,
    user_id: int,
    title: str,
    content: str,
    message_type: MessageType = MessageType.TODO,
    purchase_order_id: Optional[int] = None,
    action_url: Optional[str] = None
) -> Message:
    message = Message(
        user_id=user_id,
        purchase_order_id=purchase_order_id,
        message_type=message_type,
        title=title,
        content=content,
        status=MessageStatus.UNREAD,
        action_url=action_url
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def create_operation_log(
    db: Session,
    order_id: int,
    operator_id: int,
    operation: str,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    remark: Optional[str] = None
) -> OperationLog:
    log = OperationLog(
        order_id=order_id,
        operator_id=operator_id,
        operation=operation,
        old_value=old_value,
        new_value=new_value,
        remark=remark
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


class BudgetRuleEngine:
    @staticmethod
    def check_budget_available(db: Session, budget_id: int, amount: float) -> dict:
        budget = db.query(Budget).filter(Budget.id == budget_id).first()
        if not budget:
            return {"success": False, "message": "预算不存在"}
        
        if not budget.is_active:
            return {"success": False, "message": "预算已停用"}
        
        available = budget.total_amount - budget.used_amount - budget.reserved_amount
        
        if amount > available:
            return {
                "success": False,
                "message": f"预算不足，可用预算: {available:.2f}, 申请金额: {amount:.2f}"
            }
        
        return {"success": True, "message": "预算充足"}
    
    @staticmethod
    def reserve_budget(db: Session, budget_id: int, amount: float) -> dict:
        check_result = BudgetRuleEngine.check_budget_available(db, budget_id, amount)
        if not check_result["success"]:
            return check_result
        
        budget = db.query(Budget).filter(Budget.id == budget_id).first()
        budget.reserved_amount += amount
        db.commit()
        return {"success": True, "message": "预算已占用"}
    
    @staticmethod
    def release_budget(db: Session, budget_id: int, amount: float) -> dict:
        budget = db.query(Budget).filter(Budget.id == budget_id).first()
        if not budget:
            return {"success": False, "message": "预算不存在"}
        
        if budget.reserved_amount < amount:
            return {"success": False, "message": "预算占用金额不足"}
        
        budget.reserved_amount -= amount
        db.commit()
        return {"success": True, "message": "预算已释放"}
    
    @staticmethod
    def confirm_budget_usage(db: Session, budget_id: int, amount: float) -> dict:
        budget = db.query(Budget).filter(Budget.id == budget_id).first()
        if not budget:
            return {"success": False, "message": "预算不存在"}
        
        if budget.reserved_amount < amount:
            return {"success": False, "message": "预算占用金额不足"}
        
        budget.reserved_amount -= amount
        budget.used_amount += amount
        db.commit()
        return {"success": True, "message": "预算已确认使用"}


class ApprovalRuleEngine:
    @staticmethod
    def get_approval_nodes(db: Session, amount: float) -> List[ApprovalNode]:
        nodes = db.query(ApprovalNode).filter(
            ApprovalNode.is_active == True,
            ApprovalNode.min_amount <= amount
        ).order_by(ApprovalNode.order_index).all()
        
        filtered_nodes = []
        for node in nodes:
            if node.max_amount is None or amount <= node.max_amount:
                filtered_nodes.append(node)
        
        return filtered_nodes
    
    @staticmethod
    def get_next_approver(db: Session, current_node_code: str, amount: float) -> Optional[User]:
        nodes = ApprovalRuleEngine.get_approval_nodes(db, amount)
        
        if not current_node_code:
            if nodes:
                first_node = nodes[0]
                if first_node.approval_user_id:
                    return db.query(User).filter(User.id == first_node.approval_user_id).first()
                else:
                    users = db.query(User).filter(
                        User.role == first_node.approval_role,
                        User.is_active == True
                    ).all()
                    return users[0] if users else None
            return None
        
        current_index = -1
        for i, node in enumerate(nodes):
            if node.node_code == current_node_code:
                current_index = i
                break
        
        if current_index == -1 or current_index + 1 >= len(nodes):
            return None
        
        next_node = nodes[current_index + 1]
        if next_node.approval_user_id:
            return db.query(User).filter(User.id == next_node.approval_user_id).first()
        else:
            users = db.query(User).filter(
                User.role == next_node.approval_role,
                User.is_active == True
            ).all()
            return users[0] if users else None


class PurchaseStateMachine:
    @staticmethod
    def can_transition(current_status: PurchaseStatus, target_status: PurchaseStatus) -> bool:
        valid_transitions = {
            PurchaseStatus.DRAFT: [PurchaseStatus.SUBMITTED, PurchaseStatus.CANCELLED],
            PurchaseStatus.SUBMITTED: [PurchaseStatus.PENDING_APPROVAL, PurchaseStatus.DRAFT],
            PurchaseStatus.PENDING_APPROVAL: [
                PurchaseStatus.APPROVED, 
                PurchaseStatus.REJECTED, 
                PurchaseStatus.SUBMITTED
            ],
            PurchaseStatus.APPROVED: [PurchaseStatus.PENDING_ORDER],
            PurchaseStatus.PENDING_ORDER: [PurchaseStatus.ORDERED],
            PurchaseStatus.ORDERED: [PurchaseStatus.RECEIVING],
            PurchaseStatus.RECEIVING: [PurchaseStatus.RECEIVED],
            PurchaseStatus.RECEIVED: [PurchaseStatus.PENDING_SETTLEMENT],
            PurchaseStatus.PENDING_SETTLEMENT: [PurchaseStatus.SETTLED],
            PurchaseStatus.SETTLED: [PurchaseStatus.ARCHIVED],
            PurchaseStatus.REJECTED: [PurchaseStatus.DRAFT, PurchaseStatus.CANCELLED],
            PurchaseStatus.CANCELLED: [],
            PurchaseStatus.ARCHIVED: []
        }
        
        return target_status in valid_transitions.get(current_status, [])
    
    @staticmethod
    def transition(
        db: Session,
        order: PurchaseOrder,
        target_status: PurchaseStatus,
        operator_id: int,
        remark: Optional[str] = None
    ) -> dict:
        if not PurchaseStateMachine.can_transition(order.status, target_status):
            return {
                "success": False,
                "message": f"无法从 {order.status.value} 转换到 {target_status.value}"
            }
        
        old_status = order.status.value
        order.status = target_status
        
        create_operation_log(
            db=db,
            order_id=order.id,
            operator_id=operator_id,
            operation=f"状态变更: {old_status} -> {target_status.value}",
            old_value=old_status,
            new_value=target_status.value,
            remark=remark
        )
        
        db.commit()
        return {"success": True, "message": "状态转换成功"}


class PurchaseOrderService:
    @staticmethod
    def create_draft(
        db: Session,
        user: User,
        title: str,
        items: List[dict],
        budget_id: Optional[int] = None,
        description: Optional[str] = None,
        responsible_user_id: Optional[int] = None,
        expected_completion_date: Optional[datetime] = None
    ) -> dict:
        order_no = generate_order_no()
        
        order = PurchaseOrder(
            order_no=order_no,
            title=title,
            description=description,
            created_by=user.id,
            responsible_user_id=responsible_user_id or user.id,
            department=user.department,
            budget_id=budget_id,
            status=PurchaseStatus.DRAFT,
            expected_completion_date=expected_completion_date
        )
        
        db.add(order)
        db.flush()
        
        total_amount = 0.0
        tax_amount = 0.0
        
        for item_data in items:
            product = db.query(Product).filter(Product.id == item_data["product_id"]).first()
            if not product:
                db.rollback()
                return {"success": False, "message": f"商品不存在: {item_data['product_id']}"}
            
            quantity = float(item_data["quantity"])
            unit_price = float(item_data.get("unit_price", product.unit_price))
            tax_rate = float(item_data.get("tax_rate", product.tax_rate))
            
            amount = quantity * unit_price
            tax = amount * tax_rate
            amount_with_tax = amount + tax
            
            item = PurchaseItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                product_code=product.code,
                specification=product.specification,
                unit=product.unit,
                quantity=quantity,
                unit_price=unit_price,
                tax_rate=tax_rate,
                amount=amount,
                tax_amount=tax,
                amount_with_tax=amount_with_tax,
                status="pending"
            )
            db.add(item)
            
            total_amount += amount
            tax_amount += tax
        
        order.total_amount = total_amount
        order.tax_amount = tax_amount
        order.total_amount_with_tax = total_amount + tax_amount
        
        db.commit()
        db.refresh(order)
        
        create_operation_log(
            db=db,
            order_id=order.id,
            operator_id=user.id,
            operation="创建草稿",
            new_value=f"订单号: {order_no}"
        )
        
        return {"success": True, "order": order}
    
    @staticmethod
    def submit_order(db: Session, order: PurchaseOrder, user: User) -> dict:
        if order.status != PurchaseStatus.DRAFT:
            return {"success": False, "message": "只能提交草稿状态的订单"}
        
        if not order.items:
            return {"success": False, "message": "订单至少需要包含一个商品"}
        
        if order.budget_id:
            budget_check = BudgetRuleEngine.check_budget_available(
                db, order.budget_id, order.total_amount_with_tax
            )
            if not budget_check["success"]:
                return budget_check
            
            BudgetRuleEngine.reserve_budget(db, order.budget_id, order.total_amount_with_tax)
        
        result = PurchaseStateMachine.transition(
            db=db,
            order=order,
            target_status=PurchaseStatus.SUBMITTED,
            operator_id=user.id,
            remark="提交申请"
        )
        
        if not result["success"]:
            if order.budget_id:
                BudgetRuleEngine.release_budget(db, order.budget_id, order.total_amount_with_tax)
            return result
        
        order.submitted_at = datetime.utcnow()
        db.commit()
        
        return {
            "success": True,
            "message": "订单已提交",
            "next_step": "进入审批流程"
        }
    
    @staticmethod
    def start_approval(db: Session, order: PurchaseOrder, user: User) -> dict:
        if order.status != PurchaseStatus.SUBMITTED:
            return {"success": False, "message": "订单状态不正确"}
        
        nodes = ApprovalRuleEngine.get_approval_nodes(db, order.total_amount_with_tax)
        
        if not nodes:
            result = PurchaseStateMachine.transition(
                db=db,
                order=order,
                target_status=PurchaseStatus.APPROVED,
                operator_id=user.id,
                remark="无审批节点，自动通过"
            )
            order.approved_at = datetime.utcnow()
            db.commit()
            return {"success": True, "message": "无审批节点，自动通过"}
        
        first_node = nodes[0]
        order.current_approval_node = first_node.node_code
        
        result = PurchaseStateMachine.transition(
            db=db,
            order=order,
            target_status=PurchaseStatus.PENDING_APPROVAL,
            operator_id=user.id,
            remark=f"进入审批流程: {first_node.node_name}"
        )
        
        if not result["success"]:
            return result
        
        next_approver = ApprovalRuleEngine.get_next_approver(db, None, order.total_amount_with_tax)
        if next_approver:
            create_message(
                db=db,
                user_id=next_approver.id,
                title=f"新审批待办: {order.order_no}",
                content=f"订单 {order.title} 需要您审批，金额: {order.total_amount_with_tax:.2f}",
                purchase_order_id=order.id
            )
        
        db.commit()
        return {"success": True, "message": "已进入审批流程", "approver": next_approver}
    
    @staticmethod
    def process_approval(
        db: Session,
        order: PurchaseOrder,
        user: User,
        action: ApprovalAction,
        opinion: Optional[str] = None
    ) -> dict:
        if order.status != PurchaseStatus.PENDING_APPROVAL:
            return {"success": False, "message": "订单不在审批状态"}
        
        record = ApprovalRecord(
            order_id=order.id,
            node_code=order.current_approval_node,
            approver_id=user.id,
            action=action,
            opinion=opinion
        )
        db.add(record)
        
        if action == ApprovalAction.APPROVE:
            nodes = ApprovalRuleEngine.get_approval_nodes(db, order.total_amount_with_tax)
            current_index = -1
            for i, node in enumerate(nodes):
                if node.node_code == order.current_approval_node:
                    current_index = i
                    break
            
            if current_index == -1 or current_index + 1 >= len(nodes):
                result = PurchaseStateMachine.transition(
                    db=db,
                    order=order,
                    target_status=PurchaseStatus.APPROVED,
                    operator_id=user.id,
                    remark=f"审批通过: {opinion or '无意见'}"
                )
                order.approved_at = datetime.utcnow()
                
                if order.budget_id:
                    BudgetRuleEngine.confirm_budget_usage(
                        db, order.budget_id, order.total_amount_with_tax
                    )
                
                create_message(
                    db=db,
                    user_id=order.created_by,
                    title=f"订单已通过审批: {order.order_no}",
                    content=f"您的订单 {order.title} 已通过所有审批，可以继续后续流程",
                    purchase_order_id=order.id
                )
            else:
                next_node = nodes[current_index + 1]
                order.current_approval_node = next_node.node_code
                
                create_operation_log(
                    db=db,
                    order_id=order.id,
                    operator_id=user.id,
                    operation=f"审批通过，进入下一节点: {next_node.node_name}",
                    remark=opinion
                )
                
                next_approver = ApprovalRuleEngine.get_next_approver(
                    db, order.current_approval_node, order.total_amount_with_tax
                )
                if next_approver:
                    create_message(
                        db=db,
                        user_id=next_approver.id,
                        title=f"新审批待办: {order.order_no}",
                        content=f"订单 {order.title} 需要您审批",
                        purchase_order_id=order.id
                    )
        
        elif action == ApprovalAction.REJECT:
            result = PurchaseStateMachine.transition(
                db=db,
                order=order,
                target_status=PurchaseStatus.REJECTED,
                operator_id=user.id,
                remark=f"审批驳回: {opinion or '无意见'}"
            )
            
            if order.budget_id:
                BudgetRuleEngine.release_budget(
                    db, order.budget_id, order.total_amount_with_tax
                )
            
            create_message(
                db=db,
                user_id=order.created_by,
                title=f"订单被驳回: {order.order_no}",
                content=f"您的订单 {order.title} 被驳回，原因: {opinion or '无'}",
                purchase_order_id=order.id
            )
        
        elif action == ApprovalAction.SUPPLEMENT:
            result = PurchaseStateMachine.transition(
                db=db,
                order=order,
                target_status=PurchaseStatus.SUBMITTED,
                operator_id=user.id,
                remark=f"需补充资料: {opinion or '无意见'}"
            )
            
            create_message(
                db=db,
                user_id=order.created_by,
                title=f"订单需补充资料: {order.order_no}",
                content=f"您的订单 {order.title} 需要补充资料: {opinion or '无'}",
                purchase_order_id=order.id
            )
        
        elif action == ApprovalAction.REASSIGN:
            create_operation_log(
                db=db,
                order_id=order.id,
                operator_id=user.id,
                operation="审批转派",
                remark=opinion
            )
        
        db.commit()
        return {"success": True, "message": f"审批操作完成: {action.value}"}
