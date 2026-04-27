from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, field
from enum import Enum
import structlog

from app.models.batch import BatchStatus

logger = structlog.get_logger()


@dataclass
class Transition:
    from_state: BatchStatus
    to_state: BatchStatus
    event: str
    conditions: List[Callable[[Any], bool]] = field(default_factory=list)
    actions: List[Callable[[Any], None]] = field(default_factory=list)
    description: str = ""


@dataclass
class StateTransitionResult:
    success: bool
    from_state: BatchStatus
    to_state: Optional[BatchStatus]
    message: str
    event: str
    error_code: Optional[str] = None


class BatchStateMachine:
    def __init__(self):
        self.transitions: Dict[str, List[Transition]] = {}
        self.state_actions: Dict[BatchStatus, List[Callable[[Any], None]]] = {}
        self._init_transitions()
    
    def _init_transitions(self) -> None:
        self._add_transition(
            from_state=BatchStatus.DRAFT,
            to_state=BatchStatus.FARMING_IN_PROGRESS,
            event="start_farming",
            description="开始农事作业",
        )
        
        self._add_transition(
            from_state=BatchStatus.FARMING_IN_PROGRESS,
            to_state=BatchStatus.HARVESTED,
            event="harvest",
            description="完成采收",
        )
        
        self._add_transition(
            from_state=BatchStatus.HARVESTED,
            to_state=BatchStatus.QUALITY_PENDING,
            event="submit_quality",
            description="提交质检",
        )
        
        self._add_transition(
            from_state=BatchStatus.QUALITY_PENDING,
            to_state=BatchStatus.QUALITY_PASSED,
            event="quality_pass",
            description="质检通过",
        )
        
        self._add_transition(
            from_state=BatchStatus.QUALITY_PENDING,
            to_state=BatchStatus.QUALITY_FAILED,
            event="quality_fail",
            description="质检不通过",
        )
        
        self._add_transition(
            from_state=BatchStatus.QUALITY_FAILED,
            to_state=BatchStatus.BLOCKED,
            event="block",
            description="封禁批次",
        )
        
        self._add_transition(
            from_state=BatchStatus.QUALITY_PASSED,
            to_state=BatchStatus.IN_TRANSIT,
            event="start_transport",
            description="开始运输",
        )
        
        self._add_transition(
            from_state=BatchStatus.QUALITY_PASSED,
            to_state=BatchStatus.IN_WAREHOUSE,
            event="store_warehouse",
            description="入库存储",
        )
        
        self._add_transition(
            from_state=BatchStatus.IN_TRANSIT,
            to_state=BatchStatus.IN_WAREHOUSE,
            event="receive_warehouse",
            description="仓库接收",
        )
        
        self._add_transition(
            from_state=BatchStatus.IN_WAREHOUSE,
            to_state=BatchStatus.IN_TRANSIT,
            event="ship",
            description="发货出库",
        )
        
        self._add_transition(
            from_state=BatchStatus.IN_WAREHOUSE,
            to_state=BatchStatus.ON_SALE,
            event="on_sale",
            description="上架销售",
        )
        
        self._add_transition(
            from_state=BatchStatus.ON_SALE,
            to_state=BatchStatus.SOLD,
            event="sold",
            description="销售完成",
        )
        
        self._add_transition(
            from_state=[
                BatchStatus.IN_TRANSIT,
                BatchStatus.IN_WAREHOUSE,
                BatchStatus.ON_SALE,
                BatchStatus.SOLD,
            ],
            to_state=BatchStatus.RECALLED,
            event="recall",
            description="质量召回",
        )
        
        self._add_transition(
            from_state=[
                BatchStatus.DRAFT,
                BatchStatus.FARMING_IN_PROGRESS,
                BatchStatus.HARVESTED,
                BatchStatus.QUALITY_PENDING,
                BatchStatus.QUALITY_PASSED,
                BatchStatus.QUALITY_FAILED,
                BatchStatus.IN_TRANSIT,
                BatchStatus.IN_WAREHOUSE,
                BatchStatus.ON_SALE,
                BatchStatus.SOLD,
            ],
            to_state=BatchStatus.BLOCKED,
            event="emergency_block",
            description="紧急封禁",
        )
    
    def _add_transition(
        self,
        from_state: BatchStatus | List[BatchStatus],
        to_state: BatchStatus,
        event: str,
        description: str = "",
        conditions: List[Callable[[Any], bool]] = None,
        actions: List[Callable[[Any], None]] = None,
    ) -> None:
        if isinstance(from_state, BatchStatus):
            from_states = [from_state]
        else:
            from_states = from_state
        
        for fs in from_states:
            transition = Transition(
                from_state=fs,
                to_state=to_state,
                event=event,
                conditions=conditions or [],
                actions=actions or [],
                description=description,
            )
            
            if event not in self.transitions:
                self.transitions[event] = []
            self.transitions[event].append(transition)
    
    def can_transition(self, current_state: BatchStatus, event: str, context: Any = None) -> bool:
        if event not in self.transitions:
            return False
        
        for transition in self.transitions[event]:
            if transition.from_state == current_state:
                if self._check_conditions(transition, context):
                    return True
        return False
    
    def _check_conditions(self, transition: Transition, context: Any = None) -> bool:
        for condition in transition.conditions:
            try:
                if not condition(context):
                    return False
            except Exception as e:
                logger.error("condition_check_failed", error=str(e))
                return False
        return True
    
    def _execute_actions(self, transition: Transition, context: Any = None) -> None:
        for action in transition.actions:
            try:
                action(context)
            except Exception as e:
                logger.error("action_execution_failed", error=str(e))
    
    def get_available_events(self, current_state: BatchStatus) -> List[str]:
        available = []
        for event, transitions in self.transitions.items():
            for transition in transitions:
                if transition.from_state == current_state and event not in available:
                    available.append(event)
        return available
    
    def get_transition_description(self, event: str, from_state: BatchStatus) -> Optional[str]:
        if event not in self.transitions:
            return None
        
        for transition in self.transitions[event]:
            if transition.from_state == from_state:
                return transition.description
        return None
    
    def transition(
        self,
        current_state: BatchStatus,
        event: str,
        context: Any = None,
    ) -> StateTransitionResult:
        logger.info(
            "state_transition_attempt",
            current_state=current_state.value,
            event=event,
        )
        
        if event not in self.transitions:
            return StateTransitionResult(
                success=False,
                from_state=current_state,
                to_state=None,
                message=f"未知事件: {event}",
                event=event,
                error_code="UNKNOWN_EVENT",
            )
        
        matching_transition = None
        for transition in self.transitions[event]:
            if transition.from_state == current_state:
                if self._check_conditions(transition, context):
                    matching_transition = transition
                    break
        
        if matching_transition is None:
            return StateTransitionResult(
                success=False,
                from_state=current_state,
                to_state=None,
                message=f"无法从 {current_state.value} 通过 {event} 进行状态转换",
                event=event,
                error_code="INVALID_TRANSITION",
            )
        
        try:
            self._execute_actions(matching_transition, context)
            
            result = StateTransitionResult(
                success=True,
                from_state=current_state,
                to_state=matching_transition.to_state,
                message=matching_transition.description or f"成功转换到 {matching_transition.to_state.value}",
                event=event,
            )
            
            logger.info(
                "state_transition_success",
                from_state=current_state.value,
                to_state=matching_transition.to_state.value,
                event=event,
            )
            
            return result
            
        except Exception as e:
            logger.error(
                "state_transition_failed",
                error=str(e),
                from_state=current_state.value,
                event=event,
            )
            return StateTransitionResult(
                success=False,
                from_state=current_state,
                to_state=None,
                message=f"状态转换执行失败: {str(e)}",
                event=event,
                error_code="TRANSITION_EXECUTION_ERROR",
            )


batch_state_machine = BatchStateMachine()
