import uuid
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models import (
    Device, MeterData, Alarm, EnergyReport, AuditLog,
    OperationLog, ProtocolLog, CalculationLog, DeviceStatusLog,
    EnergyPrediction, TodoTask, Inspection
)


class EnergyAuditEngine:
    def __init__(self, db: Session):
        self.db = db
        self.engine_name = "Energy-Audit"
        self.model_version = "3.0.0"
    
    def generate_trace_id(self) -> str:
        return uuid.uuid4().hex
    
    def generate_energy_report(
        self, 
        report_type: str,
        start_time: datetime,
        end_time: datetime,
        title: str = None
    ) -> EnergyReport:
        trace_id = self.generate_trace_id()
        start_calc = datetime.utcnow()
        
        report_no = f"ER-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
        
        if not title:
            if report_type == "daily":
                title = f"{start_time.strftime('%Y年%m月%d日')}能耗日报"
            elif report_type == "weekly":
                title = f"{start_time.strftime('%Y年%m月%d日')}-{end_time.strftime('%m月%d日')}能耗周报"
            elif report_type == "monthly":
                title = f"{start_time.strftime('%Y年%m月')}能耗月报"
            else:
                title = f"{start_time.strftime('%Y%m%d')}-{end_time.strftime('%Y%m%d')}能耗报告"
        
        meter_data = self.db.query(MeterData).filter(
            MeterData.timestamp >= start_time,
            MeterData.timestamp < end_time,
            MeterData.is_valid == True,
            MeterData.deleted_at == None
        ).all()
        
        total_energy = 0.0
        if len(meter_data) >= 2:
            device_data = {}
            for d in meter_data:
                if d.device_id not in device_data:
                    device_data[d.device_id] = []
                device_data[d.device_id].append(d)
            
            for device_id, data_list in device_data.items():
                sorted_data = sorted(data_list, key=lambda x: x.timestamp)
                if sorted_data[-1].total_energy and sorted_data[0].total_energy:
                    total_energy += sorted_data[-1].total_energy - sorted_data[0].total_energy
        
        if total_energy == 0:
            total_energy = sum(d.active_power or 0 for d in meter_data) * (5 / 60)
        
        prev_start = start_time - (end_time - start_time)
        prev_meter_data = self.db.query(MeterData).filter(
            MeterData.timestamp >= prev_start,
            MeterData.timestamp < start_time,
            MeterData.is_valid == True,
            MeterData.deleted_at == None
        ).all()
        
        comparison_energy = 0.0
        if len(prev_meter_data) >= 2:
            device_data = {}
            for d in prev_meter_data:
                if d.device_id not in device_data:
                    device_data[d.device_id] = []
                device_data[d.device_id].append(d)
            
            for device_id, data_list in device_data.items():
                sorted_data = sorted(data_list, key=lambda x: x.timestamp)
                if sorted_data[-1].total_energy and sorted_data[0].total_energy:
                    comparison_energy += sorted_data[-1].total_energy - sorted_data[0].total_energy
        
        if comparison_energy == 0:
            comparison_energy = sum(d.active_power or 0 for d in prev_meter_data) * (5 / 60)
        
        change_percent = 0.0
        if comparison_energy > 0:
            change_percent = ((total_energy - comparison_energy) / comparison_energy) * 100
        
        alarms = self.db.query(Alarm).filter(
            Alarm.created_at >= start_time,
            Alarm.created_at < end_time,
            Alarm.deleted_at == None
        ).all()
        
        anomalies = self.db.query(EnergyPrediction).filter(
            EnergyPrediction.prediction_time >= start_time,
            EnergyPrediction.prediction_time < end_time,
            EnergyPrediction.is_anomaly == True,
            EnergyPrediction.deleted_at == None
        ).all()
        
        efficiency_score = self._calculate_efficiency_score(meter_data, alarms)
        
        content = self._generate_report_content(
            start_time, end_time, total_energy, comparison_energy,
            change_percent, alarms, anomalies, efficiency_score
        )
        
        summary = self._generate_summary(total_energy, comparison_energy, change_percent, len(alarms))
        
        report = EnergyReport(
            report_no=report_no,
            report_type=report_type,
            report_period=f"{start_time.strftime('%Y-%m-%d')} 至 {end_time.strftime('%Y-%m-%d')}",
            start_time=start_time,
            end_time=end_time,
            title=title,
            content=content,
            summary=summary,
            total_energy=round(total_energy, 2),
            comparison_energy=round(comparison_energy, 2) if comparison_energy else None,
            change_percent=round(change_percent, 2),
            efficiency_score=round(efficiency_score, 2),
            anomalies_count=len(anomalies),
            alarms_count=len(alarms),
            generated_at=datetime.utcnow(),
            is_archived=False,
        )
        
        self.db.add(report)
        
        end_calc = datetime.utcnow()
        calc_log = CalculationLog(
            trace_id=trace_id,
            engine_name=self.engine_name,
            calculation_type="report_generation",
            start_time=start_calc,
            end_time=end_calc,
            duration_ms=int((end_calc - start_calc).total_seconds() * 1000),
            input_data=json.dumps({
                "report_type": report_type,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat()
            }),
            output_data=json.dumps({
                "report_no": report_no,
                "title": title,
                "total_energy": round(total_energy, 2)
            }),
            status="success",
            model_version=self.model_version,
            related_record_id=report.id,
            related_record_type="EnergyReport",
        )
        self.db.add(calc_log)
        
        self.db.commit()
        self.db.refresh(report)
        
        return report
    
    def _calculate_efficiency_score(
        self, 
        meter_data: List[MeterData], 
        alarms: List[Alarm]
    ) -> float:
        if not meter_data:
            return 50.0
        
        power_factors = [d.power_factor for d in meter_data if d.power_factor]
        avg_pf = sum(power_factors) / len(power_factors) if power_factors else 0.85
        
        pf_score = min(100, avg_pf * 100) if avg_pf > 0 else 50
        
        active_alarms = sum(1 for a in alarms if a.status != "resolved")
        alarm_penalty = active_alarms * 10
        
        score = pf_score - alarm_penalty
        return max(0, min(100, score))
    
    def _generate_report_content(
        self,
        start_time: datetime,
        end_time: datetime,
        total_energy: float,
        comparison_energy: float,
        change_percent: float,
        alarms: List[Alarm],
        anomalies: List[EnergyPrediction],
        efficiency_score: float
    ) -> str:
        trend_icon = "↑" if change_percent > 0 else "↓" if change_percent < 0 else "→"
        trend_text = "上升" if change_percent > 0 else "下降" if change_percent < 0 else "持平"
        
        active_alarms = [a for a in alarms if a.status != "resolved"]
        resolved_alarms = [a for a in alarms if a.status == "resolved"]
        
        content = f"""
## 能耗概览

**报告周期**: {start_time.strftime('%Y年%m月%d日 %H:%M')} 至 {end_time.strftime('%Y年%m月%d日 %H:%M')}

### 核心指标
- **总能耗**: {round(total_energy, 2)} kWh
- **环比变化**: {trend_icon} {abs(round(change_percent, 2))}% ({trend_text})
- **能效评分**: {round(efficiency_score, 2)} 分
- **告警数量**: {len(alarms)} 个 (活跃: {len(active_alarms)}, 已处理: {len(resolved_alarms)})
- **异常检测**: {len(anomalies)} 个

### 详细分析

#### 1. 能耗趋势分析
本报告周期内总能耗为 {round(total_energy, 2)} kWh，与上一周期相比{trend_text}了 {abs(round(change_percent, 2))}%。

#### 2. 能效评估
当前能效评分为 {round(efficiency_score, 2)} 分，{'表现优秀' if efficiency_score >= 80 else '需要改进' if efficiency_score < 60 else '表现一般'}。

#### 3. 告警与异常
- 共产生告警 {len(alarms)} 个
- 活跃告警 {len(active_alarms)} 个，需要及时处理
- 检测到异常 {len(anomalies)} 个，建议关注

### 建议措施
1. {'优先处理活跃告警' if active_alarms else '当前无活跃告警'}
2. {'关注能耗上升趋势，查找原因' if change_percent > 10 else ''}
3. {'能效评分较低，建议进行能耗审计' if efficiency_score < 60 else ''}
4. 定期检查设备运行状态，确保功率因数达标
"""
        
        return content.strip()
    
    def _generate_summary(
        self,
        total_energy: float,
        comparison_energy: float,
        change_percent: float,
        alarms_count: int
    ) -> str:
        trend_text = "上升" if change_percent > 0 else "下降" if change_percent < 0 else "持平"
        
        summary = f"""本周期总能耗 {round(total_energy, 2)} kWh，环比{trend_text}{abs(round(change_percent, 2))}%。
共产生 {alarms_count} 个告警事件。
{'建议及时处理活跃告警，关注异常设备。' if alarms_count > 0 else '系统运行稳定，能耗表现正常。'}"""
        
        return summary.strip()
    
    def get_audit_trail(
        self,
        trace_id: str = None,
        category: str = None,
        start_time: datetime = None,
        end_time: datetime = None,
        limit: int = 100
    ) -> Dict[str, Any]:
        query = self.db.query(AuditLog).filter(AuditLog.deleted_at == None)
        
        if trace_id:
            query = query.filter(AuditLog.trace_id == trace_id)
        
        if category:
            query = query.filter(AuditLog.category == category)
        
        if start_time:
            query = query.filter(AuditLog.created_at >= start_time)
        
        if end_time:
            query = query.filter(AuditLog.created_at < end_time)
        
        logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
        
        return {
            "total": len(logs),
            "logs": [{
                "trace_id": log.trace_id,
                "category": log.category,
                "sub_category": log.sub_category,
                "action": log.action,
                "actor_type": log.actor_type,
                "actor_name": log.actor_name,
                "target_type": log.target_type,
                "target_name": log.target_name,
                "result": log.result,
                "detail": log.detail,
                "created_at": log.created_at.isoformat()
            } for log in logs]
        }
    
    def get_device_timeline(self, device_id: int, hours: int = 24) -> Dict[str, Any]:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        
        meter_data = self.db.query(MeterData).filter(
            MeterData.device_id == device_id,
            MeterData.timestamp >= start_time,
            MeterData.timestamp <= end_time,
            MeterData.is_valid == True
        ).order_by(MeterData.timestamp.asc()).all()
        
        status_logs = self.db.query(DeviceStatusLog).filter(
            DeviceStatusLog.device_id == device_id,
            DeviceStatusLog.created_at >= start_time,
            DeviceStatusLog.created_at <= end_time
        ).order_by(DeviceStatusLog.created_at.asc()).all()
        
        alarms = self.db.query(Alarm).filter(
            Alarm.device_id == device_id,
            Alarm.created_at >= start_time,
            Alarm.created_at <= end_time
        ).order_by(Alarm.created_at.asc()).all()
        
        protocol_logs = self.db.query(ProtocolLog).filter(
            ProtocolLog.device_id == device_id,
            ProtocolLog.created_at >= start_time,
            ProtocolLog.created_at <= end_time
        ).order_by(ProtocolLog.created_at.asc()).all()
        
        timeline = []
        
        for data in meter_data:
            timeline.append({
                "time": data.timestamp.isoformat(),
                "type": "meter_data",
                "data": {
                    "active_power": data.active_power,
                    "voltage": data.voltage,
                    "current": data.current
                }
            })
        
        for log in status_logs:
            timeline.append({
                "time": log.created_at.isoformat(),
                "type": "status_change",
                "data": {
                    "from": log.from_status,
                    "to": log.to_status,
                    "reason": log.reason,
                    "operator": log.operator_name
                }
            })
        
        for alarm in alarms:
            timeline.append({
                "time": alarm.triggered_at.isoformat() if alarm.triggered_at else alarm.created_at.isoformat(),
                "type": "alarm",
                "data": {
                    "id": alarm.id,
                    "type": alarm.alarm_type,
                    "level": alarm.alarm_level,
                    "title": alarm.title,
                    "status": alarm.status
                }
            })
        
        for log in protocol_logs:
            timeline.append({
                "time": log.created_at.isoformat(),
                "type": "protocol",
                "data": {
                    "direction": log.direction,
                    "protocol": log.protocol,
                    "command": log.command,
                    "status": log.status
                }
            })
        
        timeline.sort(key=lambda x: x["time"])
        
        return {
            "device_id": device_id,
            "period": {"start": start_time.isoformat(), "end": end_time.isoformat()},
            "timeline_count": len(timeline),
            "timeline": timeline,
            "statistics": {
                "meter_data_points": len(meter_data),
                "status_changes": len(status_logs),
                "alarms": len(alarms),
                "protocol_interactions": len(protocol_logs)
            }
        }
    
    def check_efficiency_compliance(self, device_id: int = None) -> Dict[str, Any]:
        query = self.db.query(Device).filter(Device.deleted_at == None)
        
        if device_id:
            query = query.filter(Device.id == device_id)
        
        devices = query.all()
        
        compliance_results = []
        
        for device in devices:
            recent_data = self.db.query(MeterData).filter(
                MeterData.device_id == device.id,
                MeterData.is_valid == True,
                MeterData.deleted_at == None
            ).order_by(MeterData.timestamp.desc()).limit(100).all()
            
            if not recent_data:
                compliance_results.append({
                    "device_id": device.id,
                    "device_name": device.device_name,
                    "status": "insufficient_data",
                    "message": "无足够数据进行合规检查"
                })
                continue
            
            power_factors = [d.power_factor for d in recent_data if d.power_factor]
            avg_pf = sum(power_factors) / len(power_factors) if power_factors else 0
            
            voltages = [d.voltage for d in recent_data if d.voltage]
            over_voltage_count = sum(1 for v in voltages if v > 242)
            under_voltage_count = sum(1 for v in voltages if v < 198)
            
            is_compliant = True
            issues = []
            
            if avg_pf < 0.9:
                is_compliant = False
                issues.append({
                    "type": "power_factor",
                    "severity": "high",
                    "message": f"功率因数过低: {round(avg_pf, 3)} (要求 >= 0.9)"
                })
            
            if over_voltage_count > len(voltages) * 0.1:
                is_compliant = False
                issues.append({
                    "type": "over_voltage",
                    "severity": "medium",
                    "message": f"过压次数过多: {over_voltage_count} 次"
                })
            
            if under_voltage_count > len(voltages) * 0.1:
                is_compliant = False
                issues.append({
                    "type": "under_voltage",
                    "severity": "medium",
                    "message": f"欠压次数过多: {under_voltage_count} 次"
                })
            
            compliance_results.append({
                "device_id": device.id,
                "device_name": device.device_name,
                "device_code": device.device_code,
                "status": "compliant" if is_compliant else "non_compliant",
                "metrics": {
                    "avg_power_factor": round(avg_pf, 3),
                    "over_voltage_count": over_voltage_count,
                    "under_voltage_count": under_voltage_count,
                    "data_points": len(recent_data)
                },
                "issues": issues
            })
        
        return {
            "check_time": datetime.utcnow().isoformat(),
            "total_devices": len(compliance_results),
            "compliant_count": sum(1 for r in compliance_results if r["status"] == "compliant"),
            "non_compliant_count": sum(1 for r in compliance_results if r["status"] == "non_compliant"),
            "results": compliance_results
        }
