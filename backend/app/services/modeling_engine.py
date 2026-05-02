from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.database import FormDefinition, FormField, engine
from datetime import datetime
import json
import re


class ModelingEngine:
    """Dynamic-Schema 建模引擎 - 负责生成 JSON Schema 和物理表结构"""
    
    DEFAULT_FIELD_TYPES = {
        "text": {"column_type": "TEXT", "json_type": "string"},
        "number": {"column_type": "REAL", "json_type": "number"},
        "integer": {"column_type": "INTEGER", "json_type": "integer"},
        "select": {"column_type": "TEXT", "json_type": "string"},
        "textarea": {"column_type": "TEXT", "json_type": "string"},
        "date": {"column_type": "DATE", "json_type": "string"},
        "datetime": {"column_type": "DATETIME", "json_type": "string"},
        "radio": {"column_type": "TEXT", "json_type": "string"},
        "checkbox": {"column_type": "TEXT", "json_type": "array"},
        "switch": {"column_type": "INTEGER", "json_type": "boolean"},
        "file": {"column_type": "TEXT", "json_type": "string"},
        "email": {"column_type": "TEXT", "json_type": "string"},
        "phone": {"column_type": "TEXT", "json_type": "string"},
    }
    
    @classmethod
    def generate_table_name(cls, form_code: str) -> str:
        safe_code = re.sub(r'[^a-zA-Z0-9_]', '_', form_code.lower())
        return f"form_data_{safe_code}"
    
    @classmethod
    def generate_json_schema(
        cls,
        form_name: str,
        fields: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": form_name,
            "type": "object",
            "properties": {},
            "required": []
        }
        
        for field in fields:
            field_name = field.get("field_name", "")
            field_type = field.get("field_type", "text")
            field_config = cls.DEFAULT_FIELD_TYPES.get(field_type, {"json_type": "string"})
            
            prop = {"type": field_config["json_type"]}
            if field.get("is_required", False):
                schema["required"].append(field_name)
            
            if field.get("options"):
                prop["enum"] = [opt.get("value") for opt in field.get("options", [])]
            
            if field.get("validation_rules"):
                rules = field.get("validation_rules", {})
                if "minLength" in rules:
                    prop["minLength"] = rules["minLength"]
                if "maxLength" in rules:
                    prop["maxLength"] = rules["maxLength"]
                if "pattern" in rules:
                    prop["pattern"] = rules["pattern"]
                if "minimum" in rules:
                    prop["minimum"] = rules["minimum"]
                if "maximum" in rules:
                    prop["maximum"] = rules["maximum"]
            
            if field.get("default_value") is not None:
                prop["default"] = field.get("default_value")
            
            schema["properties"][field_name] = prop
        
        return schema
    
    @classmethod
    def create_physical_table(
        cls,
        table_name: str,
        fields: List[Dict[str, Any]]
    ) -> bool:
        if not table_name:
            return False
        
        columns = [
            "id INTEGER PRIMARY KEY AUTOINCREMENT",
            "_submission_id INTEGER",
            "_form_id INTEGER",
            "_user_id INTEGER",
            "_status VARCHAR(50) DEFAULT 'draft'",
            "_version INTEGER DEFAULT 1",
            "_created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
            "_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP",
        ]
        
        for field in fields:
            field_name = field.get("field_name", "")
            field_type = field.get("field_type", "text")
            field_config = cls.DEFAULT_FIELD_TYPES.get(field_type, {"column_type": "TEXT"})
            column_type = field_config["column_type"]
            
            if field.get("is_unique"):
                columns.append(f"`{field_name}` {column_type} UNIQUE")
            else:
                columns.append(f"`{field_name}` {column_type}")
        
        sql = f"CREATE TABLE IF NOT EXISTS `{table_name}` ({', '.join(columns)})"
        
        try:
            with engine.connect() as conn:
                conn.execute(__import__('sqlalchemy').text(sql))
                conn.commit()
            return True
        except Exception as e:
            print(f"创建表失败: {e}")
            return False
    
    @classmethod
    def alter_table(
        cls,
        table_name: str,
        old_fields: List[Dict[str, Any]],
        new_fields: List[Dict[str, Any]]
    ) -> bool:
        old_field_names = {f.get("field_name") for f in old_fields}
        new_field_names = {f.get("field_name") for f in new_fields}
        
        added_fields = [f for f in new_fields if f.get("field_name") not in old_field_names]
        
        try:
            with engine.connect() as conn:
                for field in added_fields:
                    field_name = field.get("field_name", "")
                    field_type = field.get("field_type", "text")
                    field_config = cls.DEFAULT_FIELD_TYPES.get(field_type, {"column_type": "TEXT"})
                    column_type = field_config["column_type"]
                    
                    sql = f"ALTER TABLE `{table_name}` ADD COLUMN `{field_name}` {column_type}"
                    conn.execute(__import__('sqlalchemy').text(sql))
                conn.commit()
            return True
        except Exception as e:
            print(f"修改表结构失败: {e}")
            return False
    
    @classmethod
    def insert_data(
        cls,
        table_name: str,
        form_id: int,
        user_id: int,
        data: Dict[str, Any],
        submission_id: int = None
    ) -> int:
        if not table_name:
            return 0
        
        field_names = list(data.keys())
        placeholders = [f":{name}" for name in field_names]
        
        extra_fields = ["_form_id", "_user_id", "_status", "_version"]
        extra_values = [form_id, user_id, "submitted", 1]
        
        if submission_id:
            extra_fields.append("_submission_id")
            extra_values.append(submission_id)
        
        all_fields = field_names + extra_fields
        all_placeholders = placeholders + [f":extra_{i}" for i in range(len(extra_fields))]
        
        sql = f"""
        INSERT INTO `{table_name}` 
        ({', '.join([f'`{f}`' for f in all_fields])})
        VALUES ({', '.join(all_placeholders)})
        """
        
        params = dict(data)
        for i, val in enumerate(extra_values):
            params[f"extra_{i}"] = val
        
        try:
            with engine.connect() as conn:
                result = conn.execute(__import__('sqlalchemy').text(sql), params)
                conn.commit()
                return result.lastrowid
        except Exception as e:
            print(f"插入数据失败: {e}")
            return 0
    
    @classmethod
    def query_data(
        cls,
        table_name: str,
        filters: Dict[str, Any] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        if not table_name:
            return []
        
        sql = f"SELECT * FROM `{table_name}`"
        params = {}
        
        if filters:
            conditions = []
            for i, (key, value) in enumerate(filters.items()):
                conditions.append(f"`{key}` = :filter_{i}")
                params[f"filter_{i}"] = value
            if conditions:
                sql += " WHERE " + " AND ".join(conditions)
        
        sql += f" ORDER BY _created_at DESC LIMIT {limit} OFFSET {offset}"
        
        try:
            with engine.connect() as conn:
                result = conn.execute(__import__('sqlalchemy').text(sql), params)
                rows = result.fetchall()
                columns = result.keys()
                return [dict(zip(columns, row)) for row in rows]
        except Exception as e:
            print(f"查询数据失败: {e}")
            return []
