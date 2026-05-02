import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import Device, MeterData, ProtocolLog, CalculationLog, AuditLog
import json


class IoTStreamEngine:
    def __init__(self, db: Session):
        self.db = db
        self.engine_name = "IoT-Stream"
    
    def generate_trace_id(self) -> str:
        return uuid.uuid4().hex
    
    def simulate_meter_reading(self, device: Device) -> Dict[str, Any]:
        base_power = device.rated_power or 100.0
        fluctuation = random.uniform(-0.3, 0.3)
        active_power = base_power * (1 + fluctuation)
        
        return {
            "device_id": device.id,
            "device_code": device.device_code,
            "timestamp": datetime.utcnow(),
            "active_power": round(active_power, 2),
            "reactive_power": round(active_power * random.uniform(0.2, 0.4), 2),
            "voltage": round(220 + random.uniform(-5, 5), 1),
            "current": round(active_power / 220 * (1 + random.uniform(-0.1, 0.1)), 3),
            "power_factor": round(random.uniform(0.85, 0.98), 3),
            "frequency": round(50 + random.uniform(-0.2, 0.2), 2),
            "total_energy": round(random.uniform(1000, 10000), 2),
        }
    
    def collect_data(self, device: Device) -> Optional[MeterData]:
        trace_id = self.generate_trace_id()
        start_time = datetime.utcnow()
        
        protocol_log = ProtocolLog(
            trace_id=trace_id,
            direction="outbound",
            protocol=device.protocol or "Modbus-TCP",
            device_id=device.id,
            device_code=device.device_code,
            command="READ_HOLDING_REGISTERS",
            raw_data=f"01030000000A{random.randint(1000, 9999)}",
            status="success",
            source_ip="127.0.0.1",
            destination_ip=device.ip_address or "192.168.1.100",
        )
        self.db.add(protocol_log)
        
        try:
            reading = self.simulate_meter_reading(device)
            
            response_log = ProtocolLog(
                trace_id=trace_id,
                direction="inbound",
                protocol=device.protocol or "Modbus-TCP",
                device_id=device.id,
                device_code=device.device_code,
                command="READ_HOLDING_REGISTERS",
                raw_data=f"010314{random.randint(10000000000000, 99999999999999)}",
                parsed_data=json.dumps(reading, default=str),
                status="success",
                response_time_ms=random.randint(50, 200),
            )
            self.db.add(response_log)
            
            meter_data = MeterData(
                device_id=device.id,
                timestamp=reading["timestamp"],
                active_power=reading["active_power"],
                reactive_power=reading["reactive_power"],
                voltage=reading["voltage"],
                current=reading["current"],
                power_factor=reading["power_factor"],
                frequency=reading["frequency"],
                total_energy=reading["total_energy"],
                data_source=self.engine_name,
                is_valid=True,
            )
            self.db.add(meter_data)
            
            end_time = datetime.utcnow()
            calc_log = CalculationLog(
                trace_id=trace_id,
                engine_name=self.engine_name,
                calculation_type="data_collection",
                start_time=start_time,
                end_time=end_time,
                duration_ms=int((end_time - start_time).total_seconds() * 1000),
                input_data=json.dumps({"device_id": device.id, "device_code": device.device_code}),
                output_data=json.dumps(reading, default=str),
                status="success",
                related_record_id=meter_data.id,
                related_record_type="MeterData",
            )
            self.db.add(calc_log)
            
            self.db.commit()
            self.db.refresh(meter_data)
            
            return meter_data
            
        except Exception as e:
            error_log = ProtocolLog(
                trace_id=trace_id,
                direction="inbound",
                protocol=device.protocol or "Modbus-TCP",
                device_id=device.id,
                device_code=device.device_code,
                command="READ_HOLDING_REGISTERS",
                status="failed",
                error_message=str(e),
            )
            self.db.add(error_log)
            
            calc_log = CalculationLog(
                trace_id=trace_id,
                engine_name=self.engine_name,
                calculation_type="data_collection",
                start_time=start_time,
                end_time=datetime.utcnow(),
                status="failed",
                error_message=str(e),
            )
            self.db.add(calc_log)
            
            self.db.commit()
            return None
    
    def collect_all_devices(self) -> List[MeterData]:
        devices = self.db.query(Device).filter(Device.status == "online").all()
        results = []
        
        for device in devices:
            data = self.collect_data(device)
            if data:
                results.append(data)
        
        return results
    
    def get_realtime_data(self, device_id: int, limit: int = 60) -> List[Dict]:
        data = self.db.query(MeterData).filter(
            MeterData.device_id == device_id,
            MeterData.is_valid == True
        ).order_by(MeterData.timestamp.desc()).limit(limit).all()
        
        return [{
            "timestamp": d.timestamp.isoformat(),
            "active_power": d.active_power,
            "voltage": d.voltage,
            "current": d.current,
            "power_factor": d.power_factor,
        } for d in reversed(data)]
