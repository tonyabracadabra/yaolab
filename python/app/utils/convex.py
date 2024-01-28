import os
from functools import lru_cache

import requests
from convex import ConvexClient
from dotenv import load_dotenv
from fastapi import Request

load_dotenv(
    dotenv_path=os.path.join(os.path.dirname(__file__), "../../.env.local")
)


def get_convex(request: Request) -> ConvexClient:
    CONVEX_URL = os.environ["CONVEX_URL"]
    convex = ConvexClient(CONVEX_URL)
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    convex.set_auth(token)
    return convex


@lru_cache(maxsize=128, typed=False)
def download_file(storageId: str):
    response = requests.get(
        f"{os.environ['CONVEX_STORAGE_URL']}/downloadFile?storageId={storageId}"
    )
    if response.status_code != 200:
        raise Exception(f"Failed to get file from storage: {response.text}")

    return response.content
