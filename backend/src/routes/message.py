from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional

from ..config.database import get_db
from ..utils import success_response, error_response, get_current_active_user
from ..models import User, Message

router = APIRouter(prefix="/message", tags=["消息"])


@router.get("/categories")
async def get_message_categories(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    categories = [
        {"key": "system", "name": "系统通知", "icon": "bell"},
        {"key": "fresh", "name": "新鲜事", "icon": "fire"},
        {"key": "announcement", "name": "公告", "icon": "notification"},
        {"key": "activity", "name": "活动中心", "icon": "gift"},
        {"key": "interaction", "name": "互动消息", "icon": "chat"}
    ]
    
    result = await db.execute(
        select(Message.category, Message.id).where(
            Message.user_id == current_user.id,
            Message.is_read == False
        )
    )
    unread_messages = result.all()
    
    unread_count = {}
    for category, _ in unread_messages:
        unread_count[category] = unread_count.get(category, 0) + 1
    
    for cat in categories:
        cat["unread_count"] = unread_count.get(cat["key"], 0)
    
    return success_response(categories)


@router.get("/list")
async def get_messages(
    category: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        query = select(Message).where(Message.user_id == current_user.id)
        
        if category:
            query = query.where(Message.category == category)
        
        query = query.order_by(Message.created_at.desc())
        
        total_result = await db.execute(select(Message.id).where(Message.user_id == current_user.id))
        total = len(total_result.all())
        
        result = await db.execute(
            query.offset((page - 1) * page_size).limit(page_size)
        )
        messages = result.scalars().all()
        
        return success_response({
            "list": [{
                "id": msg.id,
                "category": msg.category,
                "title": msg.title,
                "content": msg.content,
                "is_read": msg.is_read,
                "created_at": msg.created_at.isoformat()
            } for msg in messages],
            "total": total,
            "page": page,
            "page_size": page_size
        })
    
    except Exception as e:
        return error_response(f"获取消息列表失败: {str(e)}")


@router.post("/{message_id}/read")
async def mark_message_read(
    message_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(Message).where(
                Message.id == message_id,
                Message.user_id == current_user.id
            )
        )
        message = result.scalar_one_or_none()
        
        if not message:
            return error_response("消息不存在")
        
        message.is_read = True
        message.read_at = datetime.utcnow()
        await db.commit()
        
        return success_response(None, "标记已读成功")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"标记已读失败: {str(e)}")


@router.post("/read-all")
async def mark_all_messages_read(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        query = select(Message).where(
            Message.user_id == current_user.id,
            Message.is_read == False
        )
        
        if category:
            query = query.where(Message.category == category)
        
        result = await db.execute(query)
        messages = result.scalars().all()
        
        for msg in messages:
            msg.is_read = True
            msg.read_at = datetime.utcnow()
        
        await db.commit()
        
        return success_response({"count": len(messages)}, "全部标记已读成功")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"标记已读失败: {str(e)}")


@router.delete("/{message_id}")
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(Message).where(
                Message.id == message_id,
                Message.user_id == current_user.id
            )
        )
        message = result.scalar_one_or_none()
        
        if not message:
            return error_response("消息不存在")
        
        await db.delete(message)
        await db.commit()
        
        return success_response(None, "删除成功")
    
    except Exception as e:
        await db.rollback()
        return error_response(f"删除失败: {str(e)}")
