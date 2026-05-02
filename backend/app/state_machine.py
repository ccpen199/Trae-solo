from datetime import datetime
from typing import Dict, List, Optional, Callable
from uuid import uuid4
from sqlalchemy.orm import Session

from app.models import (
    MainOrder, OrderStatus, ActionType, User, AuditLog,
    TodoMessage, MessageStatus
)


class StateTransition:
    def __init__(
        self,
        from_status: str,
        to_status: str,
        action: str,
        allowed_roles: List[str],
        callback: Callable = None
    ):
        self.from_status = from_status
        self.to_status = to_status
        self.action = action
        self.allowed_roles = allowed_roles
        self.callback = callback


class StateMachine:
    
    TRANSITIONS = [
        StateTransition(
            from_status=OrderStatus.PENDING_ASSET_REGISTRATION,
            to_status=OrderStatus.PENDING_CONFIRMATION,
            action=ActionType.SUBMIT,
            allowed_roles=["supplier", "admin"]
        ),
        StateTransition(
            from_status=OrderStatus.PENDING_ASSET_REGISTRATION,
            to_status=OrderStatus.CANCELLED,
            action=ActionType.CANCEL,
            allowed_roles=["supplier", "admin"]
        ),
        
        StateTransition(
            from_status=OrderStatus.PENDING_CONFIRMATION,
            to_status=OrderStatus.PENDING_RISK_ASSESSMENT,
            action=ActionType.APPROVE,
            allowed_roles=["core_enterprise", "admin"]
        ),
        StateTransition(
            from_status=OrderStatus.PENDING_CONFIRMATION,
            to_status=OrderStatus.PENDING_ASSET_REGISTRATION,
            action=ActionType.RETURN,
            allowed_roles=["core_enterprise", "admin"]
        ),
        StateTransition(
            from_status=OrderStatus.PENDING_CONFIRMATION,
            to_status=OrderStatus.REJECTED,
            action=ActionType.REJECT,
            allowed_roles=["core_enterprise", "admin"]
        ),
        
        StateTransition(
            from_status=OrderStatus.PENDING_RISK_ASSESSMENT,
            to_status=OrderStatus.PENDING_LOAN,
            action=ActionType.APPROVE,
            allowed_roles=["risk_control", "admin"]
        ),
        StateTransition(
            from_status=OrderStatus.PENDING_RISK_ASSESSMENT,
            to_status=OrderStatus.PENDING_ASSET_REGISTRATION,
            action=ActionType.SUPPLEMENT,
            allowed_roles=["risk_control", "admin"]
        ),
        StateTransition(
            from_status=OrderStatus.PENDING_RISK_ASSESSMENT,
            to_status=OrderStatus.PENDING_RISK_ASSESSMENT,
            action=ActionType.REASSIGN,
            allowed_roles=["risk_control", "admin"]
        ),
        StateTransition(
            from_status=OrderStatus.PENDING_RISK_ASSESSMENT,
            to_status=OrderStatus.REJECTED,
            action=ActionType.REJECT,
            allowed_roles=["risk_control", "admin"]
        ),
        
        StateTransition(
            from_status=OrderStatus.PENDING_LOAN,
            to_status=OrderStatus.PENDING_REPAYMENT,
            action=ActionType.LOAN,
            allowed_roles=["finance", "admin"]
        ),
        StateTransition(
            from_status=OrderStatus.PENDING_LOAN,
            to_status=OrderStatus.PENDING_RISK_ASSESSMENT,
            action=ActionType.RETURN,
            allowed_roles=["finance", "admin"]
        ),
        
        StateTransition(
            from_status=OrderStatus.PENDING_REPAYMENT,
            to_status=OrderStatus.COMPLETED,
            action=ActionType.REPAY,
            allowed_roles=["finance", "admin"]
        ),
        StateTransition(
            from_status=OrderStatus.PENDING_REPAYMENT,
            to_status=OrderStatus.LOCKED,
            action=ActionType.LOCK,
            allowed_roles=["finance", "admin"]
        ),
        
        StateTransition(
            from_status=OrderStatus.REJECTED,
            to_status=OrderStatus.PENDING_ASSET_REGISTRATION,
            action=ActionType.RETRY,
            allowed_roles=["supplier", "admin"]
        ),
        StateTransition(
            from_status=OrderStatus.REJECTED,
            to_status=OrderStatus.CLOSED,
            action=ActionType.CLOSE,
            allowed_roles=["admin"]
        ),
        
        StateTransition(
            from_status=OrderStatus.CANCELLED,
            to_status=OrderStatus.CLOSED,
            action=ActionType.CLOSE,
            allowed_roles=["admin"]
        ),
        
        StateTransition(
            from_status=OrderStatus.LOCKED,
            to_status=OrderStatus.PENDING_REPAYMENT,
            action=ActionType.UNLOCK,
            allowed_roles=["finance", "admin"]
        ),
        StateTransition(
            from_status=OrderStatus.LOCKED,
            to_status=OrderStatus.COMPLETED,
            action=ActionType.REPAY,
            allowed_roles=["finance", "admin"]
        ),
    ]
    
    def __init__(self, db: Session):
        self.db = db
    
    def can_transition(
        self,
        order: MainOrder,
        action: str,
        user: User
    ) -> tuple[bool, str]:
        if order.is_locked and action not in [ActionType.UNLOCK, ActionType.REPAY]:
            return False, f"订单已锁定，当前操作不可用: {action}"
        
        for transition in self.TRANSITIONS:
            if (transition.from_status == order.status and 
                transition.action == action):
                if user.role.value in transition.allowed_roles:
                    return True, "允许执行"
                else:
                    return False, f"角色无权限执行此操作: {user.role}"
        
        return False, f"状态转换不允许: {order.status} -> {action}"
    
    def get_allowed_actions(
        self,
        order: MainOrder,
        user: User
    ) -> List[Dict]:
        allowed = []
        for transition in self.TRANSITIONS:
            if transition.from_status == order.status:
                if user.role.value in transition.allowed_roles:
                    allowed.append({
                        "action": transition.action,
                        "from_status": transition.from_status,
                        "to_status": transition.to_status
                    })
        return allowed
    
    def get_next_assignee_role(self, status: OrderStatus) -> Optional[str]:
        role_mapping = {
            OrderStatus.PENDING_CONFIRMATION: "core_enterprise",
            OrderStatus.PENDING_RISK_ASSESSMENT: "risk_control",
            OrderStatus.PENDING_LOAN: "finance",
            OrderStatus.PENDING_REPAYMENT: "finance",
        }
        return role_mapping.get(status)
    
    def execute_transition(
        self,
        order: MainOrder,
        action: str,
        user: User,
        message: str = None,
        detail: str = None
    ) -> tuple[MainOrder, Optional[AuditLog]]:
        allowed, reason = self.can_transition(order, action, user)
        if not allowed:
            raise ValueError(reason)
        
        target_transition = None
        for transition in self.TRANSITIONS:
            if (transition.from_status == order.status and 
                transition.action == action):
                target_transition = transition
                break
        
        if not target_transition:
            raise ValueError(f"无法找到状态转换规则: {order.status} -> {action}")
        
        old_status = order.status.value
        order.status = target_transition.to_status
        order.updated_at = datetime.utcnow()
        
        if target_transition.to_status == OrderStatus.COMPLETED:
            order.completed_at = datetime.utcnow()
        
        audit_log = AuditLog(
            id=str(uuid4()),
            main_order_id=order.id,
            user_id=user.id,
            action=action,
            module=self._get_module_by_status(old_status),
            from_status=old_status,
            to_status=target_transition.to_status.value,
            message=message or f"执行操作: {action}",
            detail=detail,
            created_at=datetime.utcnow()
        )
        self.db.add(audit_log)
        
        self.db.commit()
        return order, audit_log
    
    def _get_module_by_status(self, status: str) -> str:
        module_mapping = {
            OrderStatus.PENDING_ASSET_REGISTRATION: "asset_registration",
            OrderStatus.PENDING_CONFIRMATION: "confirmation",
            OrderStatus.PENDING_RISK_ASSESSMENT: "risk_assessment",
            OrderStatus.PENDING_LOAN: "loan",
            OrderStatus.PENDING_REPAYMENT: "repayment",
        }
        return module_mapping.get(status, "general")


class MessageService:
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_message(
        self,
        user: User,
        title: str,
        content: str = None,
        message_type: str = None,
        main_order: MainOrder = None,
        action_required: str = None,
        priority: int = 0
    ) -> TodoMessage:
        message = TodoMessage(
            id=str(uuid4()),
            user_id=user.id,
            main_order_id=main_order.id if main_order else None,
            title=title,
            content=content,
            message_type=message_type,
            status=MessageStatus.PENDING,
            action_required=action_required,
            priority=priority,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.db.add(message)
        self.db.commit()
        return message
    
    def mark_as_read(self, message: TodoMessage) -> TodoMessage:
        if message.status == MessageStatus.PENDING:
            message.status = MessageStatus.READ
            message.read_at = datetime.utcnow()
            message.updated_at = datetime.utcnow()
            self.db.commit()
        return message
    
    def mark_as_processed(self, message: TodoMessage) -> TodoMessage:
        message.status = MessageStatus.PROCESSED
        message.processed_at = datetime.utcnow()
        message.updated_at = datetime.utcnow()
        self.db.commit()
        return message
    
    def cancel_message(self, message: TodoMessage) -> TodoMessage:
        message.status = MessageStatus.CANCELLED
        message.updated_at = datetime.utcnow()
        self.db.commit()
        return message
    
    def get_user_messages(
        self,
        user: User,
        status: str = None,
        limit: int = 50
    ) -> List[TodoMessage]:
        query = self.db.query(TodoMessage).filter(
            TodoMessage.user_id == user.id
        )
        if status:
            query = query.filter(TodoMessage.status == status)
        return query.order_by(TodoMessage.created_at.desc()).limit(limit).all()
    
    def get_pending_count(self, user: User) -> int:
        return self.db.query(TodoMessage).filter(
            TodoMessage.user_id == user.id,
            TodoMessage.status == MessageStatus.PENDING
        ).count()
    
    def notify_status_change(
        self,
        order: MainOrder,
        old_status: str,
        new_status: str,
        target_user: User = None,
        operator: User = None
    ) -> List[TodoMessage]:
        messages = []
        
        status_names = {
            OrderStatus.PENDING_ASSET_REGISTRATION: "待资产登记",
            OrderStatus.PENDING_CONFIRMATION: "待核心企业确权",
            OrderStatus.PENDING_RISK_ASSESSMENT: "待风控评估",
            OrderStatus.PENDING_LOAN: "待放款",
            OrderStatus.PENDING_REPAYMENT: "待回款核销",
            OrderStatus.COMPLETED: "已完成",
            OrderStatus.REJECTED: "已驳回",
            OrderStatus.CANCELLED: "已撤销",
            OrderStatus.CLOSED: "已关闭",
            OrderStatus.LOCKED: "已锁定",
        }
        
        old_name = status_names.get(old_status, old_status)
        new_name = status_names.get(new_status, new_status)
        
        if target_user:
            msg = self.create_message(
                user=target_user,
                title=f"订单 [{order.order_no}] 状态变更通知",
                content=f"订单状态从 [{old_name}] 变更为 [{new_name}]，请及时处理。",
                message_type="status_change",
                main_order=order,
                action_required="review",
                priority=1
            )
            messages.append(msg)
        
        if operator and target_user and operator.id != target_user.id:
            msg = self.create_message(
                user=operator,
                title=f"订单 [{order.order_no}] 操作成功",
                content=f"您已将订单状态从 [{old_name}] 变更为 [{new_name}]。",
                message_type="operation_success",
                main_order=order,
                priority=0
            )
            messages.append(msg)
        
        return messages
