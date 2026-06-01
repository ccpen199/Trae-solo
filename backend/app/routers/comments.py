from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import schemas, crud, models
from app.auth import get_current_active_user

router = APIRouter(prefix="/comments", tags=["comments"])


@router.get("/news/{news_id}", response_model=List[schemas.CommentResponse])
def read_comments_by_news(
    news_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    comments = crud.get_comments(db, news_id=news_id, skip=skip, limit=limit)
    return comments


@router.post("/", response_model=schemas.CommentResponse)
def create_comment(
    comment: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if current_user.role == models.UserRole.GUEST:
        raise HTTPException(status_code=403, detail="Guests cannot comment")
    return crud.create_comment(db=db, comment=comment, author_id=current_user.id)
