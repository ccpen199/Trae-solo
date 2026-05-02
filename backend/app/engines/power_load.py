import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.models import Device, MeterData, EnergyPrediction, EnergySuggestion, CalculationLog, AuditLog
import json


class PowerLoadEngine:
    def __init__(self, db: Session):
        self.db = db
        self.engine_name = "Power-Load"
        self.model_version = "2.0.0"
    
    def generate_trace_id(self) -> str:
        return uuid.uuid4().hex
    
    def analyze_trend(self, device_id: int, hours: int = 24) -> Dict[str, Any]:
        trace_id = self.generate_trace_id()
        start_time = datetime.utcnow()
        
        end_time = datetime.utcnow()
        start_time_window = end_time - timedelta(hours=hours)
        
        historical_data = self.db.query(MeterData).filter(
            MeterData.device_id == device_id,
            MeterData.timestamp >= start_time_window,
            MeterData.timestamp <= end_time,
            MeterData.is_valid == True
        ).order_by(MeterData.timestamp.asc()).all()
        
        if len(historical_data) < 10:
            return {
                "status": "insufficient_data",
                "message": f"Not enough data points: {len(historical_data)} < 10"
            }
        
        power_values = [d.active_power for d in historical_data if d.active_power]
        
        avg_power = sum(power_values) / len(power_values) if power_values else 0
        max_power = max(power_values) if power_values else 0
        min_power = min(power_values) if power_values else 0
        std_dev = self._calculate_std_dev(power_values, avg_power)
        
        recent_values = power_values[-10:] if len(power_values) >= 10 else power_values
        recent_avg = sum(recent_values) / len(recent_values)
        trend = "stable"
        trend_strength = 0
        
        if len(recent_values) >= 5:
            first_half = recent_values[:5]
            second_half = recent_values[5:]
            first_avg = sum(first_half) / len(first_half)
            second_avg = sum(second_half) / len(second_half)
            
            change = (second_avg - first_avg) / first_avg if first_avg > 0 else 0
            
            if change > 0.1:
                trend = "rising"
                trend_strength = abs(change)
            elif change < -0.1:
                trend = "falling"
                trend_strength = abs(change)
        
        prediction_hours = 24
        predictions = self._generate_predictions(avg_power, trend, prediction_hours)
        
        anomalies = self._detect_anomalies(power_values, avg_power, std_dev)
        
        end_time_calc = datetime.utcnow()
        
        for idx, pred in enumerate(predictions):
            prediction_record = EnergyPrediction(
                device_id=device_id,
                prediction_type="load_forecast",
                prediction_time=datetime.utcnow(),
                target_time=pred["target_time"],
                predicted_value=pred["predicted_value"],
                confidence=random.uniform(0.85, 0.98),
                model_version=self.model_version,
                is_anomaly=pred.get("is_anomaly", False),
                anomaly_score=pred.get("anomaly_score"),
                anomaly_reason=pred.get("anomaly_reason"),
            )
            self.db.add(prediction_record)
        
        calc_log = CalculationLog(
            trace_id=trace_id,
            engine_name=self.engine_name,
            calculation_type="trend_analysis",
            start_time=start_time,
            end_time=end_time_calc,
            duration_ms=int((end_time_calc - start_time).total_seconds() * 1000),
            input_data=json.dumps({
                "device_id": device_id,
                "hours": hours,
                "data_points": len(historical_data)
            }),
            output_data=json.dumps({
                "avg_power": avg_power,
                "max_power": max_power,
                "trend": trend,
                "predictions_count": len(predictions),
                "anomalies_count": len(anomalies)
            }),
            status="success",
            model_version=self.model_version,
        )
        self.db.add(calc_log)
        
        self.db.commit()
        
        return {
            "trace_id": trace_id,
            "device_id": device_id,
            "analysis_period": {"start": start_time_window.isoformat(), "end": end_time.isoformat()},
            "statistics": {
                "avg_power": round(avg_power, 2),
                "max_power": round(max_power, 2),
                "min_power": round(min_power, 2),
                "std_dev": round(std_dev, 2),
                "data_points": len(historical_data)
            },
            "trend": {
                "direction": trend,
                "strength": round(trend_strength, 4),
                "recent_average": round(recent_avg, 2)
            },
            "predictions": predictions[:12],
            "anomalies": anomalies
        }
    
    def _calculate_std_dev(self, values: List[float], mean: float) -> float:
        if not values:
            return 0
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return variance ** 0.5
    
    def _generate_predictions(self, base_value: float, trend: str, hours: int) -> List[Dict]:
        predictions = []
        now = datetime.utcnow()
        
        for i in range(1, hours + 1):
            target_time = now + timedelta(hours=i)
            
            fluctuation = random.uniform(-0.15, 0.15)
            trend_factor = 1
            
            if trend == "rising":
                trend_factor = 1 + (i * 0.01)
            elif trend == "falling":
                trend_factor = 1 - (i * 0.01)
            
            hour_of_day = target_time.hour
            time_factor = 1
            if 9 <= hour_of_day <= 18:
                time_factor = 1.2
            elif 0 <= hour_of_day <= 6:
                time_factor = 0.7
            
            predicted_value = base_value * trend_factor * time_factor * (1 + fluctuation)
            
            is_anomaly = False
            anomaly_score = None
            anomaly_reason = None
            
            if predicted_value > base_value * 2.5:
                is_anomaly = True
                anomaly_score = (predicted_value - base_value * 2) / base_value
                anomaly_reason = "预测功率异常升高，可能存在补偿异常"
            elif predicted_value < base_value * 0.3:
                is_anomaly = True
                anomaly_score = (base_value * 0.3 - predicted_value) / base_value
                anomaly_reason = "预测功率异常降低，可能存在设备故障"
            
            predictions.append({
                "target_time": target_time,
                "predicted_value": round(predicted_value, 2),
                "is_anomaly": is_anomaly,
                "anomaly_score": anomaly_score,
                "anomaly_reason": anomaly_reason
            })
        
        return predictions
    
    def _detect_anomalies(self, values: List[float], mean: float, std_dev: float) -> List[Dict]:
        anomalies = []
        threshold = mean + 2 * std_dev
        
        for idx, value in enumerate(values):
            if value > threshold or value < mean - 2 * std_dev:
                anomalies.append({
                    "index": idx,
                    "value": round(value, 2),
                    "deviation": round(abs(value - mean), 2),
                    "type": "high" if value > threshold else "low"
                })
        
        return anomalies
    
    def generate_energy_suggestion(self, anomaly_data: Dict, device_id: int) -> Optional[EnergySuggestion]:
        trace_id = self.generate_trace_id()
        
        suggestion_no = f"ES-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{random.randint(1000, 9999)}"
        
        if anomaly_data.get("anomaly_reason") and "补偿异常" in anomaly_data["anomaly_reason"]:
            title = "功率因数补偿异常检测建议"
            content = f"""
检测到设备（ID: {device_id}）存在功率补偿异常情况：
- 预测功率异常值: {anomaly_data.get('predicted_value', 'N/A')} kW
- 异常分数: {round(anomaly_data.get('anomaly_score', 0), 4)}
- 检测时间: {datetime.utcnow().isoformat()}

建议措施：
1. 立即检查无功补偿装置运行状态
2. 验证功率因数控制器参数设置
3. 检查电容器组投切逻辑
4. 分析谐波含量是否超标
5. 联系运维人员进行现场检测

预估节能效益：如及时修复，预计可提升功率因数 0.1-0.15，降低线损 5-10%。
"""
            category = "功率补偿"
            estimated_saving = anomaly_data.get('predicted_value', 0) * 0.1
        else:
            title = "设备运行异常检测建议"
            content = f"""
检测到设备（ID: {device_id}）存在运行异常：
- 异常值: {anomaly_data.get('predicted_value', 'N/A')}
- 异常原因: {anomaly_data.get('anomaly_reason', '未知')}
- 检测时间: {datetime.utcnow().isoformat()}

建议措施：
1. 检查设备运行状态和参数
2. 验证传感器数据准确性
3. 排查是否存在负载突变
4. 必要时安排现场巡检
"""
            category = "运行异常"
            estimated_saving = 0
        
        suggestion = EnergySuggestion(
            suggestion_no=suggestion_no,
            source_type="Power-Load Prediction",
            title=title,
            content=content.strip(),
            category=category,
            estimated_saving=round(estimated_saving, 2) if estimated_saving else None,
            priority="high" if anomaly_data.get("anomaly_score", 0) > 0.5 else "medium",
            status="pending",
        )
        
        self.db.add(suggestion)
        
        calc_log = CalculationLog(
            trace_id=trace_id,
            engine_name=self.engine_name,
            calculation_type="suggestion_generation",
            start_time=datetime.utcnow(),
            end_time=datetime.utcnow(),
            input_data=json.dumps({
                "device_id": device_id,
                "anomaly_data": anomaly_data
            }),
            output_data=json.dumps({
                "suggestion_no": suggestion_no,
                "title": title
            }),
            status="success",
            model_version=self.model_version,
            related_record_id=suggestion.id,
            related_record_type="EnergySuggestion",
        )
        self.db.add(calc_log)
        
        self.db.commit()
        self.db.refresh(suggestion)
        
        return suggestion
