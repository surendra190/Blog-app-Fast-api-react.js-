from pydantic import BaseModel

class BlogCreate(BaseModel):
    title: str
    content: str

class BlogOut(BlogCreate):
    id: int
    owner_id: int
    class Config:
        orm_mode = True