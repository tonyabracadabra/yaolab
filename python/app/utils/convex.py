import io
import os
from functools import lru_cache
from typing import Generator

import pandas as pd
import requests
from dotenv import load_dotenv
from fastapi import Request
from matchms.importing import load_from_mgf
from matchms.Spectrum import Spectrum

from convex import ConvexClient

ENCODING: str = "utf-8"
CONVEX_STORAGE_URL = os.environ["CONVEX_STORAGE_URL"]
CONVEX_URL = os.environ["CONVEX_URL"]

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../.env.local"))


def get_convex(request: Request) -> ConvexClient:
    convex = ConvexClient(CONVEX_URL)
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    convex.set_auth(token)
    return convex


def download_file(storageId: str):
    response = requests.get(f"{CONVEX_STORAGE_URL}/downloadFile?storageId={storageId}")
    if response.status_code != 200:
        raise Exception(f"Failed to get file from storage: {response.text}")

    return response.content


def upload_file(df: pd.DataFrame, convex: ConvexClient) -> str:
    postUrl = convex.mutation("utils:generateUploadUrl")
    result = requests.post(postUrl, data=df.to_csv(index=False))

    if result.status_code != 200:
        raise Exception(f"Failed to upload file: {result.text}")
    return result.json()["storageId"]


@lru_cache(maxsize=128, typed=False)
async def load_mgf(
    storage_id: str, encoding: str = ENCODING
) -> Generator[Spectrum, None, None]:
    blob = download_file(storage_id)

    try:
        decoded_content = blob.decode(ENCODING)
    except UnicodeDecodeError:
        raise Exception("Failed to decode the blob with encoding {}".format(encoding))

    with io.StringIO(decoded_content) as string_io:
        return load_from_mgf(string_io)


@lru_cache(maxsize=128, typed=False)
async def load_csv(storage_id: str, encoding: str = ENCODING) -> pd.DataFrame:
    blob = download_file(storage_id)
    try:
        decoded_content = blob.decode(encoding)
    except UnicodeDecodeError:
        raise Exception("Failed to decode the blob with encoding {}".format(encoding))

    with io.StringIO(decoded_content) as string_io:
        return pd.read_csv(string_io)
