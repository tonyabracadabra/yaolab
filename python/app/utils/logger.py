import logging
from convex import ConvexClient
import functools

# Configure your logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
import logging

# Import your logger here
from logger import logger


def log(message: str):
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            setattr(wrapper, 'log_message', message)
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def with_logging_and_context(convex: ConvexClient, analysis_id: str):
    def decorator(func: callable):
        @functools.wraps(func)
        async def wrapped(*args, **kwargs):
            log_message = getattr(func, 'log_message', f"Starting '{func.__name__}'")
            try:
                logger.info(log_message + f" for analysis {analysis_id}")
                convex.mutation(
                    "analyses:update",
                    {"id": analysis_id, "log": log_message}
                )

                result = await func(*args, **kwargs)
                # similar logging for completion
                return result
            except Exception as e:
                # Handle exception logging
                raise
        return wrapped
    return decorator
