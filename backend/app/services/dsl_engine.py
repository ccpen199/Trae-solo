from typing import Dict, List, Any, Optional, Callable
from datetime import datetime
import json
import re


class DSLEngine:
    """Logic-DSL 编排引擎 - 负责解析和执行业务逻辑"""
    
    def __init__(self):
        self.operators = {
            "eq": self._op_eq,
            "ne": self._op_ne,
            "gt": self._op_gt,
            "lt": self._op_lt,
            "ge": self._op_ge,
            "le": self._op_le,
            "and": self._op_and,
            "or": self._op_or,
            "not": self._op_not,
            "in": self._op_in,
            "contains": self._op_contains,
            "startsWith": self._op_starts_with,
            "endsWith": self._op_ends_with,
            "isEmpty": self._op_is_empty,
            "isNotEmpty": self._op_is_not_empty,
        }
        
        self.actions = {
            "show": self._action_show,
            "hide": self._action_hide,
            "enable": self._action_enable,
            "disable": self._action_disable,
            "setRequired": self._action_set_required,
            "setOptional": self._action_set_optional,
            "setValue": self._action_set_value,
            "calculate": self._action_calculate,
            "validate": self._action_validate,
            "sendNotification": self._action_send_notification,
            "webhook": self._action_webhook,
        }
    
    @classmethod
    def parse_dsl(cls, dsl_code: str) -> Dict[str, Any]:
        try:
            dsl = json.loads(dsl_code)
            return dsl
        except json.JSONDecodeError:
            return cls._parse_legacy_dsl(dsl_code)
    
    @classmethod
    def _parse_legacy_dsl(cls, code: str) -> Dict[str, Any]:
        try:
            lines = [line.strip() for line in code.strip().split('\n') if line.strip()]
            result = {
                "rules": [],
                "actions": []
            }
            
            current_rule = None
            current_actions = []
            
            for line in lines:
                if line.startswith("IF"):
                    if current_rule:
                        result["rules"].append({
                            "condition": current_rule,
                            "actions": current_actions
                        })
                    condition_part = line[2:].strip()
                    if condition_part.startswith("(") and condition_part.endswith(")"):
                        condition_part = condition_part[1:-1].strip()
                    current_rule = cls._parse_condition(condition_part)
                    current_actions = []
                elif line.startswith("THEN"):
                    action_part = line[4:].strip()
                    if current_rule:
                        current_actions.append(cls._parse_action(action_part))
            
            if current_rule:
                result["rules"].append({
                    "condition": current_rule,
                    "actions": current_actions
                })
            
            return result
        except Exception as e:
            return {"rules": [], "actions": [], "error": str(e)}
    
    @classmethod
    def _parse_condition(cls, condition: str) -> Dict[str, Any]:
        condition = condition.strip()
        
        if " AND " in condition:
            parts = condition.split(" AND ")
            return {
                "operator": "and",
                "conditions": [cls._parse_single_condition(p.strip()) for p in parts]
            }
        elif " OR " in condition:
            parts = condition.split(" OR ")
            return {
                "operator": "or",
                "conditions": [cls._parse_single_condition(p.strip()) for p in parts]
            }
        
        return cls._parse_single_condition(condition)
    
    @classmethod
    def _parse_single_condition(cls, condition: str) -> Dict[str, Any]:
        match = re.match(r'(\w+)\s*([!=<>]+|contains|startsWith|endsWith|in)\s*(.+)', condition)
        if match:
            field, op, value = match.groups()
            value = value.strip()
            
            if value.startswith(("'", '"')) and value.endswith(("'", '"')):
                value = value[1:-1]
            elif value == "true":
                value = True
            elif value == "false":
                value = False
            elif re.match(r'^\d+$', value):
                value = int(value)
            elif re.match(r'^\d+\.\d+$', value):
                value = float(value)
            elif value.startswith("[") and value.endswith("]"):
                try:
                    value = json.loads(value)
                except:
                    pass
            
            op_map = {
                "==": "eq",
                "!=": "ne",
                ">": "gt",
                "<": "lt",
                ">=": "ge",
                "<=": "le",
                "contains": "contains",
                "startsWith": "startsWith",
                "endsWith": "endsWith",
                "in": "in",
            }
            
            return {
                "field": field,
                "operator": op_map.get(op, op),
                "value": value
            }
        
        return {"operator": "true"}
    
    @classmethod
    def _parse_action(cls, action: str) -> Dict[str, Any]:
        match = re.match(r'(\w+)\((.*?)\)', action)
        if match:
            action_name, args_str = match.groups()
            args = []
            if args_str:
                for arg in args_str.split(','):
                    arg = arg.strip()
                    if arg.startswith(("'", '"')) and arg.endswith(("'", '"')):
                        args.append(arg[1:-1])
                    else:
                        args.append(arg)
            
            return {
                "action": action_name,
                "args": args
            }
        return {"action": action, "args": []}
    
    def evaluate_condition(
        self,
        condition: Dict[str, Any],
        data: Dict[str, Any]
    ) -> bool:
        if not condition:
            return True
        
        op = condition.get("operator")
        
        if op in self.operators:
            return self.operators[op](condition, data)
        
        if op == "and":
            return all(self.evaluate_condition(c, data) for c in condition.get("conditions", []))
        if op == "or":
            return any(self.evaluate_condition(c, data) for c in condition.get("conditions", []))
        
        return True
    
    def execute_logic(
        self,
        logic_def: Dict[str, Any],
        data: Dict[str, Any],
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        results = {
            "triggered": [],
            "state_changes": {},
            "validations": [],
            "notifications": [],
        }
        
        context = context or {}
        
        for rule in logic_def.get("rules", []):
            condition = rule.get("condition", {})
            actions = rule.get("actions", [])
            
            if self.evaluate_condition(condition, data):
                results["triggered"].append(rule)
                
                for action in actions:
                    action_type = action.get("action")
                    args = action.get("args", [])
                    
                    if action_type in self.actions:
                        action_result = self.actions[action_type](args, data, context)
                        
                        if action_type == "validate":
                            results["validations"].append(action_result)
                        elif action_type == "sendNotification":
                            results["notifications"].append(action_result)
                        elif "field" in action_result:
                            results["state_changes"][action_result["field"]] = action_result
        
        return results
    
    def validate_data(
        self,
        logic_def: Dict[str, Any],
        data: Dict[str, Any],
        schema: Dict[str, Any]
    ) -> Dict[str, Any]:
        results = {
            "valid": True,
            "errors": [],
            "warnings": []
        }
        
        required_fields = schema.get("required", [])
        for field in required_fields:
            if field not in data or data[field] is None or data[field] == "":
                results["valid"] = False
                results["errors"].append({
                    "field": field,
                    "message": f"{field} 为必填项"
                })
        
        properties = schema.get("properties", {})
        for field, value in data.items():
            if field not in properties:
                continue
            
            field_schema = properties[field]
            
            if field_schema.get("type") == "number":
                if value is not None and not isinstance(value, (int, float)):
                    results["valid"] = False
                    results["errors"].append({
                        "field": field,
                        "message": f"{field} 必须是数字类型"
                    })
            
            if "enum" in field_schema:
                enum_values = field_schema["enum"]
                if value is not None and value not in enum_values:
                    results["valid"] = False
                    results["errors"].append({
                        "field": field,
                        "message": f"{field} 的值必须在允许的范围内: {enum_values}"
                    })
            
            if "minLength" in field_schema:
                if isinstance(value, str) and len(value) < field_schema["minLength"]:
                    results["valid"] = False
                    results["errors"].append({
                        "field": field,
                        "message": f"{field} 的最小长度为 {field_schema['minLength']}"
                    })
            
            if "maxLength" in field_schema:
                if isinstance(value, str) and len(value) > field_schema["maxLength"]:
                    results["valid"] = False
                    results["errors"].append({
                        "field": field,
                        "message": f"{field} 的最大长度为 {field_schema['maxLength']}"
                    })
        
        if "rules" in logic_def:
            logic_results = self.execute_logic(logic_def, data)
            for validation in logic_results.get("validations", []):
                if not validation.get("valid", True):
                    results["valid"] = False
                    results["errors"].append(validation.get("error", {}))
        
        return results
    
    def _op_eq(self, cond: Dict, data: Dict) -> bool:
        field_value = data.get(cond.get("field"))
        return field_value == cond.get("value")
    
    def _op_ne(self, cond: Dict, data: Dict) -> bool:
        field_value = data.get(cond.get("field"))
        return field_value != cond.get("value")
    
    def _op_gt(self, cond: Dict, data: Dict) -> bool:
        field_value = data.get(cond.get("field"))
        cmp_value = cond.get("value")
        try:
            return float(field_value) > float(cmp_value)
        except:
            return False
    
    def _op_lt(self, cond: Dict, data: Dict) -> bool:
        field_value = data.get(cond.get("field"))
        cmp_value = cond.get("value")
        try:
            return float(field_value) < float(cmp_value)
        except:
            return False
    
    def _op_ge(self, cond: Dict, data: Dict) -> bool:
        field_value = data.get(cond.get("field"))
        cmp_value = cond.get("value")
        try:
            return float(field_value) >= float(cmp_value)
        except:
            return False
    
    def _op_le(self, cond: Dict, data: Dict) -> bool:
        field_value = data.get(cond.get("field"))
        cmp_value = cond.get("value")
        try:
            return float(field_value) <= float(cmp_value)
        except:
            return False
    
    def _op_and(self, cond: Dict, data: Dict) -> bool:
        conditions = cond.get("conditions", [])
        return all(self.evaluate_condition(c, data) for c in conditions)
    
    def _op_or(self, cond: Dict, data: Dict) -> bool:
        conditions = cond.get("conditions", [])
        return any(self.evaluate_condition(c, data) for c in conditions)
    
    def _op_not(self, cond: Dict, data: Dict) -> bool:
        return not self.evaluate_condition(cond.get("condition", {}), data)
    
    def _op_in(self, cond: Dict, data: Dict) -> bool:
        field_value = data.get(cond.get("field"))
        values = cond.get("value", [])
        return field_value in values if isinstance(values, list) else False
    
    def _op_contains(self, cond: Dict, data: Dict) -> bool:
        field_value = data.get(cond.get("field"), "")
        search_value = cond.get("value", "")
        return str(search_value) in str(field_value)
    
    def _op_starts_with(self, cond: Dict, data: Dict) -> bool:
        field_value = str(data.get(cond.get("field"), ""))
        prefix = str(cond.get("value", ""))
        return field_value.startswith(prefix)
    
    def _op_ends_with(self, cond: Dict, data: Dict) -> bool:
        field_value = str(data.get(cond.get("field"), ""))
        suffix = str(cond.get("value", ""))
        return field_value.endswith(suffix)
    
    def _op_is_empty(self, cond: Dict, data: Dict) -> bool:
        field_value = data.get(cond.get("field"))
        return field_value is None or field_value == "" or (isinstance(field_value, list) and len(field_value) == 0)
    
    def _op_is_not_empty(self, cond: Dict, data: Dict) -> bool:
        return not self._op_is_empty(cond, data)
    
    def _action_show(self, args: List, data: Dict, context: Dict) -> Dict:
        return {"field": args[0] if args else None, "visible": True}
    
    def _action_hide(self, args: List, data: Dict, context: Dict) -> Dict:
        return {"field": args[0] if args else None, "visible": False}
    
    def _action_enable(self, args: List, data: Dict, context: Dict) -> Dict:
        return {"field": args[0] if args else None, "disabled": False}
    
    def _action_disable(self, args: List, data: Dict, context: Dict) -> Dict:
        return {"field": args[0] if args else None, "disabled": True}
    
    def _action_set_required(self, args: List, data: Dict, context: Dict) -> Dict:
        return {"field": args[0] if args else None, "required": True}
    
    def _action_set_optional(self, args: List, data: Dict, context: Dict) -> Dict:
        return {"field": args[0] if args else None, "required": False}
    
    def _action_set_value(self, args: List, data: Dict, context: Dict) -> Dict:
        if len(args) >= 2:
            return {"field": args[0], "value": args[1]}
        return {"field": args[0] if args else None}
    
    def _action_calculate(self, args: List, data: Dict, context: Dict) -> Dict:
        if len(args) >= 2:
            target_field = args[0]
            formula = args[1]
            try:
                value = self._evaluate_formula(formula, data)
                return {"field": target_field, "value": value, "calculated": True}
            except:
                return {"field": target_field, "error": "公式计算失败"}
        return {"field": args[0] if args else None}
    
    def _action_validate(self, args: List, data: Dict, context: Dict) -> Dict:
        if len(args) >= 2:
            field = args[0]
            error_message = args[1]
            value = data.get(field)
            
            if len(args) >= 3:
                condition = args[2]
                if isinstance(condition, bool):
                    valid = not condition
                else:
                    valid = bool(value)
            else:
                valid = value is not None and value != ""
            
            return {
                "valid": valid,
                "error": {
                    "field": field,
                    "message": error_message
                }
            }
        return {"valid": True}
    
    def _action_send_notification(self, args: List, data: Dict, context: Dict) -> Dict:
        if len(args) >= 3:
            return {
                "user_id": args[0],
                "title": args[1],
                "content": args[2],
                "type": args[3] if len(args) > 3 else "info"
            }
        return {"title": args[0] if args else None}
    
    def _action_webhook(self, args: List, data: Dict, context: Dict) -> Dict:
        if len(args) >= 2:
            return {
                "url": args[0],
                "method": args[1] if len(args) > 1 else "POST",
                "data": data,
                "context": context
            }
        return {"url": args[0] if args else None}
    
    def _evaluate_formula(self, formula: str, data: Dict) -> Any:
        safe_globals = {
            "abs": abs,
            "round": round,
            "min": min,
            "max": max,
            "sum": sum,
            "len": len,
        }
        safe_locals = dict(data)
        return eval(formula, {"__builtins__": {}}, {**safe_globals, **safe_locals})


dsl_engine = DSLEngine()
