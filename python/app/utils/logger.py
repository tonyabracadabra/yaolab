import logging
from convex import ConvexClient

# Configure your logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
import logging

# Import your logger here
from logger import logger


def with_logging_and_context(convex: ConvexClient, analysis_id: str):
    def decorator(func: callable):
        async def wrapped(*args, **kwargs):
            try:
                logger.info(f"Starting '{func.__name__}' for analysis {analysis_id}")
                convex.mutation(
                    "analyses:update",
                    {"id": analysis_id, "log": f"Starting '{func.__name__}'"},
                )

                result = await func(*args, **kwargs)

                logger.info(f"Finished '{func.__name__}' for analysis {analysis_id}")
                convex.mutation(
                    "analyses:update",
                    {"id": analysis_id, "log": f"Finished '{func.__name__}'"},
                )
                return result
            except Exception as e:
                logger.error(
                    f"Error in '{func.__name__}' for analysis {analysis_id}: {e}"
                )
                convex.mutation(
                    "analyses:update",
                    {"id": analysis_id, "log": f"Error in '{func.__name__}': {e}"},
                )
                raise

        return wrapped

    return decorator
