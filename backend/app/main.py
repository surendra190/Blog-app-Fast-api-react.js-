from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, blogs

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Blog App")

# Allow CORS for the frontend during development. Adjust origins for production.
origins = [
	"http://localhost:5174",
	"http://127.0.0.1:5174",
	"http://localhost:8000",
	"http://127.0.0.1:8000",
	"http://localhost:4500",
]

app.add_middleware(
	CORSMiddleware,
	allow_origins=origins,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(blogs.router)