import logging
import os

import sentry_sdk
from app.routes.chat import router as chat
from app.routes.meta import router as meta
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI

# Load .env file from the root folder
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"))
# define the log format
logger = logging.getLogger(__name__)

router = APIRouter()
router.include_router(chat, prefix="/chat")
router.include_router(meta, prefix="/meta")

app = FastAPI()
app.include_router(router)
