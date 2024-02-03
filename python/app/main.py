import logging
import os

from app.routes.analysis import router as analysis
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI

# Load .env file from the root folder
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"))
# define the log format
logging.basicConfig(level=logging.DEBUG)

logger = logging.getLogger(__name__)

router = APIRouter()
router.include_router(analysis, prefix="/analysis")

app = FastAPI()
app.include_router(router)
