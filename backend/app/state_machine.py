from enum import Enum
from typing import Dict, List, Optional
from dataclasses import dataclass


class CaseStatus(str, Enum):
    DRAFT = "DRAFT"
    MATERIAL_SUBMITTED = "MATERIAL_SUBMITTED"
    OCR_PROCESSING = "OCR_PROCESSING"
    MATERIAL_PRE_REVIEW = "MATERIAL_PRE_REVIEW"
    MATERIAL_REJECTED = "MATERIAL_REJECTED"
    MATERIAL_APPROVED = "MATERIAL_APPROVED"
    RESERVATION_AVAILABLE = "RESERVATION_AVAILABLE"
    RESERVED = "RESERVED"
    CHECKED_IN = "CHECKED_IN"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    EVALUATED = "EVALUATED"
    CANCELLED = "CANCELLED"


class ActionType(str, Enum):
    SUBMIT_MATERIAL = "SUBMIT_MATERIAL"
    OCR_PROCESS = "OCR_PROCESS"
    AUDITOR_REVIEW = "AUDITOR_REVIEW"
    AUDITOR_APPROVE = "AUDITOR_APPROVE"
    AUDITOR_REJECT = "AUDITOR_REJECT"
    MAKE_RESERVATION = "MAKE_RESERVATION"
    CANCEL_RESERVATION = "CANCEL_RESERVATION"
    CHECK_IN = "CHECK_IN"
    WINDOW_PROCESS = "WINDOW_PROCESS"
    COMPLETE_CASE = "COMPLETE_CASE"
    SUBMIT_EVALUATION = "SUBMIT_EVALUATION"
    CANCEL_CASE = "CANCEL_CASE"


@dataclass
class StateTransition:
    from_status: Optional[CaseStatus]
    to_status: CaseStatus
    allowed_actions: List[ActionType]
    allowed_roles: List[str]
    description: str


class StateMachine:
    STATUS_TRANSITIONS: Dict[CaseStatus, List[StateTransition]] = {
        CaseStatus.DRAFT: [
            StateTransition(
                from_status=CaseStatus.DRAFT,
                to_status=CaseStatus.MATERIAL_SUBMITTED,
                allowed_actions=[ActionType.SUBMIT_MATERIAL],
                allowed_roles=["CITIZEN"],
                description="群众提交材料",
            ),
            StateTransition(
                from_status=CaseStatus.DRAFT,
                to_status=CaseStatus.CANCELLED,
                allowed_actions=[ActionType.CANCEL_CASE],
                allowed_roles=["CITIZEN", "ADMIN"],
                description="取消办件",
            ),
        ],
        CaseStatus.MATERIAL_SUBMITTED: [
            StateTransition(
                from_status=CaseStatus.MATERIAL_SUBMITTED,
                to_status=CaseStatus.OCR_PROCESSING,
                allowed_actions=[ActionType.OCR_PROCESS],
                allowed_roles=["SYSTEM"],
                description="OCR引擎处理中",
            ),
        ],
        CaseStatus.OCR_PROCESSING: [
            StateTransition(
                from_status=CaseStatus.OCR_PROCESSING,
                to_status=CaseStatus.MATERIAL_PRE_REVIEW,
                allowed_actions=[ActionType.OCR_PROCESS],
                allowed_roles=["SYSTEM"],
                description="OCR完成，进入材料预审",
            ),
        ],
        CaseStatus.MATERIAL_PRE_REVIEW: [
            StateTransition(
                from_status=CaseStatus.MATERIAL_PRE_REVIEW,
                to_status=CaseStatus.MATERIAL_APPROVED,
                allowed_actions=[ActionType.AUDITOR_APPROVE],
                allowed_roles=["AUDITOR"],
                description="审核员通过材料",
            ),
            StateTransition(
                from_status=CaseStatus.MATERIAL_PRE_REVIEW,
                to_status=CaseStatus.MATERIAL_REJECTED,
                allowed_actions=[ActionType.AUDITOR_REJECT],
                allowed_roles=["AUDITOR"],
                description="审核员驳回材料",
            ),
        ],
        CaseStatus.MATERIAL_REJECTED: [
            StateTransition(
                from_status=CaseStatus.MATERIAL_REJECTED,
                to_status=CaseStatus.MATERIAL_SUBMITTED,
                allowed_actions=[ActionType.SUBMIT_MATERIAL],
                allowed_roles=["CITIZEN"],
                description="群众重新提交材料",
            ),
            StateTransition(
                from_status=CaseStatus.MATERIAL_REJECTED,
                to_status=CaseStatus.CANCELLED,
                allowed_actions=[ActionType.CANCEL_CASE],
                allowed_roles=["CITIZEN", "ADMIN"],
                description="取消办件",
            ),
        ],
        CaseStatus.MATERIAL_APPROVED: [
            StateTransition(
                from_status=CaseStatus.MATERIAL_APPROVED,
                to_status=CaseStatus.RESERVATION_AVAILABLE,
                allowed_actions=[ActionType.AUDITOR_APPROVE],
                allowed_roles=["SYSTEM"],
                description="开启预约通道",
            ),
        ],
        CaseStatus.RESERVATION_AVAILABLE: [
            StateTransition(
                from_status=CaseStatus.RESERVATION_AVAILABLE,
                to_status=CaseStatus.RESERVED,
                allowed_actions=[ActionType.MAKE_RESERVATION],
                allowed_roles=["CITIZEN"],
                description="群众预约时间",
            ),
            StateTransition(
                from_status=CaseStatus.RESERVATION_AVAILABLE,
                to_status=CaseStatus.CANCELLED,
                allowed_actions=[ActionType.CANCEL_CASE],
                allowed_roles=["CITIZEN", "ADMIN"],
                description="取消办件",
            ),
        ],
        CaseStatus.RESERVED: [
            StateTransition(
                from_status=CaseStatus.RESERVED,
                to_status=CaseStatus.CHECKED_IN,
                allowed_actions=[ActionType.CHECK_IN],
                allowed_roles=["CITIZEN", "WINDOW_STAFF"],
                description="群众到场取号",
            ),
            StateTransition(
                from_status=CaseStatus.RESERVED,
                to_status=CaseStatus.RESERVATION_AVAILABLE,
                allowed_actions=[ActionType.CANCEL_RESERVATION],
                allowed_roles=["CITIZEN"],
                description="取消预约",
            ),
            StateTransition(
                from_status=CaseStatus.RESERVED,
                to_status=CaseStatus.CANCELLED,
                allowed_actions=[ActionType.CANCEL_CASE],
                allowed_roles=["CITIZEN", "ADMIN"],
                description="取消办件",
            ),
        ],
        CaseStatus.CHECKED_IN: [
            StateTransition(
                from_status=CaseStatus.CHECKED_IN,
                to_status=CaseStatus.PROCESSING,
                allowed_actions=[ActionType.WINDOW_PROCESS],
                allowed_roles=["WINDOW_STAFF"],
                description="窗口人员开始办理",
            ),
        ],
        CaseStatus.PROCESSING: [
            StateTransition(
                from_status=CaseStatus.PROCESSING,
                to_status=CaseStatus.COMPLETED,
                allowed_actions=[ActionType.COMPLETE_CASE],
                allowed_roles=["WINDOW_STAFF"],
                description="窗口人员办结",
            ),
        ],
        CaseStatus.COMPLETED: [
            StateTransition(
                from_status=CaseStatus.COMPLETED,
                to_status=CaseStatus.EVALUATED,
                allowed_actions=[ActionType.SUBMIT_EVALUATION],
                allowed_roles=["CITIZEN"],
                description="群众评价",
            ),
        ],
    }

    @classmethod
    def get_allowed_actions(
        cls, status: CaseStatus, user_role: str
    ) -> List[ActionType]:
        transitions = cls.STATUS_TRANSITIONS.get(status, [])
        allowed = []
        for transition in transitions:
            if user_role in transition.allowed_roles:
                allowed.extend(transition.allowed_actions)
        return list(set(allowed))

    @classmethod
    def can_transition(
        cls,
        from_status: CaseStatus,
        action: ActionType,
        user_role: str,
    ) -> bool:
        transitions = cls.STATUS_TRANSITIONS.get(from_status, [])
        for transition in transitions:
            if action in transition.allowed_actions and user_role in transition.allowed_roles:
                return True
        return False

    @classmethod
    def get_next_status(
        cls,
        current_status: CaseStatus,
        action: ActionType,
    ) -> Optional[CaseStatus]:
        transitions = cls.STATUS_TRANSITIONS.get(current_status, [])
        for transition in transitions:
            if action in transition.allowed_actions:
                return transition.to_status
        return None

    @classmethod
    def get_status_description(cls, status: CaseStatus) -> str:
        descriptions = {
            CaseStatus.DRAFT: "草稿",
            CaseStatus.MATERIAL_SUBMITTED: "材料已提交",
            CaseStatus.OCR_PROCESSING: "OCR核验中",
            CaseStatus.MATERIAL_PRE_REVIEW: "材料预审中",
            CaseStatus.MATERIAL_REJECTED: "材料需补正",
            CaseStatus.MATERIAL_APPROVED: "材料审核通过",
            CaseStatus.RESERVATION_AVAILABLE: "预约通道已开启",
            CaseStatus.RESERVED: "已预约",
            CaseStatus.CHECKED_IN: "已取号",
            CaseStatus.PROCESSING: "办理中",
            CaseStatus.COMPLETED: "已办结",
            CaseStatus.EVALUATED: "已评价",
            CaseStatus.CANCELLED: "已取消",
        }
        return descriptions.get(status, "未知状态")
