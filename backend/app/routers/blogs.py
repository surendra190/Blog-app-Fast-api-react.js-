from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.blog import Blog
from app.schemas.blog import BlogCreate, BlogOut
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/blogs", tags=["Blogs"])

@router.post("/", response_model=BlogOut)
def create_blog(
    blog: BlogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # set the real owner_id from the authenticated user
    new_blog = Blog(**blog.dict(), owner_id=current_user.id)
    db.add(new_blog)
    db.commit()
    db.refresh(new_blog)
    return new_blog

@router.get("/", response_model=list[BlogOut])
def get_blogs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # only accessible if authenticated (current_user injected)
    # return blogs ordered by id (ascending)
    return db.query(Blog).order_by(Blog.id).all()


@router.get("/{id}", response_model=BlogOut)
def get_blog(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    blog = db.query(Blog).filter(Blog.id == id).first()
    if not blog:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog not found")
    return blog


@router.put("/{id}", response_model=BlogOut)
def update_blog(
    id: int,
    updated: BlogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    blog = db.query(Blog).filter(Blog.id == id).first()
    if not blog:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog not found")
    if blog.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this blog")

    blog.title = updated.title
    blog.content = updated.content
    db.commit()
    db.refresh(blog)
    return blog


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_blog(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    blog = db.query(Blog).filter(Blog.id == id).first()
    if not blog:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog not found")
    if blog.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this blog")

    db.delete(blog)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)