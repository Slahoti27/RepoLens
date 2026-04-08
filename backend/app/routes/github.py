from fastapi import APIRouter
from app.services.github_service import get_user, get_user_repos

router = APIRouter()

@router.get("/user/{username}")
def fetch_user(username: str):
    return get_user(username)


@router.get("/repos/{username}")
def fetch_repos(username: str):
    return get_user_repos(username)