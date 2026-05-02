from typing import Dict, List, Any, Optional
from enum import Enum
from datetime import datetime
import hashlib
import json


class FormStatus(str, Enum):
    DRAFT = "draft"
    DESIGNING = "designing"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class SubmissionStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class StateMachine:
    """状态机引擎 - 管理表单和提交数据的状态流转"""
    
    FORM_STATE_TRANSITIONS = {
        FormStatus.DRAFT: {
            "design": FormStatus.DESIGNING,
            "publish": FormStatus.PUBLISHED,
        },
        FormStatus.DESIGNING: {
            "publish": FormStatus.PUBLISHED,
            "save": FormStatus.DESIGNING,
            "archive": FormStatus.ARCHIVED,
        },
        FormStatus.PUBLISHED: {
            "unpublish": FormStatus.DESIGNING,
            "archive": FormStatus.ARCHIVED,
        },
        FormStatus.ARCHIVED: {
            "restore": FormStatus.DRAFT,
        }
    }
    
    SUBMISSION_STATE_TRANSITIONS = {
        SubmissionStatus.DRAFT: {
            "submit": SubmissionStatus.SUBMITTED,
            "save": SubmissionStatus.DRAFT,
            "withdraw": SubmissionStatus.WITHDRAWN,
        },
        SubmissionStatus.SUBMITTED: {
            "approve": SubmissionStatus.APPROVED,
            "reject": SubmissionStatus.REJECTED,
            "return": SubmissionStatus.DRAFT,
            "withdraw": SubmissionStatus.WITHDRAWN,
        },
        SubmissionStatus.APPROVED: {
            "return": SubmissionStatus.DRAFT,
        },
        SubmissionStatus.REJECTED: {
            "return": SubmissionStatus.DRAFT,
            "submit": SubmissionStatus.SUBMITTED,
        },
        SubmissionStatus.WITHDRAWN: {
            "resubmit": SubmissionStatus.DRAFT,
        }
    }
    
    @classmethod
    def can_transition_form(
        cls,
        current_status: str,
        trigger: str
    ) -> tuple[bool, Optional[str]]:
        transitions = cls.FORM_STATE_TRANSITIONS.get(current_status, {})
        if trigger in transitions:
            return True, transitions[trigger]
        return False, None
    
    @classmethod
    def can_transition_submission(
        cls,
        current_status: str,
        trigger: str
    ) -> tuple[bool, Optional[str]]:
        transitions = cls.SUBMISSION_STATE_TRANSITIONS.get(current_status, {})
        if trigger in transitions:
            return True, transitions[trigger]
        return False, None
    
    @classmethod
    def get_available_form_transitions(cls, current_status: str) -> List[str]:
        return list(cls.FORM_STATE_TRANSITIONS.get(current_status, {}).keys())
    
    @classmethod
    def get_available_submission_transitions(cls, current_status: str) -> List[str]:
        return list(cls.SUBMISSION_STATE_TRANSITIONS.get(current_status, {}).keys())


class RulesEngine:
    """分片校验规则引擎 - 执行数据校验和业务规则"""
    
    def __init__(self):
        self.validation_rules = {
            "required": self._validate_required,
            "email": self._validate_email,
            "phone": self._validate_phone,
            "minLength": self._validate_min_length,
            "maxLength": self._validate_max_length,
            "min": self._validate_min,
            "max": self._validate_max,
            "pattern": self._validate_pattern,
            "unique": self._validate_unique,
            "custom": self._validate_custom,
        }
    
    def validate_field(
        self,
        field_value: Any,
        field_config: Dict[str, Any],
        all_data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        result = {
            "valid": True,
            "errors": [],
            "warnings": []
        }
        
        all_data = all_data or {}
        
        for rule_name, rule_config in field_config.get("validation_rules", {}).items():
            if rule_name in self.validation_rules:
                validator = self.validation_rules[rule_name]
                rule_result = validator(field_value, rule_config, all_data)
                
                if not rule_result.get("valid", True):
                    result["valid"] = False
                    result["errors"].extend(rule_result.get("errors", []))
        
        if field_config.get("is_required", False):
            required_result = self._validate_required(field_value, True, all_data)
            if not required_result.get("valid", True):
                result["valid"] = False
                result["errors"].extend(required_result.get("errors", []))
        
        return result
    
    def validate_data(
        self,
        data: Dict[str, Any],
        fields_config: List[Dict[str, Any]],
        schema: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        result = {
            "valid": True,
            "field_errors": {},
            "global_errors": []
        }
        
        fields_map = {f.get("field_name"): f for f in fields_config}
        
        for field_name, field_value in data.items():
            if field_name not in fields_map:
                continue
            
            field_config = fields_map[field_name]
            field_result = self.validate_field(field_value, field_config, data)
            
            if not field_result["valid"]:
                result["valid"] = False
                result["field_errors"][field_name] = field_result["errors"]
        
        required_fields = schema.get("required", []) if schema else []
        for field_name in required_fields:
            if field_name not in data or data[field_name] is None or data[field_name] == "":
                if field_name not in result["field_errors"]:
                    result["field_errors"][field_name] = []
                result["field_errors"][field_name].append({
                    "rule": "required",
                    "message": f"{field_name} 为必填项"
                })
                result["valid"] = False
        
        return result
    
    def _validate_required(self, value: Any, config: Any, data: Dict) -> Dict:
        if value is None or value == "" or (isinstance(value, list) and len(value) == 0):
            return {
                "valid": False,
                "errors": [{"rule": "required", "message": "此字段为必填项"}]
            }
        return {"valid": True, "errors": []}
    
    def _validate_email(self, value: Any, config: Any, data: Dict) -> Dict:
        if not value:
            return {"valid": True, "errors": []}
        
        import re
        pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        if not re.match(pattern, str(value)):
            return {
                "valid": False,
                "errors": [{"rule": "email", "message": "请输入有效的邮箱地址"}]
            }
        return {"valid": True, "errors": []}
    
    def _validate_phone(self, value: Any, config: Any, data: Dict) -> Dict:
        if not value:
            return {"valid": True, "errors": []}
        
        import re
        pattern = r'^1[3-9]\d{9}$'
        if not re.match(pattern, str(value)):
            return {
                "valid": False,
                "errors": [{"rule": "phone", "message": "请输入有效的手机号码"}]
            }
        return {"valid": True, "errors": []}
    
    def _validate_min_length(self, value: Any, min_len: int, data: Dict) -> Dict:
        if not value:
            return {"valid": True, "errors": []}
        
        str_value = str(value)
        if len(str_value) < min_len:
            return {
                "valid": False,
                "errors": [{"rule": "minLength", "message": f"最小长度为 {min_len} 个字符"}]
            }
        return {"valid": True, "errors": []}
    
    def _validate_max_length(self, value: Any, max_len: int, data: Dict) -> Dict:
        if not value:
            return {"valid": True, "errors": []}
        
        str_value = str(value)
        if len(str_value) > max_len:
            return {
                "valid": False,
                "errors": [{"rule": "maxLength", "message": f"最大长度为 {max_len} 个字符"}]
            }
        return {"valid": True, "errors": []}
    
    def _validate_min(self, value: Any, min_val: float, data: Dict) -> Dict:
        if value is None or value == "":
            return {"valid": True, "errors": []}
        
        try:
            num_value = float(value)
            if num_value < min_val:
                return {
                    "valid": False,
                    "errors": [{"rule": "min", "message": f"最小值为 {min_val}"}]
                }
        except:
            return {
                "valid": False,
                "errors": [{"rule": "min", "message": "请输入有效数字"}]
            }
        return {"valid": True, "errors": []}
    
    def _validate_max(self, value: Any, max_val: float, data: Dict) -> Dict:
        if value is None or value == "":
            return {"valid": True, "errors": []}
        
        try:
            num_value = float(value)
            if num_value > max_val:
                return {
                    "valid": False,
                    "errors": [{"rule": "max", "message": f"最大值为 {max_val}"}]
                }
        except:
            return {
                "valid": False,
                "errors": [{"rule": "max", "message": "请输入有效数字"}]
            }
        return {"valid": True, "errors": []}
    
    def _validate_pattern(self, value: Any, pattern: str, data: Dict) -> Dict:
        if not value:
            return {"valid": True, "errors": []}
        
        import re
        if not re.match(pattern, str(value)):
            return {
                "valid": False,
                "errors": [{"rule": "pattern", "message": "格式不正确"}]
            }
        return {"valid": True, "errors": []}
    
    def _validate_unique(self, value: Any, config: Any, data: Dict) -> Dict:
        return {"valid": True, "errors": []}
    
    def _validate_custom(self, value: Any, config: Dict, data: Dict) -> Dict:
        try:
            expression = config.get("expression", "")
            if expression:
                result = eval(expression, {"value": value, "data": data, "__builtins__": {}})
                if not result:
                    return {
                        "valid": False,
                        "errors": [{"rule": "custom", "message": config.get("message", "校验失败")}]
                    }
        except Exception as e:
            return {
                "valid": False,
                "errors": [{"rule": "custom", "message": f"自定义规则执行错误: {str(e)}"}]
            }
        return {"valid": True, "errors": []}


class SignatureService:
    """数字签名服务 - 确保操作可追溯、可验证"""
    
    @classmethod
    def generate_signature(
        cls,
        data: Dict[str, Any],
        secret_key: str,
        timestamp: datetime = None
    ) -> str:
        timestamp = timestamp or datetime.utcnow()
        
        sign_data = {
            **data,
            "_timestamp": timestamp.isoformat()
        }
        
        sorted_keys = sorted(sign_data.keys())
        sign_string = "&".join([f"{k}={sign_data[k]}" for k in sorted_keys if sign_data[k] is not None])
        sign_string += f"&secret={secret_key}"
        
        signature = hashlib.sha256(sign_string.encode('utf-8')).hexdigest()
        return signature
    
    @classmethod
    def verify_signature(
        cls,
        data: Dict[str, Any],
        signature: str,
        secret_key: str
    ) -> bool:
        generated = cls.generate_signature(data, secret_key)
        return generated == signature


state_machine = StateMachine()
rules_engine = RulesEngine()
signature_service = SignatureService()
