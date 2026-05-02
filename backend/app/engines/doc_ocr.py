from typing import Dict, Any, Optional, List
from datetime import datetime
import random
import hashlib


class DocOCREngine:
    """
    Doc-OCR 识别引擎
    负责文档光学字符识别和核验，包括：
    - 身份证识别核验
    - 表单字段提取
    - 证件真实性校验
    - OCR结果置信度评估
    """

    DOCUMENT_TYPES = {
        "IDENTITY": {
            "name": "居民身份证",
            "required_fields": ["id_number", "name", "gender", "ethnicity", "birth_date", "address", "issuing_authority", "valid_period"],
            "validation_rules": {
                "id_number": r"^\d{17}[\dXx]$",
            },
        },
        "HOUSEHOLD_REGISTER": {
            "name": "户口本",
            "required_fields": ["household_number", "household_head", "address", "members"],
        },
        "APPLICATION_FORM": {
            "name": "申请表",
            "required_fields": ["applicant_name", "applicant_id", "application_item", "signature"],
        },
        "INVOICE": {
            "name": "发票",
            "required_fields": ["invoice_number", "invoice_date", "amount", "tax_amount", "seller_info", "buyer_info"],
        },
        "DIAGNOSIS": {
            "name": "诊断证明",
            "required_fields": ["patient_name", "diagnosis", "doctor_name", "hospital_stamp", "date"],
        },
        "MIGRATION_PROOF": {
            "name": "迁移证明",
            "required_fields": ["migrant_name", "from_address", "to_address", "reason", "issuing_authority", "date"],
        },
        "SUPPORTING_DOC": {
            "name": "证明材料",
            "required_fields": ["title", "content", "issuing_authority", "date"],
        },
    }

    MOCK_OCR_DATA = {
        "IDENTITY": {
            "id_number": "110101199001011234",
            "name": "张三",
            "gender": "男",
            "ethnicity": "汉",
            "birth_date": "1990-01-01",
            "address": "北京市东城区某某街道123号",
            "issuing_authority": "北京市公安局东城分局",
            "valid_period": "2020.01.01-2040.01.01",
        },
        "HOUSEHOLD_REGISTER": {
            "household_number": "11010120200101001",
            "household_head": "张三",
            "address": "北京市东城区某某街道123号",
            "members": [
                {"name": "张三", "relation": "户主", "id_number": "110101199001011234"},
                {"name": "李四", "relation": "配偶", "id_number": "110101199202024321"},
            ],
        },
        "APPLICATION_FORM": {
            "applicant_name": "张三",
            "applicant_id": "110101199001011234",
            "application_item": "户口迁移登记",
            "application_reason": "工作调动",
            "signature": "张三",
            "date": "2024-01-15",
        },
        "INVOICE": {
            "invoice_number": "1100202401150001234",
            "invoice_code": "1100202401",
            "invoice_date": "2024-01-15",
            "amount": 1580.00,
            "tax_amount": 94.80,
            "total_amount": 1674.80,
            "seller_info": {
                "name": "北京市某某医院",
                "tax_id": "91110000MA001ABC12",
            },
            "buyer_info": {
                "name": "张三",
                "id_number": "110101199001011234",
            },
            "items": [
                {"name": "门诊诊疗费", "quantity": 1, "price": 50.00},
                {"name": "检查费", "quantity": 2, "price": 350.00},
                {"name": "药品费", "quantity": 1, "price": 830.00},
            ],
        },
        "DIAGNOSIS": {
            "patient_name": "张三",
            "patient_id": "110101199001011234",
            "gender": "男",
            "age": 34,
            "diagnosis": "急性上呼吸道感染",
            "symptoms": "发热、咳嗽、流涕3天",
            "treatment": "1. 休息；2. 对症治疗；3. 随诊",
            "doctor_name": "王医生",
            "department": "内科",
            "hospital_stamp": "北京市某某医院诊断专用章",
            "date": "2024-01-15",
        },
        "MIGRATION_PROOF": {
            "migrant_name": "张三",
            "migrant_id": "110101199001011234",
            "from_address": "北京市东城区某某街道123号",
            "to_address": "北京市朝阳区某某路456号",
            "reason": "工作调动",
            "issuing_authority": "北京市公安局东城分局",
            "valid_period": "2024-01-15至2024-04-14",
            "date": "2024-01-15",
        },
        "SUPPORTING_DOC": {
            "title": "在职证明",
            "content": "兹证明张三（身份证号：110101199001011234）为我单位正式员工，自2020年1月起在我单位工作，现任技术部主管职务。",
            "issuing_authority": "北京某某科技有限公司",
            "contact": "人事部 李女士 010-12345678",
            "date": "2024-01-15",
        },
    }

    async def process_document(
        self,
        file_path: str,
        document_type: str,
        file_name: str,
    ) -> Dict[str, Any]:
        """
        处理文档，执行OCR识别和核验
        返回：{
            "status": "SUCCESS" | "PARTIAL" | "FAILED",
            "ocr_result": dict,
            "confidence": float,
            "validation_errors": list,
            "message": str
        }
        """
        mock_data = self.MOCK_OCR_DATA.get(document_type, {})
        
        if not mock_data:
            return {
                "status": "FAILED",
                "ocr_result": {},
                "confidence": 0.0,
                "validation_errors": [{"field": "document_type", "message": f"不支持的文档类型: {document_type}"}],
                "message": "文档类型不支持",
            }

        confidence = self._calculate_confidence(file_name, document_type)
        doc_config = self.DOCUMENT_TYPES.get(document_type, {})
        required_fields = doc_config.get("required_fields", [])

        validation_errors = []
        extracted_fields = {}

        for field in required_fields:
            if field in mock_data:
                if confidence > 0.7:
                    extracted_fields[field] = mock_data[field]
                elif confidence > 0.4:
                    extracted_fields[field] = mock_data[field]
                    validation_errors.append({
                        "field": field,
                        "message": f"字段 {field} 识别置信度较低，建议人工核验",
                        "severity": "warning",
                    })
                else:
                    validation_errors.append({
                        "field": field,
                        "message": f"字段 {field} 无法识别，请重新上传清晰图片",
                        "severity": "error",
                    })
            else:
                validation_errors.append({
                    "field": field,
                    "message": f"缺少必填字段 {field}",
                    "severity": "error",
                })

        has_errors = any(e["severity"] == "error" for e in validation_errors)
        has_warnings = any(e["severity"] == "warning" for e in validation_errors)

        if has_errors:
            status = "FAILED"
            message = "OCR识别失败，存在无法识别的字段"
        elif has_warnings:
            status = "PARTIAL"
            message = "OCR识别完成，部分字段置信度较低，建议人工核验"
        else:
            status = "SUCCESS"
            message = "OCR识别成功"

        return {
            "status": status,
            "ocr_result": {
                "document_type": document_type,
                "extracted_fields": extracted_fields,
                "raw_text": self._generate_raw_text(extracted_fields, document_type),
            },
            "confidence": confidence,
            "validation_errors": validation_errors,
            "message": message,
            "processed_at": datetime.utcnow().isoformat(),
        }

    def _calculate_confidence(self, file_name: str, document_type: str) -> float:
        """计算OCR置信度（模拟）"""
        seed = hashlib.md5(f"{file_name}{document_type}".encode()).hexdigest()
        random.seed(int(seed[:8], 16))
        
        base_confidence = random.uniform(0.6, 0.98)
        
        file_name_lower = file_name.lower()
        if any(x in file_name_lower for x in ["scan", "scanned", "扫描", "高清"]):
            base_confidence = min(0.99, base_confidence + 0.1)
        elif any(x in file_name_lower for x in ["photo", "拍照", "手机"]):
            base_confidence = max(0.3, base_confidence - 0.15)
        elif any(x in file_name_lower for x in ["blur", "模糊", "dark", "暗"]):
            base_confidence = max(0.2, base_confidence - 0.3)

        return round(base_confidence, 2)

    def _generate_raw_text(self, extracted_fields: Dict, document_type: str) -> str:
        """生成模拟的原始识别文本"""
        doc_name = self.DOCUMENT_TYPES.get(document_type, {}).get("name", "文档")
        
        lines = [f"{'='*40}", f"{doc_name}", f"{'='*40}"]
        
        for key, value in extracted_fields.items():
            if isinstance(value, list):
                lines.append(f"\n{key.replace('_', ' ').upper()}:")
                for idx, item in enumerate(value, 1):
                    if isinstance(item, dict):
                        lines.append(f"  {idx}. " + "; ".join(f"{k}: {v}" for k, v in item.items()))
                    else:
                        lines.append(f"  {idx}. {item}")
            elif isinstance(value, dict):
                lines.append(f"\n{key.replace('_', ' ').upper()}:")
                for k, v in value.items():
                    lines.append(f"  {k.replace('_', ' ')}: {v}")
            else:
                lines.append(f"{key.replace('_', ' ').upper()}: {value}")
        
        lines.append(f"\n{'='*40}")
        lines.append(f"OCR识别时间: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return "\n".join(lines)

    def validate_id_number(self, id_number: str) -> Dict[str, Any]:
        """验证身份证号码"""
        if not id_number:
            return {"valid": False, "message": "身份证号为空"}
        
        id_number = id_number.upper()
        
        if len(id_number) != 18:
            return {"valid": False, "message": "身份证号长度错误"}
        
        if not id_number[:17].isdigit() or id_number[17] not in "0123456789X":
            return {"valid": False, "message": "身份证号格式错误"}
        
        weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
        check_codes = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"]
        
        total = sum(int(id_number[i]) * weights[i] for i in range(17))
        check_index = total % 11
        
        if id_number[17] != check_codes[check_index]:
            return {"valid": False, "message": "身份证号校验码错误"}
        
        birth_year = int(id_number[6:10])
        birth_month = int(id_number[10:12])
        birth_day = int(id_number[12:14])
        
        current_year = datetime.now().year
        if birth_year < 1900 or birth_year > current_year:
            return {"valid": False, "message": "出生年份无效"}
        if birth_month < 1 or birth_month > 12:
            return {"valid": False, "message": "出生月份无效"}
        if birth_day < 1 or birth_day > 31:
            return {"valid": False, "message": "出生日期无效"}
        
        gender = int(id_number[16])
        gender_text = "男" if gender % 2 == 1 else "女"
        
        return {
            "valid": True,
            "message": "身份证号校验通过",
            "info": {
                "birth_date": f"{birth_year}-{birth_month:02d}-{birth_day:02d}",
                "gender": gender_text,
                "age": current_year - birth_year,
            },
        }
