FROM python:3.11.6-slim-bullseye as base

# Configure Poetry
ENV POETRY_VERSION=1.3.2 \
    POETRY_HOME=/opt/poetry \
    POETRY_VENV=/opt/poetry-venv \
    POETRY_CACHE_DIR=/opt/.cache \
    PATH="${PATH}:/opt/poetry-venv/bin"

# Install poetry separated from system interpreter
RUN python3 -m venv $POETRY_VENV && \
    $POETRY_VENV/bin/pip install -U pip setuptools && \
    $POETRY_VENV/bin/pip install poetry==$POETRY_VERSION

WORKDIR /code

# Install dependencies
COPY poetry.lock pyproject.toml ./
RUN poetry install --no-root --no-dev

# Run your app
COPY . /code

CMD poetry run uvicorn app.main:app --host 0.0.0.0 --port $PORT
