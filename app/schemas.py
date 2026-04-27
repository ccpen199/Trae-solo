from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.batch import BatchStatus
from app.models.user import UserRole
from app.models.farming import FarmingOperation
from app.models.quality import QualityStatus
from app.models.flow import FlowNode, FlowOperation
from app.models.recall import RecallLevel, RecallStatus
from app.models.compensation import CompensationType, CompensationStatus


class BatchCreate(BaseModel):
    product_name: str
    farm_name: str
    farmer_uid: str
    product_category: Optional[str] = None
    farm_location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    planting_date: Optional[datetime] = None
    estimated_quantity: Optional[float] = None
    unit: str = "kg"
    metadata: Optional[Dict[str, Any]] = None


class BatchResponse(BaseModel):
    uid: str
    batch_code: str
    product_name: str
    product_category: Optional[str]
    farm_name: str
    farm_location: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    farmer_uid: str
    planting_date: Optional[datetime]
    harvest_date: Optional[datetime]
    estimated_quantity: Optional[float]
    actual_quantity: Optional[float]
    unit: str
    status: BatchStatus
    tags_enabled: bool
    tags_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FarmingRecordCreate(BaseModel):
    batch_uid: str
    operation_type: FarmingOperation
    operation_name: str
    operator_uid: str
    operator_name: Optional[str] = None
    operation_time: Optional[datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_description: Optional[str] = None
    photo_urls: Optional[Dict[str, Any]] = None
    weather_info: Optional[Dict[str, Any]] = None
    equipment_used: Optional[str] = None
    labor_count: Optional[int] = None
    pesticide_name: Optional[str] = None
    pesticide_dosage: Optional[float] = None
    pesticide_unit: Optional[str] = None
    fertilizer_name: Optional[str] = None
    fertilizer_dosage: Optional[float] = None
    fertilizer_unit: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class FarmingRecordResponse(BaseModel):
    uid: str
    batch_uid: str
    operation_type: FarmingOperation
    operation_name: str
    operator_uid: str
    operator_name: Optional[str]
    operation_time: datetime
    latitude: Optional[float]
    longitude: Optional[float]
    location_description: Optional[str]
    photo_urls: Optional[Dict[str, Any]]
    digital_timestamp: str
    weather_info: Optional[Dict[str, Any]]
    equipment_used: Optional[str]
    labor_count: Optional[int]
    pesticide_name: Optional[str]
    pesticide_dosage: Optional[float]
    pesticide_unit: Optional[str]
    fertilizer_name: Optional[str]
    fertilizer_dosage: Optional[float]
    fertilizer_unit: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QualityInspectionCreate(BaseModel):
    batch_uid: str
    inspector_uid: str
    inspector_name: Optional[str] = None
    lab_name: Optional[str] = None
    lab_code: Optional[str] = None
    sampling_time: Optional[datetime] = None
    sample_count: int = 1
    sample_location: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class TestResultsSubmit(BaseModel):
    pesticide_results: Optional[Dict[str, float]] = None
    heavy_metal_results: Optional[Dict[str, float]] = None
    result_description: Optional[str] = None
    report_attachment_url: Optional[str] = None


class QualityInspectionResponse(BaseModel):
    uid: str
    batch_uid: str
    inspection_code: str
    inspector_uid: str
    inspector_name: Optional[str]
    lab_name: Optional[str]
    lab_code: Optional[str]
    sampling_time: Optional[datetime]
    testing_start_time: Optional[datetime]
    testing_end_time: Optional[datetime]
    sample_count: int
    sample_location: Optional[str]
    status: QualityStatus
    pesticide_results: Optional[Dict[str, Any]]
    heavy_metal_results: Optional[Dict[str, Any]]
    overall_result: Optional[bool]
    result_description: Optional[str]
    standard_reference: str
    re_inspection_required: bool
    re_inspection_count: int
    report_attachment_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RuleEvaluationResponse(BaseModel):
    success: bool
    rule_name: str
    message: str
    failed_items: List[str]
    passed_items: List[str]
    details: Dict[str, Any]


class FlowRecordCreate(BaseModel):
    batch_uid: str
    operation_type: FlowOperation
    to_node: FlowNode
    to_node_name: str
    operator_uid: str
    operator_name: Optional[str] = None
    from_node: Optional[FlowNode] = None
    from_node_name: Optional[str] = None
    from_latitude: Optional[float] = None
    from_longitude: Optional[float] = None
    to_latitude: Optional[float] = None
    to_longitude: Optional[float] = None
    operation_time: Optional[datetime] = None
    quantity: float
    unit: str = "kg"
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    environment_notes: Optional[str] = None
    transport_mode: Optional[str] = None
    vehicle_number: Optional[str] = None
    driver_name: Optional[str] = None
    package_condition: Optional[str] = None
    seal_intact: Optional[bool] = None
    receiver_name: Optional[str] = None
    receiver_signature: Optional[str] = None
    photo_urls: Optional[Dict[str, Any]] = None
    scan_code: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class FlowRecordResponse(BaseModel):
    uid: str
    batch_uid: str
    operation_type: FlowOperation
    from_node: Optional[FlowNode]
    to_node: FlowNode
    from_node_name: Optional[str]
    to_node_name: str
    from_latitude: Optional[float]
    from_longitude: Optional[float]
    to_latitude: Optional[float]
    to_longitude: Optional[float]
    operator_uid: str
    operator_name: Optional[str]
    operation_time: datetime
    quantity: float
    unit: str
    temperature: Optional[float]
    humidity: Optional[float]
    environment_notes: Optional[str]
    transport_mode: Optional[str]
    vehicle_number: Optional[str]
    driver_name: Optional[str]
    package_condition: Optional[str]
    seal_intact: Optional[bool]
    receiver_name: Optional[str]
    receiver_signature: Optional[str]
    photo_urls: Optional[Dict[str, Any]]
    digital_timestamp: str
    scan_code: Optional[str]
    batch_number: int
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TraceabilityResponse(BaseModel):
    batch_info: Dict[str, Any]
    farming_info: Dict[str, Any]
    quality_info: Dict[str, Any]
    flow_info: Dict[str, Any]
    location_history: List[Dict[str, Any]]
    panoramic_map: Dict[str, Any]
    recall_status: str
    query_time: datetime


class RecallCreate(BaseModel):
    title: str
    description: str
    reason: str
    level: RecallLevel
    initiator_uid: str
    initiator_name: Optional[str] = None
    reason_category: Optional[str] = None
    affected_batch_uids: Optional[List[str]] = None
    total_quantity: Optional[float] = None
    unit: str = "kg"
    recall_deadline: Optional[datetime] = None
    compensation_required: bool = False
    compensation_amount: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


class RecallResponse(BaseModel):
    uid: str
    recall_code: str
    title: str
    description: str
    reason: str
    reason_category: Optional[str]
    level: RecallLevel
    initiator_uid: str
    initiator_name: Optional[str]
    approval_uid: Optional[str]
    approval_name: Optional[str]
    approval_time: Optional[datetime]
    status: RecallStatus
    total_quantity: Optional[float]
    unit: str
    recovered_quantity: float
    disposed_quantity: float
    recall_start_time: Optional[datetime]
    recall_deadline: Optional[datetime]
    recall_completed_time: Optional[datetime]
    compensation_required: bool
    compensation_amount: Optional[float]
    affected_products_count: int
    affected_stores_count: int
    affected_consumers_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LocateAffectedBatchesRequest(BaseModel):
    product_name: Optional[str] = None
    farm_name: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    batch_codes: Optional[List[str]] = None


class CompensationRecordResponse(BaseModel):
    uid: str
    compensation_code: str
    operation_type: CompensationType
    operation_uid: Optional[str]
    operation_description: Optional[str]
    batch_uid: Optional[str]
    initiator_uid: Optional[str]
    initiator_name: Optional[str]
    original_action: str
    original_parameters: Optional[Dict[str, Any]]
    error_message: str
    error_stack: Optional[str]
    error_code: Optional[str]
    status: CompensationStatus
    compensation_strategy: Optional[str]
    compensation_action: Optional[str]
    retry_count: int
    max_retries: int
    last_retry_time: Optional[datetime]
    next_retry_time: Optional[datetime]
    resolved_at: Optional[datetime]
    resolved_by_uid: Optional[str]
    resolved_by_name: Optional[str]
    resolution_notes: Optional[str]
    rollback_required: bool
    rollback_completed: bool
    rollback_action: Optional[str]
    success_message: Optional[str]
    priority: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CompensationStatisticsResponse(BaseModel):
    total_records: int
    status_counts: Dict[str, int]
    type_counts: Dict[str, int]
    total_retries: int
    pending_count: int
    success_count: int
    failed_count: int
    manually_resolved_count: int


class AcceptanceCriterionResponse(BaseModel):
    code: str
    name: str
    category: str
    description: str
    required: bool
    severity: str


class AcceptanceResultResponse(BaseModel):
    criterion_code: str
    criterion_name: str
    category: str
    passed: bool
    message: str
    details: Dict[str, Any]
    timestamp: datetime


class AcceptanceReportResponse(BaseModel):
    batch_uid: str
    batch_code: str
    overall_passed: bool
    passed_count: int
    failed_count: int
    required_failed_count: int
    success_rate: float
    results: List[AcceptanceResultResponse]
    generated_at: datetime


class StatusTransitionRequest(BaseModel):
    event: str
    context: Optional[Dict[str, Any]] = None


class StatusTransitionResponse(BaseModel):
    success: bool
    from_status: str
    to_status: Optional[str]
    message: str
    event: str
    error_code: Optional[str] = None


class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    errors: Optional[List[str]] = None
