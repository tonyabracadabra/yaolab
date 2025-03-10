import io
import os
from tempfile import NamedTemporaryFile

import aiohttp
import pandas as pd
import requests
from async_lru import alru_cache
from dotenv import load_dotenv
from matchms.importing import load_from_mgf
from matchms.Spectrum import Spectrum

from convex import ConvexClient

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../.env.local"))


ENCODING: str = "utf-8"
CONVEX_URL = os.environ["CONVEX_URL"]
# all magic strings
CONTENT_TYPE = "Content-Type"
MIME_TYPE_CSV = "text/csv"
MIME_TYPE_PARQUET = "application/octet-stream"


def get_convex(convex_token: str) -> ConvexClient:
    convex = ConvexClient(CONVEX_URL)
    convex.set_auth(convex_token)
    return convex


def upload_csv(df: pd.DataFrame, file_name: str, convex: ConvexClient) -> str:
    resp = convex.action(
        "actions:generateUploadUrl",
        {
            "mimeType": MIME_TYPE_CSV,
            "fileName": f"{file_name}.csv",
        },
    )
    signedUrl, storage_id = resp["signedUrl"], resp["storageId"]
    result = requests.put(
        signedUrl,
        headers={CONTENT_TYPE: MIME_TYPE_CSV},
        data=df.to_csv(index=False),
    )

    if result.status_code != 200:
        raise Exception(f"Failed to upload file: {result.text}")
    return storage_id


def upload_parquet(df: pd.DataFrame, file_name: str, convex: ConvexClient) -> str:
    resp = convex.action(
        "actions:generateUploadUrl",
        {
            "mimeType": MIME_TYPE_PARQUET,
            "fileName": f"{file_name}.parquet",
        },
    )
    signed_url, storage_id = resp["signedUrl"], resp["storageId"]
    # Use a BytesIO buffer as an in-memory binary stream for the DataFrame
    buffer = io.BytesIO()
    df.to_parquet(buffer, index=True)
    buffer.seek(0)  # Reset buffer's pointer to the beginning

    result = requests.put(
        signed_url,
        headers={CONTENT_TYPE: MIME_TYPE_PARQUET},
        data=buffer.read(),  # Read the binary content of the buffer
    )

    if result.status_code != 200:
        raise Exception(f"Failed to upload file: {result.text}")
    return storage_id


async def _generate_download_url(storage_id: str, convex: ConvexClient) -> str:
    response = convex.action(
        "actions:generateDownloadUrl",
        {"storageId": storage_id},
    )
    url = response["signedUrl"]

    return url


@alru_cache(maxsize=128, typed=False)
async def _download_from_url(url: str) -> bytes:
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            if resp.status == 200:
                return await resp.read()
            else:
                raise Exception(f"Failed to download file, status code: {resp.status}")


async def load_binary(storage_id: str, convex: ConvexClient) -> bytes:
    url = await _generate_download_url(storage_id, convex)
    return await _download_from_url(url)


async def load_mgf(
    storage_id: str,
    convex: ConvexClient,
) -> list[Spectrum]:
    blob = await load_binary(storage_id, convex)
    try:
        content = blob.decode(ENCODING)
        with NamedTemporaryFile(
            "w+", suffix=".mgf", delete=False
        ) as temp_file:  # Open for reading and writing
            temp_file.write(content)
            temp_file.flush()  # Ensure all data is written
            temp_file.seek(0)  # Go back to the beginning of the file before reading
            return list(load_from_mgf(temp_file.name))
    except UnicodeDecodeError:
        raise Exception("Failed to decode the blob with encoding {}".format(ENCODING))


async def load_parquet(storage_id: str, convex: ConvexClient) -> pd.DataFrame:
    blob = await load_binary(storage_id, convex)
    buffer = io.BytesIO(blob)
    return pd.read_parquet(buffer)
