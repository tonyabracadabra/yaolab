import io
import os
from tempfile import NamedTemporaryFile
from typing import Generator

import pandas as pd
import requests
from async_lru import alru_cache
from dotenv import load_dotenv
from fastapi import Request
from matchms.importing import load_from_mgf
from matchms.Spectrum import Spectrum

from convex import ConvexClient

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../.env.local"))


ENCODING: str = "utf-8"
CONVEX_STORAGE_URL = os.environ["CONVEX_STORAGE_URL"]
CONVEX_URL = os.environ["CONVEX_URL"]


def get_convex(request: Request) -> ConvexClient:
    convex = ConvexClient(CONVEX_URL)
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    convex.set_auth(token)
    return convex


def download_file(storageId: str) -> bytes:
    response = requests.get(f"{CONVEX_STORAGE_URL}/downloadFile?storageId={storageId}")
    if response.status_code != 200:
        raise Exception(f"Failed to get file from storage: {response.text}")

    return response.content


def upload_file(
    df: pd.DataFrame, convex: ConvexClient, file_type: str = "text/csv"
) -> str:
    postUrl = convex.mutation("utils:generateUploadUrl")
    result = requests.post(
        postUrl,
        headers={"Content-Type": file_type},
        data=df.to_csv(index=False),
    )

    if result.status_code != 200:
        raise Exception(f"Failed to upload file: {result.text}")
    return result.json()["storageId"]


@alru_cache(maxsize=128, typed=False)
async def load_mgf(
    storage_id: str, encoding: str = ENCODING
) -> Generator[Spectrum, None, None]:
    blob = download_file(storage_id)
    try:
        content = blob.decode(encoding)
        with NamedTemporaryFile(
            "w+", suffix=".mgf", delete=False
        ) as temp_file:  # Open for reading and writing
            temp_file.write(content)
            temp_file.flush()  # Ensure all data is written
            temp_file.seek(0)  # Go back to the beginning of the file before reading
            return load_from_mgf(temp_file.name)

    except UnicodeDecodeError:
        raise Exception("Failed to decode the blob with encoding {}".format(encoding))


@alru_cache(maxsize=128, typed=False)
async def load_csv(storage_id: str, encoding: str = ENCODING) -> pd.DataFrame:
    blob = download_file(storage_id)
    try:
        content = blob.decode(encoding)
        with io.StringIO(content) as string_io:
            return pd.read_csv(string_io)
    except UnicodeDecodeError:
        raise Exception("Failed to decode the blob with encoding {}".format(encoding))
