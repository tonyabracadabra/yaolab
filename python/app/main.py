import logging
import os

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI

from app.routes.analysis import router as analysis

# Load .env file from the root folder
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"))
# define the log format
logger = logging.getLogger(__name__)

router = APIRouter()
router.include_router(analysis, prefix="/analysis")

app = FastAPI()
app.include_router(router)
