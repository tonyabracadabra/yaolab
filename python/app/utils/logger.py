import functools
import logging

from app.models.analysis import AnalysisStatus

from convex import ConvexClient

# Configure your logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def log(message: str):
    def decorator(func):
        setattr(func, "log_message", message)  # Set attribute on func

        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            return await func(*args, **kwargs)

        return wrapper

    return decorator


def with_logging_and_context(convex: ConvexClient, analysis_id: str):
    def decorator(func: callable):
        @functools.wraps(func)
        async def wrapped(*args, **kwargs):
            print(f"token in logging: {convex.auth}")
            log_message = getattr(func, "log_message", f"Starting '{func.__name__}'")
            try:
                logger.info(log_message + f" for analysis {analysis_id}")
                convex.mutation(
                    "analyses:update", {"id": analysis_id, "log": log_message}
                )

                result = await func(*args, **kwargs)
                # similar logging for completion
                return result
            except Exception as e:
                logger.error(
                    f"Error occurred while executing '{func.__name__}' for analysis {analysis_id}"
                )
                convex.mutation(
                    "analyses:update",
                    {"id": analysis_id, "status": AnalysisStatus.FAILED, "log": str(e)},
                )
                # Handle exception logging
                raise e

        return wrapped

    return decorator
