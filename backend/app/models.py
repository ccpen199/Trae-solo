from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class TimestampMixin:
    created_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    real_name = Column(String(50), nullable=False)
    role = Column(String(50), nullable=False)
    department = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime, nullable=True)

    operation_logs = relationship("OperationLog", back_populates="user")
    todo_tasks = relationship("TodoTask", back_populates="assigned_user", foreign_keys="TodoTask.assigned_to")
    inspections = relationship("Inspection", back_populates="operator", foreign_keys="Inspection.operator_id")
    bill_confirmations = relationship("BillConfirmation", back_populates="confirmer")


class Device(Base, TimestampMixin):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_code = Column(String(50), unique=True, index=True, nullable=False)
    device_name = Column(String(100), nullable=False)
    device_type = Column(String(50), nullable=False)
    location = Column(String(200), nullable=True)
    rated_power = Column(Float, nullable=True)
    status = Column(String(20), default="offline")
    last_online_at = Column(DateTime, nullable=True)
    protocol = Column(String(50), nullable=True)
    ip_address = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)

    meter_data = relationship("MeterData", back_populates="device")
    alarms = relationship("Alarm", back_populates="device")
    status_logs = relationship("DeviceStatusLog", back_populates="device")


class MeterData(Base, TimestampMixin):
    __tablename__ = "meter_data"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    active_power = Column(Float, nullable=True)
    reactive_power = Column(Float, nullable=True)
    voltage = Column(Float, nullable=True)
    current = Column(Float, nullable=True)
    power_factor = Column(Float, nullable=True)
    frequency = Column(Float, nullable=True)
    total_energy = Column(Float, nullable=True)
    data_source = Column(String(50), default="IoT-Stream")
    is_valid = Column(Boolean, default=True)
    validation_note = Column(Text, nullable=True)

    device = relationship("Device", back_populates="meter_data")

    __table_args__ = (
        Index('idx_meter_data_device_timestamp', 'device_id', 'timestamp'),
    )


class DeviceStatusLog(Base, TimestampMixin):
    __tablename__ = "device_status_logs"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False, index=True)
    from_status = Column(String(20), nullable=False)
    to_status = Column(String(20), nullable=False)
    reason = Column(Text, nullable=True)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    operator_name = Column(String(50), nullable=True)
    detail = Column(Text, nullable=True)

    device = relationship("Device", back_populates="status_logs")


class Alarm(Base, TimestampMixin):
    __tablename__ = "alarms"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True, index=True)
    alarm_type = Column(String(50), nullable=False, index=True)
    alarm_level = Column(String(20), default="warning")
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="active")
    triggered_at = Column(DateTime, nullable=False, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolve_note = Column(Text, nullable=True)
    source_data_id = Column(Integer, ForeignKey("meter_data.id"), nullable=True)
    trigger_reason = Column(Text, nullable=True)

    device = relationship("Device", back_populates="alarms")


class TodoTask(Base, TimestampMixin):
    __tablename__ = "todo_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_type = Column(String(50), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(20), default="medium")
    status = Column(String(20), default="pending")
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    due_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    completion_note = Column(Text, nullable=True)
    related_alarm_id = Column(Integer, ForeignKey("alarms.id"), nullable=True)
    suggestion_id = Column(Integer, ForeignKey("energy_suggestions.id"), nullable=True)

    assigned_user = relationship("User", back_populates="todo_tasks", foreign_keys=[assigned_to])


class Inspection(Base, TimestampMixin):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    inspection_no = Column(String(50), unique=True, index=True, nullable=False)
    alarm_id = Column(Integer, ForeignKey("alarms.id"), nullable=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="pending")
    priority = Column(String(20), default="high")
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    dispatched_at = Column(DateTime, nullable=True)
    accepted_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    recovery_record = Column(Text, nullable=True)
    recovery_images = Column(Text, nullable=True)
    cost = Column(Float, nullable=True)
    result_note = Column(Text, nullable=True)

    operator = relationship("User", back_populates="inspections", foreign_keys=[operator_id])


class EnergyPrediction(Base, TimestampMixin):
    __tablename__ = "energy_predictions"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True, index=True)
    prediction_type = Column(String(50), nullable=False)
    prediction_time = Column(DateTime, nullable=False, index=True)
    target_time = Column(DateTime, nullable=False, index=True)
    predicted_value = Column(Float, nullable=False)
    actual_value = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)
    model_version = Column(String(50), nullable=True)
    input_features = Column(Text, nullable=True)
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, nullable=True)
    anomaly_reason = Column(Text, nullable=True)


class EnergySuggestion(Base, TimestampMixin):
    __tablename__ = "energy_suggestions"

    id = Column(Integer, primary_key=True, index=True)
    suggestion_no = Column(String(50), unique=True, index=True, nullable=False)
    source_type = Column(String(50), nullable=False)
    source_id = Column(Integer, nullable=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), nullable=True)
    estimated_saving = Column(Float, nullable=True)
    priority = Column(String(20), default="medium")
    status = Column(String(20), default="pending")
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_note = Column(Text, nullable=True)
    implemented_at = Column(DateTime, nullable=True)
    implementation_result = Column(Text, nullable=True)
    actual_saving = Column(Float, nullable=True)


class Bill(Base, TimestampMixin):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    bill_no = Column(String(50), unique=True, index=True, nullable=False)
    billing_period = Column(String(50), nullable=False)
    billing_month = Column(String(20), nullable=False, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    total_energy = Column(Float, nullable=False)
    peak_energy = Column(Float, nullable=True)
    valley_energy = Column(Float, nullable=True)
    normal_energy = Column(Float, nullable=True)
    peak_rate = Column(Float, nullable=True)
    valley_rate = Column(Float, nullable=True)
    normal_rate = Column(Float, nullable=True)
    peak_amount = Column(Float, nullable=True)
    valley_amount = Column(Float, nullable=True)
    normal_amount = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=False)
    tax_amount = Column(Float, nullable=True)
    discount_amount = Column(Float, nullable=True)
    final_amount = Column(Float, nullable=False)
    status = Column(String(20), default="draft")
    generated_at = Column(DateTime, nullable=False)
    confirmed_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    tariff_model = Column(String(50), nullable=True)
    calculation_detail = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)


class BillConfirmation(Base, TimestampMixin):
    __tablename__ = "bill_confirmations"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=False, index=True)
    confirmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    confirmed_at = Column(DateTime, nullable=False)
    confirmation_note = Column(Text, nullable=True)
    is_approved = Column(Boolean, default=True)

    confirmer = relationship("User", back_populates="bill_confirmations")


class EnergyReport(Base, TimestampMixin):
    __tablename__ = "energy_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_no = Column(String(50), unique=True, index=True, nullable=False)
    report_type = Column(String(50), nullable=False)
    report_period = Column(String(50), nullable=False)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    total_energy = Column(Float, nullable=True)
    comparison_energy = Column(Float, nullable=True)
    change_percent = Column(Float, nullable=True)
    efficiency_score = Column(Float, nullable=True)
    anomalies_count = Column(Integer, default=0)
    alarms_count = Column(Integer, default=0)
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    generated_at = Column(DateTime, nullable=False)
    is_archived = Column(Boolean, default=False)


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    trace_id = Column(String(64), unique=True, index=True, nullable=False)
    category = Column(String(50), nullable=False, index=True)
    sub_category = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False)
    actor_type = Column(String(20), default="user")
    actor_id = Column(Integer, nullable=True)
    actor_name = Column(String(100), nullable=True)
    target_type = Column(String(50), nullable=True)
    target_id = Column(Integer, nullable=True)
    target_name = Column(String(200), nullable=True)
    before_value = Column(Text, nullable=True)
    after_value = Column(Text, nullable=True)
    detail = Column(Text, nullable=True)
    result = Column(String(20), default="success")
    error_message = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(200), nullable=True)
    source_module = Column(String(50), nullable=True)
    related_trace_id = Column(String(64), nullable=True)

    __table_args__ = (
        Index('idx_audit_logs_trace_time', 'trace_id', 'created_at'),
    )


class OperationLog(Base, TimestampMixin):
    __tablename__ = "operation_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    username = Column(String(50), nullable=False)
    module = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    target_id = Column(Integer, nullable=True)
    target_name = Column(String(200), nullable=True)
    detail = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(200), nullable=True)
    status = Column(String(20), default="success")
    error_message = Column(Text, nullable=True)

    user = relationship("User", back_populates="operation_logs")


class ProtocolLog(Base, TimestampMixin):
    __tablename__ = "protocol_logs"

    id = Column(Integer, primary_key=True, index=True)
    trace_id = Column(String(64), index=True, nullable=False)
    direction = Column(String(10), nullable=False)
    protocol = Column(String(50), nullable=False)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True, index=True)
    device_code = Column(String(50), nullable=True)
    command = Column(String(100), nullable=True)
    raw_data = Column(Text, nullable=True)
    parsed_data = Column(Text, nullable=True)
    data_length = Column(Integer, nullable=True)
    status = Column(String(20), default="success")
    error_message = Column(Text, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    source_ip = Column(String(50), nullable=True)
    destination_ip = Column(String(50), nullable=True)


class CalculationLog(Base, TimestampMixin):
    __tablename__ = "calculation_logs"

    id = Column(Integer, primary_key=True, index=True)
    trace_id = Column(String(64), index=True, nullable=False)
    engine_name = Column(String(50), nullable=False)
    calculation_type = Column(String(50), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    input_data = Column(Text, nullable=True)
    output_data = Column(Text, nullable=True)
    parameters = Column(Text, nullable=True)
    status = Column(String(20), default="success")
    error_message = Column(Text, nullable=True)
    model_version = Column(String(50), nullable=True)
    related_record_id = Column(Integer, nullable=True)
    related_record_type = Column(String(50), nullable=True)


class SystemConfig(Base, TimestampMixin):
    __tablename__ = "system_configs"

    id = Column(Integer, primary_key=True, index=True)
    config_key = Column(String(100), unique=True, index=True, nullable=False)
    config_value = Column(Text, nullable=True)
    config_type = Column(String(50), default="string")
    description = Column(Text, nullable=True)
    is_encrypted = Column(Boolean, default=False)
    module = Column(String(50), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
