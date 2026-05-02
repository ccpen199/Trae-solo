from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum


class UserRole(str, Enum):
    ENERGY_ADMIN = "energy_admin"
    MAINTENANCE_OPERATOR = "maintenance_operator"
    FINANCE_ACCOUNTANT = "finance_accountant"
    GOVERNMENT_REGULATOR = "government_regulator"
    ADMIN = "admin"


class UserCreate(BaseModel):
    username: str
    password: str
    real_name: str
    role: str
    department: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    username: str
    real_name: str
    role: str
    department: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    is_active: bool
    last_login_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class DeviceCreate(BaseModel):
    device_code: str
    device_name: str
    device_type: str
    location: Optional[str] = None
    rated_power: Optional[float] = None
    protocol: Optional[str] = None
    ip_address: Optional[str] = None
    description: Optional[str] = None


class DeviceResponse(BaseModel):
    id: int
    device_code: str
    device_name: str
    device_type: str
    location: Optional[str]
    rated_power: Optional[float]
    status: str
    last_online_at: Optional[datetime]
    protocol: Optional[str]
    ip_address: Optional[str]
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class MeterDataResponse(BaseModel):
    id: int
    device_id: int
    timestamp: datetime
    active_power: Optional[float]
    reactive_power: Optional[float]
    voltage: Optional[float]
    current: Optional[float]
    power_factor: Optional[float]
    frequency: Optional[float]
    total_energy: Optional[float]
    data_source: str

    class Config:
        from_attributes = True


class RealTimeDataResponse(BaseModel):
    timestamp: str
    active_power: Optional[float]
    voltage: Optional[float]
    current: Optional[float]
    power_factor: Optional[float]


class AlarmLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AlarmType(str, Enum):
    OVER_LOAD = "over_load"
    DEVICE_OFFLINE = "device_offline"
    VOLTAGE_ABNORMAL = "voltage_abnormal"
    POWER_FACTOR_LOW = "power_factor_low"
    TEMPERATURE_HIGH = "temperature_high"


class AlarmResponse(BaseModel):
    id: int
    device_id: Optional[int]
    alarm_type: str
    alarm_level: str
    title: str
    description: Optional[str]
    status: str
    triggered_at: datetime
    acknowledged_at: Optional[datetime]
    resolved_at: Optional[datetime]
    trigger_reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TodoTaskResponse(BaseModel):
    id: int
    task_type: str
    title: str
    description: Optional[str]
    priority: str
    status: str
    assigned_to: Optional[int]
    due_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class InspectionResponse(BaseModel):
    id: int
    inspection_no: str
    alarm_id: Optional[int]
    device_id: Optional[int]
    title: str
    description: Optional[str]
    status: str
    priority: str
    assigned_to: Optional[int]
    dispatched_at: Optional[datetime]
    accepted_at: Optional[datetime]
    completed_at: Optional[datetime]
    operator_id: Optional[int]
    recovery_record: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class InspectionCreate(BaseModel):
    alarm_id: Optional[int] = None
    device_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    priority: str = "high"
    assigned_to: Optional[int] = None


class InspectionUpdate(BaseModel):
    status: str
    recovery_record: Optional[str] = None
    result_note: Optional[str] = None
    cost: Optional[float] = None


class EnergySuggestionResponse(BaseModel):
    id: int
    suggestion_no: str
    source_type: str
    title: str
    content: str
    category: Optional[str]
    estimated_saving: Optional[float]
    priority: str
    status: str
    reviewed_at: Optional[datetime]
    implemented_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class BillResponse(BaseModel):
    id: int
    bill_no: str
    billing_period: str
    billing_month: str
    device_id: Optional[int]
    total_energy: float
    peak_energy: Optional[float]
    valley_energy: Optional[float]
    normal_energy: Optional[float]
    peak_rate: Optional[float]
    valley_rate: Optional[float]
    normal_rate: Optional[float]
    total_amount: float
    tax_amount: Optional[float]
    discount_amount: Optional[float]
    final_amount: float
    status: str
    generated_at: datetime
    confirmed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class BillConfirmRequest(BaseModel):
    note: Optional[str] = None


class EnergyReportResponse(BaseModel):
    id: int
    report_no: str
    report_type: str
    report_period: str
    start_time: datetime
    end_time: datetime
    title: str
    summary: Optional[str]
    total_energy: Optional[float]
    comparison_energy: Optional[float]
    change_percent: Optional[float]
    efficiency_score: Optional[float]
    anomalies_count: int
    alarms_count: int
    generated_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class TrendAnalysisResponse(BaseModel):
    trace_id: str
    device_id: int
    analysis_period: Dict[str, str]
    statistics: Dict[str, Any]
    trend: Dict[str, Any]
    predictions: List[Dict[str, Any]]
    anomalies: List[Dict[str, Any]]


class DashboardStats(BaseModel):
    total_devices: int
    online_devices: int
    offline_devices: int
    active_alarms: int
    today_energy: float
    month_energy: float
    efficiency_score: float
    pending_tasks: int


class AuditLogResponse(BaseModel):
    trace_id: str
    category: str
    sub_category: Optional[str]
    action: str
    actor_type: str
    actor_name: Optional[str]
    target_type: Optional[str]
    target_name: Optional[str]
    result: str
    detail: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class DeviceTimelineResponse(BaseModel):
    device_id: int
    period: Dict[str, str]
    timeline_count: int
    timeline: List[Dict[str, Any]]
    statistics: Dict[str, Any]


class ComplianceCheckResponse(BaseModel):
    check_time: str
    total_devices: int
    compliant_count: int
    non_compliant_count: int
    results: List[Dict[str, Any]]


class MonthlyStatistics(BaseModel):
    period: str
    devices_count: int
    bills_count: int
    total_energy: float
    total_amount: float
    final_amount: float
    status_summary: Dict[str, int]
