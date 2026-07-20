# Orizon Todo Challenge

Full-stack task management application built with Django REST Framework,
React, PostgreSQL, Docker Compose, pytest, Selenium, and GitHub Actions.

## Features

- User registration and JWT login
- Session restore through refresh tokens
- Category CRUD
- Task CRUD
- Task completion toggle
- Task sharing by user email
- Task filtering, search, ordering, and pagination
- OpenAPI schema, Swagger UI, and ReDoc
- Backend unit tests and Selenium end-to-end tests

## Stack

- Backend: Django REST Framework
- Frontend: React, Vite, TypeScript
- Database: PostgreSQL
- Auth: `djangorestframework-simplejwt`
- API docs: `drf-spectacular`
- Backend tests: pytest and pytest-django
- E2E tests: Selenium
- CI: GitHub Actions

## Prerequisites

- Docker and Docker Compose
- Python 3.12
- `uv`
- Node.js 22
- npm
- Google Chrome for local Selenium tests

## Project Structure

```text
backend/
  apps/
    accounts/
    core/
    tasks/
  config/
  tests/
frontend/
  src/
e2e/
.github/workflows/
```

## First Run With Docker

The fastest way to run the full application is Docker Compose:

```bash
docker compose up --build
```

This starts:

- PostgreSQL on `localhost:5432`
- Django API on `localhost:8000`
- Vite frontend on `localhost:5173`

Then open:

```text
http://localhost:5173
```

The backend applies migrations automatically in the development override before starting the Django development server.

## Environment

Copy the example environment if you want local overrides:

```bash
cp .env.example .env
```

Docker Compose also works without `.env` because defaults are defined in
`docker-compose.yml`.

## Docker Development

Start the database, backend, and frontend:

```bash
docker compose up --build
```

URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Health check: `http://localhost:8000/api/health/`

Stop services:

```bash
docker compose down
```

Remove local Compose volumes if you intentionally want a fresh database:

```bash
docker compose down -v
```

## Local Backend

From `backend/`:

```bash
uv sync
uv run python manage.py migrate
uv run python manage.py runserver
```

The backend expects PostgreSQL. The easiest local database path is running the
Compose `db` service.

Useful commands:

```bash
uv run python manage.py check
uv run python manage.py showmigrations
uv run python manage.py createsuperuser
```

## Local Frontend

From `frontend/`:

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## API Documentation

When the backend is running:

- OpenAPI schema: `http://localhost:8000/api/schema/`
- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`

Main endpoints:

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/token/refresh/`
- `GET /api/auth/me/`
- `/api/categories/`
- `/api/tasks/`
- `PATCH /api/tasks/{id}/toggle/`
- `POST /api/tasks/{id}/share/`

Task list query parameters:

- `status`
- `priority`
- `category`
- `search`
- `ordering`
- `page`
- `page_size`

## Tests

Backend tests:

```bash
cd backend
uv run pytest -q
```

E2E tests require the backend and frontend to be running:

```bash
cd backend
uv run pytest ../e2e -q
```

Frontend build check:

```bash
cd frontend
npm run build
```

Docker validation:

```bash
docker compose config --quiet
docker compose build
```

## CI

GitHub Actions runs:

- Backend Django checks and pytest
- Frontend production build
- Docker Compose config/build validation
- Selenium e2e tests

The CI workflow is defined in:

```text
.github/workflows/ci.yml
```

## Design Decisions

- A custom user model is used from the first migration so auth can evolve safely.
- Email is the login field.
- Access tokens are stored in memory; refresh tokens are stored in local storage.
- API permissions restrict users to their own categories and owned/shared tasks.
- Shared users can view and edit shared tasks, but only owners can delete tasks.
- PostgreSQL is used for development and CI to avoid SQLite-only behavior.
- E2E tests run against real browser flows through Selenium.
