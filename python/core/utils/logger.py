import functools
import logging

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
