from fastapi import FastAPI
from app.routes.github import router as github_router

app = FastAPI()

app.include_router(github_router, prefix="/github")

@app.get("/")
def root():
    return {"message": "GitHub Analytics API running"}