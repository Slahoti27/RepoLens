from fastapi import APIRouter
from app.services.github_service import get_user, get_user_repos, get_repo_commits

router = APIRouter()

@router.get("/user/{username}")
def fetch_user(username: str):
    return get_user(username)


@router.get("/repos/{username}")
def fetch_repos(username: str):
    return get_user_repos(username)

@router.get("/commits/{owner}/{repo}")
def fetch_commits(owner: str, repo: str):
    return get_repo_commits(owner, repo)