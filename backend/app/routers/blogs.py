from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.blog import Blog
from app.schemas.blog import BlogCreate, BlogOut
from app.core.security import get_current_user
from app.core.cache import get_cache, set_cache, delete_cache, delete_pattern
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
    # invalidate list cache and set individual blog cache
    try:
        delete_cache(f"blogs:{new_blog.id}")
        delete_cache("blogs:all")
        # prime cache for this blog
        set_cache(f"blogs:{new_blog.id}", {"id": new_blog.id, "title": new_blog.title, "content": new_blog.content, "owner_id": new_blog.owner_id}, ex=300)
    except Exception:
        pass
    return new_blog

@router.get("/", response_model=list[BlogOut])
def get_blogs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # only accessible if authenticated (current_user injected)
    # return blogs ordered by id (ascending)
    cached = get_cache("blogs:all")
    if cached is not None:
        return cached

    blogs = db.query(Blog).order_by(Blog.id).all()
    data = []
    for b in blogs:
        data.append({"id": b.id, "title": b.title, "content": b.content, "owner_id": b.owner_id})
    # cache for 60 seconds
    set_cache("blogs:all", data, ex=60)
    return data


@router.get("/{id}", response_model=BlogOut)
def get_blog(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cached = get_cache(f"blogs:{id}")
    if cached is not None:
        return cached

    blog = db.query(Blog).filter(Blog.id == id).first()
    if not blog:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog not found")
    data = {"id": blog.id, "title": blog.title, "content": blog.content, "owner_id": blog.owner_id}
    set_cache(f"blogs:{id}", data, ex=300)
    return data


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
    # update caches
    try:
        data = {"id": blog.id, "title": blog.title, "content": blog.content, "owner_id": blog.owner_id}
        set_cache(f"blogs:{id}", data, ex=300)
        delete_cache("blogs:all")
    except Exception:
        pass
    return data


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_blog(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    blog = db.query(Blog).filter(Blog.id == id).first()
    if not blog:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog not found")
    if blog.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this blog")

    db.delete(blog)
    db.commit()
    # invalidate caches
    try:
        delete_cache(f"blogs:{id}")
        delete_cache("blogs:all")
    except Exception:
        pass
    return Response(status_code=status.HTTP_204_NO_CONTENT)