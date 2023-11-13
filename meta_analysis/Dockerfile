# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Install Poetry
RUN pip install poetry

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the pyproject.toml and optionally poetry.lock file
COPY pyproject.toml poetry.lock* /usr/src/app/

# Install dependencies
RUN poetry config virtualenvs.create false && \
    poetry install --no-dev

# Copy the rest of your application's code
COPY . /usr/src/app

# Make port available to the world outside this container
EXPOSE 3000

# Define environment variable
ENV DAGSTER_HOME=/usr/src/app

# Run dagit when the container launches
CMD ["dagit", "-h", "0.0.0.0", "-p", "3000"]
