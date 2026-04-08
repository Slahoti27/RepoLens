import requests
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://api.github.com"

HEADERS = {
    "Authorization": f"Bearer {os.getenv('GITHUB_TOKEN')}",
    "Accept": "application/vnd.github+json"
}

def get_user(username: str):
    url = f"{BASE_URL}/users/{username}"
    response = requests.get(url, headers=HEADERS)

    if response.status_code != 200:
        return {"error": "User not found"}

    return response.json()


def get_user_repos(username: str):
    url = f"{BASE_URL}/users/{username}/repos?per_page=100"
    response = requests.get(url, headers=HEADERS)
    return response.json()

def get_repo_commits(owner: str, repo: str):
    url = f"{BASE_URL}/repos/{owner}/{repo}/commits?per_page=100"
    response = requests.get(url, headers=HEADERS)
    return response.json()