from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import structlog

logger = structlog.get_logger()


class AcceptanceCategory(str, Enum):
    FARMING = "farming"
    QUALITY = "quality"
    FLOW = "flow"
    BATCH = "batch"
    RECALL = "recall"
    TAG = "tag"


@dataclass
class AcceptanceCriterion:
    code: str
    name: str
    category: AcceptanceCategory
    description: str
    validation_function: str
    required: bool = True
    severity: str = "high"
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AcceptanceResult:
    criterion_code: str
    criterion_name: str
    category: AcceptanceCategory
    passed: bool
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class AcceptanceReport:
    batch_uid: str
    batch_code: str
    overall_passed: bool
    results: List[AcceptanceResult]
    passed_count: int
    failed_count: int
    required_failed_count: int
    generated_at: datetime = field(default_factory=datetime.utcnow)
    
    @property
    def success_rate(self) -> float:
        total = len(self.results)
        if total == 0:
            return 0.0
        return (self.passed_count / total) * 100


class AcceptanceEngine:
    def __init__(self):
        self._criteria: Dict[str, AcceptanceCriterion] = {}
        self._validators: Dict[str, Callable[[Any], AcceptanceResult]] = {}
        self._init_default_criteria()
    
    def _init_default_criteria(self) -> None:
        criteria = [
            AcceptanceCriterion(
                code="FARM-001",
                name="农事记录完整性",
                category=AcceptanceCategory.FARMING,
                description="批次必须包含完整的农事记录（种植、施肥、施药、采收）",
                validation_function="validate_farming_records_complete",
                required=True,
                severity="high",
            ),
            AcceptanceCriterion(
                code="FARM-002",
                name="地理位置记录",
                category=AcceptanceCategory.FARMING,
                description="农事记录必须包含地理位置经纬度信息",
                validation_function="validate_farming_location",
                required=True,
                severity="high",
            ),
            AcceptanceCriterion(
                code="FARM-003",
                name="数字时间戳",
                category=AcceptanceCategory.FARMING,
                description="农事记录必须包含有效的数字时间戳",
                validation_function="validate_digital_timestamp",
                required=True,
                severity="high",
            ),
            AcceptanceCriterion(
                code="FARM-004",
                name="照片存证",
                category=AcceptanceCategory.FARMING,
                description="关键农事节点必须有照片存证",
                validation_function="validate_photos_exist",
                required=False,
                severity="medium",
            ),
            AcceptanceCriterion(
                code="QUAL-001",
                name="质检报告存在",
                category=AcceptanceCategory.QUALITY,
                description="批次必须有对应的质量检测报告",
                validation_function="validate_quality_report_exists",
                required=True,
                severity="high",
            ),
            AcceptanceCriterion(
                code="QUAL-002",
                name="农残检测合格",
                category=AcceptanceCategory.QUALITY,
                description="农残检测结果必须符合GB 2763标准",
                validation_function="validate_pesticide_results",
                required=True,
                severity="high",
            ),
            AcceptanceCriterion(
                code="QUAL-003",
                name="重金属检测合格",
                category=AcceptanceCategory.QUALITY,
                description="重金属检测结果必须符合国家标准",
                validation_function="validate_heavy_metal_results",
                required=True,
                severity="high",
            ),
            AcceptanceCriterion(
                code="QUAL-004",
                name="标签权限激活",
                category=AcceptanceCategory.QUALITY,
                description="质检通过后必须激活溯源标签查验权限",
                validation_function="validate_tags_enabled",
                required=True,
                severity="high",
            ),
            AcceptanceCriterion(
                code="FLOW-001",
                name="流通记录完整性",
                category=AcceptanceCategory.FLOW,
                description="每个流通节点必须有完整的交接记录",
                validation_function="validate_flow_records_complete",
                required=True,
                severity="high",
            ),
            AcceptanceCriterion(
                code="FLOW-002",
                name="扫码交接验证",
                category=AcceptanceCategory.FLOW,
                description="每个流通节点必须有扫码交接记录",
                validation_function="validate_scan_code_exists",
                required=True,
                severity="high",
            ),
            AcceptanceCriterion(
                code="FLOW-003",
                name="温湿度记录",
                category=AcceptanceCategory.FLOW,
                description="冷链运输必须有温湿度记录",
                validation_function="validate_temperature_humidity",
                required=False,
                severity="medium",
            ),
            AcceptanceCriterion(
                code="FLOW-004",
                name="数字时间戳",
                category=AcceptanceCategory.FLOW,
                description="流通记录必须包含有效的数字时间戳",
                validation_function="validate_flow_timestamp",
                required=True,
                severity="high",
            ),
            AcceptanceCriterion(
                code="BATCH-001",
                name="批次UID唯一",
                category=AcceptanceCategory.BATCH,
                description="批次UID必须全局唯一",
                validation_function="validate_batch_uid_unique",
                required=True,
                severity="critical",
            ),
            AcceptanceCriterion(
                code="BATCH-002",
                name="批次状态有效性",
                category=AcceptanceCategory.BATCH,
                description="批次状态必须符合状态机流转规则",
                validation_function="validate_batch_status_valid",
                required=True,
                severity="high",
            ),
            AcceptanceCriterion(
                code="BATCH-003",
                name="批次编码规范",
                category=AcceptanceCategory.BATCH,
                description="批次编码必须符合生成规则",
                validation_function="validate_batch_code_format",
                required=False,
                severity="low",
            ),
            AcceptanceCriterion(
                code="TAG-001",
                name="标签数据一致性",
                category=AcceptanceCategory.TAG,
                description="溯源标签数据必须与批次数据一致",
                validation_function="validate_tag_data_consistency",
                required=True,
                severity="high",
            ),
            AcceptanceCriterion(
                code="TAG-002",
                name="标签数量匹配",
                category=AcceptanceCategory.TAG,
                description="已激活标签数量必须与批次数量匹配",
                validation_function="validate_tag_quantity_match",
                required=False,
                severity="medium",
            ),
        ]
        
        for criterion in criteria:
            self._criteria[criterion.code] = criterion
    
    def register_validator(
        self,
        function_name: str,
        validator: Callable[[Any], AcceptanceResult],
    ) -> None:
        self._validators[function_name] = validator
        logger.info("acceptance_validator_registered", function_name=function_name)
    
    def get_criterion(self, code: str) -> Optional[AcceptanceCriterion]:
        return self._criteria.get(code)
    
    def get_criteria_by_category(
        self,
        category: AcceptanceCategory,
    ) -> List[AcceptanceCriterion]:
        return [
            c for c in self._criteria.values()
            if c.category == category
        ]
    
    def get_all_criteria(self) -> List[AcceptanceCriterion]:
        return list(self._criteria.values())
    
    async def run_acceptance_check(
        self,
        batch_uid: str,
        batch_code: str,
        context: Any,
        category_filter: Optional[List[AcceptanceCategory]] = None,
    ) -> AcceptanceReport:
        results: List[AcceptanceResult] = []
        
        criteria_to_run = self.get_all_criteria()
        if category_filter:
            criteria_to_run = [
                c for c in criteria_to_run
                if c.category in category_filter
            ]
        
        for criterion in criteria_to_run:
            validator = self._validators.get(criterion.validation_function)
            
            if validator:
                try:
                    result = await validator(context, criterion)
                    results.append(result)
                except Exception as e:
                    logger.error(
                        "acceptance_validation_error",
                        criterion_code=criterion.code,
                        error=str(e),
                    )
                    results.append(
                        AcceptanceResult(
                            criterion_code=criterion.code,
                            criterion_name=criterion.name,
                            category=criterion.category,
                            passed=False,
                            message=f"验证执行异常: {str(e)}",
                            details={"error": str(e)},
                        )
                    )
            else:
                results.append(
                    AcceptanceResult(
                        criterion_code=criterion.code,
                        criterion_name=criterion.name,
                        category=criterion.category,
                        passed=True,
                        message="无验证器实现，默认通过",
                        details={"validator_missing": True},
                    )
                )
        
        passed_count = sum(1 for r in results if r.passed)
        failed_count = len(results) - passed_count
        
        required_criteria = [c for c in criteria_to_run if c.required]
        required_failed = sum(
            1 for r in results
            if not r.passed
            for c in required_criteria
            if c.code == r.criterion_code
        )
        
        overall_passed = required_failed == 0
        
        return AcceptanceReport(
            batch_uid=batch_uid,
            batch_code=batch_code,
            overall_passed=overall_passed,
            results=results,
            passed_count=passed_count,
            failed_count=failed_count,
            required_failed_count=required_failed,
        )


acceptance_engine = AcceptanceEngine()
