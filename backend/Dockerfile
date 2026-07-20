FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/opt/venv

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY . .

RUN if [ -f pyproject.toml ]; then uv sync; fi

RUN adduser --disabled-password --gecos "" appuser && chown -R appuser:appuser /app /opt/venv

USER appuser

EXPOSE 8000

CMD ["sh", "-c", "if [ -f manage.py ]; then uv run gunicorn config.wsgi:application --bind 0.0.0.0:8000; else echo 'Backend project is not bootstrapped yet.' && sleep infinity; fi"]
