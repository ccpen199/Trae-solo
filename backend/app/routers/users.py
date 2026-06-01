from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import schemas, crud, models
from app.auth import get_current_active_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me/favorites", response_model=List[schemas.FavoriteResponse])
def read_my_favorites(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    favorites = crud.get_favorites(db, user_id=current_user.id, skip=skip, limit=limit)
    return favorites


@router.post("/me/favorites", response_model=schemas.FavoriteResponse)
def create_favorite(
    favorite: schemas.FavoriteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.create_favorite(db=db, favorite=favorite, user_id=current_user.id)


@router.delete("/me/favorites/{favorite_id}")
def delete_favorite(
    favorite_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    crud.delete_favorite(db, favorite_id=favorite_id, user_id=current_user.id)
    return {"message": "Favorite deleted"}


@router.get("/me/comments", response_model=List[schemas.CommentResponse])
def read_my_comments(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    comments = crud.get_user_comments(db, user_id=current_user.id, skip=skip, limit=limit)
    return comments
