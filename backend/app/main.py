from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.github import router as github_router

app = FastAPI()

# ✅ CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all (dev only)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(github_router, prefix="/github")

@app.get("/")
def root():
    return {"message": "GitHub Analytics API running"}