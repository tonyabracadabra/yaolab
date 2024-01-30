FROM python:3.11.6-slim-bullseye as base

# Configure Poetry
ENV POETRY_VERSION=1.3.2
ENV POETRY_HOME=/opt/poetry
ENV POETRY_VENV=/opt/poetry-venv
ENV POETRY_CACHE_DIR=/opt/.cache

# Update and install dependencies
RUN apt-get update && apt-get install -y default-libmysqlclient-dev gcc

# Install poetry separated from system interpreter
RUN python3 -m venv $POETRY_VENV \
    && $POETRY_VENV/bin/pip install -U pip setuptools \
    && $POETRY_VENV/bin/pip install poetry==${POETRY_VERSION}

# Add `poetry` to PATH
ENV PATH="${PATH}:${POETRY_VENV}/bin"

WORKDIR /code

# Install dependencies
COPY poetry.lock pyproject.toml ./
RUN poetry install --no-root --no-dev

# Run your app
COPY . /code

CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
