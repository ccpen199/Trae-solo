from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
import structlog
from datetime import datetime

from app.config import settings

logger = structlog.get_logger()


class RuleType(str, Enum):
    PESTICIDE_THRESHOLD = "pesticide_threshold"
    HEAVY_METAL_THRESHOLD = "heavy_metal_threshold"
    BATCH_STATUS_TRANSITION = "batch_status_transition"
    FLOW_VALIDATION = "flow_validation"
    RECALL_CONDITION = "recall_condition"
    CUSTOM = "custom"


class RuleOperator(str, Enum):
    EQ = "eq"
    NE = "ne"
    GT = "gt"
    GTE = "gte"
    LT = "lt"
    LTE = "lte"
    IN = "in"
    NOT_IN = "not_in"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    IS_NULL = "is_null"
    IS_NOT_NULL = "is_not_null"


@dataclass
class RuleResult:
    success: bool
    rule_name: str
    rule_type: RuleType
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    failed_items: List[str] = field(default_factory=list)
    passed_items: List[str] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    @property
    def failed_count(self) -> int:
        return len(self.failed_items)
    
    @property
    def passed_count(self) -> int:
        return len(self.passed_items)


@dataclass
class Rule:
    name: str
    rule_type: RuleType
    operator: RuleOperator
    threshold: Any
    description: str = ""
    priority: int = 0
    enabled: bool = True
    custom_validator: Optional[Callable[[Any, Any], bool]] = None
    
    def evaluate(self, value: Any) -> bool:
        if not self.enabled:
            return True
        
        if self.custom_validator:
            return self.custom_validator(value, self.threshold)
        
        return self._apply_operator(value, self.threshold)
    
    def _apply_operator(self, value: Any, threshold: Any) -> bool:
        try:
            if self.operator == RuleOperator.EQ:
                return value == threshold
            elif self.operator == RuleOperator.NE:
                return value != threshold
            elif self.operator == RuleOperator.GT:
                return float(value) > float(threshold)
            elif self.operator == RuleOperator.GTE:
                return float(value) >= float(threshold)
            elif self.operator == RuleOperator.LT:
                return float(value) < float(threshold)
            elif self.operator == RuleOperator.LTE:
                return float(value) <= float(threshold)
            elif self.operator == RuleOperator.IN:
                return value in threshold
            elif self.operator == RuleOperator.NOT_IN:
                return value not in threshold
            elif self.operator == RuleOperator.CONTAINS:
                return threshold in value if isinstance(value, str) else False
            elif self.operator == RuleOperator.NOT_CONTAINS:
                return threshold not in value if isinstance(value, str) else False
            elif self.operator == RuleOperator.IS_NULL:
                return value is None
            elif self.operator == RuleOperator.IS_NOT_NULL:
                return value is not None
        except (ValueError, TypeError) as e:
            logger.warning("rule_evaluation_error", error=str(e), rule=self.name)
            return False
        return False


class QualityRuleEngine:
    def __init__(self):
        self.rules: Dict[str, Rule] = {}
        self._init_default_rules()
    
    def _init_default_rules(self) -> None:
        for pesticide, threshold in settings.GB2763_PESTICIDE_THRESHOLDS.items():
            self.add_rule(
                Rule(
                    name=f"pesticide_{pesticide}",
                    rule_type=RuleType.PESTICIDE_THRESHOLD,
                    operator=RuleOperator.LTE,
                    threshold=threshold,
                    description=f"GB2763 标准: {pesticide} 残留量 ≤ {threshold} mg/kg",
                    priority=1,
                )
            )
        
        heavy_metal_rules = [
            ("铅", 0.3),
            ("镉", 0.05),
            ("砷", 0.5),
            ("汞", 0.01),
        ]
        for metal, threshold in heavy_metal_rules:
            self.add_rule(
                Rule(
                    name=f"heavy_metal_{metal}",
                    rule_type=RuleType.HEAVY_METAL_THRESHOLD,
                    operator=RuleOperator.LTE,
                    threshold=threshold,
                    description=f"重金属标准: {metal} 含量 ≤ {threshold} mg/kg",
                    priority=1,
                )
            )
    
    def add_rule(self, rule: Rule) -> None:
        self.rules[rule.name] = rule
        logger.info("rule_added", rule_name=rule.name, rule_type=rule.rule_type.value)
    
    def remove_rule(self, rule_name: str) -> bool:
        if rule_name in self.rules:
            del self.rules[rule_name]
            logger.info("rule_removed", rule_name=rule_name)
            return True
        return False
    
    def get_rule(self, rule_name: str) -> Optional[Rule]:
        return self.rules.get(rule_name)
    
    def get_rules_by_type(self, rule_type: RuleType) -> List[Rule]:
        return [
            rule for rule in self.rules.values()
            if rule.rule_type == rule_type and rule.enabled
        ]
    
    def evaluate_pesticide_results(
        self,
        pesticide_results: Dict[str, float],
    ) -> RuleResult:
        failed_items = []
        passed_items = []
        details = {}
        
        for pesticide, value in pesticide_results.items():
            rule_name = f"pesticide_{pesticide}"
            rule = self.get_rule(rule_name)
            
            if rule:
                if rule.evaluate(value):
                    passed_items.append(pesticide)
                    details[pesticide] = {
                        "value": value,
                        "threshold": rule.threshold,
                        "status": "passed",
                        "rule": rule.description,
                    }
                else:
                    failed_items.append(pesticide)
                    details[pesticide] = {
                        "value": value,
                        "threshold": rule.threshold,
                        "status": "failed",
                        "rule": rule.description,
                    }
            else:
                passed_items.append(pesticide)
                details[pesticide] = {
                    "value": value,
                    "threshold": None,
                    "status": "passed",
                    "rule": "无对应检测标准",
                }
        
        success = len(failed_items) == 0
        
        return RuleResult(
            success=success,
            rule_name="pesticide_quality_check",
            rule_type=RuleType.PESTICIDE_THRESHOLD,
            message="农残检测合格" if success else f"农残检测不合格: {len(failed_items)} 项超标",
            details=details,
            failed_items=failed_items,
            passed_items=passed_items,
        )
    
    def evaluate_heavy_metal_results(
        self,
        heavy_metal_results: Dict[str, float],
    ) -> RuleResult:
        failed_items = []
        passed_items = []
        details = {}
        
        for metal, value in heavy_metal_results.items():
            rule_name = f"heavy_metal_{metal}"
            rule = self.get_rule(rule_name)
            
            if rule:
                if rule.evaluate(value):
                    passed_items.append(metal)
                    details[metal] = {
                        "value": value,
                        "threshold": rule.threshold,
                        "status": "passed",
                        "rule": rule.description,
                    }
                else:
                    failed_items.append(metal)
                    details[metal] = {
                        "value": value,
                        "threshold": rule.threshold,
                        "status": "failed",
                        "rule": rule.description,
                    }
            else:
                passed_items.append(metal)
                details[metal] = {
                    "value": value,
                    "threshold": None,
                    "status": "passed",
                    "rule": "无对应检测标准",
                }
        
        success = len(failed_items) == 0
        
        return RuleResult(
            success=success,
            rule_name="heavy_metal_quality_check",
            rule_type=RuleType.HEAVY_METAL_THRESHOLD,
            message="重金属检测合格" if success else f"重金属检测不合格: {len(failed_items)} 项超标",
            details=details,
            failed_items=failed_items,
            passed_items=passed_items,
        )
    
    def evaluate_quality_inspection(
        self,
        pesticide_results: Optional[Dict[str, float]] = None,
        heavy_metal_results: Optional[Dict[str, float]] = None,
    ) -> RuleResult:
        all_results: List[RuleResult] = []
        
        if pesticide_results:
            pesticide_result = self.evaluate_pesticide_results(pesticide_results)
            all_results.append(pesticide_result)
        
        if heavy_metal_results:
            heavy_metal_result = self.evaluate_heavy_metal_results(heavy_metal_results)
            all_results.append(heavy_metal_result)
        
        if not all_results:
            return RuleResult(
                success=False,
                rule_name="quality_inspection_check",
                rule_type=RuleType.CUSTOM,
                message="未提供任何检测数据",
            )
        
        all_success = all(result.success for result in all_results)
        all_failed = [item for result in all_results for item in result.failed_items]
        all_passed = [item for result in all_results for item in result.passed_items]
        
        combined_details = {}
        for result in all_results:
            combined_details.update(result.details)
        
        return RuleResult(
            success=all_success,
            rule_name="overall_quality_check",
            rule_type=RuleType.CUSTOM,
            message="综合质量检测合格" if all_success else f"综合质量检测不合格: {len(all_failed)} 项超标",
            details=combined_details,
            failed_items=all_failed,
            passed_items=all_passed,
        )


quality_rule_engine = QualityRuleEngine()
