import uuid
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import (
    Device, MeterData, Bill, BillConfirmation, SystemConfig,
    CalculationLog, AuditLog
)


class TariffModelEngine:
    def __init__(self, db: Session):
        self.db = db
        self.engine_name = "Tariff-Model"
        self.model_version = "1.5.0"
    
    def generate_trace_id(self) -> str:
        return uuid.uuid4().hex
    
    def get_tariff_config(self) -> Dict[str, Any]:
        default_config = {
            "peak_rate": 1.2,
            "valley_rate": 0.4,
            "normal_rate": 0.8,
            "peak_hours": [9, 10, 11, 14, 15, 16, 17, 18, 19, 20, 21],
            "valley_hours": [0, 1, 2, 3, 4, 5, 6],
            "tax_rate": 0.13,
            "阶梯费率": [
                {"threshold": 1000, "rate": 0.8},
                {"threshold": 3000, "rate": 0.9},
                {"threshold": float("inf"), "rate": 1.0}
            ]
        }
        
        try:
            config = self.db.query(SystemConfig).filter(
                SystemConfig.config_key == "tariff_config"
            ).first()
            
            if config and config.config_value:
                stored_config = json.loads(config.config_value)
                default_config.update(stored_config)
        except Exception:
            pass
        
        return default_config
    
    def classify_time_period(self, hour: int, config: Dict) -> str:
        if hour in config.get("peak_hours", []):
            return "peak"
        elif hour in config.get("valley_hours", []):
            return "valley"
        else:
            return "normal"
    
    def calculate_monthly_bill(self, device_id: int, year: int, month: int) -> Optional[Bill]:
        trace_id = self.generate_trace_id()
        start_time = datetime.utcnow()
        
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        meter_data = self.db.query(MeterData).filter(
            MeterData.device_id == device_id,
            MeterData.timestamp >= start_date,
            MeterData.timestamp < end_date,
            MeterData.is_valid == True
        ).order_by(MeterData.timestamp.asc()).all()
        
        if not meter_data:
            return None
        
        tariff_config = self.get_tariff_config()
        
        peak_energy = 0.0
        valley_energy = 0.0
        normal_energy = 0.0
        
        if len(meter_data) >= 2:
            for i in range(1, len(meter_data)):
                current = meter_data[i]
                previous = meter_data[i - 1]
                
                if current.total_energy and previous.total_energy:
                    energy_diff = current.total_energy - previous.total_energy
                    if energy_diff > 0:
                        hour = current.timestamp.hour
                        period = self.classify_time_period(hour, tariff_config)
                        
                        if period == "peak":
                            peak_energy += energy_diff
                        elif period == "valley":
                            valley_energy += energy_diff
                        else:
                            normal_energy += energy_diff
        
        if peak_energy == 0 and valley_energy == 0 and normal_energy == 0:
            if meter_data[-1].total_energy and meter_data[0].total_energy:
                total_energy = meter_data[-1].total_energy - meter_data[0].total_energy
                peak_energy = total_energy * 0.4
                valley_energy = total_energy * 0.3
                normal_energy = total_energy * 0.3
            else:
                total_energy = sum(d.active_power or 0 for d in meter_data) * (5 / 60)
                peak_energy = total_energy * 0.4
                valley_energy = total_energy * 0.3
                normal_energy = total_energy * 0.3
        
        total_energy = peak_energy + valley_energy + normal_energy
        
        peak_rate = tariff_config["peak_rate"]
        valley_rate = tariff_config["valley_rate"]
        normal_rate = tariff_config["normal_rate"]
        
        peak_amount = peak_energy * peak_rate
        valley_amount = valley_energy * valley_rate
        normal_amount = normal_energy * normal_rate
        
        total_amount = peak_amount + valley_amount + normal_amount
        
        tiered_rates = tariff_config.get("阶梯费率", [])
        discount_amount = 0
        if tiered_rates:
            remaining_energy = total_energy
            weighted_rate = 0
            for tier in tiered_rates:
                if remaining_energy > 0:
                    tier_energy = min(remaining_energy, tier["threshold"])
                    weighted_rate += tier_energy * tier["rate"]
                    remaining_energy -= tier["threshold"]
            
            if total_energy > 0:
                weighted_rate = weighted_rate / total_energy
                discount_amount = total_amount * (1 - weighted_rate)
        
        tax_rate = tariff_config.get("tax_rate", 0.13)
        tax_amount = (total_amount - discount_amount) * tax_rate
        final_amount = total_amount - discount_amount + tax_amount
        
        bill_no = f"BILL-{year}{month:02d}-{device_id}-{uuid.uuid4().hex[:6].upper()}"
        
        bill = Bill(
            bill_no=bill_no,
            billing_period=f"{year}年{month}月",
            billing_month=f"{year}-{month:02d}",
            device_id=device_id,
            total_energy=round(total_energy, 2),
            peak_energy=round(peak_energy, 2),
            valley_energy=round(valley_energy, 2),
            normal_energy=round(normal_energy, 2),
            peak_rate=peak_rate,
            valley_rate=valley_rate,
            normal_rate=normal_rate,
            peak_amount=round(peak_amount, 2),
            valley_amount=round(valley_amount, 2),
            normal_amount=round(normal_amount, 2),
            total_amount=round(total_amount, 2),
            tax_amount=round(tax_amount, 2),
            discount_amount=round(discount_amount, 2),
            final_amount=round(final_amount, 2),
            status="draft",
            generated_at=datetime.utcnow(),
            tariff_model=self.engine_name,
            calculation_detail=json.dumps({
                "tariff_config": tariff_config,
                "data_points": len(meter_data),
                "calculation_method": "分时电价 + 阶梯费率"
            }, default=str),
        )
        
        self.db.add(bill)
        
        end_time = datetime.utcnow()
        calc_log = CalculationLog(
            trace_id=trace_id,
            engine_name=self.engine_name,
            calculation_type="bill_calculation",
            start_time=start_time,
            end_time=end_time,
            duration_ms=int((end_time - start_time).total_seconds() * 1000),
            input_data=json.dumps({
                "device_id": device_id,
                "year": year,
                "month": month,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            }),
            output_data=json.dumps({
                "bill_no": bill_no,
                "total_energy": round(total_energy, 2),
                "total_amount": round(total_amount, 2),
                "final_amount": round(final_amount, 2)
            }),
            status="success",
            model_version=self.model_version,
            related_record_id=bill.id,
            related_record_type="Bill",
        )
        self.db.add(calc_log)
        
        self.db.commit()
        self.db.refresh(bill)
        
        return bill
    
    def confirm_bill(self, bill_id: int, user_id: int, note: str = None) -> Optional[Bill]:
        trace_id = self.generate_trace_id()
        start_time = datetime.utcnow()
        
        bill = self.db.query(Bill).filter(Bill.id == bill_id).first()
        if not bill:
            return None
        
        bill.status = "confirmed"
        bill.confirmed_at = datetime.utcnow()
        
        confirmation = BillConfirmation(
            bill_id=bill_id,
            confirmer_id=user_id,
            confirmed_at=datetime.utcnow(),
            confirmation_note=note,
            is_approved=True,
        )
        self.db.add(confirmation)
        
        end_time = datetime.utcnow()
        calc_log = CalculationLog(
            trace_id=trace_id,
            engine_name=self.engine_name,
            calculation_type="bill_confirmation",
            start_time=start_time,
            end_time=end_time,
            input_data=json.dumps({
                "bill_id": bill_id,
                "user_id": user_id
            }),
            output_data=json.dumps({
                "bill_no": bill.bill_no,
                "status": "confirmed"
            }),
            status="success",
            model_version=self.model_version,
            related_record_id=bill.id,
            related_record_type="Bill",
        )
        self.db.add(calc_log)
        
        self.db.commit()
        self.db.refresh(bill)
        
        return bill
    
    def get_monthly_statistics(self, year: int, month: int) -> Dict[str, Any]:
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        bills = self.db.query(Bill).filter(
            Bill.billing_month == f"{year}-{month:02d}",
            Bill.deleted_at == None
        ).all()
        
        devices = self.db.query(Device).filter(Device.deleted_at == None).all()
        
        total_energy = sum(b.total_energy or 0 for b in bills)
        total_amount = sum(b.total_amount or 0 for b in bills)
        final_amount = sum(b.final_amount or 0 for b in bills)
        
        confirmed_count = sum(1 for b in bills if b.status == "confirmed")
        pending_count = sum(1 for b in bills if b.status == "draft")
        
        return {
            "period": f"{year}年{month}月",
            "devices_count": len(devices),
            "bills_count": len(bills),
            "total_energy": round(total_energy, 2),
            "total_amount": round(total_amount, 2),
            "final_amount": round(final_amount, 2),
            "status_summary": {
                "confirmed": confirmed_count,
                "pending": pending_count,
                "total": len(bills)
            }
        }
