import requests

BASE_URL = "https://api.github.com"

def get_user(username: str):
    url = f"{BASE_URL}/users/{username}"
    response = requests.get(url)
    return response.json()


def get_user_repos(username: str):
    url = f"{BASE_URL}/users/{username}/repos"
    response = requests.get(url)
    return response.json()