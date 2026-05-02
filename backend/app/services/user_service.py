from datetime import datetime
from typing import Dict, List, Optional
from uuid import uuid4
from sqlalchemy.orm import Session

from app.models import User, Organization, TodoMessage, MessageStatus, RoleType
from app.state_machine import MessageService


class UserService:
    
    def __init__(self, db: Session):
        self.db = db
        self.message_service = MessageService(db)
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()
    
    def create_user(
        self,
        username: str,
        name: str,
        password_hash: str,
        role: str,
        org_id: str,
        email: str = None,
        phone: str = None
    ) -> User:
        existing = self.get_user_by_username(username)
        if existing:
            raise ValueError(f"用户名已存在: {username}")
        
        user = User(
            id=str(uuid4()),
            username=username,
            name=name,
            password_hash=password_hash,
            role=RoleType(role),
            org_id=org_id,
            email=email,
            phone=phone,
            is_active=True,
            created_at=datetime.utcnow()
        )
        self.db.add(user)
        self.db.commit()
        return user
    
    def create_organization(
        self,
        name: str,
        org_type: str,
        credit_code: str = None,
        legal_person: str = None,
        address: str = None,
        contact_person: str = None,
        contact_phone: str = None
    ) -> Organization:
        org = Organization(
            id=str(uuid4()),
            name=name,
            org_type=RoleType(org_type),
            credit_code=credit_code,
            legal_person=legal_person,
            address=address,
            contact_person=contact_person,
            contact_phone=contact_phone,
            is_active=True,
            created_at=datetime.utcnow()
        )
        self.db.add(org)
        self.db.commit()
        return org
    
    def get_organizations_by_type(self, org_type: str) -> List[Organization]:
        return self.db.query(Organization).filter(
            Organization.org_type == org_type,
            Organization.is_active == True
        ).all()
    
    def get_users_by_org(self, org_id: str) -> List[User]:
        return self.db.query(User).filter(
            User.org_id == org_id,
            User.is_active == True
        ).all()
    
    def get_users_by_role(self, role: str) -> List[User]:
        return self.db.query(User).filter(
            User.role == role,
            User.is_active == True
        ).all()
    
    def get_user_messages(
        self,
        user: User,
        status: str = None,
        limit: int = 50
    ) -> List[Dict]:
        messages = self.message_service.get_user_messages(user, status, limit)
        return [self._message_to_dict(msg) for msg in messages]
    
    def get_pending_message_count(self, user: User) -> int:
        return self.message_service.get_pending_count(user)
    
    def mark_message_read(self, message_id: str, user: User) -> Optional[TodoMessage]:
        message = self.db.query(TodoMessage).filter(
            TodoMessage.id == message_id,
            TodoMessage.user_id == user.id
        ).first()
        
        if message:
            return self.message_service.mark_as_read(message)
        return None
    
    def mark_message_processed(self, message_id: str, user: User) -> Optional[TodoMessage]:
        message = self.db.query(TodoMessage).filter(
            TodoMessage.id == message_id,
            TodoMessage.user_id == user.id
        ).first()
        
        if message:
            return self.message_service.mark_as_processed(message)
        return None
    
    def _message_to_dict(self, message: TodoMessage) -> Dict:
        return {
            "id": message.id,
            "title": message.title,
            "content": message.content,
            "message_type": message.message_type,
            "status": message.status.value if message.status else None,
            "action_required": message.action_required,
            "action_url": message.action_url,
            "priority": message.priority,
            "main_order_id": message.main_order_id,
            "created_at": message.created_at.isoformat() if message.created_at else None,
            "read_at": message.read_at.isoformat() if message.read_at else None,
            "processed_at": message.processed_at.isoformat() if message.processed_at else None
        }
    
    def user_to_dict(self, user: User, include_org: bool = True) -> Dict:
        result = {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "role": user.role.value if user.role else None,
            "org_id": user.org_id,
            "email": user.email,
            "phone": user.phone,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
        
        if include_org and user.organization:
            result["organization"] = {
                "id": user.organization.id,
                "name": user.organization.name,
                "org_type": user.organization.org_type.value if user.organization.org_type else None
            }
        
        return result
    
    def org_to_dict(self, org: Organization) -> Dict:
        return {
            "id": org.id,
            "name": org.name,
            "org_type": org.org_type.value if org.org_type else None,
            "credit_code": org.credit_code,
            "legal_person": org.legal_person,
            "address": org.address,
            "contact_person": org.contact_person,
            "contact_phone": org.contact_phone,
            "is_active": org.is_active,
            "created_at": org.created_at.isoformat() if org.created_at else None
        }
